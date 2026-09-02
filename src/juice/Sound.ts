import { getBalance } from '../core/Balance.ts';
import type { Rng } from '../core/Rng.ts';

export type SoundEvent = 'hit' | 'crit' | 'kill' | 'death';

/**
 * Звук синтезируется на месте, файлов нет. Питч гуляет на soundPitchJitter:
 * один и тот же звук тысячу раз подряд — это раздражение, а не обратная связь.
 */
export class Sound {
  private ctx: AudioContext | null = null;
  private readonly rng: Rng;
  /** Переключается кнопкой настроек. Контекст не рвём: звук должен вернуться мгновенно. */
  muted = false;

  constructor(rng: Rng) {
    this.rng = rng;
  }

  /** Браузеры не дают завести звук до жеста пользователя. */
  unlock(): void {
    if (this.ctx) return;
    const Ctor = window.AudioContext;
    if (!Ctor) return;
    this.ctx = new Ctor();
    void this.ctx.resume();
  }

  play(event: SoundEvent): void {
    const ctx = this.ctx;
    if (!ctx || this.muted) return;

    const { audio, juice } = getBalance();
    const baseHz = {
      hit: audio.hitHz,
      crit: audio.critHz,
      kill: audio.killHz,
      death: audio.deathHz,
    }[event];

    const jitter = 1 + this.rng.range(-juice.soundPitchJitter, juice.soundPitchJitter);
    const duration = audio.durationMs / 1000;
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = event === 'crit' ? 'square' : 'triangle';
    osc.frequency.setValueAtTime(baseHz * jitter, now);
    // Спад частоты к концу: сухой щелчок вместо гудка.
    osc.frequency.exponentialRampToValueAtTime(baseHz * jitter * 0.5, now + duration);

    gain.gain.setValueAtTime(audio.gain, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

    osc.connect(gain).connect(ctx.destination);
    osc.start(now);
    osc.stop(now + duration);
  }
}
