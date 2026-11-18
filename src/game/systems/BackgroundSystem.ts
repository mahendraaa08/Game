import Phaser from 'phaser';
import { LevelEnvironment } from '../config/LevelConfig';

interface StarNode {
  x: number;
  y: number;
  speed: number;
  size: number;
  alpha: number;
  layer: number;
}

interface NebulaBlob {
  x: number;
  y: number;
  radius: number;
  color: number;
  alpha: number;
  speed: number;
}

interface PropNode {
  sprite: Phaser.GameObjects.Image;
  speed: number;
  rotSpeed: number;
}

export class BackgroundSystem {
  private scene: Phaser.Scene;
  private env: LevelEnvironment;
  private graphics: Phaser.GameObjects.Graphics;
  private stars: StarNode[] = [];
  private nebulae: NebulaBlob[] = [];
  private props: PropNode[] = [];
  private planetGfx: Phaser.GameObjects.Graphics;
  private planetY = 0;
  private width = 1280;
  private height = 720;
  private scrollMultiplier = 1;
  private fxQuality: 'high' | 'medium' | 'low' = 'high';

  constructor(scene: Phaser.Scene, env: LevelEnvironment, fxQuality: 'high' | 'medium' | 'low' = 'high') {
    this.scene = scene;
    this.env = env;
    this.fxQuality = fxQuality;
    this.width = scene.scale.width;
    this.height = scene.scale.height;

    this.scene.cameras.main.setBackgroundColor(env.bgDeep);

    this.graphics = scene.add.graphics().setDepth(-30);
    this.planetGfx = scene.add.graphics().setDepth(-25);

    this.initStars();
    this.initNebulae();
    this.initPlanet();
    this.initProps();
  }

  setScrollMultiplier(mult: number): void {
    this.scrollMultiplier = mult;
  }

  resize(width: number, height: number): void {
    this.width = width;
    this.height = height;
    this.initPlanet();
  }

  private initStars(): void {
    this.stars = [];
    const total = this.fxQuality === 'low' ? 50 : this.fxQuality === 'medium' ? 85 : 130;
    for (let i = 0; i < total; i++) {
      const layer = i < total * 0.45 ? 0 : i < total * 0.8 ? 1 : 2;
      this.stars.push({
        x: Math.random() * this.width,
        y: Math.random() * this.height,
        speed: layer === 0 ? 28 : layer === 1 ? 68 : 135,
        size: layer === 0 ? 1 : layer === 1 ? 1.6 : 2.3,
        alpha: layer === 0 ? 0.45 : layer === 1 ? 0.7 : 0.95,
        layer,
      });
    }
  }

  private initNebulae(): void {
    this.nebulae = [];
    const count = this.fxQuality === 'low' ? 2 : this.fxQuality === 'medium' ? 4 : 6;
    for (let i = 0; i < count; i++) {
      this.nebulae.push({
        x: Math.random() * this.width,
        y: Math.random() * this.height,
        radius: 140 + Math.random() * 190,
        color: i % 2 === 0 ? this.env.nebulaPrimary : this.env.nebulaSecondary,
        alpha: 0.055 + Math.random() * 0.055,
        speed: 14 + Math.random() * 16,
      });
    }
  }

  private initPlanet(): void {
    this.planetGfx.clear();
    const px = this.width * 0.78;
    const pr = Math.min(this.width, this.height) * 0.24;
    this.planetY = this.height * 0.25;

    // Atmosphere halo
    this.planetGfx.fillStyle(this.env.planetRim, 0.09);
    this.planetGfx.fillCircle(px, this.planetY, pr * 1.16);
    // Planet sphere
    this.planetGfx.fillStyle(this.env.planetColor, 0.55);
    this.planetGfx.fillCircle(px, this.planetY, pr);
    // Crescent rim highlight
    this.planetGfx.lineStyle(2.5, this.env.planetRim, 0.35);
    this.planetGfx.strokeCircle(px, this.planetY, pr);

    if (this.env.hasStationSilhouettes) {
      this.planetGfx.fillStyle(0x0f172a, 0.65);
      this.planetGfx.lineStyle(1, this.env.planetRim, 0.35);
      const sx = this.width * 0.2;
      const sy = this.height * 0.24;
      this.planetGfx.fillRect(sx - 38, sy - 6, 76, 12);
      this.planetGfx.fillRect(sx - 8, sy - 26, 16, 52);
      this.planetGfx.strokeRect(sx - 38, sy - 6, 76, 12);
    }
  }

