import { z } from "zod";
import { getWhatIfRoadmap } from "@/lib/ai/what-if-roadmap-service";
import { checkRateLimit, getClientIp } from "@/lib/security/rate-limit";

export const runtime = "nodejs";

const RequestSchema = z.object({
  scenarioSummary: z.string().min(5).max(400),
  teamName: z.string().min(2).max(50),
});

export async function POST(req: Request): Promise<Response> {
  const ip = getClientIp(req.headers);
  const rate = await checkRateLimit(`ip:${ip}:what-if-roadmap`, 15, 60);
  if (!rate.allowed) return Response.json({ error: "Too many requests." }, { status: 429 });

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const parsed = RequestSchema.safeParse(body);
  if (!parsed.success) return Response.json({ error: "Invalid request payload." }, { status: 400 });

  const result = await getWhatIfRoadmap(parsed.data);
  return Response.json(result);
}
