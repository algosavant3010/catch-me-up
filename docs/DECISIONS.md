# Decisions

Running log of non-obvious choices made while building Catch Me Up, in the
order they were made. Each entry states the decision, why, and the
alternative considered.

## 1. Gemini model selection

Verified live against the real Gemini API on 2026-10-10 (see
`npx tsx` ad-hoc script, since removed) using the provided `GEMINI_API_KEY`,
`@google/genai@2.28.0`.

- **GEMINI_MODEL_QUALITY = `gemini-3.6-flash`** (recaps, Samjhao reasoning,
  Snap the TV vision). Docs at ai.google.dev list it as a **Stable**
  "previous-generation Flash model, balancing speed and multimodal
  capabilities" — multimodal input is required for Snap the TV. Confirmed
  working live with `thinkingConfig.thinkingLevel = MINIMAL`.
- **GEMINI_MODEL_FAST = `gemini-3.5-flash-lite`** (chips, chat clustering,
  explain-over, quick answers). Docs describe it as "our fastest,
  most cost-effective 3.5 model for high-throughput execution" — Stable.
  Confirmed working live with `thinkingLevel = MINIMAL`.
- **Rejected default: `gemini-3.8-flash`.** It is Stable and the newest
  Flash model, but live testing showed: `thinkingLevel: MINIMAL` is rejected
  outright for this model ("not supported"), `LOW` returned a transient
  `503 UNAVAILABLE` (high demand), and `MEDIUM` returned an empty
  `response.text` because thinking tokens consumed the output budget before
  any output was generated. Too unpredictable for a timed demo. It remains
  selectable via env var for anyone with more output-token budget to spare.
- **Rejected: `gemini-2.5-flash` / `gemini-2.5-flash-lite`.** Google's own
  docs (checked live) state access to the 2.5 family is now limited to
  projects that have *already* used them; new API keys should use 3.5/3.8.
  Our key is new, so depending on 2.5 would be a latent failure.
- Model names are **never hardcoded** in route handlers — every call site
  reads `process.env.GEMINI_MODEL_QUALITY` / `GEMINI_MODEL_FAST` through
  `lib/ai/config.ts`, falling back to the two defaults above only if the env
  var is unset.

## 2. Gemini JS SDK surface

The `@google/genai` docs site documents a newer Python-first "Interactions
API" (`client.interactions.create`) and function-calling steps like
`function_call`/`function_result`. The installed JS SDK
(`@google/genai@2.28.0`, confirmed by reading
`node_modules/@google/genai/dist/genai.d.ts` directly) does **not** expose
that surface in a stable way for our use case; it exposes the classic
`ai.models.generateContent` / `generateContentStream` plus `tools: [{
functionDeclarations: [...] }]` for function calling, and
`config.thinkingConfig.thinkingLevel` (enum `ThinkingLevel.MINIMAL | LOW |
MEDIUM | HIGH`) for thinking control. We build on this confirmed surface,
not on docs examples that didn't match the installed package version.

## 3. Thinking level

`thinkingConfig.thinkingLevel = ThinkingLevel.MINIMAL` for every AI call in
this app (recaps, chips, chat pulse, explain-over, Samjhao, vision). All of
our tasks are fact-restating/classification, not open-ended reasoning, so the
lowest level minimizes latency and cost as required by the brief.

## 4. Redis is optional

No Upstash credentials were supplied for this build. `lib/store/*` defines a
`KeyValueStore` interface with two implementations: `UpstashStore` (used only
when `UPSTASH_REDIS_REST_URL`/`UPSTASH_REDIS_REST_TOKEN` are both set) and
`MemoryStore` (default). Selection happens once at module load with a single
`console.warn` if falling back. This satisfies F10 (rooms/leaderboard) and
rate limiting without a hard Redis dependency, and keeps local dev and CI
free of external services.

## 5. Vercel deployment

No Vercel account/token is available in the build environment. The repo is
prepared to deploy as-is (`next build` verified locally, env vars documented
in `docs/DEMO.md` and README). The human operator runs `vercel` or connects
the GitHub repo and supplies the live URL.

## 6. Next.js experimental flags disabled

`create-next-app` scaffolded with `cacheComponents: true` and
`partialPrefetching: true` (Next 16 experimental "use cache" model). This app
is dominated by request-time, user/session-specific data (match position,
away-mode windows, rooms, AI calls) so these flags were turned off in favor
of standard per-route dynamic rendering — adopting `"use cache"` everywhere
correctly is a larger project than this brief calls for and risks silent
staleness bugs in a fan-facing live-score product.

## 7. Repository layout matches the brief exactly

Section 5 of the brief specifies exact paths; we did not deviate except
where Next.js requires it (e.g. `app/api/*/route.ts` handlers all live under
`app/api/`, exactly as specified).

## 8. Match simulation is fully deterministic

The simulated T20 chase is defined as a static, hand-authored ball-by-ball
JSON file (`data/match.json`) generated once by a seeded script and committed
— not regenerated at runtime — so that the final-over finish, the wides/
no-balls, and every ball number are stable across every reviewer's session
and across our own tests/screenshots.

## 9. Win probability model

Documented in full, with formula and limits, in `docs/ARCHITECTURE.md`
§ "Win probability model" (kept there rather than duplicated here since it
needs the match-state vocabulary defined in that doc).
