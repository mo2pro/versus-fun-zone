-- Drop existing permissive policies
DROP POLICY IF EXISTS "Anyone can view game rooms" ON public.game_rooms;
DROP POLICY IF EXISTS "Anyone can update game rooms" ON public.game_rooms;
DROP POLICY IF EXISTS "Anyone can create game rooms" ON public.game_rooms;

-- Create secure RLS policies that restrict access to game participants only

-- SELECT: Players can view games they created or joined, OR games they're trying to join (by room_code lookup)
CREATE POLICY "Players can view their games or by room code"
ON public.game_rooms
FOR SELECT
USING (
  auth.uid()::text = host_id 
  OR auth.uid()::text = guest_id 
  OR guest_id IS NULL  -- Allow viewing rooms that are waiting for players
);

-- INSERT: Users can only create games where they are the host
CREATE POLICY "Users can create games as host"
ON public.game_rooms
FOR INSERT
WITH CHECK (auth.uid()::text = host_id);

-- UPDATE: Only players in the game can update it
CREATE POLICY "Players can update their games"
ON public.game_rooms
FOR UPDATE
USING (auth.uid()::text = host_id OR auth.uid()::text = guest_id)
WITH CHECK (auth.uid()::text = host_id OR auth.uid()::text = guest_id);