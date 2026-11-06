// First-person rig: pointer-lock mouse look, arena-clamped WASD walking, and a sword and lantern in view.
import * as THREE from 'three';
import { arenaRadius } from './tuning.js';

// Rig feel. These numbers should move into tuning.js once the makers want to tune them.
const EYE_HEIGHT = 1.6;
const WALK_SPEED = 3.2;
const LOOK_SPEED = 0.0022;
const PITCH_LIMIT = Math.PI / 2 - 0.35; // stop the view flipping over at the poles
const BOB_AMPLITUDE = 0.05;
const BOB_RATE = 8.5;
const LUNGE_TIME = 0.22;
const LUNGE_REACH = 0.55;
const SWORD_REST = { x: 0.48, y: -0.55, z: -0.7, tilt: -Math.PI / 4, lean: 0.22 };

export function createPlayer(scene, camera, domElement) {
  camera.rotation.order = 'YXZ'; // yaw then pitch, so the horizon stays level
  camera.position.set(0, EYE_HEIGHT, 0);
  scene.add(camera); // the sword and lantern only render while the camera is in the scene

  const sword = buildSword();
  camera.add(sword);

  const lantern = new THREE.Mesh(
    new THREE.SphereGeometry(0.05, 12, 10),
    new THREE.MeshBasicMaterial({ color: '#ffcf94' })
  );
  lantern.position.set(-0.45, -0.44, -0.85);
  lantern.add(new THREE.PointLight('#ffb066', 10, 20, 1.8)); // the only warm light in the scene
  camera.add(lantern);

  let yaw = 0;
  let pitch = 0;
  let bobTime = 0;
  let lunge = 0;
  const held = new Set();

  // --- input ---
  domElement.addEventListener('click', () => {
    const request = domElement.requestPointerLock();
    if (request && request.catch) request.catch(() => {}); // ignore the browser's "too soon" rejection
  });

  addEventListener('mousemove', (e) => {
    if (document.pointerLockElement !== domElement) return; // no pointer lock, no look
    yaw -= e.movementX * LOOK_SPEED;
    pitch = Math.max(-PITCH_LIMIT, Math.min(PITCH_LIMIT, pitch - e.movementY * LOOK_SPEED));
    camera.rotation.set(pitch, yaw, 0);
  });

  addEventListener('keydown', (e) => held.add(e.key.toLowerCase()));
  addEventListener('keyup', (e) => held.delete(e.key.toLowerCase()));
  addEventListener('blur', () => held.clear()); // stop walking if the window loses focus

  // --- sword ---
  function placeSword() {
    const shove = lunge > 0 ? Math.sin((1 - lunge / LUNGE_TIME) * Math.PI) : 0;
    sword.position.set(SWORD_REST.x, SWORD_REST.y + shove * 0.2, SWORD_REST.z - shove * LUNGE_REACH);
    sword.rotation.set(SWORD_REST.tilt - shove * 0.5, 0, SWORD_REST.lean);
  }

  function parryLunge() {
    lunge = LUNGE_TIME;
    placeSword();
  }

  // --- walk ---
  function update(dt) {
    if (lunge > 0) lunge = Math.max(0, lunge - dt);
    placeSword();
    if (!(dt > 0)) return; // a first frame can arrive with dt = 0

    const f =
      (held.has('w') || held.has('arrowup') ? 1 : 0) - (held.has('s') || held.has('arrowdown') ? 1 : 0);
    const r =
      (held.has('d') || held.has('arrowright') ? 1 : 0) - (held.has('a') || held.has('arrowleft') ? 1 : 0);
    const moving = f !== 0 || r !== 0;

    if (moving) {
      const step = (WALK_SPEED * dt) / Math.hypot(f, r);
      const sin = Math.sin(yaw);
      const cos = Math.cos(yaw);
      camera.position.x += (r * cos - f * sin) * step;
      camera.position.z += (-r * sin - f * cos) * step;

      const away = Math.hypot(camera.position.x, camera.position.z);
      if (away > arenaRadius) {
        // the arena edge is a wall: slide along it instead of leaving
        const k = arenaRadius / away;
        camera.position.x *= k;
        camera.position.z *= k;
      }
      bobTime += dt;
    }

    const bobTarget = EYE_HEIGHT + (moving ? Math.sin(bobTime * BOB_RATE) * BOB_AMPLITUDE : 0);
    camera.position.y += (bobTarget - camera.position.y) * Math.min(1, dt * 10);
  }

  function reset() {
    yaw = 0;
    pitch = 0;
    bobTime = 0;
    lunge = 0;
    held.clear();
    camera.position.set(0, EYE_HEIGHT, 0);
    camera.rotation.set(0, 0, 0);
    placeSword();
  }

  reset();

  return {
    camera,
    update,
    parryLunge,
    reset,
    get bobTime() {
      return bobTime;
    },
  };
}

function buildSword() {
  const sword = new THREE.Group();
  const steel = new THREE.MeshStandardMaterial({ color: '#98a0aa', metalness: 0.75, roughness: 0.35 });
  const wrap = new THREE.MeshStandardMaterial({ color: '#241c20', roughness: 0.9 });

  const bladeGeo = new THREE.BoxGeometry(0.04, 1.2, 0.09);
  bladeGeo.translate(0, 0.6, 0); // the hilt sits on the group's origin, the blade points up it
  sword.add(new THREE.Mesh(bladeGeo, steel));

  sword.add(new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.045, 0.12), wrap));
  const handle = new THREE.Mesh(new THREE.BoxGeometry(0.055, 0.26, 0.07), wrap);
  handle.position.y = -0.15;
  sword.add(handle);
  return sword;
}
