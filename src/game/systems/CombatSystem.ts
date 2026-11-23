import Phaser from 'phaser';
import { POWERUP_LIST, PowerUpType } from '../config/PowerUpConfig';
import { SoundManager } from '../audio/SoundManager';
import { BossEntity } from '../entities/Boss';
import { EnemyEntity } from '../entities/Enemy';
import { Player } from '../entities/Player';
import { PowerUpEntity } from '../entities/PowerUp';
import { ProjectileManager } from '../entities/ProjectileManager';
import { allocateEnemyAttackId, Targetable } from '../entities/Targetable';
import { DamageSource, PassiveSystem } from '../systems/PassiveSystem';
import { ObjectPool } from '../utils/ObjectPool';
import { GAME_CONSTANTS } from '../config/GameConfig';
import { FxQuality } from '../utils/StorageManager';

interface SparkParticle {
  sprite: Phaser.GameObjects.Sprite;
  active: boolean;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  setActive(v: boolean): this;
  setVisible(v: boolean): this;
}

interface ImpactFlash {
  sprite: Phaser.GameObjects.Sprite;
  active: boolean;
  startScale: number;
  endScale: number;
  life: number;
  maxLife: number;
  setActive(v: boolean): this;
  setVisible(v: boolean): this;
}

interface FloatingDamageText {
  text: Phaser.GameObjects.Text;
  active: boolean;
  vy: number;
  life: number;
  maxLife: number;
  fontSize: number;
  setActive(v: boolean): this;
  setVisible(v: boolean): this;
}

export class CombatSystem {
  private scene: Phaser.Scene;
  private particlePool: ObjectPool<SparkParticle>;
  private flashPool: ObjectPool<ImpactFlash>;
  private textPool: ObjectPool<FloatingDamageText>;
  private powerUpPool: ObjectPool<PowerUpEntity & { setActive(v: boolean): any; setVisible(v: boolean): any }>;
  private fxQuality: FxQuality = 'high';

  hitstopMs = 0;

  constructor(scene: Phaser.Scene, fxQuality: FxQuality = 'high') {
    this.scene = scene;
    this.fxQuality = fxQuality;

    this.particlePool = new ObjectPool<SparkParticle>(
      () => {
        const sprite = scene.add.sprite(-100, -100, 'particle_spark').setDepth(16);
        const obj: SparkParticle = {
          sprite,
          active: false,
          vx: 0,
          vy: 0,
          life: 0,
          maxLife: 0.3,
          setActive(v: boolean) {
            this.active = v;
            sprite.setActive(v);
            return this;
          },
          setVisible(v: boolean) {
            sprite.setVisible(v);
            return this;
          },
        };
        return obj;
      },
      60,
      240
    );

    this.flashPool = new ObjectPool<ImpactFlash>(
      () => {
        const sprite = scene.add.sprite(-100, -100, 'particle_glow').setDepth(16);
        const obj: ImpactFlash = {
          sprite,
          active: false,
          startScale: 1,
          endScale: 2,
          life: 0,
          maxLife: 0.21,
          setActive(v: boolean) {
            this.active = v;
            sprite.setActive(v);
            return this;
          },
          setVisible(v: boolean) {
            sprite.setVisible(v);
            return this;
          },
        };
        return obj;
      },
      16,
      36
    );

    this.textPool = new ObjectPool<FloatingDamageText>(
      () => {
        const text = scene.add
          .text(-100, -100, '', {
            fontFamily: 'Chakra Petch, sans-serif',
            fontSize: '13px',
            fontStyle: 'bold',
            color: '#F8FAFC',
            stroke: '#040711',
            strokeThickness: 3,
          })
          .setOrigin(0.5)
          .setDepth(19);
        const obj: FloatingDamageText = {
          text,
          active: false,
          vy: -48,
          life: 0,
          maxLife: 0.45,
          fontSize: 13,
          setActive(v: boolean) {
            this.active = v;
            text.setActive(v);
            return this;
          },
          setVisible(v: boolean) {
            text.setVisible(v);
            return this;
          },
        };
        return obj;
      },
      16,
      48
    );

    this.powerUpPool = new ObjectPool(
      () => {
        const p = new PowerUpEntity(scene) as PowerUpEntity & {
          setActive(v: boolean): any;
          setVisible(v: boolean): any;
        };
        p.setActive = function (v: boolean) {
          this.active = v;
          this.sprite.setActive(v);
          return this;
        };
        p.setVisible = function (v: boolean) {
          this.sprite.setVisible(v);
          return this;
        };
        return p;
      },
      8,
      24
    );
  }

