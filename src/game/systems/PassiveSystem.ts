import { ShipId } from '../config/ShipConfig';

export type DamageSource =
  | 'player_weapon'
  | 'clone'
  | 'passive'
  | 'drone'
  | 'special'
  | 'enemy_attack'
  | 'environment';

export interface PassiveTarget {
  readonly targetId: number;
  x: number;
  y: number;
  active: boolean;
  hp: number;
  maxHp?: number;
  radius: number;
  entering?: boolean;
  invulnerable?: boolean;
}

export interface PlayerWeaponHitMeta {
  source: DamageSource;
  firingActionId: number;
  countsForFiringAction: boolean;
  isCrit: boolean;
}

export interface CloneWeaponHitMeta {
  cloneActionId: number;
  countsForFiringAction: boolean;
}

export interface PassiveCallbacks {
  getPlayerState: () => {
    x: number;
    y: number;
    hp: number;
    maxHp: number;
    shield: number;
    maxShield: number;
  };
  getWeaponBaseDamage: () => number;
  getTargets: () => PassiveTarget[];
  getScreenSize: () => { width: number; height: number };
  restoreShield: (amount: number, label?: string) => void;
  applyPassiveDamage: (target: PassiveTarget, dmg: number, label?: string) => void;
  onExplosionAoe?: (x: number, y: number, radiusPx: number, color: number, isHeavy?: boolean) => void;
  onLightningArcs?: (points: Array<{ x: number; y: number }>, color?: number) => void;
  onEnergyWave?: (x: number, y: number, radiusPx: number, color: number) => void;
  onAstralBeam?: (x: number, y: number, color: number) => void;
  onAstralShardHit?: (fromX: number, fromY: number, toX: number, toY: number) => void;
  onFloatingLabel?: (x: number, y: number, text: string, colorHex: string) => void;
}

interface ExecutionMarkEntry {
  expiresAtMs: number;
  appliedByActionId: number;
}

interface PendingAstralShard {
  delayMs: number;
  preferredTarget: PassiveTarget;
  baseDamage: number;
}

export interface PassiveDebugSnapshot {
  elapsedMs: number;
  adaptiveHits: number;
  adaptiveReady: boolean;
  reactiveArmorCharges: number;
  reactiveArmorCdMs: number;
  combatRecoveryKills: number;
  siegeBreakerHits: number;
  siegeBreakerReady: boolean;
  siegeBreakerCdMs: number;
  armorCrusherTargetId: number | null;
  armorCrusherCount: number;
  armorCrusherReady: boolean;
  apocalypseImpactCdMs: number;
  arcConductorHits: number;
  voltageStacks: number;
  overloadCircuitReady: boolean;
  overloadCircuitTimerMs: number;
  phaseCounterExpiresMs: number;
  phaseCounterCdMs: number;
  ghostDecoyRemainingMs: number;
  ghostDecoyCdMs: number;
  decoyX: number;
  decoyY: number;
  quantumEvasionCharges: number;
  quantumEvasionCdMs: number;
  shieldReformationCdMs: number;
  guardianPulseAccumulatedDmg: number;
  guardianPulseCdMs: number;
  deadlyPrecisionCdMs: number;
  executionMarkCount: number;
  deathHarvestStacks: number;
  deathHarvestExpiresMs: number;
  quantumSyncTargetId: number | null;
  quantumSyncCdMs: number;
  quantumRecoveryHits: number;
  quantumRecoveryCdMs: number;
  astralConstellationHits: number;
  astralConstellationCdMs: number;
  stellarProtectionCharges: number;
  stellarProtectionCdMs: number;
  divineJudgmentTimerMs: number;
}

const MAX_RECENT_SET_SIZE = 96;

function addToBoundedSet(set: Set<number | string>, value: number | string): void {
  set.add(value);
  if (set.size > MAX_RECENT_SET_SIZE) {
    const first = set.values().next().value;
    if (first !== undefined) {
      set.delete(first);
    }
  }
}

export function isTargetValidOnScreen(
  t: PassiveTarget,
  width: number,
  height: number
): boolean {
  if (!t.active || t.hp <= 0 || t.entering || t.invulnerable) return false;
  return t.x >= -t.radius && t.x <= width + t.radius && t.y >= -t.radius && t.y <= height + t.radius;
}

export class PassiveSystem {
  readonly shipId: ShipId;
  private cb: PassiveCallbacks;

  private elapsedMs = 0;
  private nextFiringActionId = 1;
  private nextCloneActionId = 1;

  // Hit/action deduplication sets
  private countedHitActionIds = new Set<number | string>();
  private countedCritActionIds = new Set<number | string>();
  private countedArmorCrusherPairs = new Set<number | string>();
  private overloadTriggeredActionId = 0;
  private countedCloneActionIds = new Set<number | string>();
  private processedAttackIds = new Set<number | string>();

  // Falcon X
  private adaptiveHits = 0;
  private adaptiveReady = false;
  private reactiveArmorCharges = 0;
  private reactiveArmorCdMs = 0;
  private combatRecoveryKills = 0;

  // Destroyer
  private siegeBreakerHits = 0;
  private siegeBreakerReady = false;
  private siegeBreakerCdMs = 0;
  private armorCrusherTargetId: number | null = null;
  private armorCrusherCount = 0;
  private armorCrusherWindowEndMs = 0;
  private armorCrusherReady = false;
  private armorCrusherBonusActionId = 0;
  private apocalypseImpactCdMs = 0;

  // Thunderbolt
  private arcConductorHits = 0;
  private voltageStacks = 0;
  private overloadCircuitReady = false;
  private overloadCircuitTimerMs = 10000;

