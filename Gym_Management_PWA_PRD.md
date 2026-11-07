# Gym Management PWA --- Product Requirements Document

**Version:** 1.0\
**Date:** 7 November 2026\
**Product:** Mobile-first gym management Progressive Web App (PWA)

------------------------------------------------------------------------

## 1. Product overview

Build a mobile-first, installable Progressive Web App for a newly
opened, single-location gym operated by two business partners.

The app will centralise member registration, memberships, QR attendance,
payments, expenses and basic financial reporting. Both partners will use
their own phones and have equal administrative permissions.

**Primary objective:** Make everyday gym operations simple enough that
either partner can manage the business independently, without needing
the developer for routine changes.

**Cost objective:** Aim for ₹0 recurring software and hosting costs.
This is a design target, not a guarantee of permanent free hosting or
uninterrupted availability.

## 2. Product boundaries

### Included in the initial version

-   Two partner accounts with equal permissions.
-   Member registration and management.
-   Membership plans, renewals and expiry tracking.
-   QR-based attendance with manual fallback.
-   Limited offline attendance queue and synchronisation.
-   Payments, dues, refunds and payment history.
-   Expenses and basic financial reporting.
-   Partner capital contributions and withdrawals.
-   WhatsApp message preparation and sharing.
-   Reports and data exports.
-   First-time setup wizard.
-   Demo mode and in-app help.
-   Developer-assisted backup restoration.

### Excluded or deferred

-   Staff or trainer accounts.
-   Member login portal.
-   Multiple gym branches.
-   Equipment and inventory management.
-   Payment gateway integration.
-   Automated WhatsApp Business API messaging.
-   Advanced accounting and GST invoicing.
-   Membership freeze/pause feature.
-   Family/group memberships.
-   Native Android/iOS applications.
-   Guaranteed automated cloud backups.

The initial design should comfortably support fewer than 100 members
while avoiding unnecessary complexity.

## 3. Users and permissions

### Gym partners

-   Two separate email-and-password logins.
-   Equal full administrative permissions.
-   Shared business data.
-   Either partner can register members, renew memberships, manage
    attendance, record payments, manage plans, record expenses and
    change business settings.
-   Both can see the other partner's presence and last-active
    information.
-   No second-person approval is required for normal operations.

### Developer

-   Technical access to the gym-owned infrastructure and code
    repository.
-   Responsible for code, deployment, technical security changes and
    developer-assisted backup restoration.
-   Not required for ordinary business operations.

There will be no staff roles or separate permission levels in the
initial release.

## 4. Main navigation and screens

The app opens on the dashboard after login.

Suggested mobile navigation:

1.  Dashboard
2.  Members
3.  Attendance
4.  Payments
5.  More

The More menu contains memberships/plans, expenses, reports, offers,
closures, settings, help and demo mode.

The interface should have large touch targets, readable labels, simple
forms, clear confirmation messages and minimal navigation. It should
support light and dark themes.

## 5. Functional requirements

### 5.1 Dashboard

The dashboard should present key operational information as numbers and
simple tables, not charts.

It should include:

-   Active, expired and total member counts.
-   Today's and this month's attendance.
-   Today's and this month's collections.
-   Collections split by cash, UPI and online.
-   Pending and partial payments.
-   Upcoming membership expiries.
-   Daily and monthly expenses.
-   Estimated profit.
-   Partner capital contributions and withdrawals.
-   Recent activity and important alerts.

Alerts should appear inside the dashboard. No push-notification service
is required.

### 5.2 Member management

#### Registration

-   Partners can register members manually.
-   Members can submit a self-registration form through a QR code or
    shared link.
-   Self-registrations enter a pending-approval queue.
-   A partner must approve a submission before a membership is
    activated.
-   Name, mobile number and selected plan are essential.
-   Date of birth, gender and emergency contact are optional.
-   No member photo or address is required.
-   Detect duplicate mobile numbers.

#### Member profiles

Each profile should show:

-   Member ID, name and mobile number.
-   Current membership and status.
-   Outstanding balance.
-   Registration and joining details.
-   Membership, renewal and payment history.
-   Attendance history.
-   Discounts and membership changes.
-   Custom tags.

