import {
  EQUIPMENT_LIST,
  RARITY_CONFIG,
  scaleEquipmentBonuses,
} from '../../game/config/EquipmentConfig';
import type { CodexEntry, CodexStatItem } from './types';

const SLOT_LABELS: Record<string, string> = {
  offensive: 'Offensive Slot',
  defensive: 'Defensive Slot',
  utility: 'Utility Slot',
  special: 'Special Slot',
};

function buildEquipmentStats(item: (typeof EQUIPMENT_LIST)[number]): CodexStatItem[] {
  const lv1 = scaleEquipmentBonuses(item, 1);
  const lv5 = scaleEquipmentBonuses(item, item.maxLevel);
  const stats: CodexStatItem[] = [];

  if (lv1.damagePct) {
    stats.push({
      label: 'Weapon Damage',
      value: `+${lv1.damagePct}% → +${lv5.damagePct}%`,
      numericValue: lv5.damagePct,
      maxReference: 50,
      tone: 'rose',
    });
  }
  if (lv1.fireRatePct) {
    stats.push({
      label: 'Fire Rate',
      value: `+${lv1.fireRatePct}% → +${lv5.fireRatePct}%`,
      numericValue: lv5.fireRatePct,
      maxReference: 25,
      tone: 'amber',
    });
  }
  if (lv1.critChancePct) {
    stats.push({
      label: 'Critical Chance',
      value: `+${lv1.critChancePct}% → +${lv5.critChancePct}%`,
      numericValue: lv5.critChancePct,
      maxReference: 20,
      tone: 'amber',
    });
  }
  if (lv1.critDamagePct) {
    stats.push({
      label: 'Critical Damage',
      value: `+${lv1.critDamagePct}% → +${lv5.critDamagePct}%`,
      numericValue: lv5.critDamagePct,
      maxReference: 50,
      tone: 'rose',
    });
  }
  if (lv1.maxHpFlat) {
    stats.push({
      label: 'Max Hull Bonus',
      value: `+${lv1.maxHpFlat} → +${lv5.maxHpFlat} HP`,
      numericValue: lv5.maxHpFlat,
      maxReference: 100,
      tone: 'emerald',
    });
  }
  if (lv1.maxShieldFlat) {
    stats.push({
      label: 'Max Shield Bonus',
      value: `+${lv1.maxShieldFlat} → +${lv5.maxShieldFlat} SHD`,
      numericValue: lv5.maxShieldFlat,
      maxReference: 100,
      tone: 'sky',
    });
  }
  if (lv1.damageReductionPct) {
    stats.push({
      label: 'Damage Reduction',
      value: `${lv1.damageReductionPct}% → ${lv5.damageReductionPct}%`,
      numericValue: lv5.damageReductionPct,
      maxReference: 35,
      tone: 'emerald',
    });
  }
  if (lv1.moveSpeedFlat) {
    stats.push({
      label: 'Movement Speed',
      value: `+${lv1.moveSpeedFlat} → +${lv5.moveSpeedFlat} px/s`,
      numericValue: lv5.moveSpeedFlat,
      maxReference: 100,
      tone: 'cyan',
    });
  }
  if (lv1.pickupRangePct) {
    stats.push({
      label: 'Pickup Magnet Range',
      value: `+${lv1.pickupRangePct}% → +${lv5.pickupRangePct}%`,
      numericValue: lv5.pickupRangePct,
      maxReference: 120,
      tone: 'cyan',
    });
  }
  if (lv1.creditBonusPct) {
    stats.push({
      label: 'Credit Salvage Bonus',
      value: `+${lv1.creditBonusPct}% → +${lv5.creditBonusPct}%`,
      numericValue: lv5.creditBonusPct,
      maxReference: 40,
      tone: 'amber',
    });
  }
  if (lv1.specialPowerPct) {
    stats.push({
      label: 'Special Power',
      value: `+${lv1.specialPowerPct}% → +${lv5.specialPowerPct}%`,
      numericValue: lv5.specialPowerPct,
      maxReference: 80,
      tone: 'purple',
    });
  }
  if (lv1.specialCooldownPct) {
    stats.push({
      label: 'Special Cooldown Reduction',
      value: `-${lv1.specialCooldownPct}% → -${lv5.specialCooldownPct}%`,
      numericValue: lv5.specialCooldownPct,
      maxReference: 50,
      tone: 'purple',
    });
  }
  if (lv1.dashCooldownPct) {
    stats.push({
      label: 'Dash Cooldown Reduction',
      value: `-${lv1.dashCooldownPct}% → -${lv5.dashCooldownPct}%`,
      numericValue: lv5.dashCooldownPct,
      maxReference: 50,
      tone: 'cyan',
    });
  }

  return stats;
}

export const GEARS_CODEX: CodexEntry[] = EQUIPMENT_LIST.map((item) => {
  const rarity = RARITY_CONFIG[item.rarity];
  const priceParts = [`${item.costCredits.toLocaleString()} CR`];
  if (item.costCrystals > 0) priceParts.push(`${item.costCrystals} Gems`);

  return {
    id: `gear_${item.id}`,
    sourceId: item.id,
    category: 'gears',
    name: item.name,
    subtitle: `${SLOT_LABELS[item.slot]} · ${rarity.label} · Max Lv${item.maxLevel}`,
    accentHex: rarity.colorHex,
    description: item.description,
    stats: buildEquipmentStats(item),
    specialEffects: [
      {
        title: 'Slot & Upgrade Rule',
        description: `Equips into the ${SLOT_LABELS[item.slot]}. Each upgrade level scales all item stats by +20% (up to +80% at Lv${item.maxLevel}).`,
      },
    ],
    acquisition: `Armory Purchase: ${priceParts.join(' · ')}`,
    searchKeywords: [item.name, item.slot, rarity.label, item.passiveText, 'gear', 'equipment'],
  };
});
