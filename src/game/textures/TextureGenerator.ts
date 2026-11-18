import Phaser from 'phaser';

export function generateAllTextures(scene: Phaser.Scene): void {
  if (scene.textures.exists('player_ship')) return;

  createShipTextures(scene);
  createDroneTextures(scene);
  createEnemyTextures(scene);
  createBossTextures(scene);
  createProjectileTextures(scene);
  createPowerUpTextures(scene);
  createParticleAndEnvTextures(scene);
}

function createShipTextures(scene: Phaser.Scene): void {
  // 1. Falcon X + default player_ship alias (Balanced Fighter)
  const drawFalcon = (key: string) => {
    const g = scene.make.graphics({ x: 0, y: 0 });
    const cx = 32;
    const cy = 32;
    g.fillStyle(0x0ea5e9, 0.45);
    g.fillCircle(cx - 10, cy + 20, 7);
    g.fillCircle(cx + 10, cy + 20, 7);
    g.fillStyle(0x1e293b, 1);
    g.lineStyle(2, 0x38bdf8, 0.95);
    g.beginPath();
    g.moveTo(cx, cy - 28);
    g.lineTo(cx + 26, cy + 12);
    g.lineTo(cx + 22, cy + 20);
    g.lineTo(cx + 10, cy + 14);
    g.lineTo(cx + 8, cy + 22);
    g.lineTo(cx - 8, cy + 22);
    g.lineTo(cx - 10, cy + 14);
    g.lineTo(cx - 22, cy + 20);
    g.lineTo(cx - 26, cy + 12);
    g.closePath();
    g.fillPath();
    g.strokePath();
    g.fillStyle(0xe2e8f0, 1);
    g.beginPath();
    g.moveTo(cx, cy - 26);
    g.lineTo(cx + 10, cy + 6);
    g.lineTo(cx + 6, cy + 19);
    g.lineTo(cx - 6, cy + 19);
    g.lineTo(cx - 10, cy + 6);
    g.closePath();
    g.fillPath();
    g.fillStyle(0x38bdf8, 1);
    g.fillRect(cx - 24, cy + 2, 3, 13);
    g.fillRect(cx + 21, cy + 2, 3, 13);
    g.fillStyle(0x0284c7, 1);
    g.fillEllipse(cx, cy - 5, 7, 15);
    g.fillStyle(0x7dd3fc, 0.85);
    g.fillEllipse(cx - 1, cy - 7, 3, 8);
    g.fillStyle(0x67e8f9, 1);
    g.fillRect(cx - 11, cy + 19, 5, 4);
    g.fillRect(cx + 6, cy + 19, 5, 4);
    g.generateTexture(key, 64, 64);
    g.destroy();
  };
  drawFalcon('player_ship');
  drawFalcon('ship_falcon_x');

  // 2. Destroyer (Heavy Assault twin-prow gunship)
  {
    const g = scene.make.graphics({ x: 0, y: 0 });
    const cx = 32;
    const cy = 32;
    g.fillStyle(0x431407, 1);
    g.lineStyle(2.2, 0xf97316, 1);
    g.beginPath();
    g.moveTo(cx - 12, cy - 26);
    g.lineTo(cx + 12, cy - 26);
    g.lineTo(cx + 28, cy + 6);
    g.lineTo(cx + 24, cy + 22);
    g.lineTo(cx - 24, cy + 22);
    g.lineTo(cx - 28, cy + 6);
    g.closePath();
    g.fillPath();
    g.strokePath();
    g.fillStyle(0x9a3412, 1);
    g.fillRect(cx - 14, cy - 20, 28, 36);
    g.fillStyle(0xfef08a, 1);
    g.fillRect(cx - 22, cy - 12, 4, 20);
    g.fillRect(cx + 18, cy - 12, 4, 20);
    g.fillStyle(0xf97316, 1);
    g.fillEllipse(cx, cy - 6, 10, 14);
    g.generateTexture('ship_destroyer', 64, 64);
    g.destroy();
  }

  // 3. Phantom (Needle-thin High-Speed Interceptor)
  {
    const g = scene.make.graphics({ x: 0, y: 0 });
    const cx = 32;
    const cy = 32;
    g.fillStyle(0x082f49, 1);
    g.lineStyle(2, 0x22d3ee, 1);
    g.beginPath();
    g.moveTo(cx, cy - 30);
    g.lineTo(cx + 22, cy + 16);
    g.lineTo(cx + 7, cy + 10);
    g.lineTo(cx, cy + 24);
    g.lineTo(cx - 7, cy + 10);
    g.lineTo(cx - 22, cy + 16);
    g.closePath();
    g.fillPath();
    g.strokePath();
    g.fillStyle(0xa5f3fc, 1);
    g.fillTriangle(cx, cy - 24, cx - 5, cy + 8, cx + 5, cy + 8);
    g.fillStyle(0x06b6d4, 1);
    g.fillEllipse(cx, cy - 6, 5, 13);
    g.generateTexture('ship_phantom', 64, 64);
    g.destroy();
  }

  // 4. Nova Prime (Forward-swept Advanced Balanced)
  {
    const g = scene.make.graphics({ x: 0, y: 0 });
    const cx = 32;
    const cy = 32;
    g.fillStyle(0x1e1b4b, 1);
    g.lineStyle(2, 0x818cf8, 1);
    g.beginPath();
    g.moveTo(cx, cy - 28);
    g.lineTo(cx + 10, cy - 6);
    g.lineTo(cx + 27, cy - 14);
    g.lineTo(cx + 22, cy + 18);
    g.lineTo(cx + 8, cy + 22);
    g.lineTo(cx - 8, cy + 22);
    g.lineTo(cx - 22, cy + 18);
    g.lineTo(cx - 27, cy - 14);
    g.lineTo(cx - 10, cy - 6);
    g.closePath();
    g.fillPath();
    g.strokePath();
    g.fillStyle(0xc7d2fe, 1);
    g.fillTriangle(cx, cy - 23, cx - 8, cy + 14, cx + 8, cy + 14);
    g.fillStyle(0x60a5fa, 1);
    g.fillCircle(cx, cy - 2, 5);
    g.generateTexture('ship_nova_prime', 64, 64);
    g.destroy();
  }

  // 5. Thunderbolt (Multi-wing Rapid-Fire Specialist)
  {
    const g = scene.make.graphics({ x: 0, y: 0 });
    const cx = 32;
    const cy = 32;
    g.fillStyle(0x1e293b, 1);
    g.lineStyle(2, 0xfacc15, 1);
    g.beginPath();
    g.moveTo(cx, cy - 28);
    g.lineTo(cx + 27, cy + 4);
    g.lineTo(cx + 20, cy + 18);
    g.lineTo(cx + 12, cy + 10);
    g.lineTo(cx + 8, cy + 23);
    g.lineTo(cx - 8, cy + 23);
    g.lineTo(cx - 12, cy + 10);
    g.lineTo(cx - 20, cy + 18);
    g.lineTo(cx - 27, cy + 4);
    g.closePath();
    g.fillPath();
    g.strokePath();
    g.fillStyle(0xfef08a, 1);
    g.fillRect(cx - 25, cy - 6, 3, 18);
    g.fillRect(cx + 22, cy - 6, 3, 18);
    g.fillRect(cx - 14, cy - 12, 3, 16);
    g.fillRect(cx + 11, cy - 12, 3, 16);
    g.fillStyle(0x38bdf8, 1);
    g.fillEllipse(cx, cy - 5, 7, 14);
    g.generateTexture('ship_thunderbolt', 64, 64);
    g.destroy();
  }

  // 6. Aegis (Broad Defensive Guardian)
  {
    const g = scene.make.graphics({ x: 0, y: 0 });
    const cx = 32;
    const cy = 32;
    g.fillStyle(0x064e3b, 1);
    g.lineStyle(2.4, 0x10b981, 1);
    g.fillRoundedRect(cx - 26, cy - 14, 52, 34, 12);
    g.strokeRoundedRect(cx - 26, cy - 14, 52, 34, 12);
    g.fillStyle(0x065f46, 1);
    g.fillTriangle(cx, cy - 28, cx - 14, cy + 10, cx + 14, cy + 10);
    g.lineStyle(2, 0x6ee7b7, 1);
    g.strokeTriangle(cx, cy - 28, cx - 14, cy + 10, cx + 14, cy + 10);
    g.fillStyle(0x34d399, 1);
    g.fillCircle(cx, cy, 6);
    g.generateTexture('ship_aegis', 64, 64);
    g.destroy();
  }

  // 7. Specter (Crimson Critical Striker)
  {
    const g = scene.make.graphics({ x: 0, y: 0 });
    const cx = 32;
    const cy = 32;
    g.fillStyle(0x1f0715, 1);
    g.lineStyle(2, 0xf43f5e, 1);
    g.beginPath();
    g.moveTo(cx, cy - 29);
    g.lineTo(cx + 12, cy - 4);
    g.lineTo(cx + 26, cy + 18);
    g.lineTo(cx + 10, cy + 12);
    g.lineTo(cx, cy + 22);
    g.lineTo(cx - 10, cy + 12);
    g.lineTo(cx - 26, cy + 18);
    g.lineTo(cx - 12, cy - 4);
    g.closePath();
    g.fillPath();
    g.strokePath();
    g.fillStyle(0xfda4af, 1);
    g.fillTriangle(cx, cy - 20, cx - 6, cy + 6, cx + 6, cy + 6);
    g.fillStyle(0xf43f5e, 1);
    g.fillCircle(cx, cy - 2, 4);
    g.generateTexture('ship_specter', 64, 64);
    g.destroy();
  }

  // 8. Celestial (Legendary Sovereign Starcore Wing)
  {
    const g = scene.make.graphics({ x: 0, y: 0 });
    const cx = 32;
    const cy = 32;
    g.fillStyle(0xe879f9, 0.22);
    g.fillCircle(cx, cy, 28);
    g.fillStyle(0x2e1065, 1);
    g.lineStyle(2.2, 0xfef08a, 1);
    g.beginPath();
    g.moveTo(cx, cy - 30);
    g.lineTo(cx + 11, cy - 8);
    g.lineTo(cx + 28, cy - 4);
    g.lineTo(cx + 22, cy + 20);
    g.lineTo(cx + 9, cy + 14);
    g.lineTo(cx, cy + 25);
    g.lineTo(cx - 9, cy + 14);
    g.lineTo(cx - 22, cy + 20);
    g.lineTo(cx - 28, cy - 4);
    g.lineTo(cx - 11, cy - 8);
    g.closePath();
    g.fillPath();
    g.strokePath();
    g.fillStyle(0xfef08a, 1);
    g.fillTriangle(cx, cy - 22, cx - 7, cy + 8, cx + 7, cy + 8);
    g.fillStyle(0x38bdf8, 1);
    g.fillCircle(cx, cy - 2, 5);
    g.generateTexture('ship_celestial', 64, 64);
    g.destroy();
  }
}

