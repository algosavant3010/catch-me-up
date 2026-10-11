# Catch Me Up

A second-screen companion for Indian cricket fans: catch up on a match in
20 seconds, in your language, without spoilers, and trust what you're told.

Built for the Dream11 Forward Deployed Engineer take-home. **The match is
simulated** — fictional teams and players, a scripted deterministic T20
chase — clearly labelled throughout the app. Not affiliated with Dream11,
the BCCI, or any real league.

See `docs/DECISIONS.md` for the reasoning behind every non-obvious choice,
`docs/ARCHITECTURE.md` for how it's built (including the win-probability
formula and its limits), `docs/PROMPTS.md` for the Gemini prompts,
`docs/EVAL.md` for the recap evaluation results, and `docs/DEMO.md` for a
5-minute walkthrough script.

## Frontend design

The match centre uses a neutral charcoal/off-white palette with racing-red
actions, Barlow typography, and a responsive two-column desktop layout.
Both saved themes and all ten language choices remain available. Shared
controls use 44px minimum targets, visible focus, reduced-motion support,
and consistent form labels. Sheets contain keyboard focus, keep their
headers visible, and restore focus on close.

See [the frontend audit and design system](docs/FRONTEND.md) for the route
inventory, token conventions, asset source, and verification scope.

## Quickstart

```bash
npm install
npm run dev
```

Open <http://localhost:3000>. The app is **fully usable with zero
configuration** — with no `GEMINI_API_KEY` set, every AI feature falls back
to a deterministic, non-AI equivalent (clearly labelled "Instant summary
(no AI)", etc.).

## Environment variables

All optional. Copy into `.env.local`:

```bash
# Enables real Gemini calls. Without it, every feature uses its deterministic fallback.
GEMINI_API_KEY=

# Model names are config, not code (see lib/ai/config.ts for defaults + why these two were chosen).
GEMINI_MODEL_QUALITY=gemini-3.6-flash
GEMINI_MODEL_FAST=gemini-3.5-flash-lite

# Enables Upstash Redis for caching/rate-limiting/rooms. Without both, falls back to
# an in-memory store (fine for local dev and a single-instance demo deploy).
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=
```

## Scripts

| Command                           | Purpose                                                                                |
| --------------------------------- | -------------------------------------------------------------------------------------- |
| `npm run dev`                     | Local dev server                                                                       |
| `npm run build` / `npm run start` | Production build / serve                                                               |
| `npm run typecheck`               | `tsc --noEmit`                                                                         |
| `npm run lint` / `npm run format` | ESLint / Prettier                                                                      |
| `npm test`                        | Unit + mocked eval tests (Vitest)                                                      |
| `npm run test:coverage`           | Unit tests with coverage                                                               |
| `npm run test:eval:live`          | Live eval against the real Gemini API (needs `GEMINI_API_KEY`) — writes `docs/EVAL.md` |
| `npm run test:e2e`                | Playwright e2e + accessibility (builds and serves the app first)                       |

## Testing

- **Unit** (`tests/unit`): match engine (incl. explicit win-probability
  monotonicity sweeps), verifier, fact-sheet builder, fallback recaps,
  cache, rate limiter, Samjhao tools, prediction-game scoring, rooms,
  i18n completeness (every UI key exists in every language), spoiler-shield
  calibration math.
- **Eval** (`tests/eval`): a 30+ window golden set (early/middle/last-over/
  wicket-clusters/long-gaps/one-ball), run mocked in CI and optionally live
  (`EVAL_LIVE=1`) measuring citation validity, schema validity, fallback
  rate, and latency. Results: `docs/EVAL.md`.
- **Adversarial**: prompt injection, off-topic questions, oversized input,
  blocked/timeout/rate-limited/malformed-JSON model responses — all
  covered in `tests/unit/ai/*.test.ts` via mocked Gemini responses.
- **E2E** (`tests/e2e`, Playwright): join late, Catch Me Up, proof chip,
  away flow, language switch, calibration, a prediction, a share card,
  offline reload — on both a mobile and a desktop viewport — plus an axe
  accessibility scan of the landing and match pages.
- **CI** (`.github/workflows/ci.yml`): install, format check, lint,
  typecheck, unit+eval (mocked), build, and a grep-based scan of the
  production client bundle for key/secret leakage. E2E is not run in CI
  (it needs browser binaries); run it locally with `npm run test:e2e`.

## Deploy (Vercel)

1. Push this repo to GitHub.
2. Import it in Vercel, framework preset "Next.js".
3. Set the environment variables above (all optional — the app works with
   none of them set).
4. Deploy. Check `/api/health` on the deployed URL to confirm it's live.

## Known limitations

- **Non-English translations are my own good-faith work, not
  native-speaker reviewed.** Hinglish and Hindi are reasonably confident;
  Tamil, Telugu, Marathi, Bengali, Kannada, Gujarati and Punjabi should be
  reviewed by a native speaker before any real-world use.
- Room/leaderboard storage is a simple read-modify-write over the
  key-value store, not a transaction — see `docs/DECISIONS.md` #12.
- The in-memory store fallback (no Redis configured) does not share state
  across serverless instances or survive a cold start; fine for a demo
  deploy, not for production scale.
- The live Gemini free tier rate-limits a rapid burst of requests (as the
  live eval harness does on purpose) — see `docs/EVAL.md` for what that
  looks like in practice and why every request still resolves safely via
  the fallback path regardless.

## License

Built as a take-home assignment. Not for production or commercial use.
