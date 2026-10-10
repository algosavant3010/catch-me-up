import { getKeyValueStore } from "@/lib/store/kv";

const ROOM_TTL_SECONDS = 24 * 60 * 60;
const CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no 0/O/1/I to avoid confusion

export interface RoomMember {
  nickname: string;
  totalPoints: number;
  personalBest: number;
}

export interface Room {
  code: string;
  createdAt: number;
  members: Record<string, RoomMember>;
}

function generateCode(): string {
  let code = "";
  for (let i = 0; i < 6; i += 1) code += CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)];
  return code;
}

function roomKey(code: string): string {
  return `room:${code.toUpperCase()}`;
}

async function readRoom(code: string): Promise<Room | null> {
  const store = getKeyValueStore();
  const raw = await store.get(roomKey(code));
  return raw ? (JSON.parse(raw) as Room) : null;
}

async function writeRoom(room: Room): Promise<void> {
  const store = getKeyValueStore();
  await store.set(roomKey(room.code), JSON.stringify(room), ROOM_TTL_SECONDS);
}

export async function createRoom(nickname: string): Promise<Room> {
  const store = getKeyValueStore();
  let code = generateCode();
  // Vanishingly unlikely to collide, but check once anyway.
  for (let attempt = 0; attempt < 5 && (await store.get(roomKey(code))); attempt += 1) {
    code = generateCode();
  }
  const room: Room = {
    code,
    createdAt: Date.now(),
    members: { [nickname]: { nickname, totalPoints: 0, personalBest: 0 } },
  };
  await writeRoom(room);
  return room;
}

export async function joinRoom(code: string, nickname: string): Promise<Room | null> {
  const room = await readRoom(code);
  if (!room) return null;
  if (!room.members[nickname]) {
    room.members[nickname] = { nickname, totalPoints: 0, personalBest: 0 };
    await writeRoom(room);
  }
  return room;
}

export async function submitScore(
  code: string,
  nickname: string,
  totalPoints: number,
): Promise<Room | null> {
  const room = await readRoom(code);
  if (!room || !room.members[nickname]) return null;
  room.members[nickname].totalPoints = totalPoints;
  room.members[nickname].personalBest = Math.max(room.members[nickname].personalBest, totalPoints);
  await writeRoom(room);
  return room;
}

export async function getRoom(code: string): Promise<Room | null> {
  return readRoom(code);
}

export function leaderboard(room: Room): RoomMember[] {
  return Object.values(room.members).sort((a, b) => b.totalPoints - a.totalPoints);
}
