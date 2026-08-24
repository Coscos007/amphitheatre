export type Clock = {
  now: () => number;
};

export const systemClock: Clock = {
  now: () => Date.now(),
};

export class FakeClock implements Clock {
  ts: number;

  constructor(ts = 0) {
    this.ts = ts;
  }

  now = (): number => this.ts;

  advance(ms: number): void {
    this.ts += ms;
  }

  set(ts: number): void {
    this.ts = ts;
  }
}
