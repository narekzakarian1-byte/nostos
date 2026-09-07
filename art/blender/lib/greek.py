"""Греческий словарь: детали дорийского ордера и кладки.

Самый ценный модуль библиотеки. Ворота святилища, портик храма и одиночная
колонна на обочине — это одни и те же функции с разными числами. Поэтому
каждое следующее строение дешевле предыдущего (ART_PIPELINE.md §13).

Пропорции взяты из канона намеренно: именно они кричат «Греция» и делают
объект узнаваемым раньше, чем прочитан его силуэт. Утрируем повреждения и
растительность, но не ордер.

Все размеры — в модульных единицах; масштаб в мир задаётся при экспорте.
"""

from __future__ import annotations

import math

from . import shapes
from .variants import jitter

# Канон дорийского ордера: отношения, а не абсолютные числа.
SHAFT_TAPER = 0.82        # радиус верха к радиусу низа
ENTASIS = 0.030           # припухлость ствола в средней трети
ECHINUS_FLARE = 1.26      # вынос эхина относительно верха ствола
ABACUS_OVERHANG = 1.06    # вынос абака относительно эхина
CAPITAL_SHARE = 0.115     # высота капители в долях высоты ствола
SIDES = 18                # граней тела вращения: фасетка читается, круг ещё узнаётся
FLUTE = 0.130             # глубина каннелюр в долях радиуса


def shaft_profile(height: float, radius: float, segments: int = 7) -> list[tuple[float, float]]:
    """Профиль ствола с сужением кверху и энтазисом.

    Без энтазиса прямой конус читается трубой: глаз ловит идеально прямую
    образующую как деталь станка, а не как камень.
    """
    profile = []
    for i in range(segments + 1):
        t = i / segments
        linear = radius * (1.0 + (SHAFT_TAPER - 1.0) * t)
        bulge = ENTASIS * radius * math.sin(math.pi * t) * 0.5
        profile.append((linear + bulge, height * t))
    return profile


def shaft(collection, material, height: float, radius: float, seed: int = 0, name="shaft"):
    bm = shapes.revolve(shaft_profile(height, radius), SIDES, flute=FLUTE, seed=seed, wobble=0.006)
    obj = shapes.new_object(name, bm, material, collection)
    shapes.bevel(obj, radius * 0.085)
    return obj


def capital(collection, material, height: float, radius: float, name="capital"):
    """Эхин и абак. Двумя объектами, потому что абак — коробка, а эхин — вращение."""
    top = radius * SHAFT_TAPER
    cap_h = height * CAPITAL_SHARE
    echinus_h = cap_h * 0.58
    abacus_h = cap_h - echinus_h

    bm = shapes.revolve(
        [
            (top, 0.0),
            (top * 1.06, echinus_h * 0.28),
            (top * ECHINUS_FLARE * 0.86, echinus_h * 0.70),
            (top * ECHINUS_FLARE, echinus_h),
        ],
        SIDES,
    )
    echinus = shapes.new_object(f"{name}.echinus", bm, material, collection)
    shapes.bevel(echinus, top * 0.09)
    shapes.move(echinus, dz=height)

    side = top * ECHINUS_FLARE * ABACUS_OVERHANG * 2.0
    abacus = shapes.new_object(
        f"{name}.abacus",
        shapes.block(side, side, abacus_h),
        material,
        collection,
    )
    shapes.bevel(abacus, abacus_h * 0.16)
    shapes.move(abacus, dz=height + echinus_h)
    return [echinus, abacus], cap_h


def column(collection, material, height: float, radius: float, seed: int = 0, name="column"):
    """Целая колонна: ствол плюс капитель. Возвращает объекты и полную высоту.

    Дорийская колонна стоит прямо на стилобате, без базы — так и делаем.
    Плинт под ней читался бы как ионика и ломал бы узнавание ордера.
    """
    parts = [shaft(collection, material, height, radius, seed=seed, name=f"{name}.shaft")]
    cap, cap_h = capital(collection, material, height, radius, name=name)
    parts += cap
    return parts, height + cap_h


def broken_column(collection, material, height: float, radius: float, seed: int = 0, name="stump"):
    """Обломок: ствол, оборванный на случайной высоте, с рваным сколом сверху.

    Скол делается сужением последнего сегмента и перекосом — трещина в камне
    идёт гранью, а не аккуратным срезом.
    """
    cut = height * (0.28 + 0.34 * (jitter(seed, "cut") * 0.5 + 0.5))
    profile = [p for p in shaft_profile(height, radius) if p[1] < cut]
    t = cut / height
    top_r = radius * (1.0 + (SHAFT_TAPER - 1.0) * t)
    profile.append((top_r, cut))
    profile.append((top_r * 0.88, cut + radius * 0.22 * (0.6 + jitter(seed, "lip"))))

    bm = shapes.revolve(profile, SIDES, flute=FLUTE, seed=seed + 1, wobble=0.05)
    obj = shapes.new_object(name, bm, material, collection)
    shapes.bevel(obj, radius * 0.03)
    return obj, cut


def drum(collection, material, radius: float, length: float, seed: int = 0, name="drum"):
    """Упавший барабан колонны: то же тело вращения, положенное на бок.

    Обязателен рядом с любой руиной: недостающий материал должен быть виден,
    иначе обломок читается недоделанным ассетом, а не разрушением.
    """
    bm = shapes.revolve([(radius, 0.0), (radius, length)], SIDES, flute=FLUTE, seed=seed, wobble=0.02)
    obj = shapes.new_object(name, bm, material, collection)
    shapes.bevel(obj, radius * 0.05)
    shapes.turn(obj, 90.0, "X")
    shapes.move(obj, dz=radius)
    return obj


def lintel(collection, material, width: float, depth: float, height: float, name="lintel"):
    """Блок архитрава. Кладётся отдельными блоками — руина ломается по швам."""
    obj = shapes.new_object(name, shapes.block(width, depth, height), material, collection)
    shapes.bevel(obj, height * 0.16)
    return obj


def cornice(collection, material, width: float, depth: float, height: float, name="cornice"):
    """Карниз с выносом и капельником: нижняя плита шире верхней."""
    slab = shapes.new_object(
        f"{name}.slab", shapes.block(width, depth, height * 0.62), material, collection
    )
    shapes.bevel(slab, height * 0.15)
    crown = shapes.new_object(
        f"{name}.crown",
        shapes.block(width * 0.90, depth * 0.90, height * 0.38, at=(0.0, 0.0, height * 0.62)),
        material,
        collection,
    )
    shapes.bevel(crown, height * 0.08)
    return [slab, crown]


def stylobate(collection, material, width: float, depth: float, steps: int, rise: float, run: float):
    """Ступенчатое основание. Каждая ступень — отдельный блок: их и разрушаем."""
    parts = []
    for i in range(steps):
        w = width + (steps - 1 - i) * run * 2.0
        d = depth + (steps - 1 - i) * run * 2.0
        obj = shapes.new_object(
            f"step.{i}", shapes.block(w, d, rise, at=(0.0, 0.0, i * rise)), material, collection
        )
        shapes.bevel(obj, rise * 0.22)
        parts.append(obj)
    return parts, steps * rise
