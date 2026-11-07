-- ============================================================
-- EXTENSIONS
-- ============================================================
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- ENUMS
-- ============================================================

CREATE TYPE member_status AS ENUM (
  'pending',      -- registration submitted, not yet approved
  'active',
  'paused',       -- freeze / medical hold
  'expired',
  'archived'
);

CREATE TYPE membership_status AS ENUM (
  'active',
  'paused',
  'cancelled',
  'expired'
);

CREATE TYPE membership_billing_cycle AS ENUM (
  'monthly',
  'quarterly',
  'half_yearly',
  'yearly',
  'custom'       -- arbitrary day count
);

CREATE TYPE payment_method AS ENUM (
  'cash',
  'upi',
  'bank_transfer',
  'card',
  'cheque',
  'adjustment'   -- internal write-off or correction
);

CREATE TYPE payment_status AS ENUM (
  'pending',
  'completed',
  'partially_refunded',
  'refunded',
  'void'
);

CREATE TYPE attendance_method AS ENUM (
  'qr_scan',
  'manual',
  'kiosk'
);

CREATE TYPE expense_category AS ENUM (
  'rent',
  'salary',
  'utilities',
  'equipment',
  'maintenance',
  'marketing',
  'supplies',
  'other'
);

CREATE TYPE transaction_type AS ENUM (
  'credit',
  'debit'
);

CREATE TYPE change_reason AS ENUM (
  'upgrade',
  'downgrade',
  'renewal',
  'cancellation',
  'correction',
  'admin_override'
);

