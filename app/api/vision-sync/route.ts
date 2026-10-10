import { z } from "zod";
import matchData from "@/data/match.json";
import type { Ball, MatchMeta } from "@/lib/match/types";
import { syncFromImage } from "@/lib/ai/vision-service";
import { checkRateLimit, getClientIp } from "@/lib/security/rate-limit";

export const runtime = "nodejs";

const meta = matchData.meta as MatchMeta;
const allBalls = matchData.balls as Ball[];

const MAX_BASE64_LENGTH = Math.ceil((4 * 1024 * 1024 * 4) / 3); // ~4MB of raw bytes, base64-encoded

const Request = z.object({
  imageBase64: z.string().min(1).max(MAX_BASE64_LENGTH),
  mimeType: z.enum(["image/jpeg", "image/png", "image/webp"]),
});

export async function POST(req: globalThis.Request): Promise<Response> {
  const ip = getClientIp(req.headers);
  // Tighter limit for vision calls, per the brief.
  const rate = await checkRateLimit(`ip:${ip}:vision`, 4, 60);
  if (!rate.allowed)
    return Response.json({ error: "Too many requests. Please wait a moment." }, { status: 429 });

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid JSON body." }, { status: 400 });
  }
  const parsed = Request.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: "Invalid image. Make sure it's under 4MB." }, { status: 400 });
  }

  // Image bytes are used in memory only for this one request and are never persisted or logged.
  const result = await syncFromImage({
    imageBase64: parsed.data.imageBase64,
    mimeType: parsed.data.mimeType,
    allBalls,
    meta,
  });
  return Response.json(result);
}
