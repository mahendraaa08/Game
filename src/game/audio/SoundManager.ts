import { EnemyClass } from '../config/EnemyConfig';
import { PowerUpType } from '../config/PowerUpConfig';
import { SpecialId, WeaponId } from '../config/WeaponConfig';
import { GameSettings, StorageManager } from '../utils/StorageManager';

export type MusicTrack =
  | 'none'
  | 'menu'
  | 'campaign'
  | 'gameplay'
  | 'boss'
  | 'endless'
  | 'victory'
  | 'gameover';

interface TrackConfig {
  bpm: number;
  stepsPerBar: number;
  bass: number[];
  arp: (number | null)[];
  padChords: number[][];
  leadWave: OscillatorType;
  filterHz: number;
  bassGain: number;
  leadGain: number;
  padGain: number;
  drumGain: number;
  kicks: number[];
  snares: number[];
  hats: number[];
}

const TRACK_CONFIGS: Record<Exclude<MusicTrack, 'none'>, TrackConfig> = {
  menu: {
    bpm: 94,
    stepsPerBar: 16,
    bass: [110, 0, 110, 0, 130.81, 0, 146.83, 0, 98, 0, 98, 0, 110, 0, 123.47, 0],
    arp: [440, null, 523.25, 659.25, 523.25, null, 659.25, 783.99, 392, null, 493.88, 587.33, 440, null, 523.25, null],
    padChords: [
      [220, 261.63, 329.63],
      [196, 246.94, 293.66],
    ],
    leadWave: 'triangle',
    filterHz: 1550,
    bassGain: 0.14,
    leadGain: 0.065,
    padGain: 0.045,
    drumGain: 0.05,
    kicks: [0, 8],
    snares: [],
    hats: [2, 6, 10, 14],
  },
  campaign: {
    bpm: 108,
    stepsPerBar: 16,
    bass: [130.81, 0, 130.81, 130.81, 164.81, 0, 146.83, 0, 110, 0, 110, 110, 146.83, 0, 164.81, 0],
    arp: [523.25, 659.25, 783.99, null, 659.25, null, 783.99, 987.77, 440, 587.33, 659.25, null, 587.33, 659.25, 783.99, null],
    padChords: [
      [261.63, 329.63, 392],
      [220, 293.66, 329.63],
    ],
    leadWave: 'triangle',
    filterHz: 1850,
    bassGain: 0.15,
    leadGain: 0.075,
    padGain: 0.045,
    drumGain: 0.075,
    kicks: [0, 4, 8, 12],
    snares: [4, 12],
    hats: [2, 6, 10, 14],
  },
  gameplay: {
    bpm: 128,
    stepsPerBar: 16,
    bass: [110, 110, 220, 110, 146.83, 146.83, 220, 146.83, 164.81, 164.81, 246.94, 164.81, 130.81, 146.83, 130.81, 110],
    arp: [440, null, 523.25, 659.25, 587.33, null, 783.99, 659.25, 659.25, null, 783.99, 880, 523.25, 659.25, 523.25, 440],
    padChords: [
      [220, 329.63, 440],
      [196, 293.66, 392],
    ],
    leadWave: 'sawtooth',
    filterHz: 2100,
    bassGain: 0.16,
    leadGain: 0.075,
    padGain: 0.032,
    drumGain: 0.11,
    kicks: [0, 4, 8, 12],
    snares: [4, 12],
    hats: [2, 6, 10, 14, 15],
  },
  boss: {
    bpm: 146,
    stepsPerBar: 16,
    bass: [82.41, 82.41, 164.81, 82.41, 98, 98, 82.41, 98, 73.42, 73.42, 146.83, 82.41, 110, 98, 92.5, 82.41],
    arp: [329.63, 392, 493.88, 392, 440, 493.88, 523.25, 440, 392, 349.23, 329.63, 392, 440, 392, 329.63, 293.66],
    padChords: [
      [164.81, 246.94, 311.13],
      [146.83, 220, 293.66],
    ],
    leadWave: 'sawtooth',
    filterHz: 2500,
    bassGain: 0.18,
    leadGain: 0.085,
    padGain: 0.036,
    drumGain: 0.135,
    kicks: [0, 2, 4, 8, 10, 12],
    snares: [4, 12, 14],
    hats: [1, 3, 5, 7, 9, 11, 13, 15],
  },
  endless: {
    bpm: 136,
    stepsPerBar: 16,
    bass: [98, 98, 196, 98, 116.54, 116.54, 130.81, 116.54, 146.83, 146.83, 220, 146.83, 130.81, 116.54, 98, 116.54],
    arp: [392, null, 466.16, 587.33, 698.46, null, 587.33, 698.46, 783.99, null, 698.46, 587.33, 466.16, 587.33, 466.16, 392],
    padChords: [
      [196, 233.08, 293.66],
      [174.61, 220, 261.63],
    ],
    leadWave: 'sawtooth',
    filterHz: 2250,
    bassGain: 0.16,
    leadGain: 0.075,
    padGain: 0.032,
    drumGain: 0.12,
    kicks: [0, 4, 8, 12],
    snares: [4, 12],
    hats: [2, 6, 10, 14],
  },
  victory: {
    bpm: 112,
    stepsPerBar: 16,
    bass: [130.81, 0, 164.81, 0, 196, 0, 261.63, 0, 196, 0, 220, 0, 246.94, 0, 261.63, 0],
    arp: [523.25, 659.25, 783.99, 1046.5, 987.77, 880, 783.99, 1046.5, 659.25, 783.99, 987.77, 1318.51, 1046.5, null, 1318.51, null],
    padChords: [
      [261.63, 329.63, 392, 523.25],
      [220, 293.66, 392, 493.88],
    ],
    leadWave: 'triangle',
    filterHz: 2300,
    bassGain: 0.13,
    leadGain: 0.08,
    padGain: 0.055,
    drumGain: 0.07,
    kicks: [0, 8],
    snares: [4, 12],
    hats: [2, 6, 10, 14],
  },
  gameover: {
    bpm: 72,
    stepsPerBar: 8,
    bass: [110, 0, 98, 0, 87.31, 0, 82.41, 0],
    arp: [329.63, null, 293.66, null, 261.63, null, 220, null],
    padChords: [
      [164.81, 220, 261.63],
      [146.83, 196, 246.94],
    ],
    leadWave: 'sine',
    filterHz: 950,
    bassGain: 0.12,
    leadGain: 0.06,
    padGain: 0.05,
    drumGain: 0,
    kicks: [],
    snares: [],
    hats: [],
  },
};

