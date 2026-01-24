-- Create function to safely make a move with server-side validation
CREATE OR REPLACE FUNCTION public.make_move(
  p_room_id UUID,
  p_column INT
) RETURNS game_rooms
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  v_room game_rooms;
  v_player_id TEXT;
  v_expected_player INT;
  v_target_row INT;
  v_board JSONB;
  v_winning_cells JSONB;
  v_winner INT;
  v_is_draw BOOLEAN;
  v_new_scores JSONB;
BEGIN
  -- Get current user
  v_player_id := auth.uid()::text;
  
  -- Lock the row for update to prevent race conditions
  SELECT * INTO v_room
  FROM game_rooms
  WHERE id = p_room_id
  FOR UPDATE;
  
  IF v_room IS NULL THEN
    RAISE EXCEPTION 'Room not found';
  END IF;
  
  -- Verify game is in playing state
  IF v_room.status != 'playing' THEN
    RAISE EXCEPTION 'Game is not active';
  END IF;
  
  -- Verify game not already finished
  IF v_room.winner IS NOT NULL OR v_room.is_draw THEN
    RAISE EXCEPTION 'Game is already finished';
  END IF;
  
  -- Verify player is participant
  IF v_player_id != v_room.host_id AND v_player_id != v_room.guest_id THEN
    RAISE EXCEPTION 'You are not a participant in this game';
  END IF;
  
  -- Determine which player number the current user is
  IF v_player_id = v_room.host_id THEN
    v_expected_player := 1;
  ELSE
    v_expected_player := 2;
  END IF;
  
  -- Verify it's the player's turn
  IF v_room.current_player != v_expected_player THEN
    RAISE EXCEPTION 'Not your turn';
  END IF;
  
  -- Validate column is in range
  IF p_column < 0 OR p_column > 6 THEN
    RAISE EXCEPTION 'Invalid column';
  END IF;
  
  -- Find lowest empty row in the column
  v_board := v_room.board;
  v_target_row := -1;
  
  FOR i IN REVERSE 5..0 LOOP
    IF v_board->i->p_column = 'null'::jsonb THEN
      v_target_row := i;
      EXIT;
    END IF;
  END LOOP;
  
  IF v_target_row = -1 THEN
    RAISE EXCEPTION 'Column is full';
  END IF;
  
  -- Update the board with the new disc
  v_board := jsonb_set(v_board, ARRAY[v_target_row::text, p_column::text], to_jsonb(v_expected_player));
  
  -- Check for winner (simplified - checks from the placed piece)
  v_winning_cells := NULL;
  v_winner := NULL;
  v_is_draw := FALSE;
  
  -- Check horizontal
  DECLARE
    count INT := 0;
    cells JSONB := '[]'::jsonb;
    c INT;
  BEGIN
    FOR c IN GREATEST(0, p_column - 3)..LEAST(6, p_column + 3) LOOP
      IF v_board->v_target_row->c = to_jsonb(v_expected_player) THEN
        count := count + 1;
        cells := cells || jsonb_build_array(jsonb_build_array(v_target_row, c));
        IF count >= 4 THEN
          v_winner := v_expected_player;
          v_winning_cells := jsonb_build_object('cells', cells);
          EXIT;
        END IF;
      ELSE
        count := 0;
        cells := '[]'::jsonb;
      END IF;
    END LOOP;
  END;
  
  -- Check vertical (only need to check down from placed piece)
  IF v_winner IS NULL AND v_target_row <= 2 THEN
    DECLARE
      count INT := 0;
      cells JSONB := '[]'::jsonb;
      r INT;
    BEGIN
      FOR r IN v_target_row..LEAST(5, v_target_row + 3) LOOP
        IF v_board->r->p_column = to_jsonb(v_expected_player) THEN
          count := count + 1;
          cells := cells || jsonb_build_array(jsonb_build_array(r, p_column));
        ELSE
          EXIT;
        END IF;
      END LOOP;
      IF count >= 4 THEN
        v_winner := v_expected_player;
        v_winning_cells := jsonb_build_object('cells', cells);
      END IF;
    END;
  END IF;
  
  -- Check diagonal (top-left to bottom-right)
  IF v_winner IS NULL THEN
    DECLARE
      count INT := 0;
      cells JSONB := '[]'::jsonb;
      r INT;
      c INT;
      start_offset INT;
    BEGIN
      start_offset := -LEAST(3, LEAST(v_target_row, p_column));
      FOR i IN 0..6 LOOP
        r := v_target_row + start_offset + i;
        c := p_column + start_offset + i;
        EXIT WHEN r > 5 OR c > 6;
        IF r >= 0 AND c >= 0 AND v_board->r->c = to_jsonb(v_expected_player) THEN
          count := count + 1;
          cells := cells || jsonb_build_array(jsonb_build_array(r, c));
          IF count >= 4 THEN
            v_winner := v_expected_player;
            v_winning_cells := jsonb_build_object('cells', cells);
            EXIT;
          END IF;
        ELSE
          count := 0;
          cells := '[]'::jsonb;
        END IF;
      END LOOP;
    END;
  END IF;
  
  -- Check diagonal (bottom-left to top-right)
  IF v_winner IS NULL THEN
    DECLARE
      count INT := 0;
      cells JSONB := '[]'::jsonb;
      r INT;
      c INT;
      start_offset INT;
    BEGIN
      start_offset := -LEAST(3, LEAST(5 - v_target_row, p_column));
      FOR i IN 0..6 LOOP
        r := v_target_row - start_offset - i;
        c := p_column + start_offset + i;
        EXIT WHEN r < 0 OR c > 6;
        IF r <= 5 AND c >= 0 AND v_board->r->c = to_jsonb(v_expected_player) THEN
          count := count + 1;
          cells := cells || jsonb_build_array(jsonb_build_array(r, c));
          IF count >= 4 THEN
            v_winner := v_expected_player;
            v_winning_cells := jsonb_build_object('cells', cells);
            EXIT;
          END IF;
        ELSE
          count := 0;
          cells := '[]'::jsonb;
        END IF;
      END LOOP;
    END;
  END IF;
  
  -- Check for draw (top row full, no winner)
  IF v_winner IS NULL THEN
    v_is_draw := TRUE;
    FOR c IN 0..6 LOOP
      IF v_board->0->c = 'null'::jsonb THEN
        v_is_draw := FALSE;
        EXIT;
      END IF;
    END LOOP;
  END IF;
  
  -- Update scores if there's a winner
  v_new_scores := v_room.scores;
  IF v_winner = 1 THEN
    v_new_scores := jsonb_set(v_new_scores, '{player1}', to_jsonb((v_new_scores->>'player1')::int + 1));
  ELSIF v_winner = 2 THEN
    v_new_scores := jsonb_set(v_new_scores, '{player2}', to_jsonb((v_new_scores->>'player2')::int + 1));
  END IF;
  
  -- Update the game room
  UPDATE game_rooms
  SET 
    board = v_board,
    current_player = CASE 
      WHEN v_winner IS NOT NULL OR v_is_draw THEN v_room.current_player 
      ELSE CASE WHEN v_room.current_player = 1 THEN 2 ELSE 1 END
    END,
    winner = v_winner,
    is_draw = v_is_draw,
    winning_cells = v_winning_cells,
    last_move = jsonb_build_object('row', v_target_row, 'col', p_column),
    scores = v_new_scores,
    status = CASE WHEN v_winner IS NOT NULL OR v_is_draw THEN 'finished' ELSE 'playing' END,
    updated_at = now()
  WHERE id = p_room_id
  RETURNING * INTO v_room;
  
  RETURN v_room;
