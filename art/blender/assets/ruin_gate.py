"""Ворота разрушенного святилища — benchmark пайплайна (ART_PIPELINE.md §12).

Собраны из модулей greek.py: две колонны, архитрав тремя блоками, карниз,
трёхступенчатый стилобат. Правый блок архитрава отсутствует — именно это
делает ворота руиной, а не воротами, и заодно даёт кучу обломков у подножия.

Размеры — в модульных единицах, примерно метрах. В мир они переводятся
экспортом по SIZE, поэтому здесь важны только пропорции.
"""

from __future__ import annotations

import math

from lib import damage, greek, materials, optics, shapes
from lib.variants import jitter, unit

ID = "prop-ruin-gate"
VERSION = 1

# Размер в мире — из balance.json, а не своей копией здесь (CLAUDE.md §1).
# Копия неизбежно разъезжается с конфигом, и тогда экспортёр считает след и
# плотность рендера для одного размера, а движок рисует другой.
SIZE = optics.props()["sizes"][ID]

# Пропорции ворот.
#
# Ствол заведомо длиннее канонического, а глубина всего строения заведомо мала.
# Причина в проекции: при наклоне 55° высота сжимается до cos 55° = 0.574, а
# глубина — только до sin 55° = 0.819. Построенные «правильно» ворота на экране
# превращаются в широкую платформу с пеньками. Ровно эту поправку держит и
# движок в src/ui/props/Models.ts.
SHAFT_H = 5.40
SHAFT_R = 0.40
SPAN = 2.45
STEP_RISE = 0.20
STEP_RUN = 0.17
STEPS = 3
PLATFORM_DEPTH = 0.95
ARCH_DEPTH = 0.72
CORNICE_DEPTH = 0.85


def build(ctx):
    seed = ctx.seed
    body = ctx.body
    mats = materials.library(
        ["marble", "limestone", "bronze", "foliageDry", "ember"], seed=seed
    )
    parts = []

    # --- Стилобат -----------------------------------------------------------
    steps, platform_h = greek.stylobate(
        body, mats["limestone"],
        width=SPAN + SHAFT_R * 3.8, depth=PLATFORM_DEPTH,
        steps=STEPS, rise=STEP_RISE, run=STEP_RUN,
    )
    # Верхняя ступень расколота: у руины первым уходит то, по чему ходили.
    damage.chip(steps[-1], ctx.helpers, seed + 11, count=2, size=0.16)
    damage.chip(steps[0], ctx.helpers, seed + 12, count=1, size=0.10)
    parts += steps

    # --- Две опоры ----------------------------------------------------------
    column_top = 0.0
    for side, x in ((0, -SPAN / 2.0), (1, SPAN / 2.0)):
        column, height = greek.column(
            body, mats["marble"], SHAFT_H, SHAFT_R,
            seed=seed + side * 7, name=f"pier{side}",
        )
        for obj in column:
            shapes.move(obj, dx=x, dz=platform_h)
        # Завал в полтора градуса на опору: две идеально отвесные колонны
        # читаются новостройкой, и никакие сколы этого уже не исправят.
        for obj in column:
            shapes.turn(obj, 1.4 * jitter(seed, f"lean{side}"), "Y")
        damage.chip(column[-1], ctx.helpers, seed + 20 + side, count=2, size=0.26)
        damage.chip(column[0], ctx.helpers, seed + 25 + side, count=2, size=0.30)
        damage.weather(column[0], seed + 30 + side, amount=0.010)
        parts += column
        column_top = platform_h + height

    # --- Архитрав: три блока, правого нет -----------------------------------
    total = SPAN + SHAFT_R * 4.0
    block_w = total / 3.0
    arch_h = 0.52
    kept = []
    for i in range(2):  # третий блок обрушен — он и лежит внизу осыпью
        x = -total / 2.0 + block_w * (i + 0.5)
        obj = greek.lintel(body, mats["marble"], block_w * 0.995, ARCH_DEPTH, arch_h, name=f"arch{i}")
        shapes.move(obj, dx=x, dz=column_top)
        shapes.turn(obj, 0.8 * jitter(seed, f"arch.lean{i}"), "Y")
        kept.append(obj)
    # Правый край уцелевшего блока — место обрыва: там скол крупнее прочих.
    damage.chip(kept[-1], ctx.helpers, seed + 41, count=3, size=0.30)
    damage.chip(kept[0], ctx.helpers, seed + 42, count=1, size=0.14)
    parts += kept

    # --- Карниз только над уцелевшей частью ---------------------------------
    cornice_w = block_w * 2.0
    cornice_h = 0.34
    cornice = greek.cornice(body, mats["marble"], cornice_w * 0.99, CORNICE_DEPTH, cornice_h, name="cornice")
    for obj in cornice:
        shapes.move(obj, dx=-total / 2.0 + cornice_w / 2.0, dz=column_top + arch_h)
    damage.chip(cornice[0], ctx.helpers, seed + 51, count=2, size=0.22)
    parts += cornice

    # --- Бронзовые штыри в швах ---------------------------------------------
    for i, x in enumerate((-total / 2.0 + block_w, -total / 2.0 + block_w * 2.0)):
        pin = shapes.new_object(
            f"pin{i}",
            shapes.revolve([(0.055, 0.0), (0.055, 0.16), (0.075, 0.20)], 8),
            mats["bronze"],
            body,
        )
        shapes.move(pin, dx=x, dy=-ARCH_DEPTH / 2.0 + 0.06, dz=column_top + arch_h - 0.02)
        parts.append(pin)

    # --- Упавший барабан и осыпь --------------------------------------------
    fallen = greek.drum(body, mats["marble"], SHAFT_R * 0.94, 0.92, seed=seed + 60)
    shapes.move(fallen, dx=SPAN / 2.0 + 0.80, dy=-0.45)
    shapes.turn(fallen, 24.0 + 30.0 * jitter(seed, "drum"), "Z")
    parts.append(fallen)

    parts += damage.rubble(
        body, mats["limestone"], seed + 70,
        count=9, spread=0.80, size=0.20, at=(SPAN / 2.0 + 0.62, -0.28),
    )
    parts += damage.rubble(
        body, mats["limestone"], seed + 80,
        count=4, spread=0.52, size=0.14, at=(-SPAN / 2.0 - 0.45, -0.24),
    )

    # --- Жаровня со святым огнём --------------------------------------------
    parts += _brazier(body, mats, seed, platform_h)

    # --- Сухая трава в швах, только с теневой стороны ------------------------
    parts += _grass(body, mats["foliageDry"], seed, platform_h)

    return parts


