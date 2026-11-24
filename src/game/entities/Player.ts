import Phaser from 'phaser';
import { ECONOMY_CAPS } from '../config/EconomyConfig';
import {
  EquipmentRarityEffect,
  RarityEffectTrigger,
} from '../config/EquipmentConfig';
import { GAME_CONSTANTS } from '../config/GameConfig';
import {
  applyEndlessUpgradeStep,
  createEmptyEndlessBonuses,
  type EndlessBonusState,
  type EndlessUpgradeStatId,
} from '../config/GameModeConfig';
import { SHIPS } from '../config/ShipConfig';
import {
  getWeaponFireRateAtLevel,
  SpecialDefinition,
  SpecialId,
  SPECIAL_ATTACKS,
  WeaponId,
  WEAPONS,
} from '../config/WeaponConfig';
import {
  getWeaponEvolutionStage,
  WEAPON_RUNTIME_TUNING,
} from '../config/WeaponEvolutionConfig';
import { SoundManager } from '../audio/SoundManager';
import { ComputedPlayerStats } from '../systems/ProgressionManager';
import { DamageSource, PassiveSystem } from '../systems/PassiveSystem';
import { EventBus } from '../utils/EventBus';
import { GameSettings, StorageManager } from '../utils/StorageManager';
import { BeamHitMeta, ProjectileManager } from './ProjectileManager';
import { allocateEnemyAttackId, Targetable } from './Targetable';

export interface PrismActiveModifiers {
  damagePct: number;
  fireRatePct: number;
  damageReductionPct: number;
  shieldRegenPct: number;
  pickupRangePx: number;
  creditBonusPct: number;
}

export interface SpecialActivatedPayload {
  id: SpecialId;
  damage: number;
  def: SpecialDefinition;
}

interface ActiveRarityTempBuff {
  effect: EquipmentRarityEffect;
  remainingMs: number;
}

export class Player {
  scene: Phaser.Scene;
  sprite: Phaser.GameObjects.Sprite;
  private shieldGfx: Phaser.GameObjects.Graphics;
  private thrusterGfx: Phaser.GameObjects.Graphics;

  stats: ComputedPlayerStats;
  hp: number;
  maxHp: number;
  shield: number;
  maxShield: number;

  weaponId: WeaponId = 'plasma';
  specialId: SpecialId = 'emp_nova';
  weaponLevels: Record<WeaponId, number>;
  allowedWeapons: WeaponId[] | null = null;

  private vx = 0;
  private vy = 0;
  private fireTimerMs = 0;
  private dashTimerMs = 0;
  private dashCooldownMs = 0;
  private dashDirX = 0;
  private dashDirY = -1;
  private specialCooldownMs = 0;
  private invulnTimerMs = 0;
  private powerupInvulnMs = 0;
  private rapidFireMs = 0;
  private doubleDamageMs = 0;
  private timeSinceHitMs = 0;
  private afterimageTimerMs = 0;
  private passiveSystem: PassiveSystem | null = null;

  // Gear Rarity Effect runtime state (ICD gated, capped)
  private equippedRarityEffects: EquipmentRarityEffect[] = [];
  private rarityEffectCooldowns: Map<string, number> = new Map();
  private activeRarityBuffs: ActiveRarityTempBuff[] = [];
  private onRarityProc?: (label: string, colorHex: string) => void;

  // Prism Drone single-mode active buff state
  private prismModifiers: PrismActiveModifiers | null = null;

  // Temporary Endless Survival Upgrade Draft bonuses (strictly per-session, reset on run end)
  private endlessBonuses: EndlessBonusState = createEmptyEndlessBonuses();
  private endlessUpgradeCount = 0;

  // Evolution II proc & barrage runtime timers
  private plasmaBurstCooldownMs = 0;
  private heavyMissileCooldownMs = 0;
  private dualBarrageActiveMs = 0;
  private dualBarrageCooldownMs = 0;
  private dualBarrageShotTimerMs = 0;
  private lastWeaponActionId = 0;
  private beamSoundCooldownMs = 0;

