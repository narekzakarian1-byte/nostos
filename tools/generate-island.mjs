// Генерация арта острова по заданиям из его же файла:
//
//     node tools/generate-island.mjs lotus            один остров
//     node tools/generate-island.mjs lotus cyclops    несколько подряд
//     node tools/generate-island.mjs --all            весь маршрут
//
// Draw Things держит строго последовательную очередь и одна картинка идёт
// минуты, поэтому скрипт запускается фоном и пишет результат по одному файлу.
// Прервать можно в любой момент — готовое останется, повторный запуск
// пропустит то, что уже лежит на диске.
import { mkdirSync, writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { jobsForIsland, allIslandIds } from './island-jobs.mjs';
import { PREAMBLES } from './preambles.mjs';

const API = 'http://127.0.0.1:7860';

const args = process.argv.slice(2);
const ids = args[0] === '--all' ? allIslandIds() : args;
if (ids.length === 0) {
  console.error('укажи остров: node tools/generate-island.mjs lotus [cyclops …] | --all');
  process.exit(1);
}

const queue = ids.flatMap((id) => jobsForIsland(id));
console.log(`островов: ${ids.length}, заданий: ${queue.length}`);

let done = 0;
let skipped = 0;
let failed = 0;

for (const job of queue) {
  const dir = join('islands/uploads', job.island, job.category);
  const file = join(dir, `${job.name}.png`);
  // Готовый файл в public/ значит, что картинка уже принята и разложена;
  // перегенерировать её молча — верный способ затереть отобранный вариант.
  if (existsSync(file) || existsSync(join('public/art', job.category, `${job.name}.png`))) {
    skipped += 1;
    continue;
  }
  mkdirSync(dir, { recursive: true });

  const prompt = `${PREAMBLES[job.preamble]}\nTASK: ${job.prompt}`;
  const started = Date.now();
  console.log(`[${done + failed + 1}/${queue.length - skipped}] ${job.island}/${job.category}/${job.name} (${job.width}×${job.height})…`);

  try {
    const response = await fetch(`${API}/sdapi/v1/txt2img`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt,
        // Flux 2 Klein — дистиллированная модель: cfg_scale строго 1,
        // иначе картинка выгорает.
        cfg_scale: 1,
        steps: job.steps,
        width: job.width,
        height: job.height,
        seed: 1,
        batch_size: 1,
      }),
    });
    if (!response.ok) {
      console.log(`  ✗ ${response.status}: ${(await response.text()).slice(0, 160)}`);
      failed += 1;
      continue;
    }
    const image = (await response.json()).images?.[0];
    if (!image) {
      console.log('  ✗ ответ без картинки');
      failed += 1;
      continue;
    }
    writeFileSync(file, Buffer.from(image, 'base64'));
    done += 1;
    console.log(`  ✓ ${file} за ${Math.round((Date.now() - started) / 1000)} с`);
  } catch (error) {
    console.log(`  ✗ ${error.message}`);
    failed += 1;
  }
}

console.log(`готово: ${done}, пропущено: ${skipped}, ошибок: ${failed}`);
