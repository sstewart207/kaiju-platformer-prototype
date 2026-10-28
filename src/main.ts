import "./style.css";
import "@fontsource/barlow-condensed/latin-500.css";
import "@fontsource/barlow-condensed/latin-600.css";
import "@fontsource/barlow-condensed/latin-700.css";
import "@fontsource/barlow-condensed/latin-800.css";
import "@fontsource/barlow-condensed/latin-900.css";
import "@fontsource/space-mono/latin-400.css";
import "@fontsource/space-mono/latin-700.css";
import * as THREE from "three";
import RAPIER from "@dimforge/rapier3d-compat";
import { Physics, FIXED_DT } from "./physics";
import { Player, FOOT_OFFSET, MOVEMENT } from "./player";
import { Input } from "./input";
import { FollowCamera } from "./camera";
import { RuinsWorld } from "./world";
import { CharacterSprite, SOLARGON } from "./animation";
import { FINISH, PLATFORMS, SPAWN, COURSE_GATES } from "./course";
import { UI } from "./ui";
import { FixedClock } from "./timestep";
import type { Vec3 } from "./types";
import { RENDER_WIDTH, RENDER_HEIGHT } from "./rendering";
import { Combat } from "./combat";
import { EnemyView, ZOMBIE_WALKER } from "./enemy-view";
import { CHECKPOINTS } from "./course-extension";

