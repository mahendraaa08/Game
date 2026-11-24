import type { BossId } from './BossConfig';
import type { WeaponId } from './WeaponConfig';

export type GameMode = 'campaign' | 'endless' | 'challenge' | 'boss_rush';

// ============================================================================
// 1. CAMPAIGN DIFFICULTY SYSTEM (5 Difficulties x 10 Sectors)
// ============================================================================

export type CampaignDifficulty = 'easy' | 'normal' | 'hard' | 'insane' | 'nightmare';

export const CAMPAIGN_DIFFICULTY_ORDER: CampaignDifficulty[] = [
  'easy',
  'normal',
  'hard',
  'insane',
  'nightmare',
];

export interface CampaignDifficultyConfig {
  id: CampaignDifficulty;
  label: string;
  shortLabel: string;
  badgeHex: string;
  description: string;
  enemyHpMult: number;
  enemyDamageMult: number;
  enemyAttackRateMult: number;
  enemyProjectileSpeedMult: number;
  spawnIntervalMult: number;
  densityMult: number;
  eliteChanceBonus: number;
  bossHpMult: number;
  bossDamageMult: number;
  bossAggressionMult: number;
  scoreMult: number;
  rewardMult: number;
  firstClearCrystalBonus: number;
}

export const CAMPAIGN_DIFFICULTIES: Record<CampaignDifficulty, CampaignDifficultyConfig> = {
  easy: {
    id: 'easy',
    label: 'Easy',
    shortLabel: 'EASY',
    badgeHex: '#34D399',
    description: 'Standard orbital patrol pacing. Ideal for learning enemy formations and sectors.',
    enemyHpMult: 0.78,
    enemyDamageMult: 0.75,
    enemyAttackRateMult: 0.84,
    enemyProjectileSpeedMult: 0.88,
    spawnIntervalMult: 1.18,
    densityMult: 0.82,
    eliteChanceBonus: 0,
    bossHpMult: 0.78,
    bossDamageMult: 0.75,
    bossAggressionMult: 0.85,
    scoreMult: 0.85,
    rewardMult: 0.85,
    firstClearCrystalBonus: 0,
  },
  normal: {
    id: 'normal',
    label: 'Normal',
    shortLabel: 'NORM',
    badgeHex: '#38BDF8',
    description: 'Baseline frontline combat density, balanced enemy fire cadence, and standard rewards.',
    enemyHpMult: 1.0,
    enemyDamageMult: 1.0,
    enemyAttackRateMult: 1.0,
    enemyProjectileSpeedMult: 1.0,
    spawnIntervalMult: 1.0,
    densityMult: 1.0,
    eliteChanceBonus: 0.04,
    bossHpMult: 1.0,
    bossDamageMult: 1.0,
    bossAggressionMult: 1.0,
    scoreMult: 1.0,
    rewardMult: 1.0,
    firstClearCrystalBonus: 0,
  },
  hard: {
    id: 'hard',
    label: 'Hard',
    shortLabel: 'HARD',
    badgeHex: '#F59E0B',
    description: 'Denser attack wings, frequent Elite reinforcements, faster enemy fire, and +35% payout.',
    enemyHpMult: 1.28,
    enemyDamageMult: 1.25,
    enemyAttackRateMult: 1.14,
    enemyProjectileSpeedMult: 1.1,
    spawnIntervalMult: 0.88,
    densityMult: 1.18,
    eliteChanceBonus: 0.12,
    bossHpMult: 1.32,
    bossDamageMult: 1.25,
    bossAggressionMult: 1.12,
    scoreMult: 1.25,
    rewardMult: 1.35,
    firstClearCrystalBonus: 1,
  },
  insane: {
    id: 'insane',
    label: 'Insane',
    shortLabel: 'INSN',
    badgeHex: '#F97316',
    description: 'Relentless multi-vector spawns, aggressive Dreadnought cycles, and +75% combat bounty.',
    enemyHpMult: 1.62,
    enemyDamageMult: 1.55,
    enemyAttackRateMult: 1.28,
    enemyProjectileSpeedMult: 1.18,
    spawnIntervalMult: 0.78,
    densityMult: 1.35,
    eliteChanceBonus: 0.2,
    bossHpMult: 1.68,
    bossDamageMult: 1.52,
    bossAggressionMult: 1.24,
    scoreMult: 1.55,
    rewardMult: 1.75,
    firstClearCrystalBonus: 1,
  },
  nightmare: {
    id: 'nightmare',
    label: 'Nightmare',
    shortLabel: 'NGHT',
    badgeHex: '#F43F5E',
    description: 'Endgame Void saturation: heavy elite squads, rapid salvos, lethal bosses, +125% bounty.',
    enemyHpMult: 2.05,
    enemyDamageMult: 1.9,
    enemyAttackRateMult: 1.42,
    enemyProjectileSpeedMult: 1.26,
    spawnIntervalMult: 0.68,
    densityMult: 1.52,
    eliteChanceBonus: 0.28,
    bossHpMult: 2.15,
    bossDamageMult: 1.85,
    bossAggressionMult: 1.38,
    scoreMult: 2.0,
    rewardMult: 2.25,
    firstClearCrystalBonus: 2,
  },
};

export function getNextCampaignDifficulty(diff: CampaignDifficulty): CampaignDifficulty | null {
  const idx = CAMPAIGN_DIFFICULTY_ORDER.indexOf(diff);
  if (idx < 0 || idx >= CAMPAIGN_DIFFICULTY_ORDER.length - 1) return null;
  return CAMPAIGN_DIFFICULTY_ORDER[idx + 1];
}

// ============================================================================
// 2. ENDLESS SURVIVAL — TEMPORARY UPGRADE DRAFT SYSTEM
// ============================================================================

export type EndlessUpgradeStatId =
  | 'weapon_damage'
  | 'fire_rate'
  | 'crit_chance'
  | 'crit_damage'
  | 'max_hp'
  | 'max_shield'
  | 'move_speed'
  | 'special_damage'
  | 'special_cooldown';

export interface EndlessUpgradeSpec {
  id: EndlessUpgradeStatId;
  label: string;
  categoryLabel: string;
  accentHex: string;
  step: number;
  cap: number;
  isPercentagePoints: boolean;
  isCooldownReduction: boolean;
  description: string;
}

