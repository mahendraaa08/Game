import { WeaponId } from '../config/WeaponConfig';
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

const TRACK_PATTERNS: Record<
  Exclude<MusicTrack, 'none'>,
  { bpm: number; bass: number[]; lead: number[]; wave: OscillatorType }
> = {
  menu: {
    bpm: 96,
    bass: [110, 110, 130.81, 146.83, 98, 98, 110, 123.47],
    lead: [440, 523.25, 659.25, 523.25, 392, 493.88, 587.33, 440],
    wave: 'triangle',
  },
  campaign: {
    bpm: 108,
    bass: [130.81, 130.81, 164.81, 146.83, 110, 110, 146.83, 164.81],
    lead: [523.25, 659.25, 783.99, 659.25, 440, 587.33, 659.25, 783.99],
    wave: 'triangle',
  },
  gameplay: {
    bpm: 128,
    bass: [110, 110, 146.83, 110, 164.81, 146.83, 130.81, 110],
    lead: [440, 523.25, 659.25, 587.33, 783.99, 659.25, 523.25, 440],
    wave: 'sawtooth',
  },
  boss: {
    bpm: 146,
    bass: [82.41, 82.41, 98, 82.41, 73.42, 82.41, 110, 98],
    lead: [329.63, 392, 493.88, 440, 392, 349.23, 329.63, 293.66],
    wave: 'sawtooth',
  },
  endless: {
    bpm: 136,
    bass: [98, 98, 116.54, 130.81, 146.83, 130.81, 116.54, 98],
    lead: [392, 466.16, 587.33, 698.46, 783.99, 698.46, 587.33, 466.16],
    wave: 'sawtooth',
  },
  victory: {
    bpm: 112,
    bass: [130.81, 164.81, 196, 261.63, 196, 220, 246.94, 261.63],
    lead: [523.25, 659.25, 783.99, 1046.5, 987.77, 880, 783.99, 1046.5],
    wave: 'triangle',
  },
  gameover: {
    bpm: 72,
    bass: [110, 98, 87.31, 82.41],
    lead: [329.63, 293.66, 261.63, 220],
    wave: 'sine',
  },
};

class SoundManagerImpl {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private musicGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;

  private settings: GameSettings = StorageManager.load().settings;
  private currentTrack: MusicTrack = 'none';
  private musicTimer: number | null = null;
  private musicStep = 0;

  private lastShotSoundAt = 0;
  private lastHitSoundAt = 0;
  private lastCritSoundAt = 0;

