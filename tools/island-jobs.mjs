// Задания на генерацию, вычитанные прямо из файлов островов.
//
// Промпты уже написаны в islands/NN-<id>.md — по слоту на файл, с указанием
// преамбулы. Держать их вторую копию в коде значило бы разойтись с
// документом на первой же правке промпта, поэтому источник истины один: сам
// файл острова.
//
// Формат слота, который разбирается ниже:
//
//     #### [ ] `public/art/props/palm-dry.png` — сухая пальма · в 110
//     ![](../public/art/props/palm-dry.png)
//     <sub>перед промптом — ПРЕАМБУЛА PROP из §5</sub>
//     ```
//     <промпт>
//     ```
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const ISLANDS_DIR = 'islands';

// Размер картинки определяется категорией, а не подписью в заголовке слота:
// в заголовке стоит размер объекта В МИРЕ («в 110», «ш 60»), и путать его с
// размером файла — прямой способ сгенерировать проп в 110 пикселей.
const SIZES = {
  ground: { width: 512, height: 512, steps: 8 },
  road: { width: 512, height: 512, steps: 8 },
  borders: { width: 512, height: 256, steps: 8 },
  props: { width: 1024, height: 1024, steps: 10 },
  entities: { width: 512, height: 512, steps: 8 },
};

const SLOT = /^#### \[([ x])\] `public\/art\/([a-z]+)\/([A-Za-z0-9._-]+)\.png`/;
const PREAMBLE = /ПРЕАМБУЛА (TILE|PROP|CHAR)/;

/** Все задания одного острова в порядке слотов. */
export function jobsForIsland(id) {
  const file = readdirSync(ISLANDS_DIR).find((n) => n.endsWith(`-${id}.md`));
  if (!file) throw new Error(`нет файла острова для «${id}»`);

  const lines = readFileSync(join(ISLANDS_DIR, file), 'utf8').split('\n');
  const jobs = [];
  let slot = null;
  let preamble = null;
  let fence = null;

  for (const line of lines) {
    const match = SLOT.exec(line);
    if (match) {
      slot = { done: match[1] === 'x', category: match[2], name: match[3] };
      preamble = null;
      continue;
    }
    if (!slot) continue;

    if (fence === null) {
      const kind = PREAMBLE.exec(line);
      if (kind) preamble = kind[1].toLowerCase();
      // Открывающая ограда промпта считается только после того, как встретилась
      // строка с преамбулой: до неё в слоте попадаются другие блоки кода.
      if (line.startsWith('```') && preamble) fence = [];
      continue;
    }

    if (line.startsWith('```')) {
      jobs.push({
        island: id,
        category: slot.category,
        name: slot.name,
        preamble,
        prompt: fence.join('\n').trim(),
        ...SIZES[slot.category],
      });
      slot = null;
      preamble = null;
      fence = null;
      continue;
    }
    fence.push(line);
  }
  return jobs;
}

/** Идентификаторы всех островов маршрута, по порядку файлов. */
export function allIslandIds() {
  return readdirSync(ISLANDS_DIR)
    .filter((n) => /^\d\d-.+\.md$/.test(n))
    .sort()
    .map((n) => n.replace(/^\d\d-/, '').replace(/\.md$/, ''));
}
