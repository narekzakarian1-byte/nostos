"""Оружие: три вида по пять ступеней редкости.

Оружие множит стат атаки, и разрыв между обычным и золотым больше чем вчетверо
(CLAUDE.md §4). Если все пять ступеней выглядят одинаково, самый крупный прыжок
силы в игре не виден на фигуре вообще. Поэтому редкость меняет не только
материал, но и ГЕОМЕТРИЮ: у копья появляются крылья, у меча — навершие и
широкое лезвие, у палицы — шипы и оковка.

Строится в тех же модульных единицах, что фигура (figure.HEIGHT = 10), рукоятью
в начале координат и остриём вверх: пивот картинки — точка хвата, а поворот
кисти задаёт игра (balance.anim.strokes.weaponGripDeg).
"""

from __future__ import annotations

import math

from . import figure, shapes, solids
from .variants import jitter

# Ступени по порядку. Индекс — это и есть «насколько богато».
RARITIES = ["common", "uncommon", "rare", "epic", "legendary"]

# Оружие строится заведомо ШИРЕ настоящего. Меч в руке фигуры высотой 92
# единицы занимает на экране около сорока, и анатомически верный клинок
# шириной в одну шестую длины превращается в шестипиксельную полоску — то есть
# в царапину поверх фигуры. Ширина в треть длины читается мечом.

# Материал клинка и оправы по ступени. Обычное — железо в дереве, золотое —
# золото с углями: цвет ступени читается раньше формы.
BLADE_MAT = ["iron", "bronze", "bronze", "iron", "gold"]
TRIM_MAT = ["wood", "wood", "patina", "gold", "ember"]
GRIP_MAT = ["wood", "wood", "woodDark", "woodDark", "crimson"]


def _rank(rarity: str) -> int:
    return RARITIES.index(rarity)


def materials_for(rarity: str) -> list[str]:
    r = _rank(rarity)
    return sorted({BLADE_MAT[r], TRIM_MAT[r], GRIP_MAT[r], "wood", "iron"})


def sword(coll, mats: dict, rarity: str, seed: int) -> list:
    """Ксифос: прямой лист. К золотой ступени лезвие шире и с долом."""
    r = _rank(rarity)
    blade_m, trim_m, grip_m = mats[BLADE_MAT[r]], mats[TRIM_MAT[r]], mats[GRIP_MAT[r]]
    parts = []

    grip_h = 0.74 + 0.04 * r
    guard_z = grip_h + 0.10

    handle = shapes.new_object(
        "grip",
        solids.loft([(0.11, 0.10, 0.0), (0.10, 0.09, grip_h * 0.5), (0.12, 0.11, grip_h)], 8),
        grip_m, coll,
    )
    parts.append(handle)

    pommel = shapes.new_object(
        "pommel",
        solids.dome(0.19 + 0.02 * r, 0.17, 0.20, sides=8, rows=2),
        trim_m, coll,
    )
    shapes.turn(pommel, 180.0, "X")
    parts.append(pommel)

    guard = shapes.new_object(
        "guard",
        solids.slab(0.94 + 0.18 * r, 0.24, 0.18, at=(0, 0, grip_h)),
        trim_m, coll,
    )
    shapes.bevel(guard, 0.04)
    parts.append(guard)

    length = 3.45 + 0.22 * r
    width = 0.96 + 0.13 * r
    edge = shapes.new_object(
        "blade",
        solids.blade(length, width, 0.17 + 0.015 * r, tip=0.10, segments=7),
        blade_m, coll,
    )
    shapes.move(edge, dz=guard_z)
    shapes.bevel(edge, 0.03)
    parts.append(edge)

    # Дол на клинке от синей ступени: узкая тёмная канавка делит лезвие надвое,
    # и меч перестаёт быть одной плоской заливкой.
    if r >= 2:
        fuller = shapes.new_object(
            "fuller",
            solids.slab(width * 0.24, 0.20, length * 0.72, at=(0, -0.075, guard_z + 0.14)),
            trim_m, coll,
        )
        parts.append(fuller)
    return parts