export const ENDLESS_UPGRADE_SPECS: Record<EndlessUpgradeStatId, EndlessUpgradeSpec> = {
  weapon_damage: {
    id: 'weapon_damage',
    label: 'Weapon Damage',
    categoryLabel: 'OFFENSE',
    accentHex: '#F43F5E',
    step: 0.08,
    cap: 0.8,
    isPercentagePoints: false,
    isCooldownReduction: false,
    description: 'Amplifies primary weapon & passive cannon output for this Endless run.',
  },
  fire_rate: {
    id: 'fire_rate',
    label: 'Fire Rate',
    categoryLabel: 'OFFENSE',
    accentHex: '#FB923C',
    step: 0.07,
    cap: 0.5,
    isPercentagePoints: false,
    isCooldownReduction: false,
    description: 'Increases primary weapon cycling speed for sustained salvo pressure.',
  },
  crit_chance: {
    id: 'crit_chance',
    label: 'Critical Chance',
    categoryLabel: 'PRECISION',
    accentHex: '#FACC15',
    step: 0.03,
    cap: 0.15,
    isPercentagePoints: true,
    isCooldownReduction: false,
    description: 'Adds flat critical strike probability to every weapon projectile.',
  },
  crit_damage: {
    id: 'crit_damage',
    label: 'Critical Damage',
    categoryLabel: 'PRECISION',
    accentHex: '#F59E0B',
    step: 0.1,
    cap: 1.0,
    isPercentagePoints: false,
    isCooldownReduction: false,
    description: 'Boosts critical strike damage multiplier against elites and dreadnoughts.',
  },
  max_hp: {
    id: 'max_hp',
    label: 'Maximum HP',
    categoryLabel: 'SURVIVAL',
    accentHex: '#10B981',
    step: 0.1,
    cap: 0.5,
    isPercentagePoints: false,
    isCooldownReduction: false,
    description: 'Expands hull plating capacity for this run (does not auto-heal current HP).',
  },
  max_shield: {
    id: 'max_shield',
    label: 'Maximum Shield',
    categoryLabel: 'DEFENSE',
    accentHex: '#38BDF8',
    step: 0.1,
    cap: 0.5,
    isPercentagePoints: false,
    isCooldownReduction: false,
    description: 'Expands energy barrier ceiling for this run (does not auto-recharge Shield).',
  },
  move_speed: {
    id: 'move_speed',
    label: 'Movement Speed',
    categoryLabel: 'MOBILITY',
    accentHex: '#22D3EE',
    step: 0.04,
    cap: 0.2,
    isPercentagePoints: false,
    isCooldownReduction: false,
    description: 'Enhances thruster responsiveness for weaving dense bullet patterns.',
  },
  special_damage: {
    id: 'special_damage',
    label: 'Special Damage',
    categoryLabel: 'TACTICAL',
    accentHex: '#C084FC',
    step: 0.08,
    cap: 0.6,
    isPercentagePoints: false,
    isCooldownReduction: false,
    description: 'Increases EMP Nova, Chrono Singularity, and Gravity Well power.',
  },
  special_cooldown: {
    id: 'special_cooldown',
    label: 'Special Cooldown',
    categoryLabel: 'TACTICAL',
    accentHex: '#818CF8',
    step: 0.05,
    cap: 0.3,
    isPercentagePoints: false,
    isCooldownReduction: true,
    description: 'Accelerates Special Ability recharge (respects global cooldown safety floor).',
  },
};

export const ENDLESS_UPGRADE_STAT_IDS: EndlessUpgradeStatId[] = [
  'weapon_damage',
  'fire_rate',
  'crit_chance',
  'crit_damage',
  'max_hp',
  'max_shield',
  'move_speed',
  'special_damage',
  'special_cooldown',
];

export type EndlessBonusState = Record<EndlessUpgradeStatId, number>;

export function createEmptyEndlessBonuses(): EndlessBonusState {
  return {
    weapon_damage: 0,
    fire_rate: 0,
    crit_chance: 0,
    crit_damage: 0,
    max_hp: 0,
    max_shield: 0,
    move_speed: 0,
    special_damage: 0,
    special_cooldown: 0,
  };
}

export interface EndlessUpgradeChoice {
  id: EndlessUpgradeStatId;
  label: string;
  categoryLabel: string;
  accentHex: string;
  currentBonus: number;
  appliedDelta: number;
  nextBonus: number;
  cap: number;
  isPercentagePoints: boolean;
  isCooldownReduction: boolean;
  formattedDelta: string;
  formattedProgress: string;
  description: string;
}

function formatEndlessStatValue(spec: EndlessUpgradeSpec, value: number): string {
  const pct = Math.round(value * 100);
  if (spec.isCooldownReduction) return `-${pct}%`;
  if (spec.isPercentagePoints) return `+${pct}pp`;
  return `+${pct}%`;
}

export function buildEndlessUpgradeChoice(
  id: EndlessUpgradeStatId,
  state: EndlessBonusState
): EndlessUpgradeChoice | null {
  const spec = ENDLESS_UPGRADE_SPECS[id];
  const current = Math.max(0, state[id] ?? 0);
  const remaining = spec.cap - current;
  if (remaining <= 1e-6) return null;

  const appliedDelta = Number(Math.min(spec.step, remaining).toFixed(4));
  const nextBonus = Number(Math.min(spec.cap, current + appliedDelta).toFixed(4));
  const deltaPct = Math.round(appliedDelta * 100);
  const formattedDelta = spec.isCooldownReduction
    ? `-${deltaPct}% CD`
    : spec.isPercentagePoints
    ? `+${deltaPct}pp`
    : `+${deltaPct}%`;
  const formattedProgress = `${formatEndlessStatValue(spec, current)} → ${formatEndlessStatValue(
    spec,
    nextBonus
  )} (Cap ${formatEndlessStatValue(spec, spec.cap)})`;

  return {
    id,
    label: spec.label,
    categoryLabel: spec.categoryLabel,
    accentHex: spec.accentHex,
    currentBonus: current,
    appliedDelta,
    nextBonus,
    cap: spec.cap,
    isPercentagePoints: spec.isPercentagePoints,
    isCooldownReduction: spec.isCooldownReduction,
    formattedDelta,
    formattedProgress,
    description: spec.description,
  };
}

export function pickEndlessUpgradeChoices(
  state: EndlessBonusState,
  maxChoices = 3
): EndlessUpgradeChoice[] {
  const available = ENDLESS_UPGRADE_STAT_IDS.map((id) => buildEndlessUpgradeChoice(id, state)).filter(
    (c): c is EndlessUpgradeChoice => c !== null
  );

  // Fisher-Yates shuffle on available unique choices
  for (let i = available.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [available[i], available[j]] = [available[j], available[i]];
  }
  return available.slice(0, maxChoices);
}

