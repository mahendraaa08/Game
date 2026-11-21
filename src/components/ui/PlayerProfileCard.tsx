import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertTriangle,
  Check,
  Pencil,
  SlidersHorizontal,
  Sparkles,
  X,
} from 'lucide-react';
import { SoundManager } from '../../game/audio/SoundManager';
import {
  PLAYER_NAME_CHANGE_COST_GEMS,
  PLAYER_NAME_MAX_LENGTH,
} from '../../game/config/EconomyConfig';
import { MAX_PLAYER_LEVEL } from '../../game/config/LevelProgressionConfig';
import {
  PROFILE_AVATARS,
  PROFILE_AVATAR_MAP,
  PROFILE_BORDERS,
  PROFILE_BORDER_MAP,
  type ProfileAvatarId,
  type ProfileBorderId,
} from '../../game/config/ProfileCosmeticsConfig';
import { SHIPS } from '../../game/config/ShipConfig';
import {
  ActionResult,
  ProgressionManager,
  computeCommanderRank,
} from '../../game/systems/ProgressionManager';
import { PlayerProgress } from '../../game/utils/StorageManager';
import { ConfirmButtonPair } from './ConfirmButtonPair';
import { CreditCoinIcon, CrystalGemIcon } from './CurrencyBadges';
import { ProfileAvatarBadge } from './ProfileAvatarBadge';

interface PlayerProfileCardProps {
  open: boolean;
  progress: PlayerProgress;
  onClose: () => void;
  onFeedback?: (res: ActionResult) => void;
}

type ProfileSubModal = 'none' | 'rename' | 'customize';

