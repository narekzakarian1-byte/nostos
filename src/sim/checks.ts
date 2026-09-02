import { getBalance } from '../core/Balance.ts';
import { damagePerHit } from '../core/Combat.ts';
import { weaponMultiplier } from '../core/formulas/weapon.ts';
import type { IslandReport } from './run.ts';

export interface CheckResult {
  readonly n: number;
  readonly title: string;
  readonly passed: boolean;
  readonly detail: string;
}

/** Шесть автопроверок из SPEC.md §6. Любая красная роняет прогон кодом 1. */
export function runChecks(reports: readonly IslandReport[]): CheckResult[] {
  const { gateTargets } = getBalance();
  const results: CheckResult[] = [];
  const fails = (list: readonly string[]): string =>
    list.length === 0 ? 'все острова в норме' : list.join('; ');

  // 1. Время до смерти игрока от босса.
  const slow = reports
    .filter((r) => r.first.tDeath < gateTargets.minTimeToDeathSec)
    .map((r) => `остров ${r.n}: ${r.first.tDeath.toFixed(1)} с`);
  results.push({
    n: 1,
    title: `T_death >= ${gateTargets.minTimeToDeathSec} с`,
    passed: slow.length === 0,
    detail: fails(slow),
  });

  // 2. Прогресс первой попытки.
  const min = gateTargets.firstAttemptProgressMin * 100;
  const max = gateTargets.firstAttemptProgressMax * 100;
  const offTarget = reports
    .filter((r) => r.first.progressPct < min || r.first.progressPct > max)
    .map((r) => `остров ${r.n}: ${r.first.progressPct.toFixed(1)}%`);
  results.push({
    n: 2,
    title: `прогресс первой попытки ${min}-${max}%`,
    passed: offTarget.length === 0,
    detail: fails(offTarget),
  });

  // 3. Время подготовки: монотонный рост и потолок.
  const capHours = gateTargets.prepTimeMinutes.late[1] / 60;
  const prepIssues: string[] = [];
  reports.forEach((r, i) => {
    const hours = r.prepSeconds / 3600;
    if (hours > capHours) prepIssues.push(`остров ${r.n}: ${hours.toFixed(1)} ч > ${capHours} ч`);
    const previous = reports[i - 1];
    if (previous && r.prepSeconds < previous.prepSeconds) {
      prepIssues.push(`остров ${r.n} готовится быстрее острова ${previous.n}`);
    }
  });
  results.push({
    n: 3,
    title: `подготовка растёт монотонно и не выше ${capHours} ч`,
    passed: prepIssues.length === 0,
    detail: fails(prepIssues),
  });

  // 4. Чистый DPS.
  const stalled = reports
    .filter((r) => r.final.netDps <= 0)
    .map((r) => `остров ${r.n}: ${r.final.netDps.toFixed(0)}/с`);
  results.push({
    n: 4,
    title: 'net_DPS > 0 при снаряжении под остров',
    passed: stalled.length === 0,
    detail: fails(stalled),
  });

  // 5. Затухание: фарм ранних островов не должен обгонять поздние.
  const exploits: string[] = [];
  reports.forEach((r, i) => {
    const previous = reports[i - 1];
    if (previous && previous.gainPerHour.miniboss >= r.gainPerHour.miniboss) {
      exploits.push(`остров ${previous.n} доходнее острова ${r.n}`);
    }
  });
  results.push({
    n: 5,
    title: 'фарм слабых врагов не выгоднее сильных',
    passed: exploits.length === 0,
    detail: fails(exploits),
  });

  // 6. Защита от возврата к аддитивной модели оружия.
  results.push(weaponGainCheck());
  return results;
}

function weaponGainCheck(): CheckResult {
  const { weapons, gateTargets, enemyDefense, player } = getBalance();
  const { fromLevel, toLevel, minRatio } = gateTargets.weaponDpsGain;
  const def = enemyDefense.baseDef;
  const atk = player.baseStats.pierceAtk;

  const dpsAt = (level: number): number => {
    const mult = weaponMultiplier(weapons.rarityMult.common, weapons.levelStep, level);
    return damagePerHit(atk * mult, def);
  };
  const ratio = dpsAt(toLevel) / dpsAt(fromLevel);

  return {
    n: 6,
    title: `уровень ${fromLevel}→${toLevel} растит DPS в ${minRatio}+ раз`,
    passed: ratio >= minRatio,
    detail: `фактический рост ${ratio.toFixed(2)}x`,
  };
}