function createDroneTextures(scene: Phaser.Scene): void {
  const specs: Array<{ key: string; color: number; core: number }> = [
    { key: 'drone_assault', color: 0xf43f5e, core: 0xfef08a },
    { key: 'drone_shield', color: 0x38bdf8, core: 0xe0f2fe },
    { key: 'drone_repair', color: 0x22c55e, core: 0xbbf7d0 },
    { key: 'drone_collector', color: 0xf59e0b, core: 0xfef3c7 },
  ];

  specs.forEach(({ key, color, core }) => {
    const g = scene.make.graphics({ x: 0, y: 0 });
    const c = 14;
    g.fillStyle(0x0f172a, 0.95);
    g.lineStyle(2, color, 1);
    g.beginPath();
    g.moveTo(c, c - 11);
    g.lineTo(c + 11, c);
    g.lineTo(c, c + 11);
    g.lineTo(c - 11, c);
    g.closePath();
    g.fillPath();
    g.strokePath();
    g.fillStyle(core, 1);
    g.fillCircle(c, c, 4);
    g.generateTexture(key, 28, 28);
    g.destroy();
  });
}

function createEnemyTextures(scene: Phaser.Scene): void {
  // 1. Scout Drone (fast dart)
  {
    const g = scene.make.graphics({ x: 0, y: 0 });
    const cx = 24;
    const cy = 24;
    g.fillStyle(0x0f172a, 1);
    g.lineStyle(2, 0x38bdf8, 1);
    g.beginPath();
    g.moveTo(cx, cy + 18);
    g.lineTo(cx + 16, cy - 10);
    g.lineTo(cx + 5, cy - 14);
    g.lineTo(cx, cy - 7);
    g.lineTo(cx - 5, cy - 14);
    g.lineTo(cx - 16, cy - 10);
    g.closePath();
    g.fillPath();
    g.strokePath();
    g.fillStyle(0xf43f5e, 1);
    g.fillCircle(cx, cy + 2, 4);
    g.generateTexture('enemy_scout', 48, 48);
    g.destroy();
  }

  // 2. Armored Fighter
  {
    const g = scene.make.graphics({ x: 0, y: 0 });
    const cx = 28;
    const cy = 28;
    g.fillStyle(0x311020, 1);
    g.lineStyle(2, 0xef4444, 1);
    g.beginPath();
    g.moveTo(cx, cy + 22);
    g.lineTo(cx + 12, cy + 4);
    g.lineTo(cx + 22, cy - 8);
    g.lineTo(cx + 16, cy - 18);
    g.lineTo(cx + 6, cy - 10);
    g.lineTo(cx - 6, cy - 10);
    g.lineTo(cx - 16, cy - 18);
    g.lineTo(cx - 22, cy - 8);
    g.lineTo(cx - 12, cy + 4);
    g.closePath();
    g.fillPath();
    g.strokePath();

    g.fillStyle(0x991b1b, 1);
    g.fillRect(cx - 6, cy - 12, 12, 22);
    g.fillStyle(0xfca5a5, 1);
    g.fillCircle(cx, cy + 4, 4);
    g.generateTexture('enemy_fighter', 56, 56);
    g.destroy();
  }

  // 3. Bomber
  {
    const g = scene.make.graphics({ x: 0, y: 0 });
    const cx = 32;
    const cy = 32;
    g.fillStyle(0x27150a, 1);
    g.lineStyle(2, 0xf97316, 1);
    g.beginPath();
    g.moveTo(cx, cy + 22);
    g.lineTo(cx + 26, cy + 4);
    g.lineTo(cx + 22, cy - 16);
    g.lineTo(cx + 9, cy - 20);
    g.lineTo(cx - 9, cy - 20);
    g.lineTo(cx - 22, cy - 16);
    g.lineTo(cx - 26, cy + 4);
    g.closePath();
    g.fillPath();
    g.strokePath();

    g.fillStyle(0xf59e0b, 0.9);
    g.fillCircle(cx - 11, cy, 4);
    g.fillCircle(cx + 11, cy, 4);
    g.fillStyle(0xfef08a, 1);
    g.fillEllipse(cx, cy + 6, 10, 12);
    g.generateTexture('enemy_bomber', 64, 64);
    g.destroy();
  }

  // 4. Heavy Tank
  {
    const g = scene.make.graphics({ x: 0, y: 0 });
    const cx = 36;
    const cy = 36;
    g.fillStyle(0x1e1033, 1);
    g.lineStyle(2.5, 0xa855f7, 1);
    g.fillRoundedRect(cx - 28, cy - 22, 56, 44, 8);
    g.strokeRoundedRect(cx - 28, cy - 22, 56, 44, 8);
    g.fillStyle(0x581c87, 1);
    g.fillRect(cx - 18, cy - 14, 36, 32);
    g.fillStyle(0xe879f9, 1);
    g.fillCircle(cx, cy + 4, 7);
    g.fillStyle(0xc084fc, 1);
    g.fillRect(cx - 22, cy + 16, 6, 10);
    g.fillRect(cx + 16, cy + 16, 6, 10);
    g.generateTexture('enemy_tank', 72, 72);
    g.destroy();
  }

  // 5. Elite Fighter
  {
    const g = scene.make.graphics({ x: 0, y: 0 });
    const cx = 32;
    const cy = 32;
    g.fillStyle(0x2a0818, 1);
    g.lineStyle(2, 0xf43f5e, 1);
    g.beginPath();
    g.moveTo(cx, cy + 26);
    g.lineTo(cx + 26, cy - 4);
    g.lineTo(cx + 14, cy - 24);
    g.lineTo(cx + 6, cy - 12);
    g.lineTo(cx, cy - 22);
    g.lineTo(cx - 6, cy - 12);
    g.lineTo(cx - 14, cy - 24);
    g.lineTo(cx - 26, cy - 4);
    g.closePath();
    g.fillPath();
    g.strokePath();

    g.lineStyle(1.5, 0xfbbf24, 0.9);
    g.strokeTriangle(cx, cy + 16, cx - 10, cy - 8, cx + 10, cy - 8);
    g.fillStyle(0xfbbf24, 1);
    g.fillCircle(cx, cy, 4);
    g.generateTexture('enemy_elite', 64, 64);
    g.destroy();
  }
}

