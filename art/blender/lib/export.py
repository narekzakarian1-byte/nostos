"""Метрики ассета: всё, что движку нужно знать о картинке.

Якорь, габарит и след считаются из модели, а не подбираются глазами по PNG.
Промахнуться ими нельзя по построению: точка касания земли — это начало
координат модели.
"""

from __future__ import annotations

import hashlib
import json
import math
from pathlib import Path

import bpy

from . import optics, shapes


def balance_hash() -> str:
    """Отпечаток оптики и палитры.

    Ловит главную опасность пре-рендера: кто-то правит камеру или свет в
    balance.json, а ассеты остаются от старой оптики и тихо разъезжаются с
    новыми. Хеш не совпал — импортёр обязан отказаться.
    """
    p = optics.props()
    # Строка собирается вручную, а не через json.dumps: импортёр считает тот же
    # хеш на JS, а сериализация словаря в Python и в Node различается пробелами
    # и форматом чисел. Здесь же обе стороны складывают одни и те же значения в
    # один и тот же порядок.
    fields = [
        f"tilt={p['cameraTiltDeg']}",
        f"light={p['lightX']},{p['lightY']},{p['lightZ']}",
        f"shadow={p['shadowColor']},{p['shadowAlpha']}",
    ]
    for name in sorted(p["materials"]):
        tones = p["materials"][name]
        if isinstance(tones, list):
            fields.append(f"{name}={','.join(tones)}")
    return hashlib.sha1("|".join(fields).encode("utf-8")).hexdigest()[:12]


def footprint(body_objects, model_to_world: float, ground_share: float = 0.20):
    """След на земле: полуоси эллипса в единицах мира.

    Считается по геометрии, которая действительно СТОИТ на земле — по нижней
    доле объекта, — а не по всему габариту: иначе карниз наверху цеплял бы
    игрока за пустое место далеко от опор.

    ry меньше rx, потому что мир игры — это уже экран: земля в нём сжата
    наклоном камеры (Blockers.ts).
    """
    points = shapes.world_points(body_objects)
    zs = [p.z for p in points]
    low, high = min(zs), max(zs)
    cut = low + (high - low) * ground_share
    base = [p for p in points if p.z <= cut] or points

    rx = (max(p.x for p in base) - min(p.x for p in base)) / 2.0
    ry = (max(p.y for p in base) - min(p.y for p in base)) / 2.0
    squash = math.sin(optics.tilt_rad())
    return {
        "rx": round(rx * model_to_world, 1),
        "ry": round(ry * model_to_world * squash, 1),
    }


def triangles(body_objects) -> int:
    total = 0
    depsgraph = bpy.context.evaluated_depsgraph_get()
    for obj in body_objects:
        mesh = obj.evaluated_get(depsgraph).to_mesh()
        total += sum(len(p.vertices) - 2 for p in mesh.polygons)
        obj.evaluated_get(depsgraph).to_mesh_clear()
    return total


def write(
    asset_id: str,
    frame,
    body_objects,
    seed: int,
    px_per_world: float,
    size: dict,
    version: int,
    script: str,
    out_dir: Path,
) -> dict:
    box_w, box_h = frame.box_world
    ax, ay = frame.anchor
    data = {
        "id": asset_id,
        "version": version,
        "script": script,
        "seed": seed,
        "blender": bpy.app.version_string,
        "balanceHash": balance_hash(),
        "pxPerUnit": px_per_world,
        "size": size,
        "pixels": {"width": frame.width, "height": frame.height},
        "box": {"width": round(box_w, 2), "height": round(box_h, 2)},
        "anchor": {"x": round(ax, 5), "y": round(ay, 5)},
        "footprint": footprint(body_objects, frame.model_to_world),
        "tris": triangles(body_objects),
    }
    out_dir.mkdir(parents=True, exist_ok=True)
    with open(out_dir / f"{asset_id}.json", "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
        f.write("\n")
    return data
