import React from 'react';
import { Compass, Shield, Sword, Zap } from 'lucide-react';
import { DroneDefinition } from '../../../game/config/DroneConfig';
import { EquipmentSlot, EquipmentStatsBonus } from '../../../game/config/EquipmentConfig';

export interface EquipmentSlotMeta {
  id: EquipmentSlot;
  title: string;
  emptyHint: string;
  accentClass: string;
  accentHex: string;
}

export const EQUIPMENT_SLOTS: EquipmentSlotMeta[] = [
  {
    id: 'offensive',
    title: 'Offensive',
    emptyHint: 'Weaponry & Crit',
    accentClass: 'text-sky-300',
    accentHex: '#38BDF8',
  },
  {
    id: 'defensive',
    title: 'Defensive',
    emptyHint: 'Hull & Shielding',
    accentClass: 'text-emerald-300',
    accentHex: '#34D399',
  },
  {
    id: 'utility',
    title: 'Utility',
    emptyHint: 'Speed & Salvage',
    accentClass: 'text-amber-300',
    accentHex: '#FBBF24',
  },
  {
    id: 'special',
    title: 'Special',
    emptyHint: 'Ability Core',
    accentClass: 'text-purple-300',
    accentHex: '#C084FC',
  },
];

export const SLOT_ICON: Record<
  EquipmentSlot,
  React.FC<{ className?: string; style?: React.CSSProperties }>
> = {
  offensive: Sword,
  defensive: Shield,
  utility: Compass,
  special: Zap,
};

export function formatBonusTags(scaled: EquipmentStatsBonus): string[] {
  const parts: string[] = [];
  if (scaled.damagePct) parts.push(`+${scaled.damagePct}% Weapon DMG`);
  if (scaled.fireRatePct) parts.push(`+${scaled.fireRatePct}% Fire Rate`);
  if (scaled.critChancePct) parts.push(`+${scaled.critChancePct}% Crit Chance`);
  if (scaled.critDamagePct) parts.push(`+${scaled.critDamagePct}% Crit DMG`);
  if (scaled.maxHpFlat) parts.push(`+${scaled.maxHpFlat} Max Hull`);
  if (scaled.maxShieldFlat) parts.push(`+${scaled.maxShieldFlat} Shield`);
  if (scaled.damageReductionPct) parts.push(`${scaled.damageReductionPct}% DMG Reduction`);
  if (scaled.moveSpeedFlat) parts.push(`+${scaled.moveSpeedFlat} Speed`);
  if (scaled.pickupRangePct) parts.push(`+${scaled.pickupRangePct}% Pickup Magnet`);
  if (scaled.creditBonusPct) parts.push(`+${scaled.creditBonusPct}% Credit Bonus`);
  if (scaled.specialPowerPct) parts.push(`+${scaled.specialPowerPct}% Special Power`);
  if (scaled.specialCooldownPct) parts.push(`-${scaled.specialCooldownPct}% Special CD`);
  if (scaled.dashCooldownPct) parts.push(`-${scaled.dashCooldownPct}% Dash CD`);
  return parts;
}

export function formatDronePower(d: DroneDefinition, power: number): string {
  if (d.id === 'assault') return `${power} DMG`;
  if (d.id === 'shield') return `+${power} SHD`;
  if (d.id === 'repair') return `+${power} HP`;
  return `+${power}px`;
}
