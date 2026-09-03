// Подбор чисел баланса под целевые ощущения: node tools/tune.mjs [проходов]
//
// Приём взят из разбора референса (BUTCHER.md §3): там дизайнер задаёт не статы
// врага, а желаемую длительность боя и время до награды, а числа под это
// подбирает симулятор. Здесь то же самое, только цели наши — из
// balance.json.gateTargets: прогресс первой попытки 40-60% на каждом острове,
// смерть не раньше сорока секунд, монотонно растущая подготовка.
//
// Крутится покоординатный спуск по рычагам в порядке SPEC.md §7: сначала
// важность типов, затем реген, темп островов, жёсткость гейта и длина гринда.
// Порядок важен — рычаги взаимозависимы, и перебор их вперемешку ловит свой
// хвост ровно так, как SPEC и предупреждает.
//
// balance.json на время работы патчится и в конце восстанавливается: симулятор
// импортирует его статически, подсунуть конфиг в память нельзя. Копия исходного
// лежит рядом до самого конца, и он же возвращается на место, если прервать.
import { readFileSync, writeFileSync, copyFileSync, existsSync, unlinkSync } from 'node:fs';
import { execFileSync } from 'node:child_process';

const FILE = 'balance.json';
const BACKUP = 'balance.tune-backup.json';

/** Рычаги в порядке настройки из SPEC.md §7. */
const LEVERS = [
  { path: 'combat.typeExponent', values: [1.2, 1.35, 1.5, 1.7, 1.9, 2.1] },
  // Реген босса — единственный рычаг жёсткости всех гейтов (GDD §6.2). На
  // старте он же и главный виновник: при hpMult 60 он даёт 72 урона в секунду
  // против тридцати у игрока, и первый босс становится неубиваемым в принципе.
  { path: 'regen.bossCombatRegen', values: [0.001, 0.002, 0.003, 0.004, 0.006, 0.008, 0.012] },
  { path: 'islands.powerBase', values: [1.8, 2.0, 2.2, 2.4, 2.6, 2.8, 3.0] },
  { path: 'growth.gainRate', values: [0.3, 0.5, 0.7, 0.85, 1.0, 1.3, 1.7, 2.2] },
  { path: 'growth.diminishK', values: [1500, 2500, 3500, 5000, 8000, 12000, 20000] },
  { path: 'enemyTiers.boss.hpMult', values: [8, 12, 18, 25, 35, 45, 60] },
  { path: 'enemyTiers.boss.dpsMult', values: [2.0, 3.0, 4.0, 5.5, 7.0, 9.0, 12.0] },
  { path: 'enemyDefense.baseDef', values: [4, 6, 9, 12, 16, 22] },
  { path: 'enemyDefense.weaknessMult', values: [0.2, 0.28, 0.35, 0.45, 0.6] },
  { path: 'islands.baseDps', values: [4, 6, 8, 12, 16, 22] },
  { path: 'islands.baseHp', values: [60, 80, 100, 140, 200] },
  { path: 'weapons.levelStep', values: [0.03, 0.045, 0.055, 0.07, 0.09] },
  { path: 'armor.levelStep', values: [0.02, 0.035, 0.055, 0.07, 0.09] },
  {
    path: 'player.baseStats.pierceAtk', values: [10, 14, 18, 24, 32, 42],
    mirror: ['player.baseStats.slashAtk', 'player.baseStats.crushAtk'],
  },
  {
    path: 'player.baseStats.pierceDef', values: [3, 5, 8, 12, 18],
    mirror: ['player.baseStats.slashDef', 'player.baseStats.crushDef'],
  },
  { path: 'player.baseStats.maxHp', values: [200, 300, 450, 650, 900] },
];

function get(obj, path) {
  return path.split('.').reduce((o, k) => o[k], obj);
}

function set(obj, path, value) {
  const keys = path.split('.');
  const last = keys.pop();
  keys.reduce((o, k) => o[k], obj)[last] = value;
}

