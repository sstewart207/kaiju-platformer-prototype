import * as THREE from "three";
import {
  FINISH,
  PLATFORMS,
  platformPosition,
  ruinPillars,
  GROUND,
  PATH_RAMPS,
  rampMesh,
  RUIN_WALLS,
  ROUTE_FLAGS,
  COURSE_GATES,
  ARCH_REMNANTS,
} from "./course";
import type { Physics } from "./physics";
import { batchStaticBoxes } from "./scenery";

function random(seed: number) {
  return () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 4294967296;
  };
}
function pixelTexture(kind: "brick" | "floor" | "grass") {
  const canvas = document.createElement("canvas");
  canvas.width = 64;
  canvas.height = 64;
  const ctx = canvas.getContext("2d")!;
  const rng = random(kind === "brick" ? 11 : 42);
  if (kind === "brick") {
    ctx.fillStyle = "#6b6857";
    ctx.fillRect(0, 0, 64, 64);
    const colors = ["#c2aa7c", "#baa077", "#cbb58b", "#ae9770"];
    for (let row = 0; row < 4; row++)
      for (let col = -1; col < 3; col++) {
        const x = col * 32 + (row % 2) * 16,
          y = row * 16;
        ctx.fillStyle = colors[Math.floor(rng() * colors.length)];
        ctx.fillRect(x + 1, y + 1, 30, 14);
        ctx.fillStyle = "#dfc89a";
        ctx.fillRect(x + 2, y + 1, 28, 1);
        ctx.fillStyle = "#8f7e60";
        ctx.fillRect(x + 2, y + 13, 28, 2);
        for (let n = 0; n < 6; n++) {
          ctx.fillStyle = rng() > 0.5 ? "#b49d77" : "#d1b98c";
          ctx.fillRect(
            x + 3 + Math.floor(rng() * 25),
            y + 3 + Math.floor(rng() * 9),
            2,
            1,
          );
        }
      }
  } else if (kind === "floor") {
    ctx.fillStyle = "#8e9473";
    ctx.fillRect(0, 0, 64, 64);
    for (let y = 0; y < 64; y += 32)
      for (let x = 0; x < 64; x += 32) {
        ctx.fillStyle = x + y === 32 ? "#d5c699" : "#c5b78b";
        ctx.fillRect(x + 1, y + 1, 30, 30);
        ctx.fillStyle = "#eee0b0";
        ctx.fillRect(x + 2, y + 2, 28, 1);
        ctx.fillRect(x + 2, y + 2, 1, 27);
        ctx.strokeStyle = "#afa57e";
        ctx.lineWidth = 1;
        ctx.strokeRect(x + 5, y + 5, 22, 22);
        ctx.fillStyle = "#c0b48c";
        for (let i = 0; i < 9; i++)
          ctx.fillRect(
            x + 7 + Math.floor(rng() * 18),
            y + 7 + Math.floor(rng() * 18),
            2,
            1,
          );
      }
  } else {
    ctx.fillStyle = "#6fa65b";
    ctx.fillRect(0, 0, 64, 64);
    const colors = ["#79a25d", "#769c58", "#6a9553", "#739c56"];
    for (let i = 0; i < 90; i++) {
      ctx.fillStyle = colors[Math.floor(rng() * 4)];
      ctx.fillRect(Math.floor(rng() * 64), Math.floor(rng() * 64), 2, 2);
    }
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.magFilter = THREE.NearestFilter;
  tex.minFilter = THREE.NearestFilter;
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  return tex;
}
const stone = new THREE.MeshLambertMaterial({ color: "#d5c89f" });
const trim = new THREE.MeshLambertMaterial({ color: "#e6d5a2" });
const darkStone = new THREE.MeshLambertMaterial({ color: "#9b9f78" });
const leaf = new THREE.MeshLambertMaterial({
  color: "#548759",
  side: THREE.DoubleSide,
});
const gold = new THREE.MeshLambertMaterial({
  color: "#f8cb63",
  emissive: "#b47924",
  emissiveIntensity: 0.2,
});
const blue = new THREE.MeshLambertMaterial({
  color: "#4da9aa",
  side: THREE.DoubleSide,
});
const boxGeo = new THREE.BoxGeometry(1, 1, 1);
function box(
  parent: THREE.Object3D,
  mat: THREE.Material | THREE.Material[],
  x: number,
  y: number,
  z: number,
  w: number,
  h: number,
  d: number,
) {
  const mesh = new THREE.Mesh(boxGeo, mat);
  mesh.position.set(x, y, z);
  mesh.scale.set(w, h, d);
  mesh.receiveShadow = true;
  mesh.castShadow = true;
  parent.add(mesh);
  return mesh;
}
function pillar(
  parent: THREE.Object3D,
  x: number,
  y: number,
  z: number,
  height: number,
  broken = false,
) {
  box(parent, trim, x, y + 0.12, z, 1, 0.24, 1);
  const shaft = new THREE.Mesh(
    new THREE.CylinderGeometry(0.3, 0.38, height, 8),
    stone,
  );
  shaft.position.set(x, y + 0.24 + height / 2, z);
  shaft.castShadow = true;
  parent.add(shaft);
  for (let i = 0; i < 3; i++)
    box(parent, darkStone, x, y + 0.35 + (height * i) / 3, z, 0.66, 0.1, 0.66);
  if (!broken) {
    box(parent, trim, x, y + height + 0.25, z, 0.88, 0.2, 0.88);
    box(parent, stone, x, y + height + 0.4, z, 1.04, 0.12, 1.04);
  }
}
function pennant(parent: THREE.Object3D, x: number, y: number, z: number) {
  box(parent, stone, x, y + 1, z, 0.09, 2, 0.09);
  const geo = new THREE.BufferGeometry();
  geo.setAttribute(
    "position",
    new THREE.Float32BufferAttribute([0, 0, 0, 0, -0.75, 0, 0.65, -0.36, 0], 3),
  );
  geo.computeVertexNormals();
  const flag = new THREE.Mesh(geo, blue);
  flag.position.set(x + 0.02, y + 1.95, z);
  parent.add(flag);
  const cap = new THREE.Mesh(new THREE.SphereGeometry(0.12, 6, 4), gold);
  cap.position.set(x, y + 2.04, z);
  parent.add(cap);
}
export class RuinsWorld {
  readonly scene = new THREE.Scene();
  private moving = new Map<string, THREE.Group>();
  private gate: THREE.Group;
  private motes: THREE.Points;
  private cloudGroups: THREE.Group[] = [];
  private sunlight: THREE.DirectionalLight;
  constructor() {
    this.scene.background = new THREE.Color("#94ded0");
    this.scene.fog = new THREE.Fog("#94ded0", 40, 125);
    const hemi = new THREE.HemisphereLight("#ffffdf", "#648f7b", 1.6);
    this.scene.add(hemi);
    const sunlight = new THREE.DirectionalLight("#fff0bc", 1.8);
    this.sunlight = sunlight;
    sunlight.position.set(-12, 28, 12);
    sunlight.castShadow = true;
    sunlight.shadow.mapSize.set(1024, 1024);
    sunlight.shadow.camera.left = -22;
    sunlight.shadow.camera.right = 22;
    sunlight.shadow.camera.top = 22;
    sunlight.shadow.camera.bottom = -22;
    sunlight.shadow.camera.far = 80;
    sunlight.shadow.normalBias = 0.08;
    sunlight.shadow.bias = -0.0005;
    this.scene.add(sunlight);
    this.scene.add(sunlight.target);
    const brick = pixelTexture("brick"),
      floor = pixelTexture("floor"),
      grass = pixelTexture("grass");
    const groundTexture = grass.clone();
    groundTexture.repeat.set(GROUND.width / 4, GROUND.depth / 4);
    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(GROUND.width, GROUND.depth),
      new THREE.MeshLambertMaterial({ map: groundTexture }),
    );
    ground.rotation.x = -Math.PI / 2;
    ground.position.set(GROUND.x, GROUND.top, GROUND.z);
    ground.receiveShadow = true;
    this.scene.add(ground);
    for (const ramp of PATH_RAMPS) {
      const data = rampMesh(ramp),
        geometry = new THREE.BufferGeometry();
      geometry.setAttribute(
        "position",
        new THREE.BufferAttribute(data.vertices, 3),
      );
      geometry.setIndex(new THREE.BufferAttribute(data.indices, 1));
      geometry.setAttribute(
        "uv",
        new THREE.Float32BufferAttribute(
          [
            0,
            0,
            ramp.width / 2,
            0,
            ramp.width / 2,
            data.length / 2,
            0,
            data.length / 2,
            0,
            0,
            ramp.width / 2,
            0,
            ramp.width / 2,
            data.length / 2,
            0,
            data.length / 2,
          ],
          2,
        ),
      );
      geometry.computeVertexNormals();
      const path = new THREE.Mesh(
        geometry,
        new THREE.MeshLambertMaterial({ map: floor }),
      );
      path.receiveShadow = true;
      this.scene.add(path);
    }
    // This shuttle is a sliding stone block on ground-level rails. Its upper
    // surface joins two high docks; the lower walking route goes around it.
    for (const z of [-26.1, -21.9])
      box(this.scene, darkStone, 104, 0.02, z, 22, 0.12, 0.18);
    for (const spec of PLATFORMS) {
      const group = new THREE.Group();
      group.position.set(spec.x, spec.top, spec.z);
      this.scene.add(group);
      if (spec.moving) this.moving.set(spec.id, group);
      const sideTex = brick.clone();
      sideTex.repeat.set(spec.width / 2, 1.6);
      const side = new THREE.MeshLambertMaterial({ map: sideTex });
      const endTex = brick.clone();
      endTex.repeat.set(spec.depth / 2, 1.6);
      const end = new THREE.MeshLambertMaterial({ map: endTex });
      const topTex = floor.clone();
      topTex.repeat.set(spec.width / 2, spec.depth / 2);
      const top = new THREE.MeshLambertMaterial({ map: topTex });
      const materials = [end, end, top, side, side, side];
      box(group, materials, 0, -1.4, 0, spec.width, 2.8, spec.depth);
      box(group, trim, 0, -0.13, 0, spec.width + 0.12, 0.22, spec.depth + 0.12);
      const floorMesh = new THREE.Mesh(
        new THREE.PlaneGeometry(spec.width, spec.depth),
        top,
      );
      floorMesh.rotation.x = -Math.PI / 2;
      floorMesh.position.y = 0.006;
      floorMesh.receiveShadow = true;
      group.add(floorMesh);
      if (spec.moving) {
        for (const z of [-1, 1])
          box(
            group,
            blue,
            0,
            0.035,
            z * (spec.depth / 2 - 0.35),
            spec.width - 0.4,
            0.06,
            0.18,
          );
        const inset = new THREE.Mesh(new THREE.RingGeometry(0.5, 0.6, 4), gold);
        inset.rotation.x = -Math.PI / 2;
        inset.rotation.z = Math.PI / 4;
        inset.position.y = 0.03;
        group.add(inset);
        continue;
      }
      const rng = random(spec.x * 111 + spec.z * 13 + 999);
      for (const sign of [-1, 1]) {
        const patchTex = grass.clone();
        patchTex.repeat.set(spec.width / 3, 1);
        const patch = new THREE.Mesh(
          new THREE.PlaneGeometry(spec.width - 0.5, 1.25),
          new THREE.MeshLambertMaterial({ map: patchTex }),
        );
        patch.rotation.x = -Math.PI / 2;
        patch.position.set(0, 0.025, sign * (spec.depth / 2 - 0.8));
        patch.receiveShadow = true;
        group.add(patch);
        for (let n = 0; n < 5; n++) {
          const x = (rng() - 0.5) * (spec.width - 1),
            z = sign * (spec.depth / 2 - 0.6) + (rng() - 0.5) * 0.5;
          const tuft = new THREE.Mesh(
            new THREE.ConeGeometry(0.16, 0.48, 3),
            leaf,
          );
          tuft.position.set(x, 0.22, z);
          tuft.rotation.z = (rng() - 0.5) * 0.6;
          group.add(tuft);
          if (rng() > 0.45) {
            const bloom = new THREE.Mesh(
              new THREE.BoxGeometry(0.12, 0.08, 0.12),
              new THREE.MeshBasicMaterial({
                color: n % 2 ? "#fff0bc" : "#e7ede1",
              }),
            );
            bloom.position.set(x + 0.25, 0.15, z);
            group.add(bloom);
          }
        }
      }
      for (const prop of ruinPillars(spec))
        pillar(group, prop.x, 0, prop.z, prop.height, prop.broken);
      // Low masonry terraces sit within the surrounding ground.
      box(
        group,
        darkStone,
        0,
        -0.46,
        0,
        spec.width + 0.08,
        0.13,
        spec.depth + 0.08,
      );
      for (let n = 0; n < 3; n++) {
        const x = (rng() - 0.5) * spec.width;
        for (let v = 0; v < 3 + Math.floor(rng() * 4); v++)
          box(
            group,
            leaf,
            x + Math.sin(v * 1.4) * 0.12,
            -0.25 - v * 0.25,
            spec.depth / 2 + 0.025,
            0.13,
            0.2,
            0.07,
          );
      }
    }
    for (const wall of RUIN_WALLS) {
      const texture = brick.clone();
      texture.repeat.set(
        Math.max(1, wall.width / 2),
        Math.max(1, wall.height / 1.1),
      );
      const material = new THREE.MeshLambertMaterial({
        map: texture,
        color: wall.kind === "hurdle" ? "#e7d7ac" : "#d1c69f",
      });
      box(
        this.scene,
        material,
        wall.x,
        wall.y,
        wall.z,
        wall.width,
        wall.height,
        wall.depth,
      );
      box(
        this.scene,
        trim,
        wall.x,
        wall.y + wall.height / 2 + 0.06,
        wall.z,
        wall.width + 0.12,
        0.12,
        wall.depth + 0.12,
      );
      if (wall.kind === "hurdle") {
        // The distinct blue top indicates a jumpable timing obstacle.
        box(
          this.scene,
          blue,
          wall.x,
          wall.y + wall.height / 2 + 0.13,
          wall.z,
          0.24,
          0.025,
          wall.depth - 0.3,
        );
      } else if (wall.kind === "planter") {
        box(
          this.scene,
          leaf,
          wall.x,
          wall.y + wall.height / 2 + 0.18,
          wall.z,
          wall.width - 0.35,
          0.25,
          wall.depth - 0.35,
        );
      }
    }
    const surfaceAt = (x: number, z: number) =>
      Math.max(
        GROUND.top,
        ...PLATFORMS.filter(
          (p) =>
            !p.moving &&
            Math.abs(x - p.x) <= p.width / 2 &&
            Math.abs(z - p.z) <= p.depth / 2,
        ).map((p) => p.top),
      );
    for (const flag of ROUTE_FLAGS)
      pennant(this.scene, flag.x, surfaceAt(flag.x, flag.z), flag.z);
    for (const gate of COURSE_GATES) {
      const marker = new THREE.Mesh(
        new THREE.RingGeometry(0.8, 1.02, 4),
        new THREE.MeshBasicMaterial({
          color: "#4f9494",
          side: THREE.DoubleSide,
        }),
      );
      marker.rotation.x = -Math.PI / 2;
      marker.rotation.z = Math.PI / 4;
      marker.position.set(gate.x, surfaceAt(gate.x, gate.z) + 0.035, gate.z);
      this.scene.add(marker);
      for (const z of [-1, 1]) {
        const post = new THREE.Mesh(
          new THREE.CylinderGeometry(0.14, 0.2, 0.7, 6),
          trim,
        );
        post.position.set(
          gate.x,
          surfaceAt(gate.x, gate.z) + 0.35,
          gate.z + z * 2.2,
        );
        this.scene.add(post);
        const cap = new THREE.Mesh(
          new THREE.BoxGeometry(0.25, 0.1, 0.25),
          blue,
        );
        cap.position.copy(post.position);
        cap.position.y += 0.4;
        this.scene.add(cap);
      }
    }
    // Broken arch remnants frame the gallery and the two shuttle docks.
    for (const arch of ARCH_REMNANTS) {
      for (const x of [-2.2, 2.2])
        pillar(
          this.scene,
          arch.x + x,
          arch.y,
          arch.z,
          3.1,
          x < 0 && arch.x === 59,
        );
      if (arch.x !== 59)
        box(this.scene, trim, arch.x, arch.y + 3.45, arch.z, 5.6, 0.4, 1);
    }
    this.gate = new THREE.Group();
    this.gate.position.set(FINISH.x, FINISH.y, FINISH.z - 2.5);
    this.scene.add(this.gate);
    for (const x of [-1.8, 1.8]) pillar(this.gate, x, 0, 0, 3.5);
    box(this.gate, trim, 0, 3.9, 0, 4.8, 0.45, 1.2);
    box(this.gate, gold, 0, 4.17, 0, 4.5, 0.09, 0.85);
    const sunRing = new THREE.Mesh(
      new THREE.TorusGeometry(0.85, 0.09, 4, 16),
      gold,
    );
    sunRing.position.set(0, 2.25, 0);
    this.gate.add(sunRing);
    for (let i = 0; i < 8; i++) {
      const ray = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.42, 3), gold);
      const angle = (i * Math.PI) / 4;
      ray.position.set(
        Math.sin(angle) * 1.15,
        2.25 + Math.cos(angle) * 1.15,
        0,
      );
      ray.rotation.z = -angle;
      this.gate.add(ray);
    }
    const pool = new THREE.Mesh(
      new THREE.CircleGeometry(1.6, 32),
      new THREE.MeshBasicMaterial({
        color: "#f7db87",
        transparent: true,
        opacity: 0.45,
        depthWrite: false,
      }),
    );
    pool.rotation.x = -Math.PI / 2;
    pool.position.y = 0.035;
    pool.position.z = 2.5;
    this.gate.add(pool);
    const rng = random(92);
    for (let n = 0; n < 13; n++) {
      const backgroundRuin = new THREE.Group();
      backgroundRuin.position.set(
        -16 + n * 13,
        GROUND.top,
        n % 2 === 0 ? -65 : 15,
      );
      this.scene.add(backgroundRuin);
      const bgMaterial = new THREE.MeshLambertMaterial({
        color: n % 2 ? "#79b9a7" : "#94c2ac",
      });
      box(backgroundRuin, bgMaterial, 0, -4, 0, 6, 8, 6);
      box(backgroundRuin, bgMaterial, 0, 0.1, 0, 6.5, 0.3, 6.5);
      for (const x of [-2, 2]) pillar(backgroundRuin, x, 0.3, -2, 3.7);
      box(backgroundRuin, bgMaterial, 0, 4.6, -2, 6.5, 0.5, 1.4);
    }
    const bark = new THREE.MeshLambertMaterial({ color: "#847151" });
    const canopy = new THREE.MeshLambertMaterial({ color: "#558c60" });
    const canopyLight = new THREE.MeshLambertMaterial({ color: "#79a46a" });
    for (let n = 0; n < 48; n++) {
      const x = -20 + n * 3.5 + (rng() - 0.5) * 4,
        z = n % 2 === 0 ? 12 + rng() * 6 : -59 - rng() * 8;
      const tree = new THREE.Group();
      tree.position.set(x, GROUND.top, z);
      this.scene.add(tree);
      box(tree, bark, 0, 1, 0, 0.4, 2, 0.4);
      const crown = new THREE.Mesh(
        new THREE.IcosahedronGeometry(1.7 + rng() * 0.5, 0),
        n % 3 ? canopy : canopyLight,
      );
      crown.position.y = 2.5;
      tree.add(crown);
    }
    for (let n = 0; n < 15; n++) {
      const group = new THREE.Group();
      group.position.set(-50 + rng() * 240, 10 + rng() * 16, -45 - rng() * 65);
      const cloudMat = new THREE.MeshBasicMaterial({
        color: "#e7f1cc",
        transparent: true,
        opacity: 0.55,
        depthWrite: false,
      });
      for (let i = 0; i < 4; i++)
        box(
          group,
          cloudMat,
          i * 2,
          Math.sin(i * 2) * 0.6,
          0,
          3.5,
          1.1 + rng() * 1.3,
          1.2,
        );
      group.scale.setScalar(1 + rng());
      this.scene.add(group);
      this.cloudGroups.push(group);
    }
    const positions = new Float32Array(90 * 3);
    for (let i = 0; i < 90; i++) {
      positions[i * 3] = (rng() - 0.5) * 36;
      positions[i * 3 + 1] = rng() * 15;
      positions[i * 3 + 2] = (rng() - 0.5) * 30;
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    this.motes = new THREE.Points(
      geo,
      new THREE.PointsMaterial({
        color: "#fff1bd",
        size: 0.08,
        transparent: true,
        opacity: 0.65,
        depthWrite: false,
      }),
    );
    this.scene.add(this.motes);
    batchStaticBoxes(this.scene, boxGeo, new Set(this.moving.values()));
  }
  update(time: number, physics: Physics, focus: THREE.Vector3) {
    for (const platform of physics.platforms) {
      const visual = this.moving.get(platform.spec.id);
      if (visual) {
        const p = platformPosition(platform.spec, time);
        visual.position.set(p.x, p.y, p.z);
      }
    }
    this.gate.rotation.y = 0;
    this.motes.position.set(focus.x, Math.sin(time * 0.3) * 0.4, focus.z);
    const light = this.sunlight;
    light.position.set(focus.x - 12, focus.y + 28, focus.z + 12);
    light.target.position.copy(focus);
    light.target.updateMatrixWorld();
    for (let i = 0; i < this.cloudGroups.length; i++)
      this.cloudGroups[i].position.x += Math.sin(time * 0.03 + i) * 0.0008;
  }
}
