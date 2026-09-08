"""Примитивы, из которых собирается всё остальное.

Строится через bmesh, а не через bpy.ops: операторы в фоновом режиме зависят от
контекста и молча делают не то. bmesh детерминирован и не зависит ни от чего.

Набор нарочно маленький. Греческий реквизит — это тело вращения либо коробка;
третьего почти не бывает. Та же логика, что в src/ui/props/Shapes.ts.
"""

from __future__ import annotations

import math

import bmesh
import bpy
from mathutils import Matrix, Vector

from .variants import jitter


def new_object(name: str, bm: bmesh.types.BMesh, material, collection) -> bpy.types.Object:
    """Объект из bmesh. Затенение плоское: фасетка — это стиль, а не экономия."""
    mesh = bpy.data.meshes.new(name)
    bm.to_mesh(mesh)
    bm.free()
    for poly in mesh.polygons:
        poly.use_smooth = False
    obj = bpy.data.objects.new(name, mesh)
    if material is not None:
        obj.data.materials.append(material)
    collection.objects.link(obj)
    return obj


def bevel(obj: bpy.types.Object, width: float, segments: int = 2, angle: float = 35.0) -> None:
    """Фаска на рёбрах.

    Главный признак «модели» против «коробки»: фаска ловит свет и даёт светлую
    линию по верхним рёбрам. Без неё объект остаётся плоской заливкой при любом
    качестве всего остального (ART_PIPELINE.md §3.1).
    """
    mod = obj.modifiers.new("Bevel", "BEVEL")
    mod.width = width
    mod.segments = segments
    mod.limit_method = "ANGLE"
    mod.angle_limit = math.radians(angle)
    mod.miter_outer = "MITER_ARC"
    mod.harden_normals = False


def revolve(
    profile: list[tuple[float, float]],
    sides: int,
    flute: float = 0.0,
    seed: int | None = None,
    wobble: float = 0.0,
) -> bmesh.types.BMesh:
    """Тело вращения по профилю [(радиус, высота), ...].

    flute модулирует радиус через грань — так у колонны появляются каннелюры.
    Без них ствол на сорока пикселях читается гладкой трубой, а не дорийской
    колонной.

    wobble задаёт неровность по граням и нужен камням: идеальное тело вращения
    выглядит выточенным на станке, а не отколовшимся.
    """
    scale = []
    for i in range(sides):
        k = 1.0 - flute * (i % 2)
        if wobble and seed is not None:
            k *= 1.0 + wobble * jitter(seed, f"revolve.{i}")
        scale.append(k)

    bm = bmesh.new()
    rings = []
    for radius, z in profile:
        ring = []
        for i in range(sides):
            a = (i / sides) * 2.0 * math.pi
            r = radius * scale[i]
            ring.append(bm.verts.new((r * math.cos(a), r * math.sin(a), z)))
        rings.append(ring)

    for k in range(len(rings) - 1):
        lower, upper = rings[k], rings[k + 1]
        if profile[k][0] < 1e-4 and profile[k + 1][0] < 1e-4:
            continue
        for i in range(sides):
            j = (i + 1) % sides
            bm.faces.new((lower[i], lower[j], upper[j], upper[i]))

    if profile[-1][0] > 1e-4:
        bm.faces.new(rings[-1])
    if profile[0][0] > 1e-4:
        bm.faces.new(list(reversed(rings[0])))

    bm.normal_update()
    return bm


def block(
    width: float,
    depth: float,
    height: float,
    at: tuple[float, float, float] = (0.0, 0.0, 0.0),
    taper: float = 1.0,
    lean: tuple[float, float] = (0.0, 0.0),
) -> bmesh.types.BMesh:
    """Коробка с точкой отсчёта в центре нижней грани.

    taper сужает верх (карниз, эхин), lean уводит верх вбок — руина не стоит по
    отвесу, и завал в пару градусов отличает обломок от новостройки.
    """
    cx, cy, z0 = at
    hw, hd = width / 2.0, depth / 2.0
    tw, td = hw * taper, hd * taper
    z1 = z0 + height
    lx, ly = lean

    bm = bmesh.new()
    low = [
        bm.verts.new((cx - hw, cy - hd, z0)),
        bm.verts.new((cx + hw, cy - hd, z0)),
        bm.verts.new((cx + hw, cy + hd, z0)),
        bm.verts.new((cx - hw, cy + hd, z0)),
    ]
    high = [
        bm.verts.new((cx - tw + lx, cy - td + ly, z1)),
        bm.verts.new((cx + tw + lx, cy - td + ly, z1)),
        bm.verts.new((cx + tw + lx, cy + td + ly, z1)),
        bm.verts.new((cx - tw + lx, cy + td + ly, z1)),
    ]
    bm.faces.new(list(reversed(low)))
    bm.faces.new(high)
    for i in range(4):
        j = (i + 1) % 4
        bm.faces.new((low[i], low[j], high[j], high[i]))

    bm.normal_update()
    return bm


def move(obj: bpy.types.Object, dx: float = 0.0, dy: float = 0.0, dz: float = 0.0) -> bpy.types.Object:
    obj.location = Vector(obj.location) + Vector((dx, dy, dz))
    return obj


def turn(obj: bpy.types.Object, degrees: float, axis: str = "Z") -> bpy.types.Object:
    """Поворот вокруг СОБСТВЕННОГО начала координат объекта.

    Blender складывает трансформ как T·R·S, поэтому поворот и сдвиг живут в
    разных слотах и не зависят от порядка вызовов: объект всегда сначала
    крутится на месте, потом переезжает. Это то, что нужно детали, — но НЕ то,
    что нужно наклону всей фигуры (см. orbit).
    """
    index = {"X": 0, "Y": 1, "Z": 2}[axis]
    euler = list(obj.rotation_euler)
    euler[index] += math.radians(degrees)
    obj.rotation_euler = euler
    return obj


def orbit(obj: bpy.types.Object, degrees: float, axis: str = "X") -> bpy.types.Object:
    """Поворот вокруг начала координат МОДЕЛИ: крутится и положение тоже.

    Разница с turn() стоила отдельного разбора и потому записана здесь. У
    объекта, поставленного через move(), сдвиг лежит в location, а turn()
    правит только rotation — Blender применяет поворот ДО сдвига, и деталь
    остаётся там же, где стояла, лишь развернувшись. Для наклона фигуры это
    смертельно: волосы и наплечники уезжают с головы и плеч, а всё, что
    построено абсолютными координатами прямо в меше, наклоняется правильно.
    Поэтому здесь поворачивается ещё и вектор положения.
    """
    index = {"X": 0, "Y": 1, "Z": 2}[axis]
    euler = list(obj.rotation_euler)
    euler[index] += math.radians(degrees)
    obj.rotation_euler = euler
    letter = {"X": "X", "Y": "Y", "Z": "Z"}[axis]
    obj.location = Matrix.Rotation(math.radians(degrees), 3, letter) @ Vector(obj.location)
    return obj


def world_points(objects: list[bpy.types.Object]) -> list[Vector]:
    """Все вершины всех объектов в мировых координатах. По ним считается кадр.

    Пересчёт слоя обязателен: matrix_world Blender считает лениво, и сразу после
    move()/turn() объект ещё отдаёт старую матрицу. Кадр тогда строится по
    позициям до сдвига, и половина ассета уезжает за край картинки.
    """
    bpy.context.view_layer.update()
    points = []
    for obj in objects:
        matrix = obj.matrix_world
        for vert in obj.data.vertices:
            points.append(matrix @ vert.co)
    return points
