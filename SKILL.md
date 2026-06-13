---
name: envi-dashboard
description: Expert context for the Envi Dashboard project — Next.js config, basePath prefix, database schema, .env variables, Docker services, IoT API parameter codes, and alert pipeline. Use when working in the envi_dashboard repo.
---

# Full-Stack Best Practices: Next.js · Prisma · PostgreSQL · Docker · Auth.js

> Framework setup & configuration patterns — transferable to any project using this stack.
> Project-specific values are marked **[this project]**.

---

## 1. Project Structure

```
project-root/
├── .env                  ← single env file for ALL services (never nest inside web/)
├── docker-compose.yml
├── db/
│   └── init.sql          ← schema DDL + seed data (Docker mounts on first run)
└── web/                  ← Next.js app
    ├── next.config.ts
    ├── prisma/
    │   └── schema.prisma
    └── src/
        ├── app/          ← App Router pages & API routes
        ├── components/
        └── lib/          ← shared utilities (db client, external APIs, helpers)
```

**Rule:** Keep `.env` at the mono-repo root so Docker Compose, the web app, and any scripts all read from the same file without duplication.

---

## 2. Next.js — `basePath` (Sub-path Deployment)

When an app is mounted under a sub-path (e.g. `/air`, `/app`, `/dashboard`), set it in `next.config.ts`:

```ts
// web/next.config.ts
const nextConfig: NextConfig = {
  basePath: '/air',                         // [this project] change per deployment
  output: 'standalone',                     // recommended for Docker
};
```

### What Next.js handles automatically
`<Link>`, `redirect()`, `router.push()`, `<Image>`, `_next/static` — all get the prefix injected.

```ts
// WRONG — results in /air/air/dashboard
<Link href="/air/dashboard">

// CORRECT — Next.js injects /air
<Link href="/dashboard">
redirect('/dashboard')
router.push('/stations')
```

### What you must prefix manually
| Context | Why | Example |
|---------|-----|---------|
| `fetch()` in client components | Bypasses the Next.js router | `fetch('/air/api/stations')` |
| Auth.js redirect paths | Auth.js has its own routing layer | `redirectTo: '/air/dashboard'` |
| `SessionProvider basePath` | SessionProvider fetches auth endpoint directly | `basePath="/air/api/auth"` |
| Static asset `src` via env var | Raw string, not a Next.js API | `` `${process.env.NEXT_PUBLIC_BASE_PATH}/logo.png` `` |

> **Tip:** Expose `NEXT_PUBLIC_BASE_PATH=/air` in `.env` so client components can construct asset URLs without hardcoding the prefix.

---

## 3. Next.js 15 — App Router Patterns

### Dynamic route params are Promises
Next.js 15 made `params` async. Destructuring directly causes a runtime error.

```tsx
// WRONG — Next.js 13/14 style, breaks in 15
export default function Page({ params }: { params: { id: string } }) {
  const { id } = params;
}

// CORRECT — client component
'use client';
import { use } from 'react';
export default function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
}

// CORRECT — server component
export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
}
```

### API Route options
```ts
// Opt out of caching for data that changes frequently
export const dynamic = 'force-dynamic';

// Increase timeout for long-running external calls (Vercel/Edge limit)
export const maxDuration = 30;
```

### Map import — always dynamic (no SSR)
```ts
const MapComponent = dynamic(() => import('@/components/MapComponent'), { ssr: false });
```

---

## 4. Environment Variables

