# Comprehensive Code Review Report

**Project:** mtr (Pickleball app)  
**Scope:** Full codebase — five distinct review areas, each assigned to a single agent to avoid overlap.  
**Severity legend:** CRITICAL | HIGH | MEDIUM | LOW

---

## Agent 1 — Security

**Scope:** Authentication, authorization, secrets, SQL/user input, session, and OWASP-relevant issues only.

### Findings

| Severity | Location | Issue | Recommendation |
|----------|----------|--------|-----------------|
| **LOW** | `app/routes/home.tsx` (demo login) | Demo login accepts any email with no password; intended for demo but could be abused (e.g. account creation spam). | Document as intentional; consider rate limiting or CAPTCHA for demo endpoint. |
| **LOW** | `app/root.tsx:59` | Error boundary exposes stack trace when `import.meta.env.DEV` is true. | Acceptable for dev; ensure production builds do not set DEV. |
| **—** | `app/lib/db.server.ts` | All DB access uses `.prepare().bind()` — no string concatenation of user input. | Good: SQL injection risk mitigated. |
| **—** | Session cookie | `sessionCookie()` sets `HttpOnly; SameSite=Lax; Max-Age=…`. | Good: reduces XSS/CSRF exposure. |
| **—** | OAuth | Google/GitHub callbacks use env for client_id/client_secret; no secrets in repo. | Good: secrets in Cloudflare env. |

**Security summary:** No CRITICAL or HIGH issues. Parameterized queries and session cookie settings are solid. Only low-risk item is unauthenticated demo login (document/rate-limit if needed).

---

## Agent 2 — Code Quality

**Scope:** Function size, cyclomatic complexity, nesting depth, naming, and duplication only (no performance or security).

### Findings

| Severity | Location | Issue | Recommendation |
|----------|----------|--------|-----------------|
| **HIGH** | `app/routes/home.tsx` | Single component ~1,090 lines; loader, action, and large JSX in one file. | Split: e.g. `home.loader.ts`, `home.action.ts`, and components (FeedTab, CourtsTab, ReserveTab, CoachingTab, shared Nav/Footer). |
| **HIGH** | `app/routes/home.tsx:253` | `useCallback` is used but not imported from `"react"`. | Add `useCallback` to React import. |
| **HIGH** | `app/routes/home.tsx` | Client expects `Post` with `likedBy: string[]` and uses `user.email`; server returns `Post` with `likedByMe: boolean`. Accessing `post.likedBy` on server data throws. | Align types: either (a) use server shape (`likedByMe`) in UI and like logic, or (b) map server → client shape in loader and keep client-only type. |
| **MEDIUM** | `app/routes/home.tsx` | Type `Post` used in component but not imported from `~/lib/db.server` (or a shared types module). | Import `Post` from `~/lib/db.server` (or shared types) and fix shape to match server. |
| **MEDIUM** | `app/lib/db.server.ts` | `getProfile` (lines 239–298): try/catch with second nearly identical query in catch; ~60 lines. | Prefer single query; if backward compatibility needed, use optional columns or one query with fallback mapping. |
| **MEDIUM** | `app/lib/db.server.ts` | `getBracketMatches` (lines 577–627): loop with 3 sequential `db.prepare().first()` per row. | See Agent 3 (Performance) for batching; keep function but reduce per-row DB calls. |
| **LOW** | `app/routes/home.tsx` | `handleAddPost` builds a local `Post` with `authorId: user.email`; server type uses `authorId: string` (user id). | Use `user.id` (or the same identifier the server uses) for `authorId` when constructing client-side post. |
| **LOW** | Various routes | Repeated pattern: `getSessionToken(request.headers.get("Cookie"))` then `getSessionUser(db, token)`. | Extract e.g. `getRequestUser(db, request)` used by all protected actions. |

**Code quality summary:** One file is oversized and mixes concerns; one runtime bug (likedBy vs likedByMe) and one missing import (useCallback). Address HIGH items first.

---

