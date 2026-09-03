# Production readiness

Status of the application against what a public launch would require. Written at
the end of the build session that added the contractor portal, owner portal,
notifications, QR management and the pilot form.

## Summary

Homioqo is ready to demonstrate and, with care, ready to pilot against fictional
or low-stakes data. It is **not** ready for a public launch with real guest data,
primarily because there is no durable database and no outbound email.

## Blocking gaps

### 1. No persistent database

Everything lives in an in-memory store on `globalThis`. A restart or a redeploy
loses every property, issue, cleaning job, notification and pilot enquiry.

`supabase/schema.sql` contains the SQL equivalent, and the data layer is already
separated behind `src/lib/data/store.ts`, so the swap is contained. What remains:

- Point the store functions at Supabase
- Enforce `organizationId` with row-level security rather than in application
  code alone
- Re-run the isolation tests against the live schema
- Add migrations, backups and a restore drill

### 2. `SESSION_SECRET` must be provisioned

Production now refuses to start without it, which is deliberate. It must come
from a secret manager, not from a file in the repository.

### 3. No outbound email

The notification provider interface and templates exist (welcome, new task
assigned, issue status update, cleaning completed, property ready, owner
update), and previews are logged in development. Nothing is sent.

Connecting Resend requires `RESEND_API_KEY` and `RESEND_FROM`, plus domain
verification and SPF/DKIM records. Until then, contractor and cleaner links must
be shared manually.

### 4. Uploads are data URLs in memory

Photos are base64 data URLs held in the store. This does not survive a restart,
will not scale, and there is no malware scanning. Move to object storage with
signed URLs before real use.

### 5. Rate limiting is per-process

The in-memory limiter resets on restart and does not hold across instances. Any
multi-instance deployment needs a shared store.

## Non-blocking but important

| Item | Detail |
| --- | --- |
| Security headers | No CSP, HSTS, `X-Content-Type-Options`, `Referrer-Policy` or `Permissions-Policy` |
| Session management | No server-side session store, so sessions cannot be revoked or expired individually |
| Token expiry | Contractor, cleaner and owner tokens never expire on their own |
| Role permissions | Organisation membership is modelled, but fine-grained roles inside an organisation are not enforced |
| CSRF | Relies on `sameSite: lax` and Next.js server-action origin checks; no explicit per-form tokens |
| Observability | No error tracking, no structured logging, no uptime monitoring |
| Accessibility | Labels, focus styles and alt text were handled, but no full audit or screen-reader pass has been done |
| Translation | German, French and Dutch are derived rather than hand-written, and should be reviewed by a native speaker before being offered to customers |
| Live translation | The message-translation adapter is unconnected. Untranslated content is shown as-is and marked, never machine-faked |
| SMS and WhatsApp | Documented integration points only |
| Analytics | QR opens and recommendation clicks are counted anonymously in memory only |
| Legal | Terms and privacy pages exist but have not been reviewed by a lawyer |

## Testing status

`npm test` runs 32 Vitest tests covering property management, guest reporting,
the contractor workflow, the cleaning workflow, owner access, cross-organisation
isolation, session-cookie signing and pilot-form validation.

Type checking, linting and the production build all pass clean.

Not covered: component rendering tests, browser end-to-end tests, and load
testing. Key pages were checked manually at 375px, 768px and 1440px with no
horizontal overflow at any width.

## Suggested order of work

1. Move the data layer to Supabase with row-level security, then re-run the
   isolation tests against it
2. Connect Resend and verify the sending domain
3. Move photo uploads to object storage with signed URLs
4. Add security headers and a shared rate-limit store
5. Add error tracking and uptime monitoring
6. Add token expiry and a server-side session store
7. Commission a penetration test before onboarding real guest data