function createBossTextures(scene: Phaser.Scene): void {
  // 1. Iron Guardian
  {
    const g = scene.make.graphics({ x: 0, y: 0 });
    const cx = 96;
    const cy = 68;
    g.fillStyle(0x1f2937, 1);
    g.lineStyle(3, 0xf59e0b, 1);
    g.beginPath();
    g.moveTo(cx - 75, cy - 35);
    g.lineTo(cx + 75, cy - 35);
    g.lineTo(cx + 62, cy + 35);
    g.lineTo(cx + 28, cy + 52);
    g.lineTo(cx + 18, cy + 22);
    g.lineTo(cx - 18, cy + 22);
    g.lineTo(cx - 28, cy + 52);
    g.lineTo(cx - 62, cy + 35);
    g.closePath();
    g.fillPath();
    g.strokePath();

    g.fillStyle(0x78350f, 1);
    g.fillRect(cx - 45, cy - 25, 90, 42);
    g.fillStyle(0xfef08a, 1);
    g.fillCircle(cx, cy, 14);
    g.lineStyle(2, 0xef4444, 1);
    g.strokeCircle(cx, cy, 20);
    g.generateTexture('boss_iron_guardian', 192, 136);
    g.destroy();
  }

  // 2. Venom Queen
  {
    const g = scene.make.graphics({ x: 0, y: 0 });
    const cx = 96;
    const cy = 68;
    g.fillStyle(0x2e1065, 1);
    g.lineStyle(3, 0xa855f7, 1);
    g.beginPath();
    g.moveTo(cx, cy + 52);
    g.lineTo(cx + 78, cy - 10);
    g.lineTo(cx + 55, cy - 48);
    g.lineTo(cx + 20, cy - 22);
    g.lineTo(cx, cy - 42);
    g.lineTo(cx - 20, cy - 22);
    g.lineTo(cx - 55, cy - 48);
    g.lineTo(cx - 78, cy - 10);
    g.closePath();
    g.fillPath();
    g.strokePath();

    g.fillStyle(0x22c55e, 1);
    g.fillCircle(cx, cy + 5, 13);
    g.fillCircle(cx - 38, cy - 5, 7);
    g.fillCircle(cx + 38, cy - 5, 7);
    g.generateTexture('boss_venom_queen', 192, 136);
    g.destroy();
  }

  // 3. Shadow Titan
  {
    const g = scene.make.graphics({ x: 0, y: 0 });
    const cx = 100;
    const cy = 70;
    g.fillStyle(0x091124, 1);
    g.lineStyle(3, 0x38bdf8, 1);
    g.beginPath();
    g.moveTo(cx, cy + 56);
    g.lineTo(cx + 85, cy + 4);
    g.lineTo(cx + 68, cy - 48);
    g.lineTo(cx + 24, cy - 30);
    g.lineTo(cx, cy - 54);
    g.lineTo(cx - 24, cy - 30);
    g.lineTo(cx - 68, cy - 48);
    g.lineTo(cx - 85, cy + 4);
    g.closePath();
    g.fillPath();
    g.strokePath();

    g.fillStyle(0x6366f1, 0.85);
    g.fillTriangle(cx, cy + 30, cx - 24, cy - 18, cx + 24, cy - 18);
    g.fillStyle(0x67e8f9, 1);
    g.fillCircle(cx, cy, 11);
    g.generateTexture('boss_shadow_titan', 200, 140);
    g.destroy();
  }

  // 4. Cyber Leviathan
  {
    const g = scene.make.graphics({ x: 0, y: 0 });
    const cx = 104;
    const cy = 72;
    g.fillStyle(0x042f2e, 1);
    g.lineStyle(3, 0x10b981, 1);
    g.fillRoundedRect(cx - 86, cy - 38, 172, 68, 16);
    g.strokeRoundedRect(cx - 86, cy - 38, 172, 68, 16);

    g.fillStyle(0x064e3b, 1);
    g.fillTriangle(cx - 60, cy + 28, cx - 44, cy + 56, cx - 28, cy + 28);
    g.fillTriangle(cx + 28, cy + 28, cx + 44, cy + 56, cx + 60, cy + 28);
    g.lineStyle(2, 0x34d399, 1);
    g.strokeRect(cx - 50, cy - 24, 100, 40);
    g.fillStyle(0x22d3ee, 1);
    g.fillCircle(cx, cy - 4, 14);
    g.generateTexture('boss_cyber_leviathan', 208, 144);
    g.destroy();
  }

  // 5. Void Emperor
  {
    const g = scene.make.graphics({ x: 0, y: 0 });
    const cx = 120;
    const cy = 84;
    // Outer Dreadnought Wings
    g.fillStyle(0x1a0414, 1);
    g.lineStyle(3, 0xf43f5e, 1);
    g.beginPath();
    g.moveTo(cx, cy + 68);
    g.lineTo(cx + 35, cy + 26);
    g.lineTo(cx + 106, cy + 42);
    g.lineTo(cx + 96, cy - 38);
    g.lineTo(cx + 46, cy - 60);
    g.lineTo(cx + 20, cy - 26);
    g.lineTo(cx, cy - 66);
    g.lineTo(cx - 20, cy - 26);
    g.lineTo(cx - 46, cy - 60);
    g.lineTo(cx - 96, cy - 38);
    g.lineTo(cx - 106, cy + 42);
    g.lineTo(cx - 35, cy + 26);
    g.closePath();
    g.fillPath();
    g.strokePath();

    // Inner Imperial Crown
    g.lineStyle(2, 0xa855f7, 1);
    g.strokeCircle(cx, cy, 34);
    g.fillStyle(0x881337, 1);
    g.fillCircle(cx, cy, 24);
    g.fillStyle(0xfef08a, 1);
    g.fillCircle(cx, cy, 11);

    // Wing emitter cores
    g.fillStyle(0xf43f5e, 1);
    g.fillCircle(cx - 68, cy + 6, 7);
    g.fillCircle(cx + 68, cy + 6, 7);
    g.generateTexture('boss_void_emperor', 240, 168);
    g.destroy();
  }
}

