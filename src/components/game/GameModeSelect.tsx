import { Button } from '@/components/ui/button';

interface GameModeSelectProps {
  onSelectLocal: () => void;
  onSelectOnline: () => void;
}

export const GameModeSelect = ({ onSelectLocal, onSelectOnline }: GameModeSelectProps) => {
  return (
    <div className="text-center space-y-8">
      <h1 className="text-lg sm:text-2xl md:text-3xl text-primary retro-glow tracking-wider">
        CONNECT FOUR
      </h1>
      
      <p className="text-[10px] sm:text-xs text-muted-foreground">
        SELECT GAME MODE
      </p>

      <div className="flex flex-col gap-4 max-w-xs mx-auto">
        <Button
          onClick={onSelectLocal}
          className="pixel-border bg-player-red hover:bg-player-red/80 text-white py-6 text-sm"
        >
          🎮 LOCAL PLAY
          <span className="block text-[8px] opacity-80">SAME DEVICE</span>
        </Button>
        
        <Button
          onClick={onSelectOnline}
          className="pixel-border bg-player-yellow hover:bg-player-yellow/80 text-black py-6 text-sm"
        >
          🌐 ONLINE PLAY
          <span className="block text-[8px] opacity-80">PLAY WITH FRIENDS</span>
        </Button>
      </div>

      <p className="text-[8px] sm:text-[10px] text-muted-foreground max-w-sm mx-auto">
        GET 4 IN A ROW TO WIN!
      </p>
    </div>
  );
};
