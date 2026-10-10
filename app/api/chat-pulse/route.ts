import { z } from "zod";
import { getChatPulse } from "@/lib/ai/chat-pulse-service";
import { checkRateLimit, getClientIp } from "@/lib/security/rate-limit";
import { LOCALES } from "@/lib/i18n";

export const runtime = "nodejs";

const Request = z.object({
  messages: z
    .array(
      z.object({
        username: z.string().max(40),
        text: z.string().max(300),
        toxic: z.boolean().optional(),
      }),
    )
    .max(100),
  locale: z.enum(LOCALES.map((l) => l.code) as [string, ...string[]]),
});

export async function POST(req: globalThis.Request): Promise<Response> {
  const ip = getClientIp(req.headers);
  const rate = await checkRateLimit(`ip:${ip}:chat-pulse`, 12, 60);
  if (!rate.allowed) return Response.json({ error: "Too many requests." }, { status: 429 });

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid JSON body." }, { status: 400 });
  }
  const parsed = Request.safeParse(body);
  if (!parsed.success) return Response.json({ error: "Invalid request." }, { status: 400 });

  const messages = parsed.data.messages.map((m, i) => ({ id: i, ...m }));
  const result = await getChatPulse({
    messages,
    locale: parsed.data.locale as (typeof LOCALES)[number]["code"],
  });
  return Response.json(result);
}
