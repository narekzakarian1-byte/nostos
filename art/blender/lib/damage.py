"""Повреждения.

Греческая руина ломается ПО ШВАМ КЛАДКИ, а не случайным шумом. Это правило
важнее красоты самого скола: оно делает разрушение осмысленным, и мир перестаёт
выглядеть поцарапанным в фотошопе (ART_PIPELINE.md §3.6).

Отсюда три приёма и ни одного больше: отбить угол гранью, завалить блок,
рассыпать под ним недостающий материал.
"""

from __future__ import annotations

import math

import bmesh
import bpy

from . import shapes
from .variants import jitter, unit


def _rebevel(obj: bpy.types.Object):
    """Снимает фаску и возвращает её параметры: булев режется ДО фаски.

    Иначе фаска считается по целому блоку, а скол выходит острым и чужим.
    """
    for mod in list(obj.modifiers):
        if mod.type == "BEVEL":
            params = (mod.width, mod.segments, math.degrees(mod.angle_limit))
            obj.modifiers.remove(mod)
            return params
    return None


def chip(obj: bpy.types.Object, helpers, seed: int, count: int = 2, size: float = 0.22) -> None:
    """Отбитые углы: булева разность с повёрнутыми блоками по краям габарита.

    Резак ставится именно на ребро, а не в случайную точку поверхности: камень
    откалывается с угла, и выемка посреди грани читается как вмятина, а не скол.
    """
    params = _rebevel(obj)
    box = [v[:] for v in obj.bound_box]
    lo = [min(p[i] for p in box) for i in range(3)]
    hi = [max(p[i] for p in box) for i in range(3)]
    # По КОРОТКОЙ стороне: у ствола колонны длинная — это его высота, и скол
    # от неё выходил больше самой колонны.
    span = min(hi[i] - lo[i] for i in range(3))

    for k in range(count):
        cut = span * size * (0.7 + 0.6 * unit(seed, f"chip.size.{k}"))
        cutter = shapes.new_object(
            f"{obj.name}.chip.{k}",
            shapes.block(cut, cut, cut),
            None,
            helpers,
        )
        cutter.location = (
            lo[0] + (hi[0] - lo[0]) * round(unit(seed, f"chip.x.{k}")),
            lo[1] + (hi[1] - lo[1]) * round(unit(seed, f"chip.y.{k}")),
            lo[2] + (hi[2] - lo[2]) * (0.15 + 0.8 * unit(seed, f"chip.z.{k}")),
        )
        cutter.rotation_euler = (
            math.radians(28.0 * jitter(seed, f"chip.rx.{k}")),
            math.radians(28.0 * jitter(seed, f"chip.ry.{k}")),
            math.radians(45.0 * jitter(seed, f"chip.rz.{k}")),
        )
        # Резак живёт в ЛОКАЛЬНОЙ системе блока: координаты взяты из его
        # bound_box, а он локальный. Через матрицу мира резак уехал бы у
        # любого повёрнутого блока.
        cutter.parent = obj
        cutter.hide_render = True

        mod = obj.modifiers.new(f"Chip{k}", "BOOLEAN")
        mod.operation = "DIFFERENCE"
        mod.object = cutter
        mod.solver = "EXACT"

    if params:
        shapes.bevel(obj, params[0], params[1], params[2])


def lean(obj: bpy.types.Object, seed: int, degrees: float = 3.0) -> None:
    """Завал в пару градусов. Руина, стоящая по отвесу, читается новостройкой."""
    shapes.turn(obj, degrees * jitter(seed, "lean.x"), "X")
    shapes.turn(obj, degrees * jitter(seed, "lean.y"), "Y")


def weather(obj: bpy.types.Object, seed: int, amount: float = 0.02) -> None:
    """Выветривание: рёбра, обращённые вверх и вправо, теряют остроту.

    Сторона солнца и дождя стачивается, нижние и левые рёбра остаются острыми.
    Это и отличает выветренный камень от равномерно зашумлённого.
    """
    mesh = obj.data
    box = [v[:] for v in obj.bound_box]
    span = max(max(p[i] for p in box) - min(p[i] for p in box) for i in range(3)) or 1.0
    bm = bmesh.new()
    bm.from_mesh(mesh)
    for i, vert in enumerate(bm.verts):
        exposure = max(0.0, vert.normal.z) * 0.7 + max(0.0, vert.normal.x) * 0.3
        offset = amount * span * exposure
        vert.co.x += offset * jitter(seed, f"w.x.{i}")
        vert.co.y += offset * jitter(seed, f"w.y.{i}")
        vert.co.z -= offset * abs(jitter(seed, f"w.z.{i}"))
    bm.to_mesh(mesh)
    bm.free()


def rubble(collection, material, seed: int, count: int, spread: float, size: float, at=(0.0, 0.0)):
    """Осыпь недостающего материала. Кладётся у подножия, кучей, а не ровным полем.

    Куча вокруг обломка — это то, что делает разрушение прочитанным: глаз
    находит, куда делся отсутствующий кусок.
    """
    parts = []
    for i in range(count):
        radius = size * (0.5 + unit(seed, f"rub.s.{i}"))
        bm = shapes.revolve(
            [(radius * 0.72, 0.0), (radius, radius * 0.55), (radius * 0.48, radius * 0.95)],
            7,
            seed=seed + i,
            wobble=0.28,
        )
        obj = shapes.new_object(f"rubble.{i}", bm, material, collection)
        shapes.bevel(obj, radius * 0.12)
        angle = 2.0 * math.pi * unit(seed, f"rub.a.{i}")
        dist = spread * math.sqrt(unit(seed, f"rub.d.{i}"))
        shapes.move(obj, at[0] + math.cos(angle) * dist, at[1] + math.sin(angle) * dist * 0.7)
        shapes.turn(obj, 360.0 * unit(seed, f"rub.r.{i}"), "Z")
        shapes.turn(obj, 22.0 * jitter(seed, f"rub.t.{i}"), "X")
        parts.append(obj)
    return parts
