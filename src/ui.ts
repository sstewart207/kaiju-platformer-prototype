import { SECTIONS } from "./course";
export type Screen = "title" | "playing" | "paused" | "finished";
function element<T extends HTMLElement = HTMLElement>(id: string) {
  return document.getElementById(id) as T;
}
export class UI {
  screen: Screen = "title";
  onStart = () => {};
  onResume = () => {};
  onRestart = () => {};
  onPause = () => {};
  private source: "keyboard" | "gamepad" = "keyboard";
  private connected = false;
  private unsupported = false;
  private selection = 0;
  private readyToStart = false;
  constructor() {
    element("primary-button").onclick = () =>
      this.screen === "paused"
        ? this.onResume()
        : this.screen === "finished"
          ? this.onRestart()
          : this.onStart();
    element("secondary-button").onclick = () => this.onRestart();
    element("pause-button").onclick = () => this.onPause();
    element("primary-button").onfocus = () => {
      this.selection = 0;
    };
    element("secondary-button").onfocus = () => {
      this.selection = 1;
    };
    this.setInput("keyboard", false, false);
  }
  ready() {
    this.readyToStart = true;
    const button = element<HTMLButtonElement>("primary-button");
    button.disabled = false;
    button.textContent = "START";
  }
  confirm() {
    if (this.screen === "playing" || !this.readyToStart) return;
    element<HTMLButtonElement>(
      this.screen === "paused" && this.selection === 1
        ? "secondary-button"
        : "primary-button",
    ).click();
  }
  moveSelection(direction: number) {
    if (this.screen !== "paused" || !this.readyToStart) return;
    this.selection = direction > 0 ? 1 : 0;
    element(this.selection ? "secondary-button" : "primary-button").focus();
  }
  setInput(
    source: "keyboard" | "gamepad",
    connected: boolean,
    unsupported: boolean,
  ) {
    this.source = source;
    this.connected = connected;
    this.unsupported = unsupported;
    const controller = source === "gamepad" && connected;
    element("controls").innerHTML = controller
      ? "<span><kbd>LEFT STICK / D-PAD</kbd> MOVE</span><span><kbd>✕</kbd> JUMP</span><span><kbd>□ / R1</kbd> DASH</span>"
      : "<span><kbd>W A S D</kbd> / <kbd>↑ ← ↓ →</kbd> MOVE</span><span><kbd>SPACE</kbd> JUMP</span><span><kbd>SHIFT</kbd> DASH</span>";
    this.updateFooter();
  }
  private updateFooter() {
    const controller = this.source === "gamepad" && this.connected;
    element("menu-footer").textContent = this.unsupported
      ? "Controller mapping unavailable. Use the keyboard or try Chrome / Edge."
      : this.source === "gamepad" && !this.connected
        ? "Controller disconnected. Reconnect or use the keyboard."
        : controller
          ? "✕ Select · ○ Back · Options Pause · △ Restart"
          : "WASD / arrows Move · Space Jump · Shift Dash · Esc Pause";
  }
  show(screen: Screen, time = 0, falls = 0) {
    this.screen = screen;
    const playing = screen === "playing";
    element("overlay").hidden = playing;
    for (const id of ["hud", "location", "hint", "controls"])
      element(id).hidden = !playing;
    if (playing) {
      element<HTMLButtonElement>("primary-button").blur();
      return;
    }
    element("secondary-button").hidden = screen !== "paused";
    element("menu-eyebrow").textContent = "";
    if (screen === "paused") {
      element("menu-title").textContent = "PAUSED";
      element("menu-subtitle").textContent = "RUINS";
      element("menu-description").textContent = "";
      element("primary-button").textContent = "RESUME";
      element("secondary-button").textContent = "Restart course";
    } else if (screen === "finished") {
      element("menu-title").textContent = "COMPLETE";
      element("menu-subtitle").textContent = "RUINS";
      element("menu-description").textContent =
        `Time ${formatTime(time)} · Falls ${falls}`;
      element("primary-button").textContent = "PLAY AGAIN";
      element("announcer").textContent = "Course complete.";
    }
    this.selection = 0;
    this.updateFooter();
    element("primary-button").focus();
  }
  update(
    section: number,
    progress: number,
    time = 0,
    dashCooldown = 0,
    dashing = false,
  ) {
    const info = SECTIONS[section];
    element("location-number").textContent = String(section + 1).padStart(
      2,
      "0",
    );
    element("location-name").textContent = info.name;
    element("hint").textContent = info.hint
      .replace(
        "{jump}",
        this.source === "gamepad" && this.connected ? "✕" : "Space",
      )
      .replace(
        "{dash}",
        this.source === "gamepad" && this.connected ? "Square / R1" : "Shift",
      );
    element("progress-fill").style.width =
      `${Math.min(100, Math.max(0, progress * 100))}%`;
    element("run-time").textContent = formatTime(time);
    element("dash-status").textContent = dashing
      ? "DASH"
      : dashCooldown > 0.001
        ? "DASH …"
        : "DASH READY";
    element("dash-meter").style.width =
      `${(1 - Math.min(1, dashCooldown / 0.45)) * 100}%`;
  }
  async respawnFlash() {
    element("fade").style.opacity = ".85";
    setTimeout(() => {
      element("fade").style.opacity = "0";
    }, 180);
    element("announcer").textContent = "Returned to the courtyard.";
  }
  error(message: string) {
    element("menu-eyebrow").textContent = "";
    element("menu-title").textContent = "LOAD ERROR";
    element("menu-subtitle").textContent = "RELOAD TO TRY AGAIN";
    element("menu-description").textContent = message;
    element("primary-button").hidden = true;
  }
}
function formatTime(time: number) {
  return `${Math.floor(time / 60)}:${(time % 60).toFixed(2).padStart(5, "0")}`;
}
