import { GameCell } from "./GameCell";
import type { Board } from "@/hooks/useConnectFour";

interface GameBoardProps {
  board: Board;
  onDropDisc: (col: number) => void;
  isColumnFull: (col: number) => boolean;
  isWinningCell: (row: number, col: number) => boolean;
  isLastMove: (row: number, col: number) => boolean;
  gameOver: boolean;
}

export const GameBoard = ({
  board,
  onDropDisc,
  isColumnFull,
  isWinningCell,
  isLastMove,
  gameOver,
}: GameBoardProps) => {
  return (
    <div className="pixel-border bg-board-border p-2 sm:p-3 inline-block">
      <div className="grid gap-0">
        {board.map((row, rowIndex) => (
          <div key={rowIndex} className="flex">
            {row.map((cell, colIndex) => (
              <GameCell
                key={`${rowIndex}-${colIndex}`}
                value={cell}
                isWinning={isWinningCell(rowIndex, colIndex)}
                isLastMove={isLastMove(rowIndex, colIndex)}
                onClick={() => onDropDisc(colIndex)}
                disabled={gameOver || isColumnFull(colIndex)}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};
