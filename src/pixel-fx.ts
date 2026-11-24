import * as THREE from "three";
import manifest from "../art/effects/pixelfx-manifest.json";

export type PixelFxName = keyof typeof manifest;
const textures = new Map<PixelFxName, THREE.Texture>();

/** Loaded before START; instances only change UVs, never rasterize at runtime. */
export async function loadPixelFx() {
  const loader = new THREE.TextureLoader();
  await Promise.all(
    (Object.keys(manifest) as PixelFxName[]).map(async (name) => {
      const texture = await loader.loadAsync(
        `${import.meta.env.BASE_URL}assets/fx/${name}.png`,
      );
      texture.magFilter = texture.minFilter = THREE.NearestFilter;
      texture.generateMipmaps = false;
      texture.colorSpace = THREE.SRGBColorSpace;
      textures.set(name, texture);
    }),
  );
}

export class PixelSheet {
  readonly texture: THREE.Texture;
  readonly material: THREE.MeshBasicMaterial;
  readonly meta;
  frameIndex = 0;
  constructor(readonly name: PixelFxName) {
    this.meta = manifest[name];
    const texture = textures.get(name);
    if (!texture) throw new Error(`Effect not loaded: ${name}`);
    this.texture = texture.clone();
    this.material = new THREE.MeshBasicMaterial({
      map: this.texture,
      transparent: true,
      depthWrite: false,
      depthTest: true,
      alphaTest: 0.1,
      side: THREE.DoubleSide,
      toneMapped: false,
    });
    this.frame(0);
  }
  frame(seconds: number) {
    const m = this.meta,
      t = Math.max(0, seconds);
    this.frameIndex = m.loop
      ? Math.floor(t * m.fps) % m.count
      : Math.min(m.count - 1, Math.floor(t * m.fps));
    this.texture.repeat.set(
      m.width / (m.cellW * m.columns),
      m.height / (m.cellH * m.rows),
    );
    this.texture.offset.set(
      ((this.frameIndex % m.columns) * m.cellW + 1) / (m.cellW * m.columns),
      1 -
        (Math.floor(this.frameIndex / m.columns) * m.cellH + 1 + m.height) /
          (m.cellH * m.rows),
    );
  }
}

export class PixelSprite {
  readonly sheet: PixelSheet;
  readonly sprite: THREE.Sprite;
  constructor(
    name: PixelFxName,
    unitsPerPixel: number,
    pivotOffset = { x: 0, y: 0 },
  ) {
    this.sheet = new PixelSheet(name);
    const m = this.sheet.meta;
    this.sprite = new THREE.Sprite(
      new THREE.SpriteMaterial({
        map: this.sheet.texture,
        transparent: true,
        depthTest: true,
        depthWrite: false,
        alphaTest: 0.1,
        toneMapped: false,
      }),
    );
    this.sprite.center.set(
      (m.pivot[0] + pivotOffset.x) / m.width,
      1 - (m.pivot[1] + pivotOffset.y) / m.height,
    );
    this.sprite.scale.set(m.width * unitsPerPixel, m.height * unitsPerPixel, 1);
    this.sprite.visible = false;
  }
  frame(seconds: number) {
    this.sheet.frame(seconds);
  }
  /** Reveal a directional trail behind its fixed head pivot as it travels. */
  revealTrail(pixelsBehindHead: number, unitsPerPixel: number) {
    const { width, cellW, columns, pivot } = this.sheet.meta;
    const crop = Math.max(0, Math.floor(pivot[0] - pixelsBehindHead));
    const visibleWidth = width - crop;
    this.sheet.texture.offset.x += crop / (cellW * columns);
    this.sheet.texture.repeat.x = visibleWidth / (cellW * columns);
    this.sprite.center.x = (pivot[0] - crop) / visibleWidth;
    this.sprite.scale.x = visibleWidth * unitsPerPixel;
  }
  aim(direction: { x: number; y?: number; z: number }, camera: THREE.Camera) {
    const right = new THREE.Vector3(1, 0, 0).applyQuaternion(camera.quaternion);
    const up = new THREE.Vector3(0, 1, 0).applyQuaternion(camera.quaternion);
    const heading = new THREE.Vector3(
      direction.x,
      direction.y ?? 0,
      direction.z,
    );
    this.sprite.material.rotation = Math.atan2(
      heading.dot(up),
      heading.dot(right),
    );
  }
}

/** Camera-facing ribbon with both ends inside the supplied world segment. */
export function placeRibbon(
  mesh: THREE.Mesh,
  start: THREE.Vector3,
  heading: { x: number; z: number },
  length: number,
  thickness: number,
  camera: THREE.Camera,
) {
  const forward = new THREE.Vector3(heading.x, 0, heading.z).normalize();
  const view = camera.getWorldDirection(new THREE.Vector3());
  const across = new THREE.Vector3().crossVectors(forward, view).normalize();
  const normal = new THREE.Vector3().crossVectors(forward, across).normalize();
  mesh.quaternion.setFromRotationMatrix(
    new THREE.Matrix4().makeBasis(forward, across, normal),
  );
  mesh.position.copy(start);
  mesh.scale.set(length, thickness, 1);
}
