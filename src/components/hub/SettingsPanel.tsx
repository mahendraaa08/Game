import React, { useState } from 'react';
import { Maximize2, Minimize2, RotateCcw, ScrollText, Sliders, Volume2, VolumeX } from 'lucide-react';
import { SoundManager } from '../../game/audio/SoundManager';
import { ActionResult } from '../../game/systems/ProgressionManager';
import { FxQuality, GameSettings, StorageManager } from '../../game/utils/StorageManager';
import { StoryBriefingModal } from '../StoryBriefingModal';

interface SettingsPanelProps {
  onFeedback: (res: ActionResult) => void;
}

export const SettingsPanel: React.FC<SettingsPanelProps> = ({ onFeedback }) => {
  const [settings, setSettings] = useState<GameSettings>(() => ({ ...StorageManager.load().settings }));
  const [isFullscreen, setIsFullscreen] = useState<boolean>(Boolean(document.fullscreenElement));
  const [showStory, setShowStory] = useState<boolean>(false);
  const [confirmReset, setConfirmReset] = useState<boolean>(false);

  const patch = (partial: Partial<GameSettings>) => {
    const next = StorageManager.updateSettings(partial);
    setSettings({ ...next });
    SoundManager.syncSettings(next);
  };

  const toggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
        setIsFullscreen(true);
      } else {
        await document.exitFullscreen();
        setIsFullscreen(false);
      }
    } catch {
      onFeedback({ ok: false, message: 'Fullscreen is restricted in the current embed frame.' });
    }
  };

  return (
    <>
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        {/* Audio Mixer */}
        <section className="rounded-2xl border border-slate-800/90 bg-[#081022]/90 p-5">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="flex items-center gap-2 font-display text-base font-bold text-white">
              {settings.muted ? (
                <VolumeX className="h-4 w-4 text-rose-400" />
              ) : (
                <Volume2 className="h-4 w-4 text-sky-400" />
              )}
              <span>Audio Mixer</span>
            </h3>
            <button
              type="button"
              onClick={() => {
                SoundManager.unlock();
                patch({ muted: !settings.muted });
              }}
              className={`min-h-[40px] rounded-xl border px-3.5 text-xs font-bold transition-colors ${
                settings.muted
                  ? 'border-rose-500/60 bg-rose-500/15 text-rose-300'
                  : 'border-sky-400/60 bg-sky-500/15 text-sky-200'
              }`}
            >
              {settings.muted ? 'Sound Muted' : 'Sound Enabled'}
            </button>
          </div>

          <div className="flex flex-col gap-4 text-xs">
            <label className="flex flex-col gap-1.5">
              <div className="flex justify-between text-slate-300">
                <span>Master Volume</span>
                <span className="font-mono-num text-sky-300">
                  {Math.round(settings.masterVolume * 100)}%
                </span>
              </div>
              <input
                type="range"
                min={0}
                max={100}
                value={Math.round(settings.masterVolume * 100)}
                onChange={(e) => {
                  SoundManager.unlock();
                  patch({ masterVolume: Number(e.target.value) / 100 });
                }}
                className="accent-sky-400"
              />
            </label>

            <label className="flex flex-col gap-1.5">
              <div className="flex justify-between text-slate-300">
                <span>Music Volume</span>
                <span className="font-mono-num text-sky-300">
                  {Math.round(settings.musicVolume * 100)}%
                </span>
              </div>
              <input
                type="range"
                min={0}
                max={100}
                value={Math.round(settings.musicVolume * 100)}
                onChange={(e) => {
                  SoundManager.unlock();
                  patch({ musicVolume: Number(e.target.value) / 100 });
                }}
                className="accent-sky-400"
              />
            </label>

            <label className="flex flex-col gap-1.5">
              <div className="flex justify-between text-slate-300">
                <span>Sound Effects (SFX) Volume</span>
                <span className="font-mono-num text-sky-300">
                  {Math.round(settings.sfxVolume * 100)}%
                </span>
              </div>
              <input
                type="range"
                min={0}
                max={100}
                value={Math.round(settings.sfxVolume * 100)}
                onChange={(e) => {
                  SoundManager.unlock();
                  patch({ sfxVolume: Number(e.target.value) / 100 });
                }}
                onMouseUp={() => SoundManager.playButtonClick()}
                onTouchEnd={() => SoundManager.playButtonClick()}
                className="accent-sky-400"
              />
            </label>
          </div>
        </section>

        {/* Touch Flight Controls & Visual Quality */}
        <section className="rounded-2xl border border-slate-800/90 bg-[#081022]/90 p-5">
          <h3 className="mb-4 flex items-center gap-2 font-display text-base font-bold text-white">
            <Sliders className="h-4 w-4 text-sky-400" />
            <span>Controls &amp; Visual Optimization</span>
          </h3>

          <div className="flex flex-col gap-4 text-xs">
            <label className="flex flex-col gap-1.5">
              <div className="flex justify-between text-slate-300">
                <span>Touch Drag Sensitivity</span>
                <span className="font-mono-num text-sky-300">
                  {settings.controlSensitivity.toFixed(2)}x
                </span>
              </div>
              <input
                type="range"
                min={70}
                max={180}
                step={5}
                value={Math.round(settings.controlSensitivity * 100)}
                onChange={(e) => patch({ controlSensitivity: Number(e.target.value) / 100 })}
                className="accent-sky-400"
              />
            </label>

            <label className="flex flex-col gap-1.5">
              <div className="flex justify-between text-slate-300">
                <span>Movement Smoothing (0% Crisp · 100% Smooth)</span>
                <span className="font-mono-num text-sky-300">
                  {Math.round(settings.movementSmoothing * 100)}%
                </span>
              </div>
              <input
                type="range"
                min={0}
                max={100}
                step={5}
                value={Math.round(settings.movementSmoothing * 100)}
                onChange={(e) => patch({ movementSmoothing: Number(e.target.value) / 100 })}
                className="accent-sky-400"
              />
            </label>

            <div className="flex items-center justify-between">
              <span className="text-slate-300">Camera Screen Shake</span>
              <button
                type="button"
                onClick={() => {
                  SoundManager.playButtonClick();
                  patch({ screenShake: !settings.screenShake });
                }}
                className={`min-h-[40px] rounded-xl border px-4 font-bold transition-colors ${
                  settings.screenShake
                    ? 'border-sky-400/70 bg-sky-500/15 text-sky-200'
                    : 'border-slate-700 bg-slate-900 text-slate-400'
                }`}
              >
                {settings.screenShake ? 'Enabled' : 'Disabled'}
              </button>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-slate-300">Particle &amp; FX Quality</span>
              <div className="flex gap-1.5">
                {(['high', 'medium', 'low'] as FxQuality[]).map((q) => (
                  <button
                    key={q}
                    type="button"
                    onClick={() => {
                      SoundManager.playButtonClick();
                      patch({ fxQuality: q });
                      onFeedback({ ok: true, message: `FX Quality set to ${q.toUpperCase()}.` });
                    }}
                    className={`min-h-[38px] rounded-xl border px-3 font-semibold uppercase transition-colors ${
                      settings.fxQuality === q
                        ? 'border-sky-400 bg-sky-500/15 text-white'
                        : 'border-slate-800 bg-slate-900 text-slate-400'
                    }`}
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-slate-300">Performance Profile</span>
              <div className="flex gap-1.5">
                {(['high', 'balanced'] as const).map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => {
                      SoundManager.playButtonClick();
                      patch({ performanceQuality: p });
                      onFeedback({
                        ok: true,
                        message: `Performance profile set to ${p.toUpperCase()}.`,
                      });
                    }}
                    className={`min-h-[38px] rounded-xl border px-3 font-semibold uppercase transition-colors ${
                      settings.performanceQuality === p
                        ? 'border-sky-400 bg-sky-500/15 text-white'
                        : 'border-slate-800 bg-slate-900 text-slate-400'
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between border-t border-slate-800 pt-3">
              <span className="text-slate-300">Display Mode</span>
              <button
                type="button"
                onClick={toggleFullscreen}
                className="flex min-h-[40px] items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-900 px-3.5 font-semibold text-slate-200 hover:border-sky-400"
              >
                {isFullscreen ? (
                  <Minimize2 className="h-3.5 w-3.5" />
                ) : (
                  <Maximize2 className="h-3.5 w-3.5" />
                )}
                <span>{isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}</span>
              </button>
            </div>
          </div>
        </section>

        {/* Story Briefing Archive Access */}
        <section className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-800/90 bg-[#081022]/90 p-5 lg:col-span-2">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-purple-400/35 bg-purple-500/12">
              <ScrollText className="h-5 w-5 text-purple-300" />
            </span>
            <div>
              <h3 className="font-display text-sm font-bold text-white">
                Campaign Story Briefing
              </h3>
              <p className="text-xs text-slate-400">
                Replay the Year 3099 Void Empire invasion mission briefing.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              SoundManager.unlock();
              SoundManager.playButtonClick();
              setShowStory(true);
            }}
            className="min-h-[44px] rounded-xl border border-purple-400/45 bg-purple-500/15 px-4 py-2 font-display text-xs font-bold text-purple-200 transition-colors hover:border-purple-300 hover:bg-purple-500/25"
          >
            Replay Story Briefing
          </button>
        </section>

        {/* Reset Settings to Default (Inline Confirmation, Progress Preserved) */}
        <section className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-800/90 bg-[#081022]/90 p-5 lg:col-span-2">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-rose-400/30 bg-rose-500/10">
              <RotateCcw className="h-5 w-5 text-rose-300" />
            </span>
            <div>
              <h3 className="font-display text-sm font-bold text-white">
                Reset Settings to Default
              </h3>
              <p className="text-xs text-slate-400">
                Restore audio, touch control, and visual defaults. Campaign progress, fleet, and currencies remain intact.
              </p>
            </div>
          </div>

          {confirmReset ? (
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  SoundManager.playButtonClick();
                  setConfirmReset(false);
                }}
                className="min-h-[44px] rounded-xl border border-slate-700 bg-slate-900 px-4 py-2 text-xs font-semibold text-slate-200 hover:border-slate-500"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  const next = StorageManager.resetSettings();
                  setSettings({ ...next });
                  SoundManager.syncSettings(next);
                  SoundManager.unlock();
                  SoundManager.playButtonClick();
                  setConfirmReset(false);
                  onFeedback({
                    ok: true,
                    message: 'Audio, control, and visual settings restored to default.',
                  });
                }}
                className="min-h-[44px] rounded-xl bg-rose-500 px-4 py-2 font-display text-xs font-bold text-white hover:bg-rose-400"
              >
                Confirm Reset
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => {
                SoundManager.playButtonClick();
                setConfirmReset(true);
              }}
              className="min-h-[44px] rounded-xl border border-rose-400/40 bg-rose-500/12 px-4 py-2 font-display text-xs font-bold text-rose-200 transition-colors hover:border-rose-300 hover:bg-rose-500/22"
            >
              Reset to Default
            </button>
          )}
        </section>
      </div>

      <StoryBriefingModal open={showStory} onClose={() => setShowStory(false)} />
    </>
  );
};