const ui = new UI();
async function boot() {
  await RAPIER.init();
  // Keep enemy experiments available locally while their design is undecided.
  // Production builds cannot enable this via the URL.
  const enemyPreview =
    import.meta.env.DEV &&
    new URLSearchParams(location.search).get("enemies") === "1";
  const [texture, enemyTexture] = await Promise.all([
    new THREE.TextureLoader().loadAsync(SOLARGON.atlas),
    enemyPreview
      ? new THREE.TextureLoader().loadAsync(ZOMBIE_WALKER.atlas)
      : Promise.resolve(null),
  ]);
  const canvas = document.getElementById("world") as HTMLCanvasElement;
  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: false,
    powerPreference: "high-performance",
  });
  renderer.setPixelRatio(1);
  renderer.setSize(RENDER_WIDTH, RENDER_HEIGHT, false);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1;
  const physics = new Physics(),
    player = new Player(physics),
    input = new Input(),
    camera = new FollowCamera(),
    world = new RuinsWorld();
  const character = new CharacterSprite(SOLARGON, texture);
  const combat = new Combat(physics);
  const enemyView = enemyTexture
    ? new EnemyView(world.scene, enemyTexture)
    : null;
  document.getElementById("health")!.hidden = !enemyPreview;
  if (!enemyPreview) combat.collider.setEnabled(false);
  world.scene.add(character.sprite, character.occludedSprite);
  const shadow = new THREE.Mesh(
    new THREE.CircleGeometry(0.52, 20),
    new THREE.MeshBasicMaterial({
      color: "#354d39",
      transparent: true,
      opacity: 0.35,
      depthWrite: false,
    }),
  );
  shadow.rotation.x = -Math.PI / 2;
  world.scene.add(shadow);
  const clock = new FixedClock();
  const renderFocus = new THREE.Vector3();
  let time = 0,
    elapsed = 0,
    last = performance.now(),
    falls = 0,
    section = 0,
    gatesPassed = 0,
    manual = false;
  const samples: number[] = [];
  let checkpoint = -1;
  let checkpointPosition = { ...SPAWN };
  let checkpointGates = 0;
  function resetCombat() {
    combat.reset();
    if (!enemyPreview) combat.collider.setEnabled(false);
  }
  function restart() {
    time = 0;
    elapsed = 0;
    falls = 0;
    section = 0;
    gatesPassed = 0;
    checkpoint = -1;
    checkpointPosition = { ...SPAWN };
    checkpointGates = 0;
    clock.reset();
    input.clear();
    for (const platform of physics.platforms)
      if (platform.spec.moving) {
        platform.body.setTranslation(
          {
            x: platform.spec.x,
            y: platform.spec.top - 1.4,
            z: platform.spec.z,
          },
          true,
        );
        platform.body.setNextKinematicTranslation({
          x: platform.spec.x,
          y: platform.spec.top - 1.4,
          z: platform.spec.z,
        });
        platform.delta = { x: 0, y: 0, z: 0 };
      }
    player.reset();
    resetCombat();
    physics.step();
    camera.update(SPAWN, { x: 0, y: 0, z: 0 }, 0, true);
    ui.show("playing");
  }
  function recover() {
    input.clear();
    player.reset(checkpointPosition);
    resetCombat();
    physics.step();
    gatesPassed = checkpointGates;
    camera.update(checkpointPosition, { x: 0, y: 0, z: 0 }, 0, true);
    void ui.respawnFlash();
  }
  function pause() {
    if (ui.screen === "playing") {
      input.clear();
      ui.show("paused");
    } else if (ui.screen === "paused") {
      input.clear();
      ui.show("playing");
    }
    clock.reset();
  }
  ui.onStart = restart;
  ui.onRestart = restart;
  ui.onResume = () => {
    input.clear();
    clock.reset();
    ui.show("playing");
  };
  ui.onPause = pause;
  input.onPause = pause;
  input.onRestart = () => {
    if (ui.screen !== "title") restart();
  };
  input.onConfirm = () => {
    if (ui.screen !== "playing") ui.confirm();
  };
  input.onBack = () => {
    if (ui.screen === "paused") ui.onResume();
  };
  input.onMenuMove = (direction) => ui.moveSelection(direction);
  input.onSource = (source, connected, unsupported) =>
    ui.setInput(source, connected, unsupported);
  input.onDisconnect = () => {
    if (ui.screen === "playing") pause();
  };
  window.addEventListener("blur", () => {
    if (ui.screen === "playing") pause();
  });
  document.addEventListener("visibilitychange", () => {
    if (document.hidden && ui.screen === "playing") pause();
  });
  function tick() {
    if (ui.screen !== "playing") return;
    time += FIXED_DT;
    elapsed += FIXED_DT;
    physics.updatePlatforms(time);
    if (enemyPreview) combat.beginStep();
    player.update(input.read());
    physics.step();
    if (enemyPreview) combat.update(player);
    if (combat.health <= 0) {
      recover();
      return;
    }
    const position = player.position;
    if (position.y < -12) {
      falls++;
      recover();
      return;
    }
    let nearestIndex = 0,
      nearest = Infinity;
    PLATFORMS.forEach((platform, index) => {
      const distance = Math.hypot(
        position.x - platform.x,
        position.z - platform.z,
      );
      if (distance < nearest) {
        nearest = distance;
        nearestIndex = index;
      }
    });
    section = PLATFORMS[nearestIndex].section;
    const gate = COURSE_GATES[gatesPassed];
    if (
      gate &&
      Math.hypot(position.x - gate.x, position.z - gate.z) < gate.radius &&
      position.y - FOOT_OFFSET >= (gate.minY ?? -Infinity)
    )
      gatesPassed++;
    CHECKPOINTS.forEach((point, index) => {
      if (
        index > checkpoint &&
        gatesPassed >= point.requiredGates &&
        player.grounded &&
        Math.hypot(position.x - point.x, position.z - point.z) < point.radius &&
        Math.abs(position.y - FOOT_OFFSET - point.y) < 0.2
      ) {
        checkpoint = index;
        checkpointPosition = {
          x: point.x,
          y: point.y + FOOT_OFFSET + 0.04,
          z: point.z,
        };
        checkpointGates = gatesPassed;
        combat.health = 3;
      }
    });
    if (
      player.grounded &&
      gatesPassed === COURSE_GATES.length &&
      Math.hypot(position.x - FINISH.x, position.z - FINISH.z) < 1.55 &&
      Math.abs(position.y - FOOT_OFFSET - FINISH.y) < 0.25
    ) {
      input.clear();
      ui.show("finished", falls);
    }
  }
  function render(dt: number, alpha: number) {
    const current = player.position;
    const position = {
      x: THREE.MathUtils.lerp(player.previous.x, current.x, alpha),
      y: THREE.MathUtils.lerp(player.previous.y, current.y, alpha),
      z: THREE.MathUtils.lerp(player.previous.z, current.z, alpha),
    };
    camera.update(position, player.velocity, dt);
    character.update(
      { x: position.x, y: position.y - FOOT_OFFSET + 0.02, z: position.z },
      player.animation,
      player.direction,
      dt,
      camera.camera,
      camera.pixelSize,
    );
    character.sprite.material.opacity =
      combat.invulnerable > 0
        ? Math.floor(combat.invulnerable * 14) % 2
          ? 0.3
          : 1
        : 1;
    enemyView?.update(combat, camera.camera, camera.pixelSize, dt, alpha);
    if (enemyPreview) ui.updateHealth(combat.health);
    const ground = physics.groundBelow(current, player.collider);
    shadow.visible = !!ground;
    if (ground) {
      const height = current.y - ground.timeOfImpact;
      shadow.position.set(position.x, height + 0.045, position.z);
      const distance = Math.max(0, ground.timeOfImpact - FOOT_OFFSET);
      shadow.scale.setScalar(1 + distance * 0.07);
      (shadow.material as THREE.MeshBasicMaterial).opacity = Math.max(
        0.08,
        0.33 - distance * 0.055,
      );
    }
    world.update(
      Math.max(0, time - (1 - alpha) * FIXED_DT),
      physics,
      renderFocus.set(position.x, position.y, position.z),
    );
    ui.update(player.dashCooldown, player.dashing, MOVEMENT.dashCooldown);
    renderer.render(world.scene, camera.camera);
  }
  function frame(now: number) {
    requestAnimationFrame(frame);
    input.poll();
    const rawDt = (now - last) / 1000,
      lastScreen = ui.screen;
    last = now;
    const dt = Math.min(0.1, Math.max(0, rawDt));
    if (lastScreen === "playing" && rawDt < 0.2) {
      samples.push(rawDt * 1000);
      if (samples.length > 600) samples.shift();
    }
    if (!manual) {
      if (ui.screen === "playing") clock.advance(dt, tick);
      else clock.reset();
    }
    render(
      ui.screen === "paused" ? 0 : dt,
      ui.screen === "playing" && !manual ? clock.alpha : 1,
    );
  }
  camera.update(SPAWN, { x: 0, y: 0, z: 0 }, 0, true);
  // Upload textures and compile materials before accepting Start, rather than
  // doing that work when their part of the course first enters the camera.
  const textures = new Set<THREE.Texture>();
  world.scene.traverse((object) => {
    if (!(object instanceof THREE.Mesh || object instanceof THREE.Sprite))
      return;
    for (const material of Array.isArray(object.material)
      ? object.material
      : [object.material]) {
      const map = (material as THREE.MeshLambertMaterial).map;
      if (map) textures.add(map);
    }
  });
  textures.forEach((texture) => renderer.initTexture(texture));
  await renderer.compileAsync(world.scene, camera.camera);
  render(0, 1);
  last = performance.now();
  ui.ready();
  requestAnimationFrame(frame);
  // Only the development server with ?test exposes deterministic browser-test controls.
  if (import.meta.env.DEV && new URLSearchParams(location.search).has("test")) {
    const debug = {
      state: () => ({
        position: player.position,
        velocity: { ...player.velocity },
        grounded: player.grounded,
        animation: player.animation,
        direction: player.direction,
        screen: ui.screen,
        time,
        elapsed,
        falls,
        jumps: player.jumps,
        dashes: player.dashes,
        dashing: player.dashing,
        dashCooldown: player.dashCooldown,
        landings: player.landings,
        section,
        gatesPassed,
        checkpoint,
        combat: {
          enabled: enemyPreview,
          health: combat.health,
          enemyHp: combat.hp,
          enemyPosition: combat.position,
          action: combat.action,
          actionTime: combat.actionTime,
          facing: combat.facing,
          windup: combat.windup,
          projectiles: combat.projectiles,
          shots: combat.shots,
          meleeHits: combat.meleeHits,
          projectileHits: combat.projectileHits,
          wallHits: combat.wallHits,
          spriteWidth: enemyView?.character.sprite.scale.x ?? 0,
          spriteHeight: enemyView?.character.sprite.scale.y ?? 0,
          playerSpriteWidth: character.sprite.scale.x,
        },
        drawCalls: renderer.info.render.calls,
        fps: samples.length
          ? 1000 / (samples.reduce((a, b) => a + b, 0) / samples.length)
          : 0,
        frameP95: samples.length
          ? [...samples].sort((a, b) => a - b)[
              Math.floor(samples.length * 0.95)
            ]
          : 0,
        samples: samples.length,
      }),
      gpu: () => {
        const gl = renderer.getContext(),
          extension = gl.getExtension("WEBGL_debug_renderer_info");
        return extension
          ? (gl.getParameter(extension.UNMASKED_RENDERER_WEBGL) as string)
          : "Unavailable";
      },
      manual: (enabled: boolean) => {
        manual = enabled;
        clock.reset();
      },
      advance: (frames: number) => {
        for (let i = 0; i < frames; i++) {
          input.poll();
          tick();
        }
        render(FIXED_DT, 1);
      },
      teleport: (position: Vec3) => {
        player.reset(position);
        physics.step();
        camera.update(position, { x: 0, y: 0, z: 0 }, 0, true);
      },
      course: PLATFORMS,
    };
    Object.assign(window, { __solargon: debug });
  }
}
boot().catch((error: unknown) => {
  console.error(error);
  ui.error(
    error instanceof Error
      ? error.message
      : "Try reloading this page in a browser with WebGL enabled.",
  );
});
