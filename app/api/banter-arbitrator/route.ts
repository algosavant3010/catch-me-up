import { z } from "zod";
import { arbitrateBanter } from "@/lib/ai/banter-arbitrator-service";
import { checkRateLimit, getClientIp } from "@/lib/security/rate-limit";

export const runtime = "nodejs";

const RequestSchema = z.object({
  debateTopic: z.string().min(3).max(300),
  matchStateSummary: z.string().min(5).max(300),
  recentEvents: z.string().min(5).max(500),
});

export async function POST(req: Request): Promise<Response> {
  const ip = getClientIp(req.headers);
  const rate = await checkRateLimit(`ip:${ip}:banter-arbitrator`, 15, 60);
  if (!rate.allowed) return Response.json({ error: "Too many requests." }, { status: 429 });

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const parsed = RequestSchema.safeParse(body);
  if (!parsed.success) return Response.json({ error: "Invalid request payload." }, { status: 400 });

  const result = await arbitrateBanter(parsed.data);
  return Response.json(result);
}
