import type { AttackImpact } from "./player-attacks";

/** Short synthesized contact sounds; no external audio download or network request. */
export class ImpactAudio {
  private context: AudioContext | null = null;
  private lastImpact = 0;
  constructor() {
    const unlock = () => {
      this.context ??= new AudioContext();
      if (this.context.state === "suspended")
        void this.context.resume().catch(() => {});
    };
    window.addEventListener("pointerdown", unlock);
    window.addEventListener("keydown", unlock);
  }
  update(impacts: readonly AttackImpact[]) {
    for (const impact of impacts) {
      if (impact.id <= this.lastImpact) continue;
      this.lastImpact = impact.id;
      const context = this.context;
      if (!context || context.state !== "running" || impact.age > 0.08)
        continue;
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      const time = context.currentTime;
      oscillator.type = "triangle";
      oscillator.frequency.setValueAtTime(
        impact.kind === "swipe" ? 170 : 260,
        time,
      );
      oscillator.frequency.exponentialRampToValueAtTime(48, time + 0.09);
      gain.gain.setValueAtTime(0.0001, time);
      gain.gain.exponentialRampToValueAtTime(0.22, time + 0.004);
      gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.12);
      oscillator.connect(gain).connect(context.destination);
      oscillator.start(time);
      oscillator.stop(time + 0.13);
      oscillator.onended = () => {
        oscillator.disconnect();
        gain.disconnect();
      };
    }
  }
}
