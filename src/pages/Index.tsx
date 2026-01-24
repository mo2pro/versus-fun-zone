import { useState } from 'react';
import { useConnectFour } from "@/hooks/useConnectFour";
import { useMultiplayerGame } from "@/hooks/useMultiplayerGame";
import { GameBoard } from "@/components/game/GameBoard";
import { GameHeader } from "@/components/game/GameHeader";
import { GameControls } from "@/components/game/GameControls";
import { GameModeSelect } from "@/components/game/GameModeSelect";
import { MultiplayerLobby } from "@/components/game/MultiplayerLobby";
import { MultiplayerGame } from "@/components/game/MultiplayerGame";

type GameMode = 'select' | 'local' | 'online-lobby' | 'online-game';

const Index = () => {
  const [gameMode, setGameMode] = useState<GameMode>('select');

  // Local game state
  const localGame = useConnectFour();

  // Multiplayer game state
  const multiplayer = useMultiplayerGame();

  const handleSelectLocal = () => {
    setGameMode('local');
  };

  const handleSelectOnline = () => {
    setGameMode('online-lobby');
  };

  const handleBackToMenu = () => {
    multiplayer.leaveRoom();
    setGameMode('select');
  };

  const handleCreateRoom = async () => {
    const code = await multiplayer.createRoom();
    return code;
  };

  const handleJoinRoom = async (code: string) => {
    const success = await multiplayer.joinRoom(code);
    if (success) {
      setGameMode('online-game');
    }
    return success;
  };

  // Auto-switch to game when opponent joins
  if (gameMode === 'online-lobby' && multiplayer.room?.status === 'playing') {
    setGameMode('online-game');
  }

  const localGameOver = localGame.winner !== null || localGame.isDraw;

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
        {gameMode === 'select' && (
          <GameModeSelect
            onSelectLocal={handleSelectLocal}
            onSelectOnline={handleSelectOnline}
          />
        )}

        {gameMode === 'local' && (
          <>
            <GameHeader
              currentPlayer={localGame.currentPlayer}
              winner={localGame.winner}
              isDraw={localGame.isDraw}
              scores={localGame.scores}
            />

            <div className="flex justify-center">
              <GameBoard
                board={localGame.board}
                onDropDisc={localGame.dropDisc}
                isColumnFull={localGame.isColumnFull}
                isWinningCell={localGame.isWinningCell}
                isLastMove={localGame.isLastMove}
                gameOver={localGameOver}
              />
            </div>

            <GameControls
              onNewGame={localGame.resetGame}
              onResetScores={localGame.resetScores}
              gameOver={localGameOver}
              onBack={handleBackToMenu}
              showBack
            />

            <p className="text-center text-[8px] sm:text-[10px] text-muted-foreground max-w-sm mx-auto">
              DROP YOUR DISC BY CLICKING A COLUMN. GET 4 IN A ROW TO WIN!
            </p>
          </>
        )}

        {gameMode === 'online-lobby' && (
          <MultiplayerLobby
            onCreateRoom={handleCreateRoom}
            onJoinRoom={handleJoinRoom}
            onBack={handleBackToMenu}
            error={multiplayer.error}
          />
        )}

        {gameMode === 'online-game' && multiplayer.room && multiplayer.playerNumber && (
          <MultiplayerGame
            board={multiplayer.room.board}
            currentPlayer={multiplayer.room.current_player}
            winner={multiplayer.room.winner}
            isDraw={multiplayer.room.is_draw}
            scores={multiplayer.room.scores}
            roomCode={multiplayer.room.room_code}
            playerNumber={multiplayer.playerNumber}
            isMyTurn={multiplayer.isMyTurn}
            opponentConnected={!!multiplayer.room.guest_id}
            onDropDisc={multiplayer.dropDisc}
            onNewGame={multiplayer.resetGame}
            onResetScores={multiplayer.resetScores}
            onLeave={handleBackToMenu}
            isColumnFull={multiplayer.isColumnFull}
            isWinningCell={multiplayer.isWinningCell}
            isLastMove={multiplayer.isLastMove}
          />
        )}
      </div>
    </div>
  );
};

export default Index;
