import Phaser from 'phaser';
import { ENEMY_CONFIGS, EnemyBehavior, EnemyClass, EnemyDefinition } from '../config/EnemyConfig';
import { WEAPON_RUNTIME_TUNING } from '../config/WeaponEvolutionConfig';
import { SoundManager } from '../audio/SoundManager';
import { ProjectileManager } from './ProjectileManager';
import { allocateTargetId, Targetable } from './Targetable';

export interface EnemySpawnModifiers {
  hpMult?: number;
  damageMult?: number;
  attackRateMult?: number;
  projectileSpeedMult?: number;
}

export class EnemyEntity implements Targetable {
  scene: Phaser.Scene;
  sprite: Phaser.GameObjects.Sprite;
  private hpBarGfx: Phaser.GameObjects.Graphics;
  private telegraphGfx: Phaser.GameObjects.Graphics;

  targetId = 0;
  def: EnemyDefinition;
  behavior: EnemyBehavior = 'straight';
  active = false;
  hp = 0;
  maxHp = 0;
  shieldHp = 0;
  maxShieldHp = 0;
  damage = 10;
  radius = 20;
  scoreReward = 100;

  private age = 0;
  private rewardGranted = false;
  private difficultyMult = 1;
  private attackRateMult = 1;
  private projectileSpeedMult = 1;
  private phaseOffset = 0;
  private strafeDir = 1;
  private vx = 0;
  private vy = 0;
  private formationTargetY = 175;
  private diveTriggered = false;
  private divePullout = false;

  // Dynamic attack & burst state (ticked inside update for zero timer leaks)
  private fireTimerMs = 0;
  private windupMs = 0;
  private attackCycle = 0;
  private burstRemaining = 0;
  private burstDelayMs = 0;
  private burstAngle = Math.PI / 2;
  private burstMode: 'scout_tap' | 'fighter_tap' | 'tank_layer' | 'elite_track' | 'sniper_tap' | 'interceptor_tap' =
    'scout_tap';

  // Rail sniper sightline lock & phase-weave state
  private sniperAimX = 0;
  private sniperAimY = 0;
  private sniperAimLocked = false;
  private anchorX = 0;

  // Smooth evasive maneuver state
  private evadeTimerMs = 0;
  private evadeCooldownMs = 0;
  private evadeVx = 0;

