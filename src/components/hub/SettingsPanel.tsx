import React, { useEffect, useState } from 'react';
import {
  AlertTriangle,
  Gamepad2,
  Maximize2,
  Minimize2,
  Monitor,
  RotateCcw,
  Sliders,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { SoundManager } from '../../game/audio/SoundManager';
import { ActionResult } from '../../game/systems/ProgressionManager';
import { EventBus } from '../../game/utils/EventBus';
import { FxQuality, GameSettings, StorageManager } from '../../game/utils/StorageManager';
import { ConfirmButtonPair } from '../ui/ConfirmButtonPair';
import { DevToolsSettingsSection } from './DevToolsSettingsSection';

interface SettingsPanelProps {
  onFeedback: (res: ActionResult) => void;
}

export const SettingsPanel: React.FC<SettingsPanelProps> = ({ onFeedback }) => {
  const [settings, setSettings] = useState<GameSettings>(() => ({ ...StorageManager.load().settings }));
  const [isFullscreen, setIsFullscreen] = useState<boolean>(Boolean(document.fullscreenElement));
  const [showResetDialog, setShowResetDialog] = useState<boolean>(false);

  useEffect(() => {
    const onFullscreenChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener('fullscreenchange', onFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', onFullscreenChange);
  }, []);

  const patch = (partial: Partial<GameSettings>) => {
    const next = StorageManager.updateSettings(partial);
    setSettings({ ...next });
    SoundManager.syncSettings(next);
    EventBus.emit('settings:updated', next);
  };

  const toggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
      } else {
        await document.exitFullscreen();
      }
    } catch {
      onFeedback({ ok: false, message: 'Fullscreen is restricted in the current embed frame.' });
    }
  };

  const handleConfirmReset = () => {
    const next = StorageManager.resetSettings();
    setSettings({ ...next });
    SoundManager.syncSettings(next);
    EventBus.emit('settings:updated', next);
    SoundManager.unlock();
    SoundManager.playButtonClick();
    setShowResetDialog(false);
    onFeedback({
      ok: true,
      message: 'Audio, graphics, and control settings restored to default.',
    });
  };

  return (
    <>
      <div className="flex flex-col gap-5">
        {/* 3 Active Functional Configuration Categories (No General & Archive) */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          {/* 1. AUDIO SYSTEM */}
          <section className="rounded-2xl border border-slate-700/70 bg-[#081122]/90 p-5 backdrop-blur-sm">
            <div className="mb-4 flex items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
              <h3 className="flex items-center gap-2 font-display text-sm sm:text-base font-bold tracking-wide text-white">
                {settings.muted ? (
                  <VolumeX className="h-4 w-4 text-rose-400" />
                ) : (
                  <Volume2 className="h-4 w-4 text-cyan-300" />
                )}
                <span>AUDIO MIXER</span>
              </h3>
              <button
                type="button"
                aria-pressed={!settings.muted}
                onClick={() => {
                  SoundManager.unlock();
                  patch({ muted: !settings.muted });
                }}
                className={`min-h-[38px] rounded-xl border px-3 text-xs font-bold transition-colors ${
                  settings.muted
                    ? 'border-rose-400/50 bg-rose-500/14 text-rose-300'
                    : 'border-cyan-300/50 bg-cyan-400/14 text-cyan-200'
                }`}
              >
                {settings.muted ? 'Muted' : 'Enabled'}
              </button>
            </div>

            <div className="flex flex-col gap-4 text-xs">
              <label className="flex flex-col gap-2">
                <div className="flex items-center justify-between text-slate-300">
                  <span className="font-medium">Master Volume</span>
                  <span className="font-mono-num font-semibold text-cyan-300">
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
                  className="sci-slider w-full"
                />
              </label>

              <label className="flex flex-col gap-2">
                <div className="flex items-center justify-between text-slate-300">
                  <span className="font-medium">Music Volume</span>
                  <span className="font-mono-num font-semibold text-cyan-300">
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
                  className="sci-slider w-full"
                />
              </label>

              <label className="flex flex-col gap-2">
                <div className="flex items-center justify-between text-slate-300">
                  <span className="font-medium">Sound Effects (SFX)</span>
                  <span className="font-mono-num font-semibold text-cyan-300">
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
                  className="sci-slider w-full"
                />
              </label>
            </div>
          </section>

          {/* 2. GRAPHICS & DISPLAY */}
          <section className="rounded-2xl border border-slate-700/70 bg-[#081122]/90 p-5 backdrop-blur-sm">
            <h3 className="mb-4 flex items-center gap-2 border-b border-slate-800/80 pb-3 font-display text-sm sm:text-base font-bold tracking-wide text-white">
              <Monitor className="h-4 w-4 text-cyan-300" />
              <span>GRAPHICS &amp; DISPLAY</span>
            </h3>

            <div className="flex flex-col gap-4 text-xs">
              <div className="flex flex-col gap-1.5">
                <span className="font-medium text-slate-300">Particle &amp; FX Quality</span>
                <div className="grid grid-cols-3 gap-1.5">
                  {(['high', 'medium', 'low'] as FxQuality[]).map((q) => (
                    <button
                      key={q}
                      type="button"
                      aria-pressed={settings.fxQuality === q}
                      onClick={() => {
                        SoundManager.playButtonClick();
                        patch({ fxQuality: q });
                        onFeedback({ ok: true, message: `FX Quality set to ${q.toUpperCase()}.` });
                      }}
                      className={`min-h-[38px] rounded-xl border px-2 font-semibold uppercase transition-colors ${
                        settings.fxQuality === q
                          ? 'border-cyan-300/65 bg-cyan-400/14 text-white'
                          : 'border-slate-800 bg-slate-900/90 text-slate-400 hover:border-slate-600'
                      }`}
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <span className="font-medium text-slate-300">Performance Profile</span>
                <div className="grid grid-cols-2 gap-1.5">
                  {(['high', 'balanced'] as const).map((p) => (
                    <button
                      key={p}
                      type="button"
                      aria-pressed={settings.performanceQuality === p}
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
                          ? 'border-cyan-300/65 bg-cyan-400/14 text-white'
                          : 'border-slate-800 bg-slate-900/90 text-slate-400 hover:border-slate-600'
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between pt-1">
                <span className="font-medium text-slate-300">Camera Screen Shake</span>
                <button
                  type="button"
                  aria-pressed={settings.screenShake}
                  onClick={() => {
                    SoundManager.playButtonClick();
                    patch({ screenShake: !settings.screenShake });
                  }}
                  className={`min-h-[38px] rounded-xl border px-4 font-bold transition-colors ${
                    settings.screenShake
                      ? 'border-cyan-300/60 bg-cyan-400/14 text-cyan-200'
                      : 'border-slate-700 bg-slate-900 text-slate-400'
                  }`}
                >
                  {settings.screenShake ? 'Enabled' : 'Disabled'}
                </button>
              </div>

              <div className="flex items-center justify-between border-t border-slate-800/80 pt-3">
                <span className="font-medium text-slate-300">Display Mode</span>
                <button
                  type="button"
                  onClick={toggleFullscreen}
                  className="flex min-h-[38px] items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-900/90 px-3.5 font-semibold text-slate-200 transition-colors hover:border-cyan-300/55"
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

          {/* 3. CONTROLS & TOUCH FLIGHT TUNING */}
          <section className="rounded-2xl border border-slate-700/70 bg-[#081122]/90 p-5 backdrop-blur-sm">
            <h3 className="mb-4 flex items-center gap-2 border-b border-slate-800/80 pb-3 font-display text-sm sm:text-base font-bold tracking-wide text-white">
              <Sliders className="h-4 w-4 text-cyan-300" />
              <span>CONTROLS</span>
            </h3>

            <div className="flex flex-col gap-4 text-xs">
              <label className="flex flex-col gap-2">
                <div className="flex items-center justify-between text-slate-300">
                  <span className="font-medium">Touch Drag Sensitivity</span>
                  <span className="font-mono-num font-semibold text-cyan-300">
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
                  className="sci-slider w-full"
                />
              </label>

              <label className="flex flex-col gap-2">
                <div className="flex items-center justify-between text-slate-300">
                  <span className="font-medium">Movement Smoothing</span>
                  <span className="font-mono-num font-semibold text-cyan-300">
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
                  className="sci-slider w-full"
                />
              </label>

              <div className="rounded-xl border border-slate-800/80 bg-[#060c1a]/85 p-3">
                <div className="mb-2 flex items-center gap-1.5 font-display text-xs font-bold text-slate-200">
                  <Gamepad2 className="h-3.5 w-3.5 text-cyan-300" />
                  <span>Flight &amp; Combat Bindings</span>
                </div>
                <div className="grid grid-cols-1 gap-1 font-mono-num text-[10.5px] text-slate-400">
                  <div>Touch / Mouse: Drag to Steer · Auto-Fire</div>
                  <div>Keyboard: WASD / Arrows · Shift (Dash) · E (Special)</div>
                  <div>Weapons &amp; Pause: Keys 1–6 · Esc</div>
                </div>
              </div>
            </div>
          </section>
        </div>

        {/* Minimalist Footer Action: Reset Settings to Default */}
        <footer className="flex flex-col items-start justify-between gap-3 rounded-2xl border border-slate-800/85 bg-[#070e1d]/85 px-5 py-3.5 sm:flex-row sm:items-center">
          <div className="text-xs text-slate-400">
            Restore audio, display, and flight control defaults without affecting your saved progress.
          </div>
          <button
            type="button"
            onClick={() => {
              SoundManager.unlock();
              SoundManager.playButtonClick();
              setShowResetDialog(true);
            }}
            className="flex min-h-[42px] shrink-0 items-center gap-2 rounded-xl border border-slate-700/85 bg-[#0b152a] px-4 py-2 text-xs font-semibold text-slate-200 transition-[border-color,background-color,color,transform] duration-150 hover:border-rose-400/50 hover:bg-rose-500/12 hover:text-rose-200 active:scale-[0.98]"
          >
            <RotateCcw className="h-3.5 w-3.5 text-rose-300" />
            <span>Reset Settings to Default</span>
          </button>
        </footer>

        {/* Modular Developer Tools Section (Isolated from Core Settings & Economy) */}
        <DevToolsSettingsSection onFeedback={onFeedback} />
      </div>

      {/* Confirmation Dialog for Settings Reset */}
      {showResetDialog && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="reset-settings-title"
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#03060f]/82 p-4 backdrop-blur-sm"
          onClick={() => setShowResetDialog(false)}
        >
          <div
            className="panel-swap w-full max-w-md rounded-2xl border border-slate-700/80 bg-[#081122]/96 p-5 sm:p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-rose-400/35 bg-rose-500/12">
                <AlertTriangle className="h-5 w-5 text-rose-300" />
              </span>
              <div>
                <h2
                  id="reset-settings-title"
                  className="font-display text-lg font-bold tracking-wide text-white"
                >
                  Reset Settings to Default?
                </h2>
                <p className="mt-1.5 text-xs leading-relaxed text-slate-300">
                  Only your <strong className="text-white">Audio, Graphics, and Flight Control</strong> preferences will be restored to factory defaults.
                </p>
                <p className="mt-1.5 text-xs leading-relaxed text-emerald-300/90">
                  Campaign sectors, Credits, Void Crystals, unlocked ships, weapons, drones, gear, and medals remain completely safe.
                </p>
              </div>
            </div>

            <ConfirmButtonPair
              onCancel={() => {
                SoundManager.playButtonClick();
                setShowResetDialog(false);
              }}
              onConfirm={handleConfirmReset}
            />
          </div>
        </div>
      )}
    </>
  );
};
