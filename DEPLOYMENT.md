# Deploying to GoDaddy (Shared/Business Hosting, cPanel)

This app is a Next.js site backed by a real MySQL database (via Prisma). It needs
Node.js running on the server — not just static file hosting — because of the
API routes (`/api/*`) and the login/session logic.

**Before you start:** confirm your specific GoDaddy plan has the **"Setup Node.js
App"** tool in cPanel (Software section). Cheaper shared/economy tiers sometimes
don't include it. If yours doesn't, the easiest fallback is hosting the app on
[Vercel](https://vercel.com) (free tier, built by the Next.js team) and pointing
your GoDaddy domain's DNS at it instead — say so and we can switch to that path.

A ready-to-upload build is at **`D:\mr-report-deploy.zip`** — see step 3.

## 1. Create the MySQL database

In cPanel → **MySQL Databases**:
1. Create a new database (e.g. `yourcpaneluser_mrreport`).
2. Create a new database user with a strong password.
3. Add that user to the database with **All Privileges**.
4. Note the full database name, username, password, and host (usually `localhost`
   on shared hosting) — you'll need these for the `DATABASE_URL`/`DATABASE_*` env
   vars below.

## 2. Set up the Node.js app in cPanel

In cPanel → **Setup Node.js App**:
1. Click **Create Application**.
2. Node.js version: pick the latest available 20.x or 22.x.
3. Application mode: **Production**.
4. Application root: e.g. `mr-report-app` (a folder under your home directory).
5. Application URL: the domain or subdomain you want this on.
6. **Application startup file**: `server.js`.

## 3. Build and upload

The build is already done — `D:\mr-report-deploy.zip` contains everything needed
(the standalone server, static assets, public files, and the `prisma/` folder
with all migrations). If you change the code later, rebuild with:

```bash
npm run build
```

which regenerates `.next/standalone/` (self-contained, with its own
`node_modules` and `server.js`). Re-zip that together with `.next/static`,
`public/`, and `prisma/` the same way.

Upload `mr-report-deploy.zip` via cPanel's **File Manager** into the Application
root folder you created in step 2, then extract it there. (Or use Git/SFTP if
your plan supports it.)

## 4. Environment variables

In cPanel's Node.js App page, there's an **Environment Variables** section. Add:

| Variable | Value |
|---|---|
| `DATABASE_URL` | `mysql://DBUSER:DBPASSWORD@localhost:3306/DBNAME` |
| `DATABASE_HOST` | `localhost` |
| `DATABASE_PORT` | `3306` |
| `DATABASE_USER` | your cPanel MySQL username |
| `DATABASE_PASSWORD` | your cPanel MySQL password |
| `DATABASE_NAME` | your cPanel MySQL database name |
| `JWT_SECRET` | a long random string (generate one, don't reuse the dev value in `.env`) |
| `NODE_ENV` | `production` |

**Known gotcha:** if GoDaddy's MySQL is version 8+ (likely), it defaults to the
`caching_sha2_password` auth plugin. Without TLS, Node's MySQL driver needs
explicit permission to fetch the auth key, or every connection fails with
`RSA public key is not available client side`. This app's Prisma adapter
(`src/lib/db.ts`, `prisma/seed.ts`) already passes `allowPublicKeyRetrieval: true`
to work around this — already handled in the code, nothing you need to do, just
flagging why it's there in case you see that error.

## 5. Create the database tables and seed real data

You need to run this **once**. Two options depending on whether your plan gives
you terminal/SSH access:

**With terminal access** (cPanel → Terminal, or SSH):
```bash
cd ~/mr-report-app   # your application root
npm install                 # picks up tsx/prisma CLI needed for the next two commands
npx prisma migrate deploy   # creates all tables (runs every migration in prisma/migrations)
npm run db:seed             # loads real doctors/chemists/stockists/products + the 3 real accounts
```

**Without terminal access:** open each folder under `prisma/migrations/` in order
(oldest timestamp first) and paste its `migration.sql` into cPanel →
**phpMyAdmin** → your database → SQL tab, running each one in sequence. For
seeding, you'd need to either get terminal access temporarily, or ask for a
one-off SQL export of the seed data — flag this if you hit it and we'll
generate one.

The seed script creates:
- **2 MRs**: Amit Sharma (`amit@aurelderma.com`) and Atul Dhiman (`atul@aurelderma.com`)
- **1 Manager**: Aurel Manager (`aurel@derma.com`)

Each person's password is just the part of their email before the `@` (e.g.
`amit@aurelderma.com` → password `amit`). **Change these immediately after
first login** via each user's profile — they're meant as easy-to-remember
starting passwords, not production-grade ones.

## 6. Start the app

Back in cPanel → Setup Node.js App, click **Run NPM Install** (picks up any
missing deps) then **Restart**. Visit your domain — you should land on `/login`.

## Updating the site later

1. Make your code changes locally.
2. `npm run build`.
3. Re-zip `.next/standalone/*` (minus its bundled `.env`, if any) +
   `.next/static` → `<root>/.next/static` + `public/` + `prisma/`.
4. Upload and extract over the existing app root in cPanel, overwriting files.
5. If `prisma/schema.prisma` changed, SSH/terminal in and run
   `npx prisma migrate deploy` (or paste the new migration's SQL into
   phpMyAdmin) **before** restarting.
6. Restart the app in cPanel → Setup Node.js App.
