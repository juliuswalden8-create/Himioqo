# Homioqo

Multilingual property operations and guest-service platform for property managers
and rental companies. Guests report problems by scanning a QR code, the manager
assigns the right contractor or cleaner, and the property owner can follow the
work remotely — no app and no account for guests, contractors or cleaners.

## What it does

| Role | What they get |
| --- | --- |
| Manager | Dashboard, issue triage, contractor and cleaner assignment, property management, guest guides, QR codes, notifications |
| Guest | QR guest guide with Wi-Fi, house rules, local recommendations, and a problem-reporting form. No login |
| Contractor | Secure single-task link: accept or decline, change status, upload before/after photos, send updates |
| Cleaner | Secure single-task link: checklist, photo upload, report damage or missing items |
| Owner | Revocable read-only link showing status, approved work and cleaning progress for their property only |

## Stack

Next.js 15 (App Router) · TypeScript · Tailwind CSS v4 · shadcn/ui · Recharts ·
Zod · Vitest · Supabase (optional) · Resend (optional) · DeepL (optional)

## Install and run

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Use `npm run dev -- -p 3002`
to pick another port.

## Demo account

- Email: `anna@homioqo.se`
- Password: `demo1234`

Or press **Öppna demokontot** on the login page.

## Environment variables

Copy `.env.example` to `.env.local`. Everything except `SESSION_SECRET` is
optional; unset integrations fall back to safe local behaviour.

| Variable | Required | Effect |
| --- | --- | --- |
| `SESSION_SECRET` | In production | Signs the session cookie. Without it, production refuses to start. In development a random per-process key is used, so sessions drop on restart. Generate with `openssl rand -base64 32` |
| `NEXT_PUBLIC_APP_URL` | No | Base URL used when building QR and share links |
| `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` | No | Real database, auth and storage. Unset means the in-memory demo dataset |
| `RESEND_API_KEY`, `RESEND_FROM` | No | Sends transactional email. Unset means emails are logged, never sent |
| `DEEPL_API_KEY` | No | Live message translation. Unset means the original text is shown and marked as untranslated |

Never commit real values. `.env.local` is gitignored.

## Commands

```bash
npm run dev        # development server
npm run lint       # ESLint
npm run typecheck  # tsc --noEmit
npm test           # Vitest workflow tests
npm run test:watch # Vitest in watch mode
npm run build      # production build
```

### Building while the dev server is running

A production build writes to the same `.next` folder the dev server serves from,
which strips the CSS of the open site. Use a separate output directory instead:

```bash
NEXT_DIST_DIR=.next-build npm run build
```

## Demo data

With no Supabase keys configured, Homioqo runs entirely on an in-memory dataset
seeded from `src/lib/data/seed.ts`: the fictional company **Bergström
Fastigheter**, manager **Anna Bergström**, five properties (Villa Sol, Casa
Brisa, Mälarhusen 7, Strandvägen 14B, Vasagatan 22), plus contractors such as
**Costa Service Marbella** and cleaner **Maria Cleaning**.

All of it is fictional. The store resets whenever the server restarts, so any
issue, cleaning task or pilot enquiry created during a session is lost on
restart. SQL for a real Supabase database lives in `supabase/schema.sql`.

## Current limitations

- Data lives in memory and does not survive a restart. The Supabase schema
  exists but is not wired up as the live data source.
- Email is never sent. Templates render and are logged as previews.
- Automatic translation is not connected. Untranslated messages are shown as-is
  and clearly marked rather than machine-translated.
- SMS and WhatsApp are documented integration points only, not implemented.
- Rate limiting is per-process and in-memory, so it resets on restart and does
  not work across multiple instances.

See [`docs/production-readiness.md`](docs/production-readiness.md) for the full
list of what must be done before a public launch, and
[`docs/security-review.md`](docs/security-review.md) for the security posture.

## Documentation

| Document | Contents |
| --- | --- |
| [`docs/product-overview.md`](docs/product-overview.md) | What Homioqo does and for whom |
| [`docs/data-model.md`](docs/data-model.md) | Entities, relationships and ownership rules |
| [`docs/user-flows.md`](docs/user-flows.md) | Step-by-step flows per role |
| [`docs/security-review.md`](docs/security-review.md) | Controls, limitations, pre-launch requirements |
| [`docs/pilot-checklist.md`](docs/pilot-checklist.md) | Onboarding a pilot customer |
| [`docs/production-readiness.md`](docs/production-readiness.md) | Gap list before production |
| [`docs/overnight-summary.md`](docs/overnight-summary.md) | Summary of the latest build session |
