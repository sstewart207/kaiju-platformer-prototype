import RAPIER from "@dimforge/rapier3d-compat";
import {
  PLATFORMS,
  platformPosition,
  ruinPillars,
  FINISH,
  GROUND,
  PATH_RAMPS,
  rampMesh,
  RUIN_WALLS,
  ARCH_REMNANTS,
} from "./course";
import type { PlatformSpec, Vec3 } from "./types";

export const FIXED_DT = 1 / 60;
export interface PlatformBody {
  spec: PlatformSpec;
  body: RAPIER.RigidBody;
  collider: RAPIER.Collider;
  delta: Vec3;
}
export class Physics {
  readonly world = new RAPIER.World({ x: 0, y: -26, z: 0 });
  readonly platforms: PlatformBody[] = [];
  constructor() {
    this.world.timestep = FIXED_DT;
    this.world.createCollider(
      RAPIER.ColliderDesc.cuboid(
        GROUND.width / 2,
        2,
        GROUND.depth / 2,
      ).setTranslation(GROUND.x, GROUND.top - 2, GROUND.z),
    );
    for (const ramp of PATH_RAMPS) {
      const mesh = rampMesh(ramp);
      this.world.createCollider(
        RAPIER.ColliderDesc.trimesh(mesh.vertices, mesh.indices),
      );
    }
    for (const wall of RUIN_WALLS)
      this.world.createCollider(
        RAPIER.ColliderDesc.cuboid(
          wall.width / 2,
          wall.height / 2,
          wall.depth / 2,
        ).setTranslation(wall.x, wall.y, wall.z),
      );
    for (const arch of ARCH_REMNANTS) {
      for (const side of [-1, 1])
        this.world.createCollider(
          RAPIER.ColliderDesc.cylinder(1.55, 0.4).setTranslation(
            arch.x + side * 2.2,
            arch.y + 0.24 + 1.55,
            arch.z,
          ),
        );
      if (arch.x !== 59)
        this.world.createCollider(
          RAPIER.ColliderDesc.cuboid(2.8, 0.2, 0.5).setTranslation(
            arch.x,
            arch.y + 3.45,
            arch.z,
          ),
        );
    }
    for (const spec of PLATFORMS) {
      const height = 2.8;
      const descriptor = spec.moving
        ? RAPIER.RigidBodyDesc.kinematicPositionBased()
        : RAPIER.RigidBodyDesc.fixed();
      const body = this.world.createRigidBody(
        descriptor.setTranslation(spec.x, spec.top - height / 2, spec.z),
      );
      const collider = this.world.createCollider(
        RAPIER.ColliderDesc.cuboid(
          spec.width / 2,
          height / 2,
          spec.depth / 2,
        ).setFriction(0),
        body,
      );
      this.platforms.push({
        spec,
        body,
        collider,
        delta: { x: 0, y: 0, z: 0 },
      });
      for (const prop of ruinPillars(spec)) {
        const x = spec.x + prop.x,
          z = spec.z + prop.z;
        this.world.createCollider(
          RAPIER.ColliderDesc.cuboid(0.5, 0.12, 0.5).setTranslation(
            x,
            spec.top + 0.12,
            z,
          ),
        );
        this.world.createCollider(
          RAPIER.ColliderDesc.cylinder(prop.height / 2, 0.38).setTranslation(
            x,
            spec.top + 0.24 + prop.height / 2,
            z,
          ),
        );
        if (!prop.broken)
          this.world.createCollider(
            RAPIER.ColliderDesc.cuboid(0.52, 0.16, 0.52).setTranslation(
              x,
              spec.top + prop.height + 0.33,
              z,
            ),
          );
      }
    }
    for (const side of [-1, 1])
      this.world.createCollider(
        RAPIER.ColliderDesc.cylinder(1.9, 0.5).setTranslation(
          FINISH.x + side * 1.8,
          FINISH.y + 1.9,
          FINISH.z - 2.5,
        ),
      );
    this.world.createCollider(
      RAPIER.ColliderDesc.cuboid(2.4, 0.225, 0.6).setTranslation(
        FINISH.x,
        FINISH.y + 3.9,
        FINISH.z - 2.5,
      ),
    );
    this.world.step();
  }
  updatePlatforms(time: number) {
    for (const platform of this.platforms) {
      if (!platform.spec.moving) continue;
      const next = platformPosition(platform.spec, time);
      const current = platform.body.translation();
      platform.delta = { x: next.x - current.x, y: 0, z: next.z - current.z };
      // Update the collision surface before the character's move-and-slide query.
      // Carry is applied explicitly by Player, so no predicted platform velocity is needed.
      const translation = { x: next.x, y: next.y - 1.4, z: next.z };
      platform.body.setTranslation(translation, true);
      platform.body.setNextKinematicTranslation(translation);
    }
    this.world.propagateModifiedBodyPositionsToColliders();
  }
  groundBelow(position: Vec3, exclude?: RAPIER.Collider, maxDistance = 25) {
    return this.world.castRay(
      new RAPIER.Ray(position, { x: 0, y: -1, z: 0 }),
      maxDistance,
      true,
      undefined,
      undefined,
      exclude,
    );
  }
  step() {
    this.world.step();
  }
  dispose() {
    this.world.free();
  }
}
export { RAPIER };
