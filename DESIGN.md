---
name: Paradise Gym Management
description: High-performance, offline-first mobile PWA for single-location gym operations
colors:
  primary: "#10b981"
  primary-hover: "#059669"
  primary-deep: "#047857"
  neutral-bg: "#020617"
  surface: "#0f172a"
  surface-elevated: "#1e293b"
  border-subtle: "#1e293b"
  border-active: "#334155"
  text-primary: "#f8fafc"
  text-secondary: "#94a3b8"
  text-muted: "#64748b"
  accent-amber: "#f59e0b"
  accent-rose: "#f43f5e"
  accent-sky: "#38bdf8"
  accent-purple: "#c084fc"
typography:
  display:
    fontFamily: "-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif"
    fontSize: "1.5rem"
    fontWeight: 900
    lineHeight: 1.15
  headline:
    fontFamily: "-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif"
    fontSize: "1.125rem"
    fontWeight: 800
    lineHeight: 1.25
  title:
    fontFamily: "-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 700
    lineHeight: 1.3
  body:
    fontFamily: "-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 400
    lineHeight: 1.45
  label:
    fontFamily: "-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif"
    fontSize: "0.6875rem"
    fontWeight: 700
    lineHeight: 1
rounded:
  sm: "8px"
  md: "12px"
  lg: "16px"
  xl: "24px"
  full: "9999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "14px"
  lg: "20px"
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.neutral-bg}"
    rounded: "{rounded.md}"
    padding: "10px 16px"
  card-surface:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.text-primary}"
    rounded: "{rounded.lg}"
    padding: "14px"
---

# Design System

## Overview

Paradise Gym Management PWA is built for high-throughput, tactile mobile operation at the gym reception desk. Designed for rapid 1-hand thumb interactions on mobile phones and tablets, the visual language prioritizes instant scanning, dark-mode clarity under gym lighting, and 60fps buttery responsiveness with zero sluggishness.

## Colors

- **Base Canvas:** Deep slate background (`#020617` / `slate-950`).
- **Surface Elevation:** Card containers use `#0f172a` (`slate-900`) bounded by fine 1px borders (`#1e293b`).
- **Primary Brand:** Vibrant energetic emerald (`#10b981` / `brand-500`) used for primary action buttons, active tab indicators, and verified check-in badges.
- **Semantic Accents:**
  - *Amber (`#f59e0b`):* Pending fee dues, expiring plans, and offline sync warning badges.
  - *Rose (`#f43f5e`):* Operating expenses, closures, cancellations, and destructive confirmations.
  - *Sky (`#38bdf8`):* Active member count, UPI transactions, and member directory.
  - *Purple (`#c084fc`):* Long-term annual plans, CSV imports, and JSON backups.

## Typography

- **System Native Stack:** `-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif` for native-like rendering with zero font download overhead.
- **Tabular Numerals (`font-feature-settings: 'tnum'`):** All rupee currency figures (`₹1,500.00`), attendance timestamps, and counters use proportional tabular figures to prevent horizontal jitter when values update in real time.
- **Scale Contrast:** Sharp contrast between compact uppercase metadata labels (`0.6875rem`, bold, tracking-wider) and prominent summary figures (`1.5rem`–`1.75rem`, font-black).

## Layout

- **Ergonomic Thumb Zone:** Primary navigation and key action triggers are placed within the bottom 40% of the screen.
- **Docked Bottom Navigation:** Fixed bottom navigation bar with safe-area bottom inset support (`env(safe-area-inset-bottom)`) and minimum 48px touch targets.
- **Max-Width Container (`max-w-lg`):** Centralized 480px width constraint guarantees optimal readability and compact thumb-reach on large tablets and desktop displays.

## Elevation & Depth

- **Tonal Layering over Heavy Dropshadows:** Clean depth is achieved primarily through subtle surface color stepping (`slate-950` → `slate-900` → `slate-800`) rather than expensive GPU blur filters.
- **Subtle Glow & Focus Rings:** Interactive cards carry a delicate 1px border highlight (`hover:border-slate-700/80`), keeping mobile frame rates at 60fps without laggy compositor overhead.

## Shapes

- **Smooth Rounded Corners:**
  - Container Cards: `rounded-2xl` (`16px`)
  - Badges & Pills: `rounded-full` (`9999px`)
  - Modals & Sheets: `rounded-3xl` (`24px`)
  - Buttons: `rounded-xl` (`12px`)

## Components

- **Touch-Optimized Controls:** All actionable elements use `touch-action: manipulation` to completely bypass 300ms mobile browser tap delays.
- **Tactile Tap Feedback (`.tap-bounce`):** Subtle `scale(0.97)` active press state providing instantaneous visual response upon touching.
- **Debounced Inputs:** Search inputs debounce queries by 150ms to ensure 0 frame drops while typing.
- **Skeleton Loaders:** Shimmering layout placeholders prevent content jump when fetching or filtering.

## Do's and Don'ts

### Do
- Always use integer paise for money calculations and format as `₹X,XXX.00` with tabular numerals.
- Ensure all clickable items meet the 48x48px touch target floor.
- Keep mobile inputs configured with native input modes (`inputMode="tel"` for mobile numbers, `inputMode="decimal"` for amounts).
- Keep animations hardware-accelerated (`transform`, `opacity`).

### Don't
- Do not use floating-point numbers for currency math.
- Do not add complex multi-layered blur filters or nested cards that cause scroll lag on mobile processors.
- Do not embed PII (names, phone numbers) into QR code payloads.
- Do not block user interactions when offline; always queue to IndexedDB with optimistic UI feedback.
