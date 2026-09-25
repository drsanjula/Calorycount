# Intake

A personal, single-user calorie and nutrient tracker. It's a mobile-first PWA for Chrome on Android:

- Log a meal with a photo, a description, or both.
- Gemini breaks the meal into items and estimates the nutrients for each.
- Daily targets are calculated from your body stats.
- A History dashboard shows your trends.
- An AI review of yesterday appears on Home each morning.

**Stack:** Next.js 16 (App Router, TypeScript) · Tailwind CSS v4 · Supabase (Postgres) · Gemini via `@google/genai` (`gemini-3.8-flash`) · Serwist (PWA) · Recharts · Zod · Vitest.

The app name is set in `lib/config.ts` (`APP_NAME`).

---

## 1. Supabase setup

1. Create a project at [supabase.com](https://supabase.com).
2. Run the migration:
   - **Dashboard:** open **SQL Editor**, paste the contents of `supabase/migrations/0001_init.sql`, and click **Run**.
   - **CLI:** `supabase link --project-ref <ref>`, then `supabase db push`.
3. Copy the credentials from **Project Settings → API / API Keys**:
   - the **Project URL**, which goes in `SUPABASE_URL`;
   - the **secret** key (`sb_secret_…`), which goes in `SUPABASE_SERVICE_ROLE_KEY`. On older projects, use the legacy `service_role` key instead.

The migration enables Row Level Security on every table and defines **no** policies, so the public/anon key can't read anything. All data access goes through server route handlers and server actions using the secret key. The browser never talks to Supabase.

Meal photos are never stored. They are compressed on the phone, sent to Gemini for that one request, and then discarded.

## 2. Environment variables

All of these are server-only. Never prefix any of them with `NEXT_PUBLIC_`.

| Variable | Description |
| --- | --- |
| `GEMINI_API_KEY` | From [Google AI Studio](https://aistudio.google.com/apikey) |
| `SUPABASE_URL` | `https://<ref>.supabase.co` |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase secret key (`sb_secret_…`) or legacy `service_role` key |
| `APP_PASSCODE` | Your unlock passcode. Use digits, since the login screen is a keypad; at least 4, and 6 or more is recommended. |
| `SESSION_SECRET` | Signs the session cookie. Generate one with `openssl rand -base64 32` |
| `APP_TIMEZONE` | `Asia/Colombo`. All "today" and "yesterday" logic uses this timezone |

For local work, run `cp .env.example .env.local` and fill it in.

## 3. Run locally

```bash
npm install
npm run dev          # http://localhost:3000 (webpack; the service worker is disabled in dev)
npm run typecheck && npm run lint && npm test
npm run build && npm start   # production build, emits public/sw.js
```

The build and dev scripts pass `--webpack` because Serwist's Next.js plugin is webpack-only. Turbopack is Next 16's default bundler.

To try it from your phone on the same Wi-Fi, run `npm run dev -- -H 0.0.0.0` and open `http://<computer-ip>:3000`. The session cookie is only marked `secure` in production, so login works over plain HTTP in dev. The camera and the PWA install prompt need HTTPS, so test those on the Vercel deployment.

## 4. Deploy to Vercel

1. Push this repo to GitHub, then in Vercel choose **Add New → Project** and import it.
2. The framework preset is **Next.js**. Leave the build command at its default: Vercel runs `npm run build`, which already includes `--webpack`.
3. Under **Settings → Environment Variables**, add all six variables above for the Production environment, and for Preview too if you use it.
4. Deploy. Open the URL, enter your passcode, and complete first-launch setup.

Checks after deploying:
- `/manifest.webmanifest` and `/sw.js` load without logging in.
- Every other page redirects to `/login`.
- `/api/*` returns 401 when you're signed out.

Limits worth knowing:
- `/api/log` and `/api/review` set `maxDuration = 60`, so Gemini calls have room to finish.
- Failed logins are limited to 5 per 15 minutes per IP (stored in the `login_attempts` table).

## 5. Install on Android

1. Open the deployed URL in **Chrome** on your phone and unlock the app.
2. Tap **⋮ → Add to Home screen → Install**. On some versions it's **Install app**, or Chrome shows an install banner.
3. Launch **Intake** from the home screen. It opens full-screen without browser chrome.

When the app is installed:
- The app shell and static assets are cached, so it opens quickly and works when offline.
- Every API call is network-only.
- If you're offline, the Log button shows *"Offline — can't analyze right now"* and keeps your typed text. There's no offline queue.
- **Camera photos:** when *Save camera photos to device* is on in Settings, the original photo is also downloaded as `meal-YYYYMMDD-HHmm.jpg` to Downloads, where Google Photos picks it up. Photos picked from the gallery are never re-downloaded.

---

## How it works

### Targets (`lib/targets.ts`, unit-tested)
- **BMR:** Mifflin–St Jeor. Age comes from the date of birth, and weight from the latest `weight_logs` row.
- **TDEE:** BMR × the activity multiplier (1.2 / 1.375 / 1.55 / 1.725 / 1.9).
- **Daily limit:** TDEE ∓ pace × 7700 / 7.
  - It never goes below 1500 kcal for men or 1200 kcal for women. When that floor applies, the UI flags it.
- **Macros:**
  - Protein is 1.8 g/kg when losing and 1.6 g/kg otherwise.
  - Fat is 25% of kcal.
  - Carbs fill the remaining kcal.
  - Fibre is 14 g per 1000 kcal.
  - Sugar max is 10% of kcal.
  - Sodium max is 2000 mg.
- **Overrides:** any target can be overridden in Settings, where it's tagged *custom* and can be reset to *auto*.
  - A kcal override also recalculates the auto macros.
- **Snapshots:** the first meal saved each day stores a snapshot of that day's targets in `daily_targets`. History and reviews judge each day against its own snapshot.

### Meal logging (`/api/log`)
- The request is sent to Gemini with structured JSON output and thinking level `low`, and the response is validated with Zod. Output that fails validation is retried once.
- If a quantity is too ambiguous, Gemini asks a question inline. There are at most 2 rounds, after which it gives a best estimate.
- Nothing is saved until you tap **Save**. Meal totals are recomputed on the server from the items.
- Meals are read-only after saving.

### Daily review (`/api/review`)
- When the app loads and yesterday (Colombo time) has meals but no review, a review is generated with thinking level `medium`.
- The generated review is stored, so asking again for the same date returns the saved review without calling Gemini.
- Tapping **Got it** hides the card for that day. The dismissal is stored per date in the browser.

## Project layout

```
app/(app)/            Home, Log, History (+ day detail), Settings; bottom nav + onboarding gate
app/api/              log, meals, review, weight route handlers
app/login, app/setup  keypad unlock, first-launch setup
app/manifest.ts, app/sw.ts   PWA manifest + Serwist service worker
proxy.ts              auth gate (Next 16's replacement for middleware.ts)
lib/                  targets, nutrition math, time (Colombo), schemas (Zod), gemini, data access
supabase/migrations/  schema
tests/                Vitest unit tests
```