### `.env` at project root — one file for everything
```bash
# ── Database ──────────────────────────────────────────────────────
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/envi_db"
# In Docker, swap localhost → the Compose service name:
# DATABASE_URL="postgresql://postgres:postgres@db:5432/envi_db"

# ── Next.js / Auth ────────────────────────────────────────────────
AUTH_SECRET="your-secret-here"
AUTH_GOOGLE_CLIENT_ID="..."
AUTH_GOOGLE_CLIENT_SECRET="..."
NEXTAUTH_URL="http://localhost:3000/air/api/auth"   # full URL including basePath
AUTH_URL="http://localhost:3000/air/api/auth"

# ── Public (browser-visible) ──────────────────────────────────────
NEXT_PUBLIC_BASE_PATH="/air"

# ── External APIs ─────────────────────────────────────────────────
APP_KEY="..."
APP_SECRET="..."
LINE_CHANNEL_ACCESS_TOKEN="..."
```

### Rules
| Rule | Reason |
|------|--------|
| `NEXT_PUBLIC_` prefix required for browser access | Server env vars are never sent to the client bundle |
| Docker: use Compose service name as DB hostname | Containers resolve each other by service name, not `localhost` |
| `AUTH_TRUST_HOST=true` in Docker (set in `docker-compose.yml`, not `.env`) | Only needed in containerised deployments |
| Never commit `.env` | Add to `.gitignore`; provide `.env.example` instead |

### Passing env to Docker Compose
```yaml
# docker-compose.yml
services:
  web:
    env_file: .env              # loads all variables from root .env
    environment:
      - AUTH_TRUST_HOST=true    # runtime-only overrides go here, not in .env
      - DATABASE_URL=postgresql://postgres:postgres@db:5432/envi_db
```

---

## 5. PostgreSQL + Prisma

### Prisma schema essentials
```prisma
// web/prisma/schema.prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider      = "prisma-client-js"
  binaryTargets = ["native", "linux-musl-openssl-3.0.x"]  // native = local, linux-musl = Docker Alpine
}
```

`binaryTargets` must include `linux-musl-openssl-3.0.x` when the Next.js Docker image is Alpine-based. Without it, Prisma Client won't work inside the container.

### Singleton Prisma client (prevent connection pool exhaustion in dev)
```ts
// web/src/lib/prisma.ts
import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };
const prisma = globalForPrisma.prisma ?? new PrismaClient();
if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
export default prisma;
```

### Schema change workflow (Docker, no host DB access)

This project has no `prisma/migrations/` folder — Docker owns the DB. Workflow:

```bash
# 1. Edit web/prisma/schema.prisma  (add field)
# 2. Edit db/init.sql               (add column DDL for fresh installs)
# 3. Apply to live container:
docker exec <db-container> psql -U postgres -d <dbname> \
  -c 'ALTER TABLE "Table" ADD COLUMN IF NOT EXISTS "col" TYPE NOT NULL DEFAULT val;'
# 4. Regenerate Prisma client (REQUIRED after every schema change):
cd web && npx prisma generate
```

### Common Prisma queries
```ts
// Latest reading per station (1-to-many)
prisma.station.findMany({
  include: {
    readings: { orderBy: { timestamp: 'desc' }, take: 1 },
  },
});

// Hourly aggregates via raw SQL (Prisma doesn't do GROUP BY elegantly)
prisma.$queryRaw<Row[]>`
  SELECT date_trunc('hour', timestamp) AS hour, AVG(pm25) AS pm25
  FROM "Reading"
  WHERE "stationId" = ${id} AND timestamp >= ${since}
  GROUP BY hour ORDER BY hour ASC
`;
```

---

## 6. Docker Compose — Best Practices

### Service startup order with healthcheck
`depends_on: service_started` only waits for the container process, not the app. Use `service_healthy` for real readiness:

```yaml
services:
  db:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: envi_db
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
    volumes:
      - ./db/init.sql:/docker-entrypoint-initdb.d/init.sql  # runs on first start only
      - pgdata:/var/lib/postgresql/data

  web:
    build: ./web
    env_file: .env
    depends_on:
      db:
        condition: service_healthy
    healthcheck:
      test: ["CMD-SHELL", "wget -qO- http://localhost:3000/air/api/stations || exit 1"]
      interval: 10s
      timeout: 5s
      retries: 5
      start_period: 30s   # give Next.js time to compile on first boot

  cron:
    depends_on:
      web:
        condition: service_healthy   # won't start until web passes healthcheck

volumes:
  pgdata:
```

