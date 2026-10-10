import { isAiConfigured } from "@/lib/ai/config";

export const runtime = "nodejs";

export async function GET(): Promise<Response> {
  return Response.json({
    ok: true,
    aiConfigured: isAiConfigured(),
    redisConfigured: !!(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN),
    time: new Date().toISOString(),
  });
}