## Agent 3 — Performance

**Scope:** Database query patterns, N+1, caching, and algorithm efficiency only (no refactors for style or structure).

### Findings

| Severity | Location | Issue | Recommendation |
|----------|----------|--------|-----------------|
| **HIGH** | `app/lib/db.server.ts:getPosts` | For each of up to 100 posts: 1 query for likes, 1 for comments → up to 201 extra queries. | Single query for all likes for loaded post IDs (e.g. `WHERE post_id IN (?,?,…)`), single for comments; build map by post_id and attach in JS. |
| **HIGH** | `app/lib/db.server.ts:getConversations` | For each distinct conversation partner, one `SELECT … FROM users WHERE id = ?`. | After building `byOther`, fetch all user IDs and one query: `SELECT … FROM users WHERE id IN (?,?,…)`; map results to conversations. |
| **HIGH** | `app/lib/db.server.ts:getBracketMatches` | For each match row, up to 3 separate queries for player1, player2, winner names. | Collect all user IDs from the match set; one `SELECT id, name FROM users WHERE id IN (…)`; map names in memory. |
| **HIGH** | `app/lib/db.server.ts:getPlaySessionsForWeek` | Per session: signup count, my signup, waitlist count, my waitlist, region name/color → many sequential queries. | Batch: one query for all signup counts (GROUP BY session_id), one for current user signups, one for waitlist counts, one for regions; join in code. |
| **MEDIUM** | `app/routes/home.tsx` (loader) | For each court ID: `isInQueue(db, cid, user.id)` and `isCourtAdmin(db, cid, user.id)` in a loop. | Single query: e.g. `SELECT court_id, 'queue' as kind FROM court_queue WHERE user_id = ? UNION SELECT court_id, 'admin' FROM court_admins WHERE user_id = ?`; build `myInQueue` and `myAdminStatus` from result. |
| **MEDIUM** | `app/lib/db.server.ts:getQueuesForCourts` / `getCodesForCourts` / `getAdminsForCourts` | Three separate loops over `courtIds`, each calling one function per id. | Prefer one batch per concern: e.g. `getCourtQueuesBatch(db, courtIds)` with `WHERE court_id IN (?,?,…)` and return Record<courtId, QueueEntry[]>. |
| **LOW** | `app/lib/db.server.ts:getCourtByCode` | `UPPER(TRIM(?)) = UPPER(code)` — index on `court_room_codes(code)` may not be used if DB compares with expression. | If table is large, consider persisted computed column or ensure index supports the comparison. |

**Performance summary:** Multiple clear N+1 patterns (getPosts, getConversations, getBracketMatches, getPlaySessionsForWeek). Batching by ID lists will reduce query count sharply; no caching reviewed in this pass.

---

## Agent 4 — Best Practices

**Scope:** Error handling, logging, documentation, and tests only (no security or performance).

### Findings

| Severity | Location | Issue | Recommendation |
|----------|----------|--------|-----------------|
| **MEDIUM** | `app/lib/db.server.ts:getProfile` | Bare `catch { … }` with no logging; second query hides failure reason. | At least log `error` in dev or to a monitored logger; avoid silent fallback without trace. |
| **MEDIUM** | `app/lib/db.server.ts:getCourts` / `getPaddles` | `try { … } catch { return []; }` — caller cannot distinguish "no rows" from "DB error". | Let errors propagate or return `{ data: [], error?: string }`; or log and rethrow. |
| **MEDIUM** | `app/lib/db.server.ts:getPlaySessionsForWeek` | Inner try/catch for waitlist with empty catch ("waitlist table may not exist"). | Log once (e.g. debug) or document; avoid silent swallow in production. |
| **MEDIUM** | `app/entry.server.tsx` | Only logs streaming errors when `shellRendered` is true; initial shell errors may be unlogged. | Comment notes handleDocumentRequest will log; ensure root/loader errors are logged in one place. |
| **LOW** | `app/lib/db.server.ts` | No JSDoc or module-level description for exported functions. | Add brief JSDoc for public API (e.g. getSessionUser, getPosts, createCourt). |
| **LOW** | `e2e/home.spec.ts` | Single test: home page loads and title contains "pickleball". | Add tests for: auth flow (demo or OAuth), court list, session list, and one protected action (e.g. join queue) if feasible. |
| **LOW** | Routes | No explicit rate limiting in app code (e.g. on demo login, post creation). | Consider rate limiting at edge or in action for sensitive endpoints. |

