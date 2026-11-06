// Every number the makers might tune: parry windows, attack timing, damage, gauge and enemy shape.
export const perfectParryWindow = 1.0;   // press within this long before the blade lands = perfect parry
export const blockWindow = 1.6;          // press this early instead = block
export const attackIntervalMin = 2.5;    // seconds between attacks, lower bound
export const attackIntervalMax = 3.0;    // seconds between attacks, upper bound
export const windupTime = 1.8;           // seconds from the telegraph starting to the blade landing
export const playerHealthMax = 100;
export const enemyGaugeMax = 100;
export const gaugeDrainPerfect = 34;     // gauge removed by a perfect parry
export const gaugeDrainBlock = 12;       // gauge removed by a block
export const hitDamage = 20;             // damage to the player when a strike lands
export const arenaRadius = 7;            // how far the player can walk from the centre
export const restartKey = 'r';           // the key that restarts a fight
export const enemySpawnZ = -3;           // where the enemy stands in front of the player

// Swing timing and placeholder shape for the gray-box enemy.
export const enemyStrikeTime = 0.15;     // seconds the strike itself lasts
export const enemyRecoverTime = 0.5;     // seconds spent recovering after a strike
export const enemyLunge = 0.7;           // metres the enemy lunges forward on the strike

// The windup telegraph: how far it leans, how fast it turns red, how brightly it glows.
export const enemyLeanBack = 0.35;       // radians the enemy leans back during a windup
export const telegraphRampTime = 0.4;    // seconds for the telegraph to reach full strength
export const enemyGlow = 0.5;            // emissive strength at full telegraph
export const enemyWidth = 0.7;
export const enemyHeight = 1.8;
export const enemyDepth = 0.6;
export const enemyColor = 0x4a4f56;      // dark grey calm
export const enemyWarningColor = 0xff6a2a; // warning orange when the blade is coming

// Per-enemy values, scaling the shared numbers above.
export const basicEnemyHealth = 100;
export const miniBossHealth = 150;
export const finalBossHealth = 200;
export const miniBossCadenceScale = 0.85;  // mini boss swings a little sooner
export const finalBossCadenceScale = 0.7;  // final boss swings soonest
export const miniBossWindupScale = 0.9;
export const finalBossWindupScale = 0.8;