const LOOKAHEAD_MS = 32;
const SCHEDULE_AHEAD_SEC = 0.11;

class SoundManagerImpl {
  private ctx: AudioContext | null = null;
  private compressor: DynamicsCompressorNode | null = null;
  private masterGain: GainNode | null = null;
  private musicGain: GainNode | null = null;
  private musicEnvelopeGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;

  private settings: GameSettings = StorageManager.load().settings;
  private currentTrack: MusicTrack = 'none';
  private musicTimer: number | null = null;
  private musicStep = 0;
  private nextNoteTime = 0;

  // Per-channel rate limiters & active caches to prevent mud/clipping
  private lastShotSoundAt = 0;
  private lastHitSoundAt = 0;
  private lastCritSoundAt = 0;
  private lastBossHitAt = 0;
  private lastExplosionAt = 0;
  private lastEnemyFireAt = 0;
  private lastShieldHitAt = 0;

  private noiseBuffer: AudioBuffer | null = null;
  private explosionBufferCache: Partial<Record<'small' | 'medium' | 'boss', AudioBuffer>> = {};

  private ensureContext(): AudioContext | null {
    if (this.settings.muted) return null;
    if (!this.ctx) {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return null;

      this.ctx = new AudioCtx();
      this.noiseBuffer = null;
      this.explosionBufferCache = {};

      this.compressor = this.ctx.createDynamicsCompressor();
      this.compressor.threshold.setValueAtTime(-12, this.ctx.currentTime);
      this.compressor.knee.setValueAtTime(12, this.ctx.currentTime);
      this.compressor.ratio.setValueAtTime(6, this.ctx.currentTime);
      this.compressor.attack.setValueAtTime(0.003, this.ctx.currentTime);
      this.compressor.release.setValueAtTime(0.14, this.ctx.currentTime);

      this.masterGain = this.ctx.createGain();
      this.musicGain = this.ctx.createGain();
      this.musicEnvelopeGain = this.ctx.createGain();
      this.sfxGain = this.ctx.createGain();

      this.musicGain.connect(this.musicEnvelopeGain);
      this.musicEnvelopeGain.connect(this.masterGain);
      this.sfxGain.connect(this.masterGain);
      this.masterGain.connect(this.compressor);
      this.compressor.connect(this.ctx.destination);

      this.applyVolumes();
    }

    if (this.ctx.state === 'suspended') {
      this.ctx
        .resume()
        .then(() => {
          if (
            !this.settings.muted &&
            this.currentTrack !== 'none' &&
            this.musicTimer === null &&
            this.ctx?.state === 'running'
          ) {
            this.startMusicLoop();
          }
        })
        .catch(() => {});
    }

    return this.ctx;
  }

  private getNoiseBuffer(ctx: AudioContext): AudioBuffer {
    if (this.noiseBuffer && this.noiseBuffer.sampleRate === ctx.sampleRate) {
      return this.noiseBuffer;
    }
    const len = Math.floor(ctx.sampleRate * 0.6);
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    this.noiseBuffer = buf;
    return buf;
  }

  private applyVolumes(): void {
    if (!this.ctx || !this.masterGain || !this.musicGain || !this.sfxGain) return;
    const now = this.ctx.currentTime;
    const master = this.settings.muted ? 0 : this.settings.masterVolume * 0.48;
    this.masterGain.gain.setTargetAtTime(master, now, 0.03);
    this.musicGain.gain.setTargetAtTime(this.settings.musicVolume * 0.36, now, 0.04);
    this.sfxGain.gain.setTargetAtTime(this.settings.sfxVolume * 0.88, now, 0.02);
  }

  syncSettings(next: GameSettings): void {
    this.settings = { ...next };
    this.applyVolumes();
    if (this.settings.muted) {
      this.stopMusicLoop();
    } else if (
      this.currentTrack !== 'none' &&
      this.musicTimer === null &&
      this.ctx?.state === 'running'
    ) {
      this.startMusicLoop();
    }
  }

  unlock(): void {
    const ctx = this.ensureContext();
    if (
      ctx &&
      ctx.state === 'running' &&
      this.currentTrack !== 'none' &&
      this.musicTimer === null
    ) {
      this.startMusicLoop();
    }
  }

  isMuted(): boolean {
    return this.settings.muted;
  }

  setMuted(muted: boolean): void {
    const next = StorageManager.updateSettings({ muted });
    this.syncSettings(next);
  }

  toggleMute(): boolean {
    this.setMuted(!this.settings.muted);
    return this.settings.muted;
  }