  // Phantom
  private phaseCounterExpiresMs = 0;
  private phaseCounterCdMs = 0;
  private ghostDecoyRemainingMs = 0;
  private ghostDecoyCdMs = 0;
  private decoyX = 0;
  private decoyY = 0;
  private quantumEvasionCharges = 0;
  private quantumEvasionCdMs = 0;
  private wasAbove35Pct = true;

  // Aegis
  private shieldReformationCdMs = 0;
  private guardianPulseAccumulatedDmg = 0;
  private guardianPulseCdMs = 0;

  // Specter
  private deadlyPrecisionCdMs = 0;
  private executionMarks = new Map<number, ExecutionMarkEntry>();
  private executionBonusPair: { actionId: number; targetId: number } | null = null;
  private deathHarvestStacks = 0;
  private deathHarvestExpiresMs = 0;

  // Nova Prime
  private playerHitTimestamps = new Map<number, number>();
  private cloneHitTimestamps = new Map<number, number>();
  private quantumSyncTargetId: number | null = null;
  private quantumSyncCdMs = 0;
  private quantumSyncBonusAction: { actionId: number; targetId: number } | null = null;
  private quantumRecoveryHits = 0;
  private quantumRecoveryCdMs = 0;

  // Celestial
  private astralConstellationHits = 0;
  private astralConstellationPending = false;
  private astralConstellationCdMs = 0;
  private pendingAstralShards: PendingAstralShard[] = [];
  private stellarProtectionCharges = 0;
  private stellarProtectionCdMs = 0;
  private divineJudgmentTimerMs = 10000;

  // Continuous Beam firing-action pacing window (prevents tick spam)
  private beamActionAccumMs = 0;
  private currentBeamActionId = 0;
  private currentBeamActionDamageMult = 1;

  constructor(shipId: ShipId, callbacks: PassiveCallbacks) {
    this.shipId = shipId;
    this.cb = callbacks;
    const p = callbacks.getPlayerState();
    this.wasAbove35Pct = p.maxHp > 0 ? p.hp > p.maxHp * 0.35 : true;
  }

  getEnemyAimTarget(playerX: number, playerY: number): { x: number; y: number; decoyActive: boolean } {
    if (this.shipId === 'phantom' && this.ghostDecoyRemainingMs > 0) {
      return { x: this.decoyX, y: this.decoyY, decoyActive: true };
    }
    return { x: playerX, y: playerY, decoyActive: false };
  }

  getCritChanceBonus(): number {
    if (this.shipId === 'specter' && this.deathHarvestStacks > 0 && this.deathHarvestExpiresMs > 0) {
      return this.deathHarvestStacks * 0.03;
    }
    return 0;
  }

  syncHpState(hp: number, maxHp: number): void {
    if (maxHp <= 0) return;
    if (hp > maxHp * 0.35) {
      this.wasAbove35Pct = true;
    }
  }

  /**
   * Allocates a firing action ID and consumes any fire-time next-action buffs
   * (Falcon X Adaptive Combat +30%, Phantom Phase Counter +35%).
   */
  beginPlayerFiringAction(): { firingActionId: number; actionDamageMult: number } {
    const firingActionId = this.nextFiringActionId++;
    let mult = 1;

    if (this.shipId === 'falcon_x' && this.adaptiveReady) {
      this.adaptiveReady = false;
      mult *= 1.3;
    }

    if (this.shipId === 'phantom' && this.phaseCounterExpiresMs > 0) {
      this.phaseCounterExpiresMs = 0;
      mult *= 1.35;
    }

    return { firingActionId, actionDamageMult: mult };
  }

  /**
   * Continuous Beam cycle promoter: groups continuous ticks into fair firing-action units
   * so Beam never spams hit-counters or next-action buffs on every frame/tick.
   */
  acquireBeamFiringAction(
    dtMs: number,
    effectiveFireRateMult: number
  ): { firingActionId: number; actionDamageMult: number; isCycleStart: boolean } {
    const cycleWindowMs = Math.max(150, Math.round(250 / Math.max(0.5, effectiveFireRateMult)));
    this.beamActionAccumMs += dtMs;
    if (this.currentBeamActionId === 0 || this.beamActionAccumMs >= cycleWindowMs) {
      this.beamActionAccumMs = this.beamActionAccumMs >= cycleWindowMs ? 0 : this.beamActionAccumMs;
      const started = this.beginPlayerFiringAction();
      this.currentBeamActionId = started.firingActionId;
      this.currentBeamActionDamageMult = started.actionDamageMult;
      return {
        firingActionId: this.currentBeamActionId,
        actionDamageMult: this.currentBeamActionDamageMult,
        isCycleStart: true,
      };
    }
    return {
      firingActionId: this.currentBeamActionId,
      // Single-action buffs only apply once on the cycle-start unit, never repeatedly on every tick!
      actionDamageMult: 1,
      isCycleStart: false,
    };
  }

  resetBeamFiringAction(): void {
    this.beamActionAccumMs = 0;
    this.currentBeamActionId = 0;
    this.currentBeamActionDamageMult = 1;
  }

  beginCloneFiringAction(): number {
    return this.nextCloneActionId++;
  }

