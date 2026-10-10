import { z } from "zod";
import { createRoom, getRoom, joinRoom, leaderboard, submitScore } from "@/lib/game/rooms";
import { sanitizeUserText } from "@/lib/security/sanitize";
import { checkRateLimit, getClientIp } from "@/lib/security/rate-limit";

export const runtime = "nodejs";

const NICKNAME = z.string().min(1).max(20);
const CODE = z.string().length(6);

const RoomRequest = z.discriminatedUnion("action", [
  z.object({ action: z.literal("create"), nickname: NICKNAME }),
  z.object({ action: z.literal("join"), code: CODE, nickname: NICKNAME }),
  z.object({
    action: z.literal("score"),
    code: CODE,
    nickname: NICKNAME,
    totalPoints: z.number().int().min(0).max(100_000),
  }),
]);

export async function POST(req: Request): Promise<Response> {
  const ip = getClientIp(req.headers);
  const rate = await checkRateLimit(`ip:${ip}:room`, 30, 60);
  if (!rate.allowed) {
    return Response.json({ error: "Too many requests." }, { status: 429 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const parsed = RoomRequest.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: "Invalid request.", issues: parsed.error.issues },
      { status: 400 },
    );
  }

  const data = parsed.data;
  const nickname = sanitizeUserText(data.nickname, 20);

  if (data.action === "create") {
    const room = await createRoom(nickname);
    return Response.json({ code: room.code, leaderboard: leaderboard(room) });
  }

  if (data.action === "join") {
    const room = await joinRoom(data.code, nickname);
    if (!room) return Response.json({ error: "Room not found or expired." }, { status: 404 });
    return Response.json({ code: room.code, leaderboard: leaderboard(room) });
  }

  const room = await submitScore(data.code, nickname, data.totalPoints);
  if (!room) return Response.json({ error: "Room or player not found." }, { status: 404 });
  return Response.json({ code: room.code, leaderboard: leaderboard(room) });
}

export async function GET(req: Request): Promise<Response> {
  const code = new URL(req.url).searchParams.get("code");
  if (!code || !CODE.safeParse(code).success) {
    return Response.json({ error: "Missing or invalid room code." }, { status: 400 });
  }
  const room = await getRoom(code);
  if (!room) return Response.json({ error: "Room not found or expired." }, { status: 404 });
  return Response.json({ code: room.code, leaderboard: leaderboard(room) });
}
