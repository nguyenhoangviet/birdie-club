# GitHub Copilot Instructions — Birdie Club

## Deploy Workflow — ALWAYS follow this order

```
local changes → push to develop → CI green → push to main → Vercel auto-deploys
```

1. Commit changes locally
2. `git push origin develop` — triggers GitHub Actions CI (lint + build)
3. **Wait for CI to pass** before pushing to `main`
4. `git push origin main` — Vercel auto-deploys from GitHub

**NEVER** use `vercel --prod --yes` — it bypasses GitHub and unlinks the deployment from the repo.

## Node.js
Always prefix commands:
```bash
export PATH="/tmp/node-v22.13.1-darwin-arm64/bin:$PATH"
```

## Tech Stack
- Next.js 15, App Router, TypeScript, Tailwind CSS 3
- Upstash Redis (REST), iron-session 8, Vercel hosting

## Key Conventions
- No `redis.keys("*")` in hot paths — O(N) full scan, banned in SSR
- Parallelize Redis fetches with `Promise.all`, never sequential `await` chains
- Background maintenance tasks: fire-and-forget with `.catch(() => {})`, no `await` in SSR