  update(dt: number): void {
    const dtMs = Math.max(0, dt * 1000);
    this.elapsedMs += dtMs;

    // Decrement all cooldowns cleanly (no duplicate decrements)
    if (this.reactiveArmorCdMs > 0) this.reactiveArmorCdMs = Math.max(0, this.reactiveArmorCdMs - dtMs);
    if (this.siegeBreakerCdMs > 0) this.siegeBreakerCdMs = Math.max(0, this.siegeBreakerCdMs - dtMs);
    if (this.apocalypseImpactCdMs > 0) {
      this.apocalypseImpactCdMs = Math.max(0, this.apocalypseImpactCdMs - dtMs);
    }
    if (this.phaseCounterCdMs > 0) this.phaseCounterCdMs = Math.max(0, this.phaseCounterCdMs - dtMs);
    if (this.phaseCounterExpiresMs > 0) {
      this.phaseCounterExpiresMs = Math.max(0, this.phaseCounterExpiresMs - dtMs);
    }
    if (this.ghostDecoyCdMs > 0) this.ghostDecoyCdMs = Math.max(0, this.ghostDecoyCdMs - dtMs);
    if (this.ghostDecoyRemainingMs > 0) {
      this.ghostDecoyRemainingMs = Math.max(0, this.ghostDecoyRemainingMs - dtMs);
    }
    if (this.quantumEvasionCdMs > 0) {
      this.quantumEvasionCdMs = Math.max(0, this.quantumEvasionCdMs - dtMs);
    }
    if (this.shieldReformationCdMs > 0) {
      this.shieldReformationCdMs = Math.max(0, this.shieldReformationCdMs - dtMs);
    }
    if (this.guardianPulseCdMs > 0) {
      this.guardianPulseCdMs = Math.max(0, this.guardianPulseCdMs - dtMs);
    }
    if (this.deadlyPrecisionCdMs > 0) {
      this.deadlyPrecisionCdMs = Math.max(0, this.deadlyPrecisionCdMs - dtMs);
    }
    if (this.quantumSyncCdMs > 0) this.quantumSyncCdMs = Math.max(0, this.quantumSyncCdMs - dtMs);
    if (this.quantumRecoveryCdMs > 0) {
      this.quantumRecoveryCdMs = Math.max(0, this.quantumRecoveryCdMs - dtMs);
    }
    if (this.astralConstellationCdMs > 0) {
      this.astralConstellationCdMs = Math.max(0, this.astralConstellationCdMs - dtMs);
    }
    if (this.stellarProtectionCdMs > 0) {
      this.stellarProtectionCdMs = Math.max(0, this.stellarProtectionCdMs - dtMs);
    }

    // Expire Armor Crusher window if time ran out
    if (
      this.shipId === 'destroyer' &&
      this.armorCrusherTargetId !== null &&
      this.elapsedMs > this.armorCrusherWindowEndMs
    ) {
      this.armorCrusherTargetId = null;
      this.armorCrusherCount = 0;
      this.armorCrusherReady = false;
    }

    // Thunderbolt Overload Circuit 10s cycle (pauses while ready, restarts on consumption)
    if (this.shipId === 'thunderbolt' && !this.overloadCircuitReady) {
      this.overloadCircuitTimerMs -= dtMs;
      if (this.overloadCircuitTimerMs <= 0) {
        this.overloadCircuitTimerMs = 0;
        this.overloadCircuitReady = true;
        const p = this.cb.getPlayerState();
        this.cb.onFloatingLabel?.(p.x, p.y - 26, 'OVERLOAD READY', '#FACC15');
      }
    }

    // Specter Death Harvest stack expiration + Execution Mark pruning
    if (this.shipId === 'specter') {
      if (this.deathHarvestStacks > 0 && this.deathHarvestExpiresMs > 0) {
        this.deathHarvestExpiresMs -= dtMs;
        if (this.deathHarvestExpiresMs <= 0) {
          this.deathHarvestExpiresMs = 0;
          this.deathHarvestStacks = 0;
        }
      }
      for (const [tid, entry] of this.executionMarks.entries()) {
        if (this.elapsedMs >= entry.expiresAtMs) {
          this.executionMarks.delete(tid);
        }
      }
    }

    // Nova Prime timestamp pruning
    if (this.shipId === 'nova_prime') {
      for (const [tid, ts] of this.playerHitTimestamps.entries()) {
        if (this.elapsedMs - ts > 1500) this.playerHitTimestamps.delete(tid);
      }
      for (const [tid, ts] of this.cloneHitTimestamps.entries()) {
        if (this.elapsedMs - ts > 1500) this.cloneHitTimestamps.delete(tid);
      }
    }

    // Celestial: pending Astral Constellation + sequential shards + Divine Judgment 10s
    if (this.shipId === 'celestial') {
      if (this.astralConstellationPending && this.astralConstellationCdMs <= 0) {
        this.tryDispatchAstralConstellation();
      }

      for (let i = this.pendingAstralShards.length - 1; i >= 0; i--) {
        const shard = this.pendingAstralShards[i];
        shard.delayMs -= dtMs;
        if (shard.delayMs <= 0) {
          this.pendingAstralShards.splice(i, 1);
          this.resolveAstralShardImpact(shard);
        }
      }

      if (this.divineJudgmentTimerMs > 0) {
        this.divineJudgmentTimerMs = Math.max(0, this.divineJudgmentTimerMs - dtMs);
      }
      if (this.divineJudgmentTimerMs <= 0) {
        const valid = this.getValidOnScreenTargets();
        if (valid.length > 0) {
          this.triggerDivineJudgment(valid);
          this.divineJudgmentTimerMs = 10000;
        }
      }
    }
  }

  onPlayerDash(): void {
    if (this.shipId !== 'phantom') return;
    if (this.phaseCounterCdMs > 0) return;
    this.phaseCounterCdMs = 6000;
    this.phaseCounterExpiresMs = 3000;
    const p = this.cb.getPlayerState();
    this.cb.onFloatingLabel?.(p.x, p.y - 24, 'PHASE COUNTER', '#22D3EE');
  }

  onPlayerSpecialActivated(): void {
    if (this.shipId !== 'celestial') return;
    if (this.stellarProtectionCdMs > 0) return;
    this.stellarProtectionCdMs = 10000;
    this.stellarProtectionCharges = 3;
    const p = this.cb.getPlayerState();
    this.cb.onFloatingLabel?.(p.x, p.y - 24, 'STELLAR WARD x3', '#E879F9');
  }

