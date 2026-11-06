// Every number the makers might tune: parry windows, attack timing, damage, gauge and enemy shape.
export const perfectParryOpensAt = 1.2;  // seconds into the swing when a perfect parry becomes possible;
                                         // press earlier in the swing than this and you only block
export const blockDamage = 5;            // health a block costs you. A block drains NO guard at all
export const attackIntervalMin = 2.5;    // seconds between attacks, lower bound
export const attackIntervalMax = 3.0;    // seconds between attacks, upper bound
export const windupTime = 1.8;           // seconds of telegraph before the swing starts: no parry yet
export const playerHealthMax = 100;
export const enemyGaugeMax = 100;
export const gaugeDrainPerfect = 34;     // gauge removed by a perfect parry. Only a perfect parry drains it
export const hitDamage = 20;             // damage to the player when a swing lands
export const arenaRadius = 7;            // how far the player can walk from the centre
export const restartKey = 'r';           // the key that restarts a fight
export const enemySpawnZ = -3;           // where the enemy stands in front of the player
export const lookHeight = 1.4;           // chest height the locked camera stays aimed at, at the enemy's spot
export const playerCanWalk = false;      // false = the view is locked: WASD does nothing, no head bob

// Swing timing and placeholder shape for the gray-box enemy.
export const swingTime = 1.6;            // seconds the swing lasts; the blade lands at the end of it
export const enemyStrikeTime = 0.15;     // no longer used: the swing absorbs the old separate strike
export const enemyRecoverTime = 0.5;     // seconds spent recovering after a swing lands
export const enemyLunge = 0.7;           // metres the enemy lunges forward through the swing

// The windup telegraph: how far it leans, how fast it turns orange, how brightly it glows.
export const enemyLeanBack = 0.35;       // radians the enemy leans back during a windup
export const telegraphRampTime = 0.4;    // seconds for the telegraph to reach full strength
export const enemyGlow = 0.5;            // emissive strength at full telegraph
export const enemyWidth = 0.7;
export const enemyHeight = 1.8;
export const enemyDepth = 0.6;
export const enemyColor = 0x4a4f56;      // dark grey calm
export const enemyWarningColor = 0xff6a2a; // warning orange while he winds up
export const enemyStrikeColor = 0xffc46a;  // hotter tint as the blade comes through

// The enemy's katana: a plain box on a pivot at the shoulder, swept over the swing.
export const enemyBladeLength = 1.1;     // metres of steel
export const enemyBladeArc = 1.6;        // radians swept, from held back and up through to down and across
export const enemyBladeRestAngle = 0.17; // blade angle in idle and windup: up, tilted back off his shoulder
export const enemyBladeBack = -0.35;     // blade tilt away from the player before the swing (radians, about x)
export const enemyBladeThrough = 0.35;   // blade tilt forward, through the player, as the swing lands
export const enemyBladeForward = 0.3;    // metres in front of his chest the sweep happens, so it is not hidden
export const enemyBladeThickness = 0.045; // how thick the box is; it is 0.09 wide across the frame

// Per-enemy values, scaling the shared numbers above.
export const basicEnemyHealth = 100;
export const miniBossHealth = 150;
export const finalBossHealth = 200;
export const miniBossCadenceScale = 0.85;  // mini boss swings a little sooner
export const finalBossCadenceScale = 0.7;  // final boss swings soonest
export const miniBossWindupScale = 0.9;
export const finalBossWindupScale = 0.8;
