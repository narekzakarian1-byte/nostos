// Генерация арта острова по заданиям из его же файла:
//
//     node tools/generate-island.mjs lotus            один остров
//     node tools/generate-island.mjs lotus cyclops    несколько подряд
//     node tools/generate-island.mjs --all            весь маршрут
import { join } from 'node:path';
import { jobsForIsland, allIslandIds } from './island-jobs.mjs';
import { runQueue } from './run-queue.mjs';

const args = process.argv.slice(2);
const ids = args[0] === '--all' ? allIslandIds() : args;
if (ids.length === 0) {
  console.error('укажи остров: node tools/generate-island.mjs lotus [cyclops …] | --all');
  process.exit(1);
}

const jobs = ids.flatMap((id) =>
  jobsForIsland(id).map((job) => ({
    ...job,
    dir: join('islands/uploads', job.island, job.category),
  })),
);

console.log(`островов: ${ids.length}`);
// Принятая картинка лежит в public/art — перегенерировать её молча значит
// затереть отобранный вариант.
await runQueue(jobs, {
  alsoCheck: (job) => join('public/art', job.category, `${job.name}.png`),
});
