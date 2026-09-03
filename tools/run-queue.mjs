// Общий гонщик очереди в Draw Things.
//
// Локальный API держит строго последовательную очередь и одна картинка идёт
// минуты, поэтому оба генератора (острова и оружие) запускаются фоном и пишут
// результат по одному файлу: прервать можно в любой момент, готовое останется,
// повторный запуск пропустит то, что уже на диске.
import { mkdirSync, writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { PREAMBLES } from './preambles.mjs';

const API = 'http://127.0.0.1:7860';

/**
 * @param jobs   задания: { dir, name, preamble, prompt, width, height, steps }
 * @param opts   { skipIfExists } — дополнительные пути, где готовый файл значит
 *               «уже принято, не трогать»
 */
export async function runQueue(jobs, { alsoCheck = () => null } = {}) {
  console.log(`заданий: ${jobs.length}`);
  let done = 0;
  let skipped = 0;
  let failed = 0;

  for (const job of jobs) {
    const file = join(job.dir, `${job.name}.png`);
    const accepted = alsoCheck(job);
    if (existsSync(file) || (accepted && existsSync(accepted))) {
      skipped += 1;
      continue;
    }
    mkdirSync(job.dir, { recursive: true });

    const prompt = `${PREAMBLES[job.preamble]}\nTASK: ${job.prompt}`;
    const started = Date.now();
    console.log(`[${done + failed + 1}/${jobs.length - skipped}] ${file} (${job.width}×${job.height})…`);

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
          seed: job.seed ?? 1,
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
}
