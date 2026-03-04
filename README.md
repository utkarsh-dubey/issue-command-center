# Issue Command Center

Standalone Linear replacement for product intake, prioritization, and stakeholder visibility.

## Stack
- Next.js 16 (App Router)
- Convex (database, functions, cron)
- Clerk (Google SSO)
- shadcn/ui + Tailwind CSS v4
- Bun

## MVP Capabilities
- Structured intake inbox (`inbox -> triage -> planned -> doing -> done`)
- RICE (1-5) + urgency multipliers + admin priority override
- Role model: `admin`, `member`, `viewer`
- Invite-only onboarding
- Global activity feed
- Issue comments and duplicate merge flow
- Stakeholder dashboard (read-only)
- Discord webhook notifications for status/priority updates
- Weekly Monday 09:00 Asia/Kolkata digest (Convex cron)

## Required Environment Variables
Copy `.env.example` to `.env.local`:

```bash
cp .env.example .env.local
```

Set values for:
- `NEXT_PUBLIC_CONVEX_URL`
- `CONVEX_DEPLOYMENT`
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
- `CLERK_SECRET_KEY`
- `CLERK_JWT_ISSUER_DOMAIN`
- `DISCORD_WEBHOOK_URL`

## Local Development
```bash
bun install
bunx convex dev
bun run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Smoke Checks
```bash
bun run lint
bun run test
# or
bun run smoke
```

## Deployment
- Frontend: Vercel
- Backend: Convex Cloud

Typical flow:
1. Create Convex production deployment and set `CONVEX_DEPLOYMENT` / `NEXT_PUBLIC_CONVEX_URL`.
2. Configure Clerk production keys and issuer domain.
3. Set Vercel env vars to match `.env.example`.
4. Deploy Vercel + Convex.

## Notes
- First signed-in user is auto-bootstrapped as `admin` if no users exist.
- Afterwards, access is invite-only via admin-created invites.
- Weekly digest cron is hard-coded to Monday 03:30 UTC (09:00 IST).