**Best practices summary:** Several silent or opaque catch blocks; improving error handling and logging will help debugging. Test coverage is minimal; expand e2e and consider unit tests for db helpers.

---

## Agent 5 — Maintainability

**Scope:** DRY, coupling, testability, and code structure only (no performance or security).

### Findings

| Severity | Location | Issue | Recommendation |
|----------|----------|--------|-----------------|
| **HIGH** | `app/routes/home.tsx` vs `app/routes/courts.$courtId.tsx` | Court queue UI (join/leave, room code, admins) duplicated between home "Courts" tab and court detail page. | Extract shared component(s), e.g. `CourtQueueCard`, `RoomCodeBlock`, and reuse in both routes. |
| **MEDIUM** | All route actions | Same 3–4 lines to get current user: get cookie → get token → get user; repeated in every protected action. | Introduce `requireUser(db, request)` (or similar) returning user or redirect/error; use in every action that needs auth. |
| **MEDIUM** | `app/lib/db.server.ts` | Single large module with many unrelated domains (sessions, posts, courts, tournaments, paddles, play sessions, etc.). | Split by domain: e.g. `db/sessions.server.ts`, `db/courts.server.ts`, `db/tournaments.server.ts`, re-export from `db.server.ts` if desired. |
| **MEDIUM** | Nav/footer | Same nav and footer markup repeated across home, courts, court detail, messages, etc. | Move to layout (e.g. root or a nested layout) or shared `<AppShell>` with nav/footer and `<Outlet />`. |
| **LOW** | `app/lib/db.server.ts` | Direct D1 usage throughout; no abstraction. | Optional: introduce a small `db` wrapper (e.g. run, runOne, runMany) to simplify tests with a mock. |
| **LOW** | Routes | Some routes use `context.cloudflare.env.DB` and optional env (e.g. GOOGLE_CLIENT_ID); others assume DB exists. | Centralize "get db from context" and "get env" in one helper to avoid repeated null checks. |

**Maintainability summary:** Biggest wins are extracting shared UI (court queue, nav/footer) and a single "require user" helper. Splitting `db.server.ts` by domain will improve navigation and testability.

---

## Summary by Severity

| Severity | Count | Areas |
|----------|-------|--------|
| **CRITICAL** | 0 | — |
| **HIGH** | 6 | Code quality (3), Performance (4), Maintainability (1) |
| **MEDIUM** | 12 | Code quality (2), Performance (2), Best practices (4), Maintainability (4) |
| **LOW** | 10 | Security (1), Code quality (2), Performance (1), Best practices (3), Maintainability (3) |

**Recommendation:** REQUEST CHANGES — address HIGH items (especially `home.tsx` runtime/import and N+1 queries) before merge; then tackle MEDIUM for quality and maintainability.

---

## Agent Task Summary (No Overlap)

| Agent | Responsibility | Did not cover |
|-------|----------------|----------------|
| **1 – Security** | Auth, secrets, SQL/user input, session, OWASP | Quality, performance, tests, structure |
| **2 – Code quality** | Function size, complexity, nesting, naming, types | Security, N+1, logging, DRY |
| **3 – Performance** | DB N+1, batching, caching, algorithm cost | Security, naming, error handling, duplication |
| **4 – Best practices** | Error handling, logging, docs, tests | Injection, complexity, query batching, DRY |
| **5 – Maintainability** | DRY, coupling, testability, file structure | Security, performance, types, logging |

Each agent scoped to a single category so no finding is duplicated across agents.
