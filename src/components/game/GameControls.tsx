import { Button } from "@/components/ui/button";
import { RotateCcw, Trophy, ArrowLeft } from "lucide-react";

interface GameControlsProps {
  onNewGame: () => void;
  onResetScores: () => void;
  gameOver: boolean;
  onBack?: () => void;
  showBack?: boolean;
}

export const GameControls = ({ onNewGame, onResetScores, gameOver, onBack, showBack }: GameControlsProps) => {
  return (
    <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
      <Button
        onClick={onNewGame}
        className="pixel-button bg-primary text-primary-foreground hover:bg-primary/90 text-[10px] sm:text-xs px-4 py-3 sm:px-6 sm:py-4"
      >
        <RotateCcw className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
        {gameOver ? "PLAY AGAIN" : "NEW GAME"}
      </Button>
      
      <Button
        onClick={onResetScores}
        variant="outline"
        className="pixel-button border-border text-muted-foreground hover:text-foreground text-[10px] sm:text-xs px-4 py-3 sm:px-6 sm:py-4"
      >
        <Trophy className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
        RESET SCORES
      </Button>

      {showBack && onBack && (
        <Button
          onClick={onBack}
          variant="outline"
          className="pixel-button border-border text-muted-foreground hover:text-foreground text-[10px] sm:text-xs px-4 py-3 sm:px-6 sm:py-4"
        >
          <ArrowLeft className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
          BACK TO MENU
        </Button>
      )}
    </div>
  );
};