  /**
   * Computes multiplicative Damage Reduction capped at 0.60 and consumes 1 charge per unique attackId.
   */
  computeIncomingPlayerDamage(params: {
    rawAmount: number;
    attackId: number;
    prevShield: number;
    equipmentDR: number;
  }): { mitigatedDamage: number; finalDR: number; duplicated: boolean } {
    if (params.rawAmount <= 0) {
      return { mitigatedDamage: 0, finalDR: 0, duplicated: false };
    }
    if (this.processedAttackIds.has(params.attackId)) {
      return { mitigatedDamage: 0, finalDR: 0, duplicated: true };
    }
    addToBoundedSet(this.processedAttackIds, params.attackId);

    const activeDRs: number[] = [];
    if (params.equipmentDR > 0) {
      activeDRs.push(params.equipmentDR);
    }

    if (this.shipId === 'aegis' && params.prevShield > 0) {
      activeDRs.push(0.08);
    }

    if (this.shipId === 'falcon_x' && this.reactiveArmorCharges > 0) {
      activeDRs.push(0.2);
      this.reactiveArmorCharges -= 1;
    }

    if (this.shipId === 'phantom' && this.quantumEvasionCharges > 0) {
      activeDRs.push(0.5);
      this.quantumEvasionCharges -= 1;
    }

    if (this.shipId === 'celestial' && this.stellarProtectionCharges > 0) {
      activeDRs.push(0.25);
      this.stellarProtectionCharges -= 1;
    }

    let survivalProduct = 1;
    for (let i = 0; i < activeDRs.length; i++) {
      const dr = Math.max(0, Math.min(1, activeDRs[i]));
      survivalProduct *= 1 - dr;
    }
    const finalDR = Math.min(0.6, Math.max(0, 1 - survivalProduct));
    const mitigatedDamage = Math.max(1, Math.round(params.rawAmount * (1 - finalDR)));
    return { mitigatedDamage, finalDR, duplicated: false };
  }

  onPlayerDamagedPostApply(params: {
    prevHp: number;
    newHp: number;
    maxHp: number;
    prevShield: number;
    newShield: number;
    maxShield: number;
    actualDamageTaken: number;
  }): void {
    const p = this.cb.getPlayerState();

    // Falcon X: Reactive Armor (on hit -> 20% DR for next 2 attacks, 9s CD)
    if (this.shipId === 'falcon_x' && this.reactiveArmorCdMs <= 0) {
      this.reactiveArmorCharges = 2;
      this.reactiveArmorCdMs = 9000;
      this.cb.onFloatingLabel?.(p.x, p.y - 24, 'REACTIVE ARMOR', '#38BDF8');
    }

    // Phantom: Ghost Decoy (on hit -> spawn 2.5s decoy, 9s CD)
    if (this.shipId === 'phantom' && this.ghostDecoyCdMs <= 0) {
      this.decoyX = p.x;
      this.decoyY = p.y;
      this.ghostDecoyRemainingMs = 2500;
      this.ghostDecoyCdMs = 9000;
      this.cb.onFloatingLabel?.(p.x, p.y - 24, 'GHOST DECOY', '#22D3EE');
    }

    // Phantom: Quantum Evasion (threshold crossing >35% -> <=35% HP, 50% DR for 2 hits, 10s CD)
    if (this.shipId === 'phantom' && params.maxHp > 0) {
      const threshold = params.maxHp * 0.35;
      if (this.wasAbove35Pct && params.newHp <= threshold && params.newHp > 0) {
        if (this.quantumEvasionCdMs <= 0) {
          this.quantumEvasionCharges = 2;
          this.quantumEvasionCdMs = 10000;
          this.cb.onFloatingLabel?.(p.x, p.y - 36, 'QUANTUM EVASION', '#A5F3FC');
        }
      }
      this.wasAbove35Pct = params.newHp > threshold;
    }

    // Aegis: Shield Reformation (>0 -> 0 transition restores 15% Max Shield, 10s CD)
    if (
      this.shipId === 'aegis' &&
      params.prevShield > 0 &&
      params.newShield <= 0 &&
      params.maxShield > 0 &&
      this.shieldReformationCdMs <= 0
    ) {
      this.shieldReformationCdMs = 10000;
      const amt = Math.max(1, Math.round(params.maxShield * 0.15));
      this.cb.restoreShield(amt, 'REFORMATION');
    }

    // Aegis: Guardian Pulse (post-mitigation damage == 25% Max HP -> 80% Base Damage wave, 8s CD)
    if (this.shipId === 'aegis' && params.maxHp > 0 && params.actualDamageTaken > 0) {
      if (this.guardianPulseCdMs <= 0) {
        this.guardianPulseAccumulatedDmg += params.actualDamageTaken;
        if (this.guardianPulseAccumulatedDmg >= params.maxHp * 0.25) {
          this.guardianPulseAccumulatedDmg = 0;
          this.guardianPulseCdMs = 8000;
          this.triggerGuardianPulse();
        }
      }
    }
  }

