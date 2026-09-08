"""Оружие типа «club» — все пять ступеней редкости одним запуском.

Геометрия и материалы ступени лежат в lib/arms.py: ступени отличаются числами,
а не файлами, и держать под них пять почти одинаковых модулей значило бы
гарантировать расхождение между ними.
"""

from __future__ import annotations

from lib import arms, materials

KIND = "parts"
ID = "weapon-club"
VERSION = 1
VARIANTS = list(arms.RARITIES)


def variant_id(rarity: str) -> str:
    return f"{ID}-{rarity}"


def build(ctx, rarity: str):
    mats = materials.library(arms.materials_for(rarity), seed=ctx.seed)
    return arms.build("club", ctx.body, mats, rarity, ctx.seed)
