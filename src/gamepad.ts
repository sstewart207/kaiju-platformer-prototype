export interface PadSnapshot {
  index: number;
  id: string;
  mapping: string;
  connected: boolean;
  axes: readonly number[];
  buttons: ReadonlyArray<{ pressed: boolean; value: number }>;
}
export const STICK_DEADZONE = 0.3;
export function stickWithDeadzone(
  x: number,
  z: number,
  deadzone = STICK_DEADZONE,
) {
  if (!Number.isFinite(x) || !Number.isFinite(z)) return { x: 0, z: 0 };
  // Ignore small cross-axis noise, then help cardinal movement stay straight.
  if (Math.abs(x) < 0.18) x = 0;
  if (Math.abs(z) < 0.18) z = 0;
  if (Math.abs(z) < Math.abs(x) * 0.18) z = 0;
  else if (Math.abs(x) < Math.abs(z) * 0.18) x = 0;
  const length = Math.hypot(x, z);
  if (length <= deadzone) return { x: 0, z: 0 };
  const scale = Math.min(1, (length - deadzone) / (1 - deadzone)) / length;
  return { x: x * scale, z: z * scale };
}
export class Controller {
  private index: number | null = null;
  private previous: boolean[] = [];
  private previousNav = 0;
  private previousX = 0;
  private previousZ = 0;
  private blocked = false;
  clear() {
    this.blocked = true;
  }
  sample(pads: ReadonlyArray<PadSnapshot | null>) {
    const pad =
      pads.find(
        (p) =>
          p?.connected && p.index === this.index && p.mapping === "standard",
      ) ?? pads.find((p) => p?.connected && p.mapping === "standard");
    const disconnected =
      this.index !== null &&
      !pads.some(
        (p) =>
          p?.connected && p.index === this.index && p.mapping === "standard",
      );
    const unsupported = !pad && pads.some((p) => p?.connected);
    const empty = {
      x: 0,
      z: 0,
      jumpPressed: false,
      dashPressed: false,
      jumpHeld: false,
      confirm: false,
      back: false,
      pause: false,
      restart: false,
      nav: 0,
      active: false,
      connected: false,
      disconnected,
      unsupported,
    };
    if (!pad) {
      this.index = null;
      this.previous = [];
      this.previousNav = 0;
      this.previousX = 0;
      this.previousZ = 0;
      return empty;
    }
    if (pad.index !== this.index) {
      this.previous = [];
      this.previousNav = 0;
      this.index = pad.index;
    }
    const buttons = pad.buttons.map(
      (button) => button.pressed || button.value > 0.5,
    );
    const stick = stickWithDeadzone(pad.axes[0] ?? 0, pad.axes[1] ?? 0);
    const dpadX = Number(!!buttons[15]) - Number(!!buttons[14]);
    const dpadZ = Number(!!buttons[13]) - Number(!!buttons[12]);
    let x = dpadX || dpadZ ? dpadX : stick.x,
      z = dpadX || dpadZ ? dpadZ : stick.z;
    const length = Math.max(1, Math.hypot(x, z));
    x /= length;
    z /= length;
    const nav = z > 0.55 ? 1 : z < -0.55 ? -1 : 0;
    const edge = (button: number) =>
      !!buttons[button] && !this.previous[button];
    const neutral = !buttons.some(Boolean) && x === 0 && z === 0;
    const suppress = this.blocked;
    if (neutral) this.blocked = false;
    const result = {
      x,
      z,
      jumpPressed: edge(0),
      dashPressed: edge(2) || edge(5),
      jumpHeld: !!buttons[0],
      confirm: edge(0),
      back: edge(1),
      pause: edge(9),
      restart: edge(3),
      nav: nav !== this.previousNav ? nav : 0,
      active:
        buttons.some((pressed, i) => pressed && !this.previous[i]) ||
        Math.abs(x - this.previousX) > 0.08 ||
        Math.abs(z - this.previousZ) > 0.08,
      connected: true,
      disconnected,
      unsupported: false,
    };
    this.previous = buttons;
    this.previousNav = nav;
    this.previousX = x;
    this.previousZ = z;
    return suppress ? { ...empty, connected: true } : result;
  }
}