export function applyEndlessUpgradeStep(
  state: EndlessBonusState,
  statId: EndlessUpgradeStatId
): { nextState: EndlessBonusState; appliedDelta: number } {
  const spec = ENDLESS_UPGRADE_SPECS[statId];
  const current = Math.max(0, state[statId] ?? 0);
  const remaining = Math.max(0, spec.cap - current);
  const appliedDelta = Number(Math.min(spec.step, remaining).toFixed(4));
  const nextVal = Number(Math.min(spec.cap, current + appliedDelta).toFixed(4));
  return {
    nextState: {
      ...state,
      [statId]: nextVal,
    },
    appliedDelta,
  };
}

export interface EndlessBossModifiers {
  waveNum: number;
  tier: number;
  hpMult: number;
  damageMult: number;
  attackRateMult: number;
  projectileSpeedMult: number;
  aggressionMult: number;
  patternPressure: 0 | 1 | 2;
}

const ENDLESS_BOSS_ANCHORS: ReadonlyArray<{
  wave: number;
  hpMult: number;
  damageMult: number;
  attackRateMult: number;
  projectileSpeedMult: number;
  aggressionMult: number;
}> = [
  { wave: 5, hpMult: 1.0, damageMult: 1.0, attackRateMult: 1.0, projectileSpeedMult: 1.0, aggressionMult: 1.0 },
  { wave: 10, hpMult: 1.35, damageMult: 1.08, attackRateMult: 1.05, projectileSpeedMult: 1.03, aggressionMult: 1.04 },
  { wave: 15, hpMult: 1.8, damageMult: 1.17, attackRateMult: 1.1, projectileSpeedMult: 1.06, aggressionMult: 1.09 },
  { wave: 20, hpMult: 2.35, damageMult: 1.27, attackRateMult: 1.16, projectileSpeedMult: 1.1, aggressionMult: 1.14 },
  { wave: 25, hpMult: 2.95, damageMult: 1.38, attackRateMult: 1.22, projectileSpeedMult: 1.14, aggressionMult: 1.19 },
  { wave: 30, hpMult: 3.6, damageMult: 1.5, attackRateMult: 1.28, projectileSpeedMult: 1.18, aggressionMult: 1.24 },
  { wave: 40, hpMult: 5.0, damageMult: 1.72, attackRateMult: 1.38, projectileSpeedMult: 1.25, aggressionMult: 1.32 },
];

export function getEndlessBossModifiers(waveNum: number): EndlessBossModifiers {
  const wave = Math.max(5, Math.floor(waveNum));
  const tier = Math.max(1, Math.floor(wave / 5));
  const patternPressure: 0 | 1 | 2 = wave >= 30 ? 2 : wave >= 15 ? 1 : 0;

  if (wave <= ENDLESS_BOSS_ANCHORS[0].wave) {
    return {
      waveNum: wave,
      tier,
      hpMult: 1.0,
      damageMult: 1.0,
      attackRateMult: 1.0,
      projectileSpeedMult: 1.0,
      aggressionMult: 1.0,
      patternPressure,
    };
  }

  const last = ENDLESS_BOSS_ANCHORS[ENDLESS_BOSS_ANCHORS.length - 1];
  if (wave <= last.wave) {
    for (let i = 0; i < ENDLESS_BOSS_ANCHORS.length - 1; i++) {
      const a = ENDLESS_BOSS_ANCHORS[i];
      const b = ENDLESS_BOSS_ANCHORS[i + 1];
      if (wave <= b.wave) {
        const t = (wave - a.wave) / (b.wave - a.wave);
        const lerp = (x: number, y: number) => x + (y - x) * t;
        return {
          waveNum: wave,
          tier,
          hpMult: Number(lerp(a.hpMult, b.hpMult).toFixed(2)),
          damageMult: Number(lerp(a.damageMult, b.damageMult).toFixed(2)),
          attackRateMult: Number(lerp(a.attackRateMult, b.attackRateMult).toFixed(3)),
          projectileSpeedMult: Number(lerp(a.projectileSpeedMult, b.projectileSpeedMult).toFixed(3)),
          aggressionMult: Number(lerp(a.aggressionMult, b.aggressionMult).toFixed(2)),
          patternPressure,
        };
      }
    }
  }

  // Smooth diminishing logarithmic progression beyond Wave 40 with controlled ceilings
  const stepsOver40 = (wave - last.wave) / 5;
  return {
    waveNum: wave,
    tier,
    hpMult: Number(Math.min(12.0, last.hpMult + 1.45 * Math.log1p(stepsOver40 * 0.72)).toFixed(2)),
    damageMult: Number(Math.min(2.35, last.damageMult + 0.34 * Math.log1p(stepsOver40 * 0.52)).toFixed(2)),
    attackRateMult: Number(Math.min(1.58, last.attackRateMult + 0.13 * Math.log1p(stepsOver40 * 0.45)).toFixed(3)),
    projectileSpeedMult: Number(Math.min(1.36, last.projectileSpeedMult + 0.08 * Math.log1p(stepsOver40 * 0.4)).toFixed(3)),
    aggressionMult: Number(Math.min(1.48, last.aggressionMult + 0.11 * Math.log1p(stepsOver40 * 0.4)).toFixed(2)),
    patternPressure,
  };
}

// ============================================================================
// 3. CHALLENGE MODE — 4 CATEGORIES x 3 DIFFICULTY TIERS
// ============================================================================

export type ChallengeCategory = 'survival' | 'weapon' | 'combat' | 'boss';

export const CHALLENGE_CATEGORY_ORDER: ChallengeCategory[] = [
  'survival',
  'weapon',
  'combat',
  'boss',
];

export const CHALLENGE_CATEGORY_LABELS: Record<ChallengeCategory, string> = {
  survival: 'Survival Trials',
  weapon: 'Weapon Mastery',
  combat: 'Combat Trials',
  boss: 'Boss Trials',
};

export type ChallengeDifficulty = 'Standard' | 'Hard' | 'Extreme';

export const CHALLENGE_DIFFICULTY_ORDER: ChallengeDifficulty[] = [
  'Standard',
  'Hard',
  'Extreme',
];

