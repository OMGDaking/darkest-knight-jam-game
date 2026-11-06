// Parry resolution and the numbers of one fight: windows, gauge, health, damage.

import {
  perfectParryWindow,
  blockWindow,
  gaugeDrainPerfect,
  gaugeDrainBlock,
  playerHealthMax,
  hitDamage,
} from './tuning.js';

const ATTACK_DAMAGE = 25;

// No attack in progress is a miss; the later the press, the better the parry.
export function resolveParry(timeUntilImpact) {
  if (timeUntilImpact === null || timeUntilImpact === undefined) return 'hit';
  if (timeUntilImpact <= perfectParryWindow) return 'perfect';
  if (timeUntilImpact <= blockWindow) return 'block';
  return 'hit';
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
    state.enemyGauge = Math.max(0, state.enemyGauge - gaugeDrainBlock);
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
