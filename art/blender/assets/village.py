"""Обжитое Исмары: хижины, частокол, телега, утварь, костёр, давильня.

Целая и сгоревшая хижина — одна функция с флагом (lib/rustic.hut). Это не
экономия строк: разорённая деревня читается как разорённая только тогда, когда
видно, ЧТО именно сгорело, а для этого целый дом и обугленный обязаны быть
одним домом.
"""

from __future__ import annotations

import math

from lib import materials, optics, rustic, shapes, solids

KIND = "props"
VERSION = 1
VARIANTS = [
    "prop-hut", "prop-hut-burnt", "prop-palisade", "prop-cart",
    "prop-crates", "prop-campfire", "prop-amphora", "prop-press", "prop-shards",
]

MATS = ["clay", "wood", "woodDark", "thatch", "ash", "stone", "ember", "voidDark", "grape"]


def build(ctx, variant: str):
    mats = materials.library(MATS, seed=ctx.seed)
    size = optics.props()["sizes"][variant]["value"]
    seed = ctx.seed

    if variant == "prop-hut":
        return rustic.hut(ctx.body, mats, seed, width=size * 0.072, burnt=False)
    if variant == "prop-hut-burnt":
        return rustic.hut(ctx.body, mats, seed + 4, width=size * 0.076, burnt=True)
    if variant == "prop-palisade":
        return rustic.palisade(ctx.body, mats, seed,
                               span=size * 0.105, height=size * 0.058, burnt=True)
    if variant == "prop-cart":
        return rustic.cart(ctx.body, mats, seed, length=size * 0.155)
    if variant == "prop-crates":
        return _crates(ctx, mats, seed, size)
    if variant == "prop-campfire":
        return rustic.brazier(ctx.body, mats, seed, height=size * 0.115)
    if variant == "prop-amphora":
        return rustic.amphora(ctx.body, mats, seed, height=size * 0.215)
    if variant == "prop-press":
        return _press(ctx, mats, seed, size)
    if variant == "prop-shards":
        # Осколки посуды кладутся ТЁМНЫМ тоном глины, а не средним. На среднем
        # они выходили ярко-рыжими шестиугольниками и читались опавшей листвой:
        # черепок на земле — это тень битой посуды, а не свежий горшок.
        from lib import materials as _m, rock
        clay = _m.from_tone("clay", 2, seed=seed + 9)
        return rock.slabs(ctx.body, clay, seed,
                          count=8, spread=size * 0.105, size=size * 0.052)
    raise KeyError(variant)


def _crates(ctx, mats, seed, size):
    """Стопка из трёх ящиков. Стопка, а не один: у груза должна быть высота."""
    parts = []
    unit = size * 0.075
    for i, (dx, dy, dz, s) in enumerate((
        (0.0, 0.0, 0.0, 1.0), (unit * 0.82, -unit * 0.20, 0.0, 0.86),
        (unit * 0.16, unit * 0.10, unit * 0.78, 0.78),
    )):
        box = rustic.crate(ctx.body, mats, seed + i, size=unit * s)
        for obj in box:
            shapes.move(obj, dx, dy, dz)
        parts += box
    return parts


def _press(ctx, mats, seed, size):
    """Давильня: каменная чаша, брус рычага и амфора под сливом."""
    unit = size * 0.115
    parts = []
    basin = shapes.new_object(
        "press.basin",
        solids.loft([(unit * 1.25, unit * 1.05, 0.0), (unit * 1.32, unit * 1.12, unit * 0.52),
                     (unit * 1.18, unit * 0.98, unit * 0.62)], 12),
        mats["stone"], ctx.body,
    )
    shapes.bevel(basin, unit * 0.07)
    parts.append(basin)

    must = shapes.new_object(
        "press.must",
        solids.loft([(unit * 1.06, unit * 0.88, unit * 0.50), (unit * 1.06, unit * 0.88, unit * 0.54)], 12),
        mats["grape"], ctx.body,
    )
    parts.append(must)

    post = shapes.new_object(
        "press.post",
        solids.slab(unit * 0.30, unit * 0.30, unit * 2.10, at=(-unit * 1.35, unit * 0.30, 0)),
        mats["wood"], ctx.body,
    )
    shapes.bevel(post, unit * 0.05)
    parts.append(post)

    beam = shapes.new_object(
        "press.beam",
        solids.slab(unit * 3.10, unit * 0.34, unit * 0.30),
        mats["wood"], ctx.body,
    )
    shapes.turn(beam, -14.0, "Y")
    shapes.move(beam, unit * 0.10, unit * 0.30, unit * 1.72)
    shapes.bevel(beam, unit * 0.05)
    parts.append(beam)

    parts += rustic.amphora(ctx.body, mats, seed + 2, height=unit * 1.05)
    for obj in parts[-4:]:
        shapes.move(obj, unit * 1.62, -unit * 0.42, 0.0)
    return parts
