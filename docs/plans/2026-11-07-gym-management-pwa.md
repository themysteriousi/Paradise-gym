# Paradise Gym Management PWA — Implementation Plan

> **For Agent / Developer:** REQUIRED WORKFLOW: Execute this plan task-by-task using Test-Driven Development (TDD: Red → Green → Refactor). Check and update `PROJECT_STATUS.md` after each task.

**Goal:** Build a mobile-first, installable Progressive Web App (PWA) for a single-location gym operated by two business partners with ₹0 recurring software cost. Centralizes member registration, plans, QR attendance (with offline sync), payments, expenses, and financial reporting.

**Architecture:** Monolithic React 18+ (or 19) + TypeScript PWA scaffolded with Vite, Tailwind CSS for mobile-first UI, Supabase for Auth & PostgreSQL with Row Level Security (RLS), IndexedDB via `idb` for offline attendance caching and queueing, and Cloudflare Pages for static hosting.

**Tech Stack:** 
- Frontend: Vite, React, TypeScript, Tailwind CSS, Lucide React icons, Zustand
- Offline/PWA: `vite-plugin-pwa`, Workbox, `idb`
- QR & Media: `@zxing/browser` or `html5-qrcode` (scanner), `qrcode` (generator), `html2canvas` (PNG card export)
- Backend & DB: Supabase (PostgreSQL, Supabase Auth, Storage if needed)
- Testing: Vitest, React Testing Library, Playwright (E2E)

---

## Phase Overview

- **Phase 1: Foundation & Project Shell** (Repo setup, Vite PWA scaffold, Supabase schema & migrations, Auth guard, Navigation, Theme, Setup Wizard, Demo Mode)
- **Phase 2: Member & Membership Lifecycle** (Member profiles, self-registration queue, plan management, early renewals, expiry logic, discounts, CSV import, PNG card generator)
- **Phase 3: Financial Management & Payments** (Split payment recording, FIFO charge allocation with partner override, refunds, expense tracking, partner capital/draws, P&L reports)
- **Phase 4: QR Attendance & Resilient Offline Sync** (Cryptographic QR token generation & revocation, camera scanner, manual search fallback, IndexedDB offline check-in queue, conflict reconciliation)
- **Phase 5: Operational Dashboard & WhatsApp Engine** (Key metrics dashboard without chart bloat, expiry alerts, inactivity radar, pre-filled WhatsApp message templates, holiday & special closure extensions)
- **Phase 6: Data Export, Help Guides & Hardening** (Full CSV/Excel export, printable PDF summaries, developer-assisted disaster recovery procedures, cross-device testing, security audit)

---

## Phase 1: Foundation & Project Shell

### Task 1.1: Project Scaffolding with Vite, React, TypeScript & Tailwind CSS
**Files:**
- Create: `package.json`, `vite.config.ts`, `tsconfig.json`, `tailwind.config.js`, `postcss.config.js`, `index.html`, `src/main.tsx`, `src/App.tsx`, `src/index.css`
- Test: `tests/unit/app.test.tsx`

**Steps:**
1. Initialize Vite project with React and TypeScript templates.
2. Install dependencies: `tailwindcss`, `postcss`, `autoprefixer`, `lucide-react`, `zustand`, `@supabase/supabase-js`, `idb`, `clsx`, `tailwind-merge`.
3. Configure Tailwind CSS with mobile-first breakpoints and dark mode support (`class` strategy).
4. Configure Vitest and React Testing Library in `vite.config.ts`.
5. Write failing smoke test in `tests/unit/app.test.tsx` checking that App renders the gym brand header.
6. Verify test fails: `npm run test`
7. Implement basic `App.tsx` shell.
8. Verify test passes.
9. Commit: `git commit -m "feat(core): scaffold vite react typescript pwa with tailwind"`

---

### Task 1.2: PWA Configuration & Service Worker
**Files:**
- Create: `public/manifest.webmanifest`, `src/sw.ts`, `public/_headers`
- Modify: `vite.config.ts`, `index.html`
- Test: `tests/unit/pwa-manifest.test.ts`

