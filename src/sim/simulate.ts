import { getBalance } from '../core/Balance.ts';
import type { BalanceProfile } from '../core/BalanceTypes.ts';
import type { CopyCurve } from '../core/formulas/weapon.ts';
import { runChecks } from './checks.ts';
import { printChecks, printIsland, printIslandDetail } from './report.ts';
import { runAll } from './run.ts';

// Headless-прогон баланса (SPEC.md §6). Node 24 исполняет TypeScript нативно,
// поэтому запускается без сборки и без лишних пакетов: npm run sim.

function flag(name: string): string | null {
  const prefix = `--${name}=`;
  const found = process.argv.find((arg) => arg.startsWith(prefix));
  return found ? found.slice(prefix.length) : null;
}

function resolveProfile(): BalanceProfile {
  const balance = getBalance();
  const requested = flag('profile');
  if (requested === null) return balance.activeProfile;
  if (requested !== 'prototype' && requested !== 'production') {
    console.error(`Неизвестный профиль "${requested}". Доступны: prototype, production.`);
    process.exit(2);
  }
  return requested;
}

function main(): void {
  const balance = getBalance();
  const profile = resolveProfile();
  const curve: CopyCurve = balance.copies.profiles[profile];
  const islandFilter = flag('island');

  console.log('NOSTOS — симулятор баланса');
  console.log(
    `  профиль копий: ${profile} (a=${curve.a}, b=${curve.b}, c=${curve.c})   ` +
      `powerBase ${balance.islands.powerBase}   typeExponent ${balance.combat.typeExponent}   ` +
      `bossCombatRegen ${balance.regen.bossCombatRegen}`,
  );

  const reports = runAll(curve);

  if (islandFilter !== null) {
    const n = Number(islandFilter);
    const report = reports.find((entry) => entry.n === n);
    if (!report) {
      console.error(`Острова ${islandFilter} нет. Доступны 1..${reports.length}.`);
      process.exit(2);
    }
    printIslandDetail(report, curve, report.atk);
    return;
  }

  for (const report of reports) printIsland(report);

  // Отчёт печатается целиком до проверок: иначе первая красная спрятала бы остальные.
  const passed = printChecks(runChecks(reports));
  if (!passed) process.exit(1);
}

main();
