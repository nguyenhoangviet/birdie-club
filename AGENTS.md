# Agent Instructions — Birdie Club

## Tech Stack
- **Next.js 15** (App Router, TypeScript, Tailwind CSS 3)
- **Upstash Redis** (`@upstash/redis`) — REST-based, supports `.pipeline()`
- **iron-session 8** — `birdie-club-session` (7d), `birdie-admin-session` (8h)
- **Vercel** — production host, auto-deploys from `main` branch via GitHub integration

## Node.js
Node 22 lives at `/tmp/node-v22.13.1-darwin-arm64/bin`. Always prefix terminal commands:
```bash
export PATH="/tmp/node-v22.13.1-darwin-arm64/bin:$PATH"
```

## Deploy Workflow — ALWAYS follow this order

```
local changes → push to develop → CI green → push to main → Vercel auto-deploys
```

1. Commit changes locally
2. `git push origin develop` — triggers GitHub Actions CI (lint + build)
3. **Wait for CI to pass** on GitHub before touching `main`
4. `git push origin main` — Vercel's GitHub integration auto-builds and deploys to production

### NEVER
- Run `vercel --prod --yes` or any direct Vercel CLI deployment — this bypasses GitHub, breaks source linking, and puts Vercel ahead of the repo
- Push directly to `main` without CI passing on `develop` first

## CI Pipeline (`.github/workflows/ci.yml`)
- Triggers on: push to `develop`, pull_request targeting `main`
- Steps: `npm install` → `npm run build` (uses dummy env vars — no real services contacted)

## Key Conventions
- Redis `keys("*")` is banned in hot paths — use explicit key patterns or sets/sorted sets
- Fire-and-forget background work with `.catch(() => {})` — never `await` slow maintenance tasks in SSR
- Parallelize Redis fetches with `Promise.all` — avoid sequential `await` chains
- Event date field is `ev.date` (YYYY-MM-DD string), times are `ev.startTime` / `ev.endTime`
