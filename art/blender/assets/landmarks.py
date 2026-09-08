"""Ландмарки Исмары: сожжённое святилище Аполлона и вытащенный на берег корабль.

Ландмарк — не «крупный проп». Это объект, по которому место узнаётся раньше,
чем прочитано название на карте, и который держит вертикаль кадра целиком.
Отсюда два правила, которых нет у прочих пропов.

Первое: ширина проверяется отдельно от высоты. При render.virtualWidth = 360
объект шире ~330 единиц перестаёт помещаться на экран, и игрок видит не храм, а
кусок стены.

Второе: у ландмарка обязана быть внятная асимметрия. Симметричный храм читается
как заставка, а не как развалина, в которой что-то произошло: правая половина
портика обрушена, и по ней видно, что здесь был пожар.
"""

from __future__ import annotations

import math

from lib import damage, greek, materials, optics, shapes, solids
from lib.variants import jitter, unit

KIND = "props"
VERSION = 1
VARIANTS = ["prop-temple", "prop-ship"]

MATS = ["marble", "limestone", "rubble", "wood", "woodDark", "ash",
        "patina", "crimson", "ember", "voidDark", "foliageDry", "bone"]


def build(ctx, variant: str):
    mats = materials.library(MATS, seed=ctx.seed)
    size = optics.props()["sizes"][variant]["value"]
    if variant == "prop-temple":
        return _temple(ctx, mats, ctx.seed, size)
    if variant == "prop-ship":
        return _ship(ctx, mats, ctx.seed, size)
    raise KeyError(variant)


def _temple(ctx, mats, seed, size):
    """Портик в четыре колонны; правая пара обрушена вместе с фронтоном."""
    u = size * 0.028
    body = ctx.body
    parts = []

    steps, platform = greek.stylobate(
        body, mats["limestone"], width=u * 9.4, depth=u * 3.4,
        steps=3, rise=u * 0.34, run=u * 0.30,
    )
    damage.chip(steps[-1], ctx.helpers, seed + 2, count=3, size=0.14)
    parts += steps

    # Задняя стена целлы: без неё портик читается забором из колонн.
    cella = shapes.new_object(
        "cella",
        solids.slab(u * 7.6, u * 1.5, u * 7.2, at=(0, u * 1.05, platform)),
        mats["limestone"], body,
    )
    shapes.bevel(cella, u * 0.14, segments=2)
    damage.chip(cella, ctx.helpers, seed + 4, count=3, size=0.20)
    parts.append(cella)

    door = shapes.new_object(
        "cella.door",
        solids.slab(u * 1.9, u * 0.5, u * 4.0, at=(0, u * 0.32, platform)),
        mats["voidDark"], body,
    )
    parts.append(door)

    # Пожар: копоть над дверью и угли на пороге. Единственная деталь, которая
    # говорит, что храм сожгли, а не что он просто старый.
    soot = shapes.new_object(
        "cella.soot",
        solids.slab(u * 2.9, u * 0.14, u * 2.6, at=(0, u * 0.30, platform + u * 4.0),
                    top_scale=(0.55, 1.0)),
        mats["ash"], body,
    )
    parts.append(soot)

    column_top = 0.0
    standing = (-1.5, -0.5)
    fallen = (0.5, 1.5)
    radius = u * 0.52
    for i, k in enumerate(standing):
        column, height = greek.column(body, mats["marble"], u * 6.6, radius,
                                      seed=seed + i * 7, name=f"col{i}")
        for obj in column:
            shapes.move(obj, dx=k * u * 2.5, dz=platform)
            shapes.turn(obj, 1.1 * jitter(seed, f"lean{i}"), "Y")
        damage.chip(column[0], ctx.helpers, seed + 20 + i, count=2, size=0.24)
        damage.weather(column[0], seed + 30 + i, amount=0.008)
        parts += column
        column_top = platform + height

    # Правая пара лежит: барабаны раскатились от места, где стояли колонны.
    for i, k in enumerate(fallen):
        for d in range(4):
            drum = greek.drum(body, mats["marble"], radius * 0.96, u * 1.35, seed=seed + i * 5 + d)
            shapes.turn(drum, 74.0 + 26.0 * jitter(seed, f"dr{i}{d}"), "Z")
            shapes.move(drum,
                        k * u * 2.5 + u * (0.5 + 1.15 * d) * (1 + 0.2 * jitter(seed, f"dx{i}{d}")),
                        -u * (0.4 + 0.55 * d), 0.0)
            parts.append(drum)

    # Архитрав и фронтон только над уцелевшей парой — обрыв по шву кладки.
    arch_w = u * 5.6
    arch = greek.lintel(body, mats["marble"], arch_w, u * 1.9, u * 0.70, name="arch")
    shapes.move(arch, dx=-u * 2.0, dz=column_top)
    damage.chip(arch, ctx.helpers, seed + 41, count=3, size=0.26)
    parts.append(arch)

    cornice = greek.cornice(body, mats["marble"], arch_w * 0.98, u * 2.2, u * 0.50, name="corn")
    for obj in cornice:
        shapes.move(obj, dx=-u * 2.0, dz=column_top + u * 0.70)
    parts += cornice

    # Фронтон одним клином. Стопка сужающихся плит, стоявшая здесь раньше,
    # читалась лестницей — а треугольник над колоннами это то единственное,
    # по чему греческий храм узнают силуэтом.
    tympanum = shapes.new_object(
        "pediment",
        solids.slab(arch_w * 0.96, u * 1.7, u * 1.75,
                    at=(-u * 2.0, 0, column_top + u * 1.20), top_scale=(0.06, 0.92)),
        mats["marble"], body,
    )
    shapes.bevel(tympanum, u * 0.10, segments=2)
    damage.chip(tympanum, ctx.helpers, seed + 44, count=2, size=0.20)
    parts.append(tympanum)

    parts += damage.rubble(body, mats["limestone"], seed + 70, count=14,
                           spread=u * 2.6, size=u * 0.36, at=(u * 3.4, -u * 1.4))
    parts += damage.rubble(body, mats["limestone"], seed + 80, count=6,
                           spread=u * 1.5, size=u * 0.26, at=(-u * 4.4, -u * 1.1))
    return parts