  setFxQuality(q: FxQuality): void {
    this.fxQuality = q;
  }

  spawnDamageNumber(x: number, y: number, amount: number, isCrit: boolean): void {
    if (this.fxQuality === 'low' && !isCrit) return;
    const item = this.textPool.acquire();
    if (!item) return;
    const targetSize = isCrit ? 16 : 12;
    item.setActive(true).setVisible(true);
    item.text.setPosition(x + (Math.random() - 0.5) * 16, y - 10);
    item.text.setText(isCrit ? `${amount}!` : `${amount}`);
    if (item.fontSize !== targetSize) {
      item.fontSize = targetSize;
      item.text.setFontSize(targetSize);
    }
    item.text.setColor(isCrit ? '#FACC15' : '#E2E8F0');
    item.text.setAlpha(1);
    item.vy = isCrit ? -64 : -42;
    item.maxLife = isCrit ? 0.56 : 0.36;
    item.life = item.maxLife;
  }

  spawnFloatingLabel(x: number, y: number, label: string, colorHex: string): void {
    const item = this.textPool.acquire();
    if (!item) return;
    item.setActive(true).setVisible(true);
    item.text.setPosition(x, y - 24);
    item.text.setText(label);
    if (item.fontSize !== 14) {
      item.fontSize = 14;
      item.text.setFontSize(14);
    }
    item.text.setColor(colorHex);
    item.text.setAlpha(1);
    item.vy = -52;
    item.maxLife = 0.78;
    item.life = item.maxLife;
  }

