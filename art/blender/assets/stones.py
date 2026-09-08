"""Камень Исмары: валун, галька, плиты, гряда, вход в пещеру.

Плиты (prop-slabs) — самый дешёвый объект в игре и самый нужный. Они лежат
плашмя, следа не имеют и ничего не загораживают, но именно ими набирается
плотность земли: в референсе таких плоских обломков по десятку на экран.
Без них остров либо пустой, либо заставлен тем, что перекрывает бой.
"""

from __future__ import annotations

from lib import materials, optics, rock

KIND = "props"
VERSION = 1
VARIANTS = ["prop-rock", "prop-rock-small", "prop-slabs", "prop-crag", "prop-cave"]

MATS = ["stone", "rubble", "voidDark", "foliageDry"]


def build(ctx, variant: str):
    mats = materials.library(MATS, seed=ctx.seed)
    size = optics.props()["sizes"][variant]["value"]
    seed = ctx.seed

    if variant == "prop-rock":
        return [rock.boulder(ctx.body, mats["stone"], seed, size=size * 0.13)]
    if variant == "prop-rock-small":
        return [rock.boulder(ctx.body, mats["rubble"], seed + 3, size=size * 0.30)]
    if variant == "prop-slabs":
        return rock.slabs(ctx.body, mats["rubble"], seed,
                          count=6, spread=size * 0.075, size=size * 0.055)
    if variant == "prop-crag":
        parts = rock.outcrop(ctx.body, mats["stone"], seed,
                             width=size * 0.088, height=size * 0.062, count=5)
        parts += rock.scree(ctx.body, mats["rubble"], seed + 5,
                            count=10, spread=size * 0.050, size=size * 0.011)
        return parts
    if variant == "prop-cave":
        return rock.cave_mouth(ctx.body, mats, seed, width=size * 0.086, height=size * 0.068)
    raise KeyError(variant)