export interface ChallengeRule {
  maxHpOverride?: number;
  disableShield?: boolean;
  shieldCapRatio?: number; // e.g. 0.5 caps shield at 50% of normal computed shield
  allowedWeapons?: WeaponId[];
  disableDrones?: boolean;
  lightningProtocol?: boolean;
  lightningIntervalSec?: number;
  timeLimitSec?: number;
  targetKills?: number;
  bossId?: BossId;
  levelBase: number; // Campaign level environment & wave pool base (1..10)
  // Tiered combat pressure modifiers (combined with rules/objectives)
  enemyHpMult?: number;
  enemyDamageMult?: number;
  enemyAttackRateMult?: number;
  enemyProjectileSpeedMult?: number;
  spawnIntervalMult?: number;
  densityMult?: number;
  eliteChanceBonus?: number;
  bossHpMult?: number;
  bossDamageMult?: number;
  bossAggressionMult?: number;
}

export interface ChallengeTierConfig {
  difficulty: ChallengeDifficulty;
  objective: string;
  constraintsLabel: string;
  rewardCredits: number;
  rewardCrystals: number;
  rules: ChallengeRule;
}

export interface ChallengeDefinition {
  id: string;
  title: string;
  category: ChallengeCategory;
  legacyDifficulty: ChallengeDifficulty;
  // Backward-compatible default view (mapped to legacyDifficulty tier)
  difficulty: ChallengeDifficulty;
  objective: string;
  constraintsLabel: string;
  rewardCredits: number;
  rewardCrystals: number;
  rules: ChallengeRule;
  tiers: Record<ChallengeDifficulty, ChallengeTierConfig>;
}

function makeChallenge(params: {
  id: string;
  title: string;
  category: ChallengeCategory;
  legacyDifficulty: ChallengeDifficulty;
  tiers: Record<ChallengeDifficulty, ChallengeTierConfig>;
}): ChallengeDefinition {
  const legacyTier = params.tiers[params.legacyDifficulty];
  return {
    id: params.id,
    title: params.title,
    category: params.category,
    legacyDifficulty: params.legacyDifficulty,
    difficulty: legacyTier.difficulty,
    objective: legacyTier.objective,
    constraintsLabel: legacyTier.constraintsLabel,
    rewardCredits: legacyTier.rewardCredits,
    rewardCrystals: legacyTier.rewardCrystals,
    rules: legacyTier.rules,
    tiers: params.tiers,
  };
}