  /**
   * Computes pre-damage hit modifiers for Player weapon hits BEFORE applying target.takeDamage.
   */
  resolvePlayerWeaponHitDamage(
    target: PassiveTarget,
    incomingDmg: number,
    meta: PlayerWeaponHitMeta
  ): number {
    if (meta.source !== 'player_weapon' || !target.active || target.entering || target.invulnerable) {
      return incomingDmg;
    }

    let mult = 1;

    // Thunderbolt: Overload Circuit (+40% on next hit, restarts 10s timer on consumption)
    if (this.shipId === 'thunderbolt') {
      if (this.overloadCircuitReady) {
        this.overloadCircuitReady = false;
        this.overloadCircuitTimerMs = 10000;
        this.overloadTriggeredActionId = meta.firingActionId;
        mult *= 1.4;
        const p = this.cb.getPlayerState();
        this.cb.onLightningArcs?.(
          [
            { x: p.x, y: p.y - 20 },
            { x: target.x, y: target.y },
          ],
          0xfacc15
        );
        this.cb.onFloatingLabel?.(target.x, target.y - 16, 'OVERLOAD!', '#FACC15');
      } else if (this.overloadTriggeredActionId === meta.firingActionId && meta.countsForFiringAction) {
        // Multi-pellet volley should NOT multiply Overload across every individual pellet/tick/bounce
      }
    }

    // Destroyer: Armor Crusher (+35% on next attack vs target after 4 hits within 3s)
    if (this.shipId === 'destroyer') {
      if (
        this.armorCrusherReady &&
        this.armorCrusherTargetId === target.targetId &&
        this.elapsedMs <= this.armorCrusherWindowEndMs
      ) {
        this.armorCrusherReady = false;
        this.armorCrusherCount = 0;
        this.armorCrusherBonusActionId = meta.firingActionId;
        mult *= 1.35;
        this.cb.onFloatingLabel?.(target.x, target.y - 16, 'CRUSH +35%', '#F97316');
      } else if (
        this.armorCrusherBonusActionId === meta.firingActionId &&
        this.armorCrusherTargetId === target.targetId
      ) {
        mult *= 1.35;
      }
    }

    // Specter: Execution Mark (+25% on next Player hit vs marked target)
    if (this.shipId === 'specter') {
      const mark = this.executionMarks.get(target.targetId);
      if (
        mark &&
        this.elapsedMs < mark.expiresAtMs &&
        meta.firingActionId !== mark.appliedByActionId
      ) {
        this.executionMarks.delete(target.targetId);
        this.executionBonusPair = { actionId: meta.firingActionId, targetId: target.targetId };
        mult *= 1.25;
        this.cb.onFloatingLabel?.(target.x, target.y - 16, 'EXECUTION +25%', '#F43F5E');
      } else if (
        this.executionBonusPair &&
        this.executionBonusPair.actionId === meta.firingActionId &&
        this.executionBonusPair.targetId === target.targetId
      ) {
        mult *= 1.25;
      }
    }

    return mult === 1 ? incomingDmg : Math.max(1, Math.round(incomingDmg * mult));
  }

  /**
   * Handles post-hit passive triggers after target.takeDamage(finalDmg) has run.
   */
  onPlayerWeaponHitPostDamage(
    target: PassiveTarget,
    finalDmg: number,
    killedByThisHit: boolean,
    meta: PlayerWeaponHitMeta
  ): void {
    const validTargetForPassives = !target.entering && !target.invulnerable;

    if (meta.source === 'player_weapon' && validTargetForPassives) {
      // 1. Firing-action deduplicated hit counters
      if (meta.countsForFiringAction && !this.countedHitActionIds.has(meta.firingActionId)) {
        addToBoundedSet(this.countedHitActionIds, meta.firingActionId);

        // Falcon X: Adaptive Combat (10 hits -> next attack +30%)
        if (this.shipId === 'falcon_x' && !this.adaptiveReady) {
          this.adaptiveHits += 1;
          if (this.adaptiveHits >= 10) {
            this.adaptiveHits = 0;
            this.adaptiveReady = true;
            const p = this.cb.getPlayerState();
            this.cb.onFloatingLabel?.(p.x, p.y - 24, 'ADAPTIVE READY', '#38BDF8');
          }
        }

        // Destroyer: Siege Breaker (every 6 hits -> next hit triggers 100% Base Damage explosion, 6s CD)
        if (this.shipId === 'destroyer') {
          if (this.siegeBreakerReady) {
            this.siegeBreakerReady = false;
            this.siegeBreakerCdMs = 6000;
            this.triggerSiegeBreakerExplosion(target.x, target.y);
          } else if (this.siegeBreakerCdMs <= 0) {
            this.siegeBreakerHits += 1;
            if (this.siegeBreakerHits >= 6) {
              this.siegeBreakerHits = 0;
              this.siegeBreakerReady = true;
              const p = this.cb.getPlayerState();
              this.cb.onFloatingLabel?.(p.x, p.y - 24, 'SIEGE BREAKER READY', '#F97316');
            }
          }
        }

        // Thunderbolt: Arc Conductor (every 8 hits -> lightning strikes up to 3 enemies for 65% Base Damage)
        if (this.shipId === 'thunderbolt') {
          this.arcConductorHits += 1;
          if (this.arcConductorHits >= 8) {
            this.arcConductorHits = 0;
            this.triggerArcConductor(target);
          }
        }

        // Celestial: Astral Constellation (every 7 hits -> 3 sequential shards, 7s CD)
        if (this.shipId === 'celestial' && this.astralConstellationCdMs <= 0 && !this.astralConstellationPending) {
          this.astralConstellationHits += 1;
          if (this.astralConstellationHits >= 7) {
            this.astralConstellationHits = 0;
            this.astralConstellationPending = true;
            this.tryDispatchAstralConstellation();
          }
        }
      }

      // 2. Per-(action, target) tracking (Destroyer Armor Crusher)
      if (this.shipId === 'destroyer') {
        const pairKey = `${meta.firingActionId}:${target.targetId}`;
        if (
          !this.countedArmorCrusherPairs.has(pairKey) &&
          this.armorCrusherBonusActionId !== meta.firingActionId
        ) {
          addToBoundedSet(this.countedArmorCrusherPairs, pairKey);
          if (
            this.armorCrusherTargetId !== target.targetId ||
            this.elapsedMs > this.armorCrusherWindowEndMs
          ) {
            this.armorCrusherTargetId = target.targetId;
            this.armorCrusherCount = 1;
            this.armorCrusherWindowEndMs = this.elapsedMs + 3000;
            this.armorCrusherReady = false;
          } else if (!this.armorCrusherReady) {
            this.armorCrusherCount += 1;
            if (this.armorCrusherCount >= 4) {
              this.armorCrusherReady = true;
              this.armorCrusherWindowEndMs = this.elapsedMs + 3000;
            }
          }
        }
      }

      // 3. Critical Hit passives
      if (meta.isCrit) {
        // Thunderbolt: Voltage Surge (5 crit hits -> 100% Base Damage wave)
        if (this.shipId === 'thunderbolt' && !this.countedCritActionIds.has(meta.firingActionId)) {
          addToBoundedSet(this.countedCritActionIds, meta.firingActionId);
          this.voltageStacks += 1;
          if (this.voltageStacks >= 5) {
            this.voltageStacks = 0;
            this.triggerVoltageSurge();
          }
        }

        // Specter: Deadly Precision (+15% of crit dmg immediately, 3s CD) & Execution Mark (4s)
        if (this.shipId === 'specter') {
          if (
            this.deadlyPrecisionCdMs <= 0 &&
            !killedByThisHit &&
            target.active &&
            target.hp > 0
          ) {
            this.deadlyPrecisionCdMs = 3000;
            const bonusDmg = Math.max(1, Math.round(finalDmg * 0.15));
            this.cb.applyPassiveDamage(target, bonusDmg, 'PRECISION');
          }

          if (target.active && target.hp > 0) {
            this.executionMarks.set(target.targetId, {
              expiresAtMs: this.elapsedMs + 4000,
              appliedByActionId: meta.firingActionId,
            });
          }
        }
      }

      // 4. Nova Prime: record Player hit timestamp for Quantum Synchronization
      if (this.shipId === 'nova_prime') {
        this.playerHitTimestamps.set(target.targetId, this.elapsedMs);
        this.tryArmQuantumSynchronization(target.targetId);
      }
    }

    // 5. Direct Kill triggers (only direct player_weapon or special; never clone or passive)
    if (killedByThisHit && (meta.source === 'player_weapon' || meta.source === 'special')) {
      this.onDirectPlayerKill(target, meta.source === 'player_weapon' && meta.isCrit);
    }
  }

