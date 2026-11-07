# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

React 18, TypeScript, Vite, Tailwind CSS, Supabase (PostgreSQL + Row Level Security), IndexedDB (`idb` for offline persistence), Cloudflare Pages static hosting.

## Users

- **Primary Operators:** Two equal business partners operating a single-location gym ("Paradise Gym"). They manage day-to-day reception desk tasks, member registrations, split payments (Cash & UPI), cash drawer reconciliation, attendance monitoring, and financial profit splits directly from mobile phones or a reception tablet. There are no trainer/staff accounts in v1.
- **Gym Members:** Walk-in members who self-register via entrance QR codes, receive digital membership ID cards with cryptographic QR tokens on WhatsApp, and scan in at the front desk for attendance.

## Product Purpose

Paradise Gym Management PWA is a mobile-first, offline-capable operational management system built to eliminate paper registers, chaotic WhatsApp chats, and expensive proprietary gym software subscriptions. It provides a permanent ₹0 recurring software cost stack while ensuring complete data sovereignty, high-speed check-ins, and airtight financial tracking.

## Positioning

A lightweight, zero-subscription gym management PWA engineered for independent Indian gyms. Unlike bloated generic SaaS that requires monthly fees, constant high-speed internet, and desktop screens, Paradise Gym runs on ₹0 infrastructure, operates seamlessly during gym broadband outages via local IndexedDB, processes Indian split payments (Cash + UPI), and automatically extends memberships during holiday shutdowns.

## Operating Context

- **Front-Desk Counter:** Physical reception phone or tablet mounted at the gym entrance facing arriving members.
- **Peak Hour Check-in Queues:** Rapid 1-second touchless QR check-in flow with sound feedback during intense morning (6:00 AM – 9:00 AM) and evening (5:00 PM – 9:00 PM) foot traffic.
- **Intermittent Connectivity:** Gym broadband or cellular networks that frequently drop; the app must record check-ins offline without failure and automatically sync when online.
- **Evening Financial Reconciliation:** Daily cash drawer counting versus logged cash collections, alongside UPI reference verification.

## Capabilities and Constraints

- **Monetary Precision:** All currency strictly modeled as 64-bit integer paise (`amount_paise INT NOT NULL`, ₹1 = 100 paise). Zero floating-point math anywhere in database or application logic.
- **Offline Attendance Engine:** ZXing-powered camera barcode scanner with local IndexedDB queueing, auto-sync upon reconnection, and duplicate check-in deduplication.
- **Privacy & Security:** QR tokens are purely random 32-byte non-PII strings (no member names, phone numbers, or dates in QR payload).
- **Payment Lifecycle:** Split payment recording across multiple instruments (Cash, UPI, Card), First-In-First-Out (FIFO) unpaid dues clearing, and non-destructive audit corrections.
- **Partner Finances:** Strict separation of operational gym expenses (rent, electricity, maintenance) from partner drawing accounts to keep true operational profit (EBITDA) accurate.
- **Holiday & Closure Engine:** 1-tap gym closure logging with automatic membership duration extensions.
- **Data Sovereignty:** 1-tap export of full spreadsheets (CSV with UTF-8 BOM for Microsoft Excel) and full JSON database backups for disaster recovery.

## Brand Commitments

- **Name:** Paradise Gym
- **Tone:** Professional, high-contrast, energetic, and clean dark mode aesthetic (`slate-950` background, high-contrast typography, emerald/brand accent highlights).
- **Format:** Installable PWA with mobile-first bottom navigation dock designed for 1-hand thumb ergonomics on 360px–430px viewports.

## Evidence on Hand

- Complete database schema with 24 tables and Row Level Security in [`supabase/migrations/`](./supabase/migrations).
- Full functional test suite with 23 test files and 97 passing Vitest tests in [`tests/unit/`](./tests/unit).
- Operational runbooks in [`docs/runbooks/PARTNER_GUIDE.md`](./docs/runbooks/PARTNER_GUIDE.md) and [`docs/runbooks/DISASTER_RECOVERY.md`](./docs/runbooks/DISASTER_RECOVERY.md).
- Detailed Product Requirements Document in [`Gym_Management_PWA_PRD.md`](./Gym_Management_PWA_PRD.md).

## Product Principles

1. **₹0 Permanent Recurring Cost:** Every technical decision must fit within free-tier limits (Cloudflare Pages, Supabase free PostgreSQL, client-side processing) without forced vendor upgrades.
2. **Offline Resilience First:** Reception desk check-ins must never stall due to Wi-Fi drops or cloud latency.
3. **No Compromise on Monetary Integrity:** Every rupee is tracked down to the exact paisa; partner draws never contaminate operating overhead.
4. **Thumb-First Mobile Ergonomics:** All core daily flows (check-in, payment recording, member renewal) must be executable in under 3 taps using one hand.
5. **Data Sovereignty by Default:** The gym owners own 100% of their data and can walk away at any time with full CSV/JSON exports.

## Accessibility & Inclusion

- High-contrast color palette meeting WCAG AA standards in dark mode.
- Large touch targets (minimum 44x44px, ideally 48px) for quick reception desk tapping.
- Dual-mode check-in (camera barcode scanner accompanied by instant manual name/phone search fallback for members without smartphones).
- Multilingual-ready design (phone numbers normalized to E.164 standard, currency formatted according to Indian numbering system: ₹1,50,000).