export const CHALLENGES: ChallengeDefinition[] = [
  // ---- SURVIVAL TRIALS ----
  makeChallenge({
    id: 'chal_glass_cannon',
    title: 'Glass Interceptor',
    category: 'survival',
    legacyDifficulty: 'Standard',
    tiers: {
      Standard: {
        difficulty: 'Standard',
        objective: 'Destroy 35 Void hostiles with fragile 45 HP hull plating.',
        constraintsLabel: '45 Max HP · 35 Kills · Standard Wing',
        rewardCredits: 320,
        rewardCrystals: 1,
        rules: {
          maxHpOverride: 45,
          targetKills: 35,
          levelBase: 3,
          eliteChanceBonus: 0.05,
        },
      },
      Hard: {
        difficulty: 'Hard',
        objective: 'Destroy 45 hostiles under 35 HP hull lock and 50% Shield cap.',
        constraintsLabel: '35 Max HP · 50% Shield Cap · 45 Kills',
        rewardCredits: 520,
        rewardCrystals: 2,
        rules: {
          maxHpOverride: 35,
          shieldCapRatio: 0.5,
          targetKills: 45,
          levelBase: 3,
          spawnIntervalMult: 0.88,
          densityMult: 1.15,
          enemyDamageMult: 1.15,
          eliteChanceBonus: 0.14,
        },
      },
      Extreme: {
        difficulty: 'Extreme',
        objective: 'Eliminate 55 hostiles with 25 Max HP and zero energy Shields.',
        constraintsLabel: '25 Max HP · No Shields · 55 Kills',
        rewardCredits: 840,
        rewardCrystals: 3,
        rules: {
          maxHpOverride: 25,
          disableShield: true,
          targetKills: 55,
          levelBase: 5,
          spawnIntervalMult: 0.78,
          densityMult: 1.28,
          enemyDamageMult: 1.25,
          enemyAttackRateMult: 1.15,
          eliteChanceBonus: 0.22,
        },
      },
    },
  }),
  makeChallenge({
    id: 'chal_shieldless_gauntlet',
    title: 'Hull Integrity Zero-Shield',
    category: 'survival',
    legacyDifficulty: 'Hard',
    tiers: {
      Standard: {
        difficulty: 'Standard',
        objective: 'Destroy 40 hostiles in Cryo space with all Shield emitters offline.',
        constraintsLabel: 'Shields Disabled · 40 Kills',
        rewardCredits: 380,
        rewardCrystals: 1,
        rules: {
          disableShield: true,
          targetKills: 40,
          levelBase: 6,
          eliteChanceBonus: 0.06,
        },
      },
      Hard: {
        difficulty: 'Hard',
        objective: 'Destroy 55 hostiles with Shields disabled under dense Elite patrols.',
        constraintsLabel: 'Shields Disabled · 55 Kills · Elite Patrols',
        rewardCredits: 600,
        rewardCrystals: 2,
        rules: {
          disableShield: true,
          targetKills: 55,
          levelBase: 6,
          spawnIntervalMult: 0.84,
          densityMult: 1.18,
          enemyAttackRateMult: 1.12,
          eliteChanceBonus: 0.16,
        },
      },
      Extreme: {
        difficulty: 'Extreme',
        objective: 'Destroy 70 hostiles with Shields and Companion Drones offline.',
        constraintsLabel: 'No Shields · No Drones · 70 Kills',
        rewardCredits: 920,
        rewardCrystals: 4,
        rules: {
          disableShield: true,
          disableDrones: true,
          targetKills: 70,
          levelBase: 7,
          spawnIntervalMult: 0.74,
          densityMult: 1.32,
          enemyHpMult: 1.25,
          enemyAttackRateMult: 1.22,
          eliteChanceBonus: 0.25,
        },
      },
    },
  }),

  // ---- WEAPON MASTERY ----
  makeChallenge({
    id: 'chal_laser_trial',
    title: 'Coherent Precision',
    category: 'weapon',
    legacyDifficulty: 'Standard',
    tiers: {
      Standard: {
        difficulty: 'Standard',
        objective: 'Eliminate 45 hostiles using only Dual Laser & Plasma Cannon.',
        constraintsLabel: 'Weapons: Plasma / Dual Laser · 45 Kills',
        rewardCredits: 390,
        rewardCrystals: 1,
        rules: {
          allowedWeapons: ['plasma', 'dual_laser'],
          targetKills: 45,
          levelBase: 5,
          eliteChanceBonus: 0.05,
        },
      },
      Hard: {
        difficulty: 'Hard',
        objective: 'Eliminate 55 fortified hostiles armed strictly with Dual Laser.',
        constraintsLabel: 'Weapon Locked: Dual Laser Only · 55 Kills',
        rewardCredits: 590,
        rewardCrystals: 2,
        rules: {
          allowedWeapons: ['dual_laser'],
          targetKills: 55,
          levelBase: 5,
          spawnIntervalMult: 0.86,
          enemyHpMult: 1.22,
          eliteChanceBonus: 0.14,
        },
      },
      Extreme: {
        difficulty: 'Extreme',
        objective: 'Eliminate 65 hostiles with baseline Plasma Cannon only and Drones offline.',
        constraintsLabel: 'Plasma Only · No Drones · 65 Kills',
        rewardCredits: 880,
        rewardCrystals: 3,
        rules: {
          allowedWeapons: ['plasma'],
          disableDrones: true,
          targetKills: 65,
          levelBase: 6,
          spawnIntervalMult: 0.78,
          densityMult: 1.22,
          enemyHpMult: 1.35,
          enemyAttackRateMult: 1.18,
          eliteChanceBonus: 0.22,
        },
      },
    },
  }),
  makeChallenge({
    id: 'chal_lightning_storm',
    title: 'Voltaic Surge',
    category: 'weapon',
    legacyDifficulty: 'Hard',
    tiers: {
      Standard: {
        difficulty: 'Standard',
        objective: 'Destroy 45 hostiles armed with Spread Cannon & Chain Lightning.',
        constraintsLabel: 'Weapons: Spread / Lightning · 45 Kills',
        rewardCredits: 420,
        rewardCrystals: 1,
        rules: {
          allowedWeapons: ['spread', 'lightning'],
          targetKills: 45,
          levelBase: 8,
        },
      },
      Hard: {
        difficulty: 'Hard',
        objective: 'Destroy 55 hostiles armed strictly with Spread & Chain Lightning.',
        constraintsLabel: 'Weapons Locked: Spread / Lightning · 55 Kills',
        rewardCredits: 640,
        rewardCrystals: 2,
        rules: {
          allowedWeapons: ['spread', 'lightning'],
          targetKills: 55,
          levelBase: 8,
          spawnIntervalMult: 0.85,
          densityMult: 1.16,
          eliteChanceBonus: 0.14,
        },
      },
      Extreme: {
        difficulty: 'Extreme',
        objective: 'Destroy 75 Cyber hostiles using Spread Cannon only under 80 HP lock.',
        constraintsLabel: 'Spread Only · 80 Max HP · 75 Kills',
        rewardCredits: 950,
        rewardCrystals: 4,
        rules: {
          allowedWeapons: ['spread'],
          maxHpOverride: 80,
          targetKills: 75,
          levelBase: 8,
          spawnIntervalMult: 0.75,
          densityMult: 1.3,
          enemyHpMult: 1.3,
          enemyAttackRateMult: 1.2,
          eliteChanceBonus: 0.24,
        },
      },
    },
  }),
  makeChallenge({
    id: 'chal_arsenal_lockdown',
    title: 'Precision Ordnance',
    category: 'weapon',
    legacyDifficulty: 'Hard',
    tiers: {
      Standard: {
        difficulty: 'Standard',
        objective: 'Destroy 45 hostiles using only Beam Laser & Homing Missiles.',
        constraintsLabel: 'Weapons: Beam / Homing · 45 Kills',
        rewardCredits: 430,
        rewardCrystals: 1,
        rules: {
          allowedWeapons: ['beam', 'homing'],
          targetKills: 45,
          levelBase: 7,
        },
      },
      Hard: {
        difficulty: 'Hard',
        objective: 'Destroy 60 hostiles using Beam Laser only at 60% Shield cap.',
        constraintsLabel: 'Beam Only · 60% Shield Cap · 60 Kills',
        rewardCredits: 660,
        rewardCrystals: 2,
        rules: {
          allowedWeapons: ['beam'],
          shieldCapRatio: 0.6,
          targetKills: 60,
          levelBase: 7,
          spawnIntervalMult: 0.84,
          densityMult: 1.18,
          eliteChanceBonus: 0.16,
        },
      },
      Extreme: {
        difficulty: 'Extreme',
        objective: 'Destroy 70 hostiles with Homing Missiles only and Shields disabled.',
        constraintsLabel: 'Homing Only · No Shields · 70 Kills',
        rewardCredits: 940,
        rewardCrystals: 4,
        rules: {
          allowedWeapons: ['homing'],
          disableShield: true,
          targetKills: 70,
          levelBase: 9,
          spawnIntervalMult: 0.76,
          densityMult: 1.26,
          enemyHpMult: 1.28,
          eliteChanceBonus: 0.24,
        },
      },
    },
  }),

  // ---- COMBAT TRIALS ----
  makeChallenge({
    id: 'chal_timed_gauntlet',
    title: '60-Second Blitz',
    category: 'combat',
    legacyDifficulty: 'Hard',
    tiers: {
      Standard: {
        difficulty: 'Standard',
        objective: 'Survive 45 seconds inside the Dark Dimension rift storm.',
        constraintsLabel: '45s Survival Timer · No Drones',
        rewardCredits: 360,
        rewardCrystals: 1,
        rules: {
          timeLimitSec: 45,
          disableDrones: true,
          levelBase: 7,
          densityMult: 1.0,
        },
      },
      Hard: {
        difficulty: 'Hard',
        objective: 'Survive 60 seconds inside the Dark Dimension rift storm.',
        constraintsLabel: '60s Survival Timer · No Drones',
        rewardCredits: 480,
        rewardCrystals: 2,
        rules: {
          timeLimitSec: 60,
          disableDrones: true,
          levelBase: 7,
          spawnIntervalMult: 0.86,
          densityMult: 1.18,
          eliteChanceBonus: 0.14,
        },
      },
      Extreme: {
        difficulty: 'Extreme',
        objective: 'Survive 75 seconds at 50% Shield cap against relentless Void elites.',
        constraintsLabel: '75s Timer · No Drones · 50% Shield Cap',
        rewardCredits: 860,
        rewardCrystals: 3,
        rules: {
          timeLimitSec: 75,
          disableDrones: true,
          shieldCapRatio: 0.5,
          levelBase: 9,
          spawnIntervalMult: 0.74,
          densityMult: 1.35,
          enemyAttackRateMult: 1.2,
          eliteChanceBonus: 0.25,
        },
      },
    },
  }),
  makeChallenge({
    id: 'chal_lightning_protocol',
    title: 'Lightning Protocol',
    category: 'combat',
    legacyDifficulty: 'Hard',
    tiers: {
      Standard: {
        difficulty: 'Standard',
        objective: 'Destroy 45 hostiles while evading periodic orbital ion lightning strikes.',
        constraintsLabel: 'Ion Lightning Hazards · 45 Kills',
        rewardCredits: 440,
        rewardCrystals: 2,
        rules: {
          lightningProtocol: true,
          lightningIntervalSec: 4.5,
          targetKills: 45,
          levelBase: 6,
          eliteChanceBonus: 0.08,
        },
      },
      Hard: {
        difficulty: 'Hard',
        objective: 'Destroy 60 hostiles under accelerated Lightning Protocol and no Drones.',
        constraintsLabel: 'Fast Ion Hazards · No Drones · 60 Kills',
        rewardCredits: 680,
        rewardCrystals: 3,
        rules: {
          lightningProtocol: true,
          lightningIntervalSec: 3.4,
          disableDrones: true,
          targetKills: 60,
          levelBase: 7,
          spawnIntervalMult: 0.85,
          densityMult: 1.18,
          eliteChanceBonus: 0.16,
        },
      },
      Extreme: {
        difficulty: 'Extreme',
        objective: 'Eliminate 75 hostiles under rapid Ion Storms with 50% Shield capacity.',
        constraintsLabel: 'Rapid Ion Storms · 50% Shield · No Drones · 75 Kills',
        rewardCredits: 980,
        rewardCrystals: 4,
        rules: {
          lightningProtocol: true,
          lightningIntervalSec: 2.5,
          disableDrones: true,
          shieldCapRatio: 0.5,
          targetKills: 75,
          levelBase: 9,
          spawnIntervalMult: 0.75,
          densityMult: 1.3,
          enemyHpMult: 1.25,
          eliteChanceBonus: 0.25,
        },
      },
    },
  }),

  // ---- BOSS TRIALS ----
  makeChallenge({
    id: 'chal_venom_duel',
    title: 'Hive Purge',
    category: 'boss',
    legacyDifficulty: 'Hard',
    tiers: {
      Standard: {
        difficulty: 'Standard',
        objective: 'Defeat the Venom Queen with Shield capacity reduced by 50%.',
        constraintsLabel: '50% Shield Cap · Boss Hunt',
        rewardCredits: 400,
        rewardCrystals: 1,
        rules: {
          shieldCapRatio: 0.5,
          bossId: 'venom_queen',
          levelBase: 4,
          bossHpMult: 0.9,
        },
      },
      Hard: {
        difficulty: 'Hard',
        objective: 'Defeat the Venom Queen with shields offline.',
        constraintsLabel: 'Shields Disabled · Boss Hunt',
        rewardCredits: 580,
        rewardCrystals: 2,
        rules: {
          disableShield: true,
          bossId: 'venom_queen',
          levelBase: 4,
          bossHpMult: 1.15,
          bossAggressionMult: 1.12,
        },
      },
      Extreme: {
        difficulty: 'Extreme',
        objective: 'Destroy the empowered Venom Queen with no Shields, no Drones & 85 HP lock.',
        constraintsLabel: 'No Shields · No Drones · 85 HP · Empowered Boss',
        rewardCredits: 920,
        rewardCrystals: 4,
        rules: {
          disableShield: true,
          disableDrones: true,
          maxHpOverride: 85,
          bossId: 'venom_queen',
          levelBase: 4,
          bossHpMult: 1.45,
          bossDamageMult: 1.3,
          bossAggressionMult: 1.28,
        },
      },
    },
  }),
  makeChallenge({
    id: 'chal_titan_duel',
    title: 'Monolith Breach',
    category: 'boss',
    legacyDifficulty: 'Hard',
    tiers: {
      Standard: {
        difficulty: 'Standard',
        objective: 'Defeat the Shadow Titan stealth monolith without Companion Drones.',
        constraintsLabel: 'No Drones · Shadow Titan Hunt',
        rewardCredits: 490,
        rewardCrystals: 2,
        rules: {
          disableDrones: true,
          bossId: 'shadow_titan',
          levelBase: 6,
          bossHpMult: 1.0,
        },
      },
      Hard: {
        difficulty: 'Hard',
        objective: 'Defeat Shadow Titan with Drones offline and 40% Shield cap.',
        constraintsLabel: 'No Drones · 40% Shield Cap · Shadow Titan',
        rewardCredits: 720,
        rewardCrystals: 3,
        rules: {
          disableDrones: true,
          shieldCapRatio: 0.4,
          bossId: 'shadow_titan',
          levelBase: 6,
          bossHpMult: 1.25,
          bossDamageMult: 1.18,
          bossAggressionMult: 1.16,
        },
      },
      Extreme: {
        difficulty: 'Extreme',
        objective: 'Destroy an overclocked Cyber Leviathan with no Shields and no Drones.',
        constraintsLabel: 'No Shields · No Drones · Cyber Leviathan',
        rewardCredits: 1050,
        rewardCrystals: 4,
        rules: {
          disableDrones: true,
          disableShield: true,
          bossId: 'cyber_leviathan',
          levelBase: 8,
          bossHpMult: 1.4,
          bossDamageMult: 1.28,
          bossAggressionMult: 1.26,
        },
      },
    },
  }),
  makeChallenge({
    id: 'chal_emperor_duel',
    title: 'Sovereign Showdown',
    category: 'boss',
    legacyDifficulty: 'Extreme',
    tiers: {
      Standard: {
        difficulty: 'Standard',
        objective: 'Confront and destroy the Void Emperor under 100 HP hull lock.',
        constraintsLabel: '100 Max HP · Final Boss Duel',
        rewardCredits: 620,
        rewardCrystals: 2,
        rules: {
          maxHpOverride: 100,
          bossId: 'void_emperor',
          levelBase: 10,
          bossHpMult: 0.85,
        },
      },
      Hard: {
        difficulty: 'Hard',
        objective: 'Defeat the Void Emperor under 85 HP lock with Drones disabled.',
        constraintsLabel: '85 Max HP · No Drones · Final Boss',
        rewardCredits: 780,
        rewardCrystals: 3,
        rules: {
          maxHpOverride: 85,
          disableDrones: true,
          bossId: 'void_emperor',
          levelBase: 10,
          bossHpMult: 1.05,
          bossDamageMult: 1.12,
          bossAggressionMult: 1.12,
        },
      },
      Extreme: {
        difficulty: 'Extreme',
        objective: 'Confront and destroy the Void Emperor under 75 HP hull lock.',
        constraintsLabel: '75 Max HP · No Drones · Final Boss',
        rewardCredits: 980,
        rewardCrystals: 4,
        rules: {
          maxHpOverride: 75,
          disableDrones: true,
          bossId: 'void_emperor',
          levelBase: 10,
          bossHpMult: 1.28,
          bossDamageMult: 1.22,
          bossAggressionMult: 1.24,
        },
      },
    },
  }),
];

