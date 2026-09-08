"""Камень обработанный: колонна, обломок, барабан, алтарь, стела, ворота.

Всё это дорийский ордер из lib/greek.py с разными числами — то самое место,
ради которого библиотека и заводилась: каждый следующий кусок архитектуры
дешевле предыдущего (ART_PIPELINE.md §13).

Пропорции строятся с поправкой на проекцию: при наклоне камеры 55° высота
сжимается до 0.574, а глубина только до 0.819. Построенная «правильно» колонна
на экране превращается в пенёк, поэтому стволы здесь заведомо длиннее
канонических, а глубина строений заведомо мала.
"""

from __future__ import annotations

import math

from lib import damage, greek, materials, optics, shapes, solids
from lib.variants import jitter, unit

KIND = "props"
VERSION = 1
VARIANTS = [
    "prop-column", "prop-column-broken", "prop-drum",
    "prop-altar", "prop-stele", "prop-gate",
]

MATS = ["marble", "limestone", "rubble", "patina", "ember", "foliageDry", "woodDark"]


def build(ctx, variant: str):
    mats = materials.library(MATS, seed=ctx.seed)
    size = optics.props()["sizes"][variant]["value"]
    seed = ctx.seed
    body = ctx.body

    if variant == "prop-column":
        unit_h = size * 0.048
        parts, _ = greek.column(body, mats["marble"], unit_h * 5.6, unit_h * 0.40, seed=seed)
        damage.chip(parts[0], ctx.helpers, seed + 2, count=2, size=0.22)
        damage.weather(parts[0], seed + 3, amount=0.008)
        parts += _tufts(body, mats, seed, unit_h * 0.32, count=3, spread=unit_h * 0.9)
        return parts

    if variant == "prop-column-broken":
        unit_h = size * 0.115
        stump, _ = greek.broken_column(body, mats["marble"], unit_h * 2.4, unit_h * 0.42, seed=seed)
        damage.chip(stump, ctx.helpers, seed + 5, count=2, size=0.26)
        parts = [stump]
        parts += damage.rubble(body, mats["limestone"], seed + 7,
                               count=6, spread=unit_h * 0.9, size=unit_h * 0.20,
                               at=(unit_h * 0.5, -unit_h * 0.3))
        return parts

    if variant == "prop-drum":
        unit_w = size * 0.30
        return [greek.drum(body, mats["marble"], unit_w * 0.46, unit_w * 1.05, seed=seed)]

    if variant == "prop-altar":
        return _altar(ctx, mats, seed, size)

    if variant == "prop-stele":
        return _stele(ctx, mats, seed, size)

    if variant == "prop-gate":
        return _gate(ctx, mats, seed, size)
    raise KeyError(variant)


def _tufts(body, mats, seed, height, count, spread):
    """Сухая трава в швах. Растёт в тени и в трещинах, а не на солнце —
    поэтому сеется только по левой стороне: солнце идёт справа-сверху."""
    out = []
    for i in range(count):
        x = -spread + spread * 0.7 * unit(seed, f"tuft.x{i}")
        tuft = shapes.new_object(
            f"tuft{i}",
            solids.slab(height * 0.24, height * 0.24, height * (0.7 + 0.6 * unit(seed, f"t{i}")),
                        top_scale=(0.16, 0.16), shift=(height * 0.3 * jitter(seed, f"tl{i}"), 0)),
            mats["foliageDry"], body,
        )
        shapes.move(tuft, x, -spread * 0.35 * unit(seed, f"tuft.y{i}"), 0.0)
        out.append(tuft)
    return out


def _altar(ctx, mats, seed, size):
    """Алтарь: ступень, тумба, карниз и огонь. Единственный тёплый источник
    света в холодной верхней зоне острова."""
    unit_w = size * 0.115
    body = ctx.body
    parts = []
    steps, top = greek.stylobate(body, mats["limestone"],
                                width=unit_w * 3.4, depth=unit_w * 2.2,
                                steps=2, rise=unit_w * 0.28, run=unit_w * 0.22)
    parts += steps
    block = shapes.new_object(
        "altar.block",
        solids.slab(unit_w * 2.7, unit_w * 1.7, unit_w * 1.9, at=(0, 0, top),
                    top_scale=(0.94, 0.94)),
        mats["marble"], body,
    )
    shapes.bevel(block, unit_w * 0.10, segments=2)
    damage.chip(block, ctx.helpers, seed + 3, count=2, size=0.16)
    parts.append(block)

    cap = greek.cornice(body, mats["marble"], unit_w * 3.1, unit_w * 2.0, unit_w * 0.46,
                        name="altar.cap")
    for obj in cap:
        shapes.move(obj, dz=top + unit_w * 1.9)
    parts += cap

    for i in range(4):
        coal = shapes.new_object(
            f"altar.fire{i}",
            solids.cone(unit_w * (0.30 - 0.05 * i), unit_w * (0.5 + 0.25 * i), sides=6, top=0.01),
            mats["ember"], body,
        )
        shapes.move(coal, unit_w * 0.20 * jitter(seed, f"f{i}"),
                    unit_w * 0.16 * jitter(seed, f"g{i}"), top + unit_w * 2.34)
        parts.append(coal)
    return parts


