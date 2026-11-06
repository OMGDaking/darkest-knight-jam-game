// M1 gray box: the dark arena, the fight loop, and input — parry, attack, restart.
import * as THREE from 'three';
import { arenaRadius, playerHealthMax, enemyGaugeMax, restartKey, enemySpawnZ } from './tuning.js';
import { ENEMIES, Enemy } from './enemies.js';
import { resolveParry, createFightState, applyOutcome, attackEnemy } from './combat.js';
import { createPlayer } from './player.js';
import { createUI } from './ui.js';

const OUTCOME_WORDS = { perfect: 'PERFECT PARRY', block: 'BLOCK', hit: 'HIT' };
const RESTART_KEY = String(restartKey).toLowerCase();
const INTRO = `Click to look around. Space or right mouse parries, left mouse or E attacks, ${RESTART_KEY.toUpperCase()} restarts.`;

// --- world ---
const scene = new THREE.Scene();
scene.background = new THREE.Color('#05060a');
scene.fog = new THREE.Fog('#05060a', 4, 24);

const camera = new THREE.PerspectiveCamera(72, innerWidth / innerHeight, 0.05, 120);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.setSize(innerWidth, innerHeight);
document.body.appendChild(renderer.domElement);

// Barely-there cold light; the lantern carried by the player does the rest.
scene.add(new THREE.HemisphereLight('#2b3648', '#08070a', 0.35));
scene.add(new THREE.AmbientLight('#1a1410', 0.4));

const ground = new THREE.Mesh(
  new THREE.PlaneGeometry(arenaRadius * 6, arenaRadius * 6),
  new THREE.MeshStandardMaterial({ color: '#171214', roughness: 1 })
);
ground.rotation.x = -Math.PI / 2;
scene.add(ground);

const player = createPlayer(scene, camera, renderer.domElement);
const ui = createUI();

// --- fight ---
const enemy = new Enemy(scene, ENEMIES[0]);
let state = createFightState(ENEMIES[0]);
let parriedThisAttack = false;
let wantsIntro = true;

// A few metres out front, facing the player. enemies.js owns the shape; the arena owns the placing.
enemy.mesh.position.set(0, 0, enemySpawnZ);

function refreshBars() {
  ui.setHealth(state.playerHealth, playerHealthMax);
  ui.setGauge(state.enemyGauge, (state.enemyConfig && state.enemyConfig.gaugeMax) || enemyGaugeMax);
}

function showOutcome(outcome) {
  ui.setOutcome(OUTCOME_WORDS[outcome] || outcome, outcome);
}

// The one action: press at the right moment. Too early is a block, way too early or idle is a hit.
function parry() {
  if (!enemy || state.over || state.won) return;
  const answering = enemy.timeUntilImpact !== null; // a live swing, not a random press
  const outcome = resolveParry(enemy.timeUntilImpact);
  state = applyOutcome(state, outcome);
  if (answering) parriedThisAttack = true; // so the landing frame below does not hurt twice
  player.parryLunge();
  showOutcome(outcome);
  refreshBars();
  wantsIntro = false;
}

function attack() {
  if (!enemy || state.over || state.won) return;
  attackEnemy(state);
  refreshBars();
  wantsIntro = false;
}

function restart() {
  if (!enemy) return;
  enemy.reset();
  state = createFightState(ENEMIES[0]);
  player.reset();
  parriedThisAttack = false;
  wantsIntro = false;
  ui.setOutcome('READY', 'ready');
  ui.hideMessage();
  refreshBars();
}

// --- input ---
addEventListener('keydown', (e) => {
  if (e.repeat) return;
  const key = e.key.toLowerCase();
  if (key === ' ' || key === 'spacebar' || key === 'f') {
    e.preventDefault();
    parry();
  } else if (key === 'e') {
    attack();
  } else if (key === RESTART_KEY) {
    restart();
  }
});

const canvas = renderer.domElement;
canvas.addEventListener('contextmenu', (e) => e.preventDefault()); // right mouse is the parry
canvas.addEventListener('mousedown', (e) => {
  if (e.button === 2) {
    e.preventDefault();
    parry();
  } else if (e.button === 0 && document.pointerLockElement === canvas) {
    attack(); // the first left click only grabs the pointer lock, so it does not also swing
  }
});
addEventListener('pointerlockchange', () => {
  if (document.pointerLockElement === canvas) wantsIntro = false;
});

addEventListener('resize', () => {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
});

// --- loop ---
ui.setOutcome('READY', 'ready');
ui.setMessage(INTRO);
refreshBars();

// performance.now() rather than THREE.Clock, which logs a deprecation warning in three.js 0.186.1.
let lastFrame = performance.now();
renderer.setAnimationLoop(() => {
  const now = performance.now();
  let dt = (now - lastFrame) / 1000;
  lastFrame = now;
  if (!Number.isFinite(dt) || dt < 0) dt = 0; // a first frame can arrive with dt = 0
  if (dt > 0.1) dt = 0.1; // a backgrounded tab must not teleport the enemy through its wind-up

  player.update(dt);

  if (enemy) {
    const landed = enemy.update(dt);
    if (landed) {
      if (!parriedThisAttack && !state.over && !state.won) {
        state = applyOutcome(state, 'hit');
        showOutcome('hit');
        refreshBars();
      }
      parriedThisAttack = false;
    } else if (enemy.state === 'idle' && !state.over && !state.won) {
      parriedThisAttack = false;
    }
  }

  if (state.over) ui.setMessage(`You died — press ${RESTART_KEY.toUpperCase()} to fight again`);
  else if (state.won) ui.setMessage(`Fight won — press ${RESTART_KEY.toUpperCase()} to fight again`);
  else if (!wantsIntro) ui.hideMessage();

  renderer.render(scene, camera);
});
