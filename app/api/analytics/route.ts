import { z } from "zod";
import { ANALYTICS_EVENTS } from "@/lib/analytics/events";
import { getKeyValueStore } from "@/lib/store/kv";

export const runtime = "nodejs";

const Body = z.object({ event: z.enum(ANALYTICS_EVENTS) });

export async function POST(req: Request): Promise<Response> {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return new Response(null, { status: 204 });
  }
  const parsed = Body.safeParse(body);
  if (!parsed.success) return new Response(null, { status: 204 });

  // Anonymous event-count only: no request metadata, no IP, no user text is ever stored here.
  const store = getKeyValueStore();
  const key = `analytics:count:${parsed.data.event}`;
  await store.incrWithTtl(key, 30 * 24 * 60 * 60);
  return new Response(null, { status: 204 });
}
