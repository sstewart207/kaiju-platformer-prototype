import * as THREE from "three";

// Batch repeated solid geometry locally so camera and shadow frustum culling
// still discard distant scenery. Moving groups and transparent clouds stay separate.
export function batchStaticBoxes(scene: THREE.Scene, geometry: THREE.BufferGeometry,
  moving: ReadonlySet<THREE.Object3D>) {
  scene.updateMatrixWorld(true);
  const batches = new Map<string, THREE.Mesh<THREE.BufferGeometry, THREE.Material>[]>();
  const position = new THREE.Vector3();
  scene.traverse(object => {
    if (!(object instanceof THREE.Mesh) || object.geometry !== geometry ||
      Array.isArray(object.material) || object.material.transparent) return;
    for (let parent: THREE.Object3D | null = object; parent; parent = parent.parent)
      if (moving.has(parent)) return;
    position.setFromMatrixPosition(object.matrixWorld);
    const key = `${object.material.uuid}:${object.castShadow}:${object.receiveShadow}:${Math.floor(position.x / 24)}:${Math.floor(position.z / 24)}`;
    const batch = batches.get(key) ?? [];
    batch.push(object);
    batches.set(key, batch);
  });
  for (const meshes of batches.values()) {
    if (meshes.length < 2) continue;
    const first = meshes[0];
    const instances = new THREE.InstancedMesh(geometry, first.material, meshes.length);
    instances.castShadow = first.castShadow;
    instances.receiveShadow = first.receiveShadow;
    meshes.forEach((mesh, i) => {
      instances.setMatrixAt(i, mesh.matrixWorld);
      mesh.removeFromParent();
    });
    instances.instanceMatrix.needsUpdate = true;
    instances.computeBoundingSphere();
    instances.matrixAutoUpdate = false;
    scene.add(instances);
  }
}