**Steps:**
1. Configure `vite-plugin-pwa` in `vite.config.ts` with standalone display mode, theme colors, and icons.
2. Create `public/manifest.webmanifest` with short name "Paradise Gym", theme color `#0f172a`, start_url `/`.
3. Add Cloudflare Pages security headers in `public/_headers` (HSTS, CSP, X-Frame-Options, camera permissions).
4. Write test asserting manifest contains required PWA fields and permissions.
5. Verify test fails, then add file and verify test passes.
6. Commit: `git commit -m "feat(pwa): configure web manifest, headers and service worker"`

---

### Task 1.3: Supabase Schema Migrations & RLS Policies (23 Tables)
**Files:**
- Create: `supabase/migrations/20261107000000_initial_schema.sql`
- Create: `supabase/migrations/20261107000001_rls_policies.sql`
- Test: `tests/unit/schema-types.test.ts`

**Steps:**
1. Define all 23 relational tables as specified in `docs/architecture/ARCHITECTURE.md`:
   - `gym`, `partners`, `members`, `member_tags`, `member_tag_assignments`, `registration_submissions`, `membership_plans`, `memberships`, `membership_changes`, `discounts`, `membership_discounts`, `payments`, `payment_allocations`, `charges`, `instalment_schedules`, `refunds`, `attendance`, `qr_tokens`, `expenses`, `partner_transactions`, `gym_closures`, `membership_extensions`, `activity_logs`, `gym_settings`.
2. Enforce integer paise for all monetary values (`amount_paise INT NOT NULL`).
3. Write RLS policies ensuring both partners access only their gym data and public can only insert into `registration_submissions`.
4. Create TypeScript type interfaces in `src/types/database.ts` and `src/types/domain.ts`.
5. Write unit test verifying type definitions and sample model structures.
6. Commit: `git commit -m "feat(db): add comprehensive supabase schema, rls and types"`

---

### Task 1.4: Supabase Client, Auth Context & Protected Routing
**Files:**
- Create: `src/lib/supabase.ts`, `src/stores/authStore.ts`, `src/components/auth/AuthGuard.tsx`, `src/pages/LoginPage.tsx`
- Test: `tests/unit/authStore.test.ts`

**Steps:**
1. Write failing test for `authStore` (login, logout, partner session state, gym resolution).
2. Implement Supabase client wrapper with graceful fallback to Demo Mode if keys are not configured.
3. Implement `authStore.ts` with Zustand.
4. Implement `AuthGuard.tsx` to redirect unauthenticated sessions to `/login`.
5. Build clean, mobile-first `LoginPage.tsx` with email/password login and instant demo login button.
6. Verify test passes.
7. Commit: `git commit -m "feat(auth): implement supabase auth guard, store and login page"`

---

### Task 1.5: Mobile Bottom Navigation & Responsive App Shell
**Files:**
- Create: `src/components/layout/AppShell.tsx`, `src/components/layout/BottomNav.tsx`, `src/components/layout/Header.tsx`, `src/stores/uiStore.ts`
- Test: `tests/unit/navigation.test.tsx`

**Steps:**
1. Write failing test checking navigation tabs (Dashboard, Members, Attendance, Payments, More).
2. Implement `uiStore.ts` for theme toggle (light/dark) and active route state.
3. Build `BottomNav.tsx` with high touch targets (>48px) and accessible labels.
4. Build `AppShell.tsx` responsive layout with sticky header showing gym title, partner avatar, and sync indicator.
5. Verify test passes.
6. Commit: `git commit -m "feat(ui): add mobile-first app shell and navigation"`

---

### Task 1.6: First-Time Setup Wizard & Demo Mode Isolation
**Files:**
- Create: `src/pages/SetupWizardPage.tsx`, `src/pages/DemoModePage.tsx`, `src/services/demoDataService.ts`, `src/stores/demoStore.ts`
- Test: `tests/unit/demoMode.test.ts`