### PostgreSQL healthcheck
```yaml
db:
  healthcheck:
    test: ["CMD-SHELL", "pg_isready -U postgres"]
    interval: 5s
    timeout: 3s
    retries: 5
```

### `init.sql` — runs only on first volume mount
Docker runs `*.sql` files in `/docker-entrypoint-initdb.d/` only when the data volume is **empty**. To re-run it: `docker compose down -v` (destroys the volume).

---

## 7. Auth.js v5 (next-auth@beta)

### Setup
```ts
// web/src/auth.ts
import NextAuth from 'next-auth';
import Google from 'next-auth/providers/google';

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [Google],
  // Do NOT set basePath here — Next.js strips it before Auth.js sees the request
  pages: { signIn: '/air/login' },   // full path (bypasses Next.js router)
  callbacks: {
    authorized({ auth }) { return !!auth?.user; },
  },
});

// web/src/app/api/auth/[...nextauth]/route.ts
export { GET, POST } from '@/auth';
export const runtime = 'nodejs';
```

### Middleware (protects all routes except public ones)
```ts
// web/src/middleware.ts
import { auth } from '@/auth';
export default auth((req) => {
  if (!req.auth) return Response.redirect(new URL('/air/login', req.url));
});

export const config = {
  // Paths WITHOUT basePath — Next.js strips it before matching
  matcher: ['/((?!_next/static|_next/image|favicon.ico|login|api/auth).*)'],
};
```

### SessionProvider
```tsx
// Must include basePath so it knows where to fetch the session
<SessionProvider basePath="/air/api/auth">
  {children}
</SessionProvider>
```

### Google OAuth Console
Authorised redirect URI must include the full path with basePath:
```
http://localhost:3000/air/api/auth/callback/google
```

---

## 8. Tailwind CSS v4 — Theme & Dark Mode

### CSS variables in `globals.css`
```css
:root {
  --background: #f8f9fa;
  --foreground: #202124;
  --card: #ffffff;
  --border: #e8eaed;
}

@media (prefers-color-scheme: dark) {
  :root {
    --background: #202124;
    --foreground: #e8eaed;
    --card: #2d2e30;
    --border: #3c4043;
  }
}
```

Use `bg-card`, `border-border`, `text-foreground` in components — never hardcode theme colors.

### Hardcode semantic palette (not variables)
For status colors that don't change with theme, use hex directly:
```tsx
// Good/Bad/Warning — always the same regardless of dark mode
className="bg-[#e6f4ea] text-[#137333]"   // green
className="bg-[#fef3c7] text-[#b45309]"   // yellow
className="bg-[#fce8e6] text-[#c5221f]"   // red
```

---

## 9. External API Integration Patterns

### Time-based signature auth (SHA1)
Regenerate on every request — never cache headers:
```ts
function buildHeaders(appKey: string, appSecret: string) {
  const timestamp = Date.now().toString();
  const rand = crypto.randomBytes(10).toString('hex').toUpperCase().slice(0, 10);
  const signature = crypto.createHash('sha1')
    .update(`${timestamp}_${rand}_${appSecret}`)
    .digest('hex').toUpperCase();
  return { appkey: appKey, timestamp, rand, signature };
}
```

### Single CODE_MAP pattern
When an external API returns opaque codes, define one mapping object and derive everything from it:
```ts
// lib/apiMapping.ts — single source of truth
export const CODE_MAP: Record<string, keyof DBModel> = {
  a34004: 'pm25',
  a34002: 'pm10',
  a01001: 'temperature',
};

// Parser — loops CODE_MAP, never hardcodes individual codes
for (const item of body.Data) {
  const field = CODE_MAP[item.Code?.toLowerCase()];
  if (field) partial[field] = parseFloat(item.Rtd);
}
```

