# Homiqo

SaaS for property maintenance in Spain. Managers get a full dashboard. Tenants, owners and contractors work through secure mobile links — no app install.

## Stack

Next.js 15 (App Router) · TypeScript · Tailwind CSS · shadcn/ui · next-intl · Recharts · Supabase (optional) · Resend (optional)

## Run locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Spanish is the default locale (`/en` and `/sv` also work).

Without Supabase keys the app uses the **Costa Homes Management** demo dataset.

## Demo account

- Email: `demo@homiqo.es`
- Password: `demo1234`

### Demo public links

- Report (Las Brisas 3B): `/report/qr_7Hk2mQ9pLx4nVw8R`
- Contractor job (leak): `/job/job_d3Fg8Kp2Ns9Qw1Xt`
- Owner tracking: `/track/own_a1Bc4De7Gh0Jk3Mn`
- Tenant tracking: `/track/ten_p8Qr2St5Uv6Wx9Yz`

## Optional services

Copy `.env.example` to `.env.local`.

| Variable | Effect when set |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` + anon key | Real database, auth and storage |
| `RESEND_API_KEY` | Transactional email |
| `DEEPL_API_KEY` | Live translation instead of mock |

SQL for Supabase lives in `supabase/schema.sql` (includes RLS so each organisation only sees its own rows).

## Scripts

```bash
npm run lint
npm run typecheck
npm run build
```