END;
$$;

-- Create function to safely join a room (fixes race condition)
CREATE OR REPLACE FUNCTION public.join_game_room(
  p_room_code TEXT
) RETURNS game_rooms
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  v_room game_rooms;
  v_player_id TEXT;
BEGIN
  v_player_id := auth.uid()::text;
  
  IF v_player_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;
  
  -- Lock the row for update to prevent race conditions
  SELECT * INTO v_room
  FROM game_rooms
  WHERE room_code = UPPER(TRIM(p_room_code))
  FOR UPDATE;
  
  IF v_room IS NULL THEN
    RAISE EXCEPTION 'Room not found';
  END IF;
  
  -- If user is already host, just return the room
  IF v_room.host_id = v_player_id THEN
    RETURN v_room;
  END IF;
  
  -- If user is already guest, just return the room
  IF v_room.guest_id = v_player_id THEN
    RETURN v_room;
  END IF;
  
  -- Check if room is full
  IF v_room.guest_id IS NOT NULL THEN
    RAISE EXCEPTION 'Room is full';
  END IF;
  
  -- Atomically join the room
  UPDATE game_rooms
  SET 
    guest_id = v_player_id,
    status = 'playing',
    updated_at = now()
  WHERE id = v_room.id
  RETURNING * INTO v_room;
  
  RETURN v_room;
