import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { Board, Player } from './useConnectFour';

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
  playerId: string | null;
  playerNumber: Player | null;
  isConnected: boolean;
  error: string | null;
  isAuthenticating: boolean;
}

const generateRoomCode = (): string => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
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

// Ensure user is authenticated (anonymous auth for game players)
const ensureAuth = async (): Promise<string> => {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (user) {
    return user.id;
  }
  
  // Sign in anonymously if not authenticated
  const { data, error } = await supabase.auth.signInAnonymously();
  if (error) {
    throw new Error('Failed to authenticate: ' + error.message);
  }
  
  if (!data.user) {
    throw new Error('Failed to get user after authentication');
  }
  
  return data.user.id;
};

export const useMultiplayerGame = () => {
  const [state, setState] = useState<MultiplayerState>({
    room: null,
    playerId: null,
    playerNumber: null,
    isConnected: false,
    error: null,
    isAuthenticating: false,
  });

  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  // Initialize authentication on mount
  useEffect(() => {
    const initAuth = async () => {
      setState(prev => ({ ...prev, isAuthenticating: true }));
      try {
        const userId = await ensureAuth();
        setState(prev => ({ ...prev, playerId: userId, isAuthenticating: false }));
      } catch (error) {
        setState(prev => ({ 
          ...prev, 
          error: 'Failed to initialize authentication', 
          isAuthenticating: false 
        }));
      }
    };

    initAuth();

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user) {
        setState(prev => ({ ...prev, playerId: session.user.id }));
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

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
    if (!state.playerId) {
      setState(prev => ({ ...prev, error: 'Not authenticated' }));
      return null;
    }

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
      setState(prev => ({ ...prev, error: 'Failed to create room: ' + error.message }));
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
    if (!state.playerId) {
      setState(prev => ({ ...prev, error: 'Not authenticated' }));
      return false;
    }

    setState(prev => ({ ...prev, error: null }));

    const roomCode = code.toUpperCase().trim();

    // Use the secure database function to join the room (prevents race conditions)
    const { data, error } = await supabase
      .rpc('join_game_room', { p_room_code: roomCode });

    if (error) {
      // Parse the error message from the database function
      const errorMessage = error.message.includes('Room not found') 
        ? 'Room not found'
        : error.message.includes('Room is full')
        ? 'Room is full'
        : 'Failed to join room: ' + error.message;
      setState(prev => ({ ...prev, error: errorMessage }));
      return false;
    }

    if (!data) {
      setState(prev => ({ ...prev, error: 'Room not found' }));
      return false;
    }

    // Determine player number based on host/guest status
    const isHost = data.host_id === state.playerId;
    
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
      playerNumber: isHost ? 1 : 2,
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

    // Use the secure database function to make the move (server-side validation)
    const { error } = await supabase
      .rpc('make_move', { 
        p_room_id: state.room.id, 
        p_column: col 
      });

    if (error) {
      console.error('Move failed:', error.message);
      // The realtime subscription will update the state if the move was actually made
    }
    // State will be updated via realtime subscription
  }, [state.room, state.playerNumber]);

  const resetGame = useCallback(async () => {
    if (!state.room) return;

    // Use the secure database function to reset the game
    const { error } = await supabase
      .rpc('reset_game', { p_room_id: state.room.id });

    if (error) {
      console.error('Reset game failed:', error.message);
    }
    // State will be updated via realtime subscription
  }, [state.room]);

  const resetScores = useCallback(async () => {
    if (!state.room) return;

    // Use the secure database function to reset scores
    const { error } = await supabase
      .rpc('reset_scores', { p_room_id: state.room.id });

    if (error) {
      console.error('Reset scores failed:', error.message);
    }
    // State will be updated via realtime subscription
  }, [state.room]);

  const leaveRoom = useCallback(() => {
    if (channelRef.current) {
      channelRef.current.unsubscribe();
      channelRef.current = null;
    }

    setState(prev => ({
      ...prev,
      room: null,
      playerNumber: null,
      isConnected: false,
      error: null,
    }));
  }, []);

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
    isAuthenticating: state.isAuthenticating,
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
