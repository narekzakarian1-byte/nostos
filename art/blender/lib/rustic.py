"""Обжитое: то, что построили и бросили люди.

Отдельно от greek.py, где живёт ордер. Там канон и мрамор, здесь дерево,
солома, глина и брошенная утварь — вещи, по которым место читается жилым, а не
музейным. Разрушение накладывается сверху через damage.py: один и тот же дом
строится целым и сгоревшим одной функцией с флагом.
"""

from __future__ import annotations

import math

from . import damage, shapes, solids
from .variants import jitter, unit


def hut(coll, mats, seed, width=17.0, burnt=False):
    """Дом киконов: саманные стены и двускатная соломенная кровля.

    Дом ПРЯМОУГОЛЬНЫЙ, а не круглый, и это не про историю, а про камеру. При
    наклоне 55° зритель видит в основном крышу; у круглой хижины крыша —
    конус, и сверху он читается гладким куполом, ульем. У двускатной есть
    конёк — прямая линия через весь объект, — и она задаёт дому направление,
    по которому дом узнаётся домом.

    Сгоревший — тот же дом без кровли: обугленные стропила, обвалившийся угол
    и тёмное нутро. Одна функция с флагом намеренно: разорённая деревня
    читается разорённой, только когда видно, ЧТО именно сгорело.
    """
    parts = []
    depth = width * 0.72
    wall_h = width * 0.52
    wall_m = mats["ash"] if burnt else mats["clay"]

    wall = shapes.new_object(
        "hut.wall",
        solids.slab(width, depth, wall_h, top_scale=(0.98, 0.98)),
        wall_m, coll,
    )
    shapes.bevel(wall, width * 0.022, segments=2)
    if burnt:
        damage.chip(wall, coll, seed + 3, count=3, size=0.30)
    parts.append(wall)

    door = shapes.new_object(
        "hut.door",
        solids.slab(width * 0.24, width * 0.10, wall_h * 0.70,
                    at=(-width * 0.10, -depth * 0.48, 0)),
        mats["voidDark"], coll,
    )
    parts.append(door)

    lintel = shapes.new_object(
        "hut.lintel",
        solids.slab(width * 0.31, width * 0.14, wall_h * 0.09,
                    at=(-width * 0.10, -depth * 0.48, wall_h * 0.70)),
        mats["woodDark"] if burnt else mats["wood"], coll,
    )
    shapes.bevel(lintel, width * 0.010)
    parts.append(lintel)

    if burnt:
        # Стропила стоят домиком друг к другу: рухнувшая кровля — это не
        # отсутствие крыши, а её обломки на том месте, где она была.
        ridge = shapes.new_object(
            "hut.ridge",
            solids.slab(width * 0.86, width * 0.05, width * 0.05,
                        at=(0, 0, wall_h + width * 0.10)),
            mats["woodDark"], coll,
        )
        parts.append(ridge)
        for i in range(7):
            side = -1 if i % 2 else 1
            beam = shapes.new_object(
                f"hut.rafter{i}",
                solids.slab(width * 0.045, width * 0.045, width * (0.36 + 0.14 * unit(seed, f"rf{i}")),
                            top_scale=(0.7, 0.7)),
                mats["woodDark"], coll,
            )
            shapes.turn(beam, side * (58.0 + 14.0 * jitter(seed, f"rt{i}")), "X")
            shapes.move(beam, width * (-0.40 + 0.135 * i), side * depth * 0.22, wall_h * 0.92)
            parts.append(beam)
        parts.append(shapes.new_object(
            "hut.hollow",
            solids.slab(width * 0.84, depth * 0.62, width * 0.06,
                        at=(0, 0, wall_h - width * 0.05)),
            mats["voidDark"], coll,
        ))
        return parts

    parts += _thatch(coll, mats, seed, width, depth, wall_h)
    return parts