Member IDs should be sequential, for example `GYM001`, with a
configurable prefix.

#### Search and organisation

-   Search by name, mobile number or member ID.
-   Filter by membership status, plan, expiry, joining date and pending
    payments.
-   Custom tags can be created, edited, assigned and searched.
-   Members can be archived and later reactivated.
-   Permanent deletion is restricted and must account for applicable
    record-retention obligations.
-   Import existing members and membership details using CSV/Excel, with
    validation and a preview before importing.

Historical payment and attendance imports are not required in the first
version.

#### Digital membership cards

-   Generate a shareable PNG card.
-   Show member name, ID, plan, expiry, status and QR code.
-   Regenerate the card when membership details change.
-   Allow partners to manually regenerate and share it through WhatsApp.

### 5.3 Membership management

Partners can create and manage:

-   Monthly plans.
-   Quarterly plans.
-   Half-yearly plans.
-   Yearly plans.
-   Custom-duration plans.

Plan prices and durations must be editable. Existing membership records
must retain the price and duration that applied when they were created.

#### Membership lifecycle rules

1.  A member has only one active membership at a time.
2.  A partner activates a membership when the member is ready to start.
3.  The expiry date is calculated from the activation date and plan
    duration.
4.  Early renewal extends the membership from the existing expiry date,
    preserving unused days.
5.  Each renewal creates a new membership-history record.
6.  Expired members remain searchable and retain their full history.
7.  Expiry warnings are configurable and shown on the dashboard.
8.  Expired members may be allowed entry through a partner override,
    with a recorded reason.
9.  Membership cancellation supports cancellation with or without a
    refund.
10. Membership upgrades and downgrades are supported mid-cycle, with
    automatic prorating and a manual amount override.
11. Manual expiry adjustments require a reason and activity record.
12. Transfers are handled as manual exceptions: cancel the original
    membership and create another, preserving both histories.
13. Membership freezes/pauses are deferred.

#### Discounts and joining fees

-   Optional joining fee, configurable or zero.
-   Manual discounts and reusable promotional offers.
-   Offers have validity dates.
-   Only one discount may apply to a membership; no stacking.
-   Store original price, discount amount, final price and approving
    partner.
-   No complimentary membership feature.

#### Outstanding balances

-   Outstanding balances carry forward when a member renews.
-   Dues remain traceable to their original membership or charge.
-   A renewal does not require all old dues to be cleared.
-   Normal outstanding balances have no compulsory due date.
-   Optional instalment schedules can specify amounts and due dates.
-   Members with dues can still enter if their membership is active,
    with a warning.

### 5.4 QR attendance

#### Primary flow

1.  Partner opens the attendance scanner.
2.  Partner scans the member's QR code using the phone camera.
3.  Attendance is recorded immediately.
4.  The app displays the member's details, membership status and
    outstanding balance.

The QR should contain a secure, non-personal token rather than exposed
personal information.

#### Fallbacks and exceptions

-   If scanning fails, search by name, mobile number or member ID.
-   Partners can record attendance manually from search results.
-   Partners can regenerate a member's QR code; the old token becomes
    invalid.
-   Repeated scans shortly after a previous scan trigger a warning but
    can still be accepted.
-   Multiple genuine visits in one day are permitted.
-   Attendance records store date, time and the partner who recorded
    them.
-   Entry is the default; optional exit recording is supported.
-   Checkout is not compulsory.
-   Expired membership warnings do not automatically block attendance.
-   Attendance outside configured operating hours is not blocked.

#### Offline attendance

The app should support a limited offline attendance workflow:

-   Cache the member records needed for attendance.
-   Store offline check-ins locally on the device.
-   Display pending records and sync status.
-   Automatically sync when connectivity returns.
-   Detect duplicate or conflicting records during sync.
-   Clearly warn partners that offline membership status may be stale.
-   Permit attendance with a warning when offline.

Offline support is a high-risk area for mobile browser differences. It
must be tested on the actual Android and iPhone devices before release.

#### Corrections

Partners can correct attendance, add a missing entry or add/correct an
exit. Corrections must preserve the original record and store the
reason, partner and timestamp.