export const CHALLENGE_BY_ID: Record<string, ChallengeDefinition> = Object.fromEntries(
  CHALLENGES.map((c) => [c.id, c])
);

export function resolveChallengeTier(
  challengeId: string,
  tier?: ChallengeDifficulty
): { challenge: ChallengeDefinition; tier: ChallengeTierConfig } | null {
  const challenge = CHALLENGE_BY_ID[challengeId];
  if (!challenge) return null;
  const targetTier = tier && challenge.tiers[tier] ? tier : challenge.legacyDifficulty;
  return {
    challenge,
    tier: challenge.tiers[targetTier],
  };
}

// ============================================================================
// 4. BOSS RUSH — STAGE SCALING & TACTICAL RECOVERY DRAFT
// ============================================================================

export const BOSS_RUSH_ORDER: BossId[] = [
  'iron_guardian',
  'venom_queen',
  'shadow_titan',
  'cyber_leviathan',
  'void_emperor',
];

export interface BossRushStageModifiers {
  stageIndex: number;
  hpMult: number;
  damageMult: number;
  attackRateMult: number;
  projectileSpeedMult: number;
  aggressionMult: number;
}

export function getBossRushStageModifiers(stageIndex: number): BossRushStageModifiers {
  const idx = Math.max(0, Math.min(BOSS_RUSH_ORDER.length - 1, Math.floor(stageIndex)));
  return {
    stageIndex: idx,
    hpMult: Number((0.9 + idx * 0.08).toFixed(2)),
    damageMult: Number((0.95 + idx * 0.06).toFixed(2)),
    attackRateMult: Number((0.96 + idx * 0.055).toFixed(3)),
    projectileSpeedMult: Number((0.98 + idx * 0.045).toFixed(3)),
    aggressionMult: Number((0.96 + idx * 0.06).toFixed(2)),
  };
}

