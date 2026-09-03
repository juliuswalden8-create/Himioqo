# Overnight build summary

Session goal: take the Homioqo prototype as far as safely possible toward a
polished, functional, pilot-ready MVP without changing the framework, the visual
identity or any existing behaviour.

Nothing was deployed, published or purchased. No emails were sent, no DNS was
touched, no paid service was connected and no secrets were committed. No
destructive git command was used and no existing work was discarded.

## 1. What was completed

**Foundation and status system.** Extended the issue status model from five
states to the full nine (new, reviewing, assigned, accepted, in progress,
waiting, done, approved, cancelled) and priorities from three to four (low,
normal, high, urgent), with derived sets (`OPEN_STATUSES`, `CLOSED_STATUSES`,
`CONTRACTOR_STATUSES`, `GUEST_PRIORITIES`) driving dashboard counts and the
contractor portal. Status and priority colours are mapped centrally in
`src/lib/status.ts` rather than repeated per component.

**Translation of status labels.** `src/lib/labels.ts` previously held hard-coded
Swedish maps. It is now dictionary-driven, so statuses, priorities, health,
property types and categories are translated like everything else.

**Manager issue workflow.** Built the triage panel on the case detail page:
change status and priority, assign a contractor, write work instructions,
copy or rotate the contractor link, add internal notes, review uploaded work,
approve completion and reopen.

**Contractor portal (`/w/[token]`).** New secure single-task route. A contractor
can accept or decline, set in progress, post updates, upload before-and-after
photos and mark work complete — without an account. The link is scoped to one
case and can be rotated or revoked.

**Owner portal (`/o/[token]`).** New revocable read-only route showing status,
approved work, before/after photos, cleaning status and recent activity for one
property. Internal notes, guest details and other properties are filtered out.

**QR management.** Preview, download as PNG via `/api/qr/[token]`, copy the
guest link, and rotate the token, with a warning that rotation invalidates
printed codes.

**Cleaning portal polish.** Extracted cleaner status buttons and the issue form
into a client component with proper validation, error states and alt text.

**Notifications.** Unified in-app notification system with a new data model,
store functions and a feed at `/app/notifications`, wired into new guest issues,
urgent issues, contractor accept and complete, cleaning started and completed,
damage reported and property ready. The header shows an unread count.

**Filtering.** A shared `FilterBar` gives cases search plus status, priority,
category and property filters, and properties search plus city and health. All
GET-based, so filtered views are shareable.

**Upload validation.** New `src/lib/uploads.ts` validates MIME type, decoded
byte size and count server-side. The client check is feedback only.

