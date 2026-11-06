// Parry resolution and the numbers of one fight: windows, gauge, health, damage.

import {
  perfectParryOpensAt,
  gaugeDrainPerfect,
  blockDamage,
  playerHealthMax,
  hitDamage,
} from './tuning.js';

const ATTACK_DAMAGE = 25;

// The argument is seconds since the swing began, counting up from 0.
// A perfect parry is only possible once the blade is actually coming through — the last stretch of
// the swing. Press earlier than that, while the guard is still back, and you only block: a block
// costs you blood and drains the enemy nothing, so timing is the whole game.
// A press with no swing in progress at all is a flinch, and a flinch is a hit.
export function resolveParry(timeSinceSwing) {
  if (timeSinceSwing === null || timeSinceSwing === undefined) return 'hit';
  if (timeSinceSwing >= perfectParryOpensAt) return 'perfect';
  return 'block';
}

export function createFightState(config) {
  return {
    enemyConfig: config,
    playerHealth: playerHealthMax,
    enemyHealth: config.health,
    enemyGauge: config.gaugeMax,
    lastOutcome: null,
    over: false,
    won: false,
  };
}

export function applyOutcome(state, outcome) {
  if (outcome === 'perfect') {
    state.enemyGauge = Math.max(0, state.enemyGauge - gaugeDrainPerfect);
  } else if (outcome === 'block') {
    state.playerHealth = Math.max(0, state.playerHealth - blockDamage); // a block drains no guard
  } else if (outcome === 'hit') {
    state.playerHealth = Math.max(0, state.playerHealth - hitDamage);
  }
  state.lastOutcome = outcome;
  if (state.playerHealth <= 0) state.over = true;
  return state;
}

// An attack only bites while the enemy's guard is broken.
export function attackEnemy(state) {
  if (state.enemyGauge > 0) return false;
  state.enemyHealth = Math.max(0, state.enemyHealth - ATTACK_DAMAGE);
  if (state.enemyHealth <= 0) state.won = true;
  return true;
}
