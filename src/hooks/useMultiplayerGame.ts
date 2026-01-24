import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { Board, Player, Cell } from './useConnectFour';

const ROWS = 6;
const COLS = 7;
const WIN_LENGTH = 4;

interface WinningCells {
  cells: [number, number][];
}

interface GameRoom {
  id: string;
  room_code: string;
  host_id: string;
  guest_id: string | null;
  board: Board;
  current_player: Player;
  winner: Player | null;
  is_draw: boolean;
  winning_cells: WinningCells | null;
  last_move: { row: number; col: number } | null;
  scores: { player1: number; player2: number };
  status: 'waiting' | 'playing' | 'finished';
}

interface MultiplayerState {
  room: GameRoom | null;
  playerId: string;
  playerNumber: Player | null;
  isConnected: boolean;
  error: string | null;
}

const generateRoomCode = (): string => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
};

const generatePlayerId = (): string => {
  const stored = localStorage.getItem('connect4_player_id');
  if (stored) return stored;
  const id = crypto.randomUUID();
  localStorage.setItem('connect4_player_id', id);
  return id;
};

const createEmptyBoard = (): Board => {
  return Array(ROWS).fill(null).map(() => Array(COLS).fill(null));
};

const checkDirection = (
  board: Board,
  row: number,
  col: number,
  dRow: number,
  dCol: number,
  player: Player
): [number, number][] | null => {
  const cells: [number, number][] = [];
  
  for (let i = 0; i < WIN_LENGTH; i++) {
    const r = row + i * dRow;
    const c = col + i * dCol;
    
    if (r < 0 || r >= ROWS || c < 0 || c >= COLS) return null;
    if (board[r][c] !== player) return null;
    
    cells.push([r, c]);
  }
  
  return cells;
};

const checkWinner = (board: Board, player: Player): WinningCells | null => {
  const directions: [number, number][] = [
    [0, 1],
    [1, 0],
    [1, 1],
    [-1, 1],
  ];

  for (let row = 0; row < ROWS; row++) {
    for (let col = 0; col < COLS; col++) {
      for (const [dRow, dCol] of directions) {
        const cells = checkDirection(board, row, col, dRow, dCol, player);
        if (cells) {
          return { cells };
        }
      }
    }
  }

  return null;
};

const checkDraw = (board: Board): boolean => {
  return board[0].every(cell => cell !== null);
};