export const PlayerProfileCard: React.FC<PlayerProfileCardProps> = ({
  open,
  progress,
  onClose,
  onFeedback,
}) => {
  const activeShip = SHIPS[progress.selectedShip] ?? SHIPS.falcon_x;
  const rank = useMemo(() => computeCommanderRank(progress), [progress]);

  const [subModal, setSubModal] = useState<ProfileSubModal>('none');
  const [nameInput, setNameInput] = useState(progress.playerName);
  const [nameError, setNameError] = useState<string | null>(null);
  const [draftAvatarId, setDraftAvatarId] = useState<ProfileAvatarId>(progress.avatarId);
  const [draftBorderId, setDraftBorderId] = useState<ProfileBorderId>(progress.borderId);
  const submitLockRef = useRef(false);

  useEffect(() => {
    if (!open) {
      setSubModal('none');
      setNameError(null);
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        if (subModal !== 'none') {
          setSubModal('none');
          setNameError(null);
        } else {
          onClose();
        }
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, subModal, onClose]);

  const openChangeNameModal = () => {
    SoundManager.unlock();
    SoundManager.playButtonClick();
    setNameInput(progress.playerName);
    setNameError(null);
    setSubModal('rename');
  };

  const openCustomizeModal = () => {
    SoundManager.unlock();
    SoundManager.playButtonClick();
    setDraftAvatarId(progress.avatarId);
    setDraftBorderId(progress.borderId);
    setSubModal('customize');
  };

  const closeSubModal = () => {
    SoundManager.playButtonClick();
    setSubModal('none');
    setNameError(null);
  };

  const trimmedCandidate = nameInput.trim().replace(/\s+/g, ' ');
  const hasEnoughGems = progress.crystals >= PLAYER_NAME_CHANGE_COST_GEMS;
  const isSameName = trimmedCandidate === progress.playerName;
  const isEmptyName = trimmedCandidate.length === 0;
  const canConfirmName = !isEmptyName && !isSameName && hasEnoughGems;

  const handleConfirmNameChange = () => {
    if (submitLockRef.current) return;
    submitLockRef.current = true;

    try {
      SoundManager.unlock();
      const res = ProgressionManager.changePlayerName(nameInput);
      if (res.ok) {
        SoundManager.playPowerUp();
        setSubModal('none');
        setNameError(null);
        onFeedback?.(res);
      } else {
        SoundManager.playButtonClick();
        setNameError(res.message);
        onFeedback?.(res);
      }
    } finally {
      window.setTimeout(() => {
        submitLockRef.current = false;
      }, 150);
    }
  };

  const handleConfirmCosmetics = () => {
    SoundManager.unlock();
    const res = ProgressionManager.setProfileCosmetics(draftAvatarId, draftBorderId);
    if (res.ok) {
      SoundManager.playPowerUp();
    } else {
      SoundManager.playButtonClick();
    }
    setSubModal('none');
    if (draftAvatarId !== progress.avatarId || draftBorderId !== progress.borderId) {
      onFeedback?.(res);
    }
  };

  const draftAvatarDef = PROFILE_AVATAR_MAP[draftAvatarId] ?? PROFILE_AVATAR_MAP.vanguard;
  const draftBorderDef = PROFILE_BORDER_MAP[draftBorderId] ?? PROFILE_BORDER_MAP.standard_alloy;

  return (
    <div
      aria-hidden={!open}
      className={`fixed inset-0 z-40 transition-opacity duration-200 ${
        open ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0'
      }`}
    >
      {/* Click-outside Backdrop */}
      <div
        onClick={() => {
          if (subModal !== 'none') {
            setSubModal('none');
            setNameError(null);
          } else {
            onClose();
          }
        }}
        className="absolute inset-0 bg-[#03060f]/60 backdrop-blur-[2px]"
      />

      {/* Compact Popup Card anchored near Top-Left */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="player-profile-title"
        onClick={(e) => e.stopPropagation()}
        className={`absolute left-4 top-[calc(max(0.875rem,env(safe-area-inset-top))+54px)] w-[calc(100vw-2rem)] max-w-[356px] origin-top-left overflow-hidden rounded-2xl border border-slate-700/75 bg-[#070f20]/96 shadow-2xl shadow-black/70 backdrop-blur-md transition-[opacity,transform] duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] sm:left-8 lg:left-12 ${
          open ? 'translate-y-0 scale-100 opacity-100' : '-translate-y-2 scale-[0.96] opacity-0'
        }`}
      >
        {/* Header: Interactive Avatar (opens Avatar & Border popup) + Name + Inline Minimalist Rename + Close */}
        <div className="flex items-start justify-between gap-2 border-b border-slate-800/85 px-5 py-4">
          <div className="flex min-w-0 items-center gap-3.5">
            <button
              type="button"
              onClick={openCustomizeModal}
              aria-label="Customize Avatar and Border"
              title="Customize Avatar & Border"
              className="group relative shrink-0 rounded-xl transition-transform duration-150 hover:scale-[1.04] active:scale-95 focus-visible:outline-2 focus-visible:outline-cyan-400"
            >
              <ProfileAvatarBadge
                avatarId={progress.avatarId}
                borderId={progress.borderId}
                size="md"
              />
              <span
                aria-hidden="true"
                className="absolute -bottom-1 -right-1 flex h-4.5 w-4.5 items-center justify-center rounded-full border border-slate-700 bg-[#071124] text-cyan-300 shadow-sm transition-colors group-hover:border-cyan-300 group-hover:text-white"
              >
                <SlidersHorizontal className="h-2.5 w-2.5" />
              </span>
            </button>

            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <h2
                  id="player-profile-title"
                  className="truncate font-display text-base font-bold tracking-wide text-white"
                >
                  {progress.playerName}
                </h2>

                <button
                  type="button"
                  onClick={openChangeNameModal}
                  aria-label="Rename Commander"
                  title={`Rename (${PLAYER_NAME_CHANGE_COST_GEMS} Gems)`}
                  className="inline-flex h-6 shrink-0 items-center gap-1 rounded-md px-1.5 text-[10.5px] font-medium text-slate-400 transition-[background-color,color,transform] duration-150 hover:bg-white/[0.08] hover:text-cyan-200 active:scale-95 focus-visible:outline-2 focus-visible:outline-cyan-400"
                >
                  <Pencil className="h-2.5 w-2.5 shrink-0" />
                  <span>Rename</span>
                </button>
              </div>

              <div className="mt-0.5 flex items-center gap-1.5 text-xs text-slate-400">
                <span className="font-mono-num font-semibold text-cyan-300">
                  Lv.{rank.level}
                  {rank.isMaxLevel ? ' MAX' : `/${MAX_PLAYER_LEVEL}`}
                </span>
                <span aria-hidden="true">·</span>
                <span className="truncate">{rank.title}</span>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close Profile"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-slate-400 transition-[background-color,color,transform] duration-150 hover:bg-white/[0.07] hover:text-white active:scale-95 focus-visible:outline-2 focus-visible:outline-cyan-400"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* EXP Progress Strip */}
        <div className="border-b border-slate-800/80 bg-[#050a17]/60 px-5 py-2.5">
          <div className="flex items-center justify-between text-[11px]">
            <span className="font-medium text-slate-400">Experience</span>
            <span className="font-mono-num font-semibold text-slate-200">
              {rank.isMaxLevel
                ? 'MAX LEVEL (99)'
                : `${rank.currentExp.toLocaleString()} / ${rank.requiredExp.toLocaleString()} EXP`}
            </span>
          </div>
          <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-slate-900">
            <div
              className="h-full rounded-full bg-gradient-to-r from-sky-400 to-cyan-300 transition-[width] duration-300"
              style={{ width: `${rank.isMaxLevel ? 100 : Math.max(3, rank.progressPct)}%` }}
            />
          </div>
        </div>

        {/* Wallet Balances */}
        <div className="grid grid-cols-2 divide-x divide-slate-800/80 border-b border-slate-800/80 bg-[#050a17]/75">
          <div className="flex items-center gap-2.5 px-5 py-3">
            <CreditCoinIcon className="h-4 w-4 shrink-0" />
            <div className="min-w-0">
              <div className="text-[11px] text-slate-400">Credits</div>
              <div className="truncate font-mono-num text-sm font-bold text-amber-200">
                {progress.credits.toLocaleString()}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2.5 px-5 py-3">
            <CrystalGemIcon className="h-4 w-4 shrink-0" />
            <div className="min-w-0">
              <div className="text-[11px] text-slate-400">Void Gems</div>
              <div className="truncate font-mono-num text-sm font-bold text-cyan-200">
                {progress.crystals.toLocaleString()}
              </div>
            </div>
          </div>
        </div>

        {/* Clean Key Progression & Combat Stats */}
        <div className="grid grid-cols-2 gap-x-5 gap-y-3 px-5 py-4 text-xs">
          <div>
            <div className="text-slate-400">Active Fighter</div>
            <div className="mt-0.5 truncate font-display text-sm font-semibold text-white">
              {activeShip.name}
            </div>
          </div>
          <div>
            <div className="text-slate-400">Campaign</div>
            <div className="mt-0.5 font-mono-num text-sm font-bold text-sky-300">
              {progress.completedLevels.length}/10 Sectors
            </div>
          </div>
          <div>
            <div className="text-slate-400">High Score</div>
            <div className="mt-0.5 font-mono-num text-sm font-bold text-white">
              {progress.highScore.toLocaleString()}
            </div>
          </div>
          <div>
            <div className="text-slate-400">Enemies Defeated</div>
            <div className="mt-0.5 font-mono-num text-sm font-bold text-white">
              {progress.totalKills.toLocaleString()}
            </div>
          </div>
          <div>
            <div className="text-slate-400">Bosses Defeated</div>
            <div className="mt-0.5 font-mono-num text-sm font-bold text-white">
              {progress.stats.totalBossKills.toLocaleString()}
            </div>
          </div>
          <div>
            <div className="text-slate-400">Sorties Flown</div>
            <div className="mt-0.5 font-mono-num text-sm font-bold text-white">
              {progress.stats.totalRuns.toLocaleString()}
            </div>
          </div>
        </div>
      </div>

      {/* Sub-Modal: Change Name */}
      {subModal === 'rename' && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="change-name-title"
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#03060f]/78 p-4 backdrop-blur-sm"
          onClick={closeSubModal}
        >
          <div
            className="panel-swap w-full max-w-sm rounded-2xl border border-cyan-300/35 bg-[#070f20]/98 p-5 sm:p-6 shadow-2xl shadow-black/75"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-cyan-400/30 bg-cyan-400/12">
                  <Pencil className="h-4 w-4 text-cyan-300" />
                </span>
                <div>
                  <h3
                    id="change-name-title"
                    className="font-display text-base font-bold tracking-wide text-white"
                  >
                    Change Commander Name
                  </h3>
                  <p className="mt-0.5 text-[11.5px] text-slate-400">
                    Current: <span className="font-semibold text-slate-200">{progress.playerName}</span>
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={closeSubModal}
                aria-label="Close Change Name"
                className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-800/80 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleConfirmNameChange();
              }}
              className="mt-4 flex flex-col gap-3"
            >
              <div>
                <div className="mb-1.5 flex items-center justify-between text-xs">
                  <label htmlFor="commander-name-input" className="font-medium text-slate-300">
                    New Commander Name
                  </label>
                  <span className="font-mono-num text-[11px] text-slate-400">
                    {nameInput.trim().length}/{PLAYER_NAME_MAX_LENGTH}
                  </span>
                </div>
                <input
                  id="commander-name-input"
                  type="text"
                  autoFocus
                  maxLength={PLAYER_NAME_MAX_LENGTH}
                  value={nameInput}
                  onChange={(e) => {
                    setNameInput(e.target.value);
                    if (nameError) setNameError(null);
                  }}
                  placeholder="Enter new name"
                  className="h-11 w-full rounded-xl border border-slate-700/80 bg-[#040814] px-3.5 font-display text-sm font-semibold tracking-wide text-white outline-none transition-colors placeholder:font-sans placeholder:font-normal placeholder:text-slate-500 focus:border-cyan-400/80"
                />
              </div>

              <div className="flex items-center justify-between border-y border-slate-800/80 py-2.5 text-xs">
                <span className="text-slate-300">Rename Fee</span>
                <div className="flex items-center gap-3 font-mono-num">
                  <span className="flex items-center gap-1 font-bold text-cyan-200">
                    <CrystalGemIcon className="h-3.5 w-3.5 shrink-0" />
                    {PLAYER_NAME_CHANGE_COST_GEMS} Gems
                  </span>
                  <span className="text-slate-600">|</span>
                  <span
                    className={`font-semibold ${
                      hasEnoughGems ? 'text-emerald-300' : 'text-rose-300'
                    }`}
                  >
                    You have {progress.crystals.toLocaleString()}
                  </span>
                </div>
              </div>

              {(nameError || !hasEnoughGems) && (
                <div
                  role="alert"
                  className="flex items-center gap-2 rounded-xl border border-rose-400/35 bg-[#1a0a12]/85 px-3 py-2 text-xs text-rose-200"
                >
                  <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-rose-400" />
                  <span>
                    {nameError ??
                      `Insufficient Void Gems. Need ${PLAYER_NAME_CHANGE_COST_GEMS} Gems to change name.`}
                  </span>
                </div>
              )}

              {!nameError && hasEnoughGems && !isEmptyName && !isSameName && (
                <div className="flex items-center gap-2 text-[11.5px] text-emerald-300/90">
                  <Check className="h-3.5 w-3.5 shrink-0" />
                  <span>
                    Balance after change: {(progress.crystals - PLAYER_NAME_CHANGE_COST_GEMS).toLocaleString()} Gems
                  </span>
                </div>
              )}

              <ConfirmButtonPair
                className="mt-1 grid grid-cols-2 gap-3"
                confirmLabel={`Pay ${PLAYER_NAME_CHANGE_COST_GEMS} Gems`}
                confirmDisabled={!canConfirmName}
                onCancel={closeSubModal}
                onConfirm={handleConfirmNameChange}
              />
            </form>
          </div>
        </div>
      )}

      {/* Sub-Modal: Unified Avatar & Border Customization Popup */}
      {subModal === 'customize' && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="customize-profile-title"
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#03060f]/78 p-4 backdrop-blur-sm"
          onClick={closeSubModal}
        >
          <div
            className="scroll-panel panel-swap max-h-[calc(100dvh-2rem)] w-full max-w-[440px] overflow-y-auto rounded-2xl border border-slate-700/80 bg-[#070f20]/98 p-5 shadow-2xl shadow-black/75"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Live Combined Preview Header */}
            <div className="flex items-center justify-between gap-3 border-b border-slate-800/80 pb-3.5">
              <div className="flex items-center gap-3.5">
                <ProfileAvatarBadge
                  avatarId={draftAvatarId}
                  borderId={draftBorderId}
                  size="lg"
                />
                <div className="min-w-0">
                  <h3
                    id="customize-profile-title"
                    className="font-display text-base font-bold tracking-wide text-white"
                  >
                    Customize Profile
                  </h3>
                  <p className="mt-0.5 truncate text-[11.5px] text-slate-400">
                    <span className="font-medium text-cyan-200">{draftAvatarDef.name}</span>
                    <span className="mx-1.5 text-slate-600">·</span>
                    <span className="font-medium text-amber-200">{draftBorderDef.name}</span>
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={closeSubModal}
                aria-label="Close Customize Profile"
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-white/[0.07] hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Section 1: Avatar Grid */}
            <div className="mt-4">
              <div className="mb-2 flex items-center justify-between text-[11px]">
                <span className="font-display font-semibold uppercase tracking-wider text-slate-300">
                  Profile Avatar
                </span>
                <span className="font-mono-num text-slate-400">{draftAvatarDef.name}</span>
              </div>
              <div className="grid grid-cols-4 gap-2">
                {PROFILE_AVATARS.map((av) => {
                  const selected = draftAvatarId === av.id;
                  return (
                    <button
                      key={av.id}
                      type="button"
                      onClick={() => {
                        SoundManager.playButtonClick();
                        setDraftAvatarId(av.id);
                      }}
                      title={av.name}
                      className={`relative flex flex-col items-center gap-1.5 rounded-xl border px-2 py-2.5 text-center transition-[border-color,background-color,transform] duration-150 active:scale-[0.96] ${
                        selected
                          ? 'border-cyan-300/75 bg-cyan-400/14 shadow-[0_0_14px_rgba(34,211,238,0.14)]'
                          : 'border-slate-800/90 bg-[#050b18]/90 hover:border-slate-600/80 hover:bg-[#0b162d]'
                      }`}
                    >
                      {selected && (
                        <span className="absolute right-1 top-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-cyan-400 text-slate-950">
                          <Check className="h-2.5 w-2.5 stroke-[3]" />
                        </span>
                      )}
                      <ProfileAvatarBadge
                        avatarId={av.id}
                        borderId="standard_alloy"
                        size="sm"
                      />
                      <span className="w-full truncate text-[10px] font-medium text-slate-200">
                        {av.name.split(' ')[0]}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Section 2: Border Grid */}
            <div className="mt-4">
              <div className="mb-2 flex items-center justify-between text-[11px]">
                <span className="font-display font-semibold uppercase tracking-wider text-slate-300">
                  Profile Border
                </span>
                <span className="font-mono-num text-slate-400">{draftBorderDef.name}</span>
              </div>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {PROFILE_BORDERS.map((b) => {
                  const selected = draftBorderId === b.id;
                  return (
                    <button
                      key={b.id}
                      type="button"
                      onClick={() => {
                        SoundManager.playButtonClick();
                        setDraftBorderId(b.id);
                      }}
                      className={`relative flex items-center gap-2.5 rounded-xl border px-2.5 py-2 text-left transition-[border-color,background-color,transform] duration-150 active:scale-[0.97] ${
                        selected
                          ? 'border-cyan-300/75 bg-cyan-400/14 shadow-[0_0_14px_rgba(34,211,238,0.14)]'
                          : 'border-slate-800/90 bg-[#050b18]/90 hover:border-slate-600/80 hover:bg-[#0b162d]'
                      }`}
                    >
                      {selected && (
                        <span className="absolute right-1.5 top-1.5 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-cyan-400 text-slate-950">
                          <Check className="h-2.5 w-2.5 stroke-[3]" />
                        </span>
                      )}
                      <ProfileAvatarBadge
                        avatarId={draftAvatarId}
                        borderId={b.id}
                        size="xs"
                      />
                      <div className="min-w-0 pr-3">
                        <div className="truncate text-[11px] font-semibold text-slate-100">
                          {b.name}
                        </div>
                        <div className="mt-0.5 flex items-center gap-1 text-[9.5px] text-slate-400">
                          <Sparkles className="h-2.5 w-2.5 shrink-0" style={{ color: b.accentHex }} />
                          <span>{b.tierLabel}</span>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <ConfirmButtonPair
              className="mt-5 grid grid-cols-2 gap-2.5"
              confirmLabel="Confirm"
              cancelLabel="Cancel"
              onCancel={closeSubModal}
              onConfirm={handleConfirmCosmetics}
            />
          </div>
        </div>
      )}
    </div>
  );
};
