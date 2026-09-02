import { getBalance } from '../core/Balance.ts';
import { effectiveMaxHp } from '../core/Combat.ts';
import { BodyAnim } from '../juice/BodyAnim.ts';
import type { DamageType } from '../core/BalanceTypes.ts';
import type { Regenerating } from '../core/Regen.ts';
import { Stats } from '../core/Stats.ts';
import { startingWeapons, type Weapon } from './Weapon.ts';
import { startingArmor, type Armor } from './Armor.ts';

export class Player implements Regenerating {
  readonly stats = new Stats();
  /** Вспышка, отдача, распад, появление. Тикается логикой, читается рендером. */
  readonly anim = new BodyAnim();
  weapons: Record<DamageType, Weapon> = startingWeapons();
  /** Три сета брони — множитель к защите, зеркально оружию (BALANCE.md §7.5). */
  armor: Record<DamageType, Armor> = startingArmor();

  x: number;
  y: number;
  hp: number;
  timeSinceDamage = Number.POSITIVE_INFINITY;
  alive = true;
  /** Секунды до респауна. Отсчёт идёт только пока игрок мёртв. */
  respawnIn = 0;
  /** Секунды до следующего залпа всеми тремя оружиями. */
  attackCooldown = 0;
  /** Куда смотрит игрок, радианы. Нужен стрелке на карте и повороту спрайта. */
  facingAngle = -Math.PI / 2;
  /** Пройденный путь в единицах мира — из него считается покачивание при ходьбе. */
  walked = 0;

  readonly startX: number;
  startY: number;
  private readonly worldWidth: number;
  private worldHeight: number;

  constructor(startX: number, startY: number, worldWidth: number, worldHeight: number) {
    this.startX = startX;
    this.startY = startY;
    this.worldWidth = worldWidth;
    this.worldHeight = worldHeight;
    this.x = startX;
    this.y = startY;
    this.hp = this.maxHp;
  }

  /** Потолок HP с учётом брони: сет множит и здоровье (BALANCE.md §7.5). */
  get maxHp(): number {
    return effectiveMaxHp(this.stats, this.armor);
  }

  get hpFraction(): number {
    return this.hp / this.maxHp;
  }

  /**
   * Движение по вектору джойстика. dirX/dirY — направление × сила в [-1, 1]
   * (см. Input.ts): длина вектора ниже 1 даёт аналоговое замедление, а не
   * рывок на полной скорости от любого касания стика. Кнопки атаки нет —
   * это единственный ввод в игре.
   */
  move(dirX: number, dirY: number, dt: number): void {
    const { render } = getBalance();
    const magnitude = Math.hypot(dirX, dirY);
    if (magnitude <= 0) return;

    const step = this.stats.moveSpeed * dt * Math.min(magnitude, 1);
    this.x += (dirX / magnitude) * step;
    this.y += (dirY / magnitude) * step;
    this.facingAngle = Math.atan2(dirY, dirX);
    this.walked += step;

    const half = render.playerSize / 2;
    this.x = clamp(this.x, half, this.worldWidth - half);
    this.y = clamp(this.y, render.hudHeight + half, this.worldHeight - half);
  }

  die(): void {
    this.alive = false;
    this.hp = 0;
    this.anim.die();
    this.respawnIn = getBalance().player.respawnDelay;
  }

  /** Респаун без штрафа: полное HP в точке старта, ничего не потеряно (GDD §4.5). */
  respawn(): void {
    this.alive = true;
    this.x = this.startX;
    this.y = this.startY;
    this.hp = this.maxHp;
    this.timeSinceDamage = Number.POSITIVE_INFINITY;
    this.attackCooldown = 0;
    this.anim.spawn();
  }

  /** Окно браузера меняет высоту, когда Safari прячет адресную строку. */
  setWorldHeight(height: number): void {
    const { render } = getBalance();
    this.worldHeight = height;
    const half = render.playerSize / 2;
    // Та же формула, что и в Game: иначе ресайз возвращал бы точку респауна
    // вплотную к краю острова.
    const screenHeight = height / render.worldScreensY;
    this.startY = height - screenHeight * render.playerStartInsetScreens;
    this.y = Math.min(this.y, height - half);
  }

  /** Дев-панель может уронить maxHp ниже текущего HP. */
  clampHp(): void {
    this.hp = Math.min(this.hp, this.maxHp);
  }
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}
