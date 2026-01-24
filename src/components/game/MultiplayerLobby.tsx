import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface MultiplayerLobbyProps {
  onCreateRoom: () => Promise<string | null>;
  onJoinRoom: (code: string) => Promise<boolean>;
  onBack: () => void;
  error: string | null;
  isAuthenticating?: boolean;
}

export const MultiplayerLobby = ({
  onCreateRoom,
  onJoinRoom,
  onBack,
  error,
  isAuthenticating = false,
}: MultiplayerLobbyProps) => {
  const [mode, setMode] = useState<'menu' | 'create' | 'join'>('menu');
  const [roomCode, setRoomCode] = useState('');
  const [createdCode, setCreatedCode] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleCreate = async () => {
    setIsLoading(true);
    const code = await onCreateRoom();
    setCreatedCode(code);
    setIsLoading(false);
    if (code) {
      setMode('create');
    }
  };

  const handleJoin = async () => {
    if (!roomCode.trim()) return;
    setIsLoading(true);
    await onJoinRoom(roomCode);
    setIsLoading(false);
  };

  const copyToClipboard = () => {
    if (createdCode) {
      navigator.clipboard.writeText(createdCode);
    }
  };

  if (isAuthenticating) {
    return (
      <div className="text-center space-y-6">
        <h1 className="text-lg sm:text-2xl text-primary retro-glow tracking-wider">
          ONLINE MULTIPLAYER
        </h1>
        <p className="text-[10px] sm:text-xs text-secondary animate-blink">
          CONNECTING...
        </p>
      </div>
    );
  }

  return (
    <div className="text-center space-y-6">
      <h1 className="text-lg sm:text-2xl text-primary retro-glow tracking-wider">
        ONLINE MULTIPLAYER
      </h1>

      {mode === 'menu' && (
        <div className="space-y-4">
          <p className="text-[10px] sm:text-xs text-muted-foreground">
            PLAY WITH A FRIEND ONLINE
          </p>
          <div className="flex flex-col gap-3 max-w-xs mx-auto">
            <Button
              onClick={handleCreate}
              disabled={isLoading}
              className="pixel-border bg-player-red hover:bg-player-red/80 text-white"
            >
              {isLoading ? 'CREATING...' : 'CREATE ROOM'}
            </Button>
            <Button
              onClick={() => setMode('join')}
              className="pixel-border bg-player-yellow hover:bg-player-yellow/80 text-black"
            >
              JOIN ROOM
            </Button>
            <Button
              onClick={onBack}
              variant="outline"
              className="pixel-border"
            >
              BACK
            </Button>
          </div>
        </div>
      )}

      {mode === 'create' && createdCode && (
        <div className="space-y-4">
          <p className="text-[10px] sm:text-xs text-muted-foreground">
            SHARE THIS CODE WITH YOUR FRIEND
          </p>
          <div 
            onClick={copyToClipboard}
            className={cn(
              "pixel-border bg-card p-4 cursor-pointer",
              "hover:ring-2 hover:ring-primary transition-all"
            )}
          >
            <span className="text-2xl sm:text-4xl font-bold text-primary tracking-widest">
              {createdCode}
            </span>
            <p className="text-[8px] sm:text-[10px] text-muted-foreground mt-2">
              CLICK TO COPY
            </p>
          </div>
          <p className="text-[10px] sm:text-xs text-secondary animate-blink">
            WAITING FOR PLAYER 2...
          </p>
          <Button
            onClick={onBack}
            variant="outline"
            className="pixel-border"
          >
            CANCEL
          </Button>
        </div>
      )}

      {mode === 'join' && (
        <div className="space-y-4">
          <p className="text-[10px] sm:text-xs text-muted-foreground">
            ENTER THE ROOM CODE
          </p>
          <div className="max-w-xs mx-auto space-y-3">
            <Input
              value={roomCode}
              onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
              placeholder="ENTER CODE"
              maxLength={6}
              className={cn(
                "pixel-border text-center text-xl tracking-widest uppercase",
                "bg-card border-none focus:ring-2 focus:ring-primary"
              )}
            />
            {error && (
              <p className="text-[10px] text-red-500">{error}</p>
            )}
            <div className="flex gap-2">
              <Button
                onClick={() => setMode('menu')}
                variant="outline"
                className="pixel-border flex-1"
              >
                BACK
              </Button>
              <Button
                onClick={handleJoin}
                disabled={isLoading || !roomCode.trim()}
                className="pixel-border bg-primary hover:bg-primary/80 flex-1"
              >
                {isLoading ? 'JOINING...' : 'JOIN'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