END;
$$;

-- Create function to safely reset game
CREATE OR REPLACE FUNCTION public.reset_game(
  p_room_id UUID
) RETURNS game_rooms
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  v_room game_rooms;
  v_player_id TEXT;
BEGIN
  v_player_id := auth.uid()::text;
  
  -- Lock and get room
  SELECT * INTO v_room
  FROM game_rooms
  WHERE id = p_room_id
  FOR UPDATE;
  
  IF v_room IS NULL THEN
    RAISE EXCEPTION 'Room not found';
  END IF;
  
  -- Verify player is participant
  IF v_player_id != v_room.host_id AND v_player_id != v_room.guest_id THEN
    RAISE EXCEPTION 'You are not a participant in this game';
  END IF;
  
  -- Reset the game
  UPDATE game_rooms
  SET 
    board = '[[null,null,null,null,null,null,null],[null,null,null,null,null,null,null],[null,null,null,null,null,null,null],[null,null,null,null,null,null,null],[null,null,null,null,null,null,null],[null,null,null,null,null,null,null]]'::jsonb,
    current_player = 1,
    winner = NULL,
    is_draw = FALSE,
    winning_cells = NULL,
    last_move = NULL,
    status = 'playing',
    updated_at = now()
  WHERE id = p_room_id
  RETURNING * INTO v_room;
  
  RETURN v_room;
END;
$$;

-- Create function to safely reset scores
CREATE OR REPLACE FUNCTION public.reset_scores(
  p_room_id UUID
) RETURNS game_rooms
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  v_room game_rooms;
  v_player_id TEXT;
BEGIN
  v_player_id := auth.uid()::text;
  
  -- Lock and get room
  SELECT * INTO v_room
  FROM game_rooms
  WHERE id = p_room_id
  FOR UPDATE;
  
  IF v_room IS NULL THEN
    RAISE EXCEPTION 'Room not found';
  END IF;
  
  -- Verify player is participant
  IF v_player_id != v_room.host_id AND v_player_id != v_room.guest_id THEN
    RAISE EXCEPTION 'You are not a participant in this game';
  END IF;
  
  -- Reset scores
  UPDATE game_rooms
  SET 
    scores = '{"player1": 0, "player2": 0}'::jsonb,
    updated_at = now()
  WHERE id = p_room_id
  RETURNING * INTO v_room;
  
  RETURN v_room;
END;
$$;

-- Update SELECT policy to not expose waiting rooms
DROP POLICY IF EXISTS "Players can view their games or by room code" ON public.game_rooms;

CREATE POLICY "Players can view their games"
ON public.game_rooms
FOR SELECT
TO authenticated
USING (auth.uid()::text = host_id OR auth.uid()::text = guest_id);