export interface BossRushAscensionModifiers {
  ascensionRank: number;
  hpMult: number;
  damageMult: number;
  attackRateMult: number;
  projectileSpeedMult: number;
  aggressionMult: number;
  patternPressure: 0 | 1 | 2;
}

export interface BossRushEffectiveBossModifiers extends BossRushAscensionModifiers {
  stageIndex: number;
}

export interface BossRushAscensionRewardBreakdown {
  ascensionRank: number;
  creditsBonusPct: number;
  bonusCredits: number;
  bonusCrystals: number;
  totalClearCredits: number;
  totalClearCrystals: number;
  clearExp: number;
}

const BOSS_RUSH_ASCENSION_TABLE: ReadonlyArray<Omit<BossRushAscensionModifiers, 'ascensionRank'>> = [
  { hpMult: 1.0, damageMult: 1.0, attackRateMult: 1.0, projectileSpeedMult: 1.0, aggressionMult: 1.0, patternPressure: 0 }, // Rank 1
  { hpMult: 1.15, damageMult: 1.06, attackRateMult: 1.03, projectileSpeedMult: 1.02, aggressionMult: 1.03, patternPressure: 0 }, // Rank 2
  { hpMult: 1.32, damageMult: 1.13, attackRateMult: 1.07, projectileSpeedMult: 1.04, aggressionMult: 1.06, patternPressure: 1 }, // Rank 3
  { hpMult: 1.5, damageMult: 1.2, attackRateMult: 1.11, projectileSpeedMult: 1.06, aggressionMult: 1.09, patternPressure: 1 }, // Rank 4
  { hpMult: 1.7, damageMult: 1.28, attackRateMult: 1.15, projectileSpeedMult: 1.09, aggressionMult: 1.13, patternPressure: 1 }, // Rank 5
  { hpMult: 1.9, damageMult: 1.36, attackRateMult: 1.19, projectileSpeedMult: 1.12, aggressionMult: 1.17, patternPressure: 2 }, // Rank 6
  { hpMult: 2.1, damageMult: 1.44, attackRateMult: 1.23, projectileSpeedMult: 1.15, aggressionMult: 1.21, patternPressure: 2 }, // Rank 7
  { hpMult: 2.3, damageMult: 1.52, attackRateMult: 1.27, projectileSpeedMult: 1.18, aggressionMult: 1.25, patternPressure: 2 }, // Rank 8
];

export function getBossRushAscensionRank(bossRushClears: number): number {
  const clears = Number.isFinite(bossRushClears) ? Math.max(0, Math.floor(bossRushClears)) : 0;
  return 1 + clears;
}

export function getBossRushAscensionModifiers(ascensionRank: number): BossRushAscensionModifiers {
  const rank = Number.isFinite(ascensionRank) ? Math.max(1, Math.floor(ascensionRank)) : 1;
  if (rank <= BOSS_RUSH_ASCENSION_TABLE.length) {
    return {
      ascensionRank: rank,
      ...BOSS_RUSH_ASCENSION_TABLE[rank - 1],
    };
  }

  // Smooth diminishing progression beyond Rank 8 without runaway spikes
  const extra = rank - BOSS_RUSH_ASCENSION_TABLE.length;
  const r8 = BOSS_RUSH_ASCENSION_TABLE[BOSS_RUSH_ASCENSION_TABLE.length - 1];
  return {
    ascensionRank: rank,
    hpMult: Number(Math.min(4.2, r8.hpMult + 0.55 * Math.log1p(extra * 0.42)).toFixed(2)),
    damageMult: Number(Math.min(2.15, r8.damageMult + 0.24 * Math.log1p(extra * 0.35)).toFixed(2)),
    attackRateMult: Number(Math.min(1.48, r8.attackRateMult + 0.09 * Math.log1p(extra * 0.32)).toFixed(3)),
    projectileSpeedMult: Number(Math.min(1.3, r8.projectileSpeedMult + 0.06 * Math.log1p(extra * 0.3)).toFixed(3)),
    aggressionMult: Number(Math.min(1.42, r8.aggressionMult + 0.08 * Math.log1p(extra * 0.3)).toFixed(2)),
    patternPressure: 2,
  };
}