function createProjectileTextures(scene: Phaser.Scene): void {
  // Plasma bolt
  {
    const g = scene.make.graphics({ x: 0, y: 0 });
    g.fillStyle(0x0284c7, 0.45);
    g.fillEllipse(8, 12, 12, 22);
    g.fillStyle(0x38bdf8, 1);
    g.fillEllipse(8, 12, 7, 16);
    g.fillStyle(0xffffff, 1);
    g.fillEllipse(8, 12, 3, 10);
    g.generateTexture('proj_plasma', 16, 24);
    g.destroy();
  }

  // Dual laser
  {
    const g = scene.make.graphics({ x: 0, y: 0 });
    g.fillStyle(0x06b6d4, 0.5);
    g.fillRect(2, 0, 6, 24);
    g.fillStyle(0xa5f3fc, 1);
    g.fillRect(4, 1, 2, 22);
    g.generateTexture('proj_laser', 10, 24);
    g.destroy();
  }

  // Spread orb
  {
    const g = scene.make.graphics({ x: 0, y: 0 });
    g.fillStyle(0x9333ea, 0.55);
    g.fillCircle(8, 8, 7);
    g.fillStyle(0xe879f9, 1);
    g.fillCircle(8, 8, 4);
    g.fillStyle(0xffffff, 1);
    g.fillCircle(8, 8, 2);
    g.generateTexture('proj_spread', 16, 16);
    g.destroy();
  }

  // Homing missile
  {
    const g = scene.make.graphics({ x: 0, y: 0 });
    g.fillStyle(0xf59e0b, 1);
    g.fillTriangle(8, 1, 3, 15, 13, 15);
    g.fillStyle(0xfef08a, 1);
    g.fillRect(6, 14, 4, 6);
    g.generateTexture('proj_missile', 16, 22);
    g.destroy();
  }

  // Enemy plasma bolt
  {
    const g = scene.make.graphics({ x: 0, y: 0 });
    g.fillStyle(0xef4444, 0.45);
    g.fillCircle(8, 8, 7);
    g.fillStyle(0xf87171, 1);
    g.fillCircle(8, 8, 4);
    g.fillStyle(0xffffff, 1);
    g.fillCircle(8, 8, 2);
    g.generateTexture('proj_enemy_bolt', 16, 16);
    g.destroy();
  }

  // Enemy bomb / heavy orb
  {
    const g = scene.make.graphics({ x: 0, y: 0 });
    g.fillStyle(0xa855f7, 0.55);
    g.fillCircle(10, 10, 9);
    g.fillStyle(0xf97316, 1);
    g.fillCircle(10, 10, 6);
    g.fillStyle(0xfef08a, 1);
    g.fillCircle(10, 10, 3);
    g.generateTexture('proj_enemy_bomb', 20, 20);
    g.destroy();
  }
}