  private ensureContext(): AudioContext | null {
    if (this.settings.muted) return null;
    if (!this.ctx) {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return null;
      this.ctx = new AudioCtx();

      this.masterGain = this.ctx.createGain();
      this.musicGain = this.ctx.createGain();
      this.sfxGain = this.ctx.createGain();

      this.musicGain.connect(this.masterGain);
      this.sfxGain.connect(this.masterGain);
      this.masterGain.connect(this.ctx.destination);
      this.applyVolumes();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  private applyVolumes(): void {
    if (!this.ctx || !this.masterGain || !this.musicGain || !this.sfxGain) return;
    const now = this.ctx.currentTime;
    const master = this.settings.muted ? 0 : this.settings.masterVolume * 0.42;
    this.masterGain.gain.setTargetAtTime(master, now, 0.03);
    this.musicGain.gain.setTargetAtTime(this.settings.musicVolume * 0.34, now, 0.04);
    this.sfxGain.gain.setTargetAtTime(this.settings.sfxVolume * 0.85, now, 0.02);
  }

  syncSettings(next: GameSettings): void {
    this.settings = { ...next };
    this.applyVolumes();
    if (this.settings.muted) {
      this.stopMusicLoop();
    } else if (this.currentTrack !== 'none' && this.musicTimer === null && this.ctx) {
      this.startMusicLoop();
    }
  }

  unlock(): void {
    const ctx = this.ensureContext();
    if (ctx && this.currentTrack !== 'none' && this.musicTimer === null) {
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
  }

  private startMusicLoop(): void {
    this.stopMusicLoop();
    if (this.currentTrack === 'none' || this.settings.muted) return;
    const pattern = TRACK_PATTERNS[this.currentTrack];
    const stepMs = Math.round((60 / pattern.bpm / 2) * 1000);

    const tick = () => {
      if (this.settings.muted || this.currentTrack === 'none') return;
      if (!this.ctx || !this.musicGain || this.ctx.state !== 'running') return;
      const p = TRACK_PATTERNS[this.currentTrack];
      const idx = this.musicStep % p.bass.length;
      this.musicStep++;
      const t = this.ctx.currentTime;
      const dur = stepMs / 1000;

      // Soft bass pulse
      const bassOsc = this.ctx.createOscillator();
      const bassGain = this.ctx.createGain();
      bassOsc.type = 'triangle';
      bassOsc.frequency.setValueAtTime(p.bass[idx], t);
      bassGain.gain.setValueAtTime(0.18, t);
      bassGain.gain.exponentialRampToValueAtTime(0.001, t + dur * 0.92);
      bassOsc.connect(bassGain);
      bassGain.connect(this.musicGain);
      bassOsc.start(t);
      bassOsc.stop(t + dur * 0.95);

      // Lead arpeggio note on even/accented steps
      if (idx % 2 === 0 || this.currentTrack === 'boss') {
        const leadOsc = this.ctx.createOscillator();
        const leadGain = this.ctx.createGain();
        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(1400, t);
        leadOsc.type = p.wave;
        leadOsc.frequency.setValueAtTime(p.lead[idx % p.lead.length], t);
        leadGain.gain.setValueAtTime(0.09, t);
        leadGain.gain.exponentialRampToValueAtTime(0.001, t + dur * 0.85);
        leadOsc.connect(filter);
        filter.connect(leadGain);
        leadGain.connect(this.musicGain);
        leadOsc.start(t);
        leadOsc.stop(t + dur * 0.9);
      }
    };

    tick();
    this.musicTimer = window.setInterval(tick, stepMs);
  }

  playWeaponFire(weapon: WeaponId): void {
    const nowMs = performance.now();
    if (nowMs - this.lastShotSoundAt < 58) return;
    this.lastShotSoundAt = nowMs;

    const ctx = this.ensureContext();
    if (!ctx || !this.sfxGain) return;
    const t = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(this.sfxGain);

    switch (weapon) {
      case 'plasma':
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(640, t);
        osc.frequency.exponentialRampToValueAtTime(190, t + 0.08);
        gain.gain.setValueAtTime(0.16, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.085);
        osc.start(t);
        osc.stop(t + 0.09);
        break;
      case 'dual_laser':
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(980, t);
        osc.frequency.exponentialRampToValueAtTime(320, t + 0.065);
        gain.gain.setValueAtTime(0.1, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.07);
        osc.start(t);
        osc.stop(t + 0.075);
        break;
      case 'spread':
        osc.type = 'square';
        osc.frequency.setValueAtTime(420, t);
        osc.frequency.exponentialRampToValueAtTime(120, t + 0.11);
        gain.gain.setValueAtTime(0.11, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.12);
        osc.start(t);
        osc.stop(t + 0.125);
        break;
      case 'homing':
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(240, t);
        osc.frequency.linearRampToValueAtTime(480, t + 0.12);
        gain.gain.setValueAtTime(0.13, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.14);
        osc.start(t);
        osc.stop(t + 0.145);
        break;
      case 'beam':
        osc.type = 'sine';
        osc.frequency.setValueAtTime(520, t);
        osc.frequency.linearRampToValueAtTime(560, t + 0.06);
        gain.gain.setValueAtTime(0.09, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.07);
        osc.start(t);
        osc.stop(t + 0.075);
        break;
      case 'lightning':
        osc.type = 'square';
        osc.frequency.setValueAtTime(1250, t);
        osc.frequency.exponentialRampToValueAtTime(280, t + 0.1);
        gain.gain.setValueAtTime(0.11, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.11);
        osc.start(t);
        osc.stop(t + 0.115);
        break;
    }
  }

  playHit(): void {
    const nowMs = performance.now();
    if (nowMs - this.lastHitSoundAt < 48) return;
    this.lastHitSoundAt = nowMs;

    const ctx = this.ensureContext();
    if (!ctx || !this.sfxGain) return;
    const t = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(220, t);
    osc.frequency.exponentialRampToValueAtTime(75, t + 0.05);
    gain.gain.setValueAtTime(0.12, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.055);
    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(t);
    osc.stop(t + 0.06);
  }

  playCritHit(): void {
    const nowMs = performance.now();
    if (nowMs - this.lastCritSoundAt < 75) return;
    this.lastCritSoundAt = nowMs;

    const ctx = this.ensureContext();
    if (!ctx || !this.sfxGain) return;
    const t = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(980, t);
    osc.frequency.exponentialRampToValueAtTime(1480, t + 0.07);
    gain.gain.setValueAtTime(0.16, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.09);
    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(t);
    osc.stop(t + 0.095);
  }

  playBossDamage(): void {
    this.playHit();
  }

  playExplosion(scale: 'small' | 'medium' | 'boss' = 'small'): void {
    const ctx = this.ensureContext();
    if (!ctx || !this.sfxGain) return;
    const t = ctx.currentTime;

    const duration = scale === 'boss' ? 0.65 : scale === 'medium' ? 0.32 : 0.18;
    const bufferSize = Math.floor(ctx.sampleRate * duration);
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / bufferSize, 1.8);
    }

    const noise = ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(scale === 'boss' ? 420 : 750, t);
    filter.frequency.exponentialRampToValueAtTime(70, t + duration);

    const gain = ctx.createGain();
    const vol = scale === 'boss' ? 0.5 : scale === 'medium' ? 0.3 : 0.19;
    gain.gain.setValueAtTime(vol, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + duration);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);
    noise.start(t);
  }