**Steps:**
1. Write failing test verifying Demo Mode uses an in-memory/isolated localStorage state and never writes to real Supabase tables.
2. Implement `demoDataService.ts` generating realistic gym data: 25 members, plans (Monthly, Quarterly, Annual), active memberships, check-ins, and cash/UPI payments.
3. Build `SetupWizardPage.tsx` guiding new owners through gym name, partner accounts, plans, UPI ID, and operating hours.
4. Verify all tests pass.
5. Commit: `git commit -m "feat(core): build setup wizard and sandboxed demo mode"`

---

## Phase 2: Member & Membership Lifecycle

### Task 2.1: Member Management & Profile CRUD
**Files:**
- Create: `src/services/memberService.ts`, `src/pages/members/MemberListPage.tsx`, `src/pages/members/MemberDetailPage.tsx`, `src/components/members/MemberFormModal.tsx`
- Test: `tests/unit/memberService.test.ts`

**Steps:**
1. Write failing unit tests for `memberService.ts` (`createMember`, `getMembers`, `updateMember`, `archiveMember`, sequential member ID generation `GYM001`).
2. Implement `memberService.ts` with Supabase queries and demo store compatibility.
3. Build `MemberListPage.tsx` with search by name/mobile/ID, status filter tabs (All, Active, Expiring, Expired, Due), and tag filters.
4. Build `MemberDetailPage.tsx` showing current status, membership history, attendance timeline, payment history, and tags.
5. Verify tests pass.
6. Commit: `git commit -m "feat(members): implement member management and detailed profiles"`

---

### Task 2.2: Public Self-Registration Portal & Approval Queue
**Files:**
- Create: `src/pages/public/RegisterPage.tsx`, `src/pages/members/RegistrationQueuePage.tsx`, `src/components/members/ApprovalDialog.tsx`
- Test: `tests/unit/registrationQueue.test.ts`

**Steps:**
1. Write failing tests for self-registration submission validation and partner approval/rejection.
2. Build mobile-friendly public `RegisterPage.tsx` (Name, Mobile, Plan choice, optional DOB/gender/emergency contact) with duplicate mobile detection.
3. Build `RegistrationQueuePage.tsx` in the partner app showing pending submissions with 1-tap Approve/Reject.
4. Verify tests pass.
5. Commit: `git commit -m "feat(members): build public registration and approval queue"`

---

### Task 2.3: Membership Plans, Pricing & Renewal Logic
**Files:**
- Create: `src/services/membershipService.ts`, `src/pages/more/PlanSettingsPage.tsx`, `src/components/memberships/RenewalModal.tsx`
- Test: `tests/unit/membershipService.test.ts`

**Steps:**
1. Write unit tests for core business rules:
   - Early renewal extends from existing expiry date (not today).
   - Plan price edits do not alter historical membership snapshots.
   - Upgrade/downgrade prorating calculations.
2. Implement `membershipService.ts` executing these rules in paise.
3. Build `PlanSettingsPage.tsx` to configure Monthly, Quarterly, Half-Yearly, Yearly, and Custom plans.
4. Build `RenewalModal.tsx` allowing partners to select plan, apply discount, review new expiry date, and create renewal.
5. Verify tests pass.
6. Commit: `git commit -m "feat(memberships): implement plans, lifecycle rules and renewals"`

---

### Task 2.4: Digital Membership Card & WhatsApp Share Generator
**Files:**
- Create: `src/components/members/DigitalCard.tsx`, `src/services/cardGeneratorService.ts`, `src/services/whatsappService.ts`
- Test: `tests/unit/cardGenerator.test.ts`

**Steps:**
1. Write test for PNG card generator and WhatsApp message formatting.
2. Implement `DigitalCard.tsx` styled mobile membership card (Gym name, Member Name, ID, Plan, Expiry, Status, QR code).
3. Use `html2canvas` or Canvas API to export shareable PNG.
4. Add 1-tap "Share on WhatsApp" pre-filling member's phone and personalized greeting with card download link.
5. Verify tests pass.
6. Commit: `git commit -m "feat(members): digital membership card and whatsapp sharing"`

---