  private spawnPowerUpPickupEffect(
    x: number,
    y: number,
    type: PowerUpType,
    amountRestored: number,
    isFull: boolean
  ): void {
    const qualityMult = this.fxQuality === 'low' ? 0.45 : this.fxQuality === 'medium' ? 0.75 : 1;

    let ringColor = 0x38bdf8;
    let particleColor = 0x38bdf8;
    let label = '';
    let labelColor = '#38BDF8';
    let driftUp = false;

    switch (type) {
      case 'health':
        ringColor = 0x22c55e;
        particleColor = 0x4ade80;
        label = amountRestored > 0 ? `+${amountRestored} HP` : 'FULL HP';
        labelColor = '#4ADE80';
        driftUp = true;
        break;
      case 'shield':
        ringColor = 0x38bdf8;
        particleColor = 0x67e8f9;
        label = amountRestored > 0 ? `+${amountRestored} SHD` : isFull ? 'MAX SHIELD' : 'SHIELD';
        labelColor = '#67E8F9';
        break;
      case 'rapid_fire':
        ringColor = 0xf59e0b;
        particleColor = 0xfef08a;
        label = 'RAPID FIRE';
        labelColor = '#FBBF24';
        break;
      case 'double_damage':
        ringColor = 0xef4444;
        particleColor = 0xf97316;
        label = '2X DAMAGE';
        labelColor = '#F87171';
        break;
      case 'invulnerability':
        ringColor = 0xa855f7;
        particleColor = 0x67e8f9;
        label = 'INVULNERABLE';
        labelColor = '#C4B5FD';
        break;
      case 'mega_bomb':
        ringColor = 0xa855f7;
        particleColor = 0xe879f9;
        label = 'MEGA BOMB';
        labelColor = '#E879F9';
        break;
    }

    // Subtle themed energy ring pulse around the ship
    if (this.fxQuality !== 'low') {
      const pulseRing = this.scene.add.circle(x, y, 16, ringColor, 0.14).setDepth(16);
      pulseRing.setStrokeStyle(2.5, ringColor, 0.9);
      this.scene.tweens.add({
        targets: pulseRing,
        scaleX: type === 'shield' || type === 'invulnerability' ? 3.1 : 2.6,
        scaleY: type === 'shield' || type === 'invulnerability' ? 3.1 : 2.6,
        alpha: 0,
        duration: 320,
        ease: 'Cubic.easeOut',
        onComplete: () => pulseRing.destroy(),
      });
    }

    // Pooled themed particles
    const count = Math.max(3, Math.round(10 * qualityMult));
    for (let i = 0; i < count; i++) {
      const p = this.particlePool.acquire();
      if (!p) break;
      const ang = driftUp
        ? -Math.PI / 2 + (Math.random() - 0.5) * 1.4
        : (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.35;
      const spd = driftUp ? 75 + Math.random() * 85 : 105 + Math.random() * 90;
      p.setActive(true).setVisible(true);
      p.sprite.setPosition(
        x + (driftUp ? (Math.random() - 0.5) * 26 : 0),
        y + (driftUp ? (Math.random() - 0.5) * 14 : 0)
      );
      p.sprite.setTint(particleColor);
      p.sprite.setScale(0.75 + Math.random() * 0.55);
      p.sprite.setAlpha(1);
      p.vx = Math.cos(ang) * spd;
      p.vy = Math.sin(ang) * spd;
      p.maxLife = driftUp ? 0.42 + Math.random() * 0.22 : 0.28 + Math.random() * 0.18;
      p.life = p.maxLife;
    }

    // Accurate floating label using pooled text
    this.spawnFloatingLabel(x, y, label, labelColor);
  }

  spawnExplosion(x: number, y: number, color: number, count = 14, speed = 220, scale = 1): void {
    const qualityMult = this.fxQuality === 'low' ? 0.4 : this.fxQuality === 'medium' ? 0.7 : 1;
    const finalCount = Math.max(2, Math.round(count * qualityMult));

    const flash = this.flashPool.acquire();
    if (flash) {
      flash.setActive(true).setVisible(true);
      flash.sprite.setPosition(x, y).setTint(color).setScale(scale * 1.4).setAlpha(1);
      flash.startScale = scale * 1.4;
      flash.endScale = scale * 2.8;
      flash.maxLife = 0.21;
      flash.life = 0.21;
    }

    for (let i = 0; i < finalCount; i++) {
      const p = this.particlePool.acquire();
      if (!p) break;
      const ang = Math.random() * Math.PI * 2;
      const spd = speed * (0.35 + Math.random() * 0.85);
      p.setActive(true).setVisible(true);
      p.sprite.setPosition(x, y);
      p.sprite.setTint(color);
      p.sprite.setScale(0.7 + Math.random() * 0.9 * scale);
      p.sprite.setAlpha(1);
      p.vx = Math.cos(ang) * spd;
      p.vy = Math.sin(ang) * spd;
      p.maxLife = 0.24 + Math.random() * 0.26;
      p.life = p.maxLife;
    }
  }

  maybeDropPowerUp(x: number, y: number, guaranteed = false): void {
    if (!guaranteed && Math.random() > 0.16) return;
    const totalWeight = POWERUP_LIST.reduce((acc, p) => acc + p.weight, 0);
    let roll = Math.random() * totalWeight;
    let chosen: PowerUpType = 'health';
    for (let i = 0; i < POWERUP_LIST.length; i++) {
      roll -= POWERUP_LIST[i].weight;
      if (roll <= 0) {
        chosen = POWERUP_LIST[i].id;
        break;
      }
    }
    const entity = this.powerUpPool.acquire();
    if (entity) {
      entity.spawn(x, y, chosen);
    }
  }

  triggerMegaBomb(
    player: Player,
    projectiles: ProjectileManager,
    targets: Targetable[],
    onKillTarget: (t: Targetable) => void
  ): void {
    projectiles.clearEnemyBullets();
    SoundManager.playExplosion('boss');
    this.hitstopMs = GAME_CONSTANTS.HITSTOP_HEAVY_MS;

    const wave = this.scene.add.circle(player.x, player.y, 20, 0xa855f7, 0.22).setDepth(17);
    wave.setStrokeStyle(5, 0xe879f9, 1);
    this.scene.tweens.add({
      targets: wave,
      scaleX: 28,
      scaleY: 28,
      alpha: 0,
      duration: 520,
      onComplete: () => wave.destroy(),
    });

    targets.forEach((t) => {
      if (!t.active) return;
      const killed = t.takeDamage(220);
      this.spawnExplosion(t.x, t.y, 0xa855f7, 10, 180, 0.9);
      this.spawnDamageNumber(t.x, t.y, 220, true);
      if (killed) onKillTarget(t);
    });
  }

  updateParticlesAndPowerUps(
    dt: number,
    player: Player,
    projectiles: ProjectileManager,
    targets: Targetable[],
    onPowerUpCollected: (
      type: PowerUpType,
      info: { amountRestored: number; durationSec: number; isFull: boolean }
    ) => void,
    onKillTarget: (t: Targetable) => void
  ): void {
    // Update particles
    this.particlePool.forEachActive((p) => {
      p.life -= dt;
      if (p.life <= 0) {
        p.setActive(false).setVisible(false);
        return;
      }
      p.sprite.x += p.vx * dt;
      p.sprite.y += p.vy * dt;
      p.vx *= 0.96;
      p.vy *= 0.96;
      p.sprite.setAlpha(p.life / p.maxLife);
    });

    // Update pooled impact flashes
    this.flashPool.forEachActive((f) => {
      f.life -= dt;
      if (f.life <= 0) {
        f.setActive(false).setVisible(false);
        return;
      }
      const progress = 1 - f.life / f.maxLife;
      f.sprite.setScale(Phaser.Math.Linear(f.startScale, f.endScale, progress));
      f.sprite.setAlpha(Math.max(0, 1 - progress));
    });

    // Update floating damage & pickup text
    this.textPool.forEachActive((item) => {
      item.life -= dt;
      if (item.life <= 0) {
        item.setActive(false).setVisible(false);
        return;
      }
      item.text.y += item.vy * dt;
      item.text.setAlpha(Math.min(1, (item.life / item.maxLife) * 1.3));
    });

    // Update power-ups & pickup collisions
    const w = this.scene.scale.width;
    const h = this.scene.scale.height;
    const magnetBonus = player.stats.pickupRadiusBonus;
    this.powerUpPool.forEachActive((pu) => {
      pu.update(dt, player.x, player.y, h, magnetBonus, w);
      if (!pu.active) return;
      const dist = Math.hypot(pu.sprite.x - player.x, pu.sprite.y - player.y);
      if (dist < player.radius + 22) {
        const type = pu.type;
        pu.deactivate();
        SoundManager.playPowerUp(type);
        let result = { amountRestored: 0, durationSec: 0, isFull: false };
        if (type === 'mega_bomb') {
          this.triggerMegaBomb(player, projectiles, targets, onKillTarget);
        } else {
          result = player.applyPowerUp(type);
        }
        this.spawnPowerUpPickupEffect(
          player.x,
          player.y,
          type,
          result.amountRestored,
          result.isFull
        );
        onPowerUpCollected(type, result);
      }
    });
  }

  spawnAoeShockwave(
    x: number,
    y: number,
    radiusPx: number,
    color: number,
    isHeavy = false
  ): void {
    this.spawnExplosion(
      x,
      y,
      color,
      isHeavy ? 18 : 11,
      isHeavy ? 250 : 185,
      isHeavy ? 1.35 : 0.95
    );
    if (this.fxQuality === 'low') return;
    const baseR = 14;
    const targetScale = Math.max(1.5, radiusPx / baseR);
    const ring = this.scene.add.circle(x, y, baseR, color, isHeavy ? 0.2 : 0.13).setDepth(16);
    ring.setStrokeStyle(isHeavy ? 3.5 : 2.2, color, 0.92);
    this.scene.tweens.add({
      targets: ring,
      scaleX: targetScale,
      scaleY: targetScale,
      alpha: 0,
      duration: isHeavy ? 320 : 230,
      ease: 'Cubic.easeOut',
      onComplete: () => ring.destroy(),
    });
  }

  spawnStunRing(x: number, y: number): void {
    if (this.fxQuality === 'low') return;
    const ring = this.scene.add.circle(x, y, 12, 0x22d3ee, 0.16).setDepth(16);
    ring.setStrokeStyle(2.4, 0xa5f3fc, 0.95);
    this.scene.tweens.add({
      targets: ring,
      scaleX: 2.3,
      scaleY: 2.3,
      alpha: 0,
      duration: 210,
      ease: 'Cubic.easeOut',
      onComplete: () => ring.destroy(),
    });
  }

  private applyBulletAreaEffects(
    hitX: number,
    hitY: number,
    b: {
      damage: number;
      isCrit: boolean;
      splashRadius: number;
      splashDamageRatio: number;
      splashColor: number;
      burstShardCount: number;
      burstShardDamage: number;
      isHeavyMissile: boolean;
      source: DamageSource;
      firingActionId: number;
      cloneActionId: number;
    },
    directTarget: Targetable,
    projectiles: ProjectileManager,
    enemies: EnemyEntity[],
    boss: BossEntity | null,
    onEnemyKilled: (enemy: EnemyEntity) => void,
    onBossHit: (dmg: number, isCrit: boolean) => void,
    passiveSystem?: PassiveSystem | null
  ): void {
    if (b.splashRadius > 0 && b.splashDamageRatio > 0) {
      this.spawnAoeShockwave(hitX, hitY, b.splashRadius, b.splashColor, b.isHeavyMissile);
      const splashDmg = Math.max(1, Math.round(b.damage * b.splashDamageRatio));

      for (let j = 0; j < enemies.length; j++) {
        const other = enemies[j];
        if (!other.active || other === directTarget) continue;
        const d = Math.hypot(other.x - hitX, other.y - hitY);
        if (d <= b.splashRadius + other.radius) {
          this.spawnDamageNumber(other.x, other.y, splashDmg, false);
          const killed = other.takeDamage(splashDmg);
          if (killed) {
            onEnemyKilled(other);
            if (passiveSystem && (b.source === 'player_weapon' || b.source === 'special')) {
              passiveSystem.onPlayerWeaponHitPostDamage(other, splashDmg, true, {
                source: b.source,
                firingActionId: b.firingActionId,
                countsForFiringAction: false,
                isCrit: false,
              });
            }
          }
        }
      }

      if (boss && boss.active && !boss.entering && !boss.invulnerable && boss !== directTarget) {
        const dBoss = Math.hypot(boss.x - hitX, boss.y - hitY);
        if (dBoss <= b.splashRadius + boss.radius * 0.75) {
          const bossKilled = boss.takeDamage(splashDmg);
          this.spawnDamageNumber(boss.x, boss.y, splashDmg, false);
          onBossHit(splashDmg, false);
          if (bossKilled && passiveSystem) {
            passiveSystem.onBossKilledBySource(boss, b.source, false);
          }
        }
      }
    }

    if (b.burstShardCount > 0 && b.burstShardDamage > 0) {
      projectiles.spawnPlasmaBurstShards(
        hitX,
        hitY,
        b.burstShardCount,
        b.burstShardDamage,
        b.isCrit,
        directTarget,
        b.source,
        b.firingActionId,
        b.cloneActionId
      );
    }
  }

  resolveCollisions(
    player: Player,
    projectiles: ProjectileManager,
    enemies: EnemyEntity[],
    boss: BossEntity | null,
    onEnemyKilled: (enemy: EnemyEntity) => void,
    onBossHit: (dmg: number, isCrit: boolean) => void,
    onPlayerDamaged: (hpReduced: boolean) => void,
    onCritLanded?: () => void,
    passiveSystem?: PassiveSystem | null
  ): void {
    // 1. Player Bullets vs Enemies & Boss
    projectiles.forEachPlayerBullet((b) => {
      if (!b.active) return;

      // Check Boss
      if (boss && boss.active && !boss.entering && b.ignoreTarget !== boss) {
        const dBoss = Math.hypot(b.sprite.x - boss.x, b.sprite.y - boss.y);
        if (dBoss < boss.radius + b.radius) {
          const hitX = b.sprite.x;
          const hitY = b.sprite.y;
          const impScale = (b.isCrit ? 0.85 : 0.58) * (b.impactScale || 1);
          const impColor = b.isCrit ? 0xfacc15 : b.impactColor || boss.def.primaryColor;
          this.spawnExplosion(
            hitX,
            hitY,
            impColor,
            b.isCrit || (b.impactScale || 1) > 1.2 ? 8 : 5,
            125,
            impScale
          );
          b.setActive(false).setVisible(false);
          if (!boss.invulnerable) {
            let finalDmg = b.damage;
            const hitMeta = {
              source: b.source,
              firingActionId: b.firingActionId,
              countsForFiringAction: b.countsForFiringAction,
              isCrit: b.isCrit,
            };
            if (passiveSystem && b.source === 'player_weapon') {
              finalDmg = passiveSystem.resolvePlayerWeaponHitDamage(boss, b.damage, hitMeta);
            } else if (passiveSystem && b.source === 'clone') {
              finalDmg = passiveSystem.resolveCloneWeaponHitDamage(boss, b.damage, {
                cloneActionId: b.cloneActionId,
                countsForFiringAction: b.countsForFiringAction,
              });
            }

            const bossKilled = boss.takeDamage(finalDmg);
            this.spawnDamageNumber(hitX, hitY, finalDmg, b.isCrit);
            if (b.isCrit) {
              SoundManager.playCritHit();
              onCritLanded?.();
            } else {
              SoundManager.playBossDamage();
            }
            onBossHit(finalDmg, b.isCrit);

            if (passiveSystem) {
              if (b.source === 'player_weapon') {
                passiveSystem.onPlayerWeaponHitPostDamage(boss, finalDmg, bossKilled, hitMeta);
              } else if (b.source === 'clone') {
                passiveSystem.onCloneWeaponHitPostDamage(boss, {
                  cloneActionId: b.cloneActionId,
                  countsForFiringAction: b.countsForFiringAction,
                });
              } else if (bossKilled && b.source === 'special') {
                passiveSystem.onBossKilledBySource(boss, 'special', false);
              }
            }
          }
          this.applyBulletAreaEffects(
            hitX,
            hitY,
            b,
            boss,
            projectiles,
            enemies,
            boss,
            onEnemyKilled,
            onBossHit,
            passiveSystem
          );
          return;
        }
      }

      // Check Enemies
      for (let i = 0; i < enemies.length; i++) {
        const e = enemies[i];
        if (!e.active || b.ignoreTarget === e) continue;
        const dist = Math.hypot(b.sprite.x - e.x, b.sprite.y - e.y);
        if (dist < e.radius + b.radius) {
          const hitX = b.sprite.x;
          const hitY = b.sprite.y;
          const impScale = (b.isCrit ? 0.82 : 0.56) * (b.impactScale || 1);
          const impColor = b.isCrit ? 0xfacc15 : b.impactColor || e.def.accentColor;
          this.spawnExplosion(
            hitX,
            hitY,
            impColor,
            b.isCrit || (b.impactScale || 1) > 1.2 ? 8 : 5,
            125,
            impScale
          );
          if (!b.piercing) {
            b.setActive(false).setVisible(false);
          }

          let finalDmg = b.damage;
          const hitMeta = {
            source: b.source,
            firingActionId: b.firingActionId,
            countsForFiringAction: b.countsForFiringAction,
            isCrit: b.isCrit,
          };
          if (passiveSystem && b.source === 'player_weapon') {
            finalDmg = passiveSystem.resolvePlayerWeaponHitDamage(e, b.damage, hitMeta);
          } else if (passiveSystem && b.source === 'clone') {
            finalDmg = passiveSystem.resolveCloneWeaponHitDamage(e, b.damage, {
              cloneActionId: b.cloneActionId,
              countsForFiringAction: b.countsForFiringAction,
            });
          }

          this.spawnDamageNumber(e.x, e.y, finalDmg, b.isCrit);
          const killed = e.takeDamage(finalDmg);
          if (b.isCrit) {
            SoundManager.playCritHit();
            onCritLanded?.();
          } else if (!killed) {
            SoundManager.playHit();
          }
          if (killed) {
            onEnemyKilled(e);
          }
          if (passiveSystem) {
            if (b.source === 'player_weapon' || b.source === 'special') {
              passiveSystem.onPlayerWeaponHitPostDamage(e, finalDmg, killed, hitMeta);
            } else if (b.source === 'clone') {
              passiveSystem.onCloneWeaponHitPostDamage(e, {
                cloneActionId: b.cloneActionId,
                countsForFiringAction: b.countsForFiringAction,
              });
            }
          }
          this.applyBulletAreaEffects(
            hitX,
            hitY,
            b,
            e,
            projectiles,
            enemies,
            boss,
            onEnemyKilled,
            onBossHit,
            passiveSystem
          );
          if (!b.piercing) break;
        }
      }
    });

    // 2. Enemy Bullets vs Player
    projectiles.forEachEnemyBullet((b) => {
      if (!b.active) return;
      const dist = Math.hypot(b.sprite.x - player.x, b.sprite.y - player.y);
      if (dist < player.radius + b.radius - 2) {
        b.setActive(false).setVisible(false);
        const prevHp = player.hp;
        if (player.takeDamage(b.damage, b.attackId)) {
          this.spawnExplosion(player.x, player.y, 0xef4444, 10, 170, 0.8);
          onPlayerDamaged(player.hp < prevHp);
        }
      }
    });

    // 3. Enemy Ship Body vs Player
    for (let i = 0; i < enemies.length; i++) {
      const e = enemies[i];
      if (!e.active) continue;
      const dist = Math.hypot(e.x - player.x, e.y - player.y);
      if (dist < player.radius + e.radius - 4) {
        if (player.isSuperInvulnerable()) {
          const killed = e.takeDamage(999);
          if (killed) onEnemyKilled(e);
        } else {
          const prevHp = player.hp;
          if (player.takeDamage(e.damage + 6, allocateEnemyAttackId())) {
            onPlayerDamaged(player.hp < prevHp);
          }
          const killed = e.takeDamage(45);
          if (killed) onEnemyKilled(e);
        }
      }
    }

    // 4. Boss Body Collision vs Player
    if (boss && boss.active && !boss.entering) {
      const dist = Math.hypot(boss.x - player.x, boss.y - player.y);
      if (dist < player.radius + boss.radius - 8) {
        const prevHp = player.hp;
        if (player.takeDamage(25, allocateEnemyAttackId())) {
          onPlayerDamaged(player.hp < prevHp);
        }
      }
    }
  }

  clearAll(): void {
    this.particlePool.releaseAll();
    this.flashPool.releaseAll();
    this.textPool.releaseAll();
    this.powerUpPool.releaseAll();
  }

  destroy(): void {
    this.clearAll();
  }
}
