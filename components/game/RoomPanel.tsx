"use client";

import { useEffect, useState } from "react";
import { createPersistentStore } from "@/lib/utils/persistent-store";
import { track } from "@/lib/analytics/track";
import { gameStore } from "./CallTheNextOverPanel";

interface RoomStore extends Record<string, unknown> {
  nickname: string;
  code: string | null;
}

const roomStore = createPersistentStore<RoomStore>("catch-me-up:room:v1", {
  nickname: "",
  code: null,
});

interface LeaderboardEntry {
  nickname: string;
  totalPoints: number;
  personalBest: number;
}

export function RoomPanel() {
  const [room, setRoom] = useState<RoomStore>(() => roomStore.getSnapshot());
  const [nicknameInput, setNicknameInput] = useState(room.nickname);
  const [joinCodeInput, setJoinCodeInput] = useState("");
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!room.code) return;
    const sync = async () => {
      const game = gameStore.getSnapshot().game;
      const res = await fetch("/api/room", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "score",
          code: room.code,
          nickname: room.nickname,
          totalPoints: game.totalPoints,
        }),
      });
      if (res.ok) setLeaderboard((await res.json()).leaderboard);
    };
    sync();
    const id = setInterval(sync, 10_000);
    return () => clearInterval(id);
  }, [room.code, room.nickname]);

  async function createRoom() {
    setError(null);
    const nickname = nicknameInput.trim() || "Fan";
    const res = await fetch("/api/room", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "create", nickname }),
    });
    const data = await res.json();
    if (!res.ok) return setError(data.error ?? "Could not create room.");
    track("room_created");
    roomStore.set({ nickname, code: data.code });
    setRoom({ nickname, code: data.code });
    setLeaderboard(data.leaderboard);
  }

  async function joinRoom() {
    setError(null);
    const nickname = nicknameInput.trim() || "Fan";
    const code = joinCodeInput.trim().toUpperCase();
    const res = await fetch("/api/room", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "join", code, nickname }),
    });
    const data = await res.json();
    if (!res.ok) return setError(data.error ?? "Could not join room.");
    track("room_joined");
    roomStore.set({ nickname, code });
    setRoom({ nickname, code });
    setLeaderboard(data.leaderboard);
  }

  return (
    <section className="rounded-(--radius-lg) border border-(--color-border) bg-(--color-surface) p-4">
      <h3 className="mb-2 font-semibold">Friends room</h3>
      {!room.code ? (
        <div className="flex flex-col gap-2 text-sm">
          <input
            value={nicknameInput}
            onChange={(e) => setNicknameInput(e.target.value)}
            placeholder="Your nickname"
            maxLength={20}
            className="rounded-(--radius-md) border border-(--color-border) bg-(--color-bg) px-3 py-2"
          />
          <button
            onClick={createRoom}
            className="rounded-(--radius-md) bg-(--color-accent) px-3 py-2 font-medium text-white"
          >
            Create a room
          </button>
          <div className="flex gap-2">
            <input
              value={joinCodeInput}
              onChange={(e) => setJoinCodeInput(e.target.value)}
              placeholder="6-character code"
              maxLength={6}
              className="flex-1 rounded-(--radius-md) border border-(--color-border) bg-(--color-bg) px-3 py-2 uppercase"
            />
            <button
              onClick={joinRoom}
              className="rounded-(--radius-md) border border-(--color-border) px-3 py-2 font-medium"
            >
              Join
            </button>
          </div>
          {error && <p className="text-xs text-(--color-danger)">{error}</p>}
        </div>
      ) : (
        <div className="text-sm">
          <p className="mb-2">
            Room code: <strong className="tracking-widest">{room.code}</strong> (expires in 24h)
          </p>
          <ol className="flex flex-col gap-1">
            {leaderboard.map((m, i) => (
              <li
                key={m.nickname}
                className="flex justify-between rounded-(--radius-sm) bg-(--color-surface-2) px-2 py-1"
              >
                <span>
                  {i + 1}. {m.nickname}
                </span>
                <span className="font-semibold">{m.totalPoints}</span>
              </li>
            ))}
          </ol>
        </div>
      )}
    </section>
  );
}
