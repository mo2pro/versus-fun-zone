import { cn } from "@/lib/utils";
import type { Player } from "@/hooks/useConnectFour";

interface GameHeaderProps {
  currentPlayer: Player;
  winner: Player | null;
  isDraw: boolean;
  scores: { player1: number; player2: number };
}

export const GameHeader = ({ currentPlayer, winner, isDraw, scores }: GameHeaderProps) => {
  return (
    <div className="text-center space-y-4 sm:space-y-6">
      {/* Title */}
      <h1 className="text-lg sm:text-2xl md:text-3xl text-primary retro-glow tracking-wider">
        CONNECT FOUR
      </h1>

      {/* Score Board */}
      <div className="flex justify-center items-center gap-4 sm:gap-8">
        <div className={cn(
          "text-center px-3 py-2 sm:px-4 sm:py-3",
          "pixel-border bg-card",
          currentPlayer === 1 && !winner && !isDraw && "ring-2 ring-player-red"
        )}>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-player-red" />
            <span className="text-[8px] sm:text-[10px] text-muted-foreground">PLAYER 1</span>
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
            <span className="text-[8px] sm:text-[10px] text-muted-foreground">PLAYER 2</span>
          </div>
          <span className="text-xl sm:text-2xl font-bold text-player-yellow">{scores.player2}</span>
        </div>
      </div>

      {/* Status Message */}
      <div className="h-8 sm:h-10">
        {winner ? (
          <p className={cn(
            "text-sm sm:text-lg animate-blink",
            winner === 1 ? "text-player-red" : "text-player-yellow"
          )}>
            🎉 PLAYER {winner} WINS! 🎉
          </p>
        ) : isDraw ? (
          <p className="text-sm sm:text-lg text-secondary animate-blink">
            🤝 IT'S A DRAW! 🤝
          </p>
        ) : (
          <p className={cn(
            "text-xs sm:text-sm",
            currentPlayer === 1 ? "text-player-red" : "text-player-yellow"
          )}>
            PLAYER {currentPlayer}'S TURN
          </p>
        )}
      </div>
    </div>
  );
};
