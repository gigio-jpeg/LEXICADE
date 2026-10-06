import * as THREE from "../../vendor/three/three.module.js";
import { marquee, sideArt, preview } from "./textures.js";
import { COLORS, machineX } from "./navigation.js";
function box(group, w, h, d, x, y, z, material) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), material);
  mesh.position.set(x, y, z);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  group.add(mesh);
  return mesh;
}
export function cabinet(game, index) {
  const group = new THREE.Group(),
    color = new THREE.Color(COLORS[index]);
  group.position.set(machineX(index), 0.03, 0);
  group.userData.index = index;
  const shell = new THREE.MeshStandardMaterial({
    color: "#253347",
    metalness: 0.6,
    roughness: 0.36,
  });
  const dark = new THREE.MeshStandardMaterial({
    color: "#04090e",
    metalness: 0.35,
    roughness: 0.38,
  });
  const paint = new THREE.MeshStandardMaterial({
    color: color.clone().multiplyScalar(0.28),
    metalness: 0.3,
    roughness: 0.3,
  });
  const metal = new THREE.MeshStandardMaterial({
    color: "#536069",
    metalness: 0.9,
    roughness: 0.27,
  });
  const neon = new THREE.MeshStandardMaterial({
    color,
    emissive: color,
    emissiveIntensity: 1.15,
    roughness: 0.3,
  });
  const profile = new THREE.Shape();
  profile.moveTo(-0.85, 0);
  profile.lineTo(0.84, 0);
  profile.lineTo(0.84, 1.38);
  profile.lineTo(1.02, 1.55);
  profile.lineTo(1.02, 1.87);
  profile.lineTo(0.74, 2.02);
  profile.lineTo(0.74, 3.61);
  profile.lineTo(0.95, 3.72);
  profile.lineTo(0.95, 4.31);
  profile.lineTo(0.57, 4.49);
  profile.lineTo(-0.85, 4.49);
  profile.closePath();
  const sideGeometry = new THREE.ExtrudeGeometry(profile, {
    depth: 0.12,
    bevelEnabled: true,
    bevelThickness: 0.025,
    bevelSize: 0.025,
    bevelSegments: 2,
    steps: 1,
  });
  for (const side of [-1, 1]) {
    const panel = new THREE.Mesh(sideGeometry, paint);
    panel.rotation.y = -Math.PI / 2;
    panel.position.x = side * 1.2;
    panel.castShadow = true;
    group.add(panel);
    const edges = new THREE.LineSegments(
      new THREE.EdgesGeometry(sideGeometry, 25),
      new THREE.LineBasicMaterial({ color }),
    );
    edges.rotation.copy(panel.rotation);
    edges.position.copy(panel.position);
    edges.position.x += side * 0.02;
    group.add(edges);
    const decal = new THREE.Mesh(
      new THREE.PlaneGeometry(1.5, 3.65),
      new THREE.MeshStandardMaterial({
        map: sideArt(index),
        metalness: 0.2,
        roughness: 0.65,
      }),
    );
    decal.rotation.y = (side * Math.PI) / 2;
    decal.position.set(side * 1.235, 2.2, -0.06);
    group.add(decal);
  }
  box(group, 2.24, 4.38, 0.12, 0, 2.2, -0.78, shell);
  box(group, 2.28, 1.3, 1.56, 0, 0.7, 0, shell);
  box(group, 2.3, 0.14, 1.68, 0, 0.09, 0, dark);
  box(group, 2.22, 0.075, 0.045, 0, 0.18, 0.84, neon);
  box(group, 2.23, 0.8, 0.13, 0, 0.86, 0.79, dark);
  box(group, 1.96, 0.025, 0.024, 0, 1.29, 0.87, neon);
  const coin = box(group, 0.33, 0.44, 0.035, 0.56, 0.83, 0.875, metal);
  box(group, 0.23, 0.034, 0.035, 0.56, 0.92, 0.898, dark);
  box(group, 0.16, 0.07, 0.037, 0.56, 0.71, 0.898, neon);
  const kick = new THREE.Mesh(
    new THREE.PlaneGeometry(0.68, 0.32),
    new THREE.MeshBasicMaterial({ map: marquee("PLAY", index) }),
  );
  kick.position.set(-0.42, 0.79, 0.87);
  group.add(kick);
  box(group, 2.28, 0.65, 0.3, 0, 4, 0.65, dark);
  const sign = new THREE.Mesh(
    new THREE.PlaneGeometry(2.18, 0.48),
    new THREE.MeshBasicMaterial({
      map: marquee(game.name, index),
      toneMapped: false,
    }),
  );
  sign.position.set(0, 4.04, 0.957);
  group.add(sign);
  for (const y of [3.74, 4.35])
    box(group, 2.23, 0.032, 0.035, 0, y, 0.96, neon);
  box(group, 2.27, 1.65, 0.16, 0, 2.79, 0.79, dark);
  for (const x of [-1.1, 1.1])
    box(group, 0.034, 1.65, 0.04, x, 2.79, 0.89, neon);
  for (const y of [1.98, 3.6]) box(group, 2.2, 0.028, 0.04, 0, y, 0.89, neon);
  const screen = preview(index),
    monitor = new THREE.Mesh(
      new THREE.PlaneGeometry(1.92, 1.6),
      new THREE.MeshBasicMaterial({ map: screen.texture, toneMapped: false }),
    );
  monitor.position.set(0, 2.8, 0.902);
  group.add(monitor);
  const console = box(group, 2.28, 0.18, 0.68, 0, 1.78, 0.66, shell);
  console.rotation.x = 0.13;
  box(group, 2.28, 0.035, 0.034, 0, 1.77, 1.03, neon);
  const stick = new THREE.Group();
  stick.position.set(-0.59, 1.91, 0.74);
  group.add(stick);
  const stem = new THREE.Mesh(
    new THREE.CylinderGeometry(0.028, 0.04, 0.25, 12),
    metal,
  );
  stem.position.y = 0.09;
  stick.add(stem);
  const ball = new THREE.Mesh(
    new THREE.SphereGeometry(0.115, 24, 16),
    new THREE.MeshStandardMaterial({ color, metalness: 0.35, roughness: 0.22 }),
  );
  ball.position.y = 0.23;
  stick.add(ball);
  const ring = new THREE.Mesh(
    new THREE.CylinderGeometry(0.16, 0.16, 0.035, 24),
    dark,
  );
  stick.add(ring);
  const buttons = [];
  for (let i = 0; i < 3; i++) {
    const button = new THREE.Mesh(
      new THREE.CylinderGeometry(0.105, 0.12, 0.06, 24),
      i === 2 ? metal : neon,
    );
    button.position.set(0.3 + i * 0.27, 1.92, 0.73 + (i % 2) * 0.12);
    group.add(button);
    buttons.push(button);
  }
  const glow = new THREE.PointLight(color, 1.1, 5, 2);
  glow.position.set(0, 2.3, 1.5);
  group.add(glow);
  const floorGlow = new THREE.PointLight(color, 0.7, 4, 2);
  floorGlow.position.set(0, 0.23, 1.3);
  group.add(floorGlow);
  return { group, monitor, screen, stick, buttons, color, index };
}