Benefits: rename a code → change one line; debug page derives labels from same map; sync route derives DB fields from same map.

### Abort timeout for external calls
```ts
const res = await fetch(url, {
  method: 'POST',
  headers: buildHeaders(),
  signal: AbortSignal.timeout(8000),   // don't hang forever
});
```

---

## 10. LINE Messaging API

### Multicast (send to multiple users)
```ts
await fetch('https://api.line.me/v2/bot/message/multicast', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${process.env.LINE_CHANNEL_ACCESS_TOKEN}`,
  },
  body: JSON.stringify({
    to: ['Uxxxxx', 'Uyyyyy'],   // LINE user IDs
    messages: [{ type: 'flex', altText: '...', contents: flexMessage }],
  }),
});
```

### Check quota before sending
```ts
const quota = await fetch('https://api.line.me/v2/bot/message/quota/consumption', {
  headers: { Authorization: `Bearer ${token}` },
}).then(r => r.json());
// quota.totalUsage vs quota.value
```

### Cooldown pattern (prevent alert spam)
```ts
// lib/alertCooldown.ts
let cooldownMs = 30 * 60 * 1000;
const lastAlertTime = new Map<string, number>();

export function setCooldown(minutes: number) { cooldownMs = minutes * 60 * 1000; }
export function canAlert(key: string): boolean {
  const last = lastAlertTime.get(key) ?? 0;
  if (Date.now() - last < cooldownMs) return false;
  lastAlertTime.set(key, Date.now());
  return true;
}
```

---

## 11. Chart Timezone (Recharts)

Always display timestamps in the local timezone using `toLocaleTimeString` with explicit `timeZone`:
```ts
const TZ = 'Asia/Bangkok';   // [this project] UTC+7

function formatTick(ts: string): string {
  return new Date(ts).toLocaleTimeString([], {
    hour: '2-digit', minute: '2-digit',
    timeZone: TZ,
  });
}
```

Never use `new Date().toLocaleTimeString()` without `timeZone` — the result depends on the server's system locale, which is UTC in Docker.

---

## 12. Configurable Rules via DB (Key-Value Config)

Store tunable values in a `Config` table instead of hardcoding or using env vars:
```prisma
model Config {
  key       String   @id @db.VarChar(64)
  value     String
  updatedAt DateTime @updatedAt
}
```

```ts
// Read at runtime (not at startup) so changes take effect without restart
async function getConfig() {
  const rows = await prisma.config.findMany();
  const cfg = Object.fromEntries(rows.map(r => [r.key, r.value]));
  return {
    enabled:  cfg['alert.enabled']  !== 'false',
    pm25:     parseFloat(cfg['alert.pm25']  ?? '37.5'),
    pm10:     parseFloat(cfg['alert.pm10']  ?? '100'),
    cooldown: parseInt(cfg['alert.cooldown'] ?? '30'),
  };
}
```

---

## [This Project] Quick Reference

**[this project]** basePath: `/air` · DB: `envi_db` · Containers: `envi_db`, `envi_web`, `envi_cron`

```bash
docker compose up -d                        # start everything
docker compose up -d --build web            # rebuild after code change
docker compose logs -f cron                 # watch sync logs
docker exec -it envi_db psql -U postgres -d envi_db   # DB shell
docker exec envi_db psql -U postgres -d envi_db -c 'TRUNCATE TABLE "Reading";'
```

IoT codes → DB fields: `a34004→pm25` · `a34002→pm10` · `a34001→tsp` · `a01007→windSpeed` · `a01008→windDirection` · `a01001→temperature` · `a01002→humidity`

AQ thresholds: PM2.5 ≤20/≤37.5/>37.5 · PM10 ≤50/≤100/>100 · TSP ≤100/≤200/>200 µg/m³