### Task 2.5: CSV/Excel Member Import with Preview & Validation
**Files:**
- Create: `src/services/importService.ts`, `src/pages/members/MemberImportPage.tsx`
- Test: `tests/unit/importService.test.ts`

**Steps:**
1. Write tests for CSV parsing, column mapping, duplicate detection, and schema validation.
2. Implement `importService.ts` with batch validation.
3. Build `MemberImportPage.tsx` with drag-and-drop file upload, preview table highlighting errors, and one-click bulk insert.
4. Verify tests pass.
5. Commit: `git commit -m "feat(members): csv member import with preview and validation"`

---

## Phase 3: Financial Management & Payments

### Task 3.1: Payment Recording, Split Payments & FIFO Allocation
**Files:**
- Create: `src/services/paymentService.ts`, `src/pages/payments/PaymentListPage.tsx`, `src/components/payments/RecordPaymentModal.tsx`
- Test: `tests/unit/paymentService.test.ts`

**Steps:**
1. Write unit tests for FIFO allocation: payments automatically clear the oldest outstanding charge unless overridden.
2. Test split payment calculations (e.g. ₹500 Cash + ₹1500 UPI = ₹2000 total).
3. Implement `paymentService.ts` with database transaction safety.
4. Build `RecordPaymentModal.tsx` with UPI QR modal, receiver account selection, and allocation summary.
5. Build `PaymentListPage.tsx` with date filters, method breakdowns, and receipts.
6. Verify tests pass.
7. Commit: `git commit -m "feat(payments): payment recording, split payments and fifo allocation"`

---

### Task 3.2: Refunds, Payment Corrections & Audit Logging
**Files:**
- Create: `src/components/payments/RefundModal.tsx`, `src/components/payments/CorrectionModal.tsx`
- Modify: `src/services/paymentService.ts`
- Test: `tests/unit/refundAndCorrection.test.ts`

**Steps:**
1. Write tests ensuring refunds create distinct negative/refund records and never mutate or erase original payments.
2. Test that transaction corrections require a recorded reason, partner ID, and preserve original values in `activity_logs`.
3. Implement refund and correction workflows in `paymentService.ts`.
4. Build UI modals for both actions.
5. Verify tests pass.
6. Commit: `git commit -m "feat(payments): refunds, audit-logged corrections and history"`

---

### Task 3.3: Expense Tracking & Partner Transactions (Capital/Draws)
**Files:**
- Create: `src/services/expenseService.ts`, `src/pages/more/ExpensesPage.tsx`, `src/pages/more/PartnerFinancesPage.tsx`
- Test: `tests/unit/expenseService.test.ts`

**Steps:**
1. Write unit tests for expense categorization and partner capital contributions/withdrawals.
2. Ensure partner draws are never classified as ordinary operating expenses.
3. Implement `expenseService.ts` with daily and monthly aggregations.
4. Build `ExpensesPage.tsx` for fast expense entry (Rent, Electricity, Equipment maintenance, Cleaning, etc.).
5. Build `PartnerFinancesPage.tsx` showing both partners' capital balance and withdrawals.
6. Verify tests pass.
7. Commit: `git commit -m "feat(finances): expense tracking and partner capital accounting"`

---

### Task 3.4: Financial Reporting & Estimated Profit
**Files:**
- Create: `src/services/financialReportService.ts`, `src/pages/more/FinancialReportsPage.tsx`
- Test: `tests/unit/financialReports.test.ts`

**Steps:**
1. Write test for Net Profit calculation: `Total Collections - Operating Expenses = Estimated Profit`.
2. Implement monthly and custom-range financial summary service.
3. Build `FinancialReportsPage.tsx` presenting clean tabular numbers (no heavy chart libraries) with Cash vs UPI splits and outstanding dues list.
4. Verify tests pass.
5. Commit: `git commit -m "feat(finances): comprehensive financial reporting and p&l"`

---

## Phase 4: QR Attendance & Resilient Offline Sync

### Task 4.1: Secure QR Token Generation & Revocation
**Files:**
- Create: `src/services/qrService.ts`
- Test: `tests/unit/qrService.test.ts`