### 5.5 Payments and refunds

#### Payment methods

-   Cash.
-   UPI.
-   Online payment recorded manually.

The app should display the gym's UPI QR code. Scanning the QR is not
proof of payment: a partner must verify receipt independently before
recording the payment.

There is one default gym UPI QR, but partners can record payments
received into other partner UPI accounts. The app records the receiving
account separately from the partner who entered the transaction.

#### Payment recording

-   Full, partial, advance and pending/credit payments.
-   Split payments, such as cash plus UPI.
-   Flexible partial payments.
-   Optional instalment schedules.
-   Payments without an active membership, for example old dues or
    joining fees.
-   Payment breakdowns by method and receiving account.

#### Payment allocation

-   Default allocation is oldest outstanding balance first (FIFO).
-   A partner can override the allocation.
-   An override should record the partner and reason.

#### Corrections and refunds

-   Payments can be edited or reversed.
-   Preserve original and revised values.
-   Record correction reason, partner and timestamp.
-   Refunds are separate transactions.
-   Record refund amount, reason, date and related cancellation where
    applicable.
-   Never erase the original payment to represent a refund.

#### Receipts

Prepare a one-tap WhatsApp message containing member name, amount,
payment method, date and remaining balance. No PDF receipt is required
initially.

### 5.6 Expenses and partner transactions

#### Expenses

Record:

-   Amount.
-   Category.
-   Date.
-   Description.

Provide predefined and custom expense categories, with daily and monthly
views. Receipt uploads and advanced accounting are excluded.

#### Partner transactions

Track separately:

-   Partner capital contributions/investments.
-   Partner withdrawals.

These are not treated as ordinary income or expenses.

#### Financial reporting

Provide:

-   Membership income and collections.
-   Cash, UPI and online breakdowns.
-   Pending and partial payments.
-   Expenses.
-   Refunds.
-   Partner contributions and withdrawals.
-   Monthly income and expense reports.
-   Estimated profit.
-   Transaction history with the recording partner.

The app reports estimated profit only. It does not calculate automatic
profit splits between partners.

### 5.7 Communication

WhatsApp is the only communication channel in the initial version.

Provide prepared, editable messages for:

-   Welcome messages.
-   Membership expiry reminders.
-   Renewal reminders.
-   Payment receipts.
-   Outstanding-dues follow-ups.
-   Inactivity follow-ups.
-   Announcements.

Partners select the relevant member or members and send the prepared
message through WhatsApp themselves. There is no automated WhatsApp
Business API integration, SMS service or email marketing.

Inactivity thresholds should be configurable. The app can show
attendance trends and suggest a manual follow-up.

### 5.8 Reports, export and restoration

Partners can export all important business records at any time:

-   Members.
-   Memberships and renewals.
-   Attendance.
-   Payments and allocations.
-   Expenses.
-   Refunds.
-   Partner transactions.
-   Relevant settings and reference data.

Support CSV/Excel exports and PDF reports where useful. Reports and
documents can be shared through WhatsApp.

#### Backup and recovery policy

-   Partners download and maintain their own exports.
-   No monthly backup reminder is required.
-   No automatic cloud-backup promise is made in the free initial setup.
-   Restoring data is developer-assisted.
-   A restore must include validation, duplicate checks and a safe
    procedure to avoid overwriting current records accidentally.

### 5.9 Settings and first-time setup

A first-time setup wizard should guide the partners through:

-   Gym name and basic details.
-   Partner accounts.
-   Membership plans and prices.
-   Joining fee.
-   UPI QR and receiving accounts.
-   Operating hours.
-   Weekly holidays.
-   Expiry-warning preferences.
-   Theme preference.

Partners can subsequently change business settings, including plans,
prices, offers, UPI details, branding, operating hours and holiday
settings.

Technical configuration, deployment, database security and code changes
remain developer-managed.

### 5.10 Closures and holiday extensions

-   Partners can configure weekly closed days.
-   Partners decide whether weekly closed days extend memberships.
-   Special closures can be entered in a calendar.
-   The app identifies potentially affected memberships.
-   Partners manually choose which memberships to extend.
-   New members joining after a closure are not automatically extended;
    the partner must approve an extension.

