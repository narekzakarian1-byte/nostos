import { getBalance } from '../core/Balance.ts';
import type { DamageType, EnemyArchetype, EnemyTier } from '../core/BalanceTypes.ts';
import type { ByType } from '../core/Combat.ts';
import type { Regenerating } from '../core/Regen.ts';
import { BodyAnim } from '../juice/BodyAnim.ts';
import { advance, patrolPoint, type PatrolPath } from './Patrol.ts';

export type FarmTier = Exclude<EnemyTier, 'boss'>;

/**
 * Узел карты. Враг ходит по своему замкнутому маршруту (Patrol.ts) и никогда
 * не преследует игрока: маршрут повторяется, поэтому подход к узлу можно
 * рассчитать заранее.
 */
export class Enemy implements Regenerating {
  hp: number;
  timeSinceDamage = Number.POSITIVE_INFINITY;
  alive = true;
  /** Секунды до воскрешения. Отсчёт идёт только пока враг мёртв. */
  respawnIn = 0;
  /** Сколько всего было отмерено на этот респаун — из этого рисуется дуга. */
  respawnTotal = 0;
  /** Секунды до следующего удара по игроку. */
  attackCooldown = 0;
  /** Маршрут. null — враг стоит на месте (создан без раскладки маршрутов). */
  patrol: PatrolPath | null = null;
  /** Положение на маршруте в [0, 1). Переживает смерть: узел помнит свой круг. */
  progress = 0;
  /** Куда смотрит спрайт: +1 вправо, -1 влево. */
  facing = 1;
  /** Вспышка, отдача, распад, появление. Тикается логикой, читается рендером. */
  readonly anim = new BodyAnim();

  x: number;
  y: number;
  readonly maxHp: number;
  readonly dps: number;
  readonly def: ByType;
  /**
   * Тип, к которому враг уязвим: у него самая низкая защита. Он же тип его
   * собственного удара (GDD §4.2). 'any' — только финальный босс Итаки.
   */
  readonly weakness: DamageType | 'any';
  readonly tier: EnemyTier;
  /** От архетипа зависит, какие статы падают с убийства (BALANCE.md §8). */
  readonly archetype: EnemyArchetype;
  /** Копии какого оружия роняет. Даёт адрес гринда: «нужна палица — иду сюда». */
  readonly copyType: DamageType;

  constructor(
    x: number, y: number, maxHp: number, dps: number, def: ByType,
    weakness: DamageType | 'any', tier: EnemyTier, archetype: EnemyArchetype,
    copyType: DamageType,
  ) {
    this.x = x;
    this.y = y;
    this.maxHp = maxHp;
    this.dps = dps;
    this.def = def;
    this.weakness = weakness;
    this.tier = tier;
    this.archetype = archetype;
    this.copyType = copyType;
    this.hp = maxHp;
  }

  get hpFraction(): number {
    return this.hp / this.maxHp;
  }

  /**
   * Островной босс живёт по другим правилам: регенерирует В БОЮ (GDD §6.2),
   * стоит на арене и не даёт копий. Проверка нужна и логике, и рендеру,
   * поэтому она здесь, а не продублирована в обоих.
   */
  get isBoss(): boolean {
    return this.tier === 'boss';
  }

  get size(): number {
    return getBalance().render.enemySizeByTier[this.tier];
  }

  /** Шаг по маршруту. Вызывается только когда враг жив и не сцеплен с игроком. */
  tickPatrol(dt: number): void {
    if (!this.patrol) return;
    this.progress = advance(this.patrol, this.progress, dt);
    const point = patrolPoint(this.patrol, this.progress);
    const dx = point.x - this.x;
    // Порог в ноль: на медленном маршруте dx за тик крошечный, но знак у него
    // честный, а сравнение с эпсилоном заморозило бы разворот.
    if (dx !== 0) this.facing = dx > 0 ? 1 : -1;
    this.x = point.x;
    this.y = point.y;
  }

  kill(): void {
    this.alive = false;
    this.hp = 0;
  }

  revive(): void {
    this.alive = true;
    this.anim.spawn();
    this.hp = this.maxHp;
    this.timeSinceDamage = Number.POSITIVE_INFINITY;
    this.respawnIn = 0;
    this.attackCooldown = 0;
  }
}
