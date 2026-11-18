import React, { useState } from 'react';
import { BookOpen, Lock, ShieldAlert, CheckCircle2 } from 'lucide-react';
import { BOSS_CONFIGS, BossId } from '../../game/config/BossConfig';
import { DRONE_LIST } from '../../game/config/DroneConfig';
import { ENEMY_CONFIGS, EnemyClass } from '../../game/config/EnemyConfig';
import { EQUIPMENT_LIST, RARITY_CONFIG } from '../../game/config/EquipmentConfig';
import { CAMPAIGN_LEVELS } from '../../game/config/LevelConfig';
import { SHIP_LIST } from '../../game/config/ShipConfig';
import { getWeaponDamageAtLevel, SPECIAL_LIST, WEAPON_LIST } from '../../game/config/WeaponConfig';
import { SoundManager } from '../../game/audio/SoundManager';
import { PlayerProgress } from '../../game/utils/StorageManager';
import { DroneArtBadge, ShipArtBadge } from './ShipArtBadge';

type CodexSection =
  | 'enemies'
  | 'bosses'
  | 'ships'
  | 'weapons'
  | 'equipment'
  | 'drones'
  | 'records';

const SECTIONS: Array<{ id: CodexSection; label: string }> = [
  { id: 'enemies', label: 'Enemies' },
  { id: 'bosses', label: 'Bosses' },
  { id: 'ships', label: 'Spaceships' },
  { id: 'weapons', label: 'Weapons' },
  { id: 'equipment', label: 'Equipment' },
  { id: 'drones', label: 'Drones' },
  { id: 'records', label: 'Campaign Records' },
];

