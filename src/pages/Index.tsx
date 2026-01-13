import { useConnectFour } from "@/hooks/useConnectFour";
import { GameBoard } from "@/components/game/GameBoard";
import { GameHeader } from "@/components/game/GameHeader";
import { GameControls } from "@/components/game/GameControls";

const Index = () => {
  const {
    board,
    currentPlayer,
    winner,
    isDraw,
    scores,
    dropDisc,
    resetGame,
    resetScores,
    isColumnFull,
    isWinningCell,
    isLastMove,
  } = useConnectFour();

  const gameOver = winner !== null || isDraw;

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 sm:p-8">
      {/* Scanline overlay for CRT effect */}
      <div 
        className="fixed inset-0 pointer-events-none z-50 opacity-10"
        style={{
          background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.3) 2px, rgba(0,0,0,0.3) 4px)',
        }}
      />

      <div className="space-y-6 sm:space-y-8 relative z-10">
        <GameHeader
          currentPlayer={currentPlayer}
          winner={winner}
          isDraw={isDraw}
          scores={scores}
        />

        <div className="flex justify-center">
          <GameBoard
            board={board}
            onDropDisc={dropDisc}
            isColumnFull={isColumnFull}
            isWinningCell={isWinningCell}
            isLastMove={isLastMove}
            gameOver={gameOver}
          />
        </div>

        <GameControls
          onNewGame={resetGame}
          onResetScores={resetScores}
          gameOver={gameOver}
        />

        {/* Instructions */}
        <p className="text-center text-[8px] sm:text-[10px] text-muted-foreground max-w-sm mx-auto">
          DROP YOUR DISC BY CLICKING A COLUMN. GET 4 IN A ROW TO WIN!
        </p>
      </div>
    </div>
  );
};

export default Index;
