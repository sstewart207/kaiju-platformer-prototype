import { FIXED_DT } from "./physics";

export class FixedClock {
  private accumulator = 0;
  get alpha() {
    return this.accumulator / FIXED_DT;
  }
  reset() {
    this.accumulator = 0;
  }
  advance(seconds: number, tick: () => void) {
    this.accumulator += Math.min(0.1, Math.max(0, seconds));
    while (this.accumulator + 1e-10 >= FIXED_DT) {
      tick();
      this.accumulator = Math.max(0, this.accumulator - FIXED_DT);
    }
  }
}
