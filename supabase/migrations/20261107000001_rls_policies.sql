-- ============================================================
-- 0007_rls_policies.sql
-- Enable RLS on every table
-- ============================================================

ALTER TABLE gym                     ENABLE ROW LEVEL SECURITY;
ALTER TABLE partners                ENABLE ROW LEVEL SECURITY;
ALTER TABLE members                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE member_tags             ENABLE ROW LEVEL SECURITY;
ALTER TABLE member_tag_assignments  ENABLE ROW LEVEL SECURITY;
ALTER TABLE registration_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE membership_plans        ENABLE ROW LEVEL SECURITY;
ALTER TABLE memberships             ENABLE ROW LEVEL SECURITY;
ALTER TABLE membership_changes      ENABLE ROW LEVEL SECURITY;
ALTER TABLE discounts               ENABLE ROW LEVEL SECURITY;
ALTER TABLE membership_discounts    ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments                ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_allocations     ENABLE ROW LEVEL SECURITY;
ALTER TABLE charges                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE instalment_schedules    ENABLE ROW LEVEL SECURITY;
ALTER TABLE refunds                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance              ENABLE ROW LEVEL SECURITY;
ALTER TABLE qr_tokens               ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses                ENABLE ROW LEVEL SECURITY;
ALTER TABLE partner_transactions    ENABLE ROW LEVEL SECURITY;
ALTER TABLE gym_closures            ENABLE ROW LEVEL SECURITY;
ALTER TABLE membership_extensions   ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs           ENABLE ROW LEVEL SECURITY;
ALTER TABLE gym_settings            ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- HELPER FUNCTION: resolve gym_id for the current user
-- ============================================================
CREATE OR REPLACE FUNCTION current_partner_gym_id()
RETURNS UUID
LANGUAGE sql STABLE SECURITY DEFINER
AS $$
  SELECT gym_id FROM partners WHERE auth_user_id = auth.uid() AND is_active = true LIMIT 1;
$$;

-- ============================================================
-- GYM — partners can read/write their own gym row
-- ============================================================
CREATE POLICY gym_partner_all ON gym
  USING (id = current_partner_gym_id());

-- ============================================================
-- PARTNERS — can read partners in same gym; only self-update
-- ============================================================
CREATE POLICY partners_read ON partners
  FOR SELECT USING (gym_id = current_partner_gym_id());

CREATE POLICY partners_update_self ON partners
  FOR UPDATE USING (auth_user_id = auth.uid());

-- ============================================================
-- GENERIC HELPER: most tables follow the same gym_id pattern
-- ============================================================
-- Template (applied per table):
--   USING (gym_id = current_partner_gym_id())
-- WITH CHECK (gym_id = current_partner_gym_id())

-- MEMBERS
CREATE POLICY members_partner_all ON members
  USING (gym_id = current_partner_gym_id())
  WITH CHECK (gym_id = current_partner_gym_id());

-- MEMBER TAGS
CREATE POLICY member_tags_partner_all ON member_tags
  USING (gym_id = current_partner_gym_id())
  WITH CHECK (gym_id = current_partner_gym_id());

-- MEMBER TAG ASSIGNMENTS — via members join
CREATE POLICY mta_partner_all ON member_tag_assignments
  USING (
    EXISTS (
      SELECT 1 FROM members m
      WHERE m.id = member_tag_assignments.member_id
        AND m.gym_id = current_partner_gym_id()
    )
  );

-- ============================================================
-- REGISTRATION SUBMISSIONS — public INSERT, partner read/update
-- ============================================================
CREATE POLICY reg_public_insert ON registration_submissions
  FOR INSERT WITH CHECK (true);  -- rate limited at app/edge layer

CREATE POLICY reg_partner_read ON registration_submissions
  FOR SELECT USING (gym_id = current_partner_gym_id());

CREATE POLICY reg_partner_update ON registration_submissions
  FOR UPDATE USING (gym_id = current_partner_gym_id())
  WITH CHECK (gym_id = current_partner_gym_id());

-- ============================================================
-- MEMBERSHIP PLANS
-- ============================================================
CREATE POLICY plans_partner_all ON membership_plans
  USING (gym_id = current_partner_gym_id())
  WITH CHECK (gym_id = current_partner_gym_id());