def spear(coll, mats: dict, rarity: str, seed: int) -> list:
    """Дори: древко, наконечник, пятка. Длина почти в рост — по ней вид и узнают."""
    r = _rank(rarity)
    blade_m, trim_m, grip_m = mats[BLADE_MAT[r]], mats[TRIM_MAT[r]], mats[GRIP_MAT[r]]
    parts = []

    shaft_h = 6.80
    shaft = shapes.new_object(
        "shaft",
        solids.loft([(0.095, 0.09, -1.60), (0.085, 0.08, shaft_h)], 8),
        mats["wood"], coll,
    )
    parts.append(shaft)

    butt = shapes.new_object(
        "sauroter",
        solids.cone(0.13, 0.42, sides=8, top=0.02),
        trim_m, coll,
    )
    shapes.turn(butt, 180.0, "X")
    shapes.move(butt, dz=-1.60)
    parts.append(butt)

    wrap = shapes.new_object(
        "wrap",
        solids.loft([(0.13, 0.12, -0.30), (0.13, 0.12, 0.52)], 8),
        grip_m, coll,
    )
    parts.append(wrap)

    head_len = 1.45 + 0.13 * r
    head = shapes.new_object(
        "head",
        solids.blade(head_len, 0.66 + 0.09 * r, 0.18, tip=0.02, segments=6),
        blade_m, coll,
    )
    shapes.move(head, dz=shaft_h)
    shapes.bevel(head, 0.03)
    parts.append(head)

    socket = shapes.new_object(
        "socket",
        solids.loft([(0.17, 0.16, shaft_h - 0.34), (0.11, 0.10, shaft_h + 0.10)], 8),
        trim_m, coll,
    )
    parts.append(socket)

    # Крылья от синей ступени: два отогнутых зубца у втулки. Силуэт наконечника
    # меняется целиком, и ступень видна, даже когда копьё залито чёрным.
    if r >= 2:
        for side in (-1, 1):
            wing = shapes.new_object(
                f"wing{side}",
                solids.slab(0.44, 0.12, 0.16, shift=(side * 0.22, 0.0)),
                blade_m, coll,
            )
            shapes.turn(wing, side * -28.0, "Y")
            shapes.move(wing, side * 0.30, 0.0, shaft_h - 0.16)
            shapes.bevel(wing, 0.03)
            parts.append(wing)
    if r >= 4:
        for i in range(3):
            bead = shapes.new_object(
                f"bead{i}",
                solids.dome(0.15, 0.15, 0.13, sides=8, rows=2),
                trim_m, coll,
            )
            shapes.move(bead, dz=shaft_h - 0.70 - i * 0.46)
            parts.append(bead)
    return parts


def club(coll, mats: dict, rarity: str, seed: int) -> list:
    """Палица: комель дерева с оковкой. Тяжесть читается толщиной, а не длиной."""
    r = _rank(rarity)
    blade_m, trim_m, grip_m = mats[BLADE_MAT[r]], mats[TRIM_MAT[r]], mats[GRIP_MAT[r]]
    parts = []

    body = shapes.new_object(
        "haft",
        solids.loft(
            [(0.14, 0.13, 0.0), (0.17, 0.16, 1.10), (0.48 + 0.06 * r, 0.46 + 0.06 * r, 2.40),
             (0.58 + 0.07 * r, 0.56 + 0.07 * r, 3.30), (0.38, 0.37, 3.66)],
            10, seed=seed, wobble=0.05,
        ),
        mats["wood"], coll,
    )
    shapes.bevel(body, 0.05)
    parts.append(body)

    grip = shapes.new_object(
        "grip",
        solids.loft([(0.17, 0.16, -0.10), (0.17, 0.16, 0.72)], 8),
        grip_m, coll,
    )
    parts.append(grip)

    # Оковка кольцами: без неё комель читается морковкой.
    for i in range(2 + r // 2):
        ring = shapes.new_object(
            f"band{i}",
            solids.loft(
                [(0.40 + 0.06 * i + 0.05 * r, 0.38 + 0.06 * i + 0.05 * r, 2.02 + i * 0.42),
                 (0.42 + 0.06 * i + 0.05 * r, 0.40 + 0.06 * i + 0.05 * r, 2.16 + i * 0.42)],
                10,
            ),
            trim_m, coll,
        )
        parts.append(ring)

    # Шипы с зелёной ступени: по три на кольцо, вразбег, чтобы не выстроились в ряд.
    if r >= 1:
        count = 3 + r
        for i in range(count):
            a = 2.0 * math.pi * i / count + 0.4 * jitter(seed, f"spike{i}")
            z = 2.24 + 0.52 * (i % 2)
            radius = 0.48 + 0.06 * r
            spike = shapes.new_object(
                f"spike{i}",
                solids.cone(0.13 + 0.015 * r, 0.42 + 0.06 * r, sides=6, top=0.01),
                blade_m, coll,
            )
            shapes.turn(spike, 90.0, "Y")
            shapes.turn(spike, math.degrees(a), "Z")
            shapes.move(spike, math.cos(a) * radius, math.sin(a) * radius, z)
            parts.append(spike)
    return parts


BUILDERS = {"sword": sword, "spear": spear, "club": club}


def build(kind: str, coll, mats: dict, rarity: str, seed: int) -> list:
    parts = BUILDERS[kind](coll, mats, rarity, seed)
    for obj in parts:
        figure.lean(obj)
    return parts
