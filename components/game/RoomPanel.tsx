"use client";

import { useEffect, useState } from "react";
import { Users } from "lucide-react";
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
  const [pending, setPending] = useState(false);

  async function submitRoom(action: () => Promise<void>) {
    if (pending) return;
    setPending(true);
    try {
      await action();
    } catch {
      setError("Could not reach the room. Please try again.");
    } finally {
      setPending(false);
    }
  }

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
    <section className="feature-panel">
      <h3 className="section-heading">
        <Users aria-hidden="true" />
        Friends room
      </h3>
      {!room.code ? (
        <div className="flex flex-col gap-4 text-sm">
          <div>
            <label htmlFor="room-nickname" className="field-label">
              Your nickname
            </label>
            <input
              id="room-nickname"
              autoComplete="nickname"
              value={nicknameInput}
              onChange={(e) => setNicknameInput(e.target.value)}
              placeholder="Your nickname"
              maxLength={20}
              className="rounded-(--radius-md) border border-(--color-border) bg-(--color-bg) px-3 py-2"
            />
          </div>
          <button
            onClick={() => submitRoom(createRoom)}
            disabled={pending}
            className="button-primary"
          >
            Create a room
          </button>
          <div className="border-t border-(--color-border) pt-4">
            <label htmlFor="room-code" className="field-label">
              Room code
            </label>
            <div className="flex gap-2">
              <input
                id="room-code"
                autoComplete="off"
                spellCheck={false}
                value={joinCodeInput}
                onChange={(e) => setJoinCodeInput(e.target.value)}
                placeholder="6-character code"
                maxLength={6}
                className="flex-1 rounded-(--radius-md) border border-(--color-border) bg-(--color-bg) px-3 py-2 uppercase"
              />
              <button
                onClick={() => submitRoom(joinRoom)}
                disabled={pending}
                className="button-secondary shrink-0"
              >
                Join
              </button>
            </div>
          </div>
          {pending && (
            <p role="status" className="text-sm text-(--color-text-muted)">
              Connecting to room...
            </p>
          )}
          {error && (
            <p role="alert" className="text-sm text-(--color-danger)">
              {error}
            </p>
          )}
        </div>
      ) : (
        <div className="text-sm">
          <p className="mb-2">
            Room code: <strong className="font-mono text-lg">{room.code}</strong> (expires in 24h)
          </p>
          <ol className="flex flex-col gap-1">
            {leaderboard.map((m, i) => (
              <li
                key={m.nickname}
                className="flex justify-between gap-4 border-b border-(--color-border) py-3"
              >
                <span>
                  {i + 1}. {m.nickname}
                </span>
                <span className="font-semibold tabular-nums">{m.totalPoints}</span>
              </li>
            ))}
          </ol>
        </div>
      )}
    </section>
  );
}