### 5.11 Demo mode and in-app help

#### Demo mode

Provide a clearly separated demo environment containing sample members,
memberships, payments, attendance and reports. Demo actions must never
modify real gym records.

#### In-app help

Provide simple, visual guides for member registration, renewals,
attendance, payments, refunds, expenses, reports, exports and settings.
Instructions should be written for non-technical users.

## 6. Business rules and important edge cases

  -----------------------------------------------------------------------
  Situation                           Required behaviour
  ----------------------------------- -----------------------------------
  Member renews early                 Extend from existing expiry, not
                                      today's date

  Plan price changes                  Preserve old membership price

  Member has old dues                 Carry dues forward

  Member pays partially               Update outstanding balance

  Payment covers multiple dues        Allocate oldest first by default

  Partner changes allocation          Preserve the override and reason

  Membership is cancelled             Keep membership and payment history

  Refund is issued                    Record a separate refund
                                      transaction

  Member QR is regenerated            Invalidate the old token

  Member scans twice quickly          Warn, but allow another visit

  QR scanning fails                   Allow manual member search

  Attendance is offline               Queue locally and sync later

  Member has dues                     Warn; don't automatically block
                                      active membership

  Gym closes for a special day        Show affected members for manual
                                      extension approval

  Partner corrects a transaction      Preserve the original and
                                      correction history
  -----------------------------------------------------------------------

### Decisions to settle before implementation

-   **Expiry-date convention:** Decide whether the activation date
    counts as the first membership day. Recommended: yes. A 30-day plan
    activated on 1 December expires at the end of 30 December.
-   **Offline-device conflicts:** Test how queued attendance from both
    phones is reconciled, especially if both devices record the same
    member's visit.

## 7. High-level data model

Use a relational database so financial and membership records remain
traceable.

  -----------------------------------------------------------------------
  Entity / table                      Purpose
  ----------------------------------- -----------------------------------
  `gym`                               Single gym's identity and
                                      configuration

  `partners`                          Two partner profiles linked to
                                      authentication

  `members`                           Member profile and status

  `member_tags`                       Custom tags

  `member_tag_assignments`            Tags assigned to members

  `registration_submissions`          Public registration requests
                                      awaiting approval

  `membership_plans`                  Configurable plan definitions

  `memberships`                       Individual membership instances and
                                      history

  `membership_changes`                Upgrades, downgrades and manual
                                      adjustments

  `discounts`                         Reusable promotional offers

  `membership_discounts`              Discounts applied to memberships

  `payments`                          Payment transactions

  `payment_allocations`               Links payments to dues/charges

  `charges`                           Membership charges, joining fees
                                      and other dues

  `instalment_schedules`              Optional payment schedule

  `refunds`                           Refund transactions

  `attendance`                        Member check-ins and optional
                                      check-outs

  `qr_tokens`                         Secure, revocable QR identifiers

  `expenses`                          Business expenses

  `partner_transactions`              Capital contributions and
                                      withdrawals

  `gym_closures`                      Weekly holidays and special
                                      closures

  `membership_extensions`             Approved holiday and manual
                                      extensions

  `activity_logs`                     Important actions, corrections and
                                      actors

  `gym_settings`                      Operating hours, currency,
                                      preferences and configuration
  -----------------------------------------------------------------------

### Data integrity rules

-   A payment should not disappear when a membership is cancelled.
-   Every renewal should be independently identifiable.
-   Every payment allocation should be traceable to a charge.
-   Every correction should retain its original values.
-   QR tokens should be stored securely and revocable.
-   Partner identity and timestamps should be recorded on important
    operations.
-   Financial records should be protected from accidental deletion.
-   Monetary values should use precise decimal or integer paise
    representation, never floating-point arithmetic.
-   Store timestamps consistently and display them in Asia/Kolkata time.

## 8. Recommended technical architecture

### Recommended stack

  Layer             Recommendation
  ----------------- -----------------------------------
  Frontend          React + TypeScript
  Styling           Tailwind CSS
  PWA               Web app manifest + service worker
  Backend           Supabase
  Database          PostgreSQL
  Authentication    Supabase Auth
  Access control    PostgreSQL Row Level Security
  QR generation     Client-side QR library
  QR scanning       Browser camera-based scanner
  Offline storage   IndexedDB
  Hosting           Cloudflare Pages
  Source control    GitHub
  Development       MacBook

