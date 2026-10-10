import { z } from "zod";
import matchData from "@/data/match.json";
import type { Ball, MatchMeta } from "@/lib/match/types";
import { askSamjhao } from "@/lib/ai/ask-service";
import { checkRateLimit, getClientIp } from "@/lib/security/rate-limit";
import { LOCALES } from "@/lib/i18n";

export const runtime = "nodejs";

const meta = matchData.meta as MatchMeta;
const allBalls = matchData.balls as Ball[];
const MAX_BALL = Math.max(...allBalls.map((b) => b.n));

const AskRequest = z.object({
  question: z.string().min(1).max(500),
  cutoffBall: z.number().int().min(0).max(MAX_BALL),
  locale: z.enum(LOCALES.map((l) => l.code) as [string, ...string[]]),
  mode: z.enum(["beginner", "pro", "glance"]),
});

export async function POST(req: Request): Promise<Response> {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const parsed = AskRequest.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: "Invalid request.", issues: parsed.error.issues }, { status: 400 });
  }

  const ip = getClientIp(req.headers);
  const rate = await checkRateLimit(`ip:${ip}:ask`, 12, 60);
  if (!rate.allowed) {
    return Response.json({ error: "Too many requests. Please wait a moment and try again." }, { status: 429 });
  }

  const { question, cutoffBall, locale, mode } = parsed.data;
  const result = await askSamjhao({
    question,
    allBalls,
    meta,
    cutoffBall,
    locale: locale as (typeof LOCALES)[number]["code"],
    mode,
  });

  return Response.json(result);
}
