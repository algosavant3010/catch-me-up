import { beforeEach, describe, expect, it } from "vitest";
import { _resetKeyValueStoreForTests } from "@/lib/store/kv";
import { createRoom, getRoom, joinRoom, leaderboard, submitScore } from "@/lib/game/rooms";

beforeEach(() => _resetKeyValueStoreForTests());

describe("rooms", () => {
  it("creates a room with a 6-character code and the creator as the first member", async () => {
    const room = await createRoom("Alice");
    expect(room.code).toHaveLength(6);
    expect(room.members.Alice).toMatchObject({ nickname: "Alice", totalPoints: 0 });
  });

  it("allows a second player to join an existing room", async () => {
    const room = await createRoom("Alice");
    const joined = await joinRoom(room.code, "Bob");
    expect(joined?.members.Bob).toBeTruthy();
  });

  it("returns null when joining a room that doesn't exist", async () => {
    const result = await joinRoom("ZZZZZZ", "Bob");
    expect(result).toBeNull();
  });

  it("updates a member's score and tracks personal best", async () => {
    const room = await createRoom("Alice");
    await submitScore(room.code, "Alice", 50);
    const after = await submitScore(room.code, "Alice", 30);
    expect(after?.members.Alice.totalPoints).toBe(30);
    expect(after?.members.Alice.personalBest).toBe(50);
  });

  it("sorts the leaderboard by total points descending", async () => {
    const room = await createRoom("Alice");
    await joinRoom(room.code, "Bob");
    await submitScore(room.code, "Alice", 20);
    await submitScore(room.code, "Bob", 50);
    const final = await getRoom(room.code);
    const board = leaderboard(final!);
    expect(board[0].nickname).toBe("Bob");
    expect(board[1].nickname).toBe("Alice");
  });
});