### Architecture overview

**Partner phones (Android PWA / iPhone PWA)**\
→ **React + TypeScript PWA** (mobile interface, offline cache and QR
scanner)\
→ **Supabase** (PostgreSQL, authentication, Row Level Security and
realtime)\
→ **Gym-owned data and infrastructure** (database, exports,
configuration and recovery process)

### Why this stack?

-   React and TypeScript are suitable for a structured, maintainable
    application.
-   PostgreSQL handles membership, payments and financial relationships
    well.
-   Supabase provides authentication, database access and realtime
    capabilities without needing to operate a server yourself.
-   Cloudflare Pages can host the static PWA.
-   IndexedDB can hold pending offline attendance records.
-   GitHub provides version control and a handover path for another
    developer.

### Zero-cost hosting caveat

The initial deployment target is Cloudflare Pages plus Supabase Free.
Free plans have quotas and operational limitations. Supabase Free
projects can pause after a period of low activity, and the free plan
does not provide downloadable automatic database backups. Cloudflare
Pages has build and Functions quotas; keep the initial frontend static
and avoid unnecessary server-side functions.

These services make a low-traffic zero-monthly-cost deployment
plausible, but they do not guarantee permanent free service or
business-critical uptime. The gym partners must accept the possibility
of downtime and manual recovery. Keep the database schema portable and
document how to migrate to a paid or different provider later.

## 9. Security, privacy and reliability

### Authentication and access control

-   Separate accounts for both partners.
-   Secure password hashing and email-based password recovery through
    the authentication provider.
-   Secure session handling.
-   Database-level Row Level Security policies.
-   Both partners can access the same gym records.
-   No service-role or database secret keys in frontend code.
-   Technical credentials stored in protected deployment environment
    variables.
-   No public access to member or financial records.

### Public registration security

The public registration form should:

-   Accept only the fields needed for registration.
-   Validate data on the server.
-   Detect duplicate mobile numbers.
-   Create pending submissions rather than active members.
-   Never allow public visitors to access existing member information.

The initial scope does not include CAPTCHA or a dedicated anti-spam
system. Partner approval is the primary protection against invalid
registrations. Basic server-side validation and sensible request limits
should still be implemented where feasible.

### Privacy

-   Show a clear privacy notice on the registration form.
-   Obtain any consent required for the information being collected and
    how it will be used.
-   Collect only necessary information.
-   Restrict access to emergency contacts and other personal details to
    authenticated partners.
-   Define a retention and deletion policy before launch.

### Reliability and data recovery

-   Validate every financial transaction before saving it.
-   Use database transactions for operations that update multiple
    related records.
-   Preserve audit history for financial and attendance corrections.
-   Keep offline attendance clearly marked as pending until successfully
    synced.
-   Provide a documented manual database export and restoration
    procedure.
-   Test backup restoration before the app is used for real business
    records.

## 10. Implementation roadmap

### Phase 1 --- Foundation and ownership

-   Create gym-owned infrastructure accounts.
-   Set up GitHub repository and deployment.
-   Configure Supabase database and authentication.
-   Build partner login and access policies.
-   Build the PWA shell, navigation and theme.
-   Add first-time setup wizard.
-   Establish demo and production data separation.

**Milestone:** Foundation ready.

### Phase 2 --- Members and memberships

-   Member registration and profiles.
-   Self-registration and approval queue.
-   Membership plans and pricing.
-   Renewals, expiries and history.
-   Discounts, joining fees and outstanding balances.
-   Member import and digital membership cards.

### Phase 3 --- Payments and financial management

-   Payment recording and split payments.
-   Payment allocation and outstanding balances.
-   Instalment schedules.
-   Refunds and transaction corrections.
-   Expenses and partner transactions.
-   Financial reports.

### Phase 4 --- QR attendance and offline support

-   Secure QR tokens.
-   Camera scanner and manual fallback.
-   Attendance history and corrections.
-   Optional check-outs.
-   Offline queue and automatic sync.
-   Duplicate detection and conflict handling.

