import type { Ball } from "@/lib/match/types";

export interface ChatMessage {
  id: number;
  username: string;
  text: string;
  toxic?: boolean;
}

const USERNAMES = [
  "cricket_fan_99",
  "MumbaiMeriJaan",
  "ChennaiExpress",
  "RohanFan21",
  "SixerLover",
  "DesiCricketGuy",
  "Priya_K",
  "StumpedAgain",
  "BoundaryBaba",
  "TensionHigh",
  "ArmchairCaptain",
  "NightOwlFan",
  "PavilionView",
  "GullyCricketer",
  "RainCheck",
];

const WICKET_TEMPLATES = [
  "OUT!!! kya ball thi 😮",
  "Nooo not now, we needed him",
  "Clean bowled, didn't see that coming",
  "That's a big wicket right there",
  "Pavilion walk of shame lol",
];

const BOUNDARY_TEMPLATES = [
  "WHAT A SHOT 🔥🔥",
  "That's gone all the way!",
  "Ball dikhi bhi nahi, seedha boundary",
  "Captain cool strikes again",
  "Commentary box going crazy rn",
];

const QUIET_TEMPLATES = [
  "someone wake me up when something happens",
  "dot dot dot... pressure building",
  "anyone else's stream lagging?",
  "where's the biryani, this over is boring",
  "required rate ticking up slowly",
];

const OFF_TOPIC_TEMPLATES = [
  "brb making chai",
  "does anyone know where to watch the football highlights",
  "my wifi is so bad rn",
  "who else is watching this from office lol",
  "this traffic is worse than the required run rate",
];

// A couple of deliberately "noisy"/borderline messages so Chat Pulse has
// something to pre-filter — not genuinely hateful, just rude, to avoid
// shipping real toxic/abusive text in a demo repo.
const NOISY_TEMPLATES = [
  "ref is blind lol",
  "commentator talks too much, shut up already",
  "worst captaincy I've ever seen",
];

function pick(pool: string[], seed: number): string {
  return pool[seed % pool.length];
}

/** Deterministically derives 0-2 simulated chat messages from one ball event. No randomness. */
export function generateChatForBall(ball: Ball): ChatMessage[] {
  const messages: ChatMessage[] = [];
  const baseId = ball.n * 10;

  if (ball.wicket) {
    messages.push({
      id: baseId,
      username: pick(USERNAMES, ball.n),
      text: pick(WICKET_TEMPLATES, ball.n),
    });
  } else if (ball.runs === 4 || ball.runs === 6) {
    messages.push({
      id: baseId,
      username: pick(USERNAMES, ball.n + 3),
      text: pick(BOUNDARY_TEMPLATES, ball.n),
    });
  } else if (ball.runs === 0 && ball.n % 7 === 0) {
    messages.push({
      id: baseId,
      username: pick(USERNAMES, ball.n + 1),
      text: pick(QUIET_TEMPLATES, ball.n),
    });
  }

  if (ball.n % 11 === 0) {
    messages.push({
      id: baseId + 1,
      username: pick(USERNAMES, ball.n + 5),
      text: pick(OFF_TOPIC_TEMPLATES, ball.n),
    });
  }
  if (ball.n % 17 === 0) {
    messages.push({
      id: baseId + 2,
      username: pick(USERNAMES, ball.n + 7),
      text: pick(NOISY_TEMPLATES, ball.n),
      toxic: true,
    });
  }

  return messages;
}