  /**
   * Handles confirmed Boss defeat kill credit for kill-triggered passives
   * (called strictly once on confirmed boss death, never mid-fight phases).
   */
  onBossKilledBySource(boss: PassiveTarget, source: DamageSource, isCrit: boolean): void {
    if (source === 'player_weapon' || source === 'special') {
      this.onDirectPlayerKill(boss, source === 'player_weapon' && isCrit);
    }
  }

  private onDirectPlayerKill(target: PassiveTarget, isPlayerWeaponCrit: boolean): void {
    const p = this.cb.getPlayerState();

    // Falcon X: Combat Recovery (every 5 kills -> +8% Max Shield)
    if (this.shipId === 'falcon_x') {
      this.combatRecoveryKills += 1;
      if (this.combatRecoveryKills >= 5) {
        this.combatRecoveryKills = 0;
        if (p.maxShield > 0) {
          this.cb.restoreShield(Math.max(1, Math.round(p.maxShield * 0.08)), 'RECOVERY');
        }
      }
    }

    // Destroyer: Apocalypse Impact (on kill -> 60% Base Damage explosion, 5s CD)
    if (this.shipId === 'destroyer' && this.apocalypseImpactCdMs <= 0) {
      this.apocalypseImpactCdMs = 5000;
      const dmg = Math.max(1, Math.round(this.cb.getWeaponBaseDamage() * 0.6));
      const radius = 105;
      this.cb.onExplosionAoe?.(target.x, target.y, radius, 0xf97316, false);
      const targets = this.getValidOnScreenTargets();
      for (let i = 0; i < targets.length; i++) {
        const other = targets[i];
        if (other.targetId === target.targetId) continue;
        if (Math.hypot(other.x - target.x, other.y - target.y) <= radius + other.radius) {
          this.cb.applyPassiveDamage(other, dmg);
        }
      }
    }

    // Specter: Death Harvest (on crit kill -> +5% Max Shield + Execution Stack max 3, +3% crit each, 8s)
    if (this.shipId === 'specter' && isPlayerWeaponCrit) {
      if (p.maxShield > 0) {
        this.cb.restoreShield(Math.max(1, Math.round(p.maxShield * 0.05)), 'HARVEST');
      }
      this.deathHarvestStacks = Math.min(3, this.deathHarvestStacks + 1);
      this.deathHarvestExpiresMs = 8000;
      this.cb.onFloatingLabel?.(
        p.x,
        p.y - 26,
        `HARVEST x${this.deathHarvestStacks}`,
        '#F43F5E'
      );
    }
  }

  // ---- NOVA PRIME CLONE PIPELINE ----

  resolveCloneWeaponHitDamage(
    target: PassiveTarget,
    baseCloneDmg: number,
    meta: CloneWeaponHitMeta
  ): number {
    if (this.shipId !== 'nova_prime' || !target.active || target.entering || target.invulnerable) {
      return baseCloneDmg;
    }

    if (
      this.quantumSyncTargetId === target.targetId &&
      this.quantumSyncCdMs <= 0
    ) {
      this.quantumSyncTargetId = null;
      this.quantumSyncCdMs = 6000;
      this.playerHitTimestamps.delete(target.targetId);
      this.cloneHitTimestamps.delete(target.targetId);
      this.quantumSyncBonusAction = { actionId: meta.cloneActionId, targetId: target.targetId };
      this.cb.onFloatingLabel?.(target.x, target.y - 18, 'SYNC +50%', '#818CF8');
      return Math.max(1, Math.round(baseCloneDmg * 1.5));
    }

    if (
      this.quantumSyncBonusAction &&
      this.quantumSyncBonusAction.actionId === meta.cloneActionId &&
      this.quantumSyncBonusAction.targetId === target.targetId
    ) {
      return Math.max(1, Math.round(baseCloneDmg * 1.5));
    }

    return baseCloneDmg;
  }

