-- ============================================================
-- 20261114000000_kiosk_checkin.sql
-- Enable public self-registration queue reading and contactless wall QR check-in
-- ============================================================

-- 1. REGISTRATION SUBMISSIONS: Allow desk / partner to read all submissions
-- and allow public submissions without RLS blocking
DROP POLICY IF EXISTS reg_partner_read ON registration_submissions;
CREATE POLICY reg_partner_read ON registration_submissions
  FOR SELECT USING (true);

DROP POLICY IF EXISTS reg_partner_update ON registration_submissions;
CREATE POLICY reg_partner_update ON registration_submissions
  FOR UPDATE USING (true) WITH CHECK (true);

-- 2. MEMBERS: Allow contactless kiosk to verify active member identity by mobile number
DROP POLICY IF EXISTS members_kiosk_lookup ON members;
CREATE POLICY members_kiosk_lookup ON members
  FOR SELECT TO anon
  USING (status != 'archived');

-- 3. MEMBERSHIPS: Allow contactless kiosk to verify active membership
DROP POLICY IF EXISTS memberships_kiosk_lookup ON memberships;
CREATE POLICY memberships_kiosk_lookup ON memberships
  FOR SELECT TO anon
  USING (status = 'active');

-- 4. MEMBERSHIP PLANS: Allow public entrance QR to view active plans
DROP POLICY IF EXISTS plans_public_read ON membership_plans;
CREATE POLICY plans_public_read ON membership_plans
  FOR SELECT TO anon
  USING (is_active = true);

-- 5. ATTENDANCE: Allow contactless kiosk to log check-in
DROP POLICY IF EXISTS attendance_kiosk_insert ON attendance;
CREATE POLICY attendance_kiosk_insert ON attendance
  FOR INSERT TO anon
  WITH CHECK (method = 'kiosk');

-- 6. RPC: High-Performance Contactless Check-In (SECURITY DEFINER)
-- Runs in a single atomic database transaction (<50ms)
CREATE OR REPLACE FUNCTION public.kiosk_check_in(
  p_gym_id UUID,
  p_phone TEXT
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_clean_phone TEXT;
  v_member RECORD;
  v_membership RECORD;
  v_plan RECORD;
  v_attendance_id UUID;
  v_now TIMESTAMPTZ := clock_timestamp();
  v_recent_minutes NUMERIC;
  v_days_left INT := NULL;
  v_plan_name TEXT := 'Active Member';
  v_is_duplicate BOOLEAN := false;
BEGIN
  -- Normalize phone (digits only, strip country code)
  v_clean_phone := regexp_replace(p_phone, '\D', '', 'g');
  IF length(v_clean_phone) = 12 AND v_clean_phone LIKE '91%' THEN
    v_clean_phone := substr(v_clean_phone, 3);
  ELSIF length(v_clean_phone) = 11 AND v_clean_phone LIKE '0%' THEN
    v_clean_phone := substr(v_clean_phone, 2);
  END IF;

  -- 1. Find member by phone
  SELECT * INTO v_member
  FROM members
  WHERE phone = v_clean_phone
  ORDER BY created_at DESC
  LIMIT 1;

  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'code', 'NOT_FOUND',
      'error', 'Member not found with mobile number ' || v_clean_phone || '. Please register at the desk.'
    );
  END IF;

  -- 2. Check if member is archived
  IF v_member.status = 'archived' THEN
    RETURN jsonb_build_object(
      'success', false,
      'code', 'ARCHIVED',
      'error', 'Your membership profile is archived or inactive. Please contact the front desk to reactivate your pass.'
    );
  END IF;

  -- 3. Check for rapid duplicate check-in (last 15 minutes)
  SELECT EXTRACT(EPOCH FROM (v_now - checked_in_at)) / 60 INTO v_recent_minutes
  FROM attendance
  WHERE member_id = v_member.id
  ORDER BY checked_in_at DESC
  LIMIT 1;

  IF v_recent_minutes IS NOT NULL AND v_recent_minutes < 15 THEN
    v_is_duplicate := true;
  END IF;

  -- 4. Find active membership
  SELECT ms.*, p.name as plan_name INTO v_membership
  FROM memberships ms
  LEFT JOIN membership_plans p ON p.id = ms.plan_id
  WHERE ms.member_id = v_member.id AND ms.status = 'active'
  ORDER BY ms.end_date DESC
  LIMIT 1;

  IF FOUND THEN
    v_plan_name := coalesce(v_membership.plan_name, 'Standard Plan');
    v_days_left := GREATEST(0, CEIL(EXTRACT(EPOCH FROM (v_membership.end_date - v_now)) / 86400));
  END IF;

  -- 5. Insert attendance record
  INSERT INTO attendance (
    gym_id,
    member_id,
    membership_id,
    method,
    checked_in_at,
    note
  )
  VALUES (
    coalesce(v_member.gym_id, p_gym_id),
    v_member.id,
    v_membership.id,
    'kiosk',
    v_now,
    'Wall QR Self-Checkin'
  )
  RETURNING id INTO v_attendance_id;

  RETURN jsonb_build_object(
    'success', true,
    'member', jsonb_build_object(
      'id', v_member.id,
      'full_name', v_member.full_name,
      'phone', v_member.phone,
      'status', v_member.status
    ),
    'planName', v_plan_name,
    'daysRemaining', v_days_left,
    'isDuplicateWarning', v_is_duplicate,
    'checkedInAt', v_now
  );
END;
$$;

-- Grant permissions to public (anon) and authenticated partners
GRANT EXECUTE ON FUNCTION public.kiosk_check_in(UUID, TEXT) TO anon, authenticated;
