import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertTriangle,
  Check,
  Palette,
  Pencil,
  Shield,
  Sparkles,
  X,
} from 'lucide-react';
import { SoundManager } from '../../game/audio/SoundManager';
import {
  PLAYER_NAME_CHANGE_COST_GEMS,
  PLAYER_NAME_MAX_LENGTH,
  validatePlayerName,
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

type ProfileSubModal = 'none' | 'rename' | 'appearance';
type AppearanceTab = 'avatar' | 'border';

export const PlayerProfileCard: React.FC<PlayerProfileCardProps> = ({
  open,
  progress,
  onClose,
  onFeedback,
}) => {
  const activeShip = SHIPS[progress.selectedShip] ?? SHIPS.falcon_x;
  const rank = useMemo(() => computeCommanderRank(progress), [progress]);
  const totalCampaignClears = useMemo(
    () =>
      Object.values(progress.campaignProgress).reduce(
        (sum, bucket) => sum + bucket.completedLevels.length,
        0
      ),
    [progress.campaignProgress]
  );

  const [subModal, setSubModal] = useState<ProfileSubModal>('none');
  const [appearanceTab, setAppearanceTab] = useState<AppearanceTab>('avatar');
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

  const openAppearanceModal = (initialTab: AppearanceTab = 'avatar') => {
    SoundManager.unlock();
    SoundManager.playButtonClick();
    setDraftAvatarId(progress.avatarId);
    setDraftBorderId(progress.borderId);
    setAppearanceTab(initialTab);
    setSubModal('appearance');
  };

  const closeSubModal = () => {
    SoundManager.playButtonClick();
    setSubModal('none');
    setNameError(null);
  };

  const nameValidation = validatePlayerName(nameInput, progress.playerName);
  const hasEnoughGems = progress.crystals >= PLAYER_NAME_CHANGE_COST_GEMS;
  const isUnchangedName = nameValidation.cleaned === progress.playerName;
  const isDirty = nameInput !== progress.playerName;
  const inlineValidationError =
    nameError ?? (isDirty && !nameValidation.valid && !isUnchangedName ? nameValidation.error : null);
  const canConfirmName = nameValidation.valid && hasEnoughGems;

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

  const hasAppearanceChanges =
    draftAvatarId !== progress.avatarId || draftBorderId !== progress.borderId;

  const handleConfirmAppearance = () => {
    SoundManager.unlock();
    const res = ProgressionManager.setProfileCosmetics(draftAvatarId, draftBorderId);
    if (res.ok && hasAppearanceChanges) {
      SoundManager.playPowerUp();
    } else {
      SoundManager.playButtonClick();
    }
    setSubModal('none');
    if (hasAppearanceChanges) {
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

      {/* Streamlined Profile Popup */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="player-profile-title"
        onClick={(e) => e.stopPropagation()}
        className={`absolute left-4 top-[calc(max(0.875rem,env(safe-area-inset-top))+56px)] w-[calc(100vw-2rem)] max-w-[348px] origin-top-left overflow-hidden rounded-2xl border border-slate-700/70 bg-[#060d1c]/96 shadow-2xl shadow-black/80 backdrop-blur-md transition-[opacity,transform] duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] sm:left-8 lg:left-12 ${
          open ? 'translate-y-0 scale-100 opacity-100' : '-translate-y-2 scale-[0.96] opacity-0'
        }`}
      >
        {/* Top Accent Hairline */}
        <div
          aria-hidden="true"
          className="h-px w-full bg-gradient-to-r from-transparent via-cyan-300/45 to-transparent"
        />

        {/* Identity Header */}
        <div className="flex items-start justify-between gap-2.5 border-b border-slate-800/85 px-5 py-4">
          <div className="flex min-w-0 flex-1 items-center gap-3.5">
            {/* Avatar Photo as Profile Settings Trigger */}
            <button
              type="button"
              onClick={() => openAppearanceModal('avatar')}
              aria-label="Customize Profile Avatar and Border"
              title="Customize Avatar & Border"
              className="group relative shrink-0 rounded-xl transition-transform duration-150 hover:scale-[1.04] active:scale-95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-400"
            >
              <ProfileAvatarBadge
                avatarId={progress.avatarId}
                borderId={progress.borderId}
                size="md"
              />
              <span
                aria-hidden="true"
                className="absolute -bottom-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full border border-slate-700/90 bg-[#071124] text-cyan-300 shadow-sm transition-colors group-hover:border-cyan-300/70 group-hover:text-cyan-200"
              >
                <Palette className="h-2.5 w-2.5" />
              </span>
            </button>

            <div className="min-w-0 flex-1">
              <div className="flex items-start justify-between gap-1.5">
                <div className="flex min-w-0 items-start gap-1">
                  <h2
                    id="player-profile-title"
                    className="truncate font-display text-[15px] font-bold leading-snug tracking-wide text-white"
                  >
                    {progress.playerName}
                  </h2>

                  <button
                    type="button"
                    onClick={openChangeNameModal}
                    aria-label="Edit Commander Name"
                    title={`Edit Name (${PLAYER_NAME_CHANGE_COST_GEMS} Gems)`}
                    className="-mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-md text-slate-400 transition-[background-color,color,transform] duration-150 hover:bg-white/[0.08] hover:text-cyan-200 active:scale-90 focus-visible:outline-2 focus-visible:outline-cyan-400"
                  >
                    <Pencil className="h-2.5 w-2.5" />
                  </button>
                </div>
              </div>

              <div className="mt-0.5 flex items-center gap-1.5 text-xs text-slate-400">
                <span className="font-mono-num tabular-nums font-semibold text-cyan-300">
                  Lv.{rank.level}
                  {rank.isMaxLevel ? ' MAX' : `/${MAX_PLAYER_LEVEL}`}
                </span>
                <span aria-hidden="true" className="text-slate-600">
                  ·
                </span>
                <span className="truncate">{rank.title}</span>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close Profile"
            className="-mr-1 -mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-slate-400 transition-[background-color,color,transform] duration-150 hover:bg-white/[0.07] hover:text-white active:scale-95 focus-visible:outline-2 focus-visible:outline-cyan-400"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Experience Progress */}
        <div className="border-b border-slate-800/80 bg-[#050a17]/55 px-5 py-3">
          <div className="flex items-center justify-between text-[11px]">
            <span className="font-medium text-slate-400">Commander EXP</span>
            <span className="font-mono-num tabular-nums font-semibold text-slate-200">
              {rank.isMaxLevel
                ? 'MAX LEVEL'
                : `${rank.currentExp.toLocaleString()} / ${rank.requiredExp.toLocaleString()}`}
            </span>
          </div>
          <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-slate-900">
            <div
              className="h-full rounded-full bg-gradient-to-r from-sky-400 to-cyan-300 transition-[width] duration-300"
              style={{ width: `${rank.isMaxLevel ? 100 : Math.max(3, rank.progressPct)}%` }}
            />
          </div>
        </div>

        {/* Currencies */}
        <div className="grid grid-cols-2 divide-x divide-slate-800/80 border-b border-slate-800/80 bg-[#050a17]/70">
          <div className="flex items-center gap-2.5 px-5 py-3">
            <CreditCoinIcon className="h-4 w-4 shrink-0" />
            <div className="min-w-0">
              <div className="text-[11px] text-slate-400">Credits</div>
              <div className="truncate font-mono-num tabular-nums text-sm font-bold text-amber-200">
                {progress.credits.toLocaleString()}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2.5 px-5 py-3">
            <CrystalGemIcon className="h-4 w-4 shrink-0" />
            <div className="min-w-0">
              <div className="text-[11px] text-slate-400">Void Gems</div>
              <div className="truncate font-mono-num tabular-nums text-sm font-bold text-cyan-200">
                {progress.crystals.toLocaleString()}
              </div>
            </div>
          </div>
        </div>

        {/* Concise Key Profile Stats (2x2) */}
        <div className="grid grid-cols-2 gap-x-5 gap-y-3.5 px-5 py-4 text-xs">
          <div className="min-w-0">
            <div className="text-[11px] text-slate-400">Active Fighter</div>
            <div className="mt-0.5 truncate font-display text-sm font-semibold text-white">
              {activeShip.name}
            </div>
          </div>
          <div className="min-w-0">
            <div className="text-[11px] text-slate-400">High Score</div>
            <div className="mt-0.5 font-mono-num tabular-nums text-sm font-bold text-white">
              {progress.highScore.toLocaleString()}
            </div>
          </div>
          <div className="min-w-0">
            <div className="text-[11px] text-slate-400">Campaign Cleared</div>
            <div className="mt-0.5 font-mono-num tabular-nums text-sm font-bold text-sky-300">
              {totalCampaignClears} / 50
            </div>
          </div>
          <div className="min-w-0">
            <div className="text-[11px] text-slate-400">Enemies Slain</div>
            <div className="mt-0.5 font-mono-num tabular-nums text-sm font-bold text-white">
              {progress.totalKills.toLocaleString()}
            </div>
          </div>
        </div>
      </div>

      {/* Sub-Modal: Edit Commander Name (Max 15 Chars) */}
      {subModal === 'rename' && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="change-name-title"
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#03060f]/78 p-4 backdrop-blur-sm"
          onClick={closeSubModal}
        >
          <div
            className="panel-swap w-full max-w-sm rounded-2xl border border-slate-700/80 bg-[#060d1c]/98 p-5 sm:p-6 shadow-2xl shadow-black/75"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3
                  id="change-name-title"
                  className="font-display text-base font-bold tracking-wide text-white"
                >
                  Edit Commander Name
                </h3>
                <p className="mt-0.5 text-xs text-slate-400">
                  Current: <span className="font-semibold text-slate-200">{progress.playerName}</span>
                </p>
              </div>

              <button
                type="button"
                onClick={closeSubModal}
                aria-label="Close Edit Name"
                className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-white/[0.07] hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (canConfirmName) {
                  handleConfirmNameChange();
                }
              }}
              className="mt-4 flex flex-col gap-3"
            >
              <div>
                <div className="mb-1.5 flex items-center justify-between text-xs">
                  <label htmlFor="commander-name-input" className="font-medium text-slate-300">
                    New Callsign
                  </label>
                  <span
                    className={`font-mono-num tabular-nums text-[11px] ${
                      nameValidation.cleaned.length >= PLAYER_NAME_MAX_LENGTH
                        ? 'text-cyan-300'
                        : 'text-slate-400'
                    }`}
                  >
                    {nameValidation.cleaned.length}/{PLAYER_NAME_MAX_LENGTH}
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
                  placeholder={`Max ${PLAYER_NAME_MAX_LENGTH} characters`}
                  aria-invalid={Boolean(inlineValidationError)}
                  className={`h-11 w-full rounded-xl border bg-[#040814] px-3.5 font-display text-sm font-semibold tracking-wide text-white outline-none transition-colors placeholder:font-sans placeholder:font-normal placeholder:text-slate-500 ${
                    inlineValidationError
                      ? 'border-rose-400/75 focus:border-rose-400'
                      : 'border-slate-700/80 focus:border-cyan-400/80'
                  }`}
                />
                <p className="mt-1.5 text-[11px] text-slate-500">
                  1–{PLAYER_NAME_MAX_LENGTH} characters · Extra spaces trimmed automatically
                </p>
              </div>

              <div className="flex items-center justify-between border-y border-slate-800/80 py-2.5 text-xs">
                <span className="text-slate-400">Rename Fee</span>
                <div className="flex items-center gap-2.5 font-mono-num tabular-nums">
                  <span className="flex items-center gap-1 font-bold text-cyan-200">
                    <CrystalGemIcon className="h-3.5 w-3.5 shrink-0" />
                    {PLAYER_NAME_CHANGE_COST_GEMS} Gems
                  </span>
                  <span className="text-slate-600" aria-hidden="true">
                    ·
                  </span>
                  <span className={hasEnoughGems ? 'text-slate-300' : 'font-semibold text-rose-300'}>
                    Balance: {progress.crystals.toLocaleString()}
                  </span>
                </div>
              </div>

              {(inlineValidationError || !hasEnoughGems) && (
                <div
                  role="alert"
                  className="flex items-center gap-2 rounded-xl border border-rose-400/35 bg-[#1a0a12]/85 px-3 py-2 text-xs text-rose-200"
                >
                  <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-rose-400" />
                  <span>
                    {inlineValidationError ??
                      `Insufficient Void Gems. Need ${PLAYER_NAME_CHANGE_COST_GEMS} Gems to change name.`}
                  </span>
                </div>
              )}

              {!inlineValidationError && hasEnoughGems && nameValidation.valid && (
                <div className="flex items-center gap-2 text-[11.5px] text-emerald-300/90">
                  <Check className="h-3.5 w-3.5 shrink-0" />
                  <span>
                    Remaining after change:{' '}
                    {(progress.crystals - PLAYER_NAME_CHANGE_COST_GEMS).toLocaleString()} Gems
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

      {/* Sub-Modal: Profile Appearance Settings (Avatar & Border Menu) */}
      {subModal === 'appearance' && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="profile-appearance-title"
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#03060f]/78 p-4 backdrop-blur-sm"
          onClick={closeSubModal}
        >
          <div
            className="scroll-panel panel-swap max-h-[calc(100dvh-2rem)] w-full max-w-[460px] overflow-y-auto rounded-2xl border border-slate-700/80 bg-[#060d1c]/98 p-5 sm:p-6 shadow-2xl shadow-black/75"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between gap-3">
              <div>
                <h3
                  id="profile-appearance-title"
                  className="font-display text-base font-bold tracking-wide text-white"
                >
                  Profile Appearance
                </h3>
                <p className="mt-0.5 text-xs text-slate-400">
                  Customize your Commander emblem and frame
                </p>
              </div>
              <button
                type="button"
                onClick={closeSubModal}
                aria-label="Close Profile Appearance"
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-white/[0.07] hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Live Combined Preview */}
            <div className="mt-4 flex items-center gap-4 border-y border-slate-800/80 py-3.5">
              <ProfileAvatarBadge
                avatarId={draftAvatarId}
                borderId={draftBorderId}
                size="lg"
              />
              <div className="min-w-0 flex-1">
                <div className="truncate font-display text-base font-bold text-white">
                  {progress.playerName}
                </div>
                <div className="mt-0.5 flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-xs text-slate-300">
                  <span className="truncate">{draftAvatarDef.name}</span>
                  <span aria-hidden="true" className="text-slate-600">
                    ·
                  </span>
                  <span style={{ color: draftBorderDef.accentHex }} className="font-medium">
                    {draftBorderDef.name}
                  </span>
                </div>
                <div className="mt-1 text-[11px] font-medium">
                  {hasAppearanceChanges ? (
                    <span className="text-cyan-300">Previewing Changes</span>
                  ) : (
                    <span className="text-emerald-300">Currently Equipped</span>
                  )}
                </div>
              </div>
            </div>

            {/* Two-Menu Selector: Avatar & Border */}
            <div
              role="tablist"
              aria-label="Profile customization categories"
              className="mt-4 grid grid-cols-2 gap-1.5 rounded-xl border border-slate-800/90 bg-[#040814] p-1"
            >
              <button
                type="button"
                role="tab"
                aria-selected={appearanceTab === 'avatar'}
                onClick={() => {
                  SoundManager.playButtonClick();
                  setAppearanceTab('avatar');
                }}
                className={`flex min-h-[40px] items-center justify-center gap-2 rounded-lg px-3 text-xs font-semibold transition-all duration-150 ${
                  appearanceTab === 'avatar'
                    ? 'bg-cyan-400/16 text-cyan-200 ring-1 ring-cyan-300/45'
                    : 'text-slate-400 hover:bg-white/[0.04] hover:text-slate-200'
                }`}
              >
                <Sparkles className="h-3.5 w-3.5 shrink-0" />
                <span>Avatar</span>
              </button>

              <button
                type="button"
                role="tab"
                aria-selected={appearanceTab === 'border'}
                onClick={() => {
                  SoundManager.playButtonClick();
                  setAppearanceTab('border');
                }}
                className={`flex min-h-[40px] items-center justify-center gap-2 rounded-lg px-3 text-xs font-semibold transition-all duration-150 ${
                  appearanceTab === 'border'
                    ? 'bg-cyan-400/16 text-cyan-200 ring-1 ring-cyan-300/45'
                    : 'text-slate-400 hover:bg-white/[0.04] hover:text-slate-200'
                }`}
              >
                <Shield className="h-3.5 w-3.5 shrink-0" />
                <span>Border</span>
              </button>
            </div>

            {/* Active Tab Panel */}
            {appearanceTab === 'avatar' ? (
              <div role="tabpanel" className="mt-3.5 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
                {PROFILE_AVATARS.map((av) => {
                  const selected = draftAvatarId === av.id;
                  const equipped = progress.avatarId === av.id;
                  return (
                    <button
                      key={av.id}
                      type="button"
                      aria-pressed={selected}
                      onClick={() => {
                        SoundManager.playButtonClick();
                        setDraftAvatarId(av.id);
                      }}
                      title={`${av.name} — ${av.subtitle}`}
                      className={`relative flex min-h-[92px] flex-col items-center justify-center gap-2 rounded-xl border px-2.5 py-3 text-center transition-[border-color,background-color,transform] duration-150 active:scale-[0.97] focus-visible:outline-2 focus-visible:outline-cyan-400 ${
                        selected
                          ? 'border-cyan-300/80 bg-cyan-400/12'
                          : 'border-slate-800/90 bg-[#050a18]/90 hover:border-slate-600 hover:bg-[#0b162d]'
                      }`}
                    >
                      {selected && (
                        <span
                          aria-hidden="true"
                          className="absolute right-2 top-2 text-cyan-300"
                        >
                          <Check className="h-3.5 w-3.5 stroke-[2.6]" />
                        </span>
                      )}
                      <ProfileAvatarBadge
                        avatarId={av.id}
                        borderId={draftBorderId}
                        size="sm"
                      />
                      <div className="w-full min-w-0">
                        <div className="truncate text-[11px] font-semibold text-slate-100">
                          {av.name}
                        </div>
                        {equipped && (
                          <div className="mt-0.5 text-[9.5px] font-medium text-emerald-300">
                            Equipped
                          </div>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            ) : (
              <div role="tabpanel" className="mt-3.5 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                {PROFILE_BORDERS.map((b) => {
                  const selected = draftBorderId === b.id;
                  const equipped = progress.borderId === b.id;
                  return (
                    <button
                      key={b.id}
                      type="button"
                      aria-pressed={selected}
                      onClick={() => {
                        SoundManager.playButtonClick();
                        setDraftBorderId(b.id);
                      }}
                      className={`relative flex min-h-[62px] items-center gap-3 rounded-xl border px-3 py-2.5 text-left transition-[border-color,background-color,transform] duration-150 active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-cyan-400 ${
                        selected
                          ? 'border-cyan-300/80 bg-cyan-400/12'
                          : 'border-slate-800/90 bg-[#050a18]/90 hover:border-slate-600 hover:bg-[#0b162d]'
                      }`}
                    >
                      <ProfileAvatarBadge
                        avatarId={draftAvatarId}
                        borderId={b.id}
                        size="sm"
                      />
                      <div className="min-w-0 flex-1 pr-4">
                        <div className="truncate text-xs font-semibold text-slate-100">
                          {b.name}
                        </div>
                        <div className="mt-0.5 flex items-center gap-1.5 text-[10.5px]">
                          <span style={{ color: b.accentHex }} className="font-medium">
                            {b.tierLabel}
                          </span>
                          {equipped && (
                            <>
                              <span aria-hidden="true" className="text-slate-600">
                                ·
                              </span>
                              <span className="text-emerald-300">Equipped</span>
                            </>
                          )}
                        </div>
                      </div>
                      {selected && (
                        <span
                          aria-hidden="true"
                          className="absolute right-2.5 top-2.5 text-cyan-300"
                        >
                          <Check className="h-3.5 w-3.5 stroke-[2.6]" />
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            )}

            <ConfirmButtonPair
              className="mt-5 grid grid-cols-2 gap-3"
              confirmLabel={hasAppearanceChanges ? 'Save Changes' : 'Done'}
              cancelLabel="Cancel"
              onCancel={closeSubModal}
              onConfirm={handleConfirmAppearance}
            />
          </div>
        </div>
      )}
    </div>
  );
};
