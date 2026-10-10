/**
 * Canonical set of UI chrome strings and their English baseline. Every other
 * locale file must implement exactly this type — TypeScript enforces key
 * completeness at compile time, and tests/unit/i18n.test.ts double-checks it
 * at runtime (so a typo that satisfies `Record<string,string>` structurally
 * can't silently slip through).
 *
 * Only UI chrome lives here. AI-generated content (recaps, answers, chat
 * pulse) is never translated by this dictionary — labels are enums the
 * model returns, and this file supplies the localized text for those enum
 * values, but the model's own prose is generated directly in the target
 * language (see lib/ai/prompts.ts).
 */
export interface UiStrings {
  "app.name": string;
  "app.tagline": string;
  "app.simulatedBanner": string;
  "app.privacyNote": string;

  "onboarding.step1Title": string;
  "onboarding.step2Title": string;
  "onboarding.step3Title": string;
  "onboarding.skip": string;
  "onboarding.next": string;
  "onboarding.done": string;
  "onboarding.joinFromStart": string;
  "onboarding.joinLate": string;

  "mode.beginner": string;
  "mode.beginnerDesc": string;
  "mode.pro": string;
  "mode.proDesc": string;
  "mode.glance": string;
  "mode.glanceDesc": string;

  "nav.catchMeUp": string;
  "nav.away": string;
  "nav.ask": string;
  "nav.back": string;
  "nav.listen": string;
  "nav.share": string;
  "nav.settings": string;

  "scoreboard.overs": string;
  "scoreboard.target": string;
  "scoreboard.need": string;
  "scoreboard.crr": string;
  "scoreboard.rrr": string;
  "scoreboard.batters": string;
  "scoreboard.bowler": string;
  "scoreboard.winProbability": string;

  "tension.calm": string;
  "tension.building": string;
  "tension.tense": string;
  "tension.edgeOfSeat": string;

  "recap.title": string;
  "recap.loading": string;
  "recap.trustBadge": string;
  "recap.whyTrust": string;
  "recap.whyTrustBody": string;
  "recap.fallbackLabel": string;
  "recap.proofDrawerTitle": string;

  "away.recording": string;
  "away.missed": string;
  "away.imBack": string;

  "ask.placeholder": string;
  "ask.suggestedTitle": string;
  "ask.offTopic": string;

  "listen.play": string;
  "listen.pause": string;
  "listen.stop": string;
  "listen.unavailable": string;

  "spoiler.title": string;
  "spoiler.calibrate": string;
  "spoiler.behindBy": string;

  "game.title": string;
  "game.pickOutcome": string;
  "game.wicket": string;
  "game.boundary": string;
  "game.tenPlus": string;
  "game.quietOver": string;
  "game.streak": string;
  "game.personalBest": string;

  "state.empty": string;
  "state.error": string;
  "state.offline": string;
  "state.retry": string;

  "theme.light": string;
  "theme.dark": string;
}

export type LocaleCode = "en" | "hinglish" | "hi" | "ta" | "te" | "mr" | "bn" | "kn" | "gu" | "pa";
