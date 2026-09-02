import { describe, it, expect } from 'vitest';
import { getBalance } from '../src/core/Balance.ts';
import { BodyAnim, swingPhase, swingPush } from '../src/juice/BodyAnim.ts';
import { easeOutBack, easeOutCubic } from '../src/juice/Ease.ts';
import { Particles } from '../src/juice/Particles.ts';
import { Rng } from '../src/core/Rng.ts';

const balance = getBalance();
const anim = balance.anim;
const period = 1 / balance.combat.baseAttackSpeed;
const STEP = 1 / balance.loop.tickHz;

describe('swingPhase — фаза удара из счётчика перезарядки', () => {
  it('окна замаха и проводки не пересекаются: иначе фигура рвётся на контакте', () => {
    expect(anim.windupSec + anim.strikeSec).toBeLessThan(period);
    expect(anim.enemyWindupSec + anim.strikeSec).toBeLessThan(period);
  });

  it('между ударами фигура стоит ровно', () => {
    // Середина периода: проводка прошлого удара догорела, замах следующего
    // ещё не начался.
    const phase = swingPhase(period / 2, anim.windupSec);
    expect(phase.windup).toBe(0);
    expect(phase.strike).toBe(1);
    expect(swingPush(phase, anim.windupLean, anim.lungeUnits)).toBe(0);
  });

  it('замах растёт к контакту и отклоняет фигуру назад', () => {
    const early = swingPhase(anim.windupSec * 0.8, anim.windupSec);
    const late = swingPhase(anim.windupSec * 0.1, anim.windupSec);
    expect(late.windup).toBeGreaterThan(early.windup);
    const push = swingPush(late, anim.windupLean, anim.lungeUnits);
    expect(push).toBeLessThan(0);
    expect(push).toBeGreaterThanOrEqual(-anim.windupLean);
  });

  it('на контакте выпад максимален и гаснет к концу проводки', () => {
    const contact = swingPhase(period, anim.windupSec);
    expect(contact.strike).toBe(0);
    expect(swingPush(contact, anim.windupLean, anim.lungeUnits)).toBeCloseTo(anim.lungeUnits, 6);

    const mid = swingPhase(period - anim.strikeSec / 2, anim.windupSec);
    const midPush = swingPush(mid, anim.windupLean, anim.lungeUnits);
    expect(midPush).toBeGreaterThan(0);
    expect(midPush).toBeLessThan(anim.lungeUnits);

    const done = swingPhase(period - anim.strikeSec, anim.windupSec);
    expect(swingPush(done, anim.windupLean, anim.lungeUnits)).toBeCloseTo(0, 6);
  });
});

describe('BodyAnim — состояние фигуры', () => {
  it('свежая фигура ничем не смещена и полностью видна', () => {
    const body = new BodyAnim();
    expect(body.flash).toBe(0);
    expect(body.offsetX).toBe(0);
    expect(body.offsetY).toBe(0);
    expect(body.alpha).toBe(1);
    expect(body.scaleX).toBe(1);
    expect(body.scaleY).toBe(1);
    expect(body.dying).toBe(false);
  });

  it('попадание толкает в сторону удара, крит — сильнее', () => {
    const plain = new BodyAnim();
    const crit = new BodyAnim();
    plain.hit(1, 0, false);
    crit.hit(1, 0, true);
    expect(plain.offsetX).toBeCloseTo(anim.recoilUnits, 6);
    expect(crit.offsetX).toBeCloseTo(anim.recoilUnits * anim.recoilCritScale, 6);
    expect(plain.flash).toBe(1);
    // Сплющивание: шире по горизонтали, ниже по вертикали.
    expect(plain.scaleX).toBeGreaterThan(1);
    expect(plain.scaleY).toBeLessThan(1);
  });

  it('вспышка и отдача гаснут сами', () => {
    const body = new BodyAnim();
    body.hit(0, 1, false);
    for (let t = 0; t < anim.recoilSec + anim.hitFlashSec; t += STEP) body.tick(STEP);
    expect(body.flash).toBe(0);
    expect(body.offsetY).toBe(0);
    expect(body.scaleY).toBe(1);
  });

  it('распад держит фигуру на экране, потом отпускает', () => {
    const body = new BodyAnim();
    body.die();
    expect(body.dying).toBe(true);
    for (let t = 0; t < anim.deathSec / 2; t += STEP) body.tick(STEP);
    expect(body.alpha).toBeLessThan(1);
    expect(body.alpha).toBeGreaterThan(0);
    expect(body.offsetY).toBeLessThan(0); // труп приподнимается
    for (let t = 0; t < anim.deathSec; t += STEP) body.tick(STEP);
    expect(body.dying).toBe(false);
  });

  it('появление отменяет распад: узел воскресает целым, а не полупрозрачным', () => {
    const body = new BodyAnim();
    body.die();
    body.tick(anim.deathSec / 2);
    body.spawn();
    expect(body.dying).toBe(false);
    for (let t = 0; t < anim.spawnSec; t += STEP) body.tick(STEP);
    expect(body.alpha).toBe(1);
    expect(body.scaleX).toBeCloseTo(1, 6);
  });
});

describe('Particles — искры контакта', () => {
  it('всплеск живёт заданное время и не копится сверх потолка', () => {
    const particles = new Particles(new Rng(1));
    particles.burst(0, 0, 1, 0, '#FFFFFF', false);
    expect(particles.count).toBe(anim.particlesPerHit);

    for (let i = 0; i < 100; i++) particles.burst(0, 0, 1, 0, '#FFFFFF', true);
    expect(particles.count).toBeLessThanOrEqual(anim.particleMax);

    for (let t = 0; t < anim.particleLifeSec + STEP; t += STEP) particles.tick(STEP);
    expect(particles.count).toBe(0);
  });

  it('искры не трогают боевой поток случайности', () => {
    // Один и тот же родитель обязан отдавать ту же боевую последовательность
    // независимо от того, сколько косметики отъел форк.
    const parent = new Rng(balance.rng.defaultSeed);
    const particles = new Particles(parent.fork());
    for (let i = 0; i < 20; i++) particles.burst(0, 0, 1, 0, '#FFFFFF', true);
    const after = [parent.next(), parent.next()];

    const control = new Rng(balance.rng.defaultSeed);
    control.next(); // единственный отбор родителя — тот, что ушёл на сид форка
    expect([control.next(), control.next()]).toEqual(after);
  });
});

describe('Ease — кривые сглаживания', () => {
  it('края закреплены, середина монотонна', () => {
    expect(easeOutCubic(0)).toBe(0);
    expect(easeOutCubic(1)).toBe(1);
    expect(easeOutCubic(0.5)).toBeGreaterThan(0.5);
    expect(easeOutBack(0, anim.spawnOvershoot)).toBe(0);
    expect(easeOutBack(1, anim.spawnOvershoot)).toBeCloseTo(1, 6);
  });

  it('появление проскакивает единицу — иначе поп не читается как поп', () => {
    let peak = 0;
    for (let t = 0; t <= 1; t += 0.02) peak = Math.max(peak, easeOutBack(t, anim.spawnOvershoot));
    expect(peak).toBeGreaterThan(1);
  });
});