CREATE TYPE discount_type AS ENUM (
  'percentage',
  'flat'          -- fixed paise amount
);
-- ============================================================
-- GYM
-- ============================================================
CREATE TABLE gym (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name              TEXT NOT NULL,
  address           TEXT,
  phone             TEXT,
  email             TEXT,
  gst_number        TEXT,
  logo_url          TEXT,
  timezone          TEXT NOT NULL DEFAULT 'Asia/Kolkata',
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- PARTNERS
-- ============================================================
CREATE TABLE partners (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gym_id            UUID NOT NULL REFERENCES gym(id) ON DELETE CASCADE,
  auth_user_id      UUID NOT NULL UNIQUE,   -- references auth.users(id)
  name              TEXT NOT NULL,
  email             TEXT NOT NULL,
  phone             TEXT,
  role              TEXT NOT NULL DEFAULT 'partner',  -- future: 'admin'|'partner'
  is_active         BOOLEAN NOT NULL DEFAULT true,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_partners_gym_id        ON partners(gym_id);
CREATE INDEX idx_partners_auth_user_id  ON partners(auth_user_id);

-- ============================================================
-- MEMBERS
-- ============================================================
CREATE TABLE members (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gym_id              UUID NOT NULL REFERENCES gym(id) ON DELETE CASCADE,
  full_name           TEXT NOT NULL,
  phone               TEXT NOT NULL,
  email               TEXT,
  date_of_birth       DATE,
  gender              TEXT,                 -- 'male'|'female'|'other'|null
  address             TEXT,
  emergency_contact   TEXT,
  photo_url           TEXT,
  status              member_status NOT NULL DEFAULT 'pending',
  join_date           DATE,
  notes               TEXT,
  archived_at         TIMESTAMPTZ,
  archived_by         UUID REFERENCES partners(id),
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_members_gym_id    ON members(gym_id);
CREATE INDEX idx_members_phone     ON members(gym_id, phone);
CREATE INDEX idx_members_status    ON members(gym_id, status);
CREATE INDEX idx_members_name_trgm ON members USING gin(full_name gin_trgm_ops);

-- ============================================================
-- MEMBER TAGS
-- ============================================================
CREATE TABLE member_tags (
  id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gym_id    UUID NOT NULL REFERENCES gym(id) ON DELETE CASCADE,
  name      TEXT NOT NULL,
  color     TEXT NOT NULL DEFAULT '#6B7280',
  UNIQUE(gym_id, name)
);

CREATE TABLE member_tag_assignments (
  member_id   UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  tag_id      UUID NOT NULL REFERENCES member_tags(id) ON DELETE CASCADE,
  assigned_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  assigned_by UUID REFERENCES partners(id),
  PRIMARY KEY (member_id, tag_id)
);

-- ============================================================
-- REGISTRATION SUBMISSIONS (public form)
-- ============================================================
CREATE TABLE registration_submissions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gym_id          UUID NOT NULL REFERENCES gym(id),
  full_name       TEXT NOT NULL,
  phone           TEXT NOT NULL,
  email           TEXT,
  date_of_birth   DATE,
  gender          TEXT,
  address         TEXT,
  notes           TEXT,
  submitted_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  reviewed_at     TIMESTAMPTZ,
  reviewed_by     UUID REFERENCES partners(id),
  member_id       UUID REFERENCES members(id),   -- set after approval
  status          TEXT NOT NULL DEFAULT 'pending' -- 'pending'|'approved'|'rejected'
);

CREATE INDEX idx_reg_submissions_gym_id ON registration_submissions(gym_id, status);
-- ============================================================
-- MEMBERSHIP PLANS
-- ============================================================
CREATE TABLE membership_plans (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gym_id          UUID NOT NULL REFERENCES gym(id) ON DELETE CASCADE,
  name            TEXT NOT NULL,
  description     TEXT,
  billing_cycle   membership_billing_cycle NOT NULL,
  duration_days   INTEGER,                   -- for 'custom' billing_cycle
  price_paise     INTEGER NOT NULL CHECK (price_paise >= 0),
  features        TEXT[],                    -- list of included features
  is_active       BOOLEAN NOT NULL DEFAULT true,
  sort_order      INTEGER NOT NULL DEFAULT 0,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_plans_gym_id ON membership_plans(gym_id, is_active);

-- ============================================================
-- MEMBERSHIPS
-- ============================================================
CREATE TABLE memberships (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gym_id          UUID NOT NULL REFERENCES gym(id) ON DELETE CASCADE,
  member_id       UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  plan_id         UUID NOT NULL REFERENCES membership_plans(id),
  status          membership_status NOT NULL DEFAULT 'active',
  start_date      DATE NOT NULL,
  end_date        DATE NOT NULL,
  price_paise     INTEGER NOT NULL CHECK (price_paise >= 0), -- price at time of purchase (snapshot)
  paid_paise      INTEGER NOT NULL DEFAULT 0 CHECK (paid_paise >= 0),
  balance_paise   INTEGER GENERATED ALWAYS AS (price_paise - paid_paise) STORED,
  paused_at       TIMESTAMPTZ,
  paused_by       UUID REFERENCES partners(id),
  cancelled_at    TIMESTAMPTZ,
  cancelled_by    UUID REFERENCES partners(id),
  cancel_reason   TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_memberships_member_id ON memberships(member_id);
CREATE INDEX idx_memberships_gym_id    ON memberships(gym_id, status);
CREATE INDEX idx_memberships_dates     ON memberships(gym_id, end_date);

-- ============================================================
-- MEMBERSHIP CHANGES (audit trail)
-- ============================================================
CREATE TABLE membership_changes (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  membership_id     UUID NOT NULL REFERENCES memberships(id) ON DELETE CASCADE,
  gym_id            UUID NOT NULL REFERENCES gym(id),
  changed_by        UUID NOT NULL REFERENCES partners(id),
  change_reason     change_reason NOT NULL,
  previous_plan_id  UUID REFERENCES membership_plans(id),
  new_plan_id       UUID REFERENCES membership_plans(id),
  previous_end_date DATE,
  new_end_date      DATE,
  note              TEXT,
  changed_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- DISCOUNTS
-- ============================================================
CREATE TABLE discounts (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gym_id          UUID NOT NULL REFERENCES gym(id) ON DELETE CASCADE,
  name            TEXT NOT NULL,
  description     TEXT,
  type            discount_type NOT NULL,
  value_paise     INTEGER,          -- flat paise if type='flat'
  percentage      NUMERIC(5,2),     -- e.g. 10.50 if type='percentage'
  max_uses        INTEGER,          -- null = unlimited
  uses_count      INTEGER NOT NULL DEFAULT 0,
  valid_from      DATE,
  valid_until     DATE,
  is_active       BOOLEAN NOT NULL DEFAULT true,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE membership_discounts (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  membership_id   UUID NOT NULL REFERENCES memberships(id) ON DELETE CASCADE,
  discount_id     UUID NOT NULL REFERENCES discounts(id),
  applied_by      UUID NOT NULL REFERENCES partners(id),
  discount_paise  INTEGER NOT NULL,  -- actual amount saved (paise)
  applied_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- MEMBERSHIP EXTENSIONS
-- ============================================================
CREATE TABLE membership_extensions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  membership_id   UUID NOT NULL REFERENCES memberships(id) ON DELETE CASCADE,
  gym_id          UUID NOT NULL REFERENCES gym(id),
  extended_by_id  UUID NOT NULL REFERENCES partners(id),
  days_added      INTEGER NOT NULL CHECK (days_added > 0),
  reason          TEXT NOT NULL,
  previous_end    DATE NOT NULL,
  new_end         DATE NOT NULL,
  extended_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);
-- ============================================================
-- PAYMENTS
-- ============================================================
CREATE TABLE payments (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gym_id          UUID NOT NULL REFERENCES gym(id) ON DELETE CASCADE,
  member_id       UUID NOT NULL REFERENCES members(id),
  received_by     UUID NOT NULL REFERENCES partners(id),
  method          payment_method NOT NULL,
  amount_paise    INTEGER NOT NULL CHECK (amount_paise > 0),
  status          payment_status NOT NULL DEFAULT 'completed',
  reference       TEXT,                    -- UPI ref, cheque no, etc.
  note            TEXT,
  paid_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  -- Correction fields
  is_correction   BOOLEAN NOT NULL DEFAULT false,
  original_id     UUID REFERENCES payments(id),
  corrected_by    UUID REFERENCES partners(id),
  corrected_at    TIMESTAMPTZ,
  correction_reason TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_payments_gym_id    ON payments(gym_id, paid_at DESC);
CREATE INDEX idx_payments_member_id ON payments(member_id, paid_at DESC);

-- ============================================================
-- PAYMENT ALLOCATIONS (FIFO)
-- ============================================================
CREATE TABLE payment_allocations (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_id      UUID NOT NULL REFERENCES payments(id) ON DELETE CASCADE,
  membership_id   UUID NOT NULL REFERENCES memberships(id),
  amount_paise    INTEGER NOT NULL CHECK (amount_paise > 0),
  allocated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_allocations_payment_id    ON payment_allocations(payment_id);
CREATE INDEX idx_allocations_membership_id ON payment_allocations(membership_id);

-- ============================================================
-- CHARGES (ad-hoc fees: locker, towel, etc.)
-- ============================================================
CREATE TABLE charges (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gym_id          UUID NOT NULL REFERENCES gym(id),
  member_id       UUID NOT NULL REFERENCES members(id),
  created_by      UUID NOT NULL REFERENCES partners(id),
  description     TEXT NOT NULL,
  amount_paise    INTEGER NOT NULL CHECK (amount_paise > 0),
  paid_paise      INTEGER NOT NULL DEFAULT 0,
  charged_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- INSTALMENT SCHEDULES
-- ============================================================
CREATE TABLE instalment_schedules (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  membership_id   UUID NOT NULL REFERENCES memberships(id),
  gym_id          UUID NOT NULL REFERENCES gym(id),
  instalment_no   INTEGER NOT NULL,
  due_date        DATE NOT NULL,
  amount_paise    INTEGER NOT NULL CHECK (amount_paise > 0),
  paid_at         TIMESTAMPTZ,
  payment_id      UUID REFERENCES payments(id),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- REFUNDS
-- ============================================================
CREATE TABLE refunds (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gym_id          UUID NOT NULL REFERENCES gym(id),
  payment_id      UUID NOT NULL REFERENCES payments(id),
  processed_by    UUID NOT NULL REFERENCES partners(id),
  amount_paise    INTEGER NOT NULL CHECK (amount_paise > 0),
  method          payment_method NOT NULL,
  reason          TEXT NOT NULL,
  reference       TEXT,
  refunded_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_refunds_payment_id ON refunds(payment_id);
-- ============================================================
-- QR TOKENS
-- ============================================================
CREATE TABLE qr_tokens (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gym_id          UUID NOT NULL REFERENCES gym(id),
  member_id       UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  token           TEXT NOT NULL UNIQUE,     -- high-entropy random string
  issued_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at      TIMESTAMPTZ,              -- null = never expires
  revoked_at      TIMESTAMPTZ,
  revoked_by      UUID REFERENCES partners(id)
);

CREATE INDEX idx_qr_tokens_token     ON qr_tokens(token);
CREATE INDEX idx_qr_tokens_member_id ON qr_tokens(member_id);

-- ============================================================
-- ATTENDANCE
-- ============================================================
CREATE TABLE attendance (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gym_id          UUID NOT NULL REFERENCES gym(id),
  member_id       UUID NOT NULL REFERENCES members(id),
  membership_id   UUID REFERENCES memberships(id),
  method          attendance_method NOT NULL,
  checked_in_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  checked_in_by   UUID REFERENCES partners(id),   -- null for self-scan kiosk
  device_id       TEXT,                            -- for offline dedup
  note            TEXT,
  -- Correction fields
  is_correction   BOOLEAN NOT NULL DEFAULT false,
  original_id     UUID REFERENCES attendance(id),
  corrected_by    UUID REFERENCES partners(id),
  corrected_at    TIMESTAMPTZ,
  correction_reason TEXT
);

CREATE INDEX idx_attendance_gym_id      ON attendance(gym_id, checked_in_at DESC);
CREATE INDEX idx_attendance_member_id   ON attendance(member_id, checked_in_at DESC);
CREATE INDEX idx_attendance_date        ON attendance(gym_id, DATE(checked_in_at AT TIME ZONE 'Asia/Kolkata'));
-- Prevent duplicate offline sync
CREATE UNIQUE INDEX idx_attendance_device_dedup
  ON attendance(device_id, member_id, DATE(checked_in_at AT TIME ZONE 'Asia/Kolkata'))
  WHERE device_id IS NOT NULL AND is_correction = false;
-- ============================================================
-- EXPENSES
-- ============================================================
CREATE TABLE expenses (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gym_id          UUID NOT NULL REFERENCES gym(id),
  recorded_by     UUID NOT NULL REFERENCES partners(id),
  category        expense_category NOT NULL,
  description     TEXT NOT NULL,
  amount_paise    INTEGER NOT NULL CHECK (amount_paise > 0),
  expense_date    DATE NOT NULL,
  receipt_url     TEXT,
  note            TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_expenses_gym_id      ON expenses(gym_id, expense_date DESC);
CREATE INDEX idx_expenses_category    ON expenses(gym_id, category);

-- ============================================================
-- PARTNER TRANSACTIONS (revenue split tracking)
-- ============================================================
CREATE TABLE partner_transactions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gym_id          UUID NOT NULL REFERENCES gym(id),
  partner_id      UUID NOT NULL REFERENCES partners(id),
  type            transaction_type NOT NULL,
  amount_paise    INTEGER NOT NULL CHECK (amount_paise > 0),
  description     TEXT NOT NULL,
  reference_id    UUID,          -- payment_id or expense_id
  transaction_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_partner_txn_gym     ON partner_transactions(gym_id, transaction_at DESC);
CREATE INDEX idx_partner_txn_partner ON partner_transactions(partner_id);

-- ============================================================
-- GYM CLOSURES (holidays, maintenance)
-- ============================================================
CREATE TABLE gym_closures (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gym_id          UUID NOT NULL REFERENCES gym(id),
  created_by      UUID NOT NULL REFERENCES partners(id),
  start_date      DATE NOT NULL,
  end_date        DATE NOT NULL,
  reason          TEXT NOT NULL,
  auto_extend     BOOLEAN NOT NULL DEFAULT true,  -- extend memberships by closure days
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- ACTIVITY LOGS (generic audit trail)
-- ============================================================
CREATE TABLE activity_logs (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gym_id          UUID NOT NULL REFERENCES gym(id),
  actor_id        UUID REFERENCES partners(id),
  action          TEXT NOT NULL,              -- e.g. 'member.archived'
  entity_type     TEXT NOT NULL,              -- e.g. 'member'
  entity_id       UUID,
  payload         JSONB,                      -- before/after snapshot
  ip_address      INET,
  user_agent      TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_activity_gym_id    ON activity_logs(gym_id, created_at DESC);
CREATE INDEX idx_activity_entity    ON activity_logs(entity_type, entity_id);

-- ============================================================
-- GYM SETTINGS (key-value store per gym)
-- ============================================================
CREATE TABLE gym_settings (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gym_id          UUID NOT NULL REFERENCES gym(id) ON DELETE CASCADE,
  key             TEXT NOT NULL,
  value           JSONB,
  updated_by      UUID REFERENCES partners(id),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(gym_id, key)
);