def _stele(ctx, mats, seed, size):
    """Надгробная стела: плита с фронтоном и вырезанной полосой рельефа."""
    unit_h = size * 0.082
    body = ctx.body
    base = shapes.new_object(
        "stele.base",
        solids.slab(unit_h * 2.2, unit_h * 1.3, unit_h * 0.5),
        mats["limestone"], body,
    )
    shapes.bevel(base, unit_h * 0.09)

    slabm = shapes.new_object(
        "stele.slab",
        solids.slab(unit_h * 1.6, unit_h * 0.62, unit_h * 8.4, at=(0, 0, unit_h * 0.45),
                    top_scale=(0.94, 1.0)),
        mats["marble"], body,
    )
    shapes.bevel(slabm, unit_h * 0.10, segments=2)
    damage.chip(slabm, ctx.helpers, seed + 1, count=2, size=0.16)
    damage.lean(slabm, seed, degrees=4.0)

    crown = shapes.new_object(
        "stele.crown",
        solids.slab(unit_h * 1.9, unit_h * 0.72, unit_h * 0.60, at=(0, 0, unit_h * 8.7),
                    top_scale=(0.55, 0.9)),
        mats["marble"], body,
    )
    shapes.bevel(crown, unit_h * 0.09)

    band = shapes.new_object(
        "stele.band",
        solids.slab(unit_h * 1.42, unit_h * 0.12, unit_h * 1.5,
                    at=(0, -unit_h * 0.34, unit_h * 4.9)),
        mats["patina"], body,
    )
    shapes.bevel(band, unit_h * 0.05)
    return [base, slabm, crown, band]


def _gate(ctx, mats, seed, size):
    """Ворота святилища: две опоры, архитрав из трёх блоков, правого нет.

    Отсутствующий блок и есть то, что делает ворота руиной, а не воротами.
    Он же объясняет кучу обломков у подножия: глазу видно, куда делся камень.
    """
    unit_h = size * 0.038
    body = ctx.body
    parts = []
    span = unit_h * 2.6
    radius = unit_h * 0.42

    steps, platform = greek.stylobate(
        body, mats["limestone"], width=span + radius * 4.0, depth=unit_h * 1.0,
        steps=3, rise=unit_h * 0.21, run=unit_h * 0.18,
    )
    damage.chip(steps[-1], ctx.helpers, seed + 11, count=2, size=0.16)
    parts += steps

    column_top = 0.0
    for side, x in ((0, -span / 2.0), (1, span / 2.0)):
        column, height = greek.column(body, mats["marble"], unit_h * 5.4, radius,
                                      seed=seed + side * 7, name=f"pier{side}")
        for obj in column:
            shapes.move(obj, dx=x, dz=platform)
            shapes.turn(obj, 1.3 * jitter(seed, f"lean{side}"), "Y")
        damage.chip(column[0], ctx.helpers, seed + 25 + side, count=2, size=0.28)
        damage.weather(column[0], seed + 30 + side, amount=0.009)
        parts += column
        column_top = platform + height

    total = span + radius * 4.0
    block_w = total / 3.0
    arch_h = unit_h * 0.55
    kept = []
    for i in range(2):
        x = -total / 2.0 + block_w * (i + 0.5)
        obj = greek.lintel(body, mats["marble"], block_w * 0.99, unit_h * 0.76, arch_h,
                           name=f"arch{i}")
        shapes.move(obj, dx=x, dz=column_top)
        shapes.turn(obj, 0.8 * jitter(seed, f"arch{i}"), "Y")
        kept.append(obj)
    damage.chip(kept[-1], ctx.helpers, seed + 41, count=3, size=0.30)
    parts += kept

    cornice = greek.cornice(body, mats["marble"], block_w * 1.98, unit_h * 0.88,
                            unit_h * 0.36, name="cornice")
    for obj in cornice:
        shapes.move(obj, dx=-total / 2.0 + block_w, dz=column_top + arch_h)
    parts += cornice

    fallen = greek.drum(body, mats["marble"], radius * 0.94, unit_h * 0.98, seed=seed + 60)
    shapes.move(fallen, dx=span / 2.0 + unit_h * 0.85, dy=-unit_h * 0.48)
    shapes.turn(fallen, 26.0 + 30.0 * jitter(seed, "drum"), "Z")
    parts.append(fallen)

    parts += damage.rubble(body, mats["limestone"], seed + 70, count=9,
                           spread=unit_h * 0.85, size=unit_h * 0.21,
                           at=(span / 2.0 + unit_h * 0.66, -unit_h * 0.30))
    parts += _tufts(body, mats, seed + 90, unit_h * 0.42, count=4, spread=span * 0.5)
    return parts