  onCloneWeaponHitPostDamage(target: PassiveTarget, meta: CloneWeaponHitMeta): void {
    if (this.shipId !== 'nova_prime' || target.entering || target.invulnerable) return;

    // 1. Quantum Synchronization timestamp
    this.cloneHitTimestamps.set(target.targetId, this.elapsedMs);
    this.tryArmQuantumSynchronization(target.targetId);

    // 2. Quantum Recovery (every 4 Clone firing actions hitting >=1 enemy -> +3% Max Shield, 8s CD)
    if (
      meta.countsForFiringAction &&
      !this.countedCloneActionIds.has(meta.cloneActionId) &&
      this.quantumRecoveryCdMs <= 0
    ) {
      addToBoundedSet(this.countedCloneActionIds, meta.cloneActionId);
      this.quantumRecoveryHits += 1;
      if (this.quantumRecoveryHits >= 4) {
        this.quantumRecoveryHits = 0;
        this.quantumRecoveryCdMs = 8000;
        const p = this.cb.getPlayerState();
        if (p.maxShield > 0) {
          this.cb.restoreShield(Math.max(1, Math.round(p.maxShield * 0.03)), 'Q-RECOVERY');
        }
      }
    }
  }

  private tryArmQuantumSynchronization(targetId: number): void {
    if (this.quantumSyncCdMs > 0 || this.quantumSyncTargetId !== null) return;
    const pTime = this.playerHitTimestamps.get(targetId);
    const cTime = this.cloneHitTimestamps.get(targetId);
    if (pTime === undefined || cTime === undefined) return;
    if (Math.abs(pTime - cTime) <= 1000) {
      this.quantumSyncTargetId = targetId;
    }
  }

  // ---- SPECIFIC PASSIVE TRIGGERS ----

  private triggerSiegeBreakerExplosion(hitX: number, hitY: number): void {
    const dmg = Math.max(1, Math.round(this.cb.getWeaponBaseDamage() * 1.0));
    const radius = 120;
    this.cb.onExplosionAoe?.(hitX, hitY, radius, 0xf97316, true);
    const targets = this.getValidOnScreenTargets();
    for (let i = 0; i < targets.length; i++) {
      const t = targets[i];
      if (Math.hypot(t.x - hitX, t.y - hitY) <= radius + t.radius) {
        this.cb.applyPassiveDamage(t, dmg);
      }
    }
  }

  private triggerArcConductor(originTarget: PassiveTarget): void {
    const dmg = Math.max(1, Math.round(this.cb.getWeaponBaseDamage() * 0.65));
    const valid = this.getValidOnScreenTargets();
    if (valid.length === 0) return;

    const p = this.cb.getPlayerState();
    const ox = originTarget.x;
    const oy = originTarget.y;

    const sorted = [...valid].sort(
      (a, b) => Math.hypot(a.x - ox, a.y - oy) - Math.hypot(b.x - ox, b.y - oy)
    );
    const picked = sorted.slice(0, 3);
    const chainPoints: Array<{ x: number; y: number }> = [{ x: p.x, y: p.y - 20 }];
    for (let i = 0; i < picked.length; i++) {
      chainPoints.push({ x: picked[i].x, y: picked[i].y });
    }
    this.cb.onLightningArcs?.(chainPoints, 0xfacc15);

    for (let i = 0; i < picked.length; i++) {
      this.cb.applyPassiveDamage(picked[i], dmg);
    }
  }

  private triggerVoltageSurge(): void {
    const p = this.cb.getPlayerState();
    const dmg = Math.max(1, Math.round(this.cb.getWeaponBaseDamage() * 1.0));
    const radius = 340;
    this.cb.onEnergyWave?.(p.x, p.y, radius, 0xfacc15);
    this.cb.onFloatingLabel?.(p.x, p.y - 30, 'VOLTAGE SURGE', '#FACC15');
    const targets = this.getValidOnScreenTargets();
    for (let i = 0; i < targets.length; i++) {
      const t = targets[i];
      if (Math.hypot(t.x - p.x, t.y - p.y) <= radius + t.radius) {
        this.cb.applyPassiveDamage(t, dmg);
      }
    }
  }

  private triggerGuardianPulse(): void {
    const p = this.cb.getPlayerState();
    const dmg = Math.max(1, Math.round(this.cb.getWeaponBaseDamage() * 0.8));
    const radius = 340;
    this.cb.onEnergyWave?.(p.x, p.y, radius, 0x10b981);
    this.cb.onFloatingLabel?.(p.x, p.y - 30, 'GUARDIAN PULSE', '#34D399');
    const targets = this.getValidOnScreenTargets();
    for (let i = 0; i < targets.length; i++) {
      const t = targets[i];
      if (Math.hypot(t.x - p.x, t.y - p.y) <= radius + t.radius) {
        this.cb.applyPassiveDamage(t, dmg);
      }
    }
  }

  private tryDispatchAstralConstellation(): void {
    if (this.astralConstellationCdMs > 0 || !this.astralConstellationPending) return;
    const valid = this.getValidOnScreenTargets();
    if (valid.length === 0) return;

    this.astralConstellationPending = false;
    this.astralConstellationCdMs = 7000;

    const p = this.cb.getPlayerState();
    const sorted = [...valid].sort(
      (a, b) => Math.hypot(a.x - p.x, a.y - p.y) - Math.hypot(b.x - p.x, b.y - p.y)
    );
    const dmgPerShard = Math.max(1, Math.round(this.cb.getWeaponBaseDamage() * 0.65));

    // Distinct nearest enemies first; wrap around only if < 3 targets exist
    const assigned: PassiveTarget[] = [];
    for (let i = 0; i < 3; i++) {
      assigned.push(sorted[i % sorted.length]);
    }

    // Shard 1 hits immediately, Shards 2 & 3 sequentially via deterministic dt queue
    this.resolveAstralShardImpact({
      delayMs: 0,
      preferredTarget: assigned[0],
      baseDamage: dmgPerShard,
    });
    for (let i = 1; i < assigned.length; i++) {
      this.pendingAstralShards.push({
        delayMs: i * 95,
        preferredTarget: assigned[i],
        baseDamage: dmgPerShard,
      });
    }
  }

