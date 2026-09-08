"""Примитивы второго уровня: то, чего не собрать из revolve и block.

Отдельным модулем, а не дописыванием в shapes.py: там лежат две базовые формы
греческого реквизита, и они не должны тонуть среди конусов, куполов и клинков,
которые понадобились фигурам, оружию и растительности.

Все формы строятся с началом координат в ТОЧКЕ КРЕПЛЕНИЯ, а не в центре
габарита: у ноги это тазобедренный сустав, у клинка — середина рукояти. Тогда
поворот детали в игре идёт вокруг того же места, вокруг которого он идёт у
живого человека, и подгонять пивот по пикселям не приходится.
"""

from __future__ import annotations

import math

import bmesh

from .variants import jitter


def _ring(bm, radius_x: float, radius_y: float, z: float, sides: int, phase: float = 0.0):
    ring = []
    for i in range(sides):
        a = phase + (i / sides) * 2.0 * math.pi
        ring.append(bm.verts.new((radius_x * math.cos(a), radius_y * math.sin(a), z)))
    return ring


def _skin(bm, rings: list[list], close_bottom: bool, close_top: bool) -> None:
    sides = len(rings[0])
    for k in range(len(rings) - 1):
        lower, upper = rings[k], rings[k + 1]
        for i in range(sides):
            j = (i + 1) % sides
            bm.faces.new((lower[i], lower[j], upper[j], upper[i]))
    if close_bottom:
        bm.faces.new(list(reversed(rings[0])))
    if close_top:
        bm.faces.new(rings[-1])
    bm.normal_update()


def loft(
    profile: list[tuple[float, float, float]],
    sides: int,
    seed: int | None = None,
    wobble: float = 0.0,
    phase: float = 0.0,
) -> bmesh.types.BMesh:
    """Тело по профилю [(полуось X, полуось Y, высота), ...].

    От shapes.revolve отличается двумя полуосями: конечность в сечении не круг,
    а овал, и без этого рука выходит трубой. Ровно та же разница, что между
    колонной и человеком.
    """
    bm = bmesh.new()
    rings = []
    for k, (rx, ry, z) in enumerate(profile):
        scale = 1.0
        if wobble and seed is not None:
            scale = 1.0 + wobble * jitter(seed, f"loft.{k}")
        rings.append(_ring(bm, rx * scale, ry * scale, z, sides, phase))
    _skin(bm, rings, profile[0][0] > 1e-4, profile[-1][0] > 1e-4)
    return bm


def dome(rx: float, ry: float, height: float, sides: int = 14, rows: int = 4) -> bmesh.types.BMesh:
    """Полусфера-фасетка. Голова, шлем, ягода, купол печи — всё это она."""
    profile = []
    for i in range(rows + 1):
        t = i / rows
        a = t * math.pi / 2.0
        profile.append((rx * math.cos(a), ry * math.cos(a), height * math.sin(a)))
    return loft(profile, sides)


def cone(radius: float, height: float, sides: int = 10, top: float = 0.0) -> bmesh.types.BMesh:
    """Конус или усечённый конус. Кипарис, крыша, наконечник копья."""
    return loft([(radius, radius, 0.0), (max(top, 1e-5), max(top, 1e-5), height)], sides)


def blade(
    length: float,
    width: float,
    thick: float,
    tip: float = 0.0,
    curve: float = 0.0,
    segments: int = 6,
) -> bmesh.types.BMesh:
    """Клинок: плоский, с ребром жёсткости и остриём.

    Ребро даёт две грани под разными углами к солнцу, и меч перестаёт быть
    полоской краски: одна половина клинка светится, вторая уходит в тон.

    curve уводит остриё вбок — так из прямого ксифоса получается копис.
    """
    bm = bmesh.new()
    left, right, spine = [], [], []
    for i in range(segments + 1):
        t = i / segments
        w = width * (1.0 - t * (1.0 - tip)) if tip > 0.0 else width * (1.0 - t)
        w = max(w, 1e-4)
        bend = curve * length * (t * t)
        left.append(bm.verts.new((bend - w / 2.0, 0.0, length * t)))
        right.append(bm.verts.new((bend + w / 2.0, 0.0, length * t)))
        spine.append((
            bm.verts.new((bend, -thick / 2.0, length * t)),
            bm.verts.new((bend, thick / 2.0, length * t)),
        ))

    for i in range(segments):
        back_a, front_a = spine[i]
        back_b, front_b = spine[i + 1]
        bm.faces.new((left[i], back_a, back_b, left[i + 1]))
        bm.faces.new((back_a, right[i], right[i + 1], back_b))
        bm.faces.new((right[i], front_a, front_b, right[i + 1]))
        bm.faces.new((front_a, left[i], left[i + 1], front_b))
    # Дно клинка закрывается четырёхугольником по кольцу сечения: рукоять
    # входит в него, и открытая дыра дала бы чёрный провал в тени.
    back0, front0 = spine[0]
    bm.faces.new((back0, left[0], front0, right[0]))
    bm.normal_update()
    return bm


