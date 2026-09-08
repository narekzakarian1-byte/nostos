"""Растительность: то, чем набирается вертикаль и живость острова.

Дерево в этой камере — главный вертикальный ритм: колонна стоит там, где её
поставил архитектор, а дерево можно поставить где угодно, и именно оно не даёт
кадру растечься в плоское поле.

Крона собирается из ГРАНЁНЫХ комков, а не из шума и не из отдельных листьев.
Причина техническая и не обсуждается: объект живёт на экране в 100–200 пикселей,
и любая листва мельче фаски превращается в кашу, которая ещё и рендерится
минутами. Комок ловит свет плоскостями и читается кроной на любом размере.

Все размеры — в модульных единицах фигуры (figure.HEIGHT = 10 — рост человека),
поэтому дерево в 22 единицы это дерево вдвое выше человека.
"""

from __future__ import annotations

import math

from . import shapes, solids
from .variants import jitter, unit


def _clump(coll, material, at, radius, height, sides, seed, key, squash=1.0):
    obj = shapes.new_object(
        f"clump.{key}",
        solids.shard(radius, height, sides, seed, key),
        material, coll,
    )
    obj.scale = (1.0, squash, 1.0)
    shapes.move(obj, at[0], at[1], at[2])
    shapes.turn(obj, 360.0 * unit(seed, f"{key}.spin"), "Z")
    shapes.bevel(obj, radius * 0.10)
    return obj


def trunk(coll, material, height, radius, seed, key="trunk", bend=0.0, sides=9):
    """Ствол с изгибом и утолщением у корня. Прямая труба читается столбом."""
    profile = []
    steps = 5
    for i in range(steps + 1):
        t = i / steps
        r = radius * (1.0 + 0.62 * (1.0 - t) ** 2.2)
        profile.append((r, r * 0.92, height * t))
    obj = shapes.new_object(
        key, solids.loft(profile, sides, seed=seed, wobble=0.10), material, coll,
    )
    if bend:
        shapes.turn(obj, bend, "Y")
    shapes.bevel(obj, radius * 0.14)
    return obj


def cypress(coll, mats, seed, height=24.0):
    """Кипарис: узкая тёмная свеча. Единственный объект острова, который выше
    ворот и уже колонны, — на нём и держится вертикаль кадра."""
    parts = []
    dark = mats["foliageDark"]
    stem = trunk(coll, mats["wood"], height * 0.22, height * 0.030, seed, "cyp.trunk")
    parts.append(stem)

    tiers = 6
    for i in range(tiers):
        t = i / (tiers - 1)
        z = height * (0.14 + 0.78 * t)
        radius = height * (0.132 - 0.088 * t) * (1.0 + 0.10 * jitter(seed, f"cyp.r{i}"))
        parts.append(_clump(
            coll, dark,
            (height * 0.012 * jitter(seed, f"cyp.x{i}"), height * 0.010 * jitter(seed, f"cyp.y{i}"), z),
            radius, height * 0.26, 8, seed, f"cyp{i}", squash=0.94,
        ))
    tip = shapes.new_object(
        "cyp.tip", solids.cone(height * 0.042, height * 0.16, sides=7, top=0.004), dark, coll,
    )
    shapes.move(tip, dz=height * 0.90)
    parts.append(tip)
    return parts


def olive(coll, mats, seed, height=17.0):
    """Олива: кривой раздвоенный ствол и рыхлая серо-зелёная крона.

    Раздвоение обязательно. Одноствольная олива читается яблоней; именно
    вилка у корня и делает силуэт средиземноморским.
    """
    parts = []
    wood = mats["wood"]
    leaf = mats["foliage"]

    base = trunk(coll, wood, height * 0.30, height * 0.052, seed, "ol.base")
    parts.append(base)
    for side, lean in ((-1, -19.0), (1, 15.0)):
        limb = trunk(
            coll, wood, height * 0.34, height * 0.036, seed + side, f"ol.limb{side}",
            bend=lean, sides=8,
        )
        shapes.move(limb, dx=side * height * 0.020, dz=height * 0.27)
        parts.append(limb)

    for i in range(5):
        a = 2.0 * math.pi * i / 5.0 + 0.7 * jitter(seed, f"ol.a{i}")
        dist = height * (0.10 + 0.09 * unit(seed, f"ol.d{i}"))
        parts.append(_clump(
            coll, leaf,
            (math.cos(a) * dist, math.sin(a) * dist * 0.8,
             height * (0.52 + 0.16 * unit(seed, f"ol.z{i}"))),
            height * (0.17 + 0.05 * unit(seed, f"ol.r{i}")),
            height * 0.30, 9, seed, f"ol{i}", squash=0.88,
        ))
    return parts


