-- Fix join_game_room function to use SECURITY DEFINER so it can find rooms before user is a participant
-- This is safe because the function has its own validation logic

CREATE OR REPLACE FUNCTION public.join_game_room(p_room_code text)
RETURNS game_rooms
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_room game_rooms;
  v_user_id text;
BEGIN
  -- Get the authenticated user's ID
  v_user_id := auth.uid()::text;
  
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Lock the row for update to prevent race conditions
  SELECT * INTO v_room
  FROM game_rooms
  WHERE room_code = p_room_code
  FOR UPDATE;

  IF v_room IS NULL THEN
    RAISE EXCEPTION 'Room not found';
  END IF;

  -- Check if user is already the host (rejoin scenario)
  IF v_room.host_id = v_user_id THEN
    RETURN v_room;
  END IF;

  -- Check if user is already the guest (rejoin scenario)
  IF v_room.guest_id = v_user_id THEN
    RETURN v_room;
  END IF;

  -- Check if room is full (has a different guest)
  IF v_room.guest_id IS NOT NULL THEN
    RAISE EXCEPTION 'Room is full';
  END IF;

  -- Join as guest
  UPDATE game_rooms
  SET 
    guest_id = v_user_id,
    status = 'playing',
    updated_at = now()
  WHERE id = v_room.id
  RETURNING * INTO v_room;

  RETURN v_room;
END;
$$;