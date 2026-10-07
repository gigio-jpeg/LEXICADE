import * as THREE from "../../vendor/three/three.module.js";
import { Reflector } from "../../vendor/three/addons/objects/Reflector.js";
function box(scene, size, position, material) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(...size), material);
  mesh.position.set(...position);
  mesh.receiveShadow = true;
  scene.add(mesh);
  return mesh;
}
export function environment(scene, lowPower = false) {
  const dark = new THREE.MeshStandardMaterial({
    color: "#090d15",
    roughness: 0.55,
    metalness: 0.45,
  });
  scene.background = new THREE.Color("#060910");
  scene.fog = new THREE.FogExp2("#060910", 0.04);
  const floor = new Reflector(new THREE.PlaneGeometry(80, 70), {
    clipBias: 0.003,
    textureWidth: lowPower ? 512 : 1024,
    textureHeight: lowPower ? 512 : 1024,
    color: 0x525967,
  });
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = -0.01;
  scene.add(floor);
  const tiles = new THREE.GridHelper(80, 40, "#24364b", "#172230");
  tiles.position.y = 0.005;
  tiles.material.transparent = true;
  tiles.material.opacity = 0.36;
  scene.add(tiles);
  box(scene, [30, 9, 0.25], [0, 4.4, -4.7], dark);
  box(scene, [0.25, 9, 28], [-12, 4.4, 5], dark);
  box(scene, [0.25, 9, 28], [12, 4.4, 5], dark);
  const metal = new THREE.MeshStandardMaterial({
    color: "#1d2738",
    roughness: 0.6,
    metalness: 0.7,
  });
  for (let x = -11; x <= 11; x += 2.5) {
    box(scene, [0.055, 7, 0.09], [x, 3.5, -4.52], metal);
    const light = new THREE.MeshBasicMaterial({
      color: x % 5 ? "#417ca4" : "#6758e9",
    });
    box(scene, [0.035, 3.3, 0.03], [x, 3.8, -4.35], light);
  }
  for (const x of [-9.7, 9.7]) {
    box(
      scene,
      [0.045, 0.016, 30],
      [x, 0.022, 4],
      new THREE.MeshBasicMaterial({ color: "#5952b2" }),
    );
  }
  const ambient = new THREE.HemisphereLight("#94cde1", "#1c1740", 1.5);
  scene.add(ambient);
  const key = new THREE.DirectionalLight("#bde7ff", 1.4);
  key.position.set(3, 8, 6);
  key.castShadow = !lowPower;
  key.shadow.mapSize.set(1024, 1024);
  Object.assign(key.shadow.camera, {
    left: -10,
    right: 10,
    top: 8,
    bottom: -8,
  });
  key.shadow.bias = -0.001;
  scene.add(key);
  const pink = new THREE.PointLight("#7867ff", 17, 25, 2);
  pink.position.set(-5, 6, -1);
  scene.add(pink);
  const teal = new THREE.PointLight("#69d6bb", 12, 23, 2);
  teal.position.set(6, 5, 2);
  scene.add(teal);
  const particles = new Float32Array(140 * 3);
  for (let i = 0; i < particles.length; i += 3) {
    particles[i] = (Math.random() - 0.5) * 28;
    particles[i + 1] = Math.random() * 8;
    particles[i + 2] = (Math.random() - 0.5) * 20;
  }
  const dust = new THREE.Points(
    new THREE.BufferGeometry().setAttribute(
      "position",
      new THREE.BufferAttribute(particles, 3),
    ),
    new THREE.PointsMaterial({
      color: "#a6d8e1",
      size: 0.018,
      transparent: true,
      opacity: 0.3,
      depthWrite: false,
    }),
  );
  scene.add(dust);
  return {
    floor,
    dust,
    applyTheme(theme) {
      scene.background.set(theme.background);
      scene.fog.color.set(theme.background);
      dark.color.set(theme.wall);
      floor.material.uniforms.color.value.set(theme.floor);
      ambient.color.set(theme.ambient);
      ambient.groundColor.set(theme.ground);
      ambient.intensity = theme.ambientIntensity;
      key.intensity = theme.keyIntensity;
    },
    dispose() {
      floor.getRenderTarget().dispose();
      floor.geometry.dispose();
      floor.material.dispose();
    },
  };
}