  private initProps(): void {
    this.props.forEach((p) => p.sprite.destroy());
    this.props = [];

    if (this.env.hasAsteroids && this.fxQuality !== 'low') {
      const count = this.fxQuality === 'medium' ? 6 : 10;
      for (let i = 0; i < count; i++) {
        const key = i % 2 === 0 ? 'asteroid_1' : 'asteroid_2';
        const img = this.scene.add
          .image(Math.random() * this.width, Math.random() * this.height, key)
          .setDepth(-15)
          .setAlpha(0.32 + Math.random() * 0.25)
          .setScale(0.6 + Math.random() * 0.9)
          .setTint(this.env.asteroidTint);
        this.props.push({
          sprite: img,
          speed: 55 + Math.random() * 75,
          rotSpeed: (Math.random() - 0.5) * 0.9,
        });
      }
    }
  }

  update(dt: number): void {
    const g = this.graphics;
    g.clear();

    // Cyber grid subtle parallax
    if (this.env.hasCyberGrid) {
      g.lineStyle(1, this.env.nebulaPrimary, 0.08);
      const step = 72;
      const offset = (this.scene.time.now * 0.05 * this.scrollMultiplier) % step;
      for (let x = 0; x < this.width; x += step) {
        g.lineBetween(x, 0, x, this.height);
      }
      for (let y = offset; y < this.height; y += step) {
        g.lineBetween(0, y, this.width, y);
      }
    }

    // Nebulae
    for (let i = 0; i < this.nebulae.length; i++) {
      const n = this.nebulae[i];
      n.y += n.speed * dt * this.scrollMultiplier;
      if (n.y - n.radius > this.height) {
        n.y = -n.radius;
        n.x = Math.random() * this.width;
      }
      g.fillStyle(n.color, n.alpha);
      g.fillCircle(n.x, n.y, n.radius);
    }

    // Aurora or Void Rifts
    if (this.env.hasAuroraRifts || this.env.hasVoidRifts) {
      const pulse = 0.05 + 0.03 * Math.sin(this.scene.time.now * 0.002);
      g.lineStyle(3, this.env.nebulaPrimary, pulse);
      g.lineBetween(0, this.height * 0.35, this.width, this.height * 0.22);
      g.lineStyle(2, this.env.nebulaSecondary, pulse);
      g.lineBetween(0, this.height * 0.68, this.width, this.height * 0.55);
    }

    // Stars
    for (let i = 0; i < this.stars.length; i++) {
      const s = this.stars[i];
      s.y += s.speed * dt * this.scrollMultiplier;
      if (s.y > this.height + 4) {
        s.y = -4;
        s.x = Math.random() * this.width;
      }
      g.fillStyle(this.env.starTint, s.alpha);
      g.fillRect(s.x, s.y, s.size, s.size * (this.scrollMultiplier > 1.5 ? 3.5 : 1));
    }

    // Drifting Asteroids
    for (let i = 0; i < this.props.length; i++) {
      const p = this.props[i];
      p.sprite.y += p.speed * dt * this.scrollMultiplier;
      p.sprite.rotation += p.rotSpeed * dt;
      if (p.sprite.y > this.height + 60) {
        p.sprite.y = -60;
        p.sprite.x = Math.random() * this.width;
      }
    }
  }

  destroy(): void {
    this.graphics.destroy();
    this.planetGfx.destroy();
    this.props.forEach((p) => p.sprite.destroy());
    this.props = [];
  }
}