/** Прогон симулятора на текущем balance.json. Возвращает разобранный отчёт. */
function runSim() {
  let out;
  try {
    out = execFileSync('node', ['src/sim/simulate.ts'], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
  } catch (error) {
    // Красные проверки роняют симулятор кодом 1 — это ожидаемо, отчёт всё равно напечатан.
    out = `${error.stdout ?? ''}`;
    if (!out) return null;
  }
  const islands = [];
  let current = null;
  for (const line of out.split('\n')) {
    const head = /^ОСТРОВ (\d+)/.exec(line);
    if (head) {
      current = { n: Number(head[1]) };
      islands.push(current);
      continue;
    }
    if (!current) continue;
    const death = /Время до смерти игрока:\s+([\d.]+) с/.exec(line);
    if (death) current.tDeath = Number(death[1]);
    const progress = /Прогресс за попытку:\s+([\d.]+)%/.exec(line);
    if (progress) current.progress = Number(progress[1]);
    const prep = /Время подготовки:\s+~([\d.]+) (мин|ч)/.exec(line);
    if (prep) current.prepMin = Number(prep[1]) * (prep[2] === 'ч' ? 60 : 1);
  }
  const reds = /КРАСНЫХ ПРОВЕРОК: (\d+)/.exec(out);
  return { islands, reds: reds ? Number(reds[1]) : 0 };
}

/**
 * Штраф за отклонение от целей. Меньше — лучше, ноль — все цели выполнены.
 *
 * Прогресс считается квадратично: важно не «попасть в коридор хоть как-то», а
 * держаться его середины, иначе спуск останавливается на границе и первая же
 * правка соседнего рычага выбивает остров обратно.
 */
function score(report, targets) {
  if (!report || report.islands.length === 0) return Number.POSITIVE_INFINITY;
  const min = targets.firstAttemptProgressMin * 100;
  const max = targets.firstAttemptProgressMax * 100;
  const mid = (min + max) / 2;
  let penalty = 0;
  let prevPrep = 0;

  for (const island of report.islands) {
    const progress = island.progress ?? 0;
    if (progress < min || progress > max) penalty += ((progress - mid) / 10) ** 2;
    // Стопроцентный прогресс — не «чуть перелёт», а сломанный гейт: босс падает
    // с первой попытки, и весь остров перестаёт быть препятствием.
    if (progress >= 100) penalty += 50;
    if (progress <= 0) penalty += 50;

    const tDeath = island.tDeath ?? 0;
    if (tDeath < targets.minTimeToDeathSec) penalty += (targets.minTimeToDeathSec - tDeath) ** 2 / 20;

    const prep = island.prepMin ?? 0;
    if (prep < prevPrep) penalty += 8;
    if (prep > 12 * 60) penalty += 20;
    prevPrep = prep;
  }
  return penalty;
}

function describe(report) {
  const bad = report.islands.filter((i) => (i.progress ?? 0) < 40 || (i.progress ?? 0) > 60).length;
  const short = report.islands.filter((i) => (i.tDeath ?? 0) < 40).length;
  return `островов вне коридора ${bad}/${report.islands.length}, смерть раньше 40 с на ${short}, красных ${report.reds}`;
}

// ── прогон ────────────────────────────────────────────────────────────────
const passes = Number(process.argv[2] ?? 3);
copyFileSync(FILE, BACKUP);
process.on('exit', () => {
  if (existsSync(BACKUP)) {
    copyFileSync(BACKUP, FILE);
    unlinkSync(BACKUP);
  }
});

const config = JSON.parse(readFileSync(BACKUP, 'utf8'));
const targets = config.gateTargets;

const write = () => writeFileSync(FILE, `${JSON.stringify(config, null, 2)}\n`);
write();
let best = score(runSim(), targets);
console.log(`старт: штраф ${best.toFixed(1)}`);

for (let pass = 1; pass <= passes; pass++) {
  let improved = false;
  for (const lever of LEVERS) {
    const original = get(config, lever.path);
    let bestValue = original;
    for (const value of lever.values) {
      if (value === original) continue;
      set(config, lever.path, value);
      for (const path of lever.mirror ?? []) set(config, path, value);
      write();
      const current = score(runSim(), targets);
      if (current < best - 1e-9) {
        best = current;
        bestValue = value;
        improved = true;
      }
    }
    set(config, lever.path, bestValue);
    for (const path of lever.mirror ?? []) set(config, path, bestValue);
    write();
    console.log(`  проход ${pass}  ${lever.path.padEnd(32)} → ${String(bestValue).padStart(7)}   штраф ${best.toFixed(1)}`);
  }
  if (!improved) {
    console.log(`проход ${pass}: улучшений нет, останавливаюсь`);
    break;
  }
}

write();
const final = runSim();
console.log(`\nитог: штраф ${best.toFixed(1)} — ${describe(final)}`);
console.log('\nподобранные значения:');
for (const lever of LEVERS) console.log(`  ${lever.path.padEnd(34)} ${get(config, lever.path)}`);

// Результат печатается, но в файл НЕ закрепляется: balance.json вернётся из
// копии обработчиком exit. Числа переносит человек, посмотрев на весь отчёт, —
// автоматически записанный баланс никто ни разу не прочитал бы целиком.
writeFileSync('balance.tuned.json', `${JSON.stringify(config, null, 2)}\n`);
console.log('\nполный конфиг с этими числами: balance.tuned.json (balance.json не тронут)');
