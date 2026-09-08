"""Бесшовный тайл земли — единственная поверхность, которая кроет весь экран.

Почему это вообще рендер, а не заливка с крапинами. Земля занимает сто
процентов кадра, и она же — тот фон, относительно которого читается всё
остальное. Нарисованная заливка не может дать одного: КОНТАКТНОЙ ТЕНИ от
собственных камешков под тем же солнцем, что у пропов. Именно эти
полупиксельные тени и отличают землю от цветной бумаги.

Тайл кадрируется числом, а не по вершинам (render.TileFrame): он обязан
замыкаться сам на себя, и лишний пиксель поля сломал бы стык. Всё, что лежит на
тайле, дублируется восемью соседями — тогда и геометрия, и тени переходят через
край без шва.

Плоскость лежит в z = 0, поэтому её кусок сжимается наклоном камеры ровно так
же, как земля в игре, и движок мостит картинку в тех же единицах, в которых она
отрендерена.
"""

from __future__ import annotations

import math

from lib import materials, optics, shapes, solids
from lib.variants import jitter, unit

KIND = "tile"
ID = "ground-grass"
VERSION = 1

# Сторона тайла на ЭКРАНЕ в единицах мира. 512 — столько же, сколько кроет
# нынешняя текстура (terrain.bakePxPerUnit = 1 пиксель на единицу).
TILE = 512.0

PEBBLES = 58
TUFTS = 104
# Крупных вздутий на тайле нет намеренно. Большие пятна светотени по всему
# миру уже рисует движок (balance.terrain.shade), и своя линза на тайле не
# просто дублировала бы их — она повторялась бы через каждые 512 единиц, и
# вместо земли зритель видел бы сетку, по которой её замостили.
SWELLS = 0


def tile_depth() -> float:
    """Глубина куска в Blender, дающая на экране квадрат TILE×TILE."""
    return TILE / math.sin(optics.tilt_rad())


def build(ctx):
    depth = tile_depth()
    # Камешки НЕ контрастные. Первый прогон делал их из dirt и rubble — рыжее
    # и сине-серое на зелёном, — и земля читалась конфетти, наклеенным на
    # заливку. Галька на лугу отличается от травы светлотой, а не цветом,
    # поэтому весь набор идёт оттенками одного материала.
    mats = materials.library(["grass", "foliage", "foliageDark"], seed=ctx.seed)
    mats["stoneA"] = materials.from_tone("grass", 2, seed=ctx.seed + 41)
    mats["stoneB"] = materials.from_tone("grass", 0, seed=ctx.seed + 42)
    parts = []

    # Подложка заведомо больше кадра: за краем тоже должна быть земля, иначе
    # по периметру вылезет прозрачность.
    base = shapes.new_object(
        "base",
        solids.slab(TILE * 3.2, depth * 3.2, 1.0, at=(0, 0, -1.0)),
        mats["grass"], ctx.body,
    )
    parts.append(base)

    seeds = []
    for i in range(SWELLS):
        seeds.append(("swell", i, TILE * (unit(ctx.seed, f"sw.x{i}") - 0.5),
                      depth * (unit(ctx.seed, f"sw.y{i}") - 0.5)))
    for i in range(PEBBLES):
        seeds.append(("pebble", i, TILE * (unit(ctx.seed, f"pb.x{i}") - 0.5),
                      depth * (unit(ctx.seed, f"pb.y{i}") - 0.5)))
    for i in range(TUFTS):
        seeds.append(("tuft", i, TILE * (unit(ctx.seed, f"tf.x{i}") - 0.5),
                      depth * (unit(ctx.seed, f"tf.y{i}") - 0.5)))

    # Девять копий: центральная в кадре, восемь соседних — ради стыка. Тень от
    # камня у левого края приходит от копии справа, и шва не остаётся.
    for kind, i, x, y in seeds:
        for ox in (-TILE, 0.0, TILE):
            for oy in (-depth, 0.0, depth):
                if abs(ox) + abs(oy) > 0 and _far(kind, x + ox, y + oy, depth):
                    continue
                parts.append(_piece(ctx, mats, kind, i, x + ox, y + oy))
    return parts


def _far(kind: str, x: float, y: float, depth: float) -> bool:
    """Копия далеко за кадром — не строим её вовсе: тайл и так на тысячу тел."""
    margin = TILE * 0.10
    return abs(x) > TILE / 2 + margin or abs(y) > depth / 2 + margin


def _piece(ctx, mats, kind: str, i: int, x: float, y: float):
    seed = ctx.seed
    if kind == "swell":
        # Пологая линза земли. Даёт крупное пятно светотени, которого не
        # получить заливкой: у неё нет ни формы, ни склона к солнцу.
        radius = TILE * (0.060 + 0.070 * unit(seed, f"sw.r{i}"))
        # Много граней и мало высоты: на десяти гранях по краю линзы читались
        # дуги многоугольника, и вместо мягкого пятна выходил венчик.
        obj = shapes.new_object(
            f"swell{i}",
            solids.dome(radius, radius, radius * 0.055, sides=26, rows=3),
            mats["grass"], ctx.body,
        )
        shapes.move(obj, x, y, -radius * 0.012)
        return obj

    if kind == "pebble":
        size = TILE * (0.0032 + 0.0052 * unit(seed, f"pb.s{i}"))
        material = mats["stoneA"] if unit(seed, f"pb.m{i}") < 0.62 else mats["stoneB"]
        obj = shapes.new_object(
            f"pebble{i}",
            solids.shard(size, size * 0.72, 6, seed + i, f"pbs{i}"),
            material, ctx.body,
        )
        shapes.bevel(obj, size * 0.14)
        shapes.turn(obj, 360.0 * unit(seed, f"pb.r{i}"), "Z")
        shapes.move(obj, x, y, -size * 0.30)
        return obj

    height = TILE * (0.008 + 0.010 * unit(seed, f"tf.h{i}"))
    material = mats["foliage"] if unit(seed, f"tf.m{i}") < 0.6 else mats["foliageDark"]
    obj = shapes.new_object(
        f"tuft{i}",
        solids.slab(height * 0.42, height * 0.42, height,
                    top_scale=(0.18, 0.18), shift=(height * 0.34 * jitter(seed, f"tf.l{i}"), 0)),
        material, ctx.body,
    )
    shapes.turn(obj, 360.0 * unit(seed, f"tf.r{i}"), "Z")
    shapes.move(obj, x, y, -height * 0.10)
    return obj