def pine(coll, mats, seed, height=26.0):
    """Пиния: голый ствол и плоский зонт наверху. Ландмарк-дерево.

    Зонт кладётся плоскими комками одним ярусом: у пинии крона именно шляпка, и
    любой конус превращает её в ёлку.
    """
    parts = []
    stem = trunk(coll, mats["wood"], height * 0.62, height * 0.036, seed, "pin.trunk", bend=4.0)
    parts.append(stem)
    for i in range(6):
        a = 2.0 * math.pi * i / 6.0 + 0.5 * jitter(seed, f"pin.a{i}")
        dist = height * (0.13 + 0.08 * unit(seed, f"pin.d{i}"))
        parts.append(_clump(
            coll, mats["foliageDark"],
            (math.cos(a) * dist, math.sin(a) * dist * 0.75,
             height * (0.60 + 0.08 * unit(seed, f"pin.z{i}"))),
            height * (0.15 + 0.05 * unit(seed, f"pin.r{i}")),
            height * 0.20, 8, seed, f"pin{i}", squash=0.80,
        ))
    return parts


def shrub(coll, mats, seed, height=5.4, material="foliage"):
    """Куст: два-три комка у земли. Основная мелочь острова."""
    parts = []
    for i in range(3):
        a = 2.0 * math.pi * i / 3.0 + jitter(seed, f"sh.a{i}")
        dist = height * 0.22 * unit(seed, f"sh.d{i}")
        parts.append(_clump(
            coll, mats[material],
            (math.cos(a) * dist, math.sin(a) * dist * 0.8, height * 0.10 * i),
            height * (0.42 - 0.07 * i), height * 0.72, 8, seed, f"sh{i}", squash=0.82,
        ))
    return parts


def vine_row(coll, mats, seed, height=9.0, span=13.0, posts=4):
    """Шпалера с лозой: столбы, перекладина и гроздья.

    Ряд, а не отдельный куст: виноградник узнаётся ритмом столбов, и три
    поставленные подряд шпалеры читаются террасой.
    """
    parts = []
    wood = mats["wood"]
    step = span / (posts - 1)
    for i in range(posts):
        x = -span / 2.0 + step * i
        post = shapes.new_object(
            f"post{i}",
            solids.slab(height * 0.075, height * 0.075,
                        height * (0.86 + 0.10 * unit(seed, f"vp{i}"))),
            wood, coll,
        )
        shapes.turn(post, 3.0 * jitter(seed, f"vt{i}"), "Y")
        shapes.move(post, dx=x)
        shapes.bevel(post, height * 0.014)
        parts.append(post)

    rail = shapes.new_object(
        "rail",
        solids.slab(span + height * 0.10, height * 0.055, height * 0.055, at=(0, 0, height * 0.84)),
        wood, coll,
    )
    shapes.bevel(rail, height * 0.012)
    parts.append(rail)

    for i in range(9):
        t = i / 8.0
        x = -span / 2.0 + span * t + height * 0.05 * jitter(seed, f"vl{i}")
        parts.append(_clump(
            coll, mats["foliage"],
            (x, height * 0.03 * jitter(seed, f"vy{i}"), height * (0.62 + 0.16 * unit(seed, f"vz{i}"))),
            height * (0.17 + 0.05 * unit(seed, f"vr{i}")), height * 0.34, 8, seed, f"vine{i}",
            squash=0.7,
        ))
    for i in range(4):
        x = -span / 2.0 + span * (0.18 + 0.22 * i)
        bunch = shapes.new_object(
            f"grape{i}",
            solids.shard(height * 0.075, height * 0.20, 7, seed + i, f"gr{i}"),
            mats["grape"], coll,
        )
        shapes.turn(bunch, 180.0, "X")
        shapes.move(bunch, x, -height * 0.05, height * 0.72)
        parts.append(bunch)
    return parts


def reeds(coll, mats, seed, height=6.0, count=11):
    """Пучок сухой травы. Самый дешёвый способ занять пустое место у воды."""
    parts = []
    for i in range(count):
        a = 2.0 * math.pi * unit(seed, f"rd.a{i}")
        dist = height * 0.16 * math.sqrt(unit(seed, f"rd.d{i}"))
        h = height * (0.55 + 0.45 * unit(seed, f"rd.h{i}"))
        stalk = shapes.new_object(
            f"reed{i}",
            solids.slab(height * 0.035, height * 0.035, h, at=(0, 0, 0),
                        top_scale=(0.15, 0.15), shift=(height * 0.14 * jitter(seed, f"rd.l{i}"), 0)),
            mats["foliageDry"], coll,
        )
        shapes.move(stalk, math.cos(a) * dist, math.sin(a) * dist * 0.8, 0.0)
        parts.append(stalk)
    return parts