export const useMultiplayerGame = () => {
  const [state, setState] = useState<MultiplayerState>({
    room: null,
    playerId: generatePlayerId(),
    playerNumber: null,
    isConnected: false,
    error: null,
  });

  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  const subscribeToRoom = useCallback((roomId: string) => {
    if (channelRef.current) {
      channelRef.current.unsubscribe();
    }

    const channel = supabase
      .channel(`room:${roomId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'game_rooms',
          filter: `id=eq.${roomId}`,
        },
        (payload) => {
          if (payload.new && typeof payload.new === 'object') {
            const newRoom = payload.new as Record<string, unknown>;
            setState(prev => ({
              ...prev,
              room: {
                id: newRoom.id as string,
                room_code: newRoom.room_code as string,
                host_id: newRoom.host_id as string,
                guest_id: newRoom.guest_id as string | null,
                board: newRoom.board as Board,
                current_player: newRoom.current_player as Player,
                winner: newRoom.winner as Player | null,
                is_draw: newRoom.is_draw as boolean,
                winning_cells: newRoom.winning_cells as WinningCells | null,
                last_move: newRoom.last_move as { row: number; col: number } | null,
                scores: newRoom.scores as { player1: number; player2: number },
                status: newRoom.status as 'waiting' | 'playing' | 'finished',
              },
            }));
          }
        }
      )
      .subscribe();

    channelRef.current = channel;
  }, []);

  const createRoom = useCallback(async () => {
    setState(prev => ({ ...prev, error: null }));

    const roomCode = generateRoomCode();

    const { data, error } = await supabase
      .from('game_rooms')
      .insert({
        room_code: roomCode,
        host_id: state.playerId,
        board: createEmptyBoard(),
        current_player: 1,
        scores: { player1: 0, player2: 0 },
        status: 'waiting',
      })
      .select()
      .single();

    if (error) {
      setState(prev => ({ ...prev, error: 'Failed to create room' }));
      return null;
    }

    const room: GameRoom = {
      id: data.id,
      room_code: data.room_code,
      host_id: data.host_id,
      guest_id: data.guest_id,
      board: data.board as Board,
      current_player: data.current_player as Player,
      winner: data.winner as Player | null,
      is_draw: data.is_draw,
      winning_cells: data.winning_cells as unknown as WinningCells | null,
      last_move: data.last_move as unknown as { row: number; col: number } | null,
      scores: data.scores as { player1: number; player2: number },
      status: data.status as 'waiting' | 'playing' | 'finished',
    };

    setState(prev => ({
      ...prev,
      room,
      playerNumber: 1,
      isConnected: true,
    }));

    subscribeToRoom(data.id);
    return roomCode;
  }, [state.playerId, subscribeToRoom]);

  const joinRoom = useCallback(async (code: string) => {
    setState(prev => ({ ...prev, error: null }));

    const roomCode = code.toUpperCase().trim();

    const { data, error } = await supabase
      .from('game_rooms')
      .select()
      .eq('room_code', roomCode)
      .maybeSingle();

    if (error || !data) {
      setState(prev => ({ ...prev, error: 'Room not found' }));
      return false;
    }

    if (data.guest_id && data.guest_id !== state.playerId) {
      setState(prev => ({ ...prev, error: 'Room is full' }));
      return false;
    }

    if (data.host_id === state.playerId) {
      // Rejoining as host
      const room: GameRoom = {
        id: data.id,
        room_code: data.room_code,
        host_id: data.host_id,
        guest_id: data.guest_id,
        board: data.board as Board,
        current_player: data.current_player as Player,
        winner: data.winner as Player | null,
        is_draw: data.is_draw,
        winning_cells: data.winning_cells as unknown as WinningCells | null,
        last_move: data.last_move as unknown as { row: number; col: number } | null,
        scores: data.scores as { player1: number; player2: number },
        status: data.status as 'waiting' | 'playing' | 'finished',
      };

      setState(prev => ({
        ...prev,
        room,
        playerNumber: 1,
        isConnected: true,
      }));

      subscribeToRoom(data.id);
      return true;
    }

    // Join as guest
    const { error: updateError } = await supabase
      .from('game_rooms')
      .update({
        guest_id: state.playerId,
        status: 'playing',
      })
      .eq('id', data.id);

    if (updateError) {
      setState(prev => ({ ...prev, error: 'Failed to join room' }));
      return false;
    }

    const room: GameRoom = {
      id: data.id,
      room_code: data.room_code,
      host_id: data.host_id,
      guest_id: state.playerId,
      board: data.board as Board,
      current_player: data.current_player as Player,
      winner: data.winner as Player | null,
      is_draw: data.is_draw,
      winning_cells: data.winning_cells as unknown as WinningCells | null,
      last_move: data.last_move as unknown as { row: number; col: number } | null,
      scores: data.scores as { player1: number; player2: number },
      status: 'playing',
    };

    setState(prev => ({
      ...prev,
      room,
      playerNumber: 2,
      isConnected: true,
    }));

    subscribeToRoom(data.id);
    return true;
  }, [state.playerId, subscribeToRoom]);

  const dropDisc = useCallback(async (col: number) => {
    if (!state.room || !state.playerNumber) return;
    if (state.room.winner || state.room.is_draw) return;
    if (state.room.current_player !== state.playerNumber) return;
    if (state.room.status !== 'playing') return;

    const board = state.room.board.map(row => [...row]) as Board;

    // Find lowest empty row
    let targetRow = -1;
    for (let row = ROWS - 1; row >= 0; row--) {
      if (board[row][col] === null) {
        targetRow = row;
        break;
      }
    }

    if (targetRow === -1) return;

    board[targetRow][col] = state.room.current_player;

    const winningCells = checkWinner(board, state.room.current_player);
    const winner = winningCells ? state.room.current_player : null;
    const isDraw = !winner && checkDraw(board);

    const newScores = { ...state.room.scores };
    if (winner === 1) newScores.player1++;
    if (winner === 2) newScores.player2++;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await supabase
      .from('game_rooms')
      .update({
        board: board as any,
        current_player: winner || isDraw ? state.room.current_player : (state.room.current_player === 1 ? 2 : 1),
        winner,
        is_draw: isDraw,
        winning_cells: winningCells as any,
        last_move: { row: targetRow, col } as any,
        scores: newScores as any,
        status: winner || isDraw ? 'finished' : 'playing',
      })
      .eq('id', state.room.id);
  }, [state.room, state.playerNumber]);

  const resetGame = useCallback(async () => {
    if (!state.room) return;

    await supabase
      .from('game_rooms')
      .update({
        board: createEmptyBoard(),
        current_player: 1,
        winner: null,
        is_draw: false,
        winning_cells: null,
        last_move: null,
        status: 'playing',
      })
      .eq('id', state.room.id);
  }, [state.room]);

  const resetScores = useCallback(async () => {
    if (!state.room) return;

    await supabase
      .from('game_rooms')
      .update({
        scores: { player1: 0, player2: 0 },
      })
      .eq('id', state.room.id);
  }, [state.room]);

  const leaveRoom = useCallback(() => {
    if (channelRef.current) {
      channelRef.current.unsubscribe();
      channelRef.current = null;
    }

    setState({
      room: null,
      playerId: state.playerId,
      playerNumber: null,
      isConnected: false,
      error: null,
    });
  }, [state.playerId]);

  const isColumnFull = useCallback((col: number) => {
    if (!state.room) return true;
    return state.room.board[0][col] !== null;
  }, [state.room]);

  const isWinningCell = useCallback((row: number, col: number) => {
    if (!state.room?.winning_cells) return false;
    return state.room.winning_cells.cells.some(([r, c]) => r === row && c === col);
  }, [state.room?.winning_cells]);

  const isLastMove = useCallback((row: number, col: number) => {
    if (!state.room?.last_move) return false;
    return state.room.last_move.row === row && state.room.last_move.col === col;
  }, [state.room?.last_move]);

  const isMyTurn = state.room?.current_player === state.playerNumber && state.room?.status === 'playing';

  useEffect(() => {
    return () => {
      if (channelRef.current) {
        channelRef.current.unsubscribe();
      }
    };
  }, []);

  return {
    room: state.room,
    playerNumber: state.playerNumber,
    isConnected: state.isConnected,
    error: state.error,
    isMyTurn,
    createRoom,
    joinRoom,
    dropDisc,
    resetGame,
    resetScores,
    leaveRoom,
    isColumnFull,
    isWinningCell,
    isLastMove,
  };
};
