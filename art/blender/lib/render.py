"""Кадрирование и два прохода рендера: тело и тень.

Кадр не подбирается на глаз и не обрезается по альфе — он считается
арифметически из той же проекции, которой пользуется движок. Поэтому положение
точки касания земли внутри картинки известно точно, а не подгоняется руками,
как раньше подбирался якорь спрайта.

Тень идёт отдельным файлом. Она половина эффекта: без неё объект висит над
травой при любом качестве самого объекта (ART_PIPELINE.md §4.4).
"""

from __future__ import annotations

import math
from pathlib import Path

import bpy
import numpy as np

from . import optics, shapes

MARGIN = 0.02  # запас кадра в долях: фаска и сглаживание чуть шире исходных вершин


def _uv(point) -> tuple[float, float]:
    """Точка в координатах кадра: u вправо, v ВВЕРХ (у движка экранный y вниз)."""
    sx, sy = optics.project(point)
    return (sx, -sy)


def _uv_shadow(point) -> tuple[float, float]:
    sx, sy = optics.project_shadow(point)
    return (sx, -sy)


def _bounds(pairs) -> tuple[float, float, float, float]:
    us = [p[0] for p in pairs]
    vs = [p[1] for p in pairs]
    return (min(us), min(vs), max(us), max(vs))


class Frame:
    """Кадр: прямоугольник в координатах экрана и всё, что из него следует."""

    def __init__(self, body_objects, world_size: float, fit: str, px_per_world: float):
        points = shapes.world_points(body_objects)
        body = _bounds([_uv(p) for p in points])
        shadow = _bounds([_uv_shadow(p) for p in points])

        self.body_width = body[2] - body[0]
        self.body_height = body[3] - body[1]
        # Масштаб модели в единицы мира: задаётся ТЕЛОМ, не кадром с тенью.
        span = self.body_height if fit == "height" else self.body_width
        self.model_to_world = world_size / span
        self.px_per_model = px_per_world * self.model_to_world

        u0 = min(body[0], shadow[0])
        v0 = min(body[1], shadow[1])
        u1 = max(body[2], shadow[2])
        v1 = max(body[3], shadow[3])
        pad = max(u1 - u0, v1 - v0) * MARGIN
        u0, v0, u1, v1 = u0 - pad, v0 - pad, u1 + pad, v1 + pad

        self.width = max(1, math.ceil((u1 - u0) * self.px_per_model))
        self.height = max(1, math.ceil((v1 - v0) * self.px_per_model))
        # Прямоугольник расширяется до целого числа пикселей, чтобы масштаб
        # рендера и масштаб метрик совпадали до последнего пикселя.
        exact_w = self.width / self.px_per_model
        exact_h = self.height / self.px_per_model
        cu, cv = (u0 + u1) / 2.0, (v0 + v1) / 2.0
        self.u0, self.u1 = cu - exact_w / 2.0, cu + exact_w / 2.0
        self.v0, self.v1 = cv - exact_h / 2.0, cv + exact_h / 2.0

        self.center_u, self.center_v = cu, cv
        self.span = exact_w if self.width >= self.height else exact_h

    @property
    def anchor(self) -> tuple[float, float]:
        """Точка касания земли (начало координат модели) в долях картинки."""
        return ((0.0 - self.u0) / (self.u1 - self.u0), (self.v1 - 0.0) / (self.v1 - self.v0))

    @property
    def box_world(self) -> tuple[float, float]:
        """Габарит всей картинки в единицах мира — по нему движок её рисует."""
        return (
            (self.u1 - self.u0) * self.model_to_world,
            (self.v1 - self.v0) * self.model_to_world,
        )


def ground_plane(helpers, frame: Frame) -> bpy.types.Object:
    """Плоскость, на которую падает тень. Заведомо больше кадра, лежит в z = 0.

    Белая матовая, а не shadow catcher. Cycles-ловушка отдаёт альфу, которая
    включает собственное покрытие плоскости, и тень приезжает сплошной плитой на
    весь кадр. Белая плоскость даёт то, что нужно, и не зависит от семантики
    движка: где света меньше — там тень, и её форма читается прямо из яркости.
    """
    size = max(frame.u1 - frame.u0, frame.v1 - frame.v0) * 4.0
    obj = shapes.new_object(
        "ShadowPlane",
        shapes.block(size, size, 0.001, at=(frame.center_u, 0.0, -0.001)),
        _white(),
        helpers,
    )
    return obj


def _white() -> bpy.types.Material:
    mat = bpy.data.materials.new("ShadowPlane")
    mat.use_nodes = True
    bsdf = mat.node_tree.nodes["Principled BSDF"]
    bsdf.inputs["Base Color"].default_value = (1.0, 1.0, 1.0, 1.0)
    bsdf.inputs["Roughness"].default_value = 1.0
    return mat


def _render_to(path: Path) -> None:
    bpy.context.scene.render.filepath = str(path)
    bpy.ops.render.render(write_still=True)


def passes(body_objects, catcher, frame: Frame, out_dir: Path, name: str) -> tuple[Path, Path]:
    """Тело и тень двумя файлами. Возвращает пути к обоим."""
    out_dir.mkdir(parents=True, exist_ok=True)
    body_path = out_dir / f"{name}.png"
    shadow_path = out_dir / f"{name}-shadow.png"
    scene = bpy.context.scene

    # Проход тела: плоскости в кадре нет, иначе тень запеклась бы в объект.
    catcher.hide_render = True
    scene.render.film_transparent = True
    for obj in body_objects:
        obj.visible_camera = True
    _render_to(body_path)

    # Проход тени: объекты не видны камере, но тень по-прежнему бросают.
    # Фон непрозрачный: нам нужна ЯРКОСТЬ плоскости, а не её альфа.
    catcher.hide_render = False
    scene.render.film_transparent = False
    for obj in body_objects:
        obj.visible_camera = False
    _render_to(shadow_path)
    for obj in body_objects:
        obj.visible_camera = True
    scene.render.film_transparent = True

    _mask_shadow(shadow_path)
    return body_path, shadow_path


def _mask_shadow(path: Path) -> None:
    """Из яркости освещённой плоскости — маска тени в цвете props.shadowColor.

    Нормируется по самому светлому пикселю кадра: это и есть «плоскость без
    тени», и относительно него считается, насколько затемнён каждый другой.
    Абсолютные значения брать нельзя — они поедут при любой правке экспозиции.

    Тень в игре на траве — это та же зелень на 40% темнее
    (balance.json props._shadowMeasureNote): холодный серый на зелёном читается
    грязью, а не тенью.
    """
    from .materials import hex_to_linear

    p = optics.props()
    color = hex_to_linear(p["shadowColor"])
    alpha = p["shadowAlpha"]

    image = bpy.data.images.load(str(path))
    pixels = np.empty(len(image.pixels), dtype=np.float32)
    image.pixels.foreach_get(pixels)
    pixels = pixels.reshape(-1, 4)

    lum = 0.2126 * pixels[:, 0] + 0.7152 * pixels[:, 1] + 0.0722 * pixels[:, 2]
    full = np.percentile(lum, 99.0)
    if full <= 1e-6:
        full = 1.0
    mask = np.clip(1.0 - lum / full, 0.0, 1.0)

    pixels[:, 0] = color[0]
    pixels[:, 1] = color[1]
    pixels[:, 2] = color[2]
    pixels[:, 3] = mask * alpha
    image.pixels.foreach_set(pixels.reshape(-1))
    image.file_format = "PNG"
    image.save()
    bpy.data.images.remove(image)
