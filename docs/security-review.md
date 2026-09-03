# Security and privacy review

Scope: the Homioqo application in this repository, reviewed at the end of the
build session that added the contractor portal, owner portal, notifications,
QR management and the pilot form.

This review is a code-level assessment. No destructive or adversarial testing
was performed against a deployed environment.

## Findings fixed during this review

### 1. Forgeable session cookie (critical)

**Problem.** The session cookie stored `profileId:organizationId` as plain text
and was not signed. `getSession()` read both values straight from the cookie and
only checked that the profile existed and that its organisation matched. Both
halves of that check came from attacker-controlled input.

The seed data uses predictable identifiers (`profile_anna`, `org_bergstrom`), so
sending `Cookie: homioqo.session=profile_anna:org_bergstrom` granted full manager
access to the demo organisation without any credentials.

**Fix.** The cookie value is now signed with an HMAC-SHA256 keyed on
`SESSION_SECRET` (`signValue` / `unsignValue` in `src/lib/crypto.ts`). The
signature is verified with `timingSafeEqual` before the identifiers are trusted.
`secure: true` is now set on the cookie outside development, alongside the
existing `httpOnly` and `sameSite: lax`.

In production, a missing or too-short `SESSION_SECRET` throws rather than
silently falling back. In development a random per-process key is generated, so
sessions are invalidated on restart but are never forgeable.

**Verified.** `GET /app` with the unsigned cookie above now redirects to
`/login`. Regression tests cover round-tripping, an unsigned value, a tampered
payload and a tampered signature.

### 2. Access tokens could degrade to weak randomness

**Problem.** `createToken()` fell back to `Math.random()` when
`crypto.getRandomValues` was unavailable. Guest QR links, contractor task links,
cleaner links and owner links are protected by nothing but these tokens, so a
predictable generator would have made them guessable.

**Fix.** The fallback was removed. `createToken()` now throws if no secure
random source is available. Tokens remain 18 bytes (144 bits) from
`crypto.getRandomValues`.

## Controls implemented

### Authentication and route protection

- `src/middleware.ts` redirects unauthenticated requests for `/app/*` to
  `/login`. This is a cheap presence check only.
- Every manager page and server action independently calls `requireSession()`,
  so the real authorisation decision is made server-side and never depends on
  the middleware alone.
- Session cookies are `httpOnly`, `sameSite: lax`, `secure` in production, and
  HMAC-signed.
- Passwords are hashed with `scrypt` and a per-password salt, compared with
  `timingSafeEqual`.

### Organisation data isolation

- Every organisation-owned record carries an `organizationId`.
- Store reads are scoped by the `organizationId` from the verified session, not
  from a request parameter.
- A regression test asserts that a second organisation cannot read the first
  organisation's properties or cases.

### Public and token-based access

- Guest, contractor, cleaner and owner routes are addressed by opaque prefixed
  tokens (`pc_`, `wk_`, `cl_`, `ow_`), never by sequential or guessable database
  identifiers.
- Contractor links resolve to exactly one case; cleaner links to exactly one
  cleaning job. Neither can enumerate other records.
- Tokens can be rotated and deactivated. Rotation immediately invalidates the
  previous link, which is covered by tests.
- Invalid tokens render a neutral "link is no longer valid" page and return the
  same response regardless of whether the token ever existed, so the routes do
  not confirm which tokens are real.

### Information exposure

- Guest pages render only guest-safe guide fields. Owner contact details,
  internal notes, contractor costs, private maintenance history and other
  properties are never passed to those components.
- The owner portal is read-only and scoped to a single property. Internal notes
  and staff-only activity are filtered out before render.
- No `dangerouslySetInnerHTML` anywhere in `src/`, so guest-supplied text is
  escaped by React.

### Input and upload validation

- All form submissions are validated server-side with Zod, independently of any
  client-side validation.
- Photo uploads are validated in `src/lib/uploads.ts` for MIME type (JPEG, PNG,
  WebP), decoded byte size (8 MB per file) and count (8 per submission). The
  client pre-check exists for feedback only and is not trusted.
- The public guest report form and the public pilot form are rate limited per IP.
- The pilot form has a hidden honeypot field and returns a success response to
  bots rather than revealing the rejection.

### Secrets

- No secrets are committed. `.env.example` lists variable names with empty
  values only.
- `.env.local` is gitignored.
- No credentials or personal data are written to logs.

## Known limitations

These are accepted for a pilot but are **not** acceptable for a public launch.

| Area | Limitation |
| --- | --- |
| Persistence | Data is in memory. It is lost on restart, and there are no backups |
| Sessions | No server-side session store, so sessions cannot be revoked individually and there is no idle timeout |
| Rate limiting | In-memory and per-process. Resets on restart and does not hold across multiple instances |
| CSRF | Relies on `sameSite: lax` plus Next.js server-action origin checks. There are no explicit per-form CSRF tokens |
| Roles | The model distinguishes organisation membership but does not yet enforce fine-grained role permissions within an organisation |
| Token lifetime | Contractor, cleaner and owner tokens do not expire on their own. They must be rotated or deactivated manually |
| Audit | Activity events are recorded for product purposes, not as a tamper-evident security audit log |
| Uploads | Photos are stored as data URLs in memory. There is no virus scanning and no object storage |
| Headers | No Content-Security-Policy, HSTS or other hardening headers are configured |
| Password policy | Minimum length only. No breach-list check, no lockout after repeated failures, no MFA |
| Email enumeration | Login and password-reset responses have not been audited for uniform timing |

## Requirements before a public production launch

1. Set a strong `SESSION_SECRET` from a secret manager, never from a file in the
   repository.
2. Move to a real database with row-level security enforcing `organizationId`,
   and confirm isolation with tests against the live schema.
3. Replace in-memory rate limiting with a shared store (for example Redis) so
   limits hold across instances.
4. Add a server-side session store so sessions can be revoked and expired.
5. Add expiry to contractor, cleaner and owner tokens, and revoke them
   automatically once the related work is approved.
6. Move uploads to object storage with signed URLs, enforce limits at the
   storage boundary and add malware scanning.
7. Add security headers: Content-Security-Policy, HSTS, `X-Content-Type-Options`,
   `Referrer-Policy` and a restrictive `Permissions-Policy`.
8. Add explicit CSRF protection for state-changing requests.
9. Implement role-based permissions within an organisation and test each role
   against every manager route.
10. Complete a GDPR review: lawful basis for the pilot enquiry form, a retention
    policy, data-subject export and deletion, and a processor agreement with
    every subprocessor.
11. Add rate limiting and lockout to authentication endpoints, and audit login
    and reset responses for user enumeration.
12. Commission an independent penetration test against a staging environment
    before onboarding real guest data.
