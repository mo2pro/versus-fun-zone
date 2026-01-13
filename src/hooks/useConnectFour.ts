import { useState, useCallback } from 'react';

export type Player = 1 | 2;
export type Cell = Player | null;
export type Board = Cell[][];

const ROWS = 6;
const COLS = 7;
const WIN_LENGTH = 4;

interface WinningCells {
  cells: [number, number][];
}

interface GameState {
  board: Board;
  currentPlayer: Player;
  winner: Player | null;
  isDraw: boolean;
  winningCells: WinningCells | null;
  scores: { player1: number; player2: number };
  lastMove: { row: number; col: number } | null;
}

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
  // Check all directions: horizontal, vertical, diagonal down-right, diagonal up-right
  const directions: [number, number][] = [
    [0, 1],   // horizontal
    [1, 0],   // vertical
    [1, 1],   // diagonal down-right
    [-1, 1],  // diagonal up-right
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

export const useConnectFour = () => {
  const [gameState, setGameState] = useState<GameState>({
    board: createEmptyBoard(),
    currentPlayer: 1,
    winner: null,
    isDraw: false,
    winningCells: null,
    scores: { player1: 0, player2: 0 },
    lastMove: null,
  });

  const dropDisc = useCallback((col: number) => {
    setGameState(prev => {
      // Can't play if game is over
      if (prev.winner || prev.isDraw) return prev;
      
      // Find the lowest empty row in this column
      let targetRow = -1;
      for (let row = ROWS - 1; row >= 0; row--) {
        if (prev.board[row][col] === null) {
          targetRow = row;
          break;
        }
      }
      
      // Column is full
      if (targetRow === -1) return prev;
      
      // Create new board with the disc
      const newBoard = prev.board.map(row => [...row]);
      newBoard[targetRow][col] = prev.currentPlayer;
      
      // Check for winner
      const winningCells = checkWinner(newBoard, prev.currentPlayer);
      const winner = winningCells ? prev.currentPlayer : null;
      
      // Check for draw
      const isDraw = !winner && checkDraw(newBoard);
      
      // Update scores if there's a winner
      const newScores = { ...prev.scores };
      if (winner === 1) newScores.player1++;
      if (winner === 2) newScores.player2++;
      
      return {
        ...prev,
        board: newBoard,
        currentPlayer: winner || isDraw ? prev.currentPlayer : (prev.currentPlayer === 1 ? 2 : 1),
        winner,
        isDraw,
        winningCells,
        scores: newScores,
        lastMove: { row: targetRow, col },
      };
    });
  }, []);

  const resetGame = useCallback(() => {
    setGameState(prev => ({
      ...prev,
      board: createEmptyBoard(),
      currentPlayer: 1,
      winner: null,
      isDraw: false,
      winningCells: null,
      lastMove: null,
    }));
  }, []);

  const resetScores = useCallback(() => {
    setGameState(prev => ({
      ...prev,
      scores: { player1: 0, player2: 0 },
    }));
  }, []);

  const isColumnFull = useCallback((col: number) => {
    return gameState.board[0][col] !== null;
  }, [gameState.board]);

  const isWinningCell = useCallback((row: number, col: number) => {
    if (!gameState.winningCells) return false;
    return gameState.winningCells.cells.some(([r, c]) => r === row && c === col);
  }, [gameState.winningCells]);

  const isLastMove = useCallback((row: number, col: number) => {
    if (!gameState.lastMove) return false;
    return gameState.lastMove.row === row && gameState.lastMove.col === col;
  }, [gameState.lastMove]);

  return {
    ...gameState,
    dropDisc,
    resetGame,
    resetScores,
    isColumnFull,
    isWinningCell,
    isLastMove,
  };
};