def slab(
    width: float,
    depth: float,
    height: float,
    at: tuple[float, float, float] = (0.0, 0.0, 0.0),
    top_scale: tuple[float, float] = (1.0, 1.0),
    shift: tuple[float, float] = (0.0, 0.0),
) -> bmesh.types.BMesh:
    """Коробка с раздельным сужением по осям и сдвигом верха.

    shapes.block умеет один общий taper; человеку этого мало: грудная клетка
    сужается книзу сильнее, чем в глубину, а бедро вообще уходит вбок.
    """
    cx, cy, z0 = at
    hw, hd = width / 2.0, depth / 2.0
    tw, td = hw * top_scale[0], hd * top_scale[1]
    z1 = z0 + height
    sx, sy = shift

    bm = bmesh.new()
    low = [
        bm.verts.new((cx - hw, cy - hd, z0)),
        bm.verts.new((cx + hw, cy - hd, z0)),
        bm.verts.new((cx + hw, cy + hd, z0)),
        bm.verts.new((cx - hw, cy + hd, z0)),
    ]
    high = [
        bm.verts.new((cx - tw + sx, cy - td + sy, z1)),
        bm.verts.new((cx + tw + sx, cy - td + sy, z1)),
        bm.verts.new((cx + tw + sx, cy + td + sy, z1)),
        bm.verts.new((cx - tw + sx, cy + td + sy, z1)),
    ]
    bm.faces.new(list(reversed(low)))
    bm.faces.new(high)
    for i in range(4):
        j = (i + 1) % 4
        bm.faces.new((low[i], low[j], high[j], high[i]))
    bm.normal_update()
    return bm


def shard(radius: float, height: float, sides: int, seed: int, key: str, lean: float = 0.0):
    """Неправильный многогранник: камень, обломок, кристалл соли.

    Гранёный, а не шумовой: фасетка ловит свет плоскостями, и камень читается
    камнем на сорока пикселях. Шум на такой величине превращается в кашу.
    """
    bm = bmesh.new()
    base, mid, top = [], [], []
    for i in range(sides):
        a = (i / sides) * 2.0 * math.pi
        r0 = radius * (0.72 + 0.28 * (jitter(seed, f"{key}.b{i}") * 0.5 + 0.5))
        r1 = radius * (0.88 + 0.24 * (jitter(seed, f"{key}.m{i}") * 0.5 + 0.5))
        r2 = radius * (0.22 + 0.34 * (jitter(seed, f"{key}.t{i}") * 0.5 + 0.5))
        base.append(bm.verts.new((r0 * math.cos(a), r0 * math.sin(a), 0.0)))
        mid.append(bm.verts.new((r1 * math.cos(a), r1 * math.sin(a), height * 0.46)))
        top.append(bm.verts.new((
            r2 * math.cos(a) + lean * height,
            r2 * math.sin(a),
            height * (0.86 + 0.14 * jitter(seed, f"{key}.h{i}")),
        )))
    _skin(bm, [base, mid, top], True, True)
    return bm


def hull(length: float, beam: float, depth: float, rise: float, sections: int = 9):
    """Корпус судна: киль, борта и открытый верх.

    Не тело вращения. Эллипсоид, положенный на бок, с наклонённой камеры
    читается тарелкой: у него нет ни киля, ни развала бортов, ни открытого
    нутра — то есть ровно тех трёх признаков, по которым глаз узнаёт лодку.
    Здесь корпус набирается поперечными сечениями: полуширина гаснет к
    оконечностям, а линия борта поднимается к носу и корме.
    """
    bm = bmesh.new()
    keel, port, star = [], [], []
    for i in range(sections + 1):
        t_ = i / sections
        x = (t_ - 0.5) * length
        taper = math.sin(math.pi * t_) ** 0.62
        half = max(beam * 0.5 * taper, beam * 0.035)
        sheer = rise * (2.0 * t_ - 1.0) ** 2
        keel.append(bm.verts.new((x, 0.0, -depth * taper)))
        port.append(bm.verts.new((x, -half, sheer)))
        star.append(bm.verts.new((x, half, sheer)))

    for i in range(sections):
        bm.faces.new((keel[i], port[i], port[i + 1], keel[i + 1]))
        bm.faces.new((keel[i], keel[i + 1], star[i + 1], star[i]))
    # Оконечности закрываются треугольником: открытая дыра у носа даёт чёрный
    # провал ровно там, куда смотрит игрок при высадке.
    bm.faces.new((keel[0], star[0], port[0]))
    bm.faces.new((keel[-1], port[-1], star[-1]))
    bm.normal_update()
    return bm
