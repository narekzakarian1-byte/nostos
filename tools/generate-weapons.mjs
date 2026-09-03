// Генерация оружия по редкостям: node tools/generate-weapons.mjs [фильтр…]
//
//     node tools/generate-weapons.mjs              все пятнадцать
//     node tools/generate-weapons.mjs sword        только мечи
//     node tools/generate-weapons.mjs legendary    только золотые
import { join } from 'node:path';
import { WEAPON_JOBS } from './weapon-jobs.mjs';
import { runQueue } from './run-queue.mjs';

const filters = process.argv.slice(2);
const jobs = filters.length === 0
  ? WEAPON_JOBS
  : WEAPON_JOBS.filter((job) => filters.some((f) => job.name.includes(f)));

if (jobs.length === 0) {
  console.error(`ничего не подошло под фильтр: ${filters.join(' ')}`);
  process.exit(1);
}

// Принятая картинка лежит в public/art — перегенерировать её молча значит
// затереть отобранный вариант.
await runQueue(jobs, {
  alsoCheck: (job) => join('public/art/weapons', `${job.name}.png`),
});