**Landing page.** Added the problem section, pilot programme section, a
six-question FAQ and the pilot interest form, without touching the existing hero
or its tuned copy. Swedish, English and Spanish are written natively per
language rather than translated word for word, and hedge correctly ("in
development", "during the pilot") on anything not yet live.

**Pilot form.** Full enquiry form with server-side Zod validation, per-IP rate
limiting, a honeypot, and clear error and success states. Submissions are stored
in the data layer.

**Locale-aware formatting.** Date formatting and the dashboard greeting were
hard-coded to Swedish; both now follow the selected locale.

**Dashboard mock i18n.** The hero product preview held hard-coded Swedish
strings. Moved into the dictionary with the Swedish text byte-identical, and
given a proper accessible label.

## 2. Two real security bugs found and fixed

**Forgeable session cookie (critical).** The session cookie stored
`profileId:organizationId` in plain text with no signature, and the seed data
uses predictable ids. Sending `Cookie: homioqo.session=profile_anna:org_bergstrom`
granted full manager access to the demo organisation with no credentials.

Cookies are now HMAC-SHA256 signed with `SESSION_SECRET`, verified with
`timingSafeEqual` before the ids are trusted, and marked `secure` outside
development. Production refuses to start without a secret; development uses a
random per-process key. Verified by request: that cookie now redirects to
`/login`. Four regression tests cover it.

**Access tokens could degrade to weak randomness.** `createToken()` fell back to
`Math.random()` if `crypto.getRandomValues` was missing. Since guest, contractor,
cleaner and owner links are protected by nothing but these tokens, the fallback
was removed and the function now throws instead.

## 3. What is fully functional

Against the in-memory data layer, these work end to end:

- Manager sign-in, dashboard with computed statistics, notifications
- Property management, search and filtering
- QR code generation, download, copy and rotation
- Guest guide and guest problem reporting with photos
- Issue triage, contractor assignment and approval
- Contractor secure-link workflow
- Cleaning workflow including checklist and damage reporting
- Owner read-only portal
- Pilot enquiry form
- Swedish, English and Spanish throughout

## 4. What uses demo data

Everything. With no Supabase keys set, the whole application runs on the
in-memory dataset seeded from `src/lib/data/seed.ts`: Bergström Fastigheter,
Anna Bergström, five properties, contractors including Costa Service Marbella,
and cleaner Maria Cleaning. All fictional.

**The store resets on restart.** Anything created during a session — issues,
cleaning jobs, notifications, pilot enquiries — is lost when the server stops.

## 5. What requires external credentials

| Capability | Needs | Behaviour without it |
| --- | --- | --- |
| Persistent database | Supabase keys | In-memory store, lost on restart |
| Outbound email | `RESEND_API_KEY`, `RESEND_FROM`, verified domain | Templates render, previews logged, nothing sent |
| Live translation | `DEEPL_API_KEY` | Original text shown and marked untranslated, never machine-faked |
| Production sessions | `SESSION_SECRET` | Production refuses to start; development uses a random per-process key |
| SMS / WhatsApp | Not implemented | Documented integration points only |

## 6. Known issues

- Data does not survive a restart. This is the single biggest limitation.
- Photos are stored as base64 data URLs in memory; this will not scale and there
  is no malware scanning.
- Rate limiting is per-process, so it resets on restart and will not hold across
  multiple instances.
- Contractor, cleaner and owner tokens never expire on their own; they must be
  rotated or revoked manually.
- German, French and Dutch are derived from the English dictionary and need a
  native-speaker review before being offered to customers.
- No component or browser end-to-end tests; coverage is at the workflow and
  data-layer level.
- The Next.js dev overlay reports a hydration mismatch when the Cursor browser
  tool is attached. This is the tool injecting `data-cursor-ref` attributes after
  SSR — the server HTML contains none of them, and real users are unaffected.

## 7. Security limitations

Full detail in `docs/security-review.md`. The short version: organisation
isolation, opaque tokens, server-side validation, upload limits, signed sessions
and hashed passwords are in place. Missing before a public launch are row-level
security in a real database, a shared rate-limit store, a revocable server-side
session store, token expiry, security headers, explicit CSRF tokens,
fine-grained roles within an organisation, and an independent penetration test.

## 8. Recommended next five tasks

1. **Move the data layer to Supabase** using `supabase/schema.sql`, enforce
   `organizationId` with row-level security, and re-run the isolation tests
   against the live schema. Everything else is blocked behind durable data.
2. **Connect Resend and verify the sending domain**, so contractor, cleaner and
   owner links are delivered automatically instead of copied by hand.
3. **Move photo uploads to object storage** with signed URLs and size limits
   enforced at the storage boundary.
4. **Add security headers and a shared rate-limit store**, then add error
   tracking and uptime monitoring.
5. **Run the full pilot rehearsal in `docs/pilot-checklist.md`** on a real
   property with a real printed QR code, a real contractor phone and a real
   cleaner phone.

## 9. Commands

```bash
npm install                            # install dependencies
cp .env.example .env.local             # create local environment file

npm run dev                            # development server
npm run dev -- -p 3002                 # development server on another port

npm run lint                           # ESLint
npm run typecheck                      # tsc --noEmit
npm test                               # Vitest, 32 tests
npm run test:watch                     # Vitest in watch mode

npm run build                          # production build
NEXT_DIST_DIR=.next-build npm run build  # build without disturbing a running dev server
```

Demo login: `anna@homioqo.se` / `demo1234`, or the **Öppna demokontot** button.

## 10. Validation at end of session

| Check | Result |
| --- | --- |
| `npm run typecheck` | Clean |
| `npm run lint` | Clean |
| `npm test` | 32 passed |
| Production build | Succeeded, 33 routes |
| Responsive | No horizontal overflow at 375px, 768px or 1440px |
| Auth | Real login works; forged cookie with predictable ids rejected |
| Styling | Dev server CSS intact after the build (separate output directory) |
