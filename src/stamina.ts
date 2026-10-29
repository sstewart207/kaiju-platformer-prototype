import { FIXED_DT } from "./physics";

export const STAMINA = {
  capacity: 100,
  swipe: 12,
  fireball: 18,
  solar: 10,
  rayPerSecond: 25,
  regeneration: 25,
  delay: 0.6,
};
export class Stamina {
  value = STAMINA.capacity;
  private delay = 0;
  reset() {
    this.value = STAMINA.capacity;
    this.delay = 0;
  }
  tick() {
    if (this.delay > 0) this.delay = Math.max(0, this.delay - FIXED_DT);
    else
      this.value = Math.min(
        STAMINA.capacity,
        this.value + STAMINA.regeneration * FIXED_DT,
      );
  }
  spend(amount: number) {
    if (this.value + 1e-8 < amount) return false;
    this.value = Math.max(0, this.value - amount);
    this.delay = STAMINA.delay;
    return true;
  }
  drainRay() {
    const amount = STAMINA.rayPerSecond * FIXED_DT;
    if (this.spend(amount)) return true;
    this.value = 0;
    this.delay = STAMINA.delay;
    return false;
  }
}
