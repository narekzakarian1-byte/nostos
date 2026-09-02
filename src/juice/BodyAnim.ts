import { getBalance } from '../core/Balance.ts';
import { clamp01, easeInQuad, easeOutBack, easeOutCubic } from './Ease.ts';

/**
 * Анимационное состояние одной фигуры: вспышка от попадания, отдача, распад
 * при смерти, появление при воскрешении.
 *
 * Живёт на сущности и тикается логикой на фиксированном шаге — значит фаза
 * анимации детерминирована по сиду, а hitstop замораживает её вместе с миром.
 * О канвасе не знает: наружу отдаёт только числа, рисует ui/Figures.ts.
 *
 * Замаха здесь нет намеренно — он считается из attackCooldown функцией
 * swingPhase ниже, без собственного состояния. Хранить его отдельно значило бы
 * завести вторые часы удара, которые рано или поздно разойдутся с уроном.
 */
export class BodyAnim {
  private flashLeft = 0;
  private recoilLeft = 0;
  private recoilX = 0;
  private recoilY = 0;
  private deathLeft = 0;
  private spawnLeft = 0;

  /** Попадание: вспышка, сплющивание и толчок в направлении удара. */
  hit(dirX: number, dirY: number, crit: boolean): void {
    const { anim } = getBalance();
    const length = Math.hypot(dirX, dirY) || 1;
    const push = anim.recoilUnits * (crit ? anim.recoilCritScale : 1);
    this.flashLeft = anim.hitFlashSec;
    this.recoilLeft = anim.recoilSec;
    this.recoilX = (dirX / length) * push;
    this.recoilY = (dirY / length) * push;
  }

  /** Смерть. Вызывается только при настоящей гибели: восстановление таймеров
   *  из сохранения поднимает мёртвых молча, без анимации. */
  die(): void {
    this.deathLeft = getBalance().anim.deathSec;
  }

  spawn(): void {
    this.deathLeft = 0;
    this.flashLeft = 0;
    this.recoilLeft = 0;
    this.spawnLeft = getBalance().anim.spawnSec;
  }

  tick(dt: number): void {
    if (this.flashLeft > 0) this.flashLeft = Math.max(0, this.flashLeft - dt);
    if (this.recoilLeft > 0) this.recoilLeft = Math.max(0, this.recoilLeft - dt);
    if (this.deathLeft > 0) this.deathLeft = Math.max(0, this.deathLeft - dt);
    if (this.spawnLeft > 0) this.spawnLeft = Math.max(0, this.spawnLeft - dt);
  }

  /** Труп ещё распадается — рендер обязан его рисовать, хотя alive уже false. */
  get dying(): boolean {
    return this.deathLeft > 0;
  }

  /** Доля свежести попадания в [0, 1]: 1 — прямо сейчас, 0 — вспышка догорела. */
  get flash(): number {
    const { hitFlashSec } = getBalance().anim;
    return hitFlashSec > 0 ? this.flashLeft / hitFlashSec : 0;
  }

  get offsetX(): number {
    return this.recoilX * this.recoilFactor;
  }

  get offsetY(): number {
    return this.recoilY * this.recoilFactor + this.deathRise;
  }

  /** Сплющивание по горизонтали от удара и вытягивание при распаде. */
  get scaleX(): number {
    const { squashAmount } = getBalance().anim;
    return (1 + squashAmount * this.flash) * this.deathScale * this.spawnScale;
  }

  get scaleY(): number {
    const { anim } = getBalance();
    const dying = 1 - this.deathProgress * anim.deathStretch;
    return (1 - anim.squashAmount * this.flash) * this.deathScale * dying * this.spawnScale;
  }

  /** Доворот при распаде: труп заваливается, а не исчезает по щелчку. */
  get rotation(): number {
    const { deathSpinDeg } = getBalance().anim;
    return (this.deathProgress * deathSpinDeg * Math.PI) / 180;
  }

  get alpha(): number {
    const spawn = this.spawnProgress;
    const appearing = spawn < 1 ? clamp01(spawn * 2) : 1;
    return (1 - this.deathProgress) * appearing;
  }

  /** Отдача гаснет квадратично: резкий толчок и быстрый возврат. */
  private get recoilFactor(): number {
    const { recoilSec } = getBalance().anim;
    return recoilSec > 0 ? easeInQuad(this.recoilLeft / recoilSec) : 0;
  }

  private get deathProgress(): number {
    const { deathSec } = getBalance().anim;
    if (deathSec <= 0 || this.deathLeft <= 0) return 0;
    return 1 - this.deathLeft / deathSec;
  }

  private get deathScale(): number {
    return 1 - this.deathProgress;
  }

  private get deathRise(): number {
    const { deathRiseUnits } = getBalance().anim;
    return -deathRiseUnits * easeOutCubic(this.deathProgress);
  }

  private get spawnProgress(): number {
    const { spawnSec } = getBalance().anim;
    if (spawnSec <= 0 || this.spawnLeft <= 0) return 1;
    return 1 - this.spawnLeft / spawnSec;
  }

  private get spawnScale(): number {
    const spawn = this.spawnProgress;
    if (spawn >= 1) return 1;
    return easeOutBack(spawn, getBalance().anim.spawnOvershoot);
  }
}

/** Замах и проводка как доли в [0, 1]. Считаются из счётчика перезарядки. */
export interface SwingPhase {
  /** 0 → 1 по мере приближения контакта. */
  readonly windup: number;
  /** 0 в момент контакта → 1 в конце проводки. */
  readonly strike: number;
}

/**
 * Фаза удара из attackCooldown. Никакого состояния: анимация физически не может
 * разойтись с уроном, потому что читает те же часы, по которым урон и наносится.
 * Окна не пересекаются — период удара длиннее суммы замаха и проводки.
 */
export function swingPhase(cooldown: number, windupSec: number): SwingPhase {
  const { combat, anim } = getBalance();
  const period = 1 / combat.baseAttackSpeed;
  const sinceHit = period - cooldown;
  return {
    windup: windupSec > 0 ? clamp01((windupSec - cooldown) / windupSec) : 0,
    strike: anim.strikeSec > 0 ? clamp01(sinceHit / anim.strikeSec) : 1,
  };
}

/**
 * Смещение фигуры вдоль направления удара в единицах мира: отрицательное на
 * замахе (отклонение назад), положительное на проводке (выпад).
 *
 * Отклонение назад обязательно: без него выпад читается как подёргивание, а не
 * как удар — глазу нужна точка, из которой фигура выстреливает.
 */
export function swingPush(phase: SwingPhase, lean: number, lunge: number): number {
  return lunge * (1 - easeOutCubic(phase.strike)) - lean * easeInQuad(phase.windup);
}
