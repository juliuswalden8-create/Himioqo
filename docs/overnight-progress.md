# Overnight progress

Updated after each phase. Baseline and architecture notes live in
`docs/overnight-plan.md`.

## Phase 0 — Baseline

**Done.** Inspected the repository, recorded the baseline, wrote the plan. No
existing work was committed, reset or discarded; the 63 uncommitted files are
untouched apart from the deliberate edits listed below.

Baseline before any change: `lint` pass, `typecheck` pass, `build` pass, no test
runner present.

**Files changed:** `next.config.ts` (honour `NEXT_DIST_DIR` so a production
build cannot wipe the running dev server's CSS), `eslint.config.mjs` and
`.gitignore` (ignore `.next-build`), `docs/overnight-plan.md`,
`docs/overnight-progress.md`.

## Phase 1 — Status system and translated labels

**Done.**

`src/lib/labels.ts` held Swedish string maps that `StatusBadge` rendered
regardless of the reader's language, so the whole manager dashboard was Swedish
for an English or Spanish user. Replaced the maps with dictionary lookups.

- `CaseStatus` extended from five to the nine statuses in the brief:
  `new`, `reviewing`, `assigned`, `accepted`, `in_progress`, `waiting`,
  `resolved`, `approved`, `cancelled`. Added `OPEN_STATUSES`, `CLOSED_STATUSES`
  and `CONTRACTOR_STATUSES` so "open" and "closed" are defined in one place.
- `CasePriority` extended with `normal`, giving the four levels the brief asks
  for. Guests still choose from three friendlier options via `GUEST_PRIORITIES`.
- `src/lib/status.ts` maps every new value to an existing `status-*` token. No
  new colours.
- Date formatting was pinned to the Swedish `date-fns` locale everywhere.
  `src/lib/format.ts` now takes a locale and supports sv, en, es, de, fr, nl.
  `greeting()` takes dictionary templates instead of Swedish literals.

**Files changed:** `src/lib/types.ts`, `src/lib/status.ts`, `src/lib/labels.ts`,
`src/lib/format.ts`, `src/components/status-badge.tsx`,
`src/components/tenant-report-form.tsx`, `src/lib/data/store.ts`,
`src/i18n/messages.ts`, `src/app/app/page.tsx`, `src/app/app/cases/page.tsx`,
`src/app/app/cases/[id]/page.tsx`.

**Tested:** `typecheck` and `lint` pass.

## Phase 2 — Manager issue handling and the contractor portal

**Done.** This closes the largest gap found in Phase 0: the store could assign
contractors and change status, but nothing in the UI called those functions, and
there was no contractor-facing route at all.

Data model additions, all organisation-scoped: `CaseNote` (internal notes),
`Notification` (unified in-app feed), `OwnerAccess` (revocable owner links),
`PilotLead`. `MaintenanceCase` gained `workToken`, `contractorAcceptedAt`,
`contractorDeclinedAt`, `declineReason`, `approvedAt` and `workInstructions`.

Token lifecycle, which is the security-sensitive part:

- Assigning a contractor mints a fresh `wk_` token (18 random bytes).
- Changing the contractor, declining, approving or rotating all clear or replace
  the token, so the previous link stops resolving immediately.
- Every contractor action re-resolves the case from the token rather than
  trusting a case id in the form, and photo/status actions additionally require
  the task to have been accepted.

`src/lib/uploads.ts` is new: server-side validation of every photo payload
(data-URL shape, allowed MIME types, 8 MB per photo, 8 photos per request).
The browser pre-checks the same rules for feedback. Previously nothing was
validated on either side.

**Files changed:** `src/lib/types.ts`, `src/lib/data/store.ts`,
`src/lib/actions.ts`, `src/lib/contractor-actions.ts` (new),
`src/lib/uploads.ts` (new), `src/components/case/triage-panel.tsx` (new),
`src/components/contractor/work-actions.tsx` (new),
`src/app/w/[token]/page.tsx` (new), `src/app/app/cases/[id]/page.tsx`,
`src/i18n/messages.ts`.

**Tested:** `typecheck` and `lint` pass. `tests/workflows.test.ts` (new, 23
tests) covers property creation, QR token issuing, guest reporting into the
dashboard, the full contractor accept/progress/document/finish loop, link
revocation on decline, rotation and approval, the cleaning checklist,
damage-to-case conversion, owner access scoping, and cross-organisation
isolation. All pass.

Test harness added: `vitest` (dev dependency only), `vitest.config.mts`,
`npm test` / `npm run test:watch`.

One real bug found by the tests and fixed: `createOwnerAccess` returned a live
reference into the store, so a caller's copy silently changed when the token was
rotated. Owner-access reads now return snapshots.

## Phase 3 — Owner portal, QR management, filtering, notifications

**Done.**

- **Owner portal** at `/o/[token]`: revocable read-only view of one property
  showing status, approved work, before/after photos, cleaning status and recent
  activity. Internal notes, guest details and other properties are filtered out
  before render. Links can be created, deactivated and rotated from the property
  page.
- **QR management**: `/api/qr/[token]` serves a downloadable PNG. The property
  page gained preview, download, copy-link and rotate, with a warning that
  rotation invalidates printed codes.
- **Filtering**: a shared `FilterBar` server component drives GET-based filters —
  cases by search, status, priority, category and property; properties by search,
  city and health. Filtered views are shareable.
- **Notifications**: new store functions plus a feed at `/app/notifications`,
  wired into new and urgent guest issues, contractor accept and complete,
  cleaning started and completed, damage reported and property ready.
  `AppHeader` resolves its own unread count.
- **Cleaner portal polish**: status buttons and the issue form extracted into a
  client component with validation, error states and real alt text.

**Files changed:** `src/app/o/[token]/page.tsx` (new),
`src/app/api/qr/[token]/route.ts` (new), `src/app/app/notifications/page.tsx`
(new), `src/components/filter-bar.tsx` (new),
`src/components/property/qr-panel.tsx` (new),
`src/components/property/owner-access-form.tsx` (new),
`src/components/cleaning/cleaner-controls.tsx` (new),
`src/lib/owner-actions.ts` (new), `src/lib/guide-actions.ts`,
`src/lib/cleaning-actions.ts`, `src/lib/actions.ts`, `src/lib/data/store.ts`,
`src/components/app-header.tsx`, `src/app/app/cases/page.tsx`,
`src/app/app/properties/page.tsx`, `src/app/app/properties/[id]/page.tsx`,
`src/app/c/[token]/page.tsx`, `src/i18n/messages.ts`.

**Tested:** `typecheck`, `lint` and 23 tests pass. Production build succeeded
with 33 routes.

## Phase 4 — Landing page and pilot form

**Done.** Added below the existing hero without altering it or its tuned copy:
the problem section, the pilot programme section, a six-question FAQ using the
existing accordion, and the pilot interest form.

The form validates server-side with Zod, is rate limited to five submissions per
IP per hour, carries a honeypot field, and has explicit error and success
states. The pure validator lives in `src/lib/pilot-schema.ts` so it is testable
without a request context — a `"use server"` module cannot export non-async
functions.

Swedish, English and Spanish copy is written natively per language rather than
translated word for word, and hedges correctly on anything not yet live.

The hero's dashboard preview held hard-coded Swedish. Moved into the dictionary
with the Swedish strings byte-identical, plus an accessible label.

**Files changed:** `src/app/page.tsx`, `src/components/landing/pilot-form.tsx`
(new), `src/lib/pilot-actions.ts` (new), `src/lib/pilot-schema.ts` (new),
`src/i18n/messages.ts`, `tests/workflows.test.ts`.

**Tested:** `typecheck`, `lint` and 28 tests pass. Five new tests cover a
complete submission, missing consent, an invalid email, missing required fields
and an unknown rental type. Verified in the browser at 375px, 768px and 1440px
with zero horizontally overflowing elements at every width.

## Phase 5 — Security review and handover documentation

**Done.** Two real vulnerabilities were found and fixed.

**Forgeable session cookie (critical).** The cookie stored
`profileId:organizationId` as plain text with no signature, and `getSession()`
trusted both halves. Because the seed ids are predictable, sending
`Cookie: homioqo.session=profile_anna:org_bergstrom` granted full manager access
with no credentials.

Cookies are now HMAC-SHA256 signed with `SESSION_SECRET` and verified with
`timingSafeEqual` before the ids are trusted, and are `secure` outside
development. Production throws without a secret; development generates a random
per-process key. Confirmed by request that the forged cookie now redirects to
`/login`, and that real login still works.

**Weak-randomness fallback in `createToken()`.** It fell back to `Math.random()`
when `crypto.getRandomValues` was unavailable. Since guest, contractor, cleaner
and owner links are protected by nothing else, the fallback was removed and the
function now throws.

Also audited and found clean: no `dangerouslySetInnerHTML`, no committed
secrets, organisation scoping on every store read, opaque prefixed tokens rather
than sequential ids, and neutral responses for invalid tokens so the routes do
not confirm which ones exist.

**Files changed:** `src/lib/crypto.ts`, `src/lib/session.ts`, `src/lib/utils.ts`,
`.env.example`, `tests/workflows.test.ts`, `README.md`, and new
`docs/security-review.md`, `docs/product-overview.md`, `docs/data-model.md`,
`docs/user-flows.md`, `docs/pilot-checklist.md`,
`docs/production-readiness.md`, `docs/overnight-summary.md`.

**Tested:** `typecheck` clean, `lint` clean, 32 tests pass, production build
succeeds with 33 routes. Four new tests cover signing round-trip, an unsigned
cookie, a tampered payload and a tampered signature.

## Remaining

Nothing outstanding from this session's scope. The next steps are external
integrations rather than application work: move the data layer to Supabase,
connect Resend, move uploads to object storage, add security headers and a
shared rate-limit store, then run the pilot rehearsal in
`docs/pilot-checklist.md`. See `docs/production-readiness.md`.

## Blockers encountered

None that stopped work. Three worth recording:

- No email provider is configured, so nothing is sent. Templates and previews
  exist and the limitation is documented rather than hidden.
- No translation API is configured. Untranslated content is shown as-is and
  marked, never machine-faked.
- The Next.js dev overlay reports a hydration mismatch while the Cursor browser
  tool is attached. Confirmed to be the tool injecting `data-cursor-ref` after
  SSR — the server HTML contains none — so no code change was made.