def _thatch(coll, mats, seed, width, depth, wall_h):
    """Двускатная кровля рядами снопов, а не одной плоскостью.

    Ряды обязательны. При наклоне камеры 55° крыша занимает бо́льшую часть
    объекта, и гладкий скат превращается в крашеный многоугольник: у него нет
    ни масштаба, ни материала. Три ряда с напуском дают две горизонтальные
    линии поперёк ската — по ним читается и солома, и размер дома.
    """
    material = mats["thatch"]
    height = width * 0.42
    tiers = 3
    parts = []

    for i in range(tiers):
        t0, t1 = i / tiers, (i + 1) / tiers
        # Напуск: низ ряда чуть шире, чем требует скат, — это и есть та кромка,
        # которая ловит свет и рисует линию.
        lip = 0.06 * (1.0 - t0)
        tier = shapes.new_object(
            f"hut.thatch{i}",
            solids.slab(
                width * (1.12 - 0.05 * t0), depth * (1.22 * (1.0 - t0) + lip),
                height / tiers,
                at=(0, 0, wall_h - width * 0.015 + height * t0),
                top_scale=(
                    (1.12 - 0.05 * t1) / (1.12 - 0.05 * t0),
                    (1.22 * (1.0 - t1) + 0.001) / (1.22 * (1.0 - t0) + lip),
                ),
            ),
            material, coll,
        )
        shapes.bevel(tier, width * 0.013, segments=2)
        parts.append(tier)

    ridge = shapes.new_object(
        "hut.ridgecap",
        solids.slab(width * 1.10, depth * 0.13, height * 0.14,
                    at=(0, 0, wall_h + height * 0.93), top_scale=(1.0, 0.45)),
        mats["woodDark"], coll,
    )
    shapes.bevel(ridge, width * 0.011)
    parts.append(ridge)
    return parts


def palisade(coll, mats, seed, span=22.0, height=11.0, burnt=False, posts=9):
    """Частокол: заострённые колья с продольной жердью.

    Ставится обломком, а не сплошной стеной: целая линия читается забором из
    настоящего времени, а по выбитым кольям видно, что здесь дрались.
    """
    parts = []
    wood = mats["woodDark"] if burnt else mats["wood"]
    step = span / (posts - 1)
    for i in range(posts):
        gone = burnt and unit(seed, f"pal.gone{i}") < 0.28
        h = height * (0.30 if gone else (0.82 + 0.22 * unit(seed, f"pal.h{i}")))
        x = -span / 2.0 + step * i
        post = shapes.new_object(
            f"pal.{i}",
            solids.loft([(height * 0.048, height * 0.044, 0.0),
                         (height * 0.044, height * 0.040, h * 0.86),
                         (height * 0.006, height * 0.006, h)], 7),
            wood, coll,
        )
        shapes.turn(post, 5.0 * jitter(seed, f"pal.t{i}"), "Y")
        shapes.turn(post, 4.0 * jitter(seed, f"pal.s{i}"), "X")
        shapes.move(post, x, height * 0.02 * jitter(seed, f"pal.y{i}"), 0.0)
        parts.append(post)

    rail = shapes.new_object(
        "pal.rail",
        solids.slab(span * 0.94, height * 0.045, height * 0.045, at=(0, height * 0.05, height * 0.52)),
        wood, coll,
    )
    shapes.bevel(rail, height * 0.010)
    parts.append(rail)
    return parts


def amphora(coll, mats, seed, height=6.4):
    """Амфора: тело, горло, две ручки. Мельчайший объект, у которого есть силуэт."""
    parts = []
    body = shapes.new_object(
        "amph.body",
        solids.loft(
            [(height * 0.055, height * 0.055, 0.0),
             (height * 0.10, height * 0.10, height * 0.10),
             (height * 0.235, height * 0.235, height * 0.44),
             (height * 0.185, height * 0.185, height * 0.70),
             (height * 0.085, height * 0.085, height * 0.84)],
            11,
        ),
        mats["clay"], coll,
    )
    shapes.bevel(body, height * 0.014)
    parts.append(body)

    neck = shapes.new_object(
        "amph.neck",
        solids.loft([(height * 0.075, height * 0.075, height * 0.82),
                     (height * 0.105, height * 0.105, height)], 10),
        mats["clay"], coll,
    )
    parts.append(neck)

    for side in (-1, 1):
        handle = shapes.new_object(
            f"amph.handle{side}",
            solids.slab(height * 0.05, height * 0.05, height * 0.22,
                        at=(side * height * 0.135, 0, height * 0.68),
                        shift=(-side * height * 0.055, 0.0)),
            mats["clay"], coll,
        )
        shapes.bevel(handle, height * 0.012)
        parts.append(handle)
    return parts


