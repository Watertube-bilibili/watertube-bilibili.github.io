import * as THREE from './vendor/three.module.js';

// A locally generated lighting environment gives metallic paint a visible
// reflection, without a network dependency or a reflection camera per car.
const environments = new WeakMap();
export function createVehicleEnvironment(renderer) {
  if (environments.has(renderer)) return environments.get(renderer);
  const studio = new THREE.Scene();
  studio.background = new THREE.Color(0x8797a5);
  const objects = [];
  const panel = (color, intensity, size, position, rotation = [0, 0, 0]) => {
    const material = new THREE.MeshBasicMaterial({color, side: THREE.DoubleSide});
    material.color.multiplyScalar(intensity);
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(...size), material);
    mesh.position.set(...position); mesh.rotation.set(...rotation);
    studio.add(mesh); objects.push(mesh);
  };
  panel(0xffffff, 4, [4, 18], [-8, 5, 0], [0, Math.PI / 2, 0]);
  panel(0xd8e8ff, 2.5, [3, 16], [8, 3, -2], [0, -Math.PI / 2, 0]);
  panel(0xffe5bd, 2, [14, 3], [0, 7, -10]);
  panel(0xffffff, 2.4, [5, 18], [0, 10, 0], [Math.PI / 2, 0, 0]);
  panel(0x17202b, .45, [60, 60], [0, -5, 0], [-Math.PI / 2, 0, 0]);
  panel(0x283645, .6, [20, 8], [0, 0, 12]);
  const generator = new THREE.PMREMGenerator(renderer);
  const target = generator.fromScene(studio, .06, .1, 100);
  generator.dispose();
  for (const mesh of objects) { mesh.geometry.dispose(); mesh.material.dispose(); }
  // Keep the target alive for the renderer lifetime; the shared texture is
  // reused by the game, showroom and cockpit scenes on that renderer.
  environments.set(renderer, target.texture);
  return target.texture;
}
