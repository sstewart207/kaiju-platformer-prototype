import type { MovementInput } from "./types";
import { Controller } from "./gamepad";

export class Input {
  private keys = new Set<string>();
  private jumpQueued = false;
  private dashQueued = false;
  private attackQueued = false;
  private specialQueued = false;
  private controller = new Controller();
  private pad = { x: 0, z: 0, jumpHeld: false };
  source: "keyboard" | "gamepad" = "keyboard";
  onPause = () => {};
  onRestart = () => {};
  onConfirm = () => {};
  onBack = () => {};
  onMenuMove = (_direction: number) => {};
  onDisconnect = () => {};
  onSource = (
    _source: "keyboard" | "gamepad",
    _connected: boolean,
    _unsupported: boolean,
  ) => {};
  private connected = false;
  private unsupported = false;
  private focused = true;
  constructor() {
    window.addEventListener("keydown", (event) => {
      this.setSource("keyboard");
      if (
        ["Space", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(
          event.code,
        )
      )
        event.preventDefault();
      if (!event.repeat) {
        if (event.code === "Space") this.jumpQueued = true;
        if (event.code === "KeyJ") this.attackQueued = true;
        if (event.code === "KeyK") this.specialQueued = true;
        if (event.code === "ShiftLeft" || event.code === "ShiftRight")
          this.dashQueued = true;
        if (event.code === "Escape") this.onPause();
        if (event.code === "KeyR") this.onRestart();
      }
      this.keys.add(event.code);
    });
    window.addEventListener("keyup", (event) => this.keys.delete(event.code));
    window.addEventListener("blur", () => {
      this.focused = false;
      this.clear();
    });
    window.addEventListener("focus", () => {
      this.focused = true;
    });
    document.addEventListener("visibilitychange", () => {
      if (document.hidden) this.clear();
    });
  }
  clear() {
    this.keys.clear();
    this.jumpQueued = false;
    this.dashQueued = false;
    this.attackQueued = false;
    this.specialQueued = false;
    this.pad = { x: 0, z: 0, jumpHeld: false };
    this.controller.clear();
  }
  private setSource(source: "keyboard" | "gamepad") {
    if (this.source !== source) {
      this.source = source;
      this.onSource(source, this.connected, this.unsupported);
    }
  }
  poll() {
    if (!this.focused || document.hidden) return;
    let pads: ReadonlyArray<Gamepad | null> = [];
    try {
      pads = navigator.getGamepads?.() ?? [];
    } catch {
      /* Keyboard remains available when Gamepad access is blocked. */
    }
    const state = this.controller.sample(pads);
    this.pad = state;
    if (
      state.connected !== this.connected ||
      state.unsupported !== this.unsupported
    ) {
      this.connected = state.connected;
      this.unsupported = state.unsupported;
      this.onSource(this.source, this.connected, this.unsupported);
    }
    if (state.disconnected && this.source === "gamepad") {
      this.clear();
      this.onDisconnect();
      return;
    }
    if (state.active) this.setSource("gamepad");
    if (state.jumpPressed) this.jumpQueued = true;
    if (state.dashPressed) this.dashQueued = true;
    if (state.attackPressed) this.attackQueued = true;
    if (state.specialPressed) this.specialQueued = true;
    if (state.nav) this.onMenuMove(state.nav);
    if (state.pause) this.onPause();
    else if (state.back) this.onBack();
    else if (state.restart) this.onRestart();
    else if (state.confirm) this.onConfirm();
  }
  read(): MovementInput {
    const x =
      Number(this.keys.has("KeyD") || this.keys.has("ArrowRight")) -
      Number(this.keys.has("KeyA") || this.keys.has("ArrowLeft"));
    const z =
      Number(this.keys.has("KeyS") || this.keys.has("ArrowDown")) -
      Number(this.keys.has("KeyW") || this.keys.has("ArrowUp"));
    const jumpPressed = this.jumpQueued;
    const dashPressed = this.dashQueued;
    const attackPressed = this.attackQueued,
      specialPressed = this.specialQueued;
    this.attackQueued = false;
    this.specialQueued = false;
    this.jumpQueued = false;
    this.dashQueued = false;
    return {
      x: x || z ? x : this.pad.x,
      z: x || z ? z : this.pad.z,
      jumpPressed,
      dashPressed,
      attackPressed,
      specialPressed,
      jumpHeld: this.keys.has("Space") || this.pad.jumpHeld,
    };
  }
}
