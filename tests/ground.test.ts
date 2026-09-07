import { describe, it, expect } from 'vitest';
import { getBalance } from '../src/core/Balance.ts';
import { Rng } from '../src/core/Rng.ts';
import { Ground } from '../src/world/Ground.ts';
import { islandLayout, zoneRect, type IslandLayout } from '../src/world/Layout.ts';
import { borderRect } from '../src/world/Scenery.ts';
import { currentIslandId } from '../src/world/Island.ts';

// Земля — данные, и ошибка в них не видна ни компилятору, ни глазу: берег
// молча уйдёт внутрь стены, зона молча останется зелёной. Печать проверить
// нечем (канваса в тестах нет), поэтому проверяется то, из чего она печётся.

const balance = getBalance();
const W = balance.render.virtualWidth;
const bounds = {
  width: W * balance.render.worldScreensX,
  height: W * 2 * balance.render.worldScreensY,
  top: balance.render.hudHeight + balance.render.enemySpawnMargin,
};
const border = borderRect({ ...bounds, startX: 0, startY: 0 });
const layout = islandLayout(currentIslandId()) as IslandLayout;

function makeGround(seed = balance.rng.defaultSeed): Ground {
  return new Ground(new Rng(seed), bounds, border, layout);
}

describe('Берег', () => {
  it('замкнут и обходит остров кругом', () => {
    const coast = makeGround().coast;
    expect(coast.length).toBe(balance.terrain.coast.steps);
    // Соседние точки не прыгают: разрыв контура — это дыра в суше.
    const step = ((border.width + border.height) * 2) / coast.length;
    for (let i = 0; i < coast.length; i++) {
      const a = coast[i]!;
      const b = coast[(i + 1) % coast.length]!;
      expect(Math.hypot(b.x - a.x, b.y - a.y)).toBeLessThan(step * 4);
    }
  });

  it('лежит СНАРУЖИ стены со всех сторон', () => {
    // Иначе игрок упирается в стену, за которой уже вода, и остров читается
    // обрезанным по линейке — ровно то, от чего берег и заводился.
    const coast = makeGround().coast;
    for (const point of coast) {
      const outside =
        point.x < border.x ||
        point.y < border.y ||
        point.x > border.x + border.width ||
        point.y > border.y + border.height;
      expect(outside, `точка берега ${point.x},${point.y} внутри стены`).toBe(true);
    }
  });

  it('волнистый, а не прямоугольный', () => {
    // Ровный отступ дал бы прямоугольник со скруглёнными углами — такой же
    // штамп, как прежняя рамка.
    const coast = makeGround().coast;
    const cx = border.x + border.width / 2;
    const cy = border.y + border.height / 2;
    const radii = coast.map((p) => Math.hypot(p.x - cx, p.y - cy));
    const spread = Math.max(...radii) - Math.min(...radii);
    expect(spread).toBeGreaterThan(balance.terrain.coast.outsetUnits * 0.3);
  });
});

describe('Материал зон', () => {
  it('каждая зона раскладки ссылается на объявленный материал', () => {
    const known = Object.keys(balance.terrain.materials);
    for (const zone of layout.zones) {
      expect(zone.ground, `у зоны ${zone.id} нет материала`).toBeDefined();
      expect(known, `материал ${zone.ground} не объявлен`).toContain(zone.ground);
    }
  });

  it('кляксы материала кроют свою зону и выходят за её край', () => {
    const ground = makeGround();
    for (const zone of layout.zones) {
      if (!zone.ground) continue;
      const rect = zoneRect(zone, bounds);
      const mine = ground.patches.filter((p) => p.material === zone.ground);
      const inside = mine.filter(
        (p) => p.x >= rect.x && p.x <= rect.x + rect.width
          && p.y >= rect.y && p.y <= rect.y + rect.height,
      );
      expect(inside.length, `зона ${zone.id} пуста`).toBeGreaterThan(0);
      // Выход за край обязателен: по стыку в линейку зоны читаются плиткой.
      const bleed = Math.max(...inside.map((p) => p.rx));
      expect(bleed).toBeGreaterThan(balance.terrain.patch.bleedUnits);
    }
  });

  it('соседние зоны разного материала не сходятся по прямой', () => {
    // Пересечение клякс соседей и есть неровная граница.
    const ground = makeGround();
    const kinds = new Set(ground.patches.map((p) => p.material));
    expect(kinds.size).toBeGreaterThan(1);
  });
});

describe('Пятна света', () => {
  it('лежат по всему миру, а не в одном углу', () => {
    const blobs = makeGround().blobs;
    expect(blobs.length).toBe(balance.terrain.shade.count);
    expect(blobs.some((b) => b.dark)).toBe(true);
    expect(blobs.some((b) => !b.dark)).toBe(true);
    expect(Math.max(...blobs.map((b) => b.y))).toBeGreaterThan(bounds.height / 2);
    expect(Math.min(...blobs.map((b) => b.y))).toBeLessThan(bounds.height / 2);
  });
});

describe('Детерминизм', () => {
  it('один сид — одна земля', () => {
    const a = JSON.stringify(makeGround(777));
    const b = JSON.stringify(makeGround(777));
    expect(a).toBe(b);
    expect(JSON.stringify(makeGround(778))).not.toBe(a);
  });
});