**Steps:**
1. Write unit tests for cryptographically random token generation (UUID v4 + entropy hash), validation, and revocation upon token regeneration.
2. Verify token payload contains zero PII (non-identifying token string only).
3. Implement `qrService.ts`.
4. Verify tests pass.
5. Commit: `git commit -m "feat(qr): secure non-pii qr token generation and revocation"`

---

### Task 4.2: Camera QR Scanner & Manual Fallback Search
**Files:**
- Create: `src/components/attendance/CameraScanner.tsx`, `src/pages/attendance/AttendancePage.tsx`, `src/components/attendance/CheckInResultModal.tsx`
- Test: `tests/unit/attendanceScanner.test.tsx`

**Steps:**
1. Write tests for check-in flow: scan token → fetch member status → record check-in → show result modal with status, expiry warning, dues warning.
2. Implement camera scanner using `@zxing/browser` or `html5-qrcode` with flash/torch toggle and rear-camera preference.
3. Add manual search bar on the same screen (search by Name, Mobile, or ID) for 1-tap manual check-in when camera is unavailable.
4. Add support for rapid-rescan warning (e.g. member scanned twice within 10 minutes).
5. Verify tests pass.
6. Commit: `git commit -m "feat(attendance): qr camera scanner and instant manual check-in"`

---

### Task 4.3: IndexedDB Offline Queue & Background Sync
**Files:**
- Create: `src/lib/db/indexedDB.ts`, `src/services/offlineSyncService.ts`, `src/stores/offlineStore.ts`
- Test: `tests/unit/offlineSync.test.ts`

**Steps:**
1. Write comprehensive tests for offline queue:
   - When device is offline, check-in is saved to IndexedDB `offlineAttendance` store.
   - Member cache allows offline name/status verification.
   - When network restores, pending items sync to Supabase.
   - Conflicting or duplicate records are safely deduplicated using composite `device_id + member_id + timestamp`.
2. Implement IndexedDB layer using `idb`.
3. Implement `offlineSyncService.ts` listening to `navigator.onLine` and window online/offline events.
4. Add sticky offline banner in `AppShell` showing "Offline Mode: X check-ins queued".
5. Verify all tests pass.
6. Commit: `git commit -m "feat(attendance): indexeddb offline check-in queue and auto-sync"`

---

## Phase 5: Operational Dashboard & WhatsApp Engine

### Task 5.1: High-Density Operational Dashboard
**Files:**
- Create: `src/pages/dashboard/DashboardPage.tsx`, `src/components/dashboard/MetricCard.tsx`, `src/services/dashboardService.ts`
- Test: `tests/unit/dashboardService.test.ts`

**Steps:**
1. Write tests for dashboard metric aggregations:
   - Active, expired, and total members.
   - Today's attendance & monthly attendance.
   - Today's & monthly collections (Cash, UPI, Online).
   - Outstanding dues count and sum.
   - Upcoming expiries (next 3, 7 days).
   - Estimated monthly profit.
2. Implement `dashboardService.ts`.
3. Build clean, mobile-first `DashboardPage.tsx` with high contrast cards and alert banners.
4. Verify tests pass.
5. Commit: `git commit -m "feat(dashboard): high-density operational metrics dashboard"`

---

### Task 5.2: WhatsApp Pre-filled Message Engine
**Files:**
- Create: `src/services/whatsappTemplateService.ts`, `src/components/common/WhatsAppShareModal.tsx`
- Test: `tests/unit/whatsappTemplates.test.ts`

