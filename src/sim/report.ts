import { getBalance } from '../core/Balance.ts';
import { attackRatio, DAMAGE_TYPES, type ByType } from '../core/Combat.ts';
import { copiesForNextLevel, type CopyCurve } from '../core/formulas/weapon.ts';
import { iconStep } from '../core/IconColor.ts';
import type { CheckResult } from './checks.ts';
import type { IslandReport } from './run.ts';

const TYPE_RU: Record<string, string> = { pierce: 'колющий', slash: 'рубящий', crush: 'дробящий' };

function num(value: number): string {
  return Math.round(value).toLocaleString('ru-RU');
}

function hours(seconds: number): string {
  const h = seconds / 3600;
  return h < 1 ? `${(seconds / 60).toFixed(0)} мин` : `${h.toFixed(1)} ч`;
}

function mark(ok: boolean, note: string): string {
  return ok ? `[OK, ${note}]` : `[ПЛОХО, ${note}]`;
}

/** Формат из SPEC.md §6. */
export function printIsland(r: IslandReport): void {
  const { gateTargets } = getBalance();
  const min = gateTargets.firstAttemptProgressMin * 100;
  const max = gateTargets.firstAttemptProgressMax * 100;
  const inRange = r.first.progressPct >= min && r.first.progressPct <= max;
  const survives = r.first.tDeath >= gateTargets.minTimeToDeathSec;

  console.log(`\nОСТРОВ ${r.n} — ${r.boss} (слабость: ${r.weakness})`);
  console.log(
    `  Сила игрока после зачистки:   DPS ${num(r.first.playerDps).padEnd(10)}` +
      `HP ${num(r.playerHp)}   оружие ${r.rarity} ур. ${r.weaponLevel}`,
  );
  console.log(`  Босс:                         HP ${num(r.bossState.hp).padEnd(10)}DPS ${num(r.bossState.dps)}`);
  console.log(`  Реген босса:                  ${num(r.bossState.regen)} /с`);
  console.log(`  Чистый DPS:                   ${num(r.first.netDps)} /с`);
  console.log(
    `  Время до смерти игрока:       ${r.first.tDeath.toFixed(1)} с    ` +
      mark(survives, `порог ${gateTargets.minTimeToDeathSec}`),
  );
  console.log(
    `  Прогресс за попытку:          ${r.first.progressPct.toFixed(1)}%    ` +
      mark(inRange, `цель ${min}-${max}`),
  );
  console.log(`  Копий до победы:              ~${num(r.copiesToWin)}`);
  console.log(
    `  Время подготовки:             ~${hours(r.prepSeconds)}    ` +
      (r.won ? `[кругов ${r.cycles}]` : '[БОСС НЕ УБИТ]'),
  );
}

/** Подробный разбор одного острова: --island=N. */
export function printIslandDetail(r: IslandReport, curve: CopyCurve, atk: ByType): void {
  printIsland(r);

  console.log('\n  Защиты босса, атака игрока и цвет иконки по каждому типу:');
  for (const type of DAMAGE_TYPES) {
    const def = r.bossState.def[type];
    const ratio = attackRatio(atk[type], def);
    const color = iconStep(atk[type], def).name;
    console.log(
      `    ${TYPE_RU[type]!.padEnd(10)} защита ${num(def).padStart(10)}` +
        `   атака ${num(atk[type]).padStart(10)}   ratio ${ratio.toFixed(2).padStart(7)}   ${color}`,
    );
  }

  console.log('\n  Прирост статов в час:');
  console.log(`    обычные   ${r.gainPerHour.normal.toFixed(2)}`);
  console.log(`    элита     ${r.gainPerHour.elite.toFixed(2)}`);
  console.log(`    мини-босс ${r.gainPerHour.miniboss.toFixed(2)}`);

  console.log('\n  Стоимость следующих уровней оружия, копий:');
  const levels = [r.weaponLevel, r.weaponLevel + 1, r.weaponLevel + 5, r.weaponLevel + 10];
  for (const level of levels) {
    console.log(`    ${String(level).padStart(3)} → ${level + 1}:  ${copiesForNextLevel(level, curve)}`);
  }

}

export function printChecks(results: readonly CheckResult[]): boolean {
  console.log('\n' + '─'.repeat(64));
  console.log('АВТОПРОВЕРКИ');
  for (const result of results) {
    console.log(`  ${result.passed ? '✓' : '✗'} ${result.n}. ${result.title}`);
    console.log(`      ${result.detail}`);
  }
  const passed = results.every((result) => result.passed);
  console.log(
    '─'.repeat(64) + '\n' +
      (passed ? 'ВСЕ ПРОВЕРКИ ЗЕЛЁНЫЕ' : `КРАСНЫХ ПРОВЕРОК: ${results.filter((r) => !r.passed).length}`),
  );
  return passed;
}
