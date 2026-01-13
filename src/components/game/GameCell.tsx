import { cn } from "@/lib/utils";
import type { Cell } from "@/hooks/useConnectFour";

interface GameCellProps {
  value: Cell;
  isWinning: boolean;
  isLastMove: boolean;
  onClick: () => void;
  disabled: boolean;
}

export const GameCell = ({ value, isWinning, isLastMove, onClick, disabled }: GameCellProps) => {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 rounded-none relative",
        "bg-board-blue border-4 border-board-border",
        "transition-colors focus:outline-none",
        !disabled && "hover:bg-board-blue/80 cursor-pointer",
        disabled && "cursor-default"
      )}
      aria-label="Game cell"
    >
      {/* Cell hole background */}
      <div className="absolute inset-2 rounded-full bg-cell-shadow" />
      
      {/* Disc */}
      {value && (
        <div
          className={cn(
            "absolute inset-2 rounded-full",
            value === 1 ? "bg-player-red" : "bg-player-yellow",
            isLastMove && "animate-disc-drop",
            isWinning && "animate-winner",
            // Pixel art inner shine effect
            "before:absolute before:top-1 before:left-1 before:w-3 before:h-3 before:rounded-full before:bg-white/30"
          )}
        />
      )}
    </button>
  );
};