  playMusic(track: MusicTrack): void {
    if (this.currentTrack === track && (track === 'none' || this.musicTimer !== null)) {
      return;
    }
    this.currentTrack = track;
    this.musicStep = 0;
    this.stopMusicLoop();
    if (track === 'none' || this.settings.muted) return;
    if (this.ctx && this.ctx.state === 'running') {
      this.startMusicLoop();
    }
  }

  private stopMusicLoop(): void {
    if (this.musicTimer !== null) {
      window.clearInterval(this.musicTimer);
      this.musicTimer = null;
    }
    if (this.ctx && this.musicEnvelopeGain) {
      const now = this.ctx.currentTime;
      this.musicEnvelopeGain.gain.cancelScheduledValues(now);
      this.musicEnvelopeGain.gain.setTargetAtTime(0.0001, now, 0.05);
    }
  }

  private startMusicLoop(): void {
    this.stopMusicLoop();
    if (this.currentTrack === 'none' || this.settings.muted) return;
    const ctx = this.ctx;
    if (!ctx || !this.musicGain || !this.musicEnvelopeGain) return;

    const now = ctx.currentTime;
    this.musicEnvelopeGain.gain.cancelScheduledValues(now);
    this.musicEnvelopeGain.gain.setValueAtTime(0.001, now);
    this.musicEnvelopeGain.gain.linearRampToValueAtTime(1, now + 0.35);

    this.nextNoteTime = now + 0.03;

    const scheduleStep = (stepIndex: number, t: number, cfg: TrackConfig, stepSec: number) => {
      if (!this.musicGain) return;
      const barStep = stepIndex % cfg.stepsPerBar;

      // 1. Warm Space Pad Chord (retriggered gently every half-bar)
      const halfBar = Math.max(4, Math.floor(cfg.stepsPerBar / 2));
      if (barStep % halfBar === 0 && cfg.padGain > 0) {
        const chordIdx = Math.floor((stepIndex / halfBar) % cfg.padChords.length);
        const chord = cfg.padChords[chordIdx];
        const padDur = stepSec * halfBar * 0.96;
        chord.forEach((freq, vIdx) => {
          if (!this.musicGain) return;
          const osc = ctx.createOscillator();
          const filter = ctx.createBiquadFilter();
          const gain = ctx.createGain();
          osc.type = vIdx === 0 ? 'triangle' : 'sine';
          osc.frequency.setValueAtTime(freq, t);
          osc.detune.setValueAtTime(vIdx % 2 === 0 ? -5 : 5, t);
          filter.type = 'lowpass';
          filter.frequency.setValueAtTime(Math.min(1150, cfg.filterHz * 0.65), t);
          const peak = cfg.padGain / Math.max(1, chord.length * 0.8);
          gain.gain.setValueAtTime(0.0005, t);
          gain.gain.linearRampToValueAtTime(peak, t + Math.min(0.28, padDur * 0.3));
          gain.gain.setValueAtTime(peak, t + padDur * 0.7);
          gain.gain.exponentialRampToValueAtTime(0.0005, t + padDur);
          osc.connect(filter);
          filter.connect(gain);
          gain.connect(this.musicGain);
          osc.start(t);
          osc.stop(t + padDur + 0.02);
        });
      }

      // 2. Deep Sub + Pulsing Synth Bass
      const bassFreq = cfg.bass[barStep % cfg.bass.length];
      if (bassFreq > 0) {
        const osc = ctx.createOscillator();
        const filter = ctx.createBiquadFilter();
        const gain = ctx.createGain();
        osc.type = this.currentTrack === 'boss' || this.currentTrack === 'endless' ? 'sawtooth' : 'triangle';
        osc.frequency.setValueAtTime(bassFreq, t);
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(520, t);
        filter.frequency.exponentialRampToValueAtTime(190, t + stepSec * 0.85);
        gain.gain.setValueAtTime(cfg.bassGain, t);
        gain.gain.exponentialRampToValueAtTime(0.0008, t + stepSec * 0.92);
        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.musicGain);
        osc.start(t);
        osc.stop(t + stepSec * 0.95);
      }

      // 3. Lead / Arpeggio Synth Voice
      const arpFreq = cfg.arp[barStep % cfg.arp.length];
      if (arpFreq !== null && arpFreq > 0) {
        const osc = ctx.createOscillator();
        const filter = ctx.createBiquadFilter();
        const gain = ctx.createGain();
        osc.type = cfg.leadWave;
        osc.frequency.setValueAtTime(arpFreq, t);
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(cfg.filterHz, t);
        filter.frequency.exponentialRampToValueAtTime(Math.max(420, cfg.filterHz * 0.45), t + stepSec * 1.15);
        filter.Q.setValueAtTime(1.4, t);
        gain.gain.setValueAtTime(0.001, t);
        gain.gain.linearRampToValueAtTime(cfg.leadGain, t + 0.012);
        gain.gain.exponentialRampToValueAtTime(0.0008, t + stepSec * 1.2);
        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.musicGain);
        osc.start(t);
        osc.stop(t + stepSec * 1.25);
      }

