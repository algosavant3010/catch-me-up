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

  // Landing & Marketing
  "landing.heroBadge": string;
  "landing.heroTitle": string;
  "landing.heroSubtitle": string;
  "landing.ctaTry": string;
  "landing.ctaJoinLate": string;
  "landing.simulatedTag": string;
  "landing.featuredMatch": string;
  "landing.liveChase": string;
  "landing.enterChase": string;
  "landing.matchDescription": string;
  "landing.target": string;
  "landing.overs": string;
  "landing.format": string;
  "landing.featureHeader": string;
  "landing.featureSubheader": string;
  "landing.matchCentre": string;

  // Feature Showcase Cards (Gen-Z & High Hype)
  "feat.catchmeup.title": string;
  "feat.catchmeup.tag": string;
  "feat.catchmeup.desc": string;

  "feat.fantasy.title": string;
  "feat.fantasy.tag": string;
  "feat.fantasy.desc": string;

  "feat.whatif.title": string;
  "feat.whatif.tag": string;
  "feat.whatif.desc": string;

  "feat.banter.title": string;
  "feat.banter.tag": string;
  "feat.banter.desc": string;

  "feat.samjhao.title": string;
  "feat.samjhao.tag": string;
  "feat.samjhao.desc": string;

  "feat.game.title": string;
  "feat.game.tag": string;
  "feat.game.desc": string;

  "feat.rooms.title": string;
  "feat.rooms.tag": string;
  "feat.rooms.desc": string;

  "feat.i18n.title": string;
  "feat.i18n.tag": string;
  "feat.i18n.desc": string;

  // Settings & Controls
  "settings.theme": string;
  "settings.alerts": string;
  "settings.notifications": string;
  "settings.vibration": string;
  "settings.analytics": string;
  "settings.language": string;
  "settings.mode": string;

  // Beyond The Score
  "beyond.title": string;
  "beyond.subtitle": string;
  "beyond.tag": string;

  // Spoiler Shield
  "spoiler.noDelay": string;
  "spoiler.tapInstruction": string;
  "spoiler.waiting": string;
  "spoiler.tapNow": string;
}

export type LocaleCode = "en" | "hinglish" | "hi" | "ta" | "te" | "mr" | "bn" | "kn" | "gu" | "pa";
