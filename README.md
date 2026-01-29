# Pickleball

Connect with players, find courts, and reserve spots — all in one place.

## What it does

- **Landing page** (`/`) — Intro and CTAs to get started or log in.
- **Community feed** — Post, like, and comment. Ask for partners, share court tips.
- **Find courts** — Browse courts with addresses and ratings.
- **Reserve** — Pick a court, date, and time (demo flow; no real booking).

Login is demo-only (any email/password). Session is stored in `localStorage`.

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

- `/` — Landing page  
- `/home` — App (feed, courts, reserve) and login

### Build

```bash
npm run build
```

### Deploy (Cloudflare Workers)

```bash
npm run deploy
```

Requires a Cloudflare account and Wrangler configured (e.g. `wrangler.json`).

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
    home.tsx      # App: feed, courts, reserve (/home)
  root.tsx
  app.css
```

---

Built with [React Router](https://reactrouter.com/) and [Cloudflare Workers](https://workers.cloudflare.com/).
