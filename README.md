# 🏋️ Paradise Gym Management PWA

> **A modern, offline-capable, mobile-first Progressive Web App (PWA) designed for single-location gym operations with two equal partners — built on a permanent ₹0 recurring software cost architecture.**

[![React](https://img.shields.io/badge/React-18.3-blue.svg)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-blue.svg)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-6.2-purple.svg)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/TailwindCSS-3.4-teal.svg)](https://tailwindcss.com/)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL%20%2B%20RLS-emerald.svg)](https://supabase.com/)
[![PWA](https://img.shields.io/badge/PWA-Offline%20First-orange.svg)](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps)
[![Tests](https://img.shields.io/badge/Vitest-23%20files%20%7C%2097%20passing-brightgreen.svg)](https://vitest.dev/)

---

## 🌟 Highlights & Key Architectural Decisions

1. **₹0 Recurring Software Cost:** Hosted statically on Cloudflare Pages with backend services powered by Supabase's generous free tier (PostgreSQL, Row Level Security, Auth).
2. **Strict Integer Paise Monetary Integrity:** All financial values (`amount_paise`, `price_paise`, `paid_paise`, `balance_paise`) are modeled strictly as integer paise. Floating-point arithmetic is forbidden at both the database and application levels.
3. **Offline-First QR Attendance Scanner:** Check-ins are processed via front/rear camera QR barcode scanning. If the gym Wi-Fi cuts out, check-ins are cached in device IndexedDB storage and automatically synchronized when connectivity returns.
4. **Non-PII Cryptographic QR Tokens:** Member QR tokens contain only random 32-byte non-PII strings. No names, phone numbers, or dates are embedded in the QR payload.
5. **Split Fee Payments & FIFO Dues Engine:** Supports split payments (e.g., ₹500 Cash + ₹1,000 UPI) recorded atomically under one receipt with automated First-In-First-Out (FIFO) invoice clearing.
6. **Partner Capital & Drawing Accounts:** Strictly separates operating expenses (rent, utilities, equipment maintenance) from partner capital investments and personal draws to maintain pure EBITDA/profit calculations.
7. **Fair Gym Closures & Auto-Extensions:** Automatically pushes active members' expiry dates forward when holiday or maintenance shutdowns occur, with complete audit logging.
8. **Total Data Sovereignty:** 1-tap download of all gym data in UTF-8 BOM CSV (for Microsoft Excel / Apple Numbers) and raw JSON database snapshots for off-site backups.
9. **Interactive Demo Mode:** The PWA functions completely out-of-the-box in Demo Mode with realistic dummy data without requiring live Supabase credentials.

---

## 📱 Application Screens & Tabs

- **Dashboard:** Real-time KPI cards (active members, today's check-ins, cash vs UPI collections, dues summary, upcoming expiries, inactivity radar).
- **Members:** Member directory with status filters (Active, Expired, Pending), profile view, renewal workflow, and digital WhatsApp membership card generator.
- **Attendance:** Dual-mode check-in engine featuring camera QR scanner with sound feedback and manual member search fallback.
- **Payments:** Comprehensive fee ledger, split payment recording, receipt modal with direct WhatsApp deep-links, and non-destructive audit corrections.
- **More Hub:**
  - *Financial Reports & P&L Statement*
  - *Operating Expenses*
  - *Partner Capital & Drawing Accounts*
  - *Membership Plans & Pricing*
  - *Public Self-Registration Queue*
  - *CSV Member Bulk Import*
  - *Gym Closures & Membership Extensions*
  - *Business Data Export (CSV/JSON)*
  - *In-App Help Guides & Runbooks*

---

## 🚀 Quick Start Guide

### Prerequisites
- Node.js 18 or 20+
- npm or yarn

### 1. Installation
```bash
git clone https://github.com/affaan-m/ECC.git paradise-gym
cd paradise-gym
npm install
```

### 2. Development Server (Demo Mode Active Out-of-the-Box)
```bash
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser. Click **"Explore Demo Mode"** to test the entire application with 20 pre-seeded members, plans, payments, and attendance logs.

### 3. Running Unit Tests
```bash
npm run test
```
Executes all 23 Vitest test suites (97 passing tests, ~1.5s execution time).

### 4. Compiling Production Build
```bash
npm run build
```
Generates production bundle in `dist/` with Workbox service worker and Web App Manifest.

### 5. Running Security & Architecture Verification
```bash
node scripts/verify-security.js
```

---

## 🗄️ Supabase Production Configuration

To connect the PWA to a live Supabase PostgreSQL database:

1. Create a free project at [supabase.com](https://supabase.com).
2. Go to **SQL Editor** and run the migration files in order:
   - [`supabase/migrations/20261107000000_initial_schema.sql`](./supabase/migrations/20261107000000_initial_schema.sql)
   - [`supabase/migrations/20261107000001_rls_policies.sql`](./supabase/migrations/20261107000001_rls_policies.sql)
3. Copy your project URL and anon public key into `.env`:
   ```bash
   VITE_SUPABASE_URL=https://<your-project-id>.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI...
   ```
4. Build and deploy!

---

## 📖 Operational Documentation & Runbooks

- [Partner Operations Runbook](./docs/runbooks/PARTNER_GUIDE.md) — Daily routine, opening/closing checklists, and cash reconciliation.
- [Disaster Recovery Runbook](./docs/runbooks/DISASTER_RECOVERY.md) — Database restoration, secret rotation, and offline data extraction.
- [System Architecture Document](./docs/architecture/ARCHITECTURE.md) — Database schema, entity relationships, and offline caching design.
- [Full Implementation Plan](./docs/plans/2026-11-07-gym-management-pwa.md) — Task-by-task roadmap and specifications.

---

## 📄 License

MIT License. Designed with ❤️ for Paradise Gym.