**Steps:**
1. Write tests for WhatsApp message generators:
   - Welcome message with membership details and portal link.
   - Expiry reminder (3 days before, 1 day before, day of expiry).
   - Payment receipt with amount, method, date, and remaining balance.
   - Outstanding dues follow-up.
   - Inactivity check-in (e.g. member hasn't attended in 10+ days).
2. Implement templates with customized placeholders.
3. Build `WhatsAppShareModal.tsx` allowing partners to preview and edit message before opening `https://wa.me/<phone>?text=...`.
4. Verify tests pass.
5. Commit: `git commit -m "feat(communication): pre-filled editable whatsapp templates"`

---

### Task 5.3: Closures & Holiday Membership Extension Manager
**Files:**
- Create: `src/services/closureService.ts`, `src/pages/more/ClosuresPage.tsx`, `src/components/closures/ExtensionModal.tsx`
- Test: `tests/unit/closureService.test.ts`

**Steps:**
1. Write unit tests:
   - Creating gym closure dates (e.g., festival or emergency maintenance).
   - Identifying active memberships overlapping closure dates.
   - Bulk-applying extension days to affected memberships with audit logging.
2. Implement `closureService.ts`.
3. Build `ClosuresPage.tsx` with calendar view of closures and one-click "Extend Affected Members" workflow.
4. Verify tests pass.
5. Commit: `git commit -m "feat(closures): holiday management and automated membership extensions"`

---

## Phase 6: Data Export, Help Guides & Hardening

### Task 6.1: Comprehensive Business Data Export (CSV/JSON/PDF)
**Files:**
- Create: `src/services/exportService.ts`, `src/pages/more/ExportsPage.tsx`
- Test: `tests/unit/exportService.test.ts`

**Steps:**
1. Write tests verifying data export formats for all major entities (Members, Payments, Attendance, Expenses).
2. Implement client-side CSV generator with UTF-8 BOM support for Excel compatibility.
3. Build `ExportsPage.tsx` allowing 1-tap download of all gym data.
4. Verify tests pass.
5. Commit: `git commit -m "feat(export): full business data export in csv and json"`

---

### Task 6.2: Non-Technical In-App Help & Runbooks
**Files:**
- Create: `src/pages/more/HelpPage.tsx`, `docs/runbooks/DISASTER_RECOVERY.md`, `docs/runbooks/PARTNER_GUIDE.md`
- Test: `tests/unit/helpDocs.test.tsx`

**Steps:**
1. Write clear, step-by-step visual guides in `HelpPage.tsx` covering:
   - How to register and approve a member.
   - How to record a renewal and split payment.
   - How to take attendance offline and trigger sync.
   - How to handle member refunds and corrections.
2. Write developer-assisted disaster recovery runbook (`DISASTER_RECOVERY.md`) for importing data backups.
3. Verify test passes.
4. Commit: `git commit -m "docs: add in-app help guides and disaster recovery runbook"`

---

### Task 6.3: E2E Playwright Tests & Mobile Cross-Browser Verification
**Files:**
- Create: `e2e/auth.spec.ts`, `e2e/member-lifecycle.spec.ts`, `e2e/attendance-offline.spec.ts`, `e2e/payment-flow.spec.ts`
- Modify: `playwright.config.ts`

**Steps:**
1. Configure Playwright with Mobile Chrome (Android) and Mobile Safari (iPhone) emulation.
2. Implement E2E test suites for critical user journeys:
   - Partner login → Setup wizard → Dashboard.
   - Public registration → Partner approval → Membership renewal → WhatsApp receipt.
   - Attendance scan (with mock camera stream) → Check-in verification.
   - Offline check-in simulation → Network re-establishment → Sync check.
3. Run tests: `npx playwright test`
4. Commit: `git commit -m "test(e2e): add end-to-end playwright test suites for mobile journeys"`

---

### Task 6.4: Security Audit, RLS Verification & Cloudflare Pages Deployment
**Files:**
- Create: `scripts/verify-security.js`, `.github/workflows/deploy.yml`
- Modify: `README.md`

**Steps:**
1. Run security check script verifying:
   - Zero hardcoded secrets in source code.
   - RLS enabled on all 23 PostgreSQL tables.
   - No cross-gym queries without `gym_id` filter.
   - Public registration rate limits and input sanitization.
2. Configure GitHub Actions workflow for zero-cost deployment to Cloudflare Pages.
3. Document production deployment steps in `README.md`.
4. Commit: `git commit -m "chore: security verification, deployment workflow and production docs"`