  // Paralyze / Stun status state (Lightning Evolution II)
  private paralyzeTimerMs = 0;
  private paralyzeImmunityMs = 0;
  private paralyzeNextImmunityMs = 0;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.def = ENEMY_CONFIGS.scout;
    this.sprite = scene.add.sprite(-200, -200, 'enemy_scout').setDepth(9);
    this.hpBarGfx = scene.add.graphics().setDepth(12);
    this.telegraphGfx = scene.add.graphics().setDepth(10);
    this.sprite.setActive(false).setVisible(false);
  }

  get x(): number {
    return this.sprite.x;
  }

  get y(): number {
    return this.sprite.y;
  }

  setActive(v: boolean): this {
    this.active = v;
    this.sprite.setActive(v);
    return this;
  }

  setVisible(v: boolean): this {
    this.sprite.setVisible(v);
    return this;
  }

  spawn(
    enemyClass: EnemyClass,
    x: number,
    y: number,
    behavior?: EnemyBehavior,
    difficultyMult = 1,
    mods?: EnemySpawnModifiers
  ): void {
    this.targetId = allocateTargetId();
    this.def = ENEMY_CONFIGS[enemyClass];
    this.behavior = behavior ?? this.def.defaultBehavior;
    this.difficultyMult = Math.max(0.75, difficultyMult);
    this.attackRateMult = Math.max(0.65, Math.min(2.0, mods?.attackRateMult ?? 1));
    this.projectileSpeedMult = Math.max(0.75, Math.min(1.6, mods?.projectileSpeedMult ?? 1));
    const hpScale = Math.max(0.5, mods?.hpMult ?? 1);
    const dmgScale = Math.max(0.5, mods?.damageMult ?? 1);

    this.active = true;
    this.rewardGranted = false;
    this.age = 0;
    this.phaseOffset = Math.random() * Math.PI * 2;
    this.strafeDir = x < this.scene.scale.width * 0.5 ? 1 : -1;
    this.vx = 0;
    this.vy = this.def.speed * 0.65;
    this.diveTriggered = false;
    this.divePullout = false;
    this.formationTargetY = 115 + Math.random() * 135;

    this.maxHp = Math.max(1, Math.round(this.def.maxHp * this.difficultyMult * hpScale));
    this.hp = this.maxHp;
    this.maxShieldHp = this.def.shieldHp
      ? Math.round(this.def.shieldHp * (0.9 + this.difficultyMult * 0.12) * hpScale)
      : 0;
    this.shieldHp = this.maxShieldHp;
    this.damage = Math.max(1, Math.round(this.def.damage * (0.9 + this.difficultyMult * 0.1) * dmgScale));
    this.radius = this.def.radius;
    this.scoreReward = this.def.scoreReward;

    const cdScale = Math.max(0.58, (1 - (this.difficultyMult - 1) * 0.14) / this.attackRateMult);
    this.fireTimerMs = (550 + Math.random() * (this.def.fireCooldownMs * 0.7)) * cdScale;
    this.windupMs = 0;
    this.attackCycle = Math.floor(Math.random() * 3);
    this.burstRemaining = 0;
    this.burstDelayMs = 0;
    this.sniperAimX = x;
    this.sniperAimY = this.scene.scale.height;
    this.sniperAimLocked = false;
    this.anchorX = x;
    this.evadeTimerMs = 0;
    this.evadeCooldownMs = 1200 + Math.random() * 1200;
    this.evadeVx = 0;
    this.paralyzeTimerMs = 0;
    this.paralyzeImmunityMs = 0;
    this.paralyzeNextImmunityMs = 0;

    this.sprite.setTexture(this.def.textureKey);
    this.sprite.setPosition(x, y);
    this.sprite.clearTint().setTintMode(Phaser.TintModes.MULTIPLY);
    this.sprite.setRotation(0);
    this.sprite.setScale(1);
    this.sprite.setAlpha(1);
    this.sprite.setActive(true).setVisible(true);
    this.hpBarGfx.clear();
    this.telegraphGfx.clear();
  }

  applyParalyze(baseDurationSec: number): boolean {
    if (!this.active || this.paralyzeTimerMs > 0 || this.paralyzeImmunityMs > 0) {
      return false;
    }
    const isHeavyOrElite =
      this.def.id === 'tank' ||
      this.def.id === 'elite' ||
      this.def.id === 'bastion' ||
      this.def.id === 'harbinger' ||
      this.def.id === 'splitter';
    const resistMult = isHeavyOrElite ? WEAPON_RUNTIME_TUNING.lightning.evo2EliteResistance : 1;
    this.paralyzeTimerMs = Math.max(220, Math.round(baseDurationSec * 1000 * resistMult));
    this.paralyzeNextImmunityMs = isHeavyOrElite
      ? WEAPON_RUNTIME_TUNING.lightning.evo2EliteImmunityMs
      : WEAPON_RUNTIME_TUNING.lightning.evo2StunImmunityMs;
    this.evadeTimerMs = 0;
    return true;
  }

  takeDamage(amount: number): boolean {
    if (!this.active) return false;
    let hullDamage = amount;
    if (this.shieldHp > 0) {
      const absorbed = Math.min(this.shieldHp, amount);
      this.shieldHp -= absorbed;
      hullDamage = amount - absorbed;
      this.sprite.setTint(0x6ee7b7).setTintMode(Phaser.TintModes.FILL);
    } else {
      this.sprite.setTint(0xffffff).setTintMode(Phaser.TintModes.FILL);
    }
    this.hp -= hullDamage;
    this.scene.time.delayedCall(55, () => {
      if (this.active && this.sprite.active) {
        this.sprite.clearTint().setTintMode(Phaser.TintModes.MULTIPLY);
      }
    });

    // Agile craft reactively trigger an evasive side-jink when taking hits (fair cooldown)
    if (
      this.hp > 0 &&
      this.evadeCooldownMs <= 0 &&
      (this.def.id === 'scout' ||
        this.def.id === 'elite' ||
        this.def.id === 'interceptor' ||
        this.def.id === 'harbinger' ||
        this.behavior === 'evasive')
    ) {
      this.triggerEvasiveDash(this.sprite.x < this.scene.scale.width * 0.5 ? 1 : -1);
    }

    if (this.hp <= 0) {
      this.hp = 0;
      this.deactivate();
      return true;
    }
    return false;
  }

  claimKillReward(): boolean {
    if (this.rewardGranted || this.hp > 0) return false;
    this.rewardGranted = true;
    return true;
  }

  private triggerEvasiveDash(dir: number): void {
    const isAce = this.def.id === 'elite' || this.def.id === 'harbinger';
    this.evadeTimerMs = isAce ? 320 : 250;
    this.evadeCooldownMs = isAce ? 2100 : 2900;
    this.evadeVx = dir * this.def.speed * (isAce ? 1.85 : 1.55);
  }

  update(dt: number, playerX: number, playerY: number, projectiles: ProjectileManager): void {
    if (!this.active) return;
    this.age += dt;
    const dtMs = dt * 1000;
    const spd = this.def.speed;
    const w = this.scene.scale.width;
    const h = this.scene.scale.height;

    this.evadeCooldownMs = Math.max(0, this.evadeCooldownMs - dtMs);

    if (this.paralyzeTimerMs > 0) {
      this.paralyzeTimerMs -= dtMs;
      const damp = 1 - Math.exp(-14 * dt);
      this.vx = Phaser.Math.Linear(this.vx, 0, damp);
      this.vy = Phaser.Math.Linear(this.vy, 0, damp);
      this.sprite.x = Phaser.Math.Clamp(this.sprite.x + this.vx * dt, 30, w - 30);
      this.sprite.y += this.vy * dt;

      this.telegraphGfx.clear();
      this.drawParalyzeFx(this.telegraphGfx, this.sprite.x, this.sprite.y, this.radius);

      if (this.paralyzeTimerMs <= 0) {
        this.paralyzeTimerMs = 0;
        this.paralyzeImmunityMs = this.paralyzeNextImmunityMs;
      }

      this.drawHealthBars();
      if (this.sprite.y > h + 65) {
        this.deactivate();
      }
      return;
    }

    this.paralyzeImmunityMs = Math.max(0, this.paralyzeImmunityMs - dtMs);

    // 1. Compute smooth target velocity (targetVx, targetVy) based on AI behavior
    let targetVx = 0;
    let targetVy = spd;
    let steerRate = 6.5;

    const dxToPlayer = playerX - this.sprite.x;
    const dyToPlayer = playerY - this.sprite.y;

    switch (this.behavior) {
      case 'straight': {
        // Armored units glide with subtle tactical sway and briefly brace when winding up
        targetVx = Math.sin(this.age * 1.4 + this.phaseOffset) * 28;
        const windupSlow = this.def.id === 'tank' && this.fireTimerMs < 460 ? 0.35 : 1;
        targetVy = spd * windupSlow;
        steerRate = 5.0;
        break;
      }
      case 'zigzag': {
        const wave = Math.sin(this.age * 3.1 + this.phaseOffset);
        targetVx = wave * spd * 1.12;
        targetVy = spd * (0.76 + 0.16 * Math.abs(Math.cos(this.age * 3.1 + this.phaseOffset)));
        steerRate = 7.5;
        break;
      }
      case 'sine': {
        targetVx = Math.cos(this.age * 2.1 + this.phaseOffset) * spd * 1.15;
        targetVy = spd * 0.78;
        steerRate = 5.5;
        break;
      }
      case 'diving': {
        if (!this.diveTriggered && this.sprite.y > h * 0.22) {
          this.diveTriggered = true;
        }
        if (this.diveTriggered && !this.divePullout) {
          targetVx = Phaser.Math.Clamp(dxToPlayer * 1.55, -spd * 1.05, spd * 1.05);
          targetVy = spd * 1.42;
          steerRate = 6.0;
          if (this.def.id === 'bomber' && this.sprite.y > h * 0.56) {
            // Bombers smoothly pull up & flank out after dive payload
            this.divePullout = true;
          }
        } else if (this.divePullout) {
          targetVx = this.strafeDir * spd * 1.15;
          targetVy = spd * 0.45;
          steerRate = 5.0;
        } else {
          targetVx = Math.sin(this.age * 2 + this.phaseOffset) * 45;
          targetVy = spd * 0.88;
        }
        break;
      }
      case 'formation': {
        if (this.sprite.y < this.formationTargetY) {
          targetVx = Math.sin(this.age * 1.6 + this.phaseOffset) * 35;
          targetVy = spd * 1.05;
        } else if (this.age < 7.2) {
          // Hold tactical line with smooth back-and-forth depth oscillation
          targetVx = Math.cos(this.age * 1.7 + this.phaseOffset) * 95;
          targetVy = Math.sin(this.age * 2.3 + this.phaseOffset) * 26 + 14;
        } else {
          targetVx = Math.cos(this.age * 1.5 + this.phaseOffset) * 75;
          targetVy = spd * 0.72;
        }
        steerRate = 5.2;
        break;
      }
      case 'tracking': {
        targetVx = Phaser.Math.Clamp(dxToPlayer * 1.45, -spd * 0.95, spd * 0.95);
        if (this.sprite.y < this.formationTargetY) {
          targetVy = spd * 0.9;
        } else if (dyToPlayer < 165) {
          // Tactically back up to maintain ranged engagement space
          targetVy = -spd * 0.48;
        } else {
          targetVy = 22 + Math.sin(this.age * 2.6 + this.phaseOffset) * 42;
        }
        steerRate = 6.8;
        break;
      }
      case 'flank_sweep': {
        if (this.sprite.x > w - 64) this.strafeDir = -1;
        else if (this.sprite.x < 64) this.strafeDir = 1;
        targetVx = this.strafeDir * spd * 1.18;
        targetVy = spd * (0.55 + 0.25 * Math.sin(this.age * 2.5 + this.phaseOffset));
        steerRate = 5.4;
        break;
      }
      case 'orbit_harass': {
        if (this.sprite.y < this.formationTargetY) {
          targetVx = Math.sin(this.age * 2 + this.phaseOffset) * 65;
          targetVy = spd * 0.95;
        } else {
          targetVx = Math.cos(this.age * 2.3 + this.phaseOffset) * spd * 1.1;
          targetVy = Math.sin(this.age * 2.3 + this.phaseOffset) * spd * 0.42 + (this.age > 8 ? 26 : 6);
        }
        steerRate = 5.8;
        break;
      }
      case 'retreat_strafe': {
        if (this.sprite.y < h * 0.28) {
          targetVx = Phaser.Math.Clamp(dxToPlayer * 0.8, -spd * 0.7, spd * 0.7);
          targetVy = spd * 1.05;
        } else {
          const cycle = (this.age + this.phaseOffset) % 4.0;
          targetVx = this.strafeDir * spd * 1.05;
          if (cycle < 1.8) {
            targetVy = 18;
          } else if (cycle < 2.9) {
            targetVy = -spd * 0.45; // Step back smoothly while strafing
          } else {
            targetVy = spd * 0.65;
          }
        }
        steerRate = 6.2;
        break;
      }
      case 'evasive': {
        targetVx = Math.sin(this.age * 2.9 + this.phaseOffset) * spd * 0.95;
        targetVy = this.sprite.y < this.formationTargetY ? spd * 0.9 : 34 + Math.sin(this.age * 3.5) * 32;
        if (
          this.evadeCooldownMs <= 0 &&
          Math.abs(dxToPlayer) < 42 &&
          dyToPlayer > 80 &&
          dyToPlayer < 420
        ) {
          const awayDir = dxToPlayer >= 0 ? -1 : 1;
          this.triggerEvasiveDash(awayDir);
        }
        steerRate = 8.0;
        break;
      }
      case 'rush_weave': {
        // High-speed diagonal flanker: swoops aggressively down then carves across lanes
        if (this.sprite.y < h * 0.25) {
          targetVx = Phaser.Math.Clamp(dxToPlayer * 1.4, -spd * 1.1, spd * 1.1);
          targetVy = spd * 1.15;
        } else {
          targetVx = Math.sin(this.age * 3.4 + this.phaseOffset) * spd * 1.15 + this.strafeDir * 42;
          targetVy = spd * (0.76 + 0.18 * Math.cos(this.age * 3.4 + this.phaseOffset));
        }
        steerRate = 8.5;
        break;
      }
      case 'sniper_perch': {
        // Perches at high altitude, holds steady while aiming laser sightline, then repositions
        const perchY = Math.min(165, h * 0.2);
        if (this.sprite.y < perchY - 12) {
          targetVx = Math.sin(this.age * 1.5 + this.phaseOffset) * 55;
          targetVy = spd * 1.15;
        } else if (this.fireTimerMs <= 780) {
          // Stabilize steady aim during sniper sightline telegraph
          targetVx = 0;
          targetVy = (perchY - this.sprite.y) * 1.5;
        } else {
          if (this.sprite.x > w - 85) this.strafeDir = -1;
          else if (this.sprite.x < 85) this.strafeDir = 1;
          targetVx = this.strafeDir * spd * 0.9;
          targetVy = (perchY + Math.sin(this.age * 1.8 + this.phaseOffset) * 18 - this.sprite.y) * 2.2;
        }
        steerRate = 6.5;
        break;
      }
      case 'pendulum_hover': {
        // Wide horizontal pendulum + gentle vertical Lissajous drift
        const hoverY = Math.min(210, this.formationTargetY);
        if (this.sprite.y < hoverY - 18) {
          targetVx = Math.sin(this.age * 1.8 + this.phaseOffset) * 70;
          targetVy = spd * 1.05;
        } else {
          const desiredX = w * 0.5 + Math.sin(this.age * 1.35 + this.phaseOffset) * (w * 0.34);
          targetVx = Phaser.Math.Clamp((desiredX - this.sprite.x) * 2.1, -spd * 1.2, spd * 1.2);
          targetVy =
            this.age < 9.5
              ? Math.sin(this.age * 2.7 + this.phaseOffset) * 32 + 6
              : spd * 0.68;
        }
        steerRate = 5.4;
        break;
      }
      case 'fortress_march': {
        // Slow advancing Aegis cruiser; braces smoothly when firing wave curtains
        const bracing = this.fireTimerMs < 500;
        targetVx = Math.sin(this.age * 1.15 + this.phaseOffset) * (bracing ? 18 : 44);
        targetVy = spd * (bracing ? 0.32 : 0.95);
        steerRate = 4.5;
        break;
      }
      case 'phase_weave': {
        // Harbinger tactical lane glide with periodic smooth translucent shifts
        const patrolY = Math.min(230, this.formationTargetY + 15);
        if (this.sprite.y < patrolY - 15) {
          targetVx = Math.sin(this.age * 2 + this.phaseOffset) * 65;
          targetVy = spd * 1.05;
        } else {
          const desiredX = w * 0.5 + Math.cos(this.age * 1.65 + this.phaseOffset) * (w * 0.36);
          targetVx = Phaser.Math.Clamp((desiredX - this.sprite.x) * 2.4, -spd * 1.25, spd * 1.25);
          targetVy = Math.sin(this.age * 2.4 + this.phaseOffset) * 38 + (this.age > 10 ? 28 : 8);
        }
        steerRate = 7.2;
        break;
      }
    }

    // Apply evasive lateral surge cleanly over base steering
    if (this.evadeTimerMs > 0) {
      this.evadeTimerMs -= dtMs;
      targetVx = this.evadeVx;
      targetVy *= 0.35;
      steerRate = 14.0;
    }

    // Gentle wall repulsion near horizontal edges so enemies turn smoothly before clamping
    const edgeMargin = 58;
    if (this.sprite.x < edgeMargin && targetVx < 0) {
      targetVx = Math.abs(targetVx) * 0.7 + 45;
      this.strafeDir = 1;
    } else if (this.sprite.x > w - edgeMargin && targetVx > 0) {
      targetVx = -Math.abs(targetVx) * 0.7 - 45;
      this.strafeDir = -1;
    }

    // Exponential velocity interpolation for silky-smooth motion
    const alpha = 1 - Math.exp(-steerRate * dt);
    this.vx = Phaser.Math.Linear(this.vx, targetVx, alpha);
    this.vy = Phaser.Math.Linear(this.vy, targetVy, alpha);

    this.sprite.x += this.vx * dt;
    this.sprite.y += this.vy * dt;
    this.sprite.x = Phaser.Math.Clamp(this.sprite.x, 30, w - 30);
    // Prevent retreating enemies from backing off above top edge after entering arena
    if (this.age > 0.8 && this.sprite.y < 44 && this.vy < 0) {
      this.sprite.y = 44;
      this.vy = Math.max(0, this.vy);
    }

    // Smooth banking tilt, scale compression & Harbinger phase-shift shimmer
    const targetRot = Phaser.Math.Clamp(-this.vx / Math.max(260, spd * 2.6), -0.26, 0.26);
    this.sprite.setRotation(Phaser.Math.Linear(this.sprite.rotation, targetRot, Math.min(1, 12 * dt)));
    const bankScaleX = 1 - Math.min(0.12, Math.abs(this.vx) / Math.max(800, spd * 6));
    this.sprite.setScale(bankScaleX, 1);
    if (this.def.id === 'harbinger' || this.behavior === 'phase_weave') {
      const targetAlpha = this.evadeTimerMs > 0 ? 0.45 : 1;
      this.sprite.setAlpha(Phaser.Math.Linear(this.sprite.alpha, targetAlpha, Math.min(1, 12 * dt)));
    }

    // 2. Active multi-round burst progression
    if (this.burstRemaining > 0) {
      this.burstDelayMs -= dtMs;
      if (this.burstDelayMs <= 0) {
        this.fireBurstStep(playerX, playerY, projectiles);
      }
    }

    // 3. Attack cooldown & readable windup telegraph (with Rail Sniper laser sightline & Bastion shield arc)
    this.telegraphGfx.clear();

    if (this.shieldHp > 0) {
      const shieldAlpha = 0.35 + 0.2 * Math.sin(this.age * 5);
      this.telegraphGfx.lineStyle(2.5, 0x34d399, shieldAlpha);
      this.telegraphGfx.beginPath();
      this.telegraphGfx.arc(this.sprite.x, this.sprite.y + 4, this.radius + 7, 0.2, Math.PI - 0.2);
      this.telegraphGfx.strokePath();
    }

    if (this.sprite.y > 32 && this.sprite.y < h * 0.74) {
      this.fireTimerMs -= dtMs;

      if (this.def.id === 'sniper') {
        const sniperWindup = 760;
        if (this.fireTimerMs <= sniperWindup && this.fireTimerMs > 0) {
          if (this.fireTimerMs > 220) {
            this.sniperAimX = Phaser.Math.Linear(this.sniperAimX, playerX, Math.min(1, 6.5 * dt));
            this.sniperAimY = Phaser.Math.Linear(this.sniperAimY, playerY, Math.min(1, 6.5 * dt));
            this.sniperAimLocked = false;
          } else {
            this.sniperAimLocked = true;
          }
          const pulse = 1 - this.fireTimerMs / sniperWindup;
          const aimAng = Math.atan2(this.sniperAimY - (this.sprite.y + 18), this.sniperAimX - this.sprite.x);
          const endX = this.sprite.x + Math.cos(aimAng) * 760;
          const endY = this.sprite.y + 18 + Math.sin(aimAng) * 760;
          this.telegraphGfx.lineStyle(
            this.sniperAimLocked ? 2.4 : 1.4,
            this.sniperAimLocked ? 0xf43f5e : 0x818cf8,
            0.35 + pulse * 0.55
          );
          this.telegraphGfx.lineBetween(this.sprite.x, this.sprite.y + 18, endX, endY);
          this.telegraphGfx.strokeCircle(this.sprite.x, this.sprite.y + 18, 6 + pulse * 6);
        }
      } else {
        const windupWindow =
          this.def.id === 'tank' ||
          this.def.id === 'elite' ||
          this.def.id === 'bastion' ||
          this.def.id === 'harbinger' ||
          this.def.id === 'splitter'
            ? 420
            : 300;
        if (this.fireTimerMs <= windupWindow && this.fireTimerMs > 0) {
          this.windupMs = this.fireTimerMs;
          const pulse = 1 - this.windupMs / windupWindow;
          this.telegraphGfx.lineStyle(1.6, this.def.accentColor, 0.8 * pulse);
          this.telegraphGfx.strokeCircle(this.sprite.x, this.sprite.y + 14, 7 + pulse * 9);
        }
      }

      if (this.fireTimerMs <= 0) {
        const cdScale = Math.max(0.58, (1 - (this.difficultyMult - 1) * 0.14) / this.attackRateMult);
        this.fireTimerMs = this.def.fireCooldownMs * cdScale;
        this.fireAttack(playerX, playerY, projectiles);
      }
    }

    // 4. Health & Shield bar when damaged or shielded
    this.drawHealthBars();

    if (this.sprite.y > h + 65) {
      this.deactivate();
    }
  }

  private drawParalyzeFx(gfx: Phaser.GameObjects.Graphics, cx: number, cy: number, radius: number): void {
    const r = radius + 6;
    gfx.lineStyle(1.6, 0x22d3ee, 0.72);
    gfx.strokeCircle(cx, cy, r);
    // Crackling lightning arcs jittering around stunned hull
    for (let a = 0; a < 3; a++) {
      const ang1 = (Math.PI * 2 * a) / 3 + this.age * 16 + Math.random() * 0.6;
      const ang2 = ang1 + 0.9 + Math.random() * 0.5;
      const x1 = cx + Math.cos(ang1) * (r * 0.65);
      const y1 = cy + Math.sin(ang1) * (r * 0.65);
      const xm = cx + Math.cos((ang1 + ang2) * 0.5) * (r * 1.15);
      const ym = cy + Math.sin((ang1 + ang2) * 0.5) * (r * 1.15);
      const x2 = cx + Math.cos(ang2) * (r * 0.7);
      const y2 = cy + Math.sin(ang2) * (r * 0.7);
      gfx.lineStyle(2.4, 0x38bdf8, 0.75);
      gfx.lineBetween(x1, y1, xm, ym);
      gfx.lineBetween(xm, ym, x2, y2);
      gfx.lineStyle(1.1, 0xffffff, 0.95);
      gfx.lineBetween(x1, y1, xm, ym);
      gfx.lineBetween(xm, ym, x2, y2);
    }
  }

  private drawHealthBars(): void {
    this.hpBarGfx.clear();
    if (this.hp < this.maxHp || this.shieldHp > 0) {
      const bw = 38;
      if (this.hp < this.maxHp) {
        const ratio = Math.max(0, this.hp / this.maxHp);
        this.hpBarGfx.fillStyle(0x0f172a, 0.85);
        this.hpBarGfx.fillRect(this.sprite.x - bw / 2, this.sprite.y - this.radius - 10, bw, 4);
        this.hpBarGfx.fillStyle(this.def.accentColor, 1);
        this.hpBarGfx.fillRect(this.sprite.x - bw / 2, this.sprite.y - this.radius - 10, bw * ratio, 4);
      }
      if (this.maxShieldHp > 0 && this.shieldHp > 0) {
        const sRatio = Math.max(0, this.shieldHp / this.maxShieldHp);
        const syBar = this.sprite.y - this.radius - (this.hp < this.maxHp ? 15 : 10);
        this.hpBarGfx.fillStyle(0x064e3b, 0.85);
        this.hpBarGfx.fillRect(this.sprite.x - bw / 2, syBar, bw, 3);
        this.hpBarGfx.fillStyle(0x34d399, 1);
        this.hpBarGfx.fillRect(this.sprite.x - bw / 2, syBar, bw * sRatio, 3);
      }
    }
  }

  private fireBurstStep(playerX: number, playerY: number, projectiles: ProjectileManager): void {
    const sx = this.sprite.x;
    const sy = this.sprite.y + 16;
    const spd = this.def.projectileSpeed * this.projectileSpeedMult;
    const dmg = this.damage;

    if (this.burstMode === 'scout_tap') {
      projectiles.spawnEnemyBullet(
        sx,
        sy,
        Math.cos(this.burstAngle) * (spd + 25),
        Math.sin(this.burstAngle) * (spd + 25),
        Math.round(dmg * 0.9)
      );
      this.burstRemaining--;
      this.burstDelayMs = 140;
    } else if (this.burstMode === 'fighter_tap') {
      const ang = Math.atan2(playerY - sy, playerX - sx);
      projectiles.spawnEnemyBullet(sx, sy, Math.cos(ang) * spd, Math.sin(ang) * spd, dmg);
      this.burstRemaining--;
      this.burstDelayMs = 155;
    } else if (this.burstMode === 'tank_layer') {
      [-0.22, 0, 0.22].forEach((off) => {
        const ang = Math.PI / 2 + off;
        projectiles.spawnEnemyBullet(
          sx,
          sy,
          Math.cos(ang) * (spd + 20),
          Math.sin(ang) * (spd + 20),
          dmg,
          'proj_enemy_bomb',
          8,
          0xa855f7
        );
      });
      this.burstRemaining--;
      this.burstDelayMs = 240;
    } else if (this.burstMode === 'elite_track') {
      const ang = Math.atan2(playerY - sy, playerX - sx);
      projectiles.spawnEnemyBullet(
        sx,
        sy,
        Math.cos(ang) * (spd + 30),
        Math.sin(ang) * (spd + 30),
        dmg,
        'proj_enemy_bolt',
        7,
        0xf43f5e
      );
      this.burstRemaining--;
      this.burstDelayMs = 125;
    } else if (this.burstMode === 'sniper_tap') {
      projectiles.spawnEnemyBullet(
        sx,
        sy,
        Math.cos(this.burstAngle) * (spd + 20),
        Math.sin(this.burstAngle) * (spd + 20),
        Math.round(dmg * 0.9),
        'proj_enemy_shard',
        6,
        0x818cf8
      );
      this.burstRemaining--;
      this.burstDelayMs = 150;
    } else if (this.burstMode === 'interceptor_tap') {
      [-0.14, 0.14].forEach((off) => {
        const ang = this.burstAngle + off;
        projectiles.spawnEnemyBullet(
          sx,
          sy,
          Math.cos(ang) * (spd + 15),
          Math.sin(ang) * (spd + 15),
          Math.round(dmg * 0.88),
          'proj_enemy_shard',
          6,
          0x22d3ee
        );
      });
      this.burstRemaining--;
      this.burstDelayMs = 140;
    }
  }

  private fireAttack(playerX: number, playerY: number, projectiles: ProjectileManager): void {
    const sx = this.sprite.x;
    const sy = this.sprite.y + 16;
    const spd = this.def.projectileSpeed * this.projectileSpeedMult;
    const dmg = this.damage;
    const cycle = this.attackCycle++;

    if (
      this.def.id === 'sniper' ||
      this.def.id === 'bomber' ||
      this.def.id === 'splitter' ||
      this.def.id === 'bastion' ||
      this.def.id === 'elite' ||
      this.def.id === 'harbinger'
    ) {
      SoundManager.playEnemyFire(this.def.id);
    }

    switch (this.def.id) {
      case 'scout': {
        if (cycle % 2 === 0 || this.difficultyMult < 1.1) {
          this.burstAngle = Math.PI / 2 + Phaser.Math.Clamp((playerX - sx) * 0.0012, -0.22, 0.22);
          projectiles.spawnEnemyBullet(sx, sy, Math.cos(this.burstAngle) * spd, Math.sin(this.burstAngle) * spd, dmg);
          if (this.difficultyMult >= 1.15) {
            this.burstMode = 'scout_tap';
            this.burstRemaining = 1;
            this.burstDelayMs = 140;
          }
        } else {
          // Flanking dual angled dart
          const base = Math.atan2(playerY - sy, playerX - sx);
          const clamped = Phaser.Math.Clamp(base, Math.PI / 2 - 0.55, Math.PI / 2 + 0.55);
          projectiles.spawnEnemyBullet(sx, sy, Math.cos(clamped) * (spd + 15), Math.sin(clamped) * (spd + 15), dmg);
        }
        break;
      }

      case 'interceptor': {
        const base = Phaser.Math.Clamp(
          Math.atan2(playerY - sy, playerX - sx),
          Math.PI / 2 - 0.52,
          Math.PI / 2 + 0.52
        );
        if (cycle % 2 === 0) {
          // Twin V-dart salvo with quick follow-up burst
          [-0.14, 0.14].forEach((off) => {
            projectiles.spawnEnemyBullet(
              sx,
              sy,
              Math.cos(base + off) * spd,
              Math.sin(base + off) * spd,
              dmg,
              'proj_enemy_shard',
              6,
              0x22d3ee
            );
          });
          if (this.difficultyMult >= 1.25) {
            this.burstAngle = base;
            this.burstMode = 'interceptor_tap';
            this.burstRemaining = 1;
            this.burstDelayMs = 140;
          }
        } else {
          // 3-way diagonal cross-slash
          [-0.24, 0, 0.24].forEach((off) => {
            projectiles.spawnEnemyBullet(
              sx,
              sy,
              Math.cos(base + off) * (spd + 10),
              Math.sin(base + off) * (spd + 10),
              Math.round(dmg * 0.9),
              'proj_enemy_shard',
              6,
              0x67e8f9
            );
          });
        }
        break;
      }

      case 'fighter': {
        const ang = Math.atan2(playerY - sy, playerX - sx);
        if (cycle % 2 === 0) {
          // Aimed double-tap burst
          projectiles.spawnEnemyBullet(sx, sy, Math.cos(ang) * spd, Math.sin(ang) * spd, dmg);
          this.burstMode = 'fighter_tap';
          this.burstRemaining = 1;
          this.burstDelayMs = 155;
        } else if (this.difficultyMult >= 1.2) {
          // Twin V-split aimed wing bolts
          [-0.13, 0.13].forEach((off) => {
            projectiles.spawnEnemyBullet(
              sx,
              sy,
              Math.cos(ang + off) * spd,
              Math.sin(ang + off) * spd,
              Math.round(dmg * 0.9)
            );
          });
        } else {
          projectiles.spawnEnemyBullet(sx - 10, sy, Math.cos(ang) * spd, Math.sin(ang) * spd, dmg);
          projectiles.spawnEnemyBullet(sx + 10, sy, Math.cos(ang) * spd, Math.sin(ang) * spd, dmg);
        }
        break;
      }

      case 'sniper': {
        const ang = Math.atan2(this.sniperAimY - (sy + 2), this.sniperAimX - sx);
        projectiles.spawnEnemyBullet(
          sx,
          sy + 2,
          Math.cos(ang) * spd,
          Math.sin(ang) * spd,
          dmg,
          'proj_enemy_shard',
          6,
          0x818cf8,
          { scale: 1.18 }
        );
        if (this.difficultyMult >= 1.35) {
          this.burstAngle = ang;
          this.burstMode = 'sniper_tap';
          this.burstRemaining = 1;
          this.burstDelayMs = 150;
        }
        this.strafeDir = sx < this.scene.scale.width * 0.5 ? 1 : -1;
        this.sniperAimLocked = false;
        break;
      }

      case 'bomber': {
        if (cycle % 2 === 0) {
          // 6-way (or 8-way at high diff) rotating radial bomb ring
          const count = this.difficultyMult >= 1.45 ? 8 : 6;
          const rotOff = (cycle * 0.35) % (Math.PI * 2);
          for (let i = 0; i < count; i++) {
            const ang = (Math.PI * 2 * i) / count + rotOff;
            projectiles.spawnEnemyBullet(
              sx,
              sy,
              Math.cos(ang) * spd,
              Math.sin(ang) * spd,
              dmg,
              'proj_enemy_bomb',
              9
            );
          }
        } else {
          // Divergent carpet bomb salvo (curved spread downward)
          [-1, 0, 1].forEach((lane) => {
            projectiles.spawnEnemyBullet(
              sx + lane * 14,
              sy,
              lane * 55,
              spd * 0.95,
              dmg,
              'proj_enemy_bomb',
              9,
              0xf97316,
              { ax: lane * 38, ay: 30 }
            );
          });
        }
        break;
      }

      case 'splitter': {
        if (cycle % 2 === 0) {
          // Splitting Prism Orb: bursts mid-flight into 4 radial or 5 aimed fan shards
          const ang = Phaser.Math.Clamp(
            Math.atan2(playerY - sy, playerX - sx),
            Math.PI / 2 - 0.45,
            Math.PI / 2 + 0.45
          );
          projectiles.spawnEnemyBullet(
            sx,
            sy,
            Math.cos(ang) * spd,
            Math.sin(ang) * spd,
            dmg,
            'proj_enemy_splitter',
            10,
            0xfacc15,
            {
              splitAfterSec: 0.72,
              splitCount: this.difficultyMult >= 1.45 ? 5 : 4,
              splitSpeed: 265,
              splitSpreadRad: this.difficultyMult >= 1.45 ? 1.55 : 0,
              splitTextureKey: 'proj_enemy_shard',
              splitTint: 0xfef08a,
              splitDamage: Math.round(dmg * 0.78),
              spinRate: 4.8,
            }
          );
        } else {
          // Twin angled mini-splitters + center shard
          [-0.28, 0.28].forEach((off) => {
            const ang = Math.PI / 2 + off;
            projectiles.spawnEnemyBullet(
              sx,
              sy,
              Math.cos(ang) * (spd * 1.05),
              Math.sin(ang) * (spd * 1.05),
              dmg,
              'proj_enemy_splitter',
              9,
              0xf97316,
              {
                splitAfterSec: 0.62,
                splitCount: 3,
                splitSpeed: 250,
                splitSpreadRad: 1.15,
                splitTextureKey: 'proj_enemy_shard',
                splitTint: 0xfdba74,
                splitDamage: Math.round(dmg * 0.72),
                spinRate: 4.5,
                scale: 0.9,
              }
            );
          });
        }
        break;
      }

      case 'tank': {
        if (cycle % 2 === 0) {
          // Heavy 3-shot forward burst
          [-0.26, 0, 0.26].forEach((off) => {
            const ang = Math.PI / 2 + off;
            projectiles.spawnEnemyBullet(sx, sy, Math.cos(ang) * spd, Math.sin(ang) * spd, dmg);
          });
        } else {
          // Layered 2-beat suppression salvo (4-wide then 3-tight)
          [-0.36, -0.12, 0.12, 0.36].forEach((off) => {
            const ang = Math.PI / 2 + off;
            projectiles.spawnEnemyBullet(
              sx,
              sy,
              Math.cos(ang) * (spd * 0.92),
              Math.sin(ang) * (spd * 0.92),
              Math.round(dmg * 0.9)
            );
          });
          this.burstMode = 'tank_layer';
          this.burstRemaining = 1;
          this.burstDelayMs = 240;
        }
        break;
      }

      case 'bastion': {
        if (cycle % 2 === 0) {
          // Crisscrossing Aegis Wave Curtain (two counter-phased weaving lanes)
          [-1, 0, 1].forEach((lane) => {
            const wavePhase = lane % 2 === 0 ? 0 : Math.PI;
            projectiles.spawnEnemyBullet(
              sx + lane * 18,
              sy,
              lane * 28,
              spd,
              dmg,
              'proj_enemy_bolt',
              7,
              0x10b981,
              {
                waveAmp: 82,
                waveFreq: 5.2,
                wavePhase,
              }
            );
          });
        } else {
          // Gentle Homing Aegis Seeker flanked by twin emerald bolts
          const ang = Math.atan2(playerY - sy, playerX - sx);
          projectiles.spawnEnemyBullet(
            sx,
            sy,
            Math.cos(ang) * 245,
            Math.sin(ang) * 245,
            dmg,
            'proj_enemy_seeker',
            8,
            0x34d399,
            {
              homingTurnRate: 1.55,
              homingDelay: 0.16,
              homingDuration: 1.45,
            }
          );
          [-0.24, 0.24].forEach((off) => {
            projectiles.spawnEnemyBullet(
              sx,
              sy,
              Math.cos(Math.PI / 2 + off) * spd,
              Math.sin(Math.PI / 2 + off) * spd,
              Math.round(dmg * 0.85),
              'proj_enemy_bolt',
              7,
              0x10b981
            );
          });
        }
        break;
      }

      case 'elite': {
        const sub = cycle % 3;
        if (sub === 0) {
          // Aimed spread fan (3-way, expanding to 5-way on higher difficulties)
          const base = Math.atan2(playerY - sy, playerX - sx);
          const offsets =
            this.difficultyMult >= 1.4
              ? [-0.34, -0.17, 0, 0.17, 0.34]
              : [-0.24, 0, 0.24];
          offsets.forEach((off) => {
            const ang = base + off;
            projectiles.spawnEnemyBullet(
              sx,
              sy,
              Math.cos(ang) * spd,
              Math.sin(ang) * spd,
              dmg,
              'proj_enemy_bolt',
              7,
              0xf43f5e
            );
          });
        } else if (sub === 1) {
          // 3-round rapid tracking burst while moving
          const ang = Math.atan2(playerY - sy, playerX - sx);
          projectiles.spawnEnemyBullet(
            sx,
            sy,
            Math.cos(ang) * (spd + 25),
            Math.sin(ang) * (spd + 25),
            dmg,
            'proj_enemy_bolt',
            7,
            0xf43f5e
          );
          this.burstMode = 'elite_track';
          this.burstRemaining = 2;
          this.burstDelayMs = 125;
        } else {
          // 6-orb curving spiral ring with generous dodge lanes
          const spinSign = cycle % 2 === 0 ? 1 : -1;
          for (let i = 0; i < 6; i++) {
            const ang = (Math.PI * 2 * i) / 6 + this.phaseOffset;
            projectiles.spawnEnemyBullet(
              sx,
              sy,
              Math.cos(ang) * (spd * 0.68),
              Math.sin(ang) * (spd * 0.68),
              Math.round(dmg * 0.9),
              'proj_enemy_bomb',
              8,
              0xf43f5e,
              { turnRate: spinSign * 0.65, turnDuration: 0.65 }
            );
          }
        }
        break;
      }

      case 'harbinger': {
        const sub = cycle % 3;
        if (sub === 0) {
          // Combination: Dual Homing Void Seekers + Center Precision Shard
          const ang = Math.atan2(playerY - sy, playerX - sx);
          projectiles.spawnEnemyBullet(
            sx,
            sy,
            Math.cos(ang) * (spd + 70),
            Math.sin(ang) * (spd + 70),
            dmg,
            'proj_enemy_shard',
            6,
            0xfef08a
          );
          [-26, 26].forEach((dx, idx) => {
            const sAng = Math.PI / 2 + (idx === 0 ? -0.35 : 0.35);
            projectiles.spawnEnemyBullet(
              sx + dx,
              sy,
              Math.cos(sAng) * 255,
              Math.sin(sAng) * 255,
              Math.round(dmg * 0.92),
              'proj_enemy_seeker',
              8,
              0xe879f9,
              {
                homingTurnRate: 1.75,
                homingDelay: 0.15,
                homingDuration: 1.55,
              }
            );
          });
        } else if (sub === 1) {
          // Crisscrossing X-Grid Geometric Curtain
          [-0.32, -0.1, 0.1, 0.32].forEach((off, idx) => {
            const ang = Math.PI / 2 + off;
            projectiles.spawnEnemyBullet(
              sx,
              sy,
              Math.cos(ang) * (spd * 0.88),
              Math.sin(ang) * (spd * 0.88),
              Math.round(dmg * 0.9),
              'proj_enemy_bolt',
              7,
              0xf43f5e,
              {
                waveAmp: 90,
                waveFreq: 6.0,
                wavePhase: idx % 2 === 0 ? 0 : Math.PI,
              }
            );
          });
        } else {
          // Splitting Singularity Orb + Flanking Shards
          projectiles.spawnEnemyBullet(
            sx,
            sy,
            0,
            235,
            dmg,
            'proj_enemy_splitter',
            10,
            0xe879f9,
            {
              splitAfterSec: 0.68,
              splitCount: 6,
              splitSpeed: 260,
              splitTextureKey: 'proj_enemy_shard',
              splitTint: 0xf43f5e,
              splitDamage: Math.round(dmg * 0.8),
              spinRate: 5.5,
            }
          );
          [-0.3, 0.3].forEach((off) => {
            const ang = Math.PI / 2 + off;
            projectiles.spawnEnemyBullet(
              sx,
              sy,
              Math.cos(ang) * spd,
              Math.sin(ang) * spd,
              Math.round(dmg * 0.85),
              'proj_enemy_shard',
              6,
              0xe879f9
            );
          });
        }
        break;
      }
    }
  }

  deactivate(): void {
    this.active = false;
    this.burstRemaining = 0;
    this.sprite.setActive(false).setVisible(false);
    this.hpBarGfx.clear();
    this.telegraphGfx.clear();
  }

  destroy(): void {
    this.sprite.destroy();
    this.hpBarGfx.destroy();
    this.telegraphGfx.destroy();
  }
}
