import { z } from "zod";
import matchData from "@/data/match.json";
import type { Ball, MatchMeta } from "@/lib/match/types";
import { getRecap } from "@/lib/ai/recap-service";
import { checkRateLimit, getClientIp } from "@/lib/security/rate-limit";
import { LOCALES } from "@/lib/i18n";

export const runtime = "nodejs";

const meta = matchData.meta as MatchMeta;
const allBalls = matchData.balls as Ball[];
const MAX_BALL = Math.max(...allBalls.map((b) => b.n));

const RecapRequest = z.object({
  from: z.number().int().min(0).max(MAX_BALL),
  to: z.number().int().min(1).max(MAX_BALL),
  locale: z.enum(LOCALES.map((l) => l.code) as [string, ...string[]]),
  mode: z.enum(["beginner", "pro", "glance"]),
});

function ndjson(obj: unknown): Uint8Array {
  return new TextEncoder().encode(JSON.stringify(obj) + "\n");
}

export async function POST(req: Request): Promise<Response> {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const parsed = RecapRequest.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: "Invalid request.", issues: parsed.error.issues },
      { status: 400 },
    );
  }
  const { from, to, locale, mode } = parsed.data;
  if (to < from) {
    return Response.json({ error: "`to` must be >= `from`." }, { status: 400 });
  }

  const ip = getClientIp(req.headers);
  const rate = await checkRateLimit(`ip:${ip}:recap`, 12, 60);
  if (!rate.allowed) {
    return Response.json(
      { error: "Too many requests. Please wait a moment and try again." },
      { status: 429 },
    );
  }

  const recapResult = await getRecap({
    allBalls,
    meta,
    from,
    to,
    locale: locale as (typeof LOCALES)[number]["code"],
    mode,
  });

  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      controller.enqueue(ndjson({ type: "headline", text: recapResult.recap.headline }));
      controller.enqueue(
        ndjson({
          type: "trust",
          source: recapResult.source,
          verified: recapResult.verifiedRefs,
          total: recapResult.totalRefs,
        }),
      );
      for (const line of recapResult.recap.lines) {
        controller.enqueue(
          ndjson({ type: "line", kind: line.kind, text: line.text, refs: line.refs }),
        );
      }
      controller.enqueue(ndjson({ type: "done" }));
      controller.close();
    },
  });

  return new Response(stream, {
    headers: { "Content-Type": "application/x-ndjson; charset=utf-8", "Cache-Control": "no-store" },
  });
}
