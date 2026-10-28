import * as THREE from "three";
import type { Vec3 } from "./types";

// Six tapered strokes in one reusable mesh; no particles or textures to load.
export class DashLines {
  private positions = new Float32Array(6 * 3 * 3);
  private geometry = new THREE.BufferGeometry();
  private projected = new THREE.Vector3();
  private offset = new THREE.Vector3();
  readonly mesh: THREE.Mesh;
  constructor() {
    this.geometry.setAttribute(
      "position",
      new THREE.BufferAttribute(this.positions, 3).setUsage(
        THREE.DynamicDrawUsage,
      ),
    );
    const colors = new Float32Array(this.positions.length);
    for (let line = 0; line < 6; line++) {
      const color = new THREE.Color(line % 2 ? "#f4c45a" : "#fff4cf");
      for (let vertex = 0; vertex < 3; vertex++)
        color.toArray(colors, line * 9 + vertex * 3);
    }
    this.geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    this.mesh = new THREE.Mesh(
      this.geometry,
      new THREE.MeshBasicMaterial({
        vertexColors: true,
        transparent: true,
        opacity: 0.85,
        depthWrite: false,
        side: THREE.DoubleSide,
        toneMapped: false,
      }),
    );
    this.mesh.visible = false;
    this.mesh.frustumCulled = false;
  }
  update(
    active: boolean,
    position: THREE.Vector3,
    velocity: Vec3,
    camera: THREE.Camera,
    time: number,
  ) {
    this.mesh.visible = active;
    if (!active) return;
    this.projected
      .set(velocity.x, 0, velocity.z)
      .transformDirection(camera.matrixWorldInverse);
    const length = Math.hypot(this.projected.x, this.projected.y);
    if (length < 0.001) {
      this.mesh.visible = false;
      return;
    }
    const dx = this.projected.x / length,
      dy = this.projected.y / length;
    this.mesh.quaternion.copy(camera.quaternion);
    // Keep vertical trails above the ground and beside the character silhouette.
    this.offset.set(0, 0.85 + dy * 0.2, 0.7).applyQuaternion(camera.quaternion);
    this.mesh.position.copy(position).add(this.offset);
    for (let line = 0; line < 6; line++) {
      const phase = (time * 17 + line * 0.37) % 1;
      const side = (line - 2.5) * 0.23;
      const back = 0.65 + phase * 0.25;
      const streak = 0.38 + (line % 3) * 0.09;
      const thickness = 0.025 + (line % 2) * 0.012;
      const x = -dx * back - dy * side,
        y = -dy * back + dx * side;
      const index = line * 9;
      this.positions.set(
        [
          x,
          y,
          0,
          x - dx * streak - dy * thickness,
          y - dy * streak + dx * thickness,
          0,
          x - dx * streak + dy * thickness,
          y - dy * streak - dx * thickness,
          0,
        ],
        index,
      );
    }
    this.geometry.attributes.position.needsUpdate = true;
  }
}
