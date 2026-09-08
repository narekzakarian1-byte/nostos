// Числа арта в код: `node tools/gen-art-code.mjs`.
//
// Пишет два файла целиком, и оба — таблицы, а не логика:
//
//   src/ui/AssetTable.ts     адреса и пиксельные размеры всех картинок
//   src/ui/rig/RigTable.ts   пивоты, сокеты и ростовые доли костей и оружия
//
// Почему генератор, а не руки. Всё, что здесь пишется, ПОСЧИТАНО из модели:
// пивот кости — это спроецированное начало её координат, сокет — сустав,
// ростовая доля — отношение экранных высот. Ни одно из этих чисел нельзя
// «поправить на глаз», не сломав совпадение с рендером, а всего их около
// шестисот. Смысл ручной правки был бы ровно в том, чтобы разойтись с
// фабрикой (ART_RUNBOOK.md §7).
//
// Всё, что является РЕШЕНИЕМ, — размер объекта в мире, набор декора в зоне,
// какой остров каким артом рисуется — по-прежнему пишется руками, в
// balance.json, islands/*.layout.json и ui/IslandArt.ts.
import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const metrics = readdirSync('art/metrics')
  .filter((f) => f.endsWith('.json'))
  .map((f) => JSON.parse(readFileSync(join('art/metrics', f), 'utf-8')))
  .sort((a, b) => a.id.localeCompare(b.id));

const sprites = JSON.parse(readFileSync('art/sprites.generated.json', 'utf-8'));

const head = (what) => `// СГЕНЕРИРОВАНО: node tools/gen-art-code.mjs. Руками не править.\n`
  + `// ${what}\n`;

// --- Таблица картинок ---------------------------------------------------------
const rows = sprites
  .map((s) => `  '${s.id}': { src: '${s.src}', width: ${s.width}, height: ${s.height} },`)
  .join('\n');
writeFileSync('src/ui/AssetTable.ts', `${head(
  'Адреса и исходные размеры отрендеренных картинок. Из размера берётся только\n'
  + '// пропорция: величина объекта в мире задаётся отдельно (balance.props.sizes,\n'
  + '// render.enemySizeByTier, ui/rig/RigTable.ts).',
)}import type { SpriteDef } from './AssetManifest.ts';

export const ART = {
${rows}
} as const satisfies Record<string, SpriteDef>;
`);

// --- Таблица ригов ------------------------------------------------------------
const figures = metrics.filter((m) => m.kind === 'figure');
const parts = metrics.filter((m) => m.kind === 'part');

const rigRows = figures.map((f) => {
  const bones = f.bones.map((b) => `      { id: '${b.id}', sprite: '${f.id}-${b.id}', `
    + `pivotX: ${b.pivotX}, pivotY: ${b.pivotY}, height: ${b.height}, `
    + `socketX: ${b.socketX}, socketY: ${b.socketY}, parent: ${b.id === 'torso' ? 'null' : "'torso'"}, `
    + `behind: ${b.behind} },`).join('\n');
  return `  '${f.id}': {\n    bones: [\n${bones}\n    ],\n`
    + `    handX: ${f.handX}, handY: ${f.handY},\n  },`;
}).join('\n');

const partRows = parts.map((p) => `  '${p.id}': { sprite: '${p.id}', `
  + `pivotX: ${p.pivot.x}, pivotY: ${p.pivot.y}, height: ${p.height} },`).join('\n');

writeFileSync('src/ui/rig/RigTable.ts', `${head(
  'Числа бумажной куклы, посчитанные фабрикой ассетов из самой модели.\n'
  + '// Пивот кости — спроецированное начало её координат, сокет — сустав в долях\n'
  + '// картинки торса, height — доля роста фигуры. Скрепляет их ui/rig/RigParts.ts.',
)}import type { SpriteId } from '../AssetManifest.ts';

export interface RigBoneSpec {
  readonly id: string;
  readonly sprite: SpriteId;
  readonly pivotX: number;
  readonly pivotY: number;
  readonly height: number;
  readonly socketX: number;
  readonly socketY: number;
  readonly parent: 'torso' | null;
  readonly behind: boolean;
}

export interface RigSpec {
  readonly bones: readonly RigBoneSpec[];
  readonly handX: number;
  readonly handY: number;
}

export interface WeaponSpec {
  readonly sprite: SpriteId;
  readonly pivotX: number;
  readonly pivotY: number;
  readonly height: number;
}

export const RIGS = {
${rigRows}
} as const satisfies Record<string, RigSpec>;

export const WEAPONS = {
${partRows}
} as const satisfies Record<string, WeaponSpec>;
`);

console.log(`AssetTable.ts: ${sprites.length} картинок`);
console.log(`RigTable.ts: ${figures.length} фигур, ${parts.length} предметов`);
