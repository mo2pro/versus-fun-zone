import { GameBoard } from './GameBoard';
import { GameControls } from './GameControls';
import { cn } from '@/lib/utils';
import type { Player, Board } from '@/hooks/useConnectFour';

interface MultiplayerGameProps {
  board: Board;
  currentPlayer: Player;
  winner: Player | null;
  isDraw: boolean;
  scores: { player1: number; player2: number };
  roomCode: string;
  playerNumber: Player;
  isMyTurn: boolean;
  opponentConnected: boolean;
  onDropDisc: (col: number) => void;
  onNewGame: () => void;
  onResetScores: () => void;
  onLeave: () => void;
  isColumnFull: (col: number) => boolean;
  isWinningCell: (row: number, col: number) => boolean;
  isLastMove: (row: number, col: number) => boolean;
}

export const MultiplayerGame = ({
  board,
  currentPlayer,
  winner,
  isDraw,
  scores,
  roomCode,
  playerNumber,
  isMyTurn,
  opponentConnected,
  onDropDisc,
  onNewGame,
  onResetScores,
  onLeave,
  isColumnFull,
  isWinningCell,
  isLastMove,
}: MultiplayerGameProps) => {
  const gameOver = winner !== null || isDraw;
  const canPlay = isMyTurn && !gameOver && opponentConnected;

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Header */}
      <div className="text-center space-y-4 sm:space-y-6">
        <h1 className="text-lg sm:text-2xl md:text-3xl text-primary retro-glow tracking-wider">
          CONNECT FOUR
        </h1>

        {/* Room Code */}
        <div className="pixel-border bg-card px-3 py-1 inline-block">
          <span className="text-[8px] sm:text-[10px] text-muted-foreground">ROOM: </span>
          <span className="text-xs sm:text-sm text-primary font-bold">{roomCode}</span>
        </div>

        {/* Score Board */}
        <div className="flex justify-center items-center gap-4 sm:gap-8">
          <div className={cn(
            "text-center px-3 py-2 sm:px-4 sm:py-3",
            "pixel-border bg-card",
            currentPlayer === 1 && !winner && !isDraw && "ring-2 ring-player-red"
          )}>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-player-red" />
              <span className="text-[8px] sm:text-[10px] text-muted-foreground">
                {playerNumber === 1 ? 'YOU' : 'OPPONENT'}
              </span>
            </div>
            <span className="text-xl sm:text-2xl font-bold text-player-red">{scores.player1}</span>
          </div>

          <span className="text-muted-foreground text-xs sm:text-sm">VS</span>

          <div className={cn(
            "text-center px-3 py-2 sm:px-4 sm:py-3",
            "pixel-border bg-card",
            currentPlayer === 2 && !winner && !isDraw && "ring-2 ring-player-yellow"
          )}>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-player-yellow" />
              <span className="text-[8px] sm:text-[10px] text-muted-foreground">
                {playerNumber === 2 ? 'YOU' : 'OPPONENT'}
              </span>
            </div>
            <span className="text-xl sm:text-2xl font-bold text-player-yellow">{scores.player2}</span>
          </div>
        </div>

        {/* Status Message */}
        <div className="h-8 sm:h-10">
          {!opponentConnected ? (
            <p className="text-sm sm:text-lg text-secondary animate-blink">
              ⏳ WAITING FOR OPPONENT...
            </p>
          ) : winner ? (
            <p className={cn(
              "text-sm sm:text-lg animate-blink",
              winner === playerNumber ? "text-primary" : "text-muted-foreground"
            )}>
              {winner === playerNumber ? '🎉 YOU WIN! 🎉' : '😢 YOU LOSE! 😢'}
            </p>
          ) : isDraw ? (
            <p className="text-sm sm:text-lg text-secondary animate-blink">
              🤝 IT'S A DRAW! 🤝
            </p>
          ) : isMyTurn ? (
            <p className={cn(
              "text-xs sm:text-sm",
              playerNumber === 1 ? "text-player-red" : "text-player-yellow"
            )}>
              YOUR TURN
            </p>
          ) : (
            <p className="text-xs sm:text-sm text-muted-foreground">
              OPPONENT'S TURN...
            </p>
          )}
        </div>
      </div>

      {/* Game Board */}
      <div className="flex justify-center">
        <GameBoard
          board={board}
          onDropDisc={onDropDisc}
          isColumnFull={(col) => !canPlay || isColumnFull(col)}
          isWinningCell={isWinningCell}
          isLastMove={isLastMove}
          gameOver={!canPlay}
        />
      </div>

      {/* Controls */}
      <div className="flex flex-wrap justify-center gap-2 sm:gap-3">
        {gameOver && opponentConnected && (
          <button
            onClick={onNewGame}
            className={cn(
              "pixel-border px-4 py-2 sm:px-6 sm:py-3",
              "bg-primary text-primary-foreground",
              "text-[10px] sm:text-xs",
              "hover:scale-105 active:scale-95 transition-transform",
              "animate-blink"
            )}
          >
            NEW GAME
          </button>
        )}
        <button
          onClick={onResetScores}
          className={cn(
            "pixel-border px-4 py-2 sm:px-6 sm:py-3",
            "bg-muted text-muted-foreground",
            "text-[10px] sm:text-xs",
            "hover:scale-105 active:scale-95 transition-transform"
          )}
        >
          RESET SCORES
        </button>
        <button
          onClick={onLeave}
          className={cn(
            "pixel-border px-4 py-2 sm:px-6 sm:py-3",
            "bg-destructive text-destructive-foreground",
            "text-[10px] sm:text-xs",
            "hover:scale-105 active:scale-95 transition-transform"
          )}
        >
          LEAVE ROOM
        </button>
      </div>
    </div>
  );
};
