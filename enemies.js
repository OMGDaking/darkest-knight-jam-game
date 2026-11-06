// The three enemies as data, plus one Enemy that telegraphs its swing and lands it on a cadence.
import * as THREE from 'three';
import {
  windupTime, attackIntervalMin, attackIntervalMax, enemyGaugeMax,
  basicEnemyHealth, miniBossHealth, finalBossHealth,
  miniBossCadenceScale, finalBossCadenceScale, miniBossWindupScale, finalBossWindupScale,
  enemyStrikeTime, enemyRecoverTime, enemyLunge, enemyLeanBack, telegraphRampTime,
  enemyGlow, enemyWidth, enemyHeight, enemyDepth, enemyColor, enemyWarningColor,
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

export class Enemy {
  constructor(scene, config) {
    this.config = config;
    this.health = config.health; // the game reads and writes these two
    this.gauge = config.gaugeMax;

    this._state = 'idle';
    this._timer = 0;
    this._windupLeft = 0;
    this._impactFrame = false;
    this._lunged = false;
    this._strikeFrom = new THREE.Vector3();
    this._lungeDir = new THREE.Vector3(0, 0, 1);
    this._baseColor = new THREE.Color(enemyColor);
    this._warningColor = new THREE.Color(enemyWarningColor);

    // The box is shifted up inside its own geometry, so the mesh origin sits at the feet:
    // place it with mesh.position.set(x, 0, z) and the lean pivots on the ground.
    const geometry = new THREE.BoxGeometry(enemyWidth, enemyHeight, enemyDepth);
    geometry.translate(0, enemyHeight / 2, 0);
    this._mesh = new THREE.Mesh(
      geometry,
      new THREE.MeshStandardMaterial({ color: this._baseColor.clone() })
    );
    scene.add(this._mesh);

    this.reset();
  }

  get mesh() {
    return this._mesh;
  }

  get state() {
    return this._state;
  }

  // Seconds until the blade lands while the enemy is winding up. On the frame the strike lands
  // (update() returns true) it is exactly 0; in every other moment it is null.
  get timeUntilImpact() {
    if (this._state === 'windup') return this._windupLeft;
    if (this._state === 'strike' && this._impactFrame) return 0;
    return null;
  }

  reset() {
    if (this._lunged) this._mesh.position.copy(this._strikeFrom); // undo a lunge that was in progress
    this._lunged = false;
    this.health = this.config.health;
    this.gauge = this.config.gaugeMax;
    this._state = 'idle';
    this._impactFrame = false;
    this._windupLeft = 0;
    this._timer = this._nextInterval(); // cadence re-armed from here
    this._mesh.rotation.x = 0;
    this._mesh.material.color.copy(this._baseColor);
    this._mesh.material.emissive.setRGB(0, 0, 0);
  }

  update(dt) {
    this._impactFrame = false;

    if (this._state === 'idle') {
      this._timer -= dt;
      if (this._timer <= 0) {
        this._state = 'windup';
        this._windupLeft = this.config.windupTime;
        this._telegraph(0);
      }
    } else if (this._state === 'windup') {
      // The telegraph ramps over telegraphRampTime and then holds, so the attack is readable
      // well before the parry window opens.
      this._windupLeft -= dt;
      const elapsed = this.config.windupTime - Math.max(0, this._windupLeft);
      this._telegraph(Math.min(1, elapsed / telegraphRampTime));
      if (this._windupLeft <= 0) {
        this._windupLeft = 0;
        this._state = 'strike';
        this._timer = enemyStrikeTime;
        this._impactFrame = true;
        this._strikeFrom.copy(this._mesh.position);
        this._lungeDir.copy(this._mesh.getWorldDirection(this._lungeDir));
        this._lungeDir.y = 0;
        if (this._lungeDir.lengthSq() < 1e-6) this._lungeDir.set(0, 0, 1); // no facing? lunge +Z
        this._lungeDir.normalize();
        this._lunged = true;
        this._glow(1);
        this._mesh.rotation.x = enemyLeanBack * 0.5; // forward, into the cut
        return true; // the blade lands on this frame
      }
    } else if (this._state === 'strike') {
      this._timer -= dt;
      const t = 1 - Math.max(0, this._timer) / enemyStrikeTime;
      this._mesh.position
        .copy(this._strikeFrom)
        .addScaledVector(this._lungeDir, enemyLunge * t);
      if (this._timer <= 0) {
        this._mesh.position.copy(this._strikeFrom).addScaledVector(this._lungeDir, enemyLunge);
        this._state = 'recovering';
        this._timer = enemyRecoverTime;
      }
    } else if (this._state === 'recovering') {
      this._timer -= dt;
      const fade = 1 - Math.max(0, this._timer) / enemyRecoverTime; // warning drains away
      this._glow(fade);
      this._mesh.rotation.x = enemyLeanBack * 0.5 * fade;
      this._mesh.position
        .copy(this._strikeFrom)
        .addScaledVector(this._lungeDir, enemyLunge * fade);
      if (this._timer <= 0) {
        this._state = 'idle';
        this._lunged = false;
        this._mesh.position.copy(this._strikeFrom);
        this._telegraph(0);
        this._timer = this._nextInterval();
      }
    }

    return false;
  }

  _nextInterval() {
    const spread = Math.max(0, this.config.cadenceMax - this.config.cadenceMin);
    return this.config.cadenceMin + Math.random() * spread;
  }

  _glow(t) {
    const k = Math.min(1, Math.max(0, t));
    this._mesh.material.color.copy(this._baseColor).lerp(this._warningColor, k);
    this._mesh.material.emissive.copy(this._warningColor).multiplyScalar(enemyGlow * k);
  }

  // The whole read: the placeholder leans back and turns warning orange during the windup.
  _telegraph(t) {
    const k = Math.min(1, Math.max(0, t));
    this._glow(k); // dark grey -> warning orange, plus a glow
    this._mesh.rotation.x = -enemyLeanBack * k; // negative pitch tips the top away from its facing
  }
}
