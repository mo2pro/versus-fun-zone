-- Create game rooms table for multiplayer
CREATE TABLE public.game_rooms (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  room_code TEXT NOT NULL UNIQUE,
  host_id TEXT NOT NULL,
  guest_id TEXT,
  board JSONB NOT NULL DEFAULT '[[null,null,null,null,null,null,null],[null,null,null,null,null,null,null],[null,null,null,null,null,null,null],[null,null,null,null,null,null,null],[null,null,null,null,null,null,null],[null,null,null,null,null,null,null]]',
  current_player INTEGER NOT NULL DEFAULT 1,
  winner INTEGER,
  is_draw BOOLEAN NOT NULL DEFAULT false,
  winning_cells JSONB,
  last_move JSONB,
  scores JSONB NOT NULL DEFAULT '{"player1": 0, "player2": 0}',
  status TEXT NOT NULL DEFAULT 'waiting',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.game_rooms ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read game rooms (for joining)
CREATE POLICY "Anyone can view game rooms"
ON public.game_rooms
FOR SELECT
USING (true);

-- Allow anyone to create a game room
CREATE POLICY "Anyone can create game rooms"
ON public.game_rooms
FOR INSERT
WITH CHECK (true);

-- Allow anyone to update game rooms (players in the game)
CREATE POLICY "Anyone can update game rooms"
ON public.game_rooms
FOR UPDATE
USING (true);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_game_room_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_game_rooms_updated_at
BEFORE UPDATE ON public.game_rooms
FOR EACH ROW
EXECUTE FUNCTION public.update_game_room_timestamp();

-- Enable realtime for game rooms
ALTER PUBLICATION supabase_realtime ADD TABLE public.game_rooms;