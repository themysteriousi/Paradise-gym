-- ============================================================
-- 20261109000000_auth_google_setup.sql
-- Allow Google / OAuth authenticated users to provision their gym & partner row
-- ============================================================

-- 1. Allow authenticated partners to read their own record directly by auth_user_id
CREATE POLICY partners_read_self ON partners
  FOR SELECT TO authenticated
  USING (auth_user_id = auth.uid());

-- 2. Allow authenticated users to create a gym if they don't have one
CREATE POLICY gym_insert ON gym
  FOR INSERT TO authenticated
  WITH CHECK (true);

-- 3. Allow authenticated users to insert their own partner profile
CREATE POLICY partners_insert ON partners
  FOR INSERT TO authenticated
  WITH CHECK (auth_user_id = auth.uid());

-- 4. Automatic setup function for OAuth users (SECURITY DEFINER)
CREATE OR REPLACE FUNCTION ensure_partner_and_gym()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_user_email TEXT;
  v_user_name TEXT;
  v_gym_id UUID;
  v_partner_id UUID;
  v_result jsonb;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT email, coalesce(raw_user_meta_data->>'full_name', raw_user_meta_data->>'name', split_part(email, '@', 1))
  INTO v_user_email, v_user_name
  FROM auth.users
  WHERE id = v_user_id;

  -- 1. Check if partner row already exists for this auth user
  SELECT gym_id, id INTO v_gym_id, v_partner_id
  FROM partners
  WHERE auth_user_id = v_user_id;

  -- 2. Check by email if unlinked
  IF v_gym_id IS NULL AND v_user_email IS NOT NULL THEN
    SELECT gym_id, id INTO v_gym_id, v_partner_id
    FROM partners
    WHERE email = v_user_email;

    IF v_partner_id IS NOT NULL THEN
      UPDATE partners SET auth_user_id = v_user_id WHERE id = v_partner_id;
    END IF;
  END IF;

  -- 3. If no partner or gym exists, create the primary gym and partner
  IF v_gym_id IS NULL THEN
    SELECT id INTO v_gym_id FROM gym LIMIT 1;
    IF v_gym_id IS NULL THEN
      INSERT INTO gym (name, email)
      VALUES ('Paradise Gym', v_user_email)
      RETURNING id INTO v_gym_id;

      -- Seed default plans for this new gym
      INSERT INTO membership_plans (gym_id, name, duration_months, duration_days, price_paise, is_active)
      VALUES 
        (v_gym_id, 'Monthly Standard', 1, 30, 150000, true),
        (v_gym_id, 'Quarterly Saver', 3, 90, 400000, true),
        (v_gym_id, 'Half-Yearly Pass', 6, 180, 750000, true),
        (v_gym_id, 'Annual Fitness Pass', 12, 365, 1400000, true);
    END IF;

    INSERT INTO partners (gym_id, auth_user_id, name, email, role, is_active)
    VALUES (
      v_gym_id,
      v_user_id,
      coalesce(v_user_name, 'Partner'),
      coalesce(v_user_email, 'partner@paradisegym.com'),
      'partner',
      true
    )
    RETURNING id INTO v_partner_id;
  END IF;

  SELECT jsonb_build_object(
    'gym', (SELECT row_to_json(g) FROM gym g WHERE g.id = v_gym_id),
    'partner', (SELECT row_to_json(p) FROM partners p WHERE p.id = v_partner_id)
  ) INTO v_result;

  RETURN v_result;
END;
$$;

GRANT EXECUTE ON FUNCTION ensure_partner_and_gym() TO authenticated;