def _brazier(body, mats, seed: int, platform_h: float):
    """Треножник с углями. Чистый декор: взаимодействия в игре нет и не будет."""
    bowl = shapes.new_object(
        "brazier.bowl",
        shapes.revolve(
            [(0.22, 0.0), (0.40, 0.13), (0.46, 0.34), (0.41, 0.39), (0.35, 0.36)], 12
        ),
        mats["bronze"],
        body,
    )
    shapes.bevel(bowl, 0.035)
    shapes.move(bowl, dy=-0.10, dz=platform_h + 0.70)

    legs = []
    for i in range(3):
        angle = math.radians(90.0 + i * 120.0)
        leg = shapes.new_object(
            f"brazier.leg{i}",
            shapes.block(0.075, 0.075, 0.76, lean=(math.cos(angle) * 0.20, math.sin(angle) * 0.20)),
            mats["bronze"],
            body,
        )
        shapes.move(leg, dx=math.cos(angle) * 0.22, dy=-0.10 + math.sin(angle) * 0.22, dz=platform_h)
        legs.append(leg)

    coals = shapes.new_object(
        "brazier.coals",
        shapes.revolve([(0.30, 0.0), (0.25, 0.05)], 12, seed=seed, wobble=0.18),
        mats["ember"],
        body,
    )
    shapes.move(coals, dy=-0.10, dz=platform_h + 1.06)
    return [bowl, coals] + legs


def _grass(body, material, seed: int, platform_h: float):
    """Пучки в швах. Растительность селится в тени и в трещинах, не на солнце."""
    tufts = []
    for i in range(7):
        x = -1.9 + 3.6 * unit(seed, f"grass.x.{i}")
        # Только теневая сторона: солнце в NOSTOS светит справа-сверху.
        if x > 0.6 and unit(seed, f"grass.keep.{i}") > 0.35:
            continue
        height = 0.30 + 0.26 * unit(seed, f"grass.h.{i}")
        tuft = shapes.new_object(
            f"grass.{i}",
            shapes.block(0.09, 0.09, height, taper=0.12, lean=(0.11 * jitter(seed, f"g.l.{i}"), 0.0)),
            material,
            body,
        )
        step = int(unit(seed, f"grass.s.{i}") * 3)
        shapes.move(tuft, dx=x, dy=-0.80 - step * 0.30, dz=platform_h - step * 0.22)
        tufts.append(tuft)
    return tufts