### Phase 5 --- Dashboard and communication

-   Dashboard metrics and alerts.
-   Expiry and inactivity views.
-   WhatsApp message preparation.
-   Closures and membership extensions.
-   Search, filters and reports.

### Phase 6 --- Export, help and release

-   CSV/Excel exports and PDF reports.
-   In-app help guides.
-   Backup and developer-assisted restore documentation.
-   Android and iPhone testing.
-   Security and permission testing.
-   Partner onboarding and handover.

Do not launch the public registration link or rely on offline attendance
until the related security and sync tests have passed.

## 11. Acceptance criteria

  -----------------------------------------------------------------------
  Area                                Acceptance test
  ----------------------------------- -----------------------------------
  Partner accounts                    Both partners can log in
                                      independently and access the same
                                      records

  Permissions                         Neither partner can access another
                                      gym's data

  Members                             A partner can register, search,
                                      edit, archive and reactivate a
                                      member

  Registration                        A public submission remains pending
                                      until approved

  Membership                          Renewals, expiry and historical
                                      prices work correctly

  Discounts                           One discount can be applied without
                                      stacking

  Payments                            Partial and split payments
                                      correctly update balances

  Dues                                Outstanding amounts carry forward
                                      on renewal

  Refunds                             Refunds do not erase original
                                      payments

  Attendance                          QR scanning records the correct
                                      member and timestamp

  QR fallback                         Manual search works if camera
                                      scanning fails

  Offline                             Queued check-ins sync without
                                      unintended duplicates

  Expenses                            Expenses appear in the correct
                                      daily and monthly reports

  Financials                          Contributions and withdrawals are
                                      separate from income and expenses

  WhatsApp                            Prepared messages contain correct
                                      member and payment details

  Export                              Partners can download the required
                                      business records

  Demo                                Demo actions cannot affect real
                                      records

  Help                                Partners can follow instructions
                                      for common operations

  PWA                                 Both phones can install and use the
                                      app

  Recovery                            A developer can follow documented
                                      steps to restore a tested backup
  -----------------------------------------------------------------------

## 12. Key risks and decisions

  -----------------------------------------------------------------------
  Risk                                Mitigation
  ----------------------------------- -----------------------------------
  Supabase free project pauses        Accept downtime initially; document
                                      recovery and upgrade path

  No automatic free-tier database     Regular manual exports and tested
  backups                             restore procedure

  Offline attendance conflicts        Device testing, unique event IDs
                                      and sync validation

  Public registration spam            Pending approval and duplicate
                                      mobile checks

  QR token misuse                     Random tokens, revocation and no
                                      personal information in QR

  Incorrect financial edits           Transaction history and correction
                                      reasons

  Free-tier policy changes            Gym-owned accounts and portable
                                      database design

  Owners depend on developer          In-app help, business settings and
                                      handover documentation
  -----------------------------------------------------------------------

### Decisions intentionally deferred

These do not prevent the initial product from being designed, but should
be resolved before the relevant feature is implemented:

1.  Gym name, logo and brand colours.
2.  Exact expiry-date convention.
3.  Final operating hours and weekly closure days.
4.  Actual membership prices and joining fee.
5.  UPI QR and receiving-account details.
6.  Exact retention rules for member and financial records.
7.  Whether the partners want to upgrade hosting if free-tier downtime
    becomes inconvenient.

## 13. Final product definition

The initial release is a mobile-first gym management PWA with:

-   Two partner accounts.
-   One gym location.
-   A target of zero recurring infrastructure costs.
-   Android and iPhone support.
-   Simple member and membership management.
-   QR attendance with offline fallback.
-   Payment, dues, refund and expense tracking.
-   Basic financial reporting.
-   Manual WhatsApp communication.
-   Data export and developer-assisted restoration.
-   Gym-owned infrastructure and documented developer handover.

### Overall technical recommendation

Build this as a modular monolithic PWA, not a microservices system. A
single React application, one PostgreSQL database and a small set of
well-defined backend operations are sufficient for the gym's initial
size. This will be easier to develop, maintain, test and hand over.
