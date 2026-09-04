# Homioqo security audit

Date: 4 September 2026  
Scope: existing Next.js app, in-memory store, optional Supabase client, custom session cookies.  
No production attacks were run. Tests are local.

## System map

| Area | What exists |
| --- | --- |
| Framework | Next.js 15 App Router, React 19, TypeScript |
| Auth | Custom email/password + magic links. Session cookie `homioqo.session` HMAC-signed (`SESSION_SECRET`). Not Clerk/Auth0. |
| Database | **In-memory** `src/lib/data/store.ts`. `supabase/schema.sql` is not wired. Data dies on cold start. |
| API routes | `GET /api/qr/[token]` only. Business logic is server actions. |
| Public routes | `/`, marketing, `/login`, `/register`, `/g/[token]`, `/qr/[token]`, `/c/`, `/t/`, `/o/`, `/w/`, `/demo` |
| Protected routes | `/app/*` via middleware + `requireSession` / `requireHostSession` / `requireRoleSession` |
| Roles | host, owner, cleaner, contractor. Guest = QR token, no account. |
| Uploads | Photos as data URLs in memory (JPEG/PNG/WebP after this pass) |
| QR | `createToken("qr")` — 18 random bytes (144 bits), prefix `qr_`. Rotatable and revocable. |

### Environment variables

Public (`NEXT_PUBLIC_*`): `APP_URL`, `GOOGLE_SITE_VERIFICATION`, `GA_MEASUREMENT_ID`, `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY` / `ANON_KEY`.

Server only: `SESSION_SECRET`, `SUPABASE_SERVICE_ROLE_KEY`, `RESEND_API_KEY`, `RESEND_FROM`, `TWILIO_*`, `DEEPL_API_KEY`, `ADMIN_EMAIL`, `CONTACT_EMAIL`.

`.env` and `.env*.local` are gitignored. Service role is not referenced as `NEXT_PUBLIC_*`.

## Findings (before / remaining)

### Critical

| ID | Issue | Status |
| --- | --- | --- |
| C1 | Persistence is in-memory. No durable RLS, backups, or multi-instance session store. | **Open** — architecture. Do not claim production-ready storage. |
| C2 | Seed passwords were stored as plaintext `demo1234`; `verifyPassword` accepted plaintext. | **Fixed** — scrypt hashes in seed; plaintext compare removed. |

### High

| ID | Issue | Status |
| --- | --- | --- |
| H1 | Login, magic link and reports lacked IP rate limits. | **Fixed** |
| H2 | Sessions were not invalidated on logout or password change. | **Fixed** — `sessionVersion` |
| H3 | Password reset was a stub (always “ok”, no token). | **Fixed** — one-hour, one-use token + `/reset/[token]` |
| H4 | Photo gate trusted the data-URL MIME string (SVG/HTML spoof). | **Fixed** — magic bytes; JPEG EXIF/GPS stripped |
| H5 | Guest guide payload included property id, org id and report token. | **Fixed** |

### Medium

| ID | Issue | Status |
| --- | --- | --- |
| M1 | No security headers (CSP, HSTS, nosniff, frame-ancestors). | **Fixed** — see exceptions below |
| M2 | Public QR routes had no rate limit. | **Fixed** in middleware |
| M3 | Public report form had no honeypot. | **Fixed** (hidden field, no visible copy change) |
| M4 | Supabase RLS not applied (DB not wired). | **Documented** migration `supabase/migrations/20260904_rls_deny_by_default.sql` |
| M5 | Photos stored as data URLs, not private object storage / signed URLs. | **Open** — no storage provider in use |
| M6 | MFA for admins. Custom auth has no MFA provider. | **Open** — not available without a new auth vendor |

### Low

| ID | Issue | Status |
| --- | --- | --- |
| L1 | CSP needs `unsafe-inline` for Next.js 15 inline bootstraps. No `unsafe-eval`, no `*`. | Documented |
| L2 | In-memory rate limits reset on process restart and do not share across Vercel instances. | Open |
| L3 | `verifyLinks` can hold a raw verify token in memory for demo fallback. | Open — never log it |
| L4 | Demo password `demo1234` is public by design. Rotate before any real customer data lives here. | Open |
| L5 | Full i18n dictionary is still sent to some guest client components. | Open — labels, not owner notes |

## What was changed

- Session versioning, hashed demo passwords, login/report/QR rate limits, password reset tokens.
- Guest-safe guide payload; magic-byte image checks; EXIF strip; honeypot.
- Security headers; security event log (no emails/passwords/tokens).
- Tests in `tests/security.test.ts`.
- SQL migration file for future RLS (not applied; store is in-memory).

## Migrations

`supabase/migrations/20260904_rls_deny_by_default.sql` — **not applied**. Apply only after a real Supabase project is wired and backed up.

## Dependency audit

`npm audit --omit=dev` reports a **PostCSS** advisory pulled in by Next.js 15. The suggested fix is `npm audit fix --force` to Next 16, which is a breaking upgrade and was **not** applied. Revisit after a planned Next upgrade.

## Remaining risks

1. In-memory store: no backup, no RLS, data loss on deploy.
2. No virus scanning (no storage vendor).
3. No MFA.
4. Rate limits are per-process.
5. Photos are still data URLs in the process, not signed private blobs.
6. If `SESSION_SECRET` was ever committed or leaked, rotate it in Vercel. No secret is printed here.

## Manual production checklist

- [ ] Set `SESSION_SECRET` (≥32 random bytes) in Vercel Production.
- [ ] Confirm `SUPABASE_SERVICE_ROLE_KEY` is server-only if Supabase is used.
- [ ] Confirm `RESEND_API_KEY` is set if reset/invite mail must leave the server.
- [ ] Do not store real customer data until a durable database + backups exist.
- [ ] After wiring Supabase: enable RLS, review policies, backup, then migrate.
- [ ] Rotate any key that might have been shared in chat or screenshots.
- [ ] Add MFA when you adopt a hosted auth provider.

## Retention suggestion

When durable storage exists: keep closed cases and photos 24 months, then delete or anonymise reporter contact; keep security logs 90 days without personal data; keep QR tokens until rotated.

This review does **not** claim Homioqo is fully secure. Access control, QR tokens, upload sniffing and secret hygiene were prioritised. Durable database security is unfinished until the store is replaced.
