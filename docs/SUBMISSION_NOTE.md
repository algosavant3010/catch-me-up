# Submission note

Catch Me Up is a second-screen companion for Indian cricket fans who join a
match late, step away mid-over, or watch in a language other than English —
on a lagging stream, on patchy data. One tap ("Catch me up") gives a
verified recap of exactly what was missed; every number traces to a
tappable proof chip backed by a deterministic match engine, never to the
AI's word alone. Ask the match in plain language (Samjhao), play a
free-to-play "Call the Next Over" prediction game with friends, and switch
between English, Hinglish, Hindi, Tamil, Telugu, Marathi, Bengali, Kannada,
Gujarati and Punjabi without losing your place.

Non-negotiable: Gemini explains facts, it never creates them. Win
probability, tension and every ball come from pure, unit-tested TypeScript.
A server-side verifier checks every AI claim against that engine output,
retries once with specific feedback, and falls back to a deterministic
template rather than show anything unverified. The app works with no API
key, offline, or rate-limited — every AI feature has a real fallback.

The match is simulated and clearly labelled: fictional teams and players,
a scripted last-ball finish, built to show the architecture, not to imply
real data.

## 3 Core Fan-Centric AI Features (Take-Home Highlights)

1. **Dream11 Fantasy Impact Pulse (`FantasyPulsePanel.tsx`)**:
   - Live fantasy points engine (`lib/fantasy/scoring.ts`) computing official T20 points (runs, boundary bonuses, strike rate, wickets, bowled/LBW bonuses, maidens, economy rates).
   - Dynamic MVP spotlight, leaderboard breakdown, high-upside differential picks, and 1-tap WhatsApp squad share for friends groups.
   - Zero hallucination: points are calculated purely via deterministic engine data, with Gemini synthesizing tactical fantasy strategy.

2. **Settle The Banter: Cricket Arbitrator (`SettleTheBanterPanel.tsx`)**:
   - Solves live match arguments between friends (e.g., turning point overs, captaincy decisions, DRS controversy).
   - Generates Third Umpire rulings citing exact ball numbers, RRR shifts, win probability swings, and MCC law telemetry.
   - Instant debate chips + custom query input with UPHELD / DEBUNKED / INCONCLUSIVE verdicts.

3. **"What-If" Chase Simulator & Roadmap (`WhatIfSimulatorPanel.tsx`)**:
   - Interactive scenario builder allowing fans to project hypothetical runs and wickets over upcoming overs.
   - Computes mathematical Win Probability Delta ($\Delta$) and revised Required Run Rate via `lib/match/simulator.ts`.
   - Gemini synthesizes an AI coach blueprint: attacking plan for the chasing team and defensive counter-tactics for the fielding captain.