def _ship(ctx, mats, seed, size):
    """Пентеконтера, вытащенная носом на гальку: корпус, форштевень, мачта, вёсла.

    Стоит с креном. Корабль, ровно стоящий на киле посреди суши, читается
    макетом; крен в восемь градусов — это то, что делает его вытащенным.
    """
    u = size * 0.030
    body = ctx.body
    parts = []

    hull = shapes.new_object(
        "hull",
        solids.hull(length=u * 9.2, beam=u * 2.3, depth=u * 0.35, rise=u * 1.5),
        mats["wood"], body,
    )
    shapes.move(hull, dz=u * 1.15)
    shapes.bevel(hull, u * 0.09, segments=2)
    parts.append(hull)

    # Внутренность корпуса: тёмная плита по линии борта. Открытая лодка без неё
    # читается доской, потому что нутра не видно.
    inner = shapes.new_object(
        "hull.inner",
        solids.hull(length=u * 8.6, beam=u * 1.9, depth=u * 0.20, rise=u * 1.35),
        mats["woodDark"], body,
    )
    shapes.move(inner, dz=u * 1.24)
    parts.append(inner)

    # Форштевень и ахтерштевень: два загнутых бруса. По ним силуэт и читается
    # кораблём, а не лодкой — из всего судна это самая узнаваемая линия.
    for side, tilt in ((-1, 26.0), (1, -34.0)):
        for k in range(3):
            piece = shapes.new_object(
                f"stem{side}{k}",
                solids.slab(u * 0.34, u * 0.62, u * 1.05, top_scale=(0.9, 0.9)),
                mats["wood"], body,
            )
            shapes.turn(piece, tilt * (0.4 + 0.3 * k), "Y")
            shapes.move(piece, side * u * (4.05 + 0.30 * k), 0.0, u * (1.55 + 0.92 * k))
            shapes.bevel(piece, u * 0.07)
            parts.append(piece)

    mast = shapes.new_object(
        "mast",
        solids.loft([(u * 0.24, u * 0.24, u * 1.4), (u * 0.16, u * 0.16, u * 5.6)], 8),
        mats["wood"], body,
    )
    shapes.turn(mast, 8.0, "Y")
    shapes.bevel(mast, u * 0.05)
    parts.append(mast)

    yard = shapes.new_object(
        "yard",
        solids.slab(u * 3.6, u * 0.22, u * 0.22),
        mats["woodDark"], body,
    )
    shapes.turn(yard, 6.0, "Z")
    shapes.move(yard, u * 0.5, -u * 0.30, u * 4.7)
    parts.append(yard)

    # Щиты по борту: ряд круглых пятен вдоль корпуса. Ритм, который читается
    # издалека, — то же, что ряд столбов у виноградника.
    for i in range(6):
        x = -u * 3.1 + i * u * 1.24
        boss = shapes.new_object(
            f"shield{i}",
            solids.loft([(u * 0.50, u * 0.50, 0.0), (u * 0.52, u * 0.52, u * 0.14),
                         (u * 0.34, u * 0.34, u * 0.24)], 12),
            mats["patina"] if i % 2 else mats["crimson"], body,
        )
        shapes.turn(boss, -90.0, "X")
        shapes.move(boss, x, -u * 1.02, u * 2.05)
        parts.append(boss)

    # Вёсла свалены у борта — команда ушла, и это видно.
    for i in range(5):
        oar = shapes.new_object(
            f"oar{i}",
            solids.slab(u * 3.4, u * 0.14, u * 0.14),
            mats["wood"], body,
        )
        shapes.turn(oar, 8.0 * jitter(seed, f"oz{i}"), "Z")
        shapes.move(oar, u * (-1.2 + 0.7 * i), -u * (1.55 + 0.22 * i), u * (0.12 + 0.14 * i))
        parts.append(oar)

    for obj in parts:
        shapes.turn(obj, 8.0, "Y")
    return parts