      // 4. Synthesized Percussion Layer (Kick / Snare / Hat)
      if (cfg.drumGain > 0) {
        if (cfg.kicks.includes(barStep)) {
          const kickOsc = ctx.createOscillator();
          const kickGain = ctx.createGain();
          kickOsc.type = 'sine';
          kickOsc.frequency.setValueAtTime(132, t);
          kickOsc.frequency.exponentialRampToValueAtTime(42, t + 0.11);
          kickGain.gain.setValueAtTime(cfg.drumGain * 1.35, t);
          kickGain.gain.exponentialRampToValueAtTime(0.001, t + 0.13);
          kickOsc.connect(kickGain);
          kickGain.connect(this.musicGain);
          kickOsc.start(t);
          kickOsc.stop(t + 0.14);
        }

        if (cfg.snares.includes(barStep)) {
          const noise = ctx.createBufferSource();
          noise.buffer = this.getNoiseBuffer(ctx);
          const bp = ctx.createBiquadFilter();
          bp.type = 'bandpass';
          bp.frequency.setValueAtTime(1650, t);
          bp.Q.setValueAtTime(0.9, t);
          const sGain = ctx.createGain();
          sGain.gain.setValueAtTime(cfg.drumGain * 0.65, t);
          sGain.gain.exponentialRampToValueAtTime(0.001, t + 0.11);
          noise.connect(bp);
          bp.connect(sGain);
          sGain.connect(this.musicGain);
          noise.start(t);
          noise.stop(t + 0.12);
        }

        if (cfg.hats.includes(barStep)) {
          const hat = ctx.createBufferSource();
          hat.buffer = this.getNoiseBuffer(ctx);
          const hp = ctx.createBiquadFilter();
          hp.type = 'highpass';
          hp.frequency.setValueAtTime(6800, t);
          const hGain = ctx.createGain();
          hGain.gain.setValueAtTime(cfg.drumGain * 0.34, t);
          hGain.gain.exponentialRampToValueAtTime(0.001, t + 0.045);
          hat.connect(hp);
          hp.connect(hGain);
          hGain.connect(this.musicGain);
          hat.start(t);
          hat.stop(t + 0.05);
        }
      }
    };

    const scheduler = () => {
      if (this.settings.muted || this.currentTrack === 'none') return;
      if (!this.ctx || !this.musicGain || this.ctx.state !== 'running') return;
      const cfg = TRACK_CONFIGS[this.currentTrack];
      const stepSec = 60 / cfg.bpm / 4; // 16th-note pulse

      // Catch up cleanly if browser tab was backgrounded
      if (this.nextNoteTime < this.ctx.currentTime - 0.35) {
        this.nextNoteTime = this.ctx.currentTime + 0.02;
      }

      while (this.nextNoteTime < this.ctx.currentTime + SCHEDULE_AHEAD_SEC) {
        scheduleStep(this.musicStep, this.nextNoteTime, cfg, stepSec);
        this.musicStep++;
        this.nextNoteTime += stepSec;
      }
    };

    scheduler();
    this.musicTimer = window.setInterval(scheduler, LOOKAHEAD_MS);
  }

  playWeaponFire(weapon: WeaponId): void {
    const nowMs = performance.now();
    const minInterval = weapon === 'beam' ? 140 : 54;
    if (nowMs - this.lastShotSoundAt < minInterval) return;
    this.lastShotSoundAt = nowMs;

    const ctx = this.ensureContext();
    if (!ctx || !this.sfxGain) return;
    const t = ctx.currentTime;
    const pitchJitter = 0.97 + Math.random() * 0.06;

    switch (weapon) {
      case 'plasma': {
        // Warm, punchy core plasma bolt + transient click
        const core = ctx.createOscillator();
        const sub = ctx.createOscillator();
        const gain = ctx.createGain();
        core.type = 'triangle';
        core.frequency.setValueAtTime(690 * pitchJitter, t);
        core.frequency.exponentialRampToValueAtTime(175 * pitchJitter, t + 0.085);
        sub.type = 'sine';
        sub.frequency.setValueAtTime(220 * pitchJitter, t);
        sub.frequency.exponentialRampToValueAtTime(85, t + 0.065);
        gain.gain.setValueAtTime(0.15, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.09);
        core.connect(gain);
        sub.connect(gain);
        gain.connect(this.sfxGain);
        core.start(t);
        sub.start(t);
        core.stop(t + 0.095);
        sub.stop(t + 0.07);
        break;
      }

      case 'dual_laser': {
        // Twin detuned crisp sci-fi laser zaps
        const osc1 = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        const filter = ctx.createBiquadFilter();
        const gain = ctx.createGain();
        osc1.type = 'sawtooth';
        osc2.type = 'triangle';
        osc1.frequency.setValueAtTime(1120 * pitchJitter, t);
        osc1.frequency.exponentialRampToValueAtTime(340 * pitchJitter, t + 0.065);
        osc2.frequency.setValueAtTime(1155 * pitchJitter, t + 0.008);
        osc2.frequency.exponentialRampToValueAtTime(365 * pitchJitter, t + 0.072);
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(2600, t);
        gain.gain.setValueAtTime(0.095, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.075);
        osc1.connect(filter);
        osc2.connect(filter);
        filter.connect(gain);
        gain.connect(this.sfxGain);
        osc1.start(t);
        osc2.start(t + 0.008);
        osc1.stop(t + 0.07);
        osc2.stop(t + 0.078);
        break;
      }

      case 'spread': {
        // Wide multi-pellet plasma scatter blast + brief airy burst
        const thump = ctx.createOscillator();
        const thumpGain = ctx.createGain();
        thump.type = 'triangle';
        thump.frequency.setValueAtTime(420 * pitchJitter, t);
        thump.frequency.exponentialRampToValueAtTime(110, t + 0.11);
        thumpGain.gain.setValueAtTime(0.14, t);
        thumpGain.gain.exponentialRampToValueAtTime(0.001, t + 0.115);
        thump.connect(thumpGain);
        thumpGain.connect(this.sfxGain);
        thump.start(t);
        thump.stop(t + 0.12);

        const scatter = ctx.createBufferSource();
        scatter.buffer = this.getNoiseBuffer(ctx);
        const bp = ctx.createBiquadFilter();
        bp.type = 'bandpass';
        bp.frequency.setValueAtTime(1450 * pitchJitter, t);
        bp.Q.setValueAtTime(0.8, t);
        const nGain = ctx.createGain();
        nGain.gain.setValueAtTime(0.095, t);
        nGain.gain.exponentialRampToValueAtTime(0.001, t + 0.09);
        scatter.connect(bp);
        bp.connect(nGain);
        nGain.connect(this.sfxGain);
        scatter.start(t);
        scatter.stop(t + 0.095);
        break;
      }

      case 'beam': {
        // Smooth continuous resonant photon beam hum
        const hum = ctx.createOscillator();
        const overtone = ctx.createOscillator();
        const bp = ctx.createBiquadFilter();
        const gain = ctx.createGain();
        hum.type = 'sawtooth';
        overtone.type = 'sine';
        hum.frequency.setValueAtTime(240 * pitchJitter, t);
        overtone.frequency.setValueAtTime(480 * pitchJitter, t);
        bp.type = 'bandpass';
        bp.frequency.setValueAtTime(760, t);
        bp.Q.setValueAtTime(1.6, t);
        gain.gain.setValueAtTime(0.001, t);
        gain.gain.linearRampToValueAtTime(0.095, t + 0.03);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.17);
        hum.connect(bp);
        overtone.connect(bp);
        bp.connect(gain);
        gain.connect(this.sfxGain);
        hum.start(t);
        overtone.start(t);
        hum.stop(t + 0.175);
        overtone.stop(t + 0.175);
        break;
      }

      case 'homing': {
        // Rocket thruster ignition whoosh + upward lock-on chirp
        const chirp = ctx.createOscillator();
        const cGain = ctx.createGain();
        chirp.type = 'sawtooth';
        chirp.frequency.setValueAtTime(230 * pitchJitter, t);
        chirp.frequency.exponentialRampToValueAtTime(560 * pitchJitter, t + 0.12);
        cGain.gain.setValueAtTime(0.095, t);
        cGain.gain.exponentialRampToValueAtTime(0.001, t + 0.13);
        chirp.connect(cGain);
        cGain.connect(this.sfxGain);
        chirp.start(t);
        chirp.stop(t + 0.135);

        const exhaust = ctx.createBufferSource();
        exhaust.buffer = this.getNoiseBuffer(ctx);
        const lp = ctx.createBiquadFilter();
        lp.type = 'bandpass';
        lp.frequency.setValueAtTime(980, t);
        lp.frequency.exponentialRampToValueAtTime(420, t + 0.13);
        const eGain = ctx.createGain();
        eGain.gain.setValueAtTime(0.085, t);
        eGain.gain.exponentialRampToValueAtTime(0.001, t + 0.135);
        exhaust.connect(lp);
        lp.connect(eGain);
        eGain.connect(this.sfxGain);
        exhaust.start(t);
        exhaust.stop(t + 0.14);
        break;
      }

      case 'lightning': {
        // High-voltage arc snap + crisp electric spark crackle
        const arc = ctx.createOscillator();
        const arcGain = ctx.createGain();
        arc.type = 'square';
        arc.frequency.setValueAtTime(1620 * pitchJitter, t);
        arc.frequency.setValueAtTime(940 * pitchJitter, t + 0.025);
        arc.frequency.setValueAtTime(1320 * pitchJitter, t + 0.05);
        arc.frequency.exponentialRampToValueAtTime(260, t + 0.105);
        arcGain.gain.setValueAtTime(0.085, t);
        arcGain.gain.exponentialRampToValueAtTime(0.001, t + 0.11);
        arc.connect(arcGain);
        arcGain.connect(this.sfxGain);
        arc.start(t);
        arc.stop(t + 0.115);

        const crackle = ctx.createBufferSource();
        crackle.buffer = this.getNoiseBuffer(ctx);
        const hp = ctx.createBiquadFilter();
        hp.type = 'highpass';
        hp.frequency.setValueAtTime(3400, t);
        const nGain = ctx.createGain();
        nGain.gain.setValueAtTime(0.08, t);
        nGain.gain.exponentialRampToValueAtTime(0.001, t + 0.075);
        crackle.connect(hp);
        hp.connect(nGain);
        nGain.connect(this.sfxGain);
        crackle.start(t);
        crackle.stop(t + 0.08);
        break;
      }
    }
  }

  playHit(): void {
    const nowMs = performance.now();
    if (nowMs - this.lastHitSoundAt < 50) return;
    this.lastHitSoundAt = nowMs;

    const ctx = this.ensureContext();
    if (!ctx || !this.sfxGain) return;
    const t = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(240 + Math.random() * 25, t);
    osc.frequency.exponentialRampToValueAtTime(80, t + 0.048);
    gain.gain.setValueAtTime(0.11, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.052);
    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(t);
    osc.stop(t + 0.056);
  }

  playCritHit(): void {
    const nowMs = performance.now();
    if (nowMs - this.lastCritSoundAt < 75) return;
    this.lastCritSoundAt = nowMs;

    const ctx = this.ensureContext();
    if (!ctx || !this.sfxGain) return;
    const t = ctx.currentTime;
    const osc = ctx.createOscillator();
    const harm = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    harm.type = 'triangle';
    osc.frequency.setValueAtTime(980, t);
    osc.frequency.exponentialRampToValueAtTime(1520, t + 0.07);
    harm.frequency.setValueAtTime(1470, t);
    harm.frequency.exponentialRampToValueAtTime(2200, t + 0.07);
    gain.gain.setValueAtTime(0.14, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.09);
    osc.connect(gain);
    harm.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(t);
    harm.start(t);
    osc.stop(t + 0.095);
    harm.stop(t + 0.095);
  }

  playBossDamage(): void {
    const nowMs = performance.now();
    if (nowMs - this.lastBossHitAt < 58) return;
    this.lastBossHitAt = nowMs;

    const ctx = this.ensureContext();
    if (!ctx || !this.sfxGain) return;
    const t = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(155 + Math.random() * 15, t);
    osc.frequency.exponentialRampToValueAtTime(58, t + 0.06);
    gain.gain.setValueAtTime(0.13, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.065);
    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(t);
    osc.stop(t + 0.07);
  }

  playExplosion(scale: 'small' | 'medium' | 'boss' = 'small'): void {
    const nowMs = performance.now();
    if (scale === 'small' && nowMs - this.lastExplosionAt < 45) return;
    this.lastExplosionAt = nowMs;

    const ctx = this.ensureContext();
    if (!ctx || !this.sfxGain) return;
    const t = ctx.currentTime;

    const duration = scale === 'boss' ? 0.68 : scale === 'medium' ? 0.34 : 0.19;
    let buffer = this.explosionBufferCache[scale];
    if (!buffer) {
      const bufferSize = Math.floor(ctx.sampleRate * duration);
      buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / bufferSize, 1.75);
      }
      this.explosionBufferCache[scale] = buffer;
    }

    const noise = ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(scale === 'boss' ? 520 : scale === 'medium' ? 780 : 900, t);
    filter.frequency.exponentialRampToValueAtTime(65, t + duration);

    const nGain = ctx.createGain();
    const vol = scale === 'boss' ? 0.42 : scale === 'medium' ? 0.27 : 0.17;
    nGain.gain.setValueAtTime(vol, t);
    nGain.gain.exponentialRampToValueAtTime(0.001, t + duration);

    noise.connect(filter);
    filter.connect(nGain);
    nGain.connect(this.sfxGain);
    noise.start(t);

    // Punchy sub-bass detonation body
    const sub = ctx.createOscillator();
    const sGain = ctx.createGain();
    sub.type = 'sine';
    sub.frequency.setValueAtTime(scale === 'boss' ? 115 : 140, t);
    sub.frequency.exponentialRampToValueAtTime(34, t + Math.min(0.4, duration));
    sGain.gain.setValueAtTime(scale === 'boss' ? 0.34 : scale === 'medium' ? 0.2 : 0.12, t);
    sGain.gain.exponentialRampToValueAtTime(0.001, t + Math.min(0.42, duration));
    sub.connect(sGain);
    sGain.connect(this.sfxGain);
    sub.start(t);
    sub.stop(t + Math.min(0.44, duration));
  }

  playPowerUp(type?: PowerUpType): void {
    const ctx = this.ensureContext();
    if (!ctx || !this.sfxGain) return;
    const t = ctx.currentTime;

    let notes = [523.25, 659.25, 783.99, 1046.5];
    let wave: OscillatorType = 'sine';
    if (type === 'health') {
      notes = [440, 554.37, 659.25, 880];
    } else if (type === 'shield') {
      notes = [587.33, 739.99, 880, 1174.66];
      wave = 'triangle';
    } else if (type === 'double_damage') {
      notes = [392, 587.33, 783.99, 1174.66];
      wave = 'sawtooth';
    } else if (type === 'invulnerability') {
      notes = [659.25, 830.61, 987.77, 1318.51];
    } else if (type === 'mega_bomb') {
      notes = [329.63, 493.88, 659.25, 987.77];
      wave = 'triangle';
    }

    notes.forEach((freq, idx) => {
      if (!this.sfxGain) return;
      const start = t + idx * 0.042;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = wave;
      osc.frequency.setValueAtTime(freq, start);
      gain.gain.setValueAtTime(wave === 'sawtooth' ? 0.09 : 0.13, start);
      gain.gain.exponentialRampToValueAtTime(0.001, start + 0.14);
      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(start);
      osc.stop(start + 0.15);
    });
  }

  playDash(): void {
    const ctx = this.ensureContext();
    if (!ctx || !this.sfxGain) return;
    const t = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(260, t);
    osc.frequency.exponentialRampToValueAtTime(860, t + 0.12);
    gain.gain.setValueAtTime(0.14, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.14);
    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(t);
    osc.stop(t + 0.15);

    const whoosh = ctx.createBufferSource();
    whoosh.buffer = this.getNoiseBuffer(ctx);
    const bp = ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.setValueAtTime(750, t);
    bp.frequency.exponentialRampToValueAtTime(2400, t + 0.13);
    const wGain = ctx.createGain();
    wGain.gain.setValueAtTime(0.11, t);
    wGain.gain.exponentialRampToValueAtTime(0.001, t + 0.14);
    whoosh.connect(bp);
    bp.connect(wGain);
    wGain.connect(this.sfxGain);
    whoosh.start(t);
    whoosh.stop(t + 0.15);
  }

  playWeaponSwitch(): void {
    const ctx = this.ensureContext();
    if (!ctx || !this.sfxGain) return;
    const t = ctx.currentTime;
    const freqs = [560, 840];
    freqs.forEach((f, idx) => {
      if (!this.sfxGain) return;
      const start = t + idx * 0.028;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(f, start);
      gain.gain.setValueAtTime(0.11, start);
      gain.gain.exponentialRampToValueAtTime(0.001, start + 0.05);
      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(start);
      osc.stop(start + 0.055);
    });
  }

  playSpecial(specialId?: SpecialId): void {
    const ctx = this.ensureContext();
    if (!ctx || !this.sfxGain) return;
    const t = ctx.currentTime;

    if (specialId === 'orbital_strike') {
      // Heavy orbital ion ignition + resonant descending pillar roar
      const beam = ctx.createOscillator();
      const sub = ctx.createOscillator();
      const gain = ctx.createGain();
      beam.type = 'sawtooth';
      sub.type = 'sine';
      beam.frequency.setValueAtTime(640, t);
      beam.frequency.exponentialRampToValueAtTime(140, t + 0.48);
      sub.frequency.setValueAtTime(180, t);
      sub.frequency.exponentialRampToValueAtTime(48, t + 0.48);
      gain.gain.setValueAtTime(0.2, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.5);
      beam.connect(gain);
      sub.connect(gain);
      gain.connect(this.sfxGain);
      beam.start(t);
      sub.start(t);
      beam.stop(t + 0.52);
      sub.stop(t + 0.52);
      return;
    }

    if (specialId === 'photon_barrage') {
      // Cascading multi-warhead launch burst
      for (let i = 0; i < 4; i++) {
        const start = t + i * 0.045;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(340 + i * 95, start);
        osc.frequency.exponentialRampToValueAtTime(760 + i * 110, start + 0.14);
        gain.gain.setValueAtTime(0.12, start);
        gain.gain.exponentialRampToValueAtTime(0.001, start + 0.16);
        osc.connect(gain);
        gain.connect(this.sfxGain);
        osc.start(start);
        osc.stop(start + 0.17);
      }
      return;
    }

    // Default / EMP Nova: expanding electromagnetic shockwave
    const sweep = ctx.createOscillator();
    const sub = ctx.createOscillator();
    const gain = ctx.createGain();
    sweep.type = 'sawtooth';
    sub.type = 'sine';
    sweep.frequency.setValueAtTime(160, t);
    sweep.frequency.exponentialRampToValueAtTime(780, t + 0.16);
    sweep.frequency.exponentialRampToValueAtTime(92, t + 0.46);
    sub.frequency.setValueAtTime(120, t);
    sub.frequency.exponentialRampToValueAtTime(40, t + 0.42);
    gain.gain.setValueAtTime(0.22, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.48);
    sweep.connect(gain);
    sub.connect(gain);
    gain.connect(this.sfxGain);
    sweep.start(t);
    sub.start(t);
    sweep.stop(t + 0.5);
    sub.stop(t + 0.45);
  }

  playShieldHit(): void {
    const nowMs = performance.now();
    if (nowMs - this.lastShieldHitAt < 90) return;
    this.lastShieldHitAt = nowMs;

    const ctx = this.ensureContext();
    if (!ctx || !this.sfxGain) return;
    const t = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(780, t);
    osc.frequency.exponentialRampToValueAtTime(420, t + 0.11);
    gain.gain.setValueAtTime(0.18, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.12);
    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(t);
    osc.stop(t + 0.13);
  }

  playPlayerDamage(): void {
    const ctx = this.ensureContext();
    if (!ctx || !this.sfxGain) return;
    const t = ctx.currentTime;
    const osc = ctx.createOscillator();
    const sub = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sawtooth';
    sub.type = 'sine';
    osc.frequency.setValueAtTime(185, t);
    osc.frequency.exponentialRampToValueAtTime(52, t + 0.22);
    sub.frequency.setValueAtTime(110, t);
    sub.frequency.exponentialRampToValueAtTime(38, t + 0.2);
    gain.gain.setValueAtTime(0.24, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.24);
    osc.connect(gain);
    sub.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(t);
    sub.start(t);
    osc.stop(t + 0.25);
    sub.stop(t + 0.22);
  }

  playEnemyFire(enemyClass?: EnemyClass): void {
    const nowMs = performance.now();
    if (nowMs - this.lastEnemyFireAt < 160) return;
    this.lastEnemyFireAt = nowMs;

    const ctx = this.ensureContext();
    if (!ctx || !this.sfxGain) return;
    const t = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    if (enemyClass === 'sniper') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(1180, t);
      osc.frequency.exponentialRampToValueAtTime(340, t + 0.08);
      gain.gain.setValueAtTime(0.075, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.085);
      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(t);
      osc.stop(t + 0.09);
    } else if (enemyClass === 'bomber' || enemyClass === 'bastion') {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(290, t);
      osc.frequency.exponentialRampToValueAtTime(115, t + 0.09);
      gain.gain.setValueAtTime(0.075, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.095);
      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(t);
      osc.stop(t + 0.1);
    } else {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(640, t);
      osc.frequency.exponentialRampToValueAtTime(240, t + 0.065);
      gain.gain.setValueAtTime(0.065, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.07);
      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(t);
      osc.stop(t + 0.075);
    }
  }

  playBossWarning(): void {
    const ctx = this.ensureContext();
    if (!ctx || !this.sfxGain) return;
    const t = ctx.currentTime;
    for (let i = 0; i < 3; i++) {
      const start = t + i * 0.38;
      const osc = ctx.createOscillator();
      const sub = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      sub.type = 'triangle';
      osc.frequency.setValueAtTime(310, start);
      osc.frequency.linearRampToValueAtTime(465, start + 0.16);
      osc.frequency.linearRampToValueAtTime(265, start + 0.3);
      sub.frequency.setValueAtTime(110, start);
      gain.gain.setValueAtTime(0.18, start);
      gain.gain.exponentialRampToValueAtTime(0.001, start + 0.32);
      osc.connect(gain);
      sub.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(start);
      sub.start(start);
      osc.stop(start + 0.33);
      sub.stop(start + 0.33);
    }
  }

  playBossPhaseShift(): void {
    const ctx = this.ensureContext();
    if (!ctx || !this.sfxGain) return;
    const t = ctx.currentTime;

    const surge = ctx.createOscillator();
    const sub = ctx.createOscillator();
    const gain = ctx.createGain();
    surge.type = 'sawtooth';
    sub.type = 'sine';
    surge.frequency.setValueAtTime(140, t);
    surge.frequency.exponentialRampToValueAtTime(680, t + 0.24);
    surge.frequency.exponentialRampToValueAtTime(180, t + 0.52);
    sub.frequency.setValueAtTime(95, t);
    sub.frequency.exponentialRampToValueAtTime(42, t + 0.45);
    gain.gain.setValueAtTime(0.22, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.54);
    surge.connect(gain);
    sub.connect(gain);
    gain.connect(this.sfxGain);
    surge.start(t);
    sub.start(t);
    surge.stop(t + 0.56);
    sub.stop(t + 0.48);
  }

  playBossLaser(): void {
    const ctx = this.ensureContext();
    if (!ctx || !this.sfxGain) return;
    const t = ctx.currentTime;
    const beam = ctx.createOscillator();
    const harm = ctx.createOscillator();
    const gain = ctx.createGain();
    beam.type = 'sawtooth';
    harm.type = 'square';
    beam.frequency.setValueAtTime(520, t);
    beam.frequency.exponentialRampToValueAtTime(135, t + 0.32);
    harm.frequency.setValueAtTime(1040, t);
    harm.frequency.exponentialRampToValueAtTime(260, t + 0.28);
    gain.gain.setValueAtTime(0.18, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.34);
    beam.connect(gain);
    harm.connect(gain);
    gain.connect(this.sfxGain);
    beam.start(t);
    harm.start(t);
    beam.stop(t + 0.35);
    harm.stop(t + 0.3);
  }

  playLevelUp(): void {
    const ctx = this.ensureContext();
    if (!ctx || !this.sfxGain) return;
    const t = ctx.currentTime;
    const notes = [523.25, 659.25, 783.99, 1046.5, 1318.51];
    notes.forEach((freq, idx) => {
      if (!this.sfxGain) return;
      const start = t + idx * 0.065;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = idx === notes.length - 1 ? 'triangle' : 'sine';
      osc.frequency.setValueAtTime(freq, start);
      gain.gain.setValueAtTime(0.15, start);
      gain.gain.exponentialRampToValueAtTime(0.001, start + (idx === notes.length - 1 ? 0.36 : 0.16));
      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(start);
      osc.stop(start + (idx === notes.length - 1 ? 0.38 : 0.18));
    });
  }

  playVictory(): void {
    const ctx = this.ensureContext();
    if (!ctx || !this.sfxGain) return;
    const t = ctx.currentTime;
    const fanfare = [523.25, 659.25, 783.99, 1046.5, 1318.5];
    fanfare.forEach((freq, idx) => {
      if (!this.sfxGain) return;
      const start = t + idx * 0.1;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, start);
      gain.gain.setValueAtTime(0.17, start);
      gain.gain.exponentialRampToValueAtTime(0.001, start + 0.42);
      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(start);
      osc.stop(start + 0.44);
    });
  }

  playDefeat(): void {
    const ctx = this.ensureContext();
    if (!ctx || !this.sfxGain) return;
    const t = ctx.currentTime;
    const descending = [392, 349.23, 293.66, 220];
    descending.forEach((freq, idx) => {
      if (!this.sfxGain) return;
      const start = t + idx * 0.14;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, start);
      gain.gain.setValueAtTime(0.14, start);
      gain.gain.exponentialRampToValueAtTime(0.001, start + 0.28);
      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(start);
      osc.stop(start + 0.3);
    });
  }

  playButtonClick(): void {
    const ctx = this.ensureContext();
    if (!ctx || !this.sfxGain) return;
    const t = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(760, t);
    osc.frequency.exponentialRampToValueAtTime(510, t + 0.036);
    gain.gain.setValueAtTime(0.085, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.042);
    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(t);
    osc.stop(t + 0.045);
  }

  playModalOpen(): void {
    const ctx = this.ensureContext();
    if (!ctx || !this.sfxGain) return;
    const t = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(420, t);
    osc.frequency.exponentialRampToValueAtTime(660, t + 0.065);
    gain.gain.setValueAtTime(0.075, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.075);
    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(t);
    osc.stop(t + 0.08);
  }

  playError(): void {
    const ctx = this.ensureContext();
    if (!ctx || !this.sfxGain) return;
    const t = ctx.currentTime;
    [220, 175].forEach((f, idx) => {
      if (!this.sfxGain) return;
      const start = t + idx * 0.06;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(f, start);
      gain.gain.setValueAtTime(0.11, start);
      gain.gain.exponentialRampToValueAtTime(0.001, start + 0.07);
      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(start);
      osc.stop(start + 0.075);
    });
  }

  playPurchase(): void {
    const ctx = this.ensureContext();
    if (!ctx || !this.sfxGain) return;
    const t = ctx.currentTime;
    [659.25, 987.77, 1318.51].forEach((freq, idx) => {
      if (!this.sfxGain) return;
      const start = t + idx * 0.05;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, start);
      gain.gain.setValueAtTime(0.13, start);
      gain.gain.exponentialRampToValueAtTime(0.001, start + 0.13);
      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(start);
      osc.stop(start + 0.14);
    });
  }

  playMissionComplete(): void {
    this.playLevelUp();
  }

  playAchievementUnlock(): void {
    this.playVictory();
  }
}

export const SoundManager = new SoundManagerImpl();
