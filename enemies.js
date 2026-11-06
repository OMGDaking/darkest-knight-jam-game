// The three enemies as data, plus one Enemy that telegraphs, swings a katana through, and lands it.
import * as THREE from 'three';
import {
  windupTime, attackIntervalMin, attackIntervalMax, enemyGaugeMax,
  basicEnemyHealth, miniBossHealth, finalBossHealth,
  miniBossCadenceScale, finalBossCadenceScale, miniBossWindupScale, finalBossWindupScale,
  swingTime, enemyRecoverTime, enemyLunge, enemyLeanBack, telegraphRampTime,
  enemyGlow, enemyWidth, enemyHeight, enemyDepth,
  enemyColor, enemyWarningColor, enemyStrikeColor,
  enemyBladeLength, enemyBladeArc, enemyBladeRestAngle, enemyBladeBack, enemyBladeThrough,
  enemyBladeForward, enemyBladeThickness,
} from './tuning.js';

export const ENEMIES = [
  {
    id: 'basic',
    name: 'Basic Enemy',
    heavyChance: 0, // heavy attacks arrive in M3
    health: basicEnemyHealth,
    gaugeMax: enemyGaugeMax,
    cadenceMin: attackIntervalMin,
    cadenceMax: attackIntervalMax,
    windupTime,
  },
  {
    id: 'mini',
    name: 'Mini Boss',
    heavyChance: 0, // heavy attacks arrive in M3
    health: miniBossHealth,
    gaugeMax: enemyGaugeMax,
    cadenceMin: attackIntervalMin * miniBossCadenceScale,
    cadenceMax: attackIntervalMax * miniBossCadenceScale,
    windupTime: windupTime * miniBossWindupScale,
  },
  {
    id: 'final',
    name: 'Final Boss',
    heavyChance: 0, // heavy attacks arrive in M3
    health: finalBossHealth,
    gaugeMax: enemyGaugeMax,
    cadenceMin: attackIntervalMin * finalBossCadenceScale,
    cadenceMax: attackIntervalMax * finalBossCadenceScale,
    windupTime: windupTime * finalBossWindupScale,
  },
];

// Three beats, counted from the start of the swing: idle -> windup (no parry possible) ->
// swing (the whole parry window) -> recovering.
export class Enemy {
  constructor(scene, config) {
    this.config = config;
    this.health = config.health; // the game reads and writes these two
    this.gauge = config.gaugeMax;

    this._state = 'idle';
    this._timer = 0;
    this._windupLeft = 0;
    this._swingElapsed = 0;
    this._lunged = false;
    this._strikeFrom = new THREE.Vector3();
    this._lungeDir = new THREE.Vector3(0, 0, 1);
    this._baseColor = new THREE.Color(enemyColor);
    this._warningColor = new THREE.Color(enemyWarningColor);
    this._strikeColor = new THREE.Color(enemyStrikeColor);

    // The box is shifted up inside its own geometry, so the mesh origin sits at the feet:
    // place it with mesh.position.set(x, 0, z) and the lean pivots on the ground.
    const geometry = new THREE.BoxGeometry(enemyWidth, enemyHeight, enemyDepth);
    geometry.translate(0, enemyHeight / 2, 0);
    this._mesh = new THREE.Mesh(
      geometry,
      new THREE.MeshStandardMaterial({ color: this._baseColor.clone() })
    );
    this._blade = buildBlade();
    this._mesh.add(this._blade);
    scene.add(this._mesh);

    this.reset();
  }

  get mesh() {
    return this._mesh;
  }

  get state() {
    return this._state;
  }

  // Seconds elapsed since the swing began, counting up from 0, while the enemy is in 'swing'.
  // That is the number the parry is judged on. Null in every other state: no swing, no parry.
  get timeSinceSwing() {
    if (this._state !== 'swing') return null;
    return Math.min(swingTime, Math.max(0, this._swingElapsed));
  }

  reset() {
    if (this._lunged) this._mesh.position.copy(this._strikeFrom); // undo a lunge that was in progress
    this._lunged = false;
    this.health = this.config.health;
    this.gauge = this.config.gaugeMax;
    this._state = 'idle';
    this._windupLeft = 0;
    this._swingElapsed = 0;
    this._timer = this._nextInterval(); // cadence re-armed from here
    this._mesh.material.color.copy(this._baseColor);
    this._mesh.material.emissive.setRGB(0, 0, 0);
    this._poseIdle(); // weapon and lean back to the idle pose
  }