export const CodexPanel: React.FC<{ progress: PlayerProgress }> = ({ progress }) => {
  const [section, setSection] = useState<CodexSection>('enemies');

  const enemyKeys: EnemyClass[] = ['scout', 'fighter', 'bomber', 'tank', 'elite'];
  const bossKeys: BossId[] = [
    'iron_guardian',
    'venom_queen',
    'shadow_titan',
    'cyber_leviathan',
    'void_emperor',
  ];

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 font-display text-sm font-bold text-sky-300">
          <BookOpen className="h-4 w-4" />
          <span>Galactic Intelligence Codex</span>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {SECTIONS.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => {
                SoundManager.playButtonClick();
                setSection(s.id);
              }}
              className={`min-h-[36px] rounded-lg border px-3 text-xs font-semibold ${
                section === s.id
                  ? 'border-sky-400 bg-sky-500/15 text-white'
                  : 'border-slate-800 bg-slate-900/70 text-slate-300 hover:border-slate-600'
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* 1. Enemies */}
      {section === 'enemies' && (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {enemyKeys.map((key) => {
            const def = ENEMY_CONFIGS[key];
            const discovered = progress.codex.discoveredEnemies.includes(key);
            return (
              <div
                key={key}
                className="rounded-xl border border-slate-800 bg-[#081022]/90 p-4"
              >
                <div className="flex items-center justify-between text-xs">
                  <span className="font-mono-num uppercase text-slate-400">{def.id}</span>
                  {discovered ? (
                    <span className="font-semibold text-emerald-400">Logged</span>
                  ) : (
                    <span className="flex items-center gap-1 text-slate-500">
                      <Lock className="h-3 w-3" /> Undiscovered
                    </span>
                  )}
                </div>
                <h4 className="mt-1 font-display text-lg font-bold text-white">
                  {discovered ? def.name : 'Unknown Hostile Craft'}
                </h4>
                {discovered ? (
                  <div className="mt-2 space-y-1 text-xs text-slate-300">
                    <div>Behavior: {def.defaultBehavior} · Pattern: {def.attackPattern}</div>
                    <div className="font-mono-num text-sky-300">
                      Base HP {def.maxHp} · Speed {def.speed} · Score {def.scoreReward}
                    </div>
                  </div>
                ) : (
                  <p className="mt-2 text-xs text-slate-500">
                    Encounter this enemy class in active combat to record telemetry.
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* 2. Bosses */}
      {section === 'bosses' && (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {bossKeys.map((key) => {
            const b = BOSS_CONFIGS[key];
            const encountered = progress.codex.encounteredBosses.includes(key);
            const defeated = progress.codex.defeatedBosses.includes(key);

            return (
              <div
                key={key}
                className="rounded-xl border border-slate-800 bg-[#081022]/90 p-4"
              >
                <div className="flex items-center justify-between text-xs">
                  <span className="font-mono-num text-slate-400">
                    Sector {String(b.levelAssigned).padStart(2, '0')} Commander
                  </span>
                  {defeated ? (
                    <span className="flex items-center gap-1 font-semibold text-emerald-400">
                      <CheckCircle2 className="h-3.5 w-3.5" /> Defeated
                    </span>
                  ) : encountered ? (
                    <span className="flex items-center gap-1 font-semibold text-amber-300">
                      <ShieldAlert className="h-3.5 w-3.5" /> Encountered
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-slate-500">
                      <Lock className="h-3 w-3" /> Unseen
                    </span>
                  )}
                </div>

                <h4 className="mt-1 font-display text-lg font-bold text-rose-300">
                  {encountered || defeated ? b.name : 'Classified Void Commander'}
                </h4>
                {encountered || defeated ? (
                  <>
                    <div className="text-xs font-medium text-slate-400">{b.title}</div>
                    <p className="mt-2 text-xs leading-relaxed text-slate-300">{b.description}</p>
                    <div className="mt-2 font-mono-num text-[11px] text-sky-300">
                      Base Hull {b.maxHp.toLocaleString()} · Bounty {b.scoreReward.toLocaleString()} PTS
                    </div>
                  </>
                ) : (
                  <p className="mt-2 text-xs text-slate-500">
                    Engage this Void Commander in Campaign Sector {b.levelAssigned} or Boss Rush to unlock dossier.
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* 3. Spaceships */}
      {section === 'ships' && (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {SHIP_LIST.map((s) => {
            const owned = progress.unlockedShips.includes(s.id);
            return (
              <div key={s.id} className="rounded-xl border border-slate-800 bg-[#081022]/90 p-3.5">
                <div className="flex items-center gap-2.5">
                  <ShipArtBadge shipId={s.id} size={40} />
                  <div>
                    <div className="font-display text-sm font-bold text-white">{s.name}</div>
                    <div className="text-[11px] text-slate-400">
                      {s.role} · {owned ? 'In Fleet' : 'Locked'}
                    </div>
                  </div>
                </div>
                <p className="mt-2 text-[11px] text-slate-300">{s.passiveName}: {s.passiveDescription}</p>
              </div>
            );
          })}
        </div>
      )}

      {/* 4. Weapons */}
      {section === 'weapons' && (
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {WEAPON_LIST.map((w) => {
              const owned = progress.unlockedWeapons.includes(w.id);
              const lvl = progress.weaponLevels[w.id] ?? 1;
              return (
                <div key={w.id} className="rounded-xl border border-slate-800 bg-[#081022]/90 p-4">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-display text-sm font-bold" style={{ color: w.colorHex }}>
                      {w.name}
                    </span>
                    <span className="font-mono-num text-slate-400">
                      {owned ? `Lv.${lvl}/${w.maxWeaponLevel}` : 'Locked'}
                    </span>
                  </div>
                  <p className="mt-1.5 text-xs text-slate-300">{w.description}</p>
                  <div className="mt-2 font-mono-num text-[11px] text-sky-300">
                    DMG {getWeaponDamageAtLevel(w, lvl)} · Range {w.rangeLabel}
                  </div>
                </div>
              );
            })}
          </div>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            {SPECIAL_LIST.map((sp) => (
              <div key={sp.id} className="rounded-xl border border-slate-800 bg-slate-950/70 p-3.5">
                <div className="font-display text-sm font-bold text-purple-300">{sp.name}</div>
                <p className="mt-1 text-xs text-slate-400">{sp.description}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 5. Equipment */}
      {section === 'equipment' && (
        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-4">
          {EQUIPMENT_LIST.map((eq) => {
            const rarity = RARITY_CONFIG[eq.rarity];
            const lvl = progress.ownedEquipment[eq.id] ?? 0;
            return (
              <div key={eq.id} className={`rounded-xl border bg-[#081022]/90 p-3 ${rarity.borderClass}`}>
                <div className="flex justify-between text-[11px]">
                  <span className={rarity.textClass}>{rarity.label} · {eq.slot.toUpperCase()}</span>
                  <span className="font-mono-num text-slate-400">{lvl > 0 ? `Lv.${lvl}` : 'Unowned'}</span>
                </div>
                <div className="mt-1 font-display text-sm font-bold text-white">{eq.name}</div>
                <div className="mt-1 text-[11px] text-sky-300">{eq.passiveText}</div>
              </div>
            );
          })}
        </div>
      )}

      {/* 6. Drones */}
      {section === 'drones' && (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {DRONE_LIST.map((d) => {
            const lvl = progress.ownedDrones[d.id] ?? 0;
            return (
              <div key={d.id} className="rounded-xl border border-slate-800 bg-[#081022]/90 p-4">
                <div className="flex items-center gap-2.5">
                  <DroneArtBadge droneId={d.id} colorHex={d.colorHex} size={38} />
                  <div>
                    <div className="font-display text-sm font-bold text-white">{d.name}</div>
                    <div className="text-[11px] text-slate-400">
                      {d.role} · {lvl > 0 ? `Lv.${lvl}/${d.maxLevel}` : 'Locked'}
                    </div>
                  </div>
                </div>
                <p className="mt-2 text-xs text-slate-300">{d.abilitySummary}</p>
              </div>
            );
          })}
        </div>
      )}

      {/* 7. Campaign & Service Records */}
      {section === 'records' && (
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="rounded-xl border border-slate-800 bg-[#081022]/90 p-3.5">
              <div className="text-xs text-slate-400">Lifetime Kills</div>
              <div className="font-mono-num text-xl font-bold text-white">{progress.totalKills.toLocaleString()}</div>
            </div>
            <div className="rounded-xl border border-slate-800 bg-[#081022]/90 p-3.5">
              <div className="text-xs text-slate-400">Bosses Defeated</div>
              <div className="font-mono-num text-xl font-bold text-rose-300">{progress.stats.totalBossKills}</div>
            </div>
            <div className="rounded-xl border border-slate-800 bg-[#081022]/90 p-3.5">
              <div className="text-xs text-slate-400">High Score</div>
              <div className="font-mono-num text-xl font-bold text-sky-300">{progress.highScore.toLocaleString()}</div>
            </div>
            <div className="rounded-xl border border-slate-800 bg-[#081022]/90 p-3.5">
              <div className="text-xs text-slate-400">Endless Best</div>
              <div className="font-mono-num text-xl font-bold text-purple-300">
                Wave {progress.stats.bestEndlessWave} ({progress.stats.bestEndlessScore.toLocaleString()})
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-5">
            {CAMPAIGN_LEVELS.map((lvl) => {
              const cleared = progress.completedLevels.includes(lvl.levelNumber);
              const score = progress.levelScores[lvl.levelNumber] ?? 0;
              return (
                <div
                  key={lvl.levelNumber}
                  className="rounded-lg border border-slate-800 bg-[#081022]/90 p-3 text-xs"
                >
                  <div className="flex items-center justify-between text-slate-400">
                    <span>Sector {String(lvl.levelNumber).padStart(2, '0')}</span>
                    <span className={cleared ? 'text-emerald-400' : 'text-slate-500'}>
                      {cleared ? 'Cleared' : 'Active'}
                    </span>
                  </div>
                  <div className="mt-1 truncate font-display font-bold text-white">{lvl.name}</div>
                  <div className="mt-1 font-mono-num text-sky-300">
                    Best: {score > 0 ? score.toLocaleString() : '—'}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
