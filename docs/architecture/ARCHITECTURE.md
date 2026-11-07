# Paradise Gym Management PWA — Architecture Design

> **Version:** 1.0.0  
> **Date:** 2026-11-07  
> **Status:** Authoritative — all implementation decisions follow this document

---

## Table of Contents

1. [Project Structure](#1-project-structure)
2. [Full Database Schema](#2-full-database-schema-sql)
3. [Row Level Security Policies](#3-row-level-security-policies)
4. [TypeScript Types](#4-typescript-types)
5. [Service Layer Design](#5-service-layer-design)
6. [Offline Strategy](#6-offline-strategy)
7. [PWA Configuration](#7-pwa-configuration)
8. [Component Architecture](#8-component-architecture)
9. [State Management](#9-state-management)
10. [Key ADRs](#10-key-adrs-architecture-decision-records)
11. [Environment Variables](#11-environment-variables)
12. [Security Checklist](#12-security-checklist)

---

## 1. Project Structure

```
Paradise-gym/
├── docs/
│   └── architecture/
│       └── ARCHITECTURE.md          ← this file
├── public/
│   ├── manifest.webmanifest          ← PWA manifest
│   ├── icons/
│   │   ├── icon-72x72.png
│   │   ├── icon-96x96.png
│   │   ├── icon-128x128.png
│   │   ├── icon-144x144.png
│   │   ├── icon-192x192.png
│   │   ├── icon-384x384.png
│   │   └── icon-512x512.png
│   └── robots.txt
├── src/
│   ├── App.tsx                       ← root component, router
│   ├── main.tsx                      ← Vite entry point
│   ├── sw.ts                         ← Workbox service worker
│   │
│   ├── components/                   ← shared/reusable UI
│   │   ├── layout/
│   │   │   ├── AppShell.tsx
│   │   │   ├── BottomNav.tsx
│   │   │   └── TopBar.tsx
│   │   ├── auth/
│   │   │   └── AuthGuard.tsx
│   │   ├── members/
│   │   │   ├── MemberCard.tsx
│   │   │   ├── MemberSearch.tsx
│   │   │   └── MemberStatusBadge.tsx
│   │   ├── payments/
│   │   │   ├── PaymentBreakdown.tsx
│   │   │   └── PaymentMethodIcon.tsx
│   │   ├── attendance/
│   │   │   ├── QRScanner.tsx
│   │   │   └── AttendanceLogRow.tsx
│   │   ├── common/
│   │   │   ├── QRCodeDisplay.tsx
│   │   │   ├── WhatsAppButton.tsx
│   │   │   ├── MoneyDisplay.tsx
│   │   │   ├── Toast.tsx
│   │   │   ├── Spinner.tsx
│   │   │   ├── EmptyState.tsx
│   │   │   ├── ConfirmDialog.tsx
│   │   │   └── OfflineBanner.tsx
│   │   └── forms/
│   │       ├── FormField.tsx
│   │       ├── PhoneInput.tsx
│   │       └── DatePicker.tsx
│   │
│   ├── pages/                        ← route-level page components
│   │   ├── auth/
│   │   │   └── LoginPage.tsx
│   │   ├── setup/
│   │   │   └── SetupWizard.tsx
│   │   ├── dashboard/
│   │   │   └── DashboardPage.tsx
│   │   ├── members/
│   │   │   ├── MemberListPage.tsx
│   │   │   ├── MemberDetailPage.tsx
│   │   │   ├── MemberFormPage.tsx
│   │   │   └── RegistrationReviewPage.tsx
│   │   ├── attendance/
│   │   │   └── AttendanceScannerPage.tsx
│   │   ├── payments/
│   │   │   └── PaymentFormPage.tsx
│   │   ├── expenses/
│   │   │   └── ExpenseFormPage.tsx
│   │   ├── reports/
│   │   │   └── ReportsPage.tsx
│   │   ├── settings/
│   │   │   └── SettingsPage.tsx
│   │   └── demo/
│   │       └── DemoModePage.tsx
│   │
│   ├── hooks/                        ← custom React hooks
│   │   ├── useAuth.ts
│   │   ├── useOffline.ts
│   │   ├── useSyncQueue.ts
│   │   ├── useMembers.ts
│   │   ├── useMemberships.ts
│   │   ├── useAttendance.ts
│   │   ├── usePayments.ts
│   │   ├── useExpenses.ts
│   │   ├── useReports.ts
│   │   └── useQRScanner.ts
│   │
│   ├── lib/
│   │   ├── supabase.ts               ← Supabase client singleton
│   │   ├── db/
│   │   │   ├── index.ts              ← idb database open + upgrade
│   │   │   ├── offlineAttendance.ts  ← store helpers
│   │   │   ├── memberCache.ts        ← store helpers
│   │   │   └── syncQueue.ts          ← store helpers
│   │   └── constants.ts
│   │
│   ├── services/                     ← business logic, Supabase calls
│   │   ├── memberService.ts
│   │   ├── membershipService.ts
│   │   ├── paymentService.ts
│   │   ├── attendanceService.ts
│   │   ├── expenseService.ts
│   │   ├── reportService.ts
│   │   ├── qrService.ts
│   │   └── whatsappService.ts
│   │
│   ├── stores/                       ← Zustand global state
│   │   ├── authStore.ts
│   │   ├── uiStore.ts
│   │   └── offlineStore.ts
│   │
│   ├── types/
│   │   ├── database.ts               ← raw DB row types
│   │   └── domain.ts                 ← app-level types (Money, etc.)
│   │
│   └── utils/
│       ├── money.ts                  ← paise ↔ rupee formatting
│       ├── date.ts                   ← IST formatting, range helpers
│       ├── phone.ts                  ← E.164 normalisation
│       ├── whatsapp.ts               ← URL builder
│       └── csv.ts                    ← export helpers
│
├── supabase/
│   └── migrations/
│       ├── 0001_enums.sql
│       ├── 0002_core_tables.sql
│       ├── 0003_membership_tables.sql
│       ├── 0004_payment_tables.sql
│       ├── 0005_attendance_qr.sql
│       ├── 0006_financial_tables.sql
│       ├── 0007_rls_policies.sql
│       └── 0008_seed_gym_settings.sql
│
├── tests/                            ← Vitest unit tests
│   ├── services/
│   │   ├── memberService.test.ts
│   │   ├── membershipService.test.ts
│   │   ├── paymentService.test.ts
│   │   └── attendanceService.test.ts
│   └── utils/
│       ├── money.test.ts
│       └── date.test.ts
│
├── e2e/                              ← Playwright E2E tests
│   ├── auth.spec.ts
│   ├── member-flow.spec.ts
│   ├── attendance.spec.ts
│   └── payment-flow.spec.ts
│
├── .env.example
├── .env.local                        ← git-ignored
├── index.html
├── vite.config.ts
├── tailwind.config.ts
├── tsconfig.json
├── vitest.config.ts
├── playwright.config.ts
└── package.json
```

---

## 2. Full Database Schema (SQL)

> **Convention:** Monetary values stored as `INTEGER` (paise, 1 INR = 100 paise). All timestamps `TIMESTAMPTZ` stored UTC, displayed in `Asia/Kolkata`. Primary keys are `UUID` via `gen_random_uuid()`.

### 0001_enums.sql

```sql
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
```

### 0002_core_tables.sql

```sql
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
```

### 0003_membership_tables.sql

```sql
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
```

### 0004_payment_tables.sql

```sql
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
```

### 0005_attendance_qr.sql

```sql
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
```

### 0006_financial_tables.sql

```sql
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
```

---

## 3. Row Level Security Policies

```sql
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
```

---

## 4. TypeScript Types

### src/types/database.ts

```typescript
// Raw database row types — 1-to-1 with Postgres columns.
// Monetary values are INTEGER paise. Timestamps are ISO strings from Supabase.

export type MemberStatus = 'pending' | 'active' | 'paused' | 'expired' | 'archived';
export type MembershipStatus = 'active' | 'paused' | 'cancelled' | 'expired';
export type MembershipBillingCycle = 'monthly' | 'quarterly' | 'half_yearly' | 'yearly' | 'custom';
export type PaymentMethod = 'cash' | 'upi' | 'bank_transfer' | 'card' | 'cheque' | 'adjustment';
export type PaymentStatus = 'pending' | 'completed' | 'partially_refunded' | 'refunded' | 'void';
export type AttendanceMethod = 'qr_scan' | 'manual' | 'kiosk';
export type ExpenseCategory = 'rent' | 'salary' | 'utilities' | 'equipment' | 'maintenance' | 'marketing' | 'supplies' | 'other';
export type TransactionType = 'credit' | 'debit';
export type ChangeReason = 'upgrade' | 'downgrade' | 'renewal' | 'cancellation' | 'correction' | 'admin_override';
export type DiscountType = 'percentage' | 'flat';

export interface DbGym {
  id: string;
  name: string;
  address: string | null;
  phone: string | null;
  email: string | null;
  gst_number: string | null;
  logo_url: string | null;
  timezone: string;
  created_at: string;
  updated_at: string;
}

export interface DbPartner {
  id: string;
  gym_id: string;
  auth_user_id: string;
  name: string;
  email: string;
  phone: string | null;
  role: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface DbMember {
  id: string;
  gym_id: string;
  full_name: string;
  phone: string;
  email: string | null;
  date_of_birth: string | null;   // ISO date YYYY-MM-DD
  gender: string | null;
  address: string | null;
  emergency_contact: string | null;
  photo_url: string | null;
  status: MemberStatus;
  join_date: string | null;
  notes: string | null;
  archived_at: string | null;
  archived_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface DbMemberTag {
  id: string;
  gym_id: string;
  name: string;
  color: string;
}

export interface DbMemberTagAssignment {
  member_id: string;
  tag_id: string;
  assigned_at: string;
  assigned_by: string | null;
}

export interface DbRegistrationSubmission {
  id: string;
  gym_id: string;
  full_name: string;
  phone: string;
  email: string | null;
  date_of_birth: string | null;
  gender: string | null;
  address: string | null;
  notes: string | null;
  submitted_at: string;
  reviewed_at: string | null;
  reviewed_by: string | null;
  member_id: string | null;
  status: 'pending' | 'approved' | 'rejected';
}

export interface DbMembershipPlan {
  id: string;
  gym_id: string;
  name: string;
  description: string | null;
  billing_cycle: MembershipBillingCycle;
  duration_days: number | null;
  price_paise: number;
  features: string[] | null;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface DbMembership {
  id: string;
  gym_id: string;
  member_id: string;
  plan_id: string;
  status: MembershipStatus;
  start_date: string;
  end_date: string;
  price_paise: number;
  paid_paise: number;
  balance_paise: number;    // generated column
  paused_at: string | null;
  paused_by: string | null;
  cancelled_at: string | null;
  cancelled_by: string | null;
  cancel_reason: string | null;
  created_at: string;
  updated_at: string;
}

export interface DbMembershipChange {
  id: string;
  membership_id: string;
  gym_id: string;
  changed_by: string;
  change_reason: ChangeReason;
  previous_plan_id: string | null;
  new_plan_id: string | null;
  previous_end_date: string | null;
  new_end_date: string | null;
  note: string | null;
  changed_at: string;
}

export interface DbDiscount {
  id: string;
  gym_id: string;
  name: string;
  description: string | null;
  type: DiscountType;
  value_paise: number | null;
  percentage: number | null;
  max_uses: number | null;
  uses_count: number;
  valid_from: string | null;
  valid_until: string | null;
  is_active: boolean;
  created_at: string;
}

export interface DbMembershipDiscount {
  id: string;
  membership_id: string;
  discount_id: string;
  applied_by: string;
  discount_paise: number;
  applied_at: string;
}

export interface DbPayment {
  id: string;
  gym_id: string;
  member_id: string;
  received_by: string;
  method: PaymentMethod;
  amount_paise: number;
  status: PaymentStatus;
  reference: string | null;
  note: string | null;
  paid_at: string;
  is_correction: boolean;
  original_id: string | null;
  corrected_by: string | null;
  corrected_at: string | null;
  correction_reason: string | null;
  created_at: string;
}

export interface DbPaymentAllocation {
  id: string;
  payment_id: string;
  membership_id: string;
  amount_paise: number;
  allocated_at: string;
}

export interface DbCharge {
  id: string;
  gym_id: string;
  member_id: string;
  created_by: string;
  description: string;
  amount_paise: number;
  paid_paise: number;
  charged_at: string;
}

export interface DbInstalmentSchedule {
  id: string;
  membership_id: string;
  gym_id: string;
  instalment_no: number;
  due_date: string;
  amount_paise: number;
  paid_at: string | null;
  payment_id: string | null;
  created_at: string;
}

export interface DbRefund {
  id: string;
  gym_id: string;
  payment_id: string;
  processed_by: string;
  amount_paise: number;
  method: PaymentMethod;
  reason: string;
  reference: string | null;
  refunded_at: string;
}

export interface DbAttendance {
  id: string;
  gym_id: string;
  member_id: string;
  membership_id: string | null;
  method: AttendanceMethod;
  checked_in_at: string;
  checked_in_by: string | null;
  device_id: string | null;
  note: string | null;
  is_correction: boolean;
  original_id: string | null;
  corrected_by: string | null;
  corrected_at: string | null;
  correction_reason: string | null;
}

export interface DbQrToken {
  id: string;
  gym_id: string;
  member_id: string;
  token: string;
  issued_at: string;
  expires_at: string | null;
  revoked_at: string | null;
  revoked_by: string | null;
}

export interface DbExpense {
  id: string;
  gym_id: string;
  recorded_by: string;
  category: ExpenseCategory;
  description: string;
  amount_paise: number;
  expense_date: string;
  receipt_url: string | null;
  note: string | null;
  created_at: string;
  updated_at: string;
}

export interface DbPartnerTransaction {
  id: string;
  gym_id: string;
  partner_id: string;
  type: TransactionType;
  amount_paise: number;
  description: string;
  reference_id: string | null;
  transaction_at: string;
}

export interface DbGymClosure {
  id: string;
  gym_id: string;
  created_by: string;
  start_date: string;
  end_date: string;
  reason: string;
  auto_extend: boolean;
  created_at: string;
}

export interface DbMembershipExtension {
  id: string;
  membership_id: string;
  gym_id: string;
  extended_by_id: string;
  days_added: number;
  reason: string;
  previous_end: string;
  new_end: string;
  extended_at: string;
}

export interface DbActivityLog {
  id: string;
  gym_id: string;
  actor_id: string | null;
  action: string;
  entity_type: string;
  entity_id: string | null;
  payload: Record<string, unknown> | null;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
}

export interface DbGymSettings {
  id: string;
  gym_id: string;
  key: string;
  value: unknown;
  updated_by: string | null;
  updated_at: string;
}
```

### src/types/domain.ts

```typescript
/**
 * Application-level types.
 *
 * Money type: INTEGER paise (1 INR = 100 paise).
 * Always store and pass as paise; format for display using utils/money.ts.
 */

/** Monetary amount in paise (1 INR = 100 paise). Never use floating-point math. */
export type Money = number;

/** ISO date string YYYY-MM-DD */
export type ISODate = string;

/** ISO datetime string with timezone (from Supabase) */
export type ISODatetime = string;

// Re-export status enums from database types for use in domain logic
export type {
  MemberStatus,
  MembershipStatus,
  PaymentMethod,
  AttendanceMethod,
  ExpenseCategory,
  DiscountType,
  ChangeReason,
} from './database';

/** Gym as used in the application */
export interface Gym {
  id: string;
  name: string;
  address: string | null;
  phone: string | null;
  email: string | null;
  gstNumber: string | null;
  logoUrl: string | null;
  timezone: string;
}

/** Partner (authenticated user) */
export interface Partner {
  id: string;
  gymId: string;
  authUserId: string;
  name: string;
  email: string;
  phone: string | null;
  role: string;
}

/** Member with optional eager-loaded relations */
export interface Member {
  id: string;
  gymId: string;
  fullName: string;
  phone: string;
  email: string | null;
  dateOfBirth: ISODate | null;
  gender: string | null;
  address: string | null;
  emergencyContact: string | null;
  photoUrl: string | null;
  status: import('./database').MemberStatus;
  joinDate: ISODate | null;
  notes: string | null;
  archivedAt: ISODatetime | null;
  createdAt: ISODatetime;
  // Optionally joined
  activeMembership?: Membership | null;
  tags?: MemberTag[];
}

export interface MemberTag {
  id: string;
  gymId: string;
  name: string;
  color: string;
}

export interface MembershipPlan {
  id: string;
  gymId: string;
  name: string;
  description: string | null;
  billingCycle: import('./database').MembershipBillingCycle;
  durationDays: number | null;
  /** Price in paise */
  pricePaise: Money;
  features: string[];
  isActive: boolean;
  sortOrder: number;
}

export interface Membership {
  id: string;
  gymId: string;
  memberId: string;
  planId: string;
  status: import('./database').MembershipStatus;
  startDate: ISODate;
  endDate: ISODate;
  /** Snapshot price at purchase time, in paise */
  pricePaise: Money;
  /** Total paid so far, in paise */
  paidPaise: Money;
  /** Outstanding balance = pricePaise - paidPaise, in paise */
  balancePaise: Money;
  pausedAt: ISODatetime | null;
  cancelledAt: ISODatetime | null;
  cancelReason: string | null;
  createdAt: ISODatetime;
}

export interface Payment {
  id: string;
  gymId: string;
  memberId: string;
  receivedBy: string;
  method: import('./database').PaymentMethod;
  /** Amount in paise */
  amountPaise: Money;
  status: import('./database').PaymentStatus;
  reference: string | null;
  note: string | null;
  paidAt: ISODatetime;
  isCorrection: boolean;
  originalId: string | null;
}

export interface PaymentAllocation {
  id: string;
  paymentId: string;
  membershipId: string;
  /** Amount allocated, in paise */
  amountPaise: Money;
  allocatedAt: ISODatetime;
}

export interface Expense {
  id: string;
  gymId: string;
  recordedBy: string;
  category: import('./database').ExpenseCategory;
  description: string;
  /** Amount in paise */
  amountPaise: Money;
  expenseDate: ISODate;
  receiptUrl: string | null;
  note: string | null;
  createdAt: ISODatetime;
}

export interface AttendanceRecord {
  id: string;
  gymId: string;
  memberId: string;
  membershipId: string | null;
  method: import('./database').AttendanceMethod;
  checkedInAt: ISODatetime;
  checkedInBy: string | null;
  deviceId: string | null;
  note: string | null;
}

export interface QrToken {
  id: string;
  gymId: string;
  memberId: string;
  token: string;
  issuedAt: ISODatetime;
  expiresAt: ISODatetime | null;
  revokedAt: ISODatetime | null;
}

/** Financial summary for dashboard / reports */
export interface FinancialSummary {
  period: { from: ISODate; to: ISODate };
  /** Total revenue collected in paise */
  totalRevenuePaise: Money;
  /** Total expenses in paise */
  totalExpensesPaise: Money;
  /** Net = revenue - expenses, in paise */
  netPaise: Money;
  /** Outstanding dues across all active memberships, in paise */
  outstandingPaise: Money;
  newMembersCount: number;
  renewalsCount: number;
  attendanceCount: number;
}

/** Offline attendance record pending sync */
export interface PendingAttendance {
  localId: string;         // IDB key
  gymId: string;
  memberId: string;
  membershipId: string | null;
  method: import('./database').AttendanceMethod;
  checkedInAt: ISODatetime;
  deviceId: string;
  retryCount: number;
  createdAt: ISODatetime;
}

/** Member data cached for offline QR validation */
export interface CachedMember {
  id: string;
  gymId: string;
  fullName: string;
  phone: string;
  photoUrl: string | null;
  status: import('./database').MemberStatus;
  activeMembershipEndDate: ISODate | null;
  qrToken: string | null;
  cachedAt: ISODatetime;
}
```

---

## 5. Service Layer Design

All services accept a `supabase` client instance and return typed results. Errors are thrown as typed `ServiceError` objects.

```typescript
// src/services/_types.ts
export class ServiceError extends Error {
  constructor(
    public code: string,
    message: string,
    public cause?: unknown
  ) {
    super(message);
    this.name = 'ServiceError';
  }
}
```

### memberService.ts

```typescript
export interface RegisterMemberInput {
  gymId: string;
  fullName: string;
  phone: string;
  email?: string;
  dateOfBirth?: string;
  gender?: string;
  address?: string;
  planId: string;
  startDate: string;
  pricePaise: Money;
  discountId?: string;
  notes?: string;
}

export interface MemberSearchOptions {
  gymId: string;
  query?: string;         // name or phone
  status?: MemberStatus[];
  tags?: string[];
  page?: number;
  pageSize?: number;
}

export interface MemberService {
  /** Register a new member and create their initial membership */
  registerMember(input: RegisterMemberInput, partnerId: string): Promise<Member>;

  /** Approve a pending registration submission and create a member record */
  approveRegistration(submissionId: string, partnerId: string, planId: string, startDate: string): Promise<Member>;

  /** Reject a pending registration submission */
  rejectRegistration(submissionId: string, partnerId: string, reason?: string): Promise<void>;

  /** Soft-archive a member (sets archived_at, status = 'archived') */
  archiveMember(memberId: string, partnerId: string, reason?: string): Promise<void>;

  /** Restore an archived member to 'active' status */
  restoreMember(memberId: string, partnerId: string): Promise<Member>;

  /** Search members with filtering and pagination */
  searchMembers(options: MemberSearchOptions): Promise<{ data: Member[]; total: number }>;

  /** Fetch a single member with active membership and tags */
  getMemberById(memberId: string): Promise<Member | null>;

  /** Update member profile fields */
  updateMember(memberId: string, updates: Partial<RegisterMemberInput>, partnerId: string): Promise<Member>;

  /** Assign/remove tags on a member */
  updateMemberTags(memberId: string, tagIds: string[], partnerId: string): Promise<void>;

  /** Bulk import from CSV — returns array of created member IDs */
  importMembers(gymId: string, rows: RegisterMemberInput[], partnerId: string): Promise<string[]>;

  /** Export members to CSV string */
  exportMembersCsv(gymId: string, filters?: MemberSearchOptions): Promise<string>;
}
```

### membershipService.ts

```typescript
export interface CreateMembershipInput {
  gymId: string;
  memberId: string;
  planId: string;
  startDate: string;
  pricePaise: Money;        // may differ from plan price (negotiated)
  discountId?: string;
  notes?: string;
}

export interface ProrateResult {
  daysRemaining: number;
  creditPaise: Money;
  newPricePaise: Money;
}

export interface MembershipService {
  /** Create a new membership for a member */
  createMembership(input: CreateMembershipInput, partnerId: string): Promise<Membership>;

  /** Renew expiring/expired membership — creates a new membership row */
  renewMembership(membershipId: string, planId: string, startDate: string, pricePaise: Money, partnerId: string): Promise<Membership>;

  /** Cancel an active membership */
  cancelMembership(membershipId: string, partnerId: string, reason: string): Promise<void>;

  /** Pause a membership (e.g. medical hold) */
  pauseMembership(membershipId: string, partnerId: string, reason?: string): Promise<void>;

  /** Resume a paused membership, extending end_date by paused days */
  resumeMembership(membershipId: string, partnerId: string): Promise<Membership>;

  /** Upgrade or downgrade plan — calculates prorated credit */
  changePlan(membershipId: string, newPlanId: string, partnerId: string, reason: ChangeReason): Promise<{ membership: Membership; prorate: ProrateResult }>;

  /** Extend membership end date without additional charge (closure compensation, goodwill) */
  extendMembership(membershipId: string, daysToAdd: number, reason: string, partnerId: string): Promise<Membership>;

  /** Calculate prorated credit for mid-cycle plan change */
  calculateProrate(membershipId: string, changeDate: string): Promise<ProrateResult>;

  /** Get the active membership for a member */
  getActiveMembership(memberId: string): Promise<Membership | null>;

  /** Get all memberships for a member (history) */
  getMembershipHistory(memberId: string): Promise<Membership[]>;

  /** Auto-extend memberships affected by a gym closure */
  applyGymClosure(closureId: string, partnerId: string): Promise<{ extendedCount: number }>;
}
```

### paymentService.ts

```typescript
export interface RecordPaymentInput {
  gymId: string;
  memberId: string;
  amountPaise: Money;
  method: PaymentMethod;
  reference?: string;
  note?: string;
  paidAt?: string;        // defaults to now()
}

export interface AllocatePaymentResult {
  payment: Payment;
  allocations: PaymentAllocation[];
  unallocatedPaise: Money;    // any excess (pre-payment or overpayment)
}

export interface RefundInput {
  paymentId: string;
  amountPaise: Money;
  method: PaymentMethod;
  reason: string;
  reference?: string;
}

export interface PaymentService {
  /** Record a payment and allocate it FIFO to outstanding memberships */
  recordPayment(input: RecordPaymentInput, partnerId: string): Promise<AllocatePaymentResult>;

  /** Manually override allocation (move paise from one membership to another) */
  reallocatePayment(paymentId: string, newMembershipId: string, amountPaise: Money, partnerId: string): Promise<void>;

  /** Create a corrected payment record (voids original, creates correction) */
  correctPayment(paymentId: string, correctedAmount: Money, reason: string, partnerId: string): Promise<Payment>;

  /** Process a refund and update payment status */
  processRefund(input: RefundInput, partnerId: string): Promise<void>;

  /** Get payments for a member */
  getMemberPayments(memberId: string, options?: { from?: string; to?: string }): Promise<Payment[]>;

  /** Get all payments for a gym in a date range */
  getGymPayments(gymId: string, from: string, to: string): Promise<Payment[]>;

  /** Get outstanding dues for a member across all active memberships */
  getOutstandingBalance(memberId: string): Promise<Money>;

  /** Record an instalment payment against a schedule */
  payInstalment(instalmentId: string, paymentInput: RecordPaymentInput, partnerId: string): Promise<Payment>;
}
```

### attendanceService.ts

```typescript
export interface ScanResult {
  success: boolean;
  member?: Member;
  membership?: Membership | null;
  attendance?: AttendanceRecord;
  error?: 'invalid_qr' | 'member_not_found' | 'membership_expired' | 'member_archived' | 'duplicate_today';
}

export interface AttendanceService {
  /** Validate a QR token and record attendance (online path) */
  scanQrCode(token: string, partnerId: string | null, deviceId?: string): Promise<ScanResult>;

  /** Record manual attendance by member ID */
  recordManualAttendance(memberId: string, partnerId: string, note?: string): Promise<AttendanceRecord>;

  /** Queue offline attendance record into IndexedDB */
  queueOfflineAttendance(pending: PendingAttendance): Promise<void>;

  /** Sync all pending offline attendance records to Supabase */
  syncOfflineQueue(gymId: string): Promise<{ synced: number; failed: number; duplicates: number }>;

  /** Correct an erroneous attendance record */
  correctAttendance(attendanceId: string, reason: string, partnerId: string): Promise<void>;

  /** Get today's attendance log for a gym */
  getTodayAttendance(gymId: string): Promise<AttendanceRecord[]>;

  /** Get attendance for a date range */
  getAttendanceRange(gymId: string, from: string, to: string): Promise<AttendanceRecord[]>;

  /** Get attendance history for a member */
  getMemberAttendance(memberId: string, limit?: number): Promise<AttendanceRecord[]>;
}
```

### expenseService.ts

```typescript
export interface RecordExpenseInput {
  gymId: string;
  category: ExpenseCategory;
  description: string;
  amountPaise: Money;
  expenseDate: string;
  receiptUrl?: string;
  note?: string;
}

export interface ExpenseReport {
  period: { from: string; to: string };
  totalPaise: Money;
  byCategory: Record<ExpenseCategory, Money>;
  items: Expense[];
}

export interface ExpenseService {
  /** Record a new expense */
  recordExpense(input: RecordExpenseInput, partnerId: string): Promise<Expense>;

  /** Update an existing expense */
  updateExpense(expenseId: string, updates: Partial<RecordExpenseInput>, partnerId: string): Promise<Expense>;

  /** Delete an expense */
  deleteExpense(expenseId: string, partnerId: string): Promise<void>;

  /** Get expenses for a gym in a date range */
  getExpenses(gymId: string, from: string, to: string): Promise<Expense[]>;

  /** Generate expense report */
  generateReport(gymId: string, from: string, to: string): Promise<ExpenseReport>;
}
```

### reportService.ts

```typescript
export interface ReportPeriod { from: string; to: string }

export interface ReportService {
  /** Overall financial summary for a period */
  getFinancialSummary(gymId: string, period: ReportPeriod): Promise<FinancialSummary>;

  /** Day-by-day revenue breakdown */
  getDailyRevenue(gymId: string, period: ReportPeriod): Promise<Array<{ date: string; revenuePaise: Money }>>;

  /** Membership plan distribution */
  getPlanDistribution(gymId: string): Promise<Array<{ plan: MembershipPlan; count: number }>>;

  /** Members expiring soon */
  getExpiringMemberships(gymId: string, withinDays: number): Promise<Membership[]>;

  /** Members with outstanding dues */
  getOutstandingDues(gymId: string): Promise<Array<{ member: Member; balancePaise: Money }>>;

  /** Attendance heatmap data (day × hour counts) */
  getAttendanceHeatmap(gymId: string, period: ReportPeriod): Promise<Array<{ dayOfWeek: number; hour: number; count: number }>>;

  /** Export financial report as CSV */
  exportFinancialCsv(gymId: string, period: ReportPeriod): Promise<string>;
}
```

### qrService.ts

```typescript
export interface QrService {
  /** Generate a new QR token for a member (revokes previous) */
  generateToken(memberId: string, gymId: string, partnerId: string, expiresAt?: string): Promise<QrToken>;

  /** Validate a token — returns token data or null if invalid/revoked */
  validateToken(token: string): Promise<QrToken | null>;

  /** Revoke all tokens for a member */
  revokeAllTokens(memberId: string, partnerId: string): Promise<void>;

  /** Render a QR code as a data URL (uses `qrcode` package) */
  renderQrDataUrl(token: string): Promise<string>;
}
```

### whatsappService.ts

```typescript
export interface WhatsAppTemplate {
  membershipRenewalReminder(member: Member, membership: Membership, gymName: string): string;
  paymentReceived(member: Member, amountPaise: Money, method: PaymentMethod, gymName: string): string;
  membershipExpired(member: Member, membership: Membership, gymName: string): string;
  welcomeNewMember(member: Member, membership: Membership, gymName: string): string;
  outstandingDueReminder(member: Member, balancePaise: Money, gymName: string): string;
}

export interface WhatsAppService {
  /** Build a wa.me URL to open WhatsApp with a pre-filled message */
  buildUrl(phone: string, message: string): string;

  /** All message templates */
  templates: WhatsAppTemplate;

  /** Send renewal reminder (opens WhatsApp on device) */
  sendRenewalReminder(member: Member, membership: Membership, gym: Gym): void;

  /** Send payment receipt */
  sendPaymentReceipt(member: Member, payment: Payment, gym: Gym): void;
}
```

---

## 6. Offline Strategy

### IndexedDB Schema (using `idb` library)

```typescript
// src/lib/db/index.ts
import { openDB, DBSchema, IDBPDatabase } from 'idb';
import type { PendingAttendance, CachedMember } from '../../types/domain';

interface ParadiseGymDB extends DBSchema {
  /**
   * Pending check-ins recorded while offline.
   * Synced to Supabase attendance table on reconnection.
   */
  offlineAttendance: {
    key: string;                        // localId (UUID generated on device)
    value: PendingAttendance;
    indexes: {
      'by-gym': string;                 // gymId
      'by-member-date': [string, string]; // [memberId, date YYYY-MM-DD]
    };
  };

  /**
   * Member records cached for offline QR lookup.
   * Refreshed on login and periodically in background.
   */
  memberCache: {
    key: string;                        // memberId
    value: CachedMember;
    indexes: {
      'by-gym': string;                 // gymId
      'by-qr-token': string;            // qrToken
      'by-cached-at': string;           // cachedAt ISO string (for eviction)
    };
  };

  /**
   * Generic sync queue for failed non-attendance operations.
   * e.g. a payment recorded offline that couldn't reach Supabase.
   */
  syncQueue: {
    key: number;                        // auto-increment
    value: {
      id?: number;
      operation: string;               // 'recordPayment' | 'updateMember' | …
      payload: unknown;
      retryCount: number;
      lastAttempt: string | null;
      createdAt: string;
      error: string | null;
    };
    indexes: {
      'by-operation': string;
    };
  };
}

const DB_NAME = 'paradise-gym';
const DB_VERSION = 1;

let _db: IDBPDatabase<ParadiseGymDB> | null = null;

export async function getDb(): Promise<IDBPDatabase<ParadiseGymDB>> {
  if (_db) return _db;
  _db = await openDB<ParadiseGymDB>(DB_NAME, DB_VERSION, {
    upgrade(db) {
      // offlineAttendance
      const attendanceStore = db.createObjectStore('offlineAttendance', {
        keyPath: 'localId',
      });
      attendanceStore.createIndex('by-gym', 'gymId');
      attendanceStore.createIndex('by-member-date', ['memberId', 'checkedInAt'], {
        // The sync dedup check: same member + same calendar day = duplicate
      });

      // memberCache
      const cacheStore = db.createObjectStore('memberCache', {
        keyPath: 'id',
      });
      cacheStore.createIndex('by-gym', 'gymId');
      cacheStore.createIndex('by-qr-token', 'qrToken', { unique: false });
      cacheStore.createIndex('by-cached-at', 'cachedAt');

      // syncQueue
      const queueStore = db.createObjectStore('syncQueue', {
        keyPath: 'id',
        autoIncrement: true,
      });
      queueStore.createIndex('by-operation', 'operation');
    },
  });
  return _db;
}
```

### Conflict Detection on Sync

When syncing `offlineAttendance` to Supabase:

1. **Composite uniqueness:** Supabase has a `UNIQUE INDEX` on `(device_id, member_id, DATE(checked_in_at AT TIME ZONE 'Asia/Kolkata'))`. An `INSERT ... ON CONFLICT DO NOTHING` avoids duplicate rows from the same device on the same day.
2. **Cross-device dedup:** If `device_id` differs but the same member already has an attendance row for that calendar day (any method), the sync marks the pending item as `duplicate` rather than an error.
3. **Retry cap:** Items in `syncQueue` are retried up to 5 times with exponential backoff; after that they are flagged for manual review.
4. **Background sync:** The service worker registers a `BackgroundSync` tag (`attendance-sync`) so sync occurs automatically when connectivity is restored.

---

## 7. PWA Configuration

### vite.config.ts

```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'auto',
      strategies: 'injectManifest',   // use our custom sw.ts
      srcDir: 'src',
      filename: 'sw.ts',
      manifest: {
        name: 'Paradise Gym',
        short_name: 'Paradise',
        description: 'Gym management app for Paradise Gym',
        theme_color: '#1a1a2e',
        background_color: '#ffffff',
        display: 'standalone',
        orientation: 'portrait-primary',
        scope: '/',
        start_url: '/',
        icons: [
          { src: 'icons/icon-72x72.png',   sizes: '72x72',   type: 'image/png' },
          { src: 'icons/icon-96x96.png',   sizes: '96x96',   type: 'image/png' },
          { src: 'icons/icon-128x128.png', sizes: '128x128', type: 'image/png' },
          { src: 'icons/icon-144x144.png', sizes: '144x144', type: 'image/png' },
          { src: 'icons/icon-192x192.png', sizes: '192x192', type: 'image/png', purpose: 'any maskable' },
          { src: 'icons/icon-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' },
        ],
        categories: ['business', 'productivity'],
      },
      devOptions: {
        enabled: true,
        type: 'module',
      },
    }),
  ],
  resolve: {
    alias: { '@': '/src' },
  },
  build: {
    target: 'esnext',
    sourcemap: true,
  },
});
```

### src/sw.ts (Workbox Service Worker)

```typescript
import { precacheAndRoute, cleanupOutdatedCaches } from 'workbox-precaching';
import { registerRoute } from 'workbox-routing';
import { CacheFirst, NetworkFirst, StaleWhileRevalidate } from 'workbox-strategies';
import { ExpirationPlugin } from 'workbox-expiration';
import { BackgroundSyncPlugin } from 'workbox-background-sync';
import { CacheableResponsePlugin } from 'workbox-cacheable-response';

declare const self: ServiceWorkerGlobalScope & { __WB_MANIFEST: unknown[] };

// 1. Precache all Vite-emitted static assets
precacheAndRoute(self.__WB_MANIFEST);
cleanupOutdatedCaches();

// 2. CACHE-FIRST — static assets (images, fonts, icons)
registerRoute(
  ({ request }) => request.destination === 'image' || request.destination === 'font',
  new CacheFirst({
    cacheName: 'static-assets-v1',
    plugins: [
      new ExpirationPlugin({ maxEntries: 100, maxAgeSeconds: 30 * 24 * 60 * 60 }),
      new CacheableResponsePlugin({ statuses: [0, 200] }),
    ],
  })
);

// 3. STALE-WHILE-REVALIDATE — Google Fonts stylesheets
registerRoute(
  ({ url }) => url.origin === 'https://fonts.googleapis.com',
  new StaleWhileRevalidate({ cacheName: 'google-fonts-stylesheets' })
);

// 4. NETWORK-FIRST — Supabase API calls
registerRoute(
  ({ url }) => url.hostname.includes('supabase.co'),
  new NetworkFirst({
    cacheName: 'supabase-api-v1',
    networkTimeoutSeconds: 5,
    plugins: [
      new ExpirationPlugin({ maxEntries: 50, maxAgeSeconds: 5 * 60 }),
      new CacheableResponsePlugin({ statuses: [0, 200] }),
    ],
  })
);

// 5. BACKGROUND SYNC — offline attendance queue
const bgSyncPlugin = new BackgroundSyncPlugin('attendance-sync', {
  maxRetentionTime: 24 * 60,   // retry for up to 24 hours
});

registerRoute(
  ({ url }) => url.pathname.includes('/attendance') && url.hostname.includes('supabase.co'),
  new NetworkFirst({
    cacheName: 'attendance-api',
    plugins: [bgSyncPlugin],
  }),
  'POST'
);
```

### public/manifest.webmanifest

```json
{
  "name": "Paradise Gym",
  "short_name": "Paradise",
  "description": "Gym management app for Paradise Gym",
  "theme_color": "#1a1a2e",
  "background_color": "#ffffff",
  "display": "standalone",
  "orientation": "portrait-primary",
  "scope": "/",
  "start_url": "/",
  "lang": "en-IN",
  "icons": [
    { "src": "icons/icon-192x192.png", "sizes": "192x192", "type": "image/png", "purpose": "any maskable" },
    { "src": "icons/icon-512x512.png", "sizes": "512x512", "type": "image/png", "purpose": "any maskable" }
  ],
  "categories": ["business", "productivity"],
  "shortcuts": [
    {
      "name": "Scan Attendance",
      "url": "/attendance",
      "icons": [{ "src": "icons/icon-96x96.png", "sizes": "96x96" }]
    },
    {
      "name": "Add Payment",
      "url": "/payments/new",
      "icons": [{ "src": "icons/icon-96x96.png", "sizes": "96x96" }]
    }
  ]
}
```

---

## 8. Component Architecture

```
App
├── AuthGuard
│   └── (redirects to /login if no session)
│
├── Routes
│   ├── /login               → LoginPage
│   ├── /setup               → SetupWizard      (first-run only)
│   ├── /demo                → DemoModePage
│   │
│   └── AppShell             (authenticated shell)
│       ├── TopBar           (gym name, partner avatar, offline indicator)
│       ├── <Outlet />       (page content)
│       └── BottomNav        (5 tabs)
│           ├── /            → DashboardPage
│           ├── /members     → MemberListPage
│           │   ├── /members/:id          → MemberDetailPage
│           │   └── /members/:id/edit     → MemberFormPage
│           │   └── /members/new          → MemberFormPage (create)
│           │   └── /members/registrations → RegistrationReviewPage
│           ├── /attendance  → AttendanceScannerPage
│           ├── /payments    → PaymentFormPage
│           └── /more        → (drawer/sheet)
│               ├── /expenses     → ExpenseFormPage
│               ├── /reports      → ReportsPage
│               └── /settings     → SettingsPage
```

### Key Component Contracts

```typescript
// AppShell.tsx
interface AppShellProps {
  children?: React.ReactNode;
}

// AuthGuard.tsx
interface AuthGuardProps {
  children: React.ReactNode;
  redirectTo?: string;        // default '/login'
}

// MemberCard.tsx
interface MemberCardProps {
  member: Member;
  membership?: Membership | null;
  onClick?: () => void;
  showBadge?: boolean;
}

// QRScanner.tsx
interface QRScannerProps {
  onScan: (token: string) => void;
  onError?: (error: Error) => void;
  active: boolean;
}

// QRCodeDisplay.tsx
interface QRCodeDisplayProps {
  token: string;
  size?: number;              // px, default 200
  memberName?: string;
}

// PaymentBreakdown.tsx
interface PaymentBreakdownProps {
  membership: Membership;
  payments: Payment[];
  allocations: PaymentAllocation[];
}

// WhatsAppButton.tsx
interface WhatsAppButtonProps {
  phone: string;
  message: string;
  label?: string;
}

// MoneyDisplay.tsx
interface MoneyDisplayProps {
  paise: Money;
  showSign?: boolean;         // show + or -
  className?: string;
}

// OfflineBanner.tsx
// No props — reads from offlineStore
```

---

## 9. State Management

Zustand is used for global state only. Server data is managed by TanStack Query (React Query), co-located with the hook that fetches it.

### authStore.ts

```typescript
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Partner, Gym } from '../types/domain';

interface AuthState {
  partner: Partner | null;
  gym: Gym | null;
  isLoading: boolean;
  // Actions
  setPartner: (partner: Partner | null) => void;
  setGym: (gym: Gym | null) => void;
  setLoading: (loading: boolean) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      partner: null,
      gym: null,
      isLoading: true,
      setPartner: (partner) => set({ partner }),
      setGym: (gym) => set({ gym }),
      setLoading: (isLoading) => set({ isLoading }),
      logout: () => set({ partner: null, gym: null }),
    }),
    {
      name: 'paradise-gym-auth',
      partialize: (state) => ({ partner: state.partner, gym: state.gym }),
    }
  )
);
```

### uiStore.ts

```typescript
import { create } from 'zustand';

export type ToastVariant = 'success' | 'error' | 'info' | 'warning';

export interface Toast {
  id: string;
  message: string;
  variant: ToastVariant;
  duration?: number;      // ms, default 3000
}

interface UIState {
  theme: 'light' | 'dark';
  isLoading: boolean;
  toasts: Toast[];
  // Actions
  setTheme: (theme: 'light' | 'dark') => void;
  setLoading: (loading: boolean) => void;
  addToast: (toast: Omit<Toast, 'id'>) => void;
  removeToast: (id: string) => void;
}

export const useUIStore = create<UIState>()((set) => ({
  theme: 'light',
  isLoading: false,
  toasts: [],
  setTheme: (theme) => set({ theme }),
  setLoading: (isLoading) => set({ isLoading }),
  addToast: (toast) =>
    set((state) => ({
      toasts: [...state.toasts, { ...toast, id: crypto.randomUUID() }],
    })),
  removeToast: (id) =>
    set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) })),
}));
```

### offlineStore.ts

```typescript
import { create } from 'zustand';

interface OfflineState {
  isOnline: boolean;
  pendingAttendanceCount: number;
  pendingSyncCount: number;
  lastSyncAt: string | null;
  isSyncing: boolean;
  // Actions
  setOnline: (online: boolean) => void;
  setPendingAttendanceCount: (count: number) => void;
  setPendingSyncCount: (count: number) => void;
  setLastSyncAt: (at: string) => void;
  setSyncing: (syncing: boolean) => void;
}

export const useOfflineStore = create<OfflineState>()((set) => ({
  isOnline: navigator.onLine,
  pendingAttendanceCount: 0,
  pendingSyncCount: 0,
  lastSyncAt: null,
  isSyncing: false,
  setOnline: (isOnline) => set({ isOnline }),
  setPendingAttendanceCount: (pendingAttendanceCount) => set({ pendingAttendanceCount }),
  setPendingSyncCount: (pendingSyncCount) => set({ pendingSyncCount }),
  setLastSyncAt: (lastSyncAt) => set({ lastSyncAt }),
  setSyncing: (isSyncing) => set({ isSyncing }),
}));
```

---

## 10. Key ADRs (Architecture Decision Records)

---

### ADR-001: Integer Paise for Monetary Values

**Status:** Accepted  
**Date:** 2026-11-07

**Context:**  
Financial calculations in JavaScript using `number` (IEEE 754 double) produce floating-point rounding errors (e.g., `0.1 + 0.2 !== 0.3`). These errors compound across instalment calculations, prorated refunds, and FIFO allocation.

**Decision:**  
All monetary values are stored and computed as **INTEGER paise** (1 INR = 100 paise).  
- Database: `INTEGER` columns (not `DECIMAL` or `NUMERIC`)  
- TypeScript: `type Money = number` with JSDoc annotation  
- Display only: convert to rupees for rendering (`paise / 100`)  
- Never store rupees in the DB; never pass rupees between service functions

**Consequences:**  
- ✅ No floating-point rounding bugs  
- ✅ Exact integer arithmetic in PostgreSQL  
- ✅ Safe JSON serialization (integers fit in JS safe integer range up to ₹90 trillion)  
- ⚠️ Developers must remember the convention — enforced by naming (`_paise` suffix) and `Money` type alias

---

### ADR-002: Supabase RLS vs Application-Level Authorization

**Status:** Accepted  
**Date:** 2026-11-07

**Context:**  
Authorization can be enforced at the database layer (RLS policies) or in application code (service layer checks). Both approaches can be used together or exclusively.

**Decision:**  
Use **Supabase Row Level Security as the primary authorization boundary**. The app service layer does not duplicate gym_id checks — it relies on RLS to filter and block cross-gym access.  
- The `current_partner_gym_id()` function resolves gym from `auth.uid()` via the `partners` table  
- All policies use `gym_id = current_partner_gym_id()`  
- Application-level code focuses on business rules (e.g., "can't cancel an already-cancelled membership"), not data isolation

**Consequences:**  
- ✅ Defense in depth — even a buggy service call can't leak data  
- ✅ Less repetitive gym_id filtering in TypeScript  
- ✅ Supabase Studio queries are automatically filtered  
- ⚠️ RLS policies must be tested with both partner accounts  
- ⚠️ `SECURITY DEFINER` function must be carefully reviewed to prevent SQL injection

---

### ADR-003: IndexedDB + idb vs localStorage for Offline Storage

**Status:** Accepted  
**Date:** 2026-11-07

**Context:**  
Offline QR scanning and attendance recording require local storage. Options evaluated:
1. `localStorage` — synchronous, 5 MB limit, string-only
2. `IndexedDB` directly — verbose API, error-prone
3. `idb` wrapper over IndexedDB — promise-based, TypeScript-typed
4. `Dexie.js` — higher-level ORM over IndexedDB

**Decision:**  
Use **`idb`** (the lightweight Supabase-compatible wrapper by Jake Archibald).  
- Typed schema with `DBSchema` interface  
- Promise-based, no callback hell  
- ~6 KB gzipped (vs Dexie's ~25 KB)  
- Sufficient for our three stores (offlineAttendance, memberCache, syncQueue)

**Consequences:**  
- ✅ Handles thousands of cached member records  
- ✅ Atomic transactions for FIFO sync  
- ✅ Works in all modern browsers and PWA context  
- ⚠️ More verbose than Dexie for complex queries — acceptable for our limited query patterns

---

### ADR-004: vite-plugin-pwa vs Manual Service Worker

**Status:** Accepted  
**Date:** 2026-11-07

**Context:**  
A service worker is required for offline support and installability. Options:
1. Manual `sw.js` — full control, error-prone, no Workbox integration out-of-box
2. `vite-plugin-pwa` with `generateSW` strategy — zero-config precaching
3. `vite-plugin-pwa` with `injectManifest` strategy — custom `sw.ts` with injected precache manifest

**Decision:**  
Use **`vite-plugin-pwa` with `injectManifest` strategy**. We write `src/sw.ts` using Workbox primitives, and Vite injects the `__WB_MANIFEST` precache list at build time.

Rationale:
- Full control over caching strategies (Cache-First for assets, Network-First for API, BackgroundSync for attendance)
- TypeScript source (`sw.ts`) with type checking
- Workbox handles versioning and cache invalidation
- Plugin handles manifest generation and registration script injection

**Consequences:**  
- ✅ Full control over service worker logic  
- ✅ Workbox-powered background sync for attendance  
- ✅ Automatic precache manifest injection — no manual asset listing  
- ⚠️ `sw.ts` must be kept in sync with Workbox API versions

---

### ADR-005: Zustand vs Redux Toolkit for Global State

**Status:** Accepted  
**Date:** 2026-11-07

**Context:**  
Global state is needed for: authenticated partner/gym, UI state (toasts, theme), and offline status. Options:
1. Redux Toolkit — industry standard, verbose, overkill for 3 stores
2. Zustand — minimal, hook-based, TypeScript-friendly
3. Jotai — atom-based, very lightweight
4. React Context — no external dependency, re-render performance issues at scale

**Decision:**  
Use **Zustand** for global state.  
- Three stores: `authStore`, `uiStore`, `offlineStore`  
- TanStack Query (React Query) handles all server state (member lists, memberships, payments)  
- Zustand `persist` middleware for auth state across page refreshes  
- No `redux-thunk`, no `createSlice` boilerplate

**Consequences:**  
- ✅ 3 KB gzipped bundle size  
- ✅ Direct state mutation API (no action creators needed)  
- ✅ Works naturally with React hooks  
- ✅ `persist` middleware handles localStorage auth state  
- ⚠️ No Redux DevTools time-travel (Zustand has basic devtools support via `devtools` middleware)

---

## 11. Environment Variables

All Vite-exposed variables must be prefixed with `VITE_`. Secret variables (without `VITE_` prefix) are only used in edge functions or server-side contexts.

```bash
# .env.example

# ─── Supabase ───────────────────────────────────────────────
# From: Supabase Dashboard → Project Settings → API
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# ─── App Environment ────────────────────────────────────────
# Controls demo mode data seeding and feature flags
# Values: 'demo' | 'production'
VITE_APP_ENV=production

# ─── App Identity ───────────────────────────────────────────
# Displayed in the header and manifest
VITE_APP_NAME=Paradise Gym

# ─── Feature Flags (optional) ───────────────────────────────
# Set to 'true' to enable the public registration form
VITE_ENABLE_PUBLIC_REGISTRATION=true

# ─── Cloudflare Pages (CI only — not exposed to client) ─────
# Used by wrangler in CD pipeline
# CF_ACCOUNT_ID=...
# CF_API_TOKEN=...
```

| Variable | Required | Description |
|---|---|---|
| `VITE_SUPABASE_URL` | ✅ | Full URL of your Supabase project |
| `VITE_SUPABASE_ANON_KEY` | ✅ | Public anon key — safe to expose (RLS enforces access) |
| `VITE_APP_ENV` | ✅ | `demo` seeds mock data; `production` connects to live DB |
| `VITE_APP_NAME` | ✅ | Gym display name in header |
| `VITE_ENABLE_PUBLIC_REGISTRATION` | ☑️ | Toggle public self-registration form |

> [!CAUTION]
> Never put the **service role key** in a `VITE_` variable. It bypasses all RLS policies. Only use it in Supabase Edge Functions (server-side) with environment variables set via the Supabase dashboard.

---

## 12. Security Checklist

### Pre-Launch Security Checklist

#### RLS Verification

- [ ] Enable RLS on all 24 tables — verify with `SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public'`
- [ ] Test Partner A cannot read Partner B's members (use two Supabase auth sessions)
- [ ] Test that `current_partner_gym_id()` returns `NULL` for unauthenticated requests and that all policies block access when it does
- [ ] Verify `registration_submissions` public INSERT policy does not expose existing rows to unauthenticated reads (`SELECT` policy absent = default deny)
- [ ] Run Supabase's RLS advisor tool on all tables

#### Public Registration Form Rate Limiting

- [ ] Add Cloudflare WAF rate-limiting rule: max 10 form submissions per IP per hour on the `/register` route
- [ ] Add honeypot field to registration form (hidden input that bots fill; real users don't)
- [ ] Add server-side duplicate phone check before inserting `registration_submissions`
- [ ] Sanitize all free-text inputs (address, notes) — strip HTML tags
- [ ] Implement CAPTCHA (or Cloudflare Turnstile) on the public registration form for high-volume protection

#### QR Token Entropy

- [ ] Tokens must be generated with `crypto.randomUUID()` or `crypto.getRandomValues()` — **never** `Math.random()`
- [ ] Minimum 128 bits of entropy (UUID v4 = 122 bits: acceptable)
- [ ] Store only the token string in `qr_tokens.token` — do not embed member ID in the token itself
- [ ] Implement token rotation: generate a new token on each membership renewal
- [ ] Set `expires_at` for time-limited tokens; validate expiry on every scan
- [ ] Revoke all tokens on member archive

#### Offline Data At Rest

- [ ] IndexedDB data is stored unencrypted in the browser — do not cache sensitive fields (no bank details, no full payment history) in `memberCache`
- [ ] `memberCache` stores only: name, phone, photo URL, QR token, membership end date, status
- [ ] Implement cache TTL: evict `memberCache` entries older than 24 hours; re-sync on next online session
- [ ] Notify users that the device must be secured (screen lock) for offline mode to be safe
- [ ] Consider clearing `memberCache` on logout via `useEffect` in `AuthGuard`

#### HTTPS Enforcement

- [ ] Cloudflare Pages serves all traffic over HTTPS by default — verify "Always Use HTTPS" is enabled in Cloudflare dashboard
- [ ] Add `Strict-Transport-Security` header via `_headers` file in `public/`:
  ```
  /*
    Strict-Transport-Security: max-age=31536000; includeSubDomains; preload
    X-Content-Type-Options: nosniff
    X-Frame-Options: DENY
    Referrer-Policy: strict-origin-when-cross-origin
    Permissions-Policy: camera=(self), microphone=()
  ```
- [ ] Supabase connection always uses `https://` — anon key is safe over TLS
- [ ] Verify PWA `start_url` and all deep links resolve over HTTPS

#### Additional Checks

- [ ] Supabase Auth email OTP rate limiting enabled (default 60 req/hour) — verify in Dashboard
- [ ] Supabase Auth JWT expiry set to reasonable value (1 hour access token, 7-day refresh)
- [ ] Activity log captures all partner actions (`member.archived`, `payment.corrected`, etc.)
- [ ] No sensitive data in `console.log` statements — run `grep -r 'console.log' src/` before deploy
- [ ] All third-party scripts loaded from trusted origins (no arbitrary CDN iframes)
- [ ] `Content-Security-Policy` header configured to allow only Supabase origin for XHR

---

> **Document Owner:** Architecture team  
> **Review Cycle:** On every major feature addition or schema change  
> **Last Updated:** 2026-11-07
