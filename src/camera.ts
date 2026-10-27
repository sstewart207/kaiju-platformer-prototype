import * as THREE from "three";
import type { Vec3 } from "./types";

export class FollowCamera {
  readonly camera: THREE.OrthographicCamera;
  readonly pixelSize: number;
  private focus = new THREE.Vector3();
  private offset = new THREE.Vector3(0, 16, 20);
  private initialized = false;
  constructor(renderHeight = 360) {
    this.pixelSize = 18 / renderHeight;
    this.camera = new THREE.OrthographicCamera(
      (-18 * 16) / 9 / 2,
      (18 * 16) / 9 / 2,
      9,
      -9,
      0.1,
      240,
    );
  }
  update(position: Vec3, _velocity: Vec3, dt: number, snap = false) {
    const target = new THREE.Vector3(
      position.x,
      Math.max(position.y - 0.5, 0) + 0.9,
      position.z,
    );
    if (!this.initialized || snap) {
      this.focus.copy(target);
      this.initialized = true;
    } else this.focus.lerp(target, 1 - Math.exp(-dt * 12));
    this.camera.position.copy(this.focus).add(this.offset);
    this.camera.lookAt(this.focus);
    // Snap in the fixed camera's screen plane, preserving depth and smooth simulation.
    const rotation = new THREE.Matrix4().extractRotation(
      this.camera.matrixWorld,
    );
    const right = new THREE.Vector3(1, 0, 0).applyMatrix4(rotation);
    const up = new THREE.Vector3(0, 1, 0).applyMatrix4(rotation);
    const sx = this.camera.position.dot(right),
      sy = this.camera.position.dot(up);
    this.camera.position.addScaledVector(
      right,
      Math.round(sx / this.pixelSize) * this.pixelSize - sx,
    );
    this.camera.position.addScaledVector(
      up,
      Math.round(sy / this.pixelSize) * this.pixelSize - sy,
    );
    this.camera.updateMatrixWorld();
  }
}