export function getBossRushEffectiveBossModifiers(
  stageIndex: number,
  ascensionRank: number
): BossRushEffectiveBossModifiers {
  const stage = getBossRushStageModifiers(stageIndex);
  const asc = getBossRushAscensionModifiers(ascensionRank);
  return {
    stageIndex: stage.stageIndex,
    ascensionRank: asc.ascensionRank,
    hpMult: Number((stage.hpMult * asc.hpMult).toFixed(3)),
    damageMult: Number((stage.damageMult * asc.damageMult).toFixed(3)),
    attackRateMult: Number((stage.attackRateMult * asc.attackRateMult).toFixed(3)),
    projectileSpeedMult: Number((stage.projectileSpeedMult * asc.projectileSpeedMult).toFixed(3)),
    aggressionMult: Number((stage.aggressionMult * asc.aggressionMult).toFixed(3)),
    patternPressure: asc.patternPressure,
  };
}

export function getBossRushAscensionReward(
  ascensionRank: number,
  baseClearCredits = 750,
  baseClearCrystals = 3,
  baseClearExp = 140
): BossRushAscensionRewardBreakdown {
  const rank = Math.max(1, Math.floor(ascensionRank));
  const rawCreditsMult =
    rank <= 8
      ? 1 + (rank - 1) * 0.1
      : 1 + Math.min(1.25, 0.7 + 0.24 * Math.log1p((rank - 8) * 0.35));
  const totalClearCredits =
    rank === 1 ? baseClearCredits : Math.round((baseClearCredits * rawCreditsMult) / 10) * 10;
  const bonusCredits = Math.max(0, totalClearCredits - baseClearCredits);

  const bonusCrystals =
    rank === 1
      ? 0
      : rank <= 8
      ? Math.min(4, Math.floor(rank / 2))
      : 4 + (rank >= 11 ? 1 : 0);
  const totalClearCrystals = baseClearCrystals + bonusCrystals;
  const expMult = 1 + Math.min(0.6, (rank - 1) * 0.06);
  const clearExp = Math.round(baseClearExp * expMult);

  return {
    ascensionRank: rank,
    creditsBonusPct: Math.round(((totalClearCredits - baseClearCredits) / Math.max(1, baseClearCredits)) * 100),
    bonusCredits,
    bonusCrystals,
    totalClearCredits,
    totalClearCrystals,
    clearExp,
  };
}

export type BossRushRecoveryId =
  | 'emergency_repair'
  | 'shield_recharge'
  | 'combat_calibration';

export interface BossRushRecoveryOption {
  id: BossRushRecoveryId;
  title: string;
  subtitle: string;
  accentHex: string;
  hpRestoreRatio: number;
  shieldRestoreRatio: number;
  effectLabel: string;
  description: string;
}

export const BOSS_RUSH_RECOVERY_OPTIONS: BossRushRecoveryOption[] = [
  {
    id: 'emergency_repair',
    title: 'Emergency Repair',
    subtitle: 'HULL RESTORATION',
    accentHex: '#10B981',
    hpRestoreRatio: 0.3,
    shieldRestoreRatio: 0,
    effectLabel: 'Restore 30% Max HP',
    description: 'Nanite hull patches seal structural breaches immediately (clamped to Max HP).',
  },
  {
    id: 'shield_recharge',
    title: 'Shield Recharge',
    subtitle: 'BARRIER CAPACITORS',
    accentHex: '#38BDF8',
    hpRestoreRatio: 0,
    shieldRestoreRatio: 0.45,
    effectLabel: 'Restore 45% Max Shield',
    description: 'Overcharges shield generators to absorb incoming dreadnought salvos (clamped to Max Shield).',
  },
  {
    id: 'combat_calibration',
    title: 'Combat Calibration',
    subtitle: 'BALANCED RECOVERY',
    accentHex: '#A855F7',
    hpRestoreRatio: 0.15,
    shieldRestoreRatio: 0.2,
    effectLabel: '+15% Max HP & +20% Max Shield',
    description: 'Synchronizes hull nanites and barrier capacitors for balanced endurance.',
  },
];

export const BOSS_RUSH_RECOVERY_BY_ID: Record<BossRushRecoveryId, BossRushRecoveryOption> =
  Object.fromEntries(BOSS_RUSH_RECOVERY_OPTIONS.map((o) => [o.id, o])) as Record<
    BossRushRecoveryId,
    BossRushRecoveryOption
  >;

export interface BossRushPerformanceSummary {
  grade: 'S+' | 'S' | 'A' | 'B';
  bonusCredits: number;
  bonusCrystals: number;
  hpRemainingPct: number;
  clearTimeSec: number;
}

export function calculateBossRushPerformanceBonus(params: {
  hpRatio: number;
  clearTimeSec: number;
  score: number;
}): BossRushPerformanceSummary {
  const hpPct = Math.max(0, Math.min(100, Math.round(params.hpRatio * 100)));
  const timeSec = Math.max(1, Math.round(params.clearTimeSec));

  // Grade points combine surviving hull integrity, clear speed, and score efficiency
  let pts = 0;
  if (hpPct >= 75) pts += 4;
  else if (hpPct >= 50) pts += 3;
  else if (hpPct >= 25) pts += 2;
  else pts += 1;

  if (timeSec <= 160) pts += 4;
  else if (timeSec <= 220) pts += 3;
  else if (timeSec <= 300) pts += 2;
  else pts += 1;

  if (params.score >= 70000) pts += 2;
  else if (params.score >= 50000) pts += 1;

  if (pts >= 9) {
    return { grade: 'S+', bonusCredits: 320, bonusCrystals: 2, hpRemainingPct: hpPct, clearTimeSec: timeSec };
  }
  if (pts >= 7) {
    return { grade: 'S', bonusCredits: 220, bonusCrystals: 1, hpRemainingPct: hpPct, clearTimeSec: timeSec };
  }
  if (pts >= 5) {
    return { grade: 'A', bonusCredits: 130, bonusCrystals: 1, hpRemainingPct: hpPct, clearTimeSec: timeSec };
  }
  return { grade: 'B', bonusCredits: 60, bonusCrystals: 0, hpRemainingPct: hpPct, clearTimeSec: timeSec };
}
