import { getBalance } from '../core/Balance.ts';
import { effectiveMaxHp } from '../core/Combat.ts';
import { BodyAnim } from '../juice/BodyAnim.ts';
import type { DamageType } from '../core/BalanceTypes.ts';
import type { Regenerating } from '../core/Regen.ts';
import { Stats } from '../core/Stats.ts';
import { startingWeapons, type Weapon } from './Weapon.ts';
import { startingArmor, type Armor } from './Armor.ts';
import { slide, type Blocker, type Foot } from '../world/Blockers.ts';

/** Прямоугольник суши. Считает его world/Scenery.ts — там же, где стена. */
export interface LandRect {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
}

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
  readonly startY: number;
  /** Суша острова: за стену игрок не выходит. */
  private readonly land: LandRect;
  /** Следы пропов на земле. Пустой список — препятствий нет. */
  private readonly blockers: readonly Blocker[];

  constructor(
    startX: number,
    startY: number,
    land: LandRect,
    blockers: readonly Blocker[] = [],
  ) {
    this.startX = startX;
    this.startY = startY;
    this.land = land;
    this.blockers = blockers;
    this.x = startX;
    this.y = startY;
    this.hp = this.maxHp;
  }

  /** След ног на земле. Заметно меньше фигуры: упираться игрок должен подошвой. */
  private get foot(): Foot {
    const { footRx, footRy } = getBalance().player;
    return { rx: footRx, ry: footRy };
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
    // Препятствия считаются по точке касания земли: игрок обходит подошву
    // хижины, а не её крышу.
    const half = render.playerSize / 2;
    const next = slide(
      this.x, this.y + half,
      this.x + (dirX / magnitude) * step,
      this.y + half + (dirY / magnitude) * step,
      this.foot,
      this.blockers,
    );
    // Путь считается по фактическому смещению, а не по шагу: упёршись в
    // частокол, игрок стоит на месте — и ноги на месте стоять обязаны тоже.
    this.walked += Math.hypot(next.x - this.x, next.y - half - this.y);
    this.x = next.x;
    this.y = next.y - half;
    this.facingAngle = Math.atan2(dirY, dirX);

    // Ограничение идёт по точке КАСАНИЯ земли, а не по коробке фигуры: стоя
    // вплотную к стене, игрок закрывает её собой — так и должно быть. Раньше
    // клампа по суше не было вовсе, и за стеной оставалась полоса, по которой
    // можно было уйти на чёрное поле за островом.
    this.x = clamp(this.x, this.land.x, this.land.x + this.land.width);
    this.y = clamp(this.y, this.land.y - half, this.land.y + this.land.height - half);
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

  /** Дев-панель может уронить maxHp ниже текущего HP. */
  clampHp(): void {
    this.hp = Math.min(this.hp, this.maxHp);
  }
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}
