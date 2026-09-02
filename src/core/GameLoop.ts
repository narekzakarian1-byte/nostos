import { getBalance } from './Balance.ts';

export type TickFn = (dt: number) => void;
export type RenderFn = () => void;

/**
 * Фиксированный тик через накопитель. Логика никогда не видит реальный deltaTime:
 * на слабом телефоне баланс поехал бы, на быстром — сломался.
 */
export class GameLoop {
  private readonly stepSeconds: number;
  private readonly maxSteps: number;
  private accumulator = 0;
  private lastTime = 0;
  private frame = 0;
  private running = false;

  /** Множитель времени для дев-панели. Влияет только на скорость накопления. */
  timeScale = 1;

  /** Пауза логики в реальных миллисекундах: hitstop. Рендер при этом продолжается. */
  private freezeMs = 0;

  /** Замедление на добивании босса. Отдельно от timeScale: дев-панель им не крутит. */
  private slowmoMs = 0;
  private slowmoScale = 1;

  private readonly tick: TickFn;
  private readonly render: RenderFn;

  constructor(tick: TickFn, render: RenderFn) {
    this.tick = tick;
    this.render = render;
    const { loop } = getBalance();
    this.stepSeconds = 1 / loop.tickHz;
    this.maxSteps = loop.maxStepsPerFrame;
  }

  start(): void {
    if (this.running) return;
    this.running = true;
    this.lastTime = performance.now();
    this.frame = requestAnimationFrame(this.onFrame);
  }

  stop(): void {
    this.running = false;
    cancelAnimationFrame(this.frame);
  }

  /** Заморозить логику на заданное число реальных миллисекунд. */
  freeze(ms: number): void {
    this.freezeMs = Math.max(this.freezeMs, ms);
  }

  /**
   * Замедлить время на окно реальных миллисекунд (GDD §10, добивание босса).
   * Логика продолжает идти тем же фиксированным шагом — медленнее становится
   * только накопление, поэтому детерминизм не страдает.
   */
  slowmo(scale: number, ms: number): void {
    this.slowmoScale = scale;
    this.slowmoMs = Math.max(this.slowmoMs, ms);
  }

  private readonly onFrame = (now: number): void => {
    if (!this.running) return;
    this.frame = requestAnimationFrame(this.onFrame);

    let elapsedMs = now - this.lastTime;
    this.lastTime = now;

    if (this.freezeMs > 0) {
      const eaten = Math.min(this.freezeMs, elapsedMs);
      this.freezeMs -= eaten;
      elapsedMs -= eaten;
    }

    let scale = this.timeScale;
    if (this.slowmoMs > 0) {
      this.slowmoMs -= Math.min(this.slowmoMs, elapsedMs);
      scale *= this.slowmoScale;
    }

    this.accumulator += (elapsedMs / 1000) * scale;

    // Потолок шагов не даёт уйти в спираль смерти после сворачивания вкладки.
    let steps = 0;
    while (this.accumulator >= this.stepSeconds && steps < this.maxSteps) {
      this.tick(this.stepSeconds);
      this.accumulator -= this.stepSeconds;
      steps++;
    }
    if (steps >= this.maxSteps) this.accumulator = 0;

    this.render();
  };
}
