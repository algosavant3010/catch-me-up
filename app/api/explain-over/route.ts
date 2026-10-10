import { z } from "zod";
import matchData from "@/data/match.json";
import type { Ball, MatchMeta } from "@/lib/match/types";
import { explainOver } from "@/lib/ai/explain-over-service";
import { checkRateLimit, getClientIp } from "@/lib/security/rate-limit";
import { LOCALES } from "@/lib/i18n";

export const runtime = "nodejs";

const meta = matchData.meta as MatchMeta;
const allBalls = matchData.balls as Ball[];

const Request = z.object({
  over: z.number().int().min(1).max(meta.oversLimit),
  locale: z.enum(LOCALES.map((l) => l.code) as [string, ...string[]]),
});

export async function POST(req: Request): Promise<Response> {
  const ip = getClientIp(req.headers);
  const rate = await checkRateLimit(`ip:${ip}:explain-over`, 12, 60);
  if (!rate.allowed) return Response.json({ error: "Too many requests." }, { status: 429 });

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid JSON body." }, { status: 400 });
  }
  const parsed = Request.safeParse(body);
  if (!parsed.success) return Response.json({ error: "Invalid request." }, { status: 400 });

  const result = await explainOver({
    allBalls,
    meta,
    over: parsed.data.over,
    locale: parsed.data.locale as (typeof LOCALES)[number]["code"],
  });
  return Response.json(result);
}
