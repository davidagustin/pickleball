# Pickleball

Connect with players, find courts, and find games—all in one place.

## What it does

- **Landing page** (`/`) — Intro and CTAs; **Log in** goes to the app feed; **Try demo** logs you in as a seeded user to see all features.
- **App layout** — After login you land on a **Facebook-like** feed page with a top bar (logo, search, nav: Home, Friends, Messages, Courts, Sessions, Tournaments) and a left sidebar (profile + same links) on desktop. All main app routes share this shell.
- **Community feed** — Post, like, and comment. Ask for partners, share court tips.
- **Find courts** — Browse courts; join a digital court queue (paddle stack) and use room codes / QR to join.
- **Reserve** — Pick a court, date, and time (demo flow; no real booking).
- **Play sessions** — Weekly calendar with bubbles (color by region), list view, add session (venue, date, time, skill level, min/max players, optional recurring weekly), “Add my name” to join, waitlist when full, session notes. Not court reservation — arrange play so you have enough players before heading out.
- **Court finder** — Find courts by city, **Add a court** (name, address, city, state, court count, type, reservable), court detail page with queue and room code, “Suggest changes” link.
- **Guides & learn** — How to play, skill rating, gear guides; plus links to courts, paddles, and sessions.
- **Paddle database** — Compare paddle specs (brand, model, core, face, weight, shape, dimensions, price); filter by brand or core.
- **Tournaments** — Create single-elimination tournaments; admin starts bracket and sets match winners.
- **Lessons** — Private lessons & coaching tab: post listings (title, location, availability, rate, contact).
- **Friends & messages** — Friend requests and direct messages (see `/friends`, `/messages`).
- **Profiles** — Paddle, shoes, gear, DUPR link, bio, skill level, region; **avatar photo** stored in Cloudflare R2 (see `/profile/:userId`).

Login: **Try demo** (one-click as Alex, requires seed migration) or demo login (any email/password). Session uses HTTP-only cookie when using server auth.

## Tech stack

- [React Router 7](https://reactrouter.com/)
- [React 19](https://react.dev/)
- [Tailwind CSS 4](https://tailwindcss.com/)
- [Cloudflare Workers](https://workers.cloudflare.com/) (deploy target)
- [Cloudflare R2](https://developers.cloudflare.com/r2/) (profile avatars)
- TypeScript

## Getting started

### Install

```bash
npm install
```

### Develop

```bash
npm run dev
```

App runs at **http://localhost:5173**.

- `/` — Landing page (Try demo, Go to app)  
- `/demo` — One-click demo login (logs in as Alex; run seed migration first)  
- `/home` — App: feed, courts, reserve, lessons, sessions link, tournaments link  
- `/sessions` — Play sessions: weekly calendar (bubbles), list view, add session (recurring, court), join session, waitlist, notes  
- `/courts` — Find courts (filter by city), add a court  
- `/courts/new` — Add a court form  
- `/courts/:courtId` — Court detail: queue, room code, suggest changes  
- `/guides` — Guides & learn (how to play, skill rating, gear)  
- `/paddles` — Paddle database (filter by brand/core; compare specs)  
- `/paddles/:paddleId` — Paddle detail (full specs)  
- `/tournaments` — List and create tournaments; open one for bracket and admin controls  
- `/friends`, `/messages` — Friends and DMs  
- `/profile/:userId` — View/edit profile

### Build

```bash
npm run build
```

### Deploy (Cloudflare Workers)

```bash
npm run deploy
```

Requires a Cloudflare account and Wrangler configured (e.g. `wrangler.json`). Profile avatars use an R2 bucket named `pickleball`; create it in the Cloudflare dashboard and add the binding in `wrangler.json` (already configured).

### Demo data and heavy seed (optional)

To use **Try demo** and see every feature with sample data, run D1 migrations including the seed:

```bash
wrangler d1 migrations apply DB --remote
# or for local: wrangler d1 migrations apply DB --local
```

Migrations `0007_seed_demo.sql` and `0013_seed_heavy.sql` through `0022_seed_chunk6.sql` add demo + heavy seed (many users, regions, courts, posts, likes, comments, friends, messages, tournaments) for a “widely used” feel. Regenerate with `node scripts/generate-seed.js` if needed.

Then open `/demo` or click **Try demo** on the landing page. You’ll be logged in as Alex and see the feed, court queues, tournaments (draft + in-progress bracket), coaching listings, friends, and messages.

## Scripts

| Command        | Description                    |
|----------------|--------------------------------|
| `npm run dev`  | Start dev server with HMR      |
| `npm run build`| Production build               |
| `npm run deploy` | Deploy to Cloudflare Workers |
| `npm run preview` | Build + local preview      |
| `npm run typecheck` | TypeScript + typegen check |
| `npm run check` | Build + deploy dry-run       |

### Dependency updates (Renovate)

This repo uses [Renovate](https://docs.renovatebot.com/) to open PRs for dependency updates. To enable it:

1. Install the [Renovate GitHub App](https://github.com/apps/renovate) on your account or org.
2. Choose **Select repositories** and add this repo (or **All repositories**).
3. Renovate will read `.github/renovate.json` and open PRs on a weekly schedule; devDependencies and patch updates are set to automerge after checks pass.

## Project layout

```
app/
  components/
    AppShell.tsx  # Facebook-style layout: top bar + left sidebar (Home, Friends, Messages, Courts, etc.)
  routes/
    landing.tsx   # Landing page (index /)
    demo.tsx      # One-click demo login (/demo)
    home.tsx      # App: feed-first page with tabs (Feed, Courts, Reserve, Lessons); uses AppShell
    courts.tsx, courts.new.tsx, courts.$courtId.tsx
    sessions.tsx
    guides.tsx, paddles.tsx, paddles.$paddleId.tsx
    tournaments.tsx, tournaments.$tournamentId.tsx
    friends.tsx, messages.tsx, messages.$otherId.tsx
    profile.$userId.tsx, join.$code.tsx
  lib/
    db.server.ts  # D1 helpers
migrations/
  0000_init.sql .. 0012_avatar_url.sql   # Schema + demo seed (0007); 0012 adds profile avatar (R2)
  0013_seed_heavy.sql .. 0022_seed_chunk6.sql  # Heavy seed (users, regions, courts, posts, likes, comments, friends, messages, tournaments)
scripts/
  generate-seed.js   # Generates heavy seed SQL (run and pipe into migrations or split for 0013/0014)
```

---

Built with [React Router](https://reactrouter.com/) and [Cloudflare Workers](https://workers.cloudflare.com/).