-- ============================================================
-- MEMBERSHIPS
-- ============================================================
CREATE POLICY memberships_partner_all ON memberships
  USING (gym_id = current_partner_gym_id())
  WITH CHECK (gym_id = current_partner_gym_id());

-- ============================================================
-- MEMBERSHIP CHANGES
-- ============================================================
CREATE POLICY membership_changes_partner_all ON membership_changes
  USING (gym_id = current_partner_gym_id())
  WITH CHECK (gym_id = current_partner_gym_id());

-- ============================================================
-- DISCOUNTS
-- ============================================================
CREATE POLICY discounts_partner_all ON discounts
  USING (gym_id = current_partner_gym_id())
  WITH CHECK (gym_id = current_partner_gym_id());

-- ============================================================
-- MEMBERSHIP DISCOUNTS — via memberships join
-- ============================================================
CREATE POLICY membership_discounts_partner_all ON membership_discounts
  USING (
    EXISTS (
      SELECT 1 FROM memberships ms
      WHERE ms.id = membership_discounts.membership_id
        AND ms.gym_id = current_partner_gym_id()
    )
  );

-- ============================================================
-- PAYMENTS
-- ============================================================
CREATE POLICY payments_partner_all ON payments
  USING (gym_id = current_partner_gym_id())
  WITH CHECK (gym_id = current_partner_gym_id());

-- ============================================================
-- PAYMENT ALLOCATIONS — via payments join
-- ============================================================
CREATE POLICY payment_allocations_partner_all ON payment_allocations
  USING (
    EXISTS (
      SELECT 1 FROM payments p
      WHERE p.id = payment_allocations.payment_id
        AND p.gym_id = current_partner_gym_id()
    )
  );

-- ============================================================
-- CHARGES, INSTALMENT SCHEDULES
-- ============================================================
CREATE POLICY charges_partner_all ON charges
  USING (gym_id = current_partner_gym_id())
  WITH CHECK (gym_id = current_partner_gym_id());

CREATE POLICY instalments_partner_all ON instalment_schedules
  USING (gym_id = current_partner_gym_id())
  WITH CHECK (gym_id = current_partner_gym_id());

-- ============================================================
-- REFUNDS — via payments join
-- ============================================================
CREATE POLICY refunds_partner_all ON refunds
  USING (gym_id = current_partner_gym_id())
  WITH CHECK (gym_id = current_partner_gym_id());

-- ============================================================
-- ATTENDANCE
-- ============================================================
CREATE POLICY attendance_partner_all ON attendance
  USING (gym_id = current_partner_gym_id())
  WITH CHECK (gym_id = current_partner_gym_id());

-- ============================================================
-- QR TOKENS
-- ============================================================
CREATE POLICY qr_tokens_partner_all ON qr_tokens
  USING (gym_id = current_partner_gym_id())
  WITH CHECK (gym_id = current_partner_gym_id());

-- ============================================================
-- EXPENSES, PARTNER TRANSACTIONS, GYM CLOSURES
-- ============================================================
CREATE POLICY expenses_partner_all ON expenses
  USING (gym_id = current_partner_gym_id())
  WITH CHECK (gym_id = current_partner_gym_id());

CREATE POLICY partner_txn_all ON partner_transactions
  USING (gym_id = current_partner_gym_id())
  WITH CHECK (gym_id = current_partner_gym_id());

CREATE POLICY closures_partner_all ON gym_closures
  USING (gym_id = current_partner_gym_id())
  WITH CHECK (gym_id = current_partner_gym_id());

-- ============================================================
-- MEMBERSHIP EXTENSIONS, ACTIVITY LOGS, GYM SETTINGS
-- ============================================================
CREATE POLICY extensions_partner_all ON membership_extensions
  USING (gym_id = current_partner_gym_id())
  WITH CHECK (gym_id = current_partner_gym_id());

CREATE POLICY activity_logs_partner_read ON activity_logs
  FOR SELECT USING (gym_id = current_partner_gym_id());

CREATE POLICY activity_logs_partner_insert ON activity_logs
  FOR INSERT WITH CHECK (gym_id = current_partner_gym_id());

CREATE POLICY gym_settings_partner_all ON gym_settings
  USING (gym_id = current_partner_gym_id())
  WITH CHECK (gym_id = current_partner_gym_id());