  autoFire = true;
  private dragPointerId: number | null = null;
  private lastDragX = 0;
  private lastDragY = 0;
  private dragTargetX = 0;
  private dragTargetY = 0;
  private cachedSettings: GameSettings;
  private settingsUnsub?: () => void;
  private dirScratch = { x: 0, y: 0 };

  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private keys!: {
    W: Phaser.Input.Keyboard.Key;
    A: Phaser.Input.Keyboard.Key;
    S: Phaser.Input.Keyboard.Key;
    D: Phaser.Input.Keyboard.Key;
    SPACE: Phaser.Input.Keyboard.Key;
    SHIFT: Phaser.Input.Keyboard.Key;
    E: Phaser.Input.Keyboard.Key;
  };

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    weapon: WeaponId,
    special: SpecialId,
    stats: ComputedPlayerStats,
    weaponLevels: Record<WeaponId, number>,
    allowedWeapons: WeaponId[] | null = null,
    equippedRarityEffects: EquipmentRarityEffect[] = [],
    onRarityProc?: (label: string, colorHex: string) => void
  ) {
    this.scene = scene;
    this.stats = stats;
    this.maxHp = stats.maxHp;
    this.hp = stats.maxHp;
    this.maxShield = stats.maxShield;
    this.shield = stats.maxShield;
    this.weaponLevels = weaponLevels;
    this.allowedWeapons = allowedWeapons;
    this.weaponId = allowedWeapons && !allowedWeapons.includes(weapon) ? allowedWeapons[0] : weapon;
    this.specialId = special;
    this.equippedRarityEffects = equippedRarityEffects;
    this.onRarityProc = onRarityProc;

    const shipDef = SHIPS[stats.shipId] ?? SHIPS.falcon_x;
    this.thrusterGfx = scene.add.graphics().setDepth(9);
    this.sprite = scene.add.sprite(x, y, shipDef.textureKey).setDepth(10);
    this.shieldGfx = scene.add.graphics().setDepth(11);
    this.dragTargetX = x;
    this.dragTargetY = y;
    this.cachedSettings = { ...StorageManager.load().settings };
    this.settingsUnsub = EventBus.on('settings:updated', (next) => {
      this.cachedSettings = { ...next };
    });

    if (scene.input.keyboard) {
      this.cursors = scene.input.keyboard.createCursorKeys();
      this.keys = {
        W: scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W),
        A: scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A),
        S: scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S),
        D: scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D),
        SPACE: scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE),
        SHIFT: scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SHIFT),
        E: scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.E),
      };
    }
  }

  get x(): number {
    return this.sprite.x;
  }

  get y(): number {
    return this.sprite.y;
  }

  get radius(): number {
    return 16;
  }

  getTimeSinceHitMs(): number {
    return this.timeSinceHitMs;
  }

  setPassiveSystem(ps: PassiveSystem | null): void {
    this.passiveSystem = ps;
  }

  setPrismActiveModifiers(mods: PrismActiveModifiers | null): void {
    this.prismModifiers = mods;
  }

  get weaponLevel(): number {
    return this.weaponLevels[this.weaponId] ?? 1;
  }

  private sumTempBuff(
    field:
      | 'tempDamagePct'
      | 'tempFireRatePct'
      | 'tempCritDamagePct'
      | 'tempDamageReductionPct'
      | 'tempShieldRegenPct'
      | 'tempMoveSpeedPct'
  ): number {
    let total = 0;
    for (let i = 0; i < this.activeRarityBuffs.length; i++) {
      total += this.activeRarityBuffs[i].effect[field] ?? 0;
    }
    return total;
  }

  private triggerRarityEffects(trigger: RarityEffectTrigger): void {
    if (this.equippedRarityEffects.length === 0) return;
    for (let i = 0; i < this.equippedRarityEffects.length; i++) {
      const eff = this.equippedRarityEffects[i];
      if (eff.trigger !== trigger) continue;
      if ((this.rarityEffectCooldowns.get(eff.id) ?? 0) > 0) continue;

      this.rarityEffectCooldowns.set(eff.id, eff.cooldownMs);

      if (eff.shieldRestore) {
        this.restoreShield(eff.shieldRestore);
      }
      if (eff.hpRestore) {
        this.healHp(eff.hpRestore);
      }
      if (eff.specialCdTrimMs) {
        this.specialCooldownMs = Math.max(0, this.specialCooldownMs - eff.specialCdTrimMs);
      }
      if (eff.dashCdTrimMs) {
        this.dashCooldownMs = Math.max(0, this.dashCooldownMs - eff.dashCdTrimMs);
      }
      if (eff.durationMs && eff.durationMs > 0) {
        const existing = this.activeRarityBuffs.find((b) => b.effect.id === eff.id);
        if (existing) {
          existing.remainingMs = eff.durationMs;
        } else {
          this.activeRarityBuffs.push({ effect: eff, remainingMs: eff.durationMs });
        }
      }

      if (trigger !== 'on_kill') {
        this.onRarityProc?.(eff.label.toUpperCase(), '#38BDF8');
      }
    }
  }

  notifyCritLanded(): void {
    this.triggerRarityEffects('on_crit');
  }

  notifyEnemyKilled(): void {
    this.triggerRarityEffects('on_kill');
  }

  notifyPowerUpCollected(): void {
    this.triggerRarityEffects('on_pickup');
  }

  getEndlessBonuses(): EndlessBonusState {
    return { ...this.endlessBonuses };
  }

  getEndlessUpgradeCount(): number {
    return this.endlessUpgradeCount;
  }

  applyEndlessUpgrade(statId: EndlessUpgradeStatId): number {
    const { nextState, appliedDelta } = applyEndlessUpgradeStep(this.endlessBonuses, statId);
    this.endlessBonuses = nextState;
    if (appliedDelta > 0) {
      this.endlessUpgradeCount += 1;
    }
    // Recompute Max HP / Max Shield strictly WITHOUT restoring current HP or Shield
    if (statId === 'max_hp') {
      this.maxHp = Math.max(10, Math.round(this.stats.maxHp * (1 + this.endlessBonuses.max_hp)));
      this.hp = Math.min(this.maxHp, this.hp);
      this.passiveSystem?.syncHpState(this.hp, this.maxHp);
    } else if (statId === 'max_shield') {
      this.maxShield = Math.max(0, Math.round(this.stats.maxShield * (1 + this.endlessBonuses.max_shield)));
      this.shield = Math.min(this.maxShield, this.shield);
    }
    return appliedDelta;
  }

  getEffectiveCritChance(): number {
    return Math.min(
      0.8,
      this.stats.critChance +
        this.endlessBonuses.crit_chance +
        (this.passiveSystem?.getCritChanceBonus() ?? 0)
    );
  }

  getEffectiveCritDamageMult(): number {
    return (
      this.stats.critDamageMult +
      this.endlessBonuses.crit_damage +
      this.sumTempBuff('tempCritDamagePct') / 100
    );
  }

  getEffectiveFireRateMult(): number {
    const tempFire = this.sumTempBuff('tempFireRatePct');
    const prismFire = this.prismModifiers?.fireRatePct ?? 0;
    return (
      this.stats.fireRateMult *
      (1 + this.endlessBonuses.fire_rate) *
      (1 + Math.min(0.45, (tempFire + prismFire) / 100)) *
      (this.rapidFireMs > 0 ? 1.75 : 1)
    );
  }

  getWeaponBaseDamageMult(): number {
    return this.stats.damageMult * (1 + this.endlessBonuses.weapon_damage);
  }

  getNormalDamageMult(): number {
    const tempDmg = this.sumTempBuff('tempDamagePct');
    const prismDmg = this.prismModifiers?.damagePct ?? 0;
    return (
      this.stats.damageMult *
      (1 + this.endlessBonuses.weapon_damage) *
      (1 + Math.min(0.5, (tempDmg + prismDmg) / 100)) *
      (this.doubleDamageMs > 0 ? 2 : 1)
    );
  }

  getEffectiveDamageReduction(): number {
    const extraDr =
      (this.sumTempBuff('tempDamageReductionPct') + (this.prismModifiers?.damageReductionPct ?? 0)) / 100;
    return Math.min(0.6, Math.max(0, this.stats.damageReduction + extraDr));
  }

  getEffectiveShieldRegenMult(): number {
    const extraRegen =
      (this.sumTempBuff('tempShieldRegenPct') + (this.prismModifiers?.shieldRegenPct ?? 0)) / 100;
    return Math.min(2.8, Math.max(0.5, this.stats.shieldRegenMult + extraRegen));
  }

  getEffectiveMoveSpeed(): number {
    const tempSpd = this.sumTempBuff('tempMoveSpeedPct');
    return Math.round(
      this.stats.moveSpeed *
        (1 + this.endlessBonuses.move_speed) *
        (1 + Math.min(0.35, tempSpd / 100))
    );
  }

  getEffectiveSpecialDamageMultiplier(): number {
    return this.stats.specialDamageMultiplier * (1 + this.endlessBonuses.special_damage);
  }

  getEffectiveSpecialCooldownMult(): number {
    // Respect global system cooldown floor (0.55)
    return Math.max(
      0.55,
      this.stats.specialCooldownMult * (1 - this.endlessBonuses.special_cooldown)
    );
  }

  getEffectivePickupRadiusBonus(): number {
    return this.stats.pickupRadiusBonus + (this.prismModifiers?.pickupRangePx ?? 0);
  }

  getEffectiveCreditBonusMult(): number {
    const prismCredit = (this.prismModifiers?.creditBonusPct ?? 0) / 100;
    return Math.min(ECONOMY_CAPS.maxCreditBonusMult, Math.max(1, this.stats.creditBonusMult + prismCredit));
  }

  isWantingFire(): boolean {
    return this.autoFire || Boolean(this.keys && this.keys.SPACE.isDown);
  }

  isInvulnerable(): boolean {
    return this.invulnTimerMs > 0 || this.powerupInvulnMs > 0 || this.dashTimerMs > 0;
  }

  isSuperInvulnerable(): boolean {
    return this.powerupInvulnMs > 0;
  }

  isDraggingPointer(pointerId: number): boolean {
    return this.dragPointerId === pointerId;
  }

  startDrag(pointerId: number, x: number, y: number): void {
    if (this.dragPointerId !== null) return;
    this.dragPointerId = pointerId;
    this.lastDragX = x;
    this.lastDragY = y;
    this.dragTargetX = this.sprite.x;
    this.dragTargetY = this.sprite.y;
  }

  moveDrag(pointerId: number, x: number, y: number): void {
    if (this.dragPointerId !== pointerId) return;
    const sensitivity = this.cachedSettings.controlSensitivity ?? 1.2;
    const dx = (x - this.lastDragX) * sensitivity;
    const dy = (y - this.lastDragY) * sensitivity;
    this.lastDragX = x;
    this.lastDragY = y;

    const padX = 28;
    const padTop = 74;
    const padBottom = 56;
    this.dragTargetX = Phaser.Math.Clamp(
      this.dragTargetX + dx,
      padX,
      Math.max(padX, this.scene.scale.width - padX)
    );
    this.dragTargetY = Phaser.Math.Clamp(
      this.dragTargetY + dy,
      padTop,
      Math.max(padTop, this.scene.scale.height - padBottom)
    );
  }

  endDrag(pointerId?: number): void {
    if (pointerId !== undefined && this.dragPointerId !== pointerId) return;
    this.dragPointerId = null;
    this.dragTargetX = this.sprite.x;
    this.dragTargetY = this.sprite.y;
    this.vx = 0;
    this.vy = 0;
  }

  setWeapon(weapon: WeaponId): boolean {
    if (this.allowedWeapons && !this.allowedWeapons.includes(weapon)) {
      return false;
    }
    if (this.weaponId !== weapon) {
      this.dualBarrageActiveMs = 0;
      this.beamSoundCooldownMs = 0;
    }
    this.weaponId = weapon;
    return true;
  }

  setSpecial(special: SpecialId): void {
    this.specialId = special;
  }

  healHp(amount: number): number {
    if (amount <= 0) return 0;
    const prevDisplayed = Math.ceil(this.hp);
    this.hp = Math.min(this.maxHp, this.hp + amount);
    this.passiveSystem?.syncHpState(this.hp, this.maxHp);
    return Math.max(0, Math.ceil(this.hp) - prevDisplayed);
  }

  restoreShield(amount: number): number {
    if (amount <= 0 || this.maxShield <= 0) return 0;
    const prevDisplayed = Math.ceil(this.shield);
    this.shield = Math.min(this.maxShield, this.shield + amount);
    return Math.max(0, Math.ceil(this.shield) - prevDisplayed);
  }

  rollCrit(): { isCrit: boolean; mult: number } {
    const isCrit = Math.random() < this.getEffectiveCritChance();
    return {
      isCrit,
      mult: isCrit ? this.getEffectiveCritDamageMult() : 1,
    };
  }

  triggerDash(): boolean {
    if (this.dashCooldownMs > 0 || this.dashTimerMs > 0) return false;
    const dir = this.getInputDirection();
    if (dir.x !== 0 || dir.y !== 0) {
      this.dashDirX = dir.x;
      this.dashDirY = dir.y;
    } else if (this.dragPointerId !== null && Math.hypot(this.vx, this.vy) > 25) {
      this.dashDirX = this.vx;
      this.dashDirY = this.vy;
    } else {
      this.dashDirX = 0;
      this.dashDirY = -1;
    }
    const len = Math.hypot(this.dashDirX, this.dashDirY) || 1;
    this.dashDirX /= len;
    this.dashDirY /= len;

    this.dashTimerMs = GAME_CONSTANTS.DASH_DURATION_MS;
    this.dashCooldownMs = Math.round(GAME_CONSTANTS.DASH_COOLDOWN_MS * this.stats.dashCooldownMult);
    this.passiveSystem?.onPlayerDash();
    this.triggerRarityEffects('on_dash');
    SoundManager.playDash();
    return true;
  }

  tryTriggerSpecial(
    projectiles: ProjectileManager,
    targets: Targetable[],
    onHitTarget: (t: Targetable, dmg: number, isCrit?: boolean, hitMeta?: BeamHitMeta) => void,
    onCameraShake: (intensity: number) => void,
    onSpecialActivated?: (payload: SpecialActivatedPayload) => void
  ): boolean {
    if (this.specialCooldownMs > 0) return false;
    const spec = SPECIAL_ATTACKS[this.specialId];
    this.specialCooldownMs = Math.round(spec.cooldownMs * this.getEffectiveSpecialCooldownMult());
    const dmgBase = Math.round(spec.damage * this.getEffectiveSpecialDamageMultiplier());
    const specialMeta: BeamHitMeta = {
      source: 'special',
      firingActionId: 0,
      countsForFiringAction: false,
    };

    SoundManager.playSpecial(this.specialId);
    onCameraShake(0.012);

    if (this.specialId === 'emp_nova') {
      projectiles.clearEnemyBullets();
      const radius = spec.radiusPx ?? 520;
      const ring = this.scene.add.circle(this.x, this.y, 18, spec.colorNum, 0.16).setDepth(15);
      ring.setStrokeStyle(4, 0x7dd3fc, 0.95);
      this.scene.tweens.add({
        targets: ring,
        scaleX: 22,
        scaleY: 22,
        alpha: 0,
        duration: 480,
        ease: 'Cubic.easeOut',
        onComplete: () => ring.destroy(),
      });
      targets.forEach((t) => {
        if (!t.active) return;
        const d = Math.hypot(t.x - this.x, t.y - this.y);
        if (d <= radius) {
          const crit = this.rollCrit();
          onHitTarget(t, Math.round(dmgBase * crit.mult), crit.isCrit, specialMeta);
        }
      });
    } else if (this.specialId === 'chrono_singularity') {
      const pulse = this.scene.add.circle(this.x, this.y, 24, spec.colorNum, 0.14).setDepth(15);
      pulse.setStrokeStyle(3.5, 0xe9d5ff, 0.95);
      this.scene.tweens.add({
        targets: pulse,
        scaleX: 28,
        scaleY: 28,
        alpha: 0,
        duration: 540,
        ease: 'Cubic.easeOut',
        onComplete: () => pulse.destroy(),
      });
      targets.forEach((t) => {
        if (!t.active) return;
        const crit = this.rollCrit();
        onHitTarget(t, Math.round(dmgBase * crit.mult), crit.isCrit, specialMeta);
      });
    }

    onSpecialActivated?.({
      id: this.specialId,
      damage: dmgBase,
      def: spec,
    });

    this.passiveSystem?.onPlayerSpecialActivated();
    this.triggerRarityEffects('on_special');
    return true;
  }

  applyPowerUp(type: string): { amountRestored: number; durationSec: number; isFull: boolean } {
    switch (type) {
      case 'health': {
        const wasFull = this.hp >= this.maxHp;
        const restored = this.healHp(35);
        return { amountRestored: restored, durationSec: 0, isFull: wasFull || restored === 0 };
      }
      case 'shield': {
        const wasFull = this.maxShield <= 0 || this.shield >= this.maxShield;
        const restored = this.restoreShield(45);
        return { amountRestored: restored, durationSec: 0, isFull: wasFull || restored === 0 };
      }
      case 'rapid_fire':
        this.rapidFireMs = 8000;
        return { amountRestored: 0, durationSec: 8, isFull: false };
      case 'double_damage':
        this.doubleDamageMs = 8000;
        return { amountRestored: 0, durationSec: 8, isFull: false };
      case 'invulnerability':
        this.powerupInvulnMs = 6000;
        return { amountRestored: 0, durationSec: 6, isFull: false };
      default:
        return { amountRestored: 0, durationSec: 0, isFull: false };
    }
  }

  takeDamage(amount: number, attackId?: number): boolean {
    if (this.isInvulnerable()) return false;

    const resolvedAttackId = attackId ?? allocateEnemyAttackId();
    const prevHp = this.hp;
    const prevShield = this.shield;
    const effectiveDr = this.getEffectiveDamageReduction();

    let mitigated = Math.max(1, Math.round(amount * (1 - effectiveDr)));
    if (this.passiveSystem) {
      const drRes = this.passiveSystem.computeIncomingPlayerDamage({
        rawAmount: amount,
        attackId: resolvedAttackId,
        prevShield,
        equipmentDR: effectiveDr,
      });
      if (drRes.duplicated) return false;
      mitigated = drRes.mitigatedDamage;
    }

    this.timeSinceHitMs = 0;
    this.invulnTimerMs = GAME_CONSTANTS.INVULN_HIT_MS;

    let remaining = mitigated;
    let absorbedByShield = 0;
    if (this.shield > 0) {
      absorbedByShield = Math.min(this.shield, remaining);
      this.shield -= absorbedByShield;
      remaining -= absorbedByShield;
    }
    if (remaining > 0) {
      this.hp = Math.max(0, this.hp - remaining);
      SoundManager.playPlayerDamage();
    } else if (absorbedByShield > 0) {
      SoundManager.playShieldHit();
    }
    this.sprite.setTint(0xff4d6d).setTintMode(Phaser.TintModes.FILL);
    this.scene.time.delayedCall(95, () => {
      if (this.sprite.active) this.sprite.clearTint().setTintMode(Phaser.TintModes.MULTIPLY);
    });

    this.triggerRarityEffects('on_hit');
    if (prevShield > 0 && this.shield <= 0) {
      this.triggerRarityEffects('on_shield_break');
    }

    this.passiveSystem?.onPlayerDamagedPostApply({
      prevHp,
      newHp: this.hp,
      maxHp: this.maxHp,
      prevShield,
      newShield: this.shield,
      maxShield: this.maxShield,
      actualDamageTaken: mitigated,
    });
    return true;
  }

  private getInputDirection(): { x: number; y: number } {
    let ix = 0;
    let iy = 0;

    if (this.cursors && this.keys) {
      if (this.cursors.left.isDown || this.keys.A.isDown) ix -= 1;
      if (this.cursors.right.isDown || this.keys.D.isDown) ix += 1;
      if (this.cursors.up.isDown || this.keys.W.isDown) iy -= 1;
      if (this.cursors.down.isDown || this.keys.S.isDown) iy += 1;
    }

    const len = Math.hypot(ix, iy);
    if (len > 1) {
      ix /= len;
      iy /= len;
    }
    this.dirScratch.x = ix;
    this.dirScratch.y = iy;
    return this.dirScratch;
  }

  update(
    dt: number,
    projectiles: ProjectileManager,
    targets: Targetable[],
    onInstantHit: (t: Targetable, dmg: number, isCrit?: boolean, hitMeta?: BeamHitMeta) => void,
    onSpecialUsed: () => void,
    onCameraShake: (intensity: number) => void,
    onStunApplied?: (t: Targetable) => void,
    onSpecialActivated?: (payload: SpecialActivatedPayload) => void
  ): void {
    const dtMs = dt * 1000;
    this.fireTimerMs = Math.max(0, this.fireTimerMs - dtMs);
    this.dashCooldownMs = Math.max(0, this.dashCooldownMs - dtMs);
    this.specialCooldownMs = Math.max(0, this.specialCooldownMs - dtMs);
    this.invulnTimerMs = Math.max(0, this.invulnTimerMs - dtMs);
    this.powerupInvulnMs = Math.max(0, this.powerupInvulnMs - dtMs);
    this.rapidFireMs = Math.max(0, this.rapidFireMs - dtMs);
    this.doubleDamageMs = Math.max(0, this.doubleDamageMs - dtMs);
    this.plasmaBurstCooldownMs = Math.max(0, this.plasmaBurstCooldownMs - dtMs);
    this.heavyMissileCooldownMs = Math.max(0, this.heavyMissileCooldownMs - dtMs);
    this.dualBarrageCooldownMs = Math.max(0, this.dualBarrageCooldownMs - dtMs);
    this.beamSoundCooldownMs = Math.max(0, this.beamSoundCooldownMs - dtMs);
    this.timeSinceHitMs += dtMs;

    // Tick rarity effect ICDs & active temporary buffs
    this.rarityEffectCooldowns.forEach((rem, key) => {
      const next = rem - dtMs;
      if (next <= 0) this.rarityEffectCooldowns.delete(key);
      else this.rarityEffectCooldowns.set(key, next);
    });
    for (let i = this.activeRarityBuffs.length - 1; i >= 0; i--) {
      this.activeRarityBuffs[i].remainingMs -= dtMs;
      if (this.activeRarityBuffs[i].remainingMs <= 0) {
        this.activeRarityBuffs.splice(i, 1);
      }
    }

    // Passive shield recharge after delay
    if (
      this.maxShield > 0 &&
      this.timeSinceHitMs >= GAME_CONSTANTS.SHIELD_REGEN_DELAY_MS &&
      this.shield < this.maxShield
    ) {
      this.shield = Math.min(
        this.maxShield,
        this.shield + GAME_CONSTANTS.SHIELD_REGEN_PER_SEC * this.getEffectiveShieldRegenMult() * dt
      );
    }

    // Keyboard edge triggers
    if (this.keys) {
      if (Phaser.Input.Keyboard.JustDown(this.keys.SHIFT)) {
        this.triggerDash();
      }
      if (Phaser.Input.Keyboard.JustDown(this.keys.E)) {
        if (
          this.tryTriggerSpecial(
            projectiles,
            targets,
            onInstantHit,
            onCameraShake,
            onSpecialActivated
          )
        ) {
          onSpecialUsed();
        }
      }
    }

    const followSpeed = Phaser.Math.Linear(48, 18, this.cachedSettings.movementSmoothing ?? 0.7);
    const speedCap = this.getEffectiveMoveSpeed();

    // Movement
    if (this.dashTimerMs > 0) {
      this.dashTimerMs = Math.max(0, this.dashTimerMs - dtMs);
      this.vx = this.dashDirX * GAME_CONSTANTS.DASH_SPEED;
      this.vy = this.dashDirY * GAME_CONSTANTS.DASH_SPEED;
      this.sprite.x += this.vx * dt;
      this.sprite.y += this.vy * dt;
      if (this.dashTimerMs <= 0) {
        this.dragTargetX = this.sprite.x;
        this.dragTargetY = this.sprite.y;
      }
      if (this.cachedSettings.fxQuality !== 'low') {
        this.afterimageTimerMs -= dtMs;
        if (this.afterimageTimerMs <= 0) {
          this.afterimageTimerMs = this.cachedSettings.fxQuality === 'medium' ? 56 : 28;
          const shipDef = SHIPS[this.stats.shipId] ?? SHIPS.falcon_x;
          const ghost = this.scene.add
            .sprite(this.x, this.y, shipDef.textureKey)
            .setDepth(9)
            .setTint(shipDef.primaryColorNum)
            .setAlpha(0.45);
          this.scene.tweens.add({
            targets: ghost,
            alpha: 0,
            scaleX: 0.8,
            scaleY: 0.8,
            duration: 180,
            onComplete: () => ghost.destroy(),
          });
        }
      }
    } else if (this.dragPointerId !== null) {
      const followAlpha = 1 - Math.exp(-followSpeed * dt);
      const nextX = Phaser.Math.Linear(this.sprite.x, this.dragTargetX, followAlpha);
      const nextY = Phaser.Math.Linear(this.sprite.y, this.dragTargetY, followAlpha);
      const safeDt = Math.max(dt, 0.001);
      this.vx = Phaser.Math.Clamp((nextX - this.sprite.x) / safeDt, -speedCap * 1.65, speedCap * 1.65);
      this.vy = Phaser.Math.Clamp((nextY - this.sprite.y) / safeDt, -speedCap * 1.65, speedCap * 1.65);
      this.sprite.x = nextX;
      this.sprite.y = nextY;
    } else {
      const dir = this.getInputDirection();
      const targetVx = dir.x * speedCap;
      const targetVy = dir.y * speedCap;
      const lerpRate = 1 - Math.exp(-14 * dt);
      this.vx = Phaser.Math.Linear(this.vx, targetVx, lerpRate);
      this.vy = Phaser.Math.Linear(this.vy, targetVy, lerpRate);
      this.sprite.x += this.vx * dt;
      this.sprite.y += this.vy * dt;
      this.dragTargetX = this.sprite.x;
      this.dragTargetY = this.sprite.y;
    }

    // Screen boundary clamp
    const padX = 28;
    const padTop = 74;
    const padBottom = 56;
    const maxX = Math.max(padX, this.scene.scale.width - padX);
    const maxY = Math.max(padTop, this.scene.scale.height - padBottom);
    this.sprite.x = Phaser.Math.Clamp(this.sprite.x, padX, maxX);
    this.sprite.y = Phaser.Math.Clamp(this.sprite.y, padTop, maxY);
    this.dragTargetX = Phaser.Math.Clamp(this.dragTargetX, padX, maxX);
    this.dragTargetY = Phaser.Math.Clamp(this.dragTargetY, padTop, maxY);

    // Subtle banking tilt visual
    const tiltRatio = Phaser.Math.Clamp(this.vx / Math.max(200, speedCap), -1.2, 1.2);
    this.sprite.setScale(1 - Math.min(0.14, Math.abs(tiltRatio) * 0.1), 1);
    this.sprite.setRotation(tiltRatio * 0.14);

    // Invulnerability blink
    if (this.invulnTimerMs > 0 && this.powerupInvulnMs <= 0) {
      this.sprite.setAlpha(Math.sin(this.scene.time.now * 0.04) > 0 ? 1 : 0.35);
    } else {
      this.sprite.setAlpha(1);
    }

    // Automatic & manual firing
    const wantFire = this.isWantingFire();
    const weaponDef = WEAPONS[this.weaponId];
    const totalFireRateMult = this.getEffectiveFireRateMult();
    const dmgMult = this.getNormalDamageMult();
    const weaponStage = getWeaponEvolutionStage(this.weaponLevel);

    // Continuous Beam runs smoothly every frame while firing Energy Beam
    if (this.weaponId === 'beam') {
      if (!wantFire) {
        this.passiveSystem?.resetBeamFiringAction();
      }
      projectiles.updateContinuousBeam(dt, {
        firing: wantFire,
        x: this.x,
        y: this.y,
        weaponLevel: this.weaponLevel,
        damageMult: dmgMult,
        totalFireRateMult,
        targets,
        acquireBeamAction: (accumMs, effFireRate) =>
          this.passiveSystem?.acquireBeamFiringAction(accumMs, effFireRate) ?? {
            firingActionId: 0,
            actionDamageMult: 1,
            isCycleStart: true,
          },
        onInstantHit,
        rollCrit: () => this.rollCrit(),
      });
      if (wantFire && this.beamSoundCooldownMs <= 0) {
        this.beamSoundCooldownMs = 155;
        SoundManager.playWeaponFire('beam');
      }
    } else {
      this.passiveSystem?.resetBeamFiringAction();
      projectiles.updateContinuousBeam(dt, {
        firing: false,
        x: this.x,
        y: this.y,
        weaponLevel: this.weaponLevel,
        damageMult: dmgMult,
        totalFireRateMult,
        targets,
        onInstantHit,
        rollCrit: () => this.rollCrit(),
      });

      if (wantFire && this.fireTimerMs <= 0) {
        const baseCycleMs = getWeaponFireRateAtLevel(weaponDef, this.weaponLevel);
        this.fireTimerMs = Math.max(55, baseCycleMs / totalFireRateMult);

        const action = this.passiveSystem?.beginPlayerFiringAction() ?? {
          firingActionId: 0,
          actionDamageMult: 1,
        };
        this.lastWeaponActionId = action.firingActionId;
        const shotMeta: BeamHitMeta = {
          source: 'player_weapon' as DamageSource,
          firingActionId: action.firingActionId,
          countsForFiringAction: true,
        };

        projectiles.fireWeapon(
          this.weaponId,
          this.x,
          this.y,
          dmgMult * action.actionDamageMult,
          targets,
          (t, dmg, isCrit) => onInstantHit(t, dmg, isCrit, shotMeta),
          {
            weaponLevel: this.weaponLevel,
            source: 'player_weapon',
            firingActionId: action.firingActionId,
            countsForFiringAction: true,
            plasmaBurstProcReady: this.plasmaBurstCooldownMs <= 0,
            onPlasmaBurstTriggered: () => {
              this.plasmaBurstCooldownMs = WEAPON_RUNTIME_TUNING.plasma.evo2BurstCooldownMs;
            },
            heavyMissileProcReady: this.heavyMissileCooldownMs <= 0,
            onHeavyMissileTriggered: () => {
              this.heavyMissileCooldownMs = WEAPON_RUNTIME_TUNING.homing.evo2HeavyCooldownMs;
            },
            onLightningStunApplied: (t) => onStunApplied?.(t),
            rollCrit: () => this.rollCrit(),
          }
        );

        // Dual Laser Evolution II (Lv20): Chance to ignite Central Rapid Barrage window
        if (
          this.weaponId === 'dual_laser' &&
          weaponStage === 2 &&
          this.dualBarrageActiveMs <= 0 &&
          this.dualBarrageCooldownMs <= 0 &&
          Math.random() < WEAPON_RUNTIME_TUNING.dual_laser.evo2BarrageProcChance
        ) {
          this.dualBarrageActiveMs = WEAPON_RUNTIME_TUNING.dual_laser.evo2BarrageDurationMs;
          this.dualBarrageShotTimerMs = 0;
        }

        SoundManager.playWeaponFire(this.weaponId);
      }
    }

    // Dual Laser Evolution II: Central Rapid Barrage emitter tick
    if (this.weaponId === 'dual_laser' && weaponStage === 2 && this.dualBarrageActiveMs > 0) {
      this.dualBarrageActiveMs -= dtMs;
      if (wantFire) {
        this.dualBarrageShotTimerMs -= dtMs;
        if (this.dualBarrageShotTimerMs <= 0) {
          this.dualBarrageShotTimerMs = Math.max(
            52,
            WEAPON_RUNTIME_TUNING.dual_laser.evo2BarrageFireIntervalMs / totalFireRateMult
          );
          projectiles.fireDualCentralBarrageBolt(
            this.x,
            this.y,
            this.weaponLevel,
            dmgMult,
            () => this.rollCrit(),
            {
              source: 'player_weapon',
              firingActionId: this.lastWeaponActionId,
              countsForFiringAction: false,
            }
          );
        }
      }
      if (this.dualBarrageActiveMs <= 0) {
        this.dualBarrageActiveMs = 0;
        this.dualBarrageCooldownMs = WEAPON_RUNTIME_TUNING.dual_laser.evo2BarrageCooldownMs;
      }
    }

    this.renderAttachments();
  }

  private renderAttachments(): void {
    const shipDef = SHIPS[this.stats.shipId] ?? SHIPS.falcon_x;
    this.thrusterGfx.clear();
    const flameLen = (this.dashTimerMs > 0 ? 28 : 13) + Math.random() * 6;
    const glowColor = this.dashTimerMs > 0 ? 0x67e8f9 : shipDef.thrusterColorNum;
    this.thrusterGfx.fillStyle(glowColor, 0.85);
    this.thrusterGfx.fillTriangle(
      this.x - 11,
      this.y + 21,
      this.x - 6,
      this.y + 21,
      this.x - 8.5,
      this.y + 21 + flameLen
    );
    this.thrusterGfx.fillTriangle(
      this.x + 6,
      this.y + 21,
      this.x + 11,
      this.y + 21,
      this.x + 8.5,
      this.y + 21 + flameLen
    );

    this.shieldGfx.clear();
    if (this.powerupInvulnMs > 0) {
      const pulse = 0.65 + 0.18 * Math.sin(this.scene.time.now * 0.008);
      this.shieldGfx.lineStyle(2.5, 0x67e8f9, pulse);
      this.shieldGfx.strokeCircle(this.x, this.y, 34);
      this.shieldGfx.fillStyle(0xa855f7, 0.14);
      this.shieldGfx.fillCircle(this.x, this.y, 33);
    } else if (this.shield > 4) {
      const ratio = this.shield / Math.max(1, this.maxShield);
      this.shieldGfx.lineStyle(1.6, shipDef.primaryColorNum, 0.18 + 0.25 * ratio);
      this.shieldGfx.strokeCircle(this.x, this.y, 30);
    }

    // Dual Laser Evolution II: glowing central hyper-cannon muzzle aura while active
    if (this.weaponId === 'dual_laser' && this.dualBarrageActiveMs > 0) {
      const pulse = 0.72 + 0.28 * Math.sin(this.scene.time.now * 0.025);
      this.shieldGfx.fillStyle(0x22d3ee, 0.42 * pulse);
      this.shieldGfx.fillCircle(this.x, this.y - 24, 9);
      this.shieldGfx.fillStyle(0xecfeff, 0.9 * pulse);
      this.shieldGfx.fillCircle(this.x, this.y - 24, 4.2);
    }
  }

  getSpecialCooldownRatio(): number {
    const maxCd =
      SPECIAL_ATTACKS[this.specialId].cooldownMs * this.getEffectiveSpecialCooldownMult();
    return 1 - Math.min(1, this.specialCooldownMs / Math.max(1000, maxCd));
  }

  getSpecialCooldownLeftSec(): number {
    return Math.max(0, this.specialCooldownMs / 1000);
  }

  getDashCooldownRatio(): number {
    const maxCd = GAME_CONSTANTS.DASH_COOLDOWN_MS * this.stats.dashCooldownMult;
    return 1 - Math.min(1, this.dashCooldownMs / Math.max(400, maxCd));
  }

  getDashCooldownLeftSec(): number {
    return Math.max(0, this.dashCooldownMs / 1000);
  }

  getRapidFireSec(): number {
    return this.rapidFireMs > 0 ? Math.max(0.01, Number((this.rapidFireMs / 1000).toFixed(2))) : 0;
  }

  getDoubleDamageSec(): number {
    return this.doubleDamageMs > 0 ? Math.max(0.01, Number((this.doubleDamageMs / 1000).toFixed(2))) : 0;
  }

  getInvulnSec(): number {
    return this.powerupInvulnMs > 0 ? Math.max(0.01, Number((this.powerupInvulnMs / 1000).toFixed(2))) : 0;
  }

  destroy(): void {
    this.settingsUnsub?.();
    this.settingsUnsub = undefined;
    this.activeRarityBuffs.length = 0;
    this.rarityEffectCooldowns.clear();
    this.prismModifiers = null;
    this.sprite.destroy();
    this.shieldGfx.destroy();
    this.thrusterGfx.destroy();
  }
}
