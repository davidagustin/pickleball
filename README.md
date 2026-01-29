# Pickleball

Connect with players, find courts, and reserve spots — all in one place.

## What it does

- **Landing page** (`/`) — Intro and CTAs; **Try demo** logs you in as a seeded user to see all features.
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
- **Profiles** — Paddle, shoes, gear, DUPR link, bio, skill level, region (see `/profile/:userId`).

Login: **Try demo** (one-click as Alex, requires seed migration) or demo login (any email/password). Session uses HTTP-only cookie when using server auth.

## Tech stack

- [React Router 7](https://reactrouter.com/)
- [React 19](https://react.dev/)
- [Tailwind CSS 4](https://tailwindcss.com/)
- [Cloudflare Workers](https://workers.cloudflare.com/) (deploy target)
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

Requires a Cloudflare account and Wrangler configured (e.g. `wrangler.json`).

### Demo data (optional)

To use **Try demo** and see every feature with sample data, run D1 migrations including the seed:

```bash
wrangler d1 migrations apply DB --remote
# or for local: wrangler d1 migrations apply DB --local
```

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

## Project layout

```
app/
  routes/
    landing.tsx   # Landing page (index /)
    demo.tsx      # One-click demo login (/demo)
    home.tsx      # App: feed, courts, reserve, lessons (/home)
    tournaments.tsx, tournaments.$tournamentId.tsx
    friends.tsx, messages.tsx, messages.$otherId.tsx
    profile.$userId.tsx, join.$code.tsx
  lib/
    db.server.ts  # D1 helpers
migrations/
  0000_init.sql .. 0006_coaching_listings.sql  # Schema
  0007_seed_demo.sql                            # Demo data for all features
```

---

Built with [React Router](https://reactrouter.com/) and [Cloudflare Workers](https://workers.cloudflare.com/).