  playPowerUp(): void {
    const ctx = this.ensureContext();
    if (!ctx || !this.sfxGain) return;
    const t = ctx.currentTime;
    const notes = [523.25, 659.25, 783.99, 1046.5];
    notes.forEach((freq, idx) => {
      if (!this.sfxGain) return;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, t + idx * 0.045);
      gain.gain.setValueAtTime(0.15, t + idx * 0.045);
      gain.gain.exponentialRampToValueAtTime(0.001, t + idx * 0.045 + 0.14);
      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(t + idx * 0.045);
      osc.stop(t + idx * 0.045 + 0.15);
    });
  }

  playDash(): void {
    const ctx = this.ensureContext();
    if (!ctx || !this.sfxGain) return;
    const t = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(280, t);
    osc.frequency.exponentialRampToValueAtTime(840, t + 0.12);
    gain.gain.setValueAtTime(0.16, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.14);
    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(t);
    osc.stop(t + 0.15);
  }

  playSpecial(): void {
    const ctx = this.ensureContext();
    if (!ctx || !this.sfxGain) return;
    const t = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(160, t);
    osc.frequency.exponentialRampToValueAtTime(720, t + 0.18);
    osc.frequency.exponentialRampToValueAtTime(90, t + 0.45);
    gain.gain.setValueAtTime(0.25, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.48);
    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(t);
    osc.stop(t + 0.5);
  }

  playPlayerDamage(): void {
    const ctx = this.ensureContext();
    if (!ctx || !this.sfxGain) return;
    const t = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(170, t);
    osc.frequency.exponentialRampToValueAtTime(55, t + 0.22);
    gain.gain.setValueAtTime(0.28, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.24);
    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(t);
    osc.stop(t + 0.25);
  }

  playBossWarning(): void {
    const ctx = this.ensureContext();
    if (!ctx || !this.sfxGain) return;
    const t = ctx.currentTime;
    for (let i = 0; i < 3; i++) {
      const start = t + i * 0.38;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(320, start);
      osc.frequency.linearRampToValueAtTime(460, start + 0.16);
      osc.frequency.linearRampToValueAtTime(280, start + 0.3);
      gain.gain.setValueAtTime(0.2, start);
      gain.gain.exponentialRampToValueAtTime(0.001, start + 0.32);
      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(start);
      osc.stop(start + 0.33);
    }
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
      gain.gain.setValueAtTime(0.18, start);
      gain.gain.exponentialRampToValueAtTime(0.001, start + 0.38);
      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(start);
      osc.stop(start + 0.4);
    });
  }

  playButtonClick(): void {
    const ctx = this.ensureContext();
    if (!ctx || !this.sfxGain) return;
    const t = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(720, t);
    osc.frequency.exponentialRampToValueAtTime(520, t + 0.04);
    gain.gain.setValueAtTime(0.09, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.045);
    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(t);
    osc.stop(t + 0.05);
  }

  playPurchase(): void {
    const ctx = this.ensureContext();
    if (!ctx || !this.sfxGain) return;
    const t = ctx.currentTime;
    [659.25, 987.77].forEach((freq, idx) => {
      if (!this.sfxGain) return;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, t + idx * 0.06);
      gain.gain.setValueAtTime(0.16, t + idx * 0.06);
      gain.gain.exponentialRampToValueAtTime(0.001, t + idx * 0.06 + 0.12);
      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(t + idx * 0.06);
      osc.stop(t + idx * 0.06 + 0.13);
    });
  }

  playMissionComplete(): void {
    this.playPowerUp();
  }

  playAchievementUnlock(): void {
    this.playVictory();
  }
}

export const SoundManager = new SoundManagerImpl();