def brazier(coll, mats, seed, height=7.0, lit=True):
    """Костёр в каменном круге. Единственный источник тёплого света на карте."""
    parts = []
    for i in range(9):
        a = 2.0 * math.pi * i / 9.0
        stone = shapes.new_object(
            f"fire.ring{i}",
            solids.shard(height * 0.11, height * 0.16, 6, seed + i, f"fr{i}"),
            mats["stone"], coll,
        )
        shapes.bevel(stone, height * 0.02)
        shapes.move(stone, math.cos(a) * height * 0.44, math.sin(a) * height * 0.40, 0.0)
        parts.append(stone)

    for i in range(5):
        a = 2.0 * math.pi * i / 5.0 + 0.4 * jitter(seed, f"lg{i}")
        log = shapes.new_object(
            f"fire.log{i}",
            solids.loft([(height * 0.045, height * 0.045, 0.0),
                         (height * 0.035, height * 0.035, height * 0.42)], 6),
            mats["woodDark"], coll,
        )
        shapes.turn(log, 62.0, "Y")
        shapes.turn(log, math.degrees(a), "Z")
        shapes.move(log, math.cos(a) * height * 0.16, math.sin(a) * height * 0.14, height * 0.04)
        parts.append(log)

    if lit:
        for i in range(3):
            flame = shapes.new_object(
                f"fire.flame{i}",
                solids.cone(height * (0.13 - 0.03 * i), height * (0.30 + 0.14 * i), sides=6, top=0.01),
                mats["ember"], coll,
            )
            shapes.move(
                flame,
                height * 0.06 * jitter(seed, f"fl.x{i}"),
                height * 0.05 * jitter(seed, f"fl.y{i}"),
                height * (0.10 + 0.07 * i),
            )
            parts.append(flame)
    return parts


def cart(coll, mats, seed, length=13.0, broken=True):
    """Телега: кузов, оглобли, два колеса. Сломанная лежит на боку одним колесом."""
    parts = []
    wood = mats["wood"]
    bed = shapes.new_object(
        "cart.bed",
        solids.slab(length * 0.72, length * 0.40, length * 0.10, at=(0, 0, length * 0.20)),
        wood, coll,
    )
    shapes.bevel(bed, length * 0.012)
    parts.append(bed)

    for side in (-1, 1):
        wall = shapes.new_object(
            f"cart.side{side}",
            solids.slab(length * 0.72, length * 0.035, length * 0.16,
                        at=(0, side * length * 0.19, length * 0.28)),
            wood, coll,
        )
        shapes.bevel(wall, length * 0.010)
        parts.append(wall)

    for i, side in enumerate((-1, 1)):
        wheel = shapes.new_object(
            f"cart.wheel{i}",
            solids.loft([(length * 0.20, length * 0.20, 0.0), (length * 0.20, length * 0.20, length * 0.045)], 10),
            wood, coll,
        )
        shapes.turn(wheel, 90.0, "X")
        if broken and i == 0:
            shapes.turn(wheel, 68.0, "Y")
            shapes.move(wheel, -length * 0.42, side * length * 0.22, length * 0.05)
        else:
            shapes.move(wheel, length * 0.18, side * length * 0.21, length * 0.20)
        shapes.bevel(wheel, length * 0.012)
        parts.append(wheel)

    for side in (-1, 1):
        shaft = shapes.new_object(
            f"cart.shaft{side}",
            solids.slab(length * 0.52, length * 0.035, length * 0.035,
                        at=(length * 0.60, side * length * 0.12, length * 0.24)),
            wood, coll,
        )
        shapes.turn(shaft, -12.0 if broken else 0.0, "Y")
        shapes.bevel(shaft, length * 0.008)
        parts.append(shaft)
    return parts


def crate(coll, mats, seed, size=4.6):
    """Ящик. Ставится стопками у корабля и на рынке."""
    box = shapes.new_object(
        "crate",
        solids.slab(size, size * 0.86, size * 0.78, top_scale=(0.98, 0.98)),
        mats["wood"], coll,
    )
    shapes.bevel(box, size * 0.055, segments=2)
    shapes.turn(box, 360.0 * unit(seed, "crate.spin"), "Z")
    return [box]
