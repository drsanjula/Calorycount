# Intake

Personal, single-user calorie & nutrient tracker (mobile-first PWA). Next.js 16 (App Router) · Supabase · Gemini (`gemini-3.8-flash`) · Tailwind v4.

> Status: build steps 1–4 done (scaffold, passcode auth, targets + setup, AI meal logging). Home dashboard, history, daily review, settings and PWA come next. A full README (Vercel + Android install) lands in the final step.

## Quick start (local testing)

1. **Supabase** — create a project, open **SQL Editor**, paste and run `supabase/migrations/0001_init.sql`.
   (Or with the CLI: `supabase link` then `supabase db push`.) RLS is enabled on every table with no policies, so only the server key can read/write.
2. **Env** — `cp .env.example .env.local` and fill in:

   | Var | Where |
   | --- | --- |
   | `GEMINI_API_KEY` | Google AI Studio → API keys |
   | `SUPABASE_URL` | Supabase → Project Settings → API |
   | `SUPABASE_SERVICE_ROLE_KEY` | Supabase → Project Settings → API keys → the **secret** key (`sb_secret_…`) or the legacy `service_role` key |
   | `APP_PASSCODE` | Your passcode (digits — the login screen is a keypad) |
   | `SESSION_SECRET` | `openssl rand -base64 32` |
   | `APP_TIMEZONE` | `Asia/Colombo` |

3. `npm install && npm run dev`, open http://localhost:3000, unlock, complete setup, then tap the camera button to log a meal.

To test on your phone over your LAN, run `npm run build && npm start` and open `http://<your-computer-ip>:3000` (the session cookie is only marked `secure` in production builds served over HTTPS, so for plain-HTTP LAN testing use `npm run dev -- -H 0.0.0.0`).

## Scripts

- `npm run dev` / `npm run build` — use webpack (`--webpack`), which Serwist's PWA plugin requires.
- `npm run typecheck`, `npm run lint`, `npm test` (Vitest: targets, nutrient totals, day boundaries).
