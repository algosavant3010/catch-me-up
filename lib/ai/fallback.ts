import type { Ball, MatchMeta } from "@/lib/match/types";
import { computeMatchState, computeScoreboardStats, detectKeyMoments } from "@/lib/match/engine";
import type { LocaleCode } from "@/lib/i18n";
import type { Recap } from "./schemas";

type Template = (args: {
  teamName: string;
  score: string;
  need: string;
  moments: string[];
}) => Recap;

const TEMPLATES: Partial<Record<LocaleCode, Template>> = {
  en: ({ teamName, score, need, moments }) => ({
    headline: `${teamName}: ${score}`,
    lines: [
      {
        kind: "what_happened",
        text:
          moments.length > 0 ? moments.join(" ") : "A quiet passage of play — no big swings yet.",
        refs: [],
      },
      { kind: "where_it_stands", text: `${teamName} are ${score}. ${need}`, refs: [] },
    ],
  }),
  hinglish: ({ teamName, score, need, moments }) => ({
    headline: `${teamName}: ${score}`,
    lines: [
      {
        kind: "what_happened",
        text:
          moments.length > 0 ? moments.join(" ") : "Thoda shaant over tha — koi badi hulchul nahi.",
        refs: [],
      },
      { kind: "where_it_stands", text: `${teamName} abhi ${score} par hain. ${need}`, refs: [] },
    ],
  }),
  hi: ({ teamName, score, need, moments }) => ({
    headline: `${teamName}: ${score}`,
    lines: [
      {
        kind: "what_happened",
        text:
          moments.length > 0
            ? moments.join(" ")
            : "थोड़ी शांत पारी रही — कोई बड़ा उतार-चढ़ाव नहीं।",
        refs: [],
      },
      { kind: "where_it_stands", text: `${teamName} अभी ${score} पर हैं। ${need}`, refs: [] },
    ],
  }),
};

/**
 * Deterministic, non-AI recap built directly from the match engine. Used
 * whenever Gemini is unavailable, times out, is blocked, or fails
 * verification twice. Always labelled "Instant summary (no AI)" by the UI —
 * never presented as if it came from the model.
 */
export function buildFallbackRecap(
  allBalls: Ball[],
  meta: MatchMeta,
  from: number,
  to: number,
  locale: LocaleCode,
): Recap {
  const upTo = allBalls.filter((b) => b.n <= to);
  const state = computeMatchState(upTo, meta);
  const stats = computeScoreboardStats(state);
  const moments = detectKeyMoments(upTo, meta)
    .filter(
      (m) =>
        m.ballNumber >= from &&
        m.ballNumber <= to &&
        (m.kind === "wicket" || m.kind === "boundary"),
    )
    .slice(-3)
    .map((m) => m.description);

  const score = `${state.runs}/${state.wickets} (${stats.oversDisplay} ov)`;
  const need =
    state.needed > 0
      ? `Need ${state.needed} from ${state.ballsLeft} balls.`
      : `${meta.battingTeam.name} have won.`;

  const template = TEMPLATES[locale] ?? TEMPLATES.en!;
  return template({ teamName: meta.battingTeam.name, score, need, moments });
}
