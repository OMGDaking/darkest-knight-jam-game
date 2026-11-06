// M1 gray box: the dark arena, the fight loop, and input — parry, attack, restart.
import * as THREE from 'three';
import { arenaRadius, playerHealthMax, enemyGaugeMax, restartKey, enemySpawnZ } from './tuning.js';
import { ENEMIES, Enemy } from './enemies.js';
import { resolveParry, createFightState, applyOutcome, attackEnemy } from './combat.js';
import { createPlayer } from './player.js';
import { createUI } from './ui.js';

const OUTCOME_WORDS = { perfect: 'PERFECT PARRY', block: 'BLOCK', hit: 'HIT' };
const RESTART_KEY = String(restartKey).toLowerCase();
const INTRO = `Space or right mouse parries. Left mouse or E attacks. ${RESTART_KEY.toUpperCase()} restarts.`;

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
let answeredThisAttack = false; // did the player already answer this attack? one mistake, one cost
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

// The one action: press while the blade is coming through. Seconds into the swing decides
// perfect or block; pressing at anything else — a flinch during the wind-up, empty air — is a hit.
function parry() {
  if (!enemy || state.over || state.won) return;
  const outcome = resolveParry(enemy.timeSinceSwing);
  state = applyOutcome(state, outcome);
  // He is attacking, so this press answers this attack: the landing frame must not bill it twice.
  // A press at empty air answers nothing and does not spend the attack's one mistake.
  if (enemy.state === 'windup' || enemy.state === 'swing') answeredThisAttack = true;
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
  answeredThisAttack = false;
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
  } else if (e.button === 0) {
    attack(); // no pointer lock any more, so every left click swings
  }
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
    const landed = enemy.update(dt); // true on the one frame the swing ends: the blade landing
    if (landed) {
      if (!answeredThisAttack && !state.over && !state.won) {
        state = applyOutcome(state, 'hit'); // nobody answered this swing
        showOutcome('hit');
        refreshBars();
      }
      answeredThisAttack = false;
    } else if (enemy.state === 'idle' && !state.over && !state.won) {
      answeredThisAttack = false;
    }
  }

  if (state.over) ui.setMessage(`You died — press ${RESTART_KEY.toUpperCase()} to fight again`);
  else if (state.won) ui.setMessage(`Fight won — press ${RESTART_KEY.toUpperCase()} to fight again`);
  else if (!wantsIntro) ui.hideMessage();

  renderer.render(scene, camera);
});