function createPowerUpTextures(scene: Phaser.Scene): void {
  const specs: Array<{ key: string; color: number; symbol: 'plus' | 'shield' | 'bolt' | 'sword' | 'bomb' | 'star' }> = [
    { key: 'powerup_health', color: 0x22c55e, symbol: 'plus' },
    { key: 'powerup_shield', color: 0x38bdf8, symbol: 'shield' },
    { key: 'powerup_rapid_fire', color: 0xf59e0b, symbol: 'bolt' },
    { key: 'powerup_double_damage', color: 0xef4444, symbol: 'sword' },
    { key: 'powerup_mega_bomb', color: 0xa855f7, symbol: 'bomb' },
    { key: 'powerup_invulnerability', color: 0xe0f2fe, symbol: 'star' },
  ];

  specs.forEach(({ key, color, symbol }) => {
    const g = scene.make.graphics({ x: 0, y: 0 });
    const c = 18;
    g.fillStyle(color, 0.22);
    g.fillCircle(c, c, 17);
    g.fillStyle(0x0f172a, 0.95);
    g.fillCircle(c, c, 12);
    g.lineStyle(2.5, color, 1);
    g.strokeCircle(c, c, 12);

    g.fillStyle(color, 1);
    if (symbol === 'plus') {
      g.fillRect(c - 6, c - 2, 12, 4);
      g.fillRect(c - 2, c - 6, 4, 12);
    } else if (symbol === 'shield') {
      g.fillTriangle(c, c + 7, c - 6, c - 4, c + 6, c - 4);
    } else if (symbol === 'bolt') {
      g.fillTriangle(c + 2, c - 7, c - 5, c + 1, c + 1, c + 1);
      g.fillTriangle(c - 2, c + 7, c + 5, c - 1, c - 1, c - 1);
    } else if (symbol === 'sword') {
      g.fillTriangle(c, c - 7, c - 4, c + 3, c + 4, c + 3);
      g.fillRect(c - 5, c + 3, 10, 2);
    } else if (symbol === 'bomb') {
      g.fillCircle(c, c + 1, 5);
      g.fillRect(c - 1, c - 7, 2, 4);
    } else {
      g.fillCircle(c, c, 5);
      g.lineStyle(1.5, 0xffffff, 1);
      g.strokeCircle(c, c, 7);
    }

    g.generateTexture(key, 36, 36);
    g.destroy();
  });
}

