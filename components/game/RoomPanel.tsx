"use client";

import { useEffect, useState } from "react";
import { LoaderCircle, Trophy, Users } from "lucide-react";
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
              className="w-full rounded-xl border border-(--color-border) bg-(--color-surface-2) px-3.5 py-2.5 text-sm transition focus:border-(--color-accent) focus:outline-none"
            />
          </div>
          <button
            onClick={() => submitRoom(createRoom)}
            disabled={pending}
            className="button-primary w-full"
          >
            {pending ? (
              <>
                <LoaderCircle className="animate-spin" size={16} aria-hidden="true" />
                <span>Creating...</span>
              </>
            ) : (
              "Create a room"
            )}
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
                className="flex-1 rounded-xl border border-(--color-border) bg-(--color-surface-2) px-3.5 py-2.5 font-mono text-sm tracking-widest uppercase transition focus:border-(--color-accent) focus:outline-none"
              />
              <button
                onClick={() => submitRoom(joinRoom)}
                disabled={pending}
                className="button-secondary shrink-0 px-5"
              >
                Join
              </button>
            </div>
          </div>
          {pending && (
            <p role="status" className="flex items-center gap-2 text-xs text-(--color-text-muted)">
              <LoaderCircle size={14} className="animate-spin text-(--color-accent)" />
              Connecting to room...
            </p>
          )}
          {error && (
            <p role="alert" className="text-xs font-semibold text-(--color-danger)">
              {error}
            </p>
          )}
        </div>
      ) : (
        <div className="text-sm">
          <div className="mb-4 flex items-center justify-between rounded-xl border border-(--color-border) bg-(--color-surface-2) p-3">
            <div>
              <p className="text-[10px] font-bold tracking-wider text-(--color-text-muted) uppercase">
                Room Code
              </p>
              <p className="font-mono text-xl font-bold tracking-widest text-(--color-accent)">
                {room.code}
              </p>
            </div>
            <span className="text-[10px] font-medium text-(--color-text-muted)">
              Expires in 24h
            </span>
          </div>

          <div className="mb-2 flex items-center gap-1.5 text-xs font-bold text-(--color-text-muted)">
            <Trophy size={14} className="text-(--color-accent)" />
            <span>Leaderboard</span>
          </div>
          <ol className="flex flex-col divide-y divide-(--color-border) rounded-xl border border-(--color-border) bg-(--color-surface-2)/30 px-3">
            {leaderboard.map((m, i) => (
              <li
                key={m.nickname}
                className="flex items-center justify-between gap-4 py-2.5 text-sm"
              >
                <span className="font-medium">
                  {i + 1}. {m.nickname}
                </span>
                <span className="font-semibold text-(--color-text) tabular-nums">
                  {m.totalPoints}
                </span>
              </li>
            ))}
          </ol>
        </div>
      )}
    </section>
  );
}
