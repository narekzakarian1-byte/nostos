/**
 * Островной гейт: сколько игрок снял с босса за попытку и с чем это сравнивать
 * (GDD §6.3). О канвасе не знает — рисует это ui/BossProgress.ts.
 *
 * Считается НЕ остаток HP на момент смерти, а лучшее, чего игрок достиг за
 * попытку: босс регенерирует в бою, и к моменту смерти шкала успевает откатиться.
 * Показывать откат — значит врать игроку о его прогрессе ровно на том экране,
 * который должен говорить «я почти».
 */
export interface Attempt {
  /** Доля HP босса, снятая за попытку, в [0, 1]. */
  readonly progress: number;
  /** Тот же показатель прошлой попытки. null — попытка первая. */
  readonly previous: number | null;
}

export class Gate {
  /** Наименьшая доля HP босса, увиденная за текущую попытку. */
  private lowest = 1;
  private started = false;
  private lastProgress: number | null = null;
  private bestProgress = 0;
  /** Босс убит — остров пройден, переход дальше открыт. */
  defeated = false;

  /** Вызывается каждый тик, пока игрок сцеплен с боссом. */
  note(hpFraction: number): void {
    this.started = true;
    this.lowest = Math.min(this.lowest, Math.max(0, hpFraction));
  }

  get inAttempt(): boolean {
    return this.started;
  }

  /** Прогресс текущей попытки прямо сейчас — для полосы в HUD. */
  get currentProgress(): number {
    return 1 - this.lowest;
  }

  get best(): number {
    return this.bestProgress;
  }

  /**
   * Закрыть попытку. Возвращает null, если боя с боссом не было: экран
   * прогресса не должен всплывать после смерти от обычного врага.
   */
  end(): Attempt | null {
    if (!this.started) return null;
    const progress = this.currentProgress;
    const previous = this.lastProgress;
    this.lastProgress = progress;
    this.bestProgress = Math.max(this.bestProgress, progress);
    this.lowest = 1;
    this.started = false;
    return { progress, previous };
  }

  /** Победа. Прогресс попытки — ровно 100%, и он же становится последним. */
  markDefeated(): Attempt {
    this.defeated = true;
    const previous = this.lastProgress;
    this.lastProgress = 1;
    this.bestProgress = 1;
    this.lowest = 1;
    this.started = false;
    return { progress: 1, previous };
  }

  /** Переход на следующий остров разрешён только после победы (GDD §6). */
  get canAdvance(): boolean {
    return this.defeated;
  }
}
