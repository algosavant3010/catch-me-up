"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import type { Ball, MatchMeta } from "./types";
import { SimulatedProvider, type SpeedMultiplier } from "./providers";
import { spoilerStore } from "@/lib/spoiler/delay-store";

interface MatchRuntime {
  meta: MatchMeta;
  /** Every ball received so far, with no spoiler delay applied. */
  balls: Ball[];
  /** `balls` held back by the fan's Spoiler Shield delay — use this for anything the fan looks at. */
  displayBalls: Ball[];
  delaySeconds: number;
  /** Subscribes to raw ball arrivals (with wall-clock emission time) — used by the calibration flow. */
  onBallEmitted: (cb: (ball: Ball, emittedAt: number) => void) => () => void;
  speed: SpeedMultiplier;
  paused: boolean;
  setSpeed: (s: SpeedMultiplier) => void;
  togglePause: () => void;
  restart: () => void;
  /** Jumps straight to a ball number without animating through it — used for join-late and Snap the TV. */
  jumpTo: (ballNumber: number) => void;
  /** Ball number the fan has already caught up on — the next Catch Me Up window starts right after this. */
  lastSeenBall: number;
  /** Marks everything up to the current ball as "seen" (called after a successful Catch Me Up). */
  markSeenUpToNow: () => void;
  /** Non-null while the fan is in Away mode; the ball number they stepped away at. */
  awayFromBall: number | null;
  goAway: () => void;
  /** Ends Away mode and returns the exact window to recap; also marks it seen. */
  comeBack: () => { from: number; to: number };
}

const MatchRuntimeContext = createContext<MatchRuntime | null>(null);

export function MatchRuntimeProvider({
  meta,
  startAtBall = 0,
  children,
}: {
  meta: MatchMeta;
  startAtBall?: number;
  children: React.ReactNode;
}) {
  const [provider] = useState(() => new SimulatedProvider());
  const allBalls = useMemo(() => provider.getAllBalls(), [provider]);
  const [balls, setBalls] = useState<Ball[]>(() =>
    startAtBall > 0 ? allBalls.filter((b) => b.n <= startAtBall) : [],
  );
  const [speed, setSpeedState] = useState<SpeedMultiplier>(1);
  const [paused, setPaused] = useState(false);
  const [lastSeenBall, setLastSeenBall] = useState(startAtBall);
  const [awayFromBall, setAwayFromBall] = useState<number | null>(null);
  const emittedAtRef = useRef(new Map<number, number>());
  const rawListenersRef = useRef(new Set<(ball: Ball, emittedAt: number) => void>());
  const spoiler = useSyncExternalStore(
    spoilerStore.subscribe,
    spoilerStore.getSnapshot,
    spoilerStore.getServerSnapshot,
  );

  useEffect(() => {
    if (startAtBall > 0) {
      // Fast-forward the provider's internal cursor so streaming resumes from here.
      provider.jumpCursorTo(startAtBall);
      for (const b of allBalls.filter((x) => x.n <= startAtBall))
        emittedAtRef.current.set(b.n, Date.now());
    }
    const unsubscribe = provider.stream((ball) => {
      const emittedAt = Date.now();
      emittedAtRef.current.set(ball.n, emittedAt);
      rawListenersRef.current.forEach((cb) => cb(ball, emittedAt));
      setBalls((prev) => (prev.some((b) => b.n === ball.n) ? prev : [...prev, ball]));
    });
    return unsubscribe;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Recomputes the spoiler-delayed view in an effect (never during render,
  // since it depends on the impure Date.now() and a ref) — ticks on a timer
  // so the delayed view catches up even with no new balls arriving.
  const [displayBalls, setDisplayBalls] = useState<Ball[]>(balls);
  useEffect(() => {
    const recompute = () => {
      if (spoiler.delaySeconds <= 0) {
        setDisplayBalls(balls);
        return;
      }
      const cutoff = Date.now() - spoiler.delaySeconds * 1000;
      setDisplayBalls(balls.filter((b) => (emittedAtRef.current.get(b.n) ?? 0) <= cutoff));
    };
    recompute();
    if (spoiler.delaySeconds <= 0) return;
    const id = setInterval(recompute, 500);
    return () => clearInterval(id);
  }, [balls, spoiler.delaySeconds]);

  const onBallEmitted = (cb: (ball: Ball, emittedAt: number) => void) => {
    rawListenersRef.current.add(cb);
    return () => rawListenersRef.current.delete(cb);
  };

  const setSpeed = (s: SpeedMultiplier) => {
    setSpeedState(s);
    provider.setSpeed(s);
  };

  const togglePause = () => {
    setPaused((p) => {
      const next = !p;
      if (next) provider.pause();
      else provider.resume();
      return next;
    });
  };

  const restart = () => {
    provider.restart();
    setBalls([]);
    setPaused(false);
    setLastSeenBall(0);
    setAwayFromBall(null);
  };

  const jumpTo = (ballNumber: number) => {
    provider.jumpCursorTo(ballNumber);
    setBalls(allBalls.filter((b) => b.n <= ballNumber));
  };

  const latestBall = balls.length > 0 ? balls[balls.length - 1].n : startAtBall;

  const markSeenUpToNow = () => setLastSeenBall(latestBall);
  const goAway = () => setAwayFromBall(latestBall);
  const comeBack = () => {
    const from = (awayFromBall ?? lastSeenBall) + 1;
    const to = Math.max(latestBall, from);
    setAwayFromBall(null);
    setLastSeenBall(to);
    return { from, to };
  };

  const value = useMemo<MatchRuntime>(
    () => ({
      meta,
      balls,
      displayBalls,
      delaySeconds: spoiler.delaySeconds,
      onBallEmitted,
      speed,
      paused,
      setSpeed,
      togglePause,
      restart,
      jumpTo,
      lastSeenBall,
      markSeenUpToNow,
      awayFromBall,
      goAway,
      comeBack,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [meta, balls, displayBalls, spoiler.delaySeconds, speed, paused, lastSeenBall, awayFromBall],
  );

  return <MatchRuntimeContext.Provider value={value}>{children}</MatchRuntimeContext.Provider>;
}

export function useMatchRuntime(): MatchRuntime {
  const ctx = useContext(MatchRuntimeContext);
  if (!ctx) throw new Error("useMatchRuntime must be used within a MatchRuntimeProvider");
  return ctx;
}
