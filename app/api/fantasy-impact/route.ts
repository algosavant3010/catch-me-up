import { z } from "zod";
import { getFantasyImpact } from "@/lib/ai/fantasy-impact-service";
import { checkRateLimit, getClientIp } from "@/lib/security/rate-limit";

export const runtime = "nodejs";

const RequestSchema = z.object({
  mvpName: z.string().min(1).max(50),
  mvpPoints: z.number().int(),
  topPerformers: z.array(
    z.object({
      name: z.string().min(1).max(50),
      totalPoints: z.number().int(),
      breakdown: z.string().min(1).max(200),
    }),
  ),
  matchSituation: z.string().min(1).max(200),
});

export async function POST(req: Request): Promise<Response> {
  const ip = getClientIp(req.headers);
  const rate = await checkRateLimit(`ip:${ip}:fantasy-impact`, 15, 60);
  if (!rate.allowed) return Response.json({ error: "Too many requests." }, { status: 429 });

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const parsed = RequestSchema.safeParse(body);
  if (!parsed.success) return Response.json({ error: "Invalid request payload." }, { status: 400 });

  const result = await getFantasyImpact(parsed.data);
  return Response.json(result);
}