  private resolveAstralShardImpact(shard: PendingAstralShard): void {
    const p = this.cb.getPlayerState();
    const valid = this.getValidOnScreenTargets();
    if (valid.length === 0) return;

    let target = shard.preferredTarget;
    if (!valid.includes(target)) {
      const sorted = [...valid].sort(
        (a, b) => Math.hypot(a.x - p.x, a.y - p.y) - Math.hypot(b.x - p.x, b.y - p.y)
      );
      target = sorted[0];
    }

    this.cb.onAstralShardHit?.(p.x, p.y - 18, target.x, target.y);
    this.cb.applyPassiveDamage(target, shard.baseDamage);
  }

  private triggerDivineJudgment(valid: PassiveTarget[]): void {
    const p = this.cb.getPlayerState();
    // Deterministic highest actual HP target (tie-break: higher maxHp, closer to player, lower targetId)
    let best = valid[0];
    let bestDist = Math.hypot(best.x - p.x, best.y - p.y);
    for (let i = 1; i < valid.length; i++) {
      const cand = valid[i];
      const candDist = Math.hypot(cand.x - p.x, cand.y - p.y);
      if (cand.hp > best.hp) {
        best = cand;
        bestDist = candDist;
      } else if (cand.hp === best.hp) {
        const candMax = cand.maxHp ?? cand.hp;
        const bestMax = best.maxHp ?? best.hp;
        if (candMax > bestMax) {
          best = cand;
          bestDist = candDist;
        } else if (candMax === bestMax && candDist < bestDist) {
          best = cand;
          bestDist = candDist;
        } else if (candMax === bestMax && candDist === bestDist && cand.targetId < best.targetId) {
          best = cand;
          bestDist = candDist;
        }
      }
    }

    const dmg = Math.max(1, Math.round(this.cb.getWeaponBaseDamage() * 1.5));
    this.cb.onAstralBeam?.(best.x, best.y, 0xe879f9);
    this.cb.onFloatingLabel?.(best.x, best.y - 26, 'DIVINE JUDGMENT', '#E879F9');
    this.cb.applyPassiveDamage(best, dmg);
  }

  private getValidOnScreenTargets(): PassiveTarget[] {
    const { width, height } = this.cb.getScreenSize();
    return this.cb.getTargets().filter((t) => isTargetValidOnScreen(t, width, height));
  }

  getDebugSnapshot(): PassiveDebugSnapshot {
    return {
      elapsedMs: this.elapsedMs,
      adaptiveHits: this.adaptiveHits,
      adaptiveReady: this.adaptiveReady,
      reactiveArmorCharges: this.reactiveArmorCharges,
      reactiveArmorCdMs: this.reactiveArmorCdMs,
      combatRecoveryKills: this.combatRecoveryKills,
      siegeBreakerHits: this.siegeBreakerHits,
      siegeBreakerReady: this.siegeBreakerReady,
      siegeBreakerCdMs: this.siegeBreakerCdMs,
      armorCrusherTargetId: this.armorCrusherTargetId,
      armorCrusherCount: this.armorCrusherCount,
      armorCrusherReady: this.armorCrusherReady,
      apocalypseImpactCdMs: this.apocalypseImpactCdMs,
      arcConductorHits: this.arcConductorHits,
      voltageStacks: this.voltageStacks,
      overloadCircuitReady: this.overloadCircuitReady,
      overloadCircuitTimerMs: this.overloadCircuitTimerMs,
      phaseCounterExpiresMs: this.phaseCounterExpiresMs,
      phaseCounterCdMs: this.phaseCounterCdMs,
      ghostDecoyRemainingMs: this.ghostDecoyRemainingMs,
      ghostDecoyCdMs: this.ghostDecoyCdMs,
      decoyX: this.decoyX,
      decoyY: this.decoyY,
      quantumEvasionCharges: this.quantumEvasionCharges,
      quantumEvasionCdMs: this.quantumEvasionCdMs,
      shieldReformationCdMs: this.shieldReformationCdMs,
      guardianPulseAccumulatedDmg: this.guardianPulseAccumulatedDmg,
      guardianPulseCdMs: this.guardianPulseCdMs,
      deadlyPrecisionCdMs: this.deadlyPrecisionCdMs,
      executionMarkCount: this.executionMarks.size,
      deathHarvestStacks: this.deathHarvestStacks,
      deathHarvestExpiresMs: this.deathHarvestExpiresMs,
      quantumSyncTargetId: this.quantumSyncTargetId,
      quantumSyncCdMs: this.quantumSyncCdMs,
      quantumRecoveryHits: this.quantumRecoveryHits,
      quantumRecoveryCdMs: this.quantumRecoveryCdMs,
      astralConstellationHits: this.astralConstellationHits,
      astralConstellationCdMs: this.astralConstellationCdMs,
      stellarProtectionCharges: this.stellarProtectionCharges,
      stellarProtectionCdMs: this.stellarProtectionCdMs,
      divineJudgmentTimerMs: this.divineJudgmentTimerMs,
    };
  }

  destroy(): void {
    this.countedHitActionIds.clear();
    this.countedCritActionIds.clear();
    this.countedArmorCrusherPairs.clear();
    this.countedCloneActionIds.clear();
    this.processedAttackIds.clear();
    this.executionMarks.clear();
    this.playerHitTimestamps.clear();
    this.cloneHitTimestamps.clear();
    this.pendingAstralShards.length = 0;
  }
}
