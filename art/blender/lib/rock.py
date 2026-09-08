"""Камень: валуны, скальные выходы, осыпь и плиты.

Камень в этой игре несёт две разные работы, и путать их нельзя.

ВАЛУН стоит и перекрывает — у него есть след, за ним прячется враг, он держит
вертикаль. Их мало.

ПЛИТА лежит плашмя и следа не имеет. В референсе таких плоских обломков по
десятку на экран: они набирают плотность земли, ничего не загораживая и не
споря за внимание с иконками над врагами. Это самый дешёвый объект в игре —
одна фаска и одна тень.
"""

from __future__ import annotations

import math

from . import shapes, solids
from .variants import jitter, unit


def boulder(coll, material, seed, size=7.0, key="rock"):
    """Валун: один гранёный ком, слегка вросший в землю.

    Вросший намеренно — идеально лежащий на плоскости камень читается
    положенным, а не пролежавшим тут века.
    """
    obj = shapes.new_object(
        key, solids.shard(size * 0.5, size * 0.86, 9, seed, key, lean=0.06), material, coll,
    )
    shapes.bevel(obj, size * 0.045, segments=2)
    shapes.turn(obj, 360.0 * unit(seed, f"{key}.spin"), "Z")
    shapes.move(obj, dz=-size * 0.10)
    return obj


def outcrop(coll, material, seed, width=26.0, height=17.0, count=5, key="crag"):
    """Скальная гряда: несколько плит, наклонённых в одну сторону.

    В одну сторону — потому что настоящая порода лежит пластами. Ком случайно
    повёрнутых камней читается кучей мусора, а не скалой.
    """
    parts = []
    for i in range(count):
        t = i / max(1, count - 1)
        h = height * (0.55 + 0.45 * math.sin(math.pi * (0.15 + 0.7 * t))) \
            * (1.0 + 0.14 * jitter(seed, f"{key}.h{i}"))
        w = width / count * (1.25 + 0.35 * unit(seed, f"{key}.w{i}"))
        obj = shapes.new_object(
            f"{key}.{i}",
            solids.shard(w * 0.5, h, 7, seed + i, f"{key}s{i}", lean=0.10),
            material, coll,
        )
        shapes.bevel(obj, w * 0.035, segments=2)
        shapes.turn(obj, -13.0 + 5.0 * jitter(seed, f"{key}.t{i}"), "Y")
        shapes.move(
            obj,
            -width / 2.0 + width * t + width * 0.05 * jitter(seed, f"{key}.x{i}"),
            width * 0.10 * jitter(seed, f"{key}.y{i}"),
            -h * 0.08,
        )
        parts.append(obj)
    return parts


def slabs(coll, material, seed, count=7, spread=7.0, size=2.4, key="slab"):
    """Плоские обломки, лежащие на земле. Плотность без перекрытия."""
    parts = []
    for i in range(count):
        a = 2.0 * math.pi * unit(seed, f"{key}.a{i}")
        dist = spread * math.sqrt(unit(seed, f"{key}.d{i}"))
        s = size * (0.55 + 0.75 * unit(seed, f"{key}.s{i}"))
        obj = shapes.new_object(
            f"{key}.{i}",
            solids.shard(s * 0.5, s * 0.19, 6, seed + i, f"{key}f{i}"),
            material, coll,
        )
        shapes.bevel(obj, s * 0.035)
        shapes.turn(obj, 360.0 * unit(seed, f"{key}.r{i}"), "Z")
        shapes.turn(obj, 6.0 * jitter(seed, f"{key}.t{i}"), "X")
        shapes.move(obj, math.cos(a) * dist, math.sin(a) * dist * 0.75, 0.0)
        parts.append(obj)
    return parts


def scree(coll, material, seed, count=12, spread=5.0, size=1.1, key="scree"):
    """Осыпь мелкой гальки у подножия. Объясняет, откуда взялся скол."""
    parts = []
    for i in range(count):
        a = 2.0 * math.pi * unit(seed, f"{key}.a{i}")
        dist = spread * math.sqrt(unit(seed, f"{key}.d{i}"))
        s = size * (0.5 + unit(seed, f"{key}.s{i}"))
        obj = shapes.new_object(
            f"{key}.{i}",
            solids.shard(s * 0.5, s * 0.7, 6, seed + i, f"{key}p{i}"),
            material, coll,
        )
        shapes.bevel(obj, s * 0.06)
        shapes.turn(obj, 360.0 * unit(seed, f"{key}.r{i}"), "Z")
        shapes.move(obj, math.cos(a) * dist, math.sin(a) * dist * 0.7, -s * 0.12)
        parts.append(obj)
    return parts


def cave_mouth(coll, mats, seed, width=26.0, height=20.0):
    """Вход в пещеру: скала с чёрным зевом. Чернота — материал, а не дыра.

    Дыру в геометрии камера бы просветила насквозь, и на её месте оказалась бы
    трава. Тёмная плита за аркой читается глубиной надёжнее любого выреза.
    """
    parts = []
    stone = mats["stone"]

    # Тьма ставится ПЕРЕД камнем, а не за ним: за жамбами её съедала скала, и
    # вход читался серым комком без входа.
    void = shapes.new_object(
        "cave.void",
        solids.slab(width * 0.50, width * 0.30, height * 0.66, at=(0, -width * 0.10, 0),
                    top_scale=(0.62, 1.0)),
        mats["voidDark"], coll,
    )
    parts.append(void)

    for side in (-1, 1):
        jamb = shapes.new_object(
            f"cave.jamb{side}",
            solids.shard(width * 0.24, height * (0.86 + 0.10 * unit(seed, f"cv{side}")),
                         8, seed + side, f"cvj{side}", lean=side * 0.05),
            stone, coll,
        )
        shapes.bevel(jamb, width * 0.02, segments=2)
        shapes.move(jamb, side * width * 0.42, width * 0.04, -height * 0.05)
        parts.append(jamb)

    brow = shapes.new_object(
        "cave.brow",
        solids.shard(width * 0.40, height * 0.34, 9, seed + 7, "cvb"),
        stone, coll,
    )
    shapes.bevel(brow, width * 0.02, segments=2)
    shapes.move(brow, 0.0, width * 0.06, height * 0.56)
    parts.append(brow)

    parts += scree(coll, mats["rubble"], seed + 11, count=9, spread=width * 0.42,
                   size=width * 0.07, key="cave.scree")
    return parts
