"""Сборка фигуры из костей и вывод чисел рига.

Главная мысль модуля: числа для src/ui/rig/RigParts.ts не подбираются по
пикселям, а СЧИТАЮТСЯ. Пивот кости — это спроецированное начало её координат,
сокет — спроецированный сустав, рост — доля от спроецированного роста фигуры.
Промахнуться ими нельзя по построению, ровно как якорем пропа
(ART_RUNBOOK.md §7).

Фигура собирается «на бумаге», без второго прохода в Blender: каждая кость
строится один раз вокруг своего сустава, а её место в фигуре — это сдвиг, а не
пересборка. Кости жёсткие, поэтому объединение сдвинутых габаритов и есть
габарит фигуры.
"""

from __future__ import annotations

from dataclasses import dataclass, field

from . import figure, optics


@dataclass
class Bone:
    """Одна кость фигуры.

    id совпадает с BoneId в TypeScript: их всего семь, и разъезжаться им
    незачем. at — сустав в системе стоящей фигуры, до наклона.
    """
    id: str
    build: object
    at: tuple[float, float, float] = (0.0, 0.0, 0.0)
    behind: bool = False
    mirror: bool = False
    hand: tuple[float, float, float] | None = None


@dataclass
class Placed:
    bone: Bone
    objects: list = field(default_factory=list)
    frame: object = None
    socket: tuple[float, float] = (0.0, 0.0)


def screen(point: tuple[float, float, float]) -> tuple[float, float]:
    """Точка в координатах экрана движка: x вправо, y ВНИЗ."""
    return optics.project(figure.lean_point(point))


def assemble(placed: list[Placed]) -> dict:
    """Габарит собранной фигуры в экранных единицах.

    Верх — макушка, низ — подошва: по ним движок и меряет рост фигуры
    (ui/Body.ts рисует коробку size×size с подошвой у нижней кромки).
    """
    left = top = 1e9
    right = bottom = -1e9
    for item in placed:
        sx, sy = item.socket
        f = item.frame
        left = min(left, sx + f.u0)
        right = max(right, sx + f.u1)
        # Frame держит v вверх, экран движка — вниз.
        top = min(top, sy - f.v1)
        bottom = max(bottom, sy - f.v0)
    # Рост фигуры — от макушки до ЗЕМЛИ (экранный y = 0), а не до самой нижней
    # точки. Носок ботинка у наклонённой фигуры выступает вперёд и вниз, и
    # если мерить по нему, коробка окажется ниже подошвы: движок кладёт пятно
    # тени по нижней кромке коробки (ui/Body.ts), и тень отъедет от ног.
    return {"left": left, "right": right, "top": top, "bottom": bottom,
            "height": -top, "width": right - left}


def export(placed: list[Placed], box: dict, root_id: str = "torso") -> dict:
    """Готовые числа рига: пивоты, ростовые доли, сокеты и точка кисти."""
    height = box["height"]
    root = next(p for p in placed if p.bone.id == root_id)
    root_pivot = root.frame.anchor
    root_w = (root.frame.u1 - root.frame.u0)
    root_h = (root.frame.v1 - root.frame.v0)
    rsx, rsy = root.socket

    bones = []
    hand = None
    for item in placed:
        f = item.frame
        ax, ay = f.anchor
        entry = {
            "id": item.bone.id,
            "pivotX": round(ax, 4),
            "pivotY": round(ay, 4),
            "height": round((f.v1 - f.v0) / height, 4),
            "behind": item.bone.behind,
            "pixels": {"width": f.width, "height": f.height},
        }
        sx, sy = item.socket
        if item.bone.id == root_id:
            # Корень садится в коробку фигуры: подошва у нижней кромки,
            # середина по горизонтали — там же, где стоит сама фигура.
            entry["socketX"] = round(0.5 + sx / height, 4)
            entry["socketY"] = round((sy - box["top"]) / height, 4)
        else:
            entry["socketX"] = round(root_pivot[0] + (sx - rsx) / root_w, 4)
            entry["socketY"] = round(root_pivot[1] + (sy - rsy) / root_h, 4)
        bones.append(entry)

        if item.bone.hand is not None:
            hx, hy = screen(item.bone.hand)
            hand = {
                "handX": round(ax + hx / (f.u1 - f.u0), 4),
                "handY": round(ay + hy / (f.v1 - f.v0), 4),
            }

    out = {"bones": bones, "figureHeight": round(height, 3), "figureWidth": round(box["width"], 3)}
    if hand:
        out.update(hand)
    return out