function createParticleAndEnvTextures(scene: Phaser.Scene): void {
  // Soft glow particle
  {
    const g = scene.make.graphics({ x: 0, y: 0 });
    g.fillStyle(0xffffff, 0.35);
    g.fillCircle(12, 12, 11);
    g.fillStyle(0xffffff, 0.85);
    g.fillCircle(12, 12, 5);
    g.generateTexture('particle_glow', 24, 24);
    g.destroy();
  }

  // Crisp spark particle
  {
    const g = scene.make.graphics({ x: 0, y: 0 });
    g.fillStyle(0xffffff, 1);
    g.fillCircle(4, 4, 3);
    g.generateTexture('particle_spark', 8, 8);
    g.destroy();
  }

  // Asteroid 1
  {
    const g = scene.make.graphics({ x: 0, y: 0 });
    g.fillStyle(0x475569, 1);
    g.lineStyle(2, 0x94a3b8, 0.8);
    g.beginPath();
    g.moveTo(24, 4);
    g.lineTo(44, 14);
    g.lineTo(40, 38);
    g.lineTo(18, 44);
    g.lineTo(4, 28);
    g.lineTo(10, 10);
    g.closePath();
    g.fillPath();
    g.strokePath();
    g.fillStyle(0x334155, 1);
    g.fillCircle(20, 22, 6);
    g.fillCircle(31, 30, 4);
    g.generateTexture('asteroid_1', 48, 48);
    g.destroy();
  }

  // Asteroid 2
  {
    const g = scene.make.graphics({ x: 0, y: 0 });
    g.fillStyle(0x334155, 1);
    g.lineStyle(1.5, 0x64748b, 0.8);
    g.beginPath();
    g.moveTo(16, 2);
    g.lineTo(30, 10);
    g.lineTo(28, 26);
    g.lineTo(12, 30);
    g.lineTo(2, 18);
    g.closePath();
    g.fillPath();
    g.strokePath();
    g.generateTexture('asteroid_2', 32, 32);
    g.destroy();
  }
}