  update(dt) {
    if (this._state === 'idle') {
      this._timer -= dt;
      if (this._timer <= 0) {
        this._state = 'windup';
        this._windupLeft = this.config.windupTime;
        this._telegraph(0);
      }
    } else if (this._state === 'windup') {
      // The telegraph ramps over telegraphRampTime and then holds. The blade is still up behind
      // him here, so the attack reads well before the parry window opens.
      this._windupLeft -= dt;
      const elapsed = this.config.windupTime - Math.max(0, this._windupLeft);
      this._telegraph(Math.min(1, elapsed / telegraphRampTime));
      if (this._windupLeft <= 0) {
        this._windupLeft = 0;
        this._state = 'swing';
        this._swingElapsed = 0; // the parry window opens here and counts up from 0
        this._strikeFrom.copy(this._mesh.position);
        this._lungeDir.copy(this._mesh.getWorldDirection(this._lungeDir));
        this._lungeDir.y = 0;
        if (this._lungeDir.lengthSq() < 1e-6) this._lungeDir.set(0, 0, 1); // no facing? lunge +Z
        this._lungeDir.normalize();
        this._lunged = true;
        this._swing(0);
      }
    } else if (this._state === 'swing') {
      this._swingElapsed += dt;
      const t = Math.min(1, this._swingElapsed / swingTime);
      this._swing(t);
      this._mesh.position
        .copy(this._strikeFrom)
        .addScaledVector(this._lungeDir, enemyLunge * t);
      if (this._swingElapsed >= swingTime) {
        this._swingElapsed = swingTime;
        this._mesh.position.copy(this._strikeFrom).addScaledVector(this._lungeDir, enemyLunge);
        this._state = 'recovering';
        this._timer = enemyRecoverTime;
        return true; // the blade lands on this frame
      }
    } else if (this._state === 'recovering') {
      this._timer -= dt;
      const k = 1 - Math.max(0, this._timer) / enemyRecoverTime; // 0 = just landed, 1 = back to idle
      this._settle(k);
      this._mesh.position
        .copy(this._strikeFrom)
        .addScaledVector(this._lungeDir, enemyLunge * (1 - k));
      if (this._timer <= 0) {
        this._state = 'idle';
        this._lunged = false;
        this._mesh.position.copy(this._strikeFrom);
        this._mesh.material.color.copy(this._baseColor);
        this._mesh.material.emissive.setRGB(0, 0, 0);
        this._poseIdle();
        this._timer = this._nextInterval();
      }
    }

    return false;
  }

  _nextInterval() {
    const spread = Math.max(0, this.config.cadenceMax - this.config.cadenceMin);
    return this.config.cadenceMin + Math.random() * spread;
  }

  // Recolour the placeholder: the body lerps between two colours while the glow follows `strength`.
  _tint(from, to, k, strength) {
    const t = Math.min(1, Math.max(0, k));
    this._mesh.material.color.copy(from).lerp(to, t);
    this._mesh.material.emissive.copy(from).lerp(to, t).multiplyScalar(enemyGlow * Math.max(0, strength));
  }

  // Weapon, lean and colour back to how he stands when he is waiting.
  _poseIdle() {
    this._blade.rotation.z = enemyBladeRestAngle;
    this._blade.rotation.x = enemyBladeBack;
    this._mesh.rotation.x = 0;
  }

  // The whole read of the windup: he leans back and turns warning orange. Nothing moves yet.
  _telegraph(t) {
    const k = Math.min(1, Math.max(0, t));
    this._tint(this._baseColor, this._warningColor, k, k);
    this._mesh.rotation.x = -enemyLeanBack * k; // negative pitch tips the top away from its facing
  }

  // t runs 0 -> 1 over the swing. The blade sweeps a big arc down across the frame while the body
  // leans through from the windup into the follow-through and the colour heats up.
  _swing(t) {
    const k = Math.min(1, Math.max(0, t));
    this._blade.rotation.z = enemyBladeRestAngle + enemyBladeArc * k;
    this._blade.rotation.x = enemyBladeBack + (enemyBladeThrough - enemyBladeBack) * k;
    this._mesh.rotation.x = -enemyLeanBack + 2 * enemyLeanBack * k;
    this._tint(this._warningColor, this._strikeColor, k, 1);
  }

  // k runs 0 -> 1 as he comes back out of the follow-through into the idle pose.
  _settle(k) {
    const j = 1 - Math.min(1, Math.max(0, k));
    this._blade.rotation.z = enemyBladeRestAngle + enemyBladeArc * j;
    this._blade.rotation.x = enemyBladeBack + (enemyBladeThrough - enemyBladeBack) * j;
    this._mesh.rotation.x = enemyLeanBack * j;
    this._tint(this._strikeColor, this._baseColor, k, j);
  }
}

// The enemy's katana: one plain steel box on a pivot at the shoulder, swung by rotation.z. It hangs
// slightly in front of his chest so the sweep is never hidden inside his own body, and the steel is
// nearly non-metallic because nothing in this arena has an environment map to reflect.
function buildBlade() {
  const blade = new THREE.Group();
  // At the shoulder, hilt in his hand, a little forward of his chest.
  blade.position.set(enemyWidth * 0.55, enemyHeight * 0.72, enemyBladeForward);

  const steel = new THREE.MeshStandardMaterial({ color: '#d7dee8', metalness: 0.15, roughness: 0.55 });
  const grip = new THREE.MeshStandardMaterial({ color: '#3a2f30', roughness: 0.9 });

  const edge = new THREE.BoxGeometry(0.09, enemyBladeLength, enemyBladeThickness);
  edge.translate(0, enemyBladeLength / 2, 0); // the hilt sits on the pivot, the blade points up it
  blade.add(new THREE.Mesh(edge, steel));
  blade.add(new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.24, 0.07), grip));
  return blade;
}
