import type { Ball, MatchMeta, MatchProvider } from "./types";

const BASE_MS_PER_BALL = 2500;

export type SpeedMultiplier = 1 | 3 | 8;

/**
 * Shared ball-by-ball replay engine used by both `SimulatedProvider` (our
 * bundled fictional match) and `ReplayProvider` (any externally-sourced
 * ball log in our `Ball[]` shape). Ticks through balls on a timer, honouring
 * a live-adjustable speed multiplier and pause/restart controls.
 */
export class ReplayEngine implements MatchProvider {
  private readonly meta: MatchMeta;
  private readonly balls: Ball[];
  private speed: SpeedMultiplier = 1;
  private paused = false;
  private cursor = 0;
  private timer: ReturnType<typeof setTimeout> | null = null;
  private activeListener: ((b: Ball) => void) | null = null;

  constructor(meta: MatchMeta, balls: Ball[]) {
    this.meta = meta;
    this.balls = balls;
  }

  async getMeta(): Promise<MatchMeta> {
    return this.meta;
  }

  getBalls(from: number, to: number): Ball[] {
    return this.balls.filter((b) => b.n >= from && b.n < to);
  }

  /** All balls known to this provider (used by server-side routes that don't need streaming). */
  getAllBalls(): Ball[] {
    return this.balls;
  }

  setSpeed(speed: SpeedMultiplier): void {
    this.speed = speed;
  }

  pause(): void {
    this.paused = true;
  }

  resume(): void {
    this.paused = false;
  }

  restart(): void {
    this.cursor = 0;
    this.paused = false;
  }

  /** Moves the streaming cursor to just after the given ball number, without emitting those balls. */
  jumpCursorTo(ballNumber: number): void {
    this.cursor = this.balls.findIndex((b) => b.n > ballNumber);
    if (this.cursor === -1) this.cursor = this.balls.length;
  }

  stream(onBall: (b: Ball) => void): () => void {
    this.activeListener = onBall;
    const tick = () => {
      if (this.activeListener !== onBall) return; // superseded by a newer subscriber
      if (this.paused) {
        this.timer = setTimeout(tick, 150);
        return;
      }
      if (this.cursor >= this.balls.length) return;
      const ball = this.balls[this.cursor];
      this.cursor += 1;
      onBall(ball);
      this.timer = setTimeout(tick, BASE_MS_PER_BALL / this.speed);
    };
    this.timer = setTimeout(tick, BASE_MS_PER_BALL / this.speed);

    return () => {
      if (this.activeListener === onBall) this.activeListener = null;
      if (this.timer) clearTimeout(this.timer);
    };
  }
}
