import type { PlayerAttacks } from "./player-attacks";
import { ATTACK } from "./player-attacks";

/** Layered air/impact sounds generated locally, with a shared volume limiter. */
export class ImpactAudio {
  private context: AudioContext | null = null;
  private output: DynamicsCompressorNode | null = null;
  private noise: AudioBuffer | null = null;
  private lastImpact = 0;
  private swings = 0;
  private shots = 0;
  private beams = 0;
  private fires = 0;
  private breath: {
    source: AudioBufferSourceNode;
    tone: OscillatorNode;
    gain: GainNode;
    filter: BiquadFilterNode;
  } | null = null;
  constructor() {
    const unlock = () => {
      if (!this.context) {
        const context = (this.context = new AudioContext());
        this.output = context.createDynamicsCompressor();
        this.output.threshold.value = -12;
        this.output.ratio.value = 5;
        this.output.connect(context.destination);
        this.noise = context.createBuffer(
          1,
          Math.ceil(context.sampleRate * 0.25),
          context.sampleRate,
        );
        const data = this.noise.getChannelData(0);
        for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
      }
      if (this.context.state === "suspended")
        void this.context.resume().catch(() => {});
    };
    window.addEventListener("pointerdown", unlock);
    window.addEventListener("keydown", unlock);
  }
  update(attacks: PlayerAttacks, playing = true) {
    this.breathSound(playing && attacks.beamActive, attacks.solarFireAge);
    if (!playing) return;
    if (attacks.swings > this.swings) this.air(1400, 500, 0.11, 0.07);
    if (attacks.projectiles.shots > this.shots) this.air(2200, 850, 0.14, 0.09);
    if (attacks.beams > this.beams)
      this.air(220, 1100, ATTACK.solarCharge, 0.045);
    if (attacks.solarFires > this.fires) this.air(1600, 280, 0.16, 0.13);
    this.swings = attacks.swings;
    this.shots = attacks.projectiles.shots;
    this.beams = attacks.beams;
    this.fires = attacks.solarFires;
    for (const impact of attacks.impacts) {
      if (impact.id <= this.lastImpact) continue;
      this.lastImpact = impact.id;
      const context = this.context;
      if (
        !context ||
        context.state !== "running" ||
        !this.output ||
        impact.age > 0.08
      )
        continue;
      this.air(2400, 500, 0.075, 0.12);
      const oscillator = context.createOscillator(),
        gain = context.createGain();
      const time = context.currentTime;
      oscillator.type = "triangle";
      oscillator.frequency.setValueAtTime(
        impact.kind === "swipe" ? 135 : 185,
        time,
      );
      oscillator.frequency.exponentialRampToValueAtTime(42, time + 0.1);
      gain.gain.setValueAtTime(0.0001, time);
      gain.gain.exponentialRampToValueAtTime(0.14, time + 0.003);
      gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.14);
      oscillator.connect(gain).connect(this.output);
      oscillator.start(time);
      oscillator.stop(time + 0.15);
      oscillator.onended = () => {
        oscillator.disconnect();
        gain.disconnect();
      };
    }
  }
  private breathSound(active: boolean, age: number) {
    const context = this.context;
    if (
      !active ||
      !context ||
      context.state !== "running" ||
      !this.output ||
      !this.noise
    ) {
      if (this.breath && context) {
        const nodes = this.breath;
        this.breath = null;
        const now = context.currentTime;
        nodes.gain.gain.cancelScheduledValues(now);
        nodes.gain.gain.setTargetAtTime(0, now, 0.015);
        nodes.source.stop(now + 0.08);
        nodes.tone.stop(now + 0.08);
        nodes.source.onended = () => {
          nodes.source.disconnect();
          nodes.tone.disconnect();
          nodes.filter.disconnect();
          nodes.gain.disconnect();
        };
      }
      return;
    }
    if (!this.breath) {
      const source = context.createBufferSource(),
        tone = context.createOscillator(),
        gain = context.createGain(),
        filter = context.createBiquadFilter();
      source.buffer = this.noise;
      source.loop = true;
      filter.type = "lowpass";
      filter.frequency.value = 650;
      tone.type = "sine";
      tone.frequency.value = 62;
      gain.gain.value = 0;
      source.connect(filter).connect(gain);
      tone.connect(gain);
      gain.connect(this.output);
      source.start();
      tone.start();
      this.breath = { source, tone, gain, filter };
    }
    const now = context.currentTime;
    this.breath.gain.gain.setTargetAtTime(
      0.05 * (0.94 + Math.sin(age * 28) * 0.06),
      now,
      0.025,
    );
  }
  private air(from: number, to: number, duration: number, volume: number) {
    const context = this.context;
    if (!context || context.state !== "running" || !this.noise || !this.output)
      return;
    const source = context.createBufferSource(),
      filter = context.createBiquadFilter(),
      gain = context.createGain();
    const time = context.currentTime;
    source.buffer = this.noise;
    filter.type = "bandpass";
    filter.Q.value = 0.6;
    filter.frequency.setValueAtTime(from, time);
    filter.frequency.exponentialRampToValueAtTime(to, time + duration);
    gain.gain.setValueAtTime(0.0001, time);
    gain.gain.exponentialRampToValueAtTime(volume, time + 0.004);
    gain.gain.exponentialRampToValueAtTime(0.0001, time + duration);
    source.connect(filter).connect(gain).connect(this.output);
    source.start(time);
    source.stop(time + duration + 0.01);
    source.onended = () => {
      source.disconnect();
      filter.disconnect();
      gain.disconnect();
    };
  }
}
