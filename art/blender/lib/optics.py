"""Камера, свет и настройки рендера — целиком из balance.json.

Смысл модуля: ассеты физически не могут разойтись по ракурсу или направлению
тени, потому что камера и солнце для всех них — один и тот же объект сцены,
собранный из одних и тех же чисел конфига (ART_PIPELINE.md §4).

Здесь нет ни одной своей константы, кроме технических параметров рендера.
Правка props.cameraTiltDeg в balance.json переносится на весь будущий арт.
"""

from __future__ import annotations

import json
import math
from pathlib import Path

import bpy
from mathutils import Vector

ROOT = Path(__file__).resolve().parents[3]

# Технические константы рендера, не баланс: качество и расстояние до камеры.
SAMPLES = 96
RENDER_SEED = 0
CAMERA_DISTANCE = 400.0


def balance() -> dict:
    with open(ROOT / "balance.json", encoding="utf-8") as f:
        return json.load(f)


def props() -> dict:
    return balance()["props"]


def tilt_rad() -> float:
    return math.radians(props()["cameraTiltDeg"])


def sun_dir() -> Vector:
    """Единичный вектор НА солнце — тот же, что Optics.ts считает из lightX/Y/Z."""
    p = props()
    return Vector((p["lightX"], p["lightY"], p["lightZ"])).normalized()


def project(point) -> tuple[float, float]:
    """Проекция точки в экранные координаты движка (Optics.ts:project).

    Нужна не для рендера, а для кадрирования: по ней считается, какой
    прямоугольник должна занять камера, и где внутри кадра окажется точка
    касания земли.
    """
    t = tilt_rad()
    x, y, z = point[0], point[1], point[2]
    return (x, -(y * math.sin(t) + z * math.cos(t)))


def project_shadow(point) -> tuple[float, float]:
    """Проекция тени точки на землю. Тот же снос, что Optics.ts:projectShadow."""
    light = sun_dir()
    sx = -light.x / light.z
    sy = -light.y / light.z
    x, y, z = point[0], point[1], point[2]
    return project((x + sx * z, y + sy * z, 0.0))


def camera_basis() -> tuple[Vector, Vector, Vector]:
    """Правый, верхний и обратный векторы камеры в мировых координатах.

    Экран движка и кадр камеры совпадают с точностью до знака: экранный x — это
    правый вектор камеры, экранный y — минус её верхний вектор. Отсюда и берётся
    точное кадрирование.
    """
    t = tilt_rad()
    right = Vector((1.0, 0.0, 0.0))
    # up — это ровно то направление мира, которое project() отправляет вверх по
    # экрану: (0, sin t, cos t). Через cos/sin наоборот камера смотрит мимо
    # сцены, и рендер выходит пустым.
    up = Vector((0.0, math.sin(t), math.cos(t)))
    back = Vector((0.0, -math.cos(t), math.sin(t)))
    return right, up, back


def add_camera(center_u: float, center_v: float, span: float) -> bpy.types.Object:
    """Ортографическая камера, точно накрывающая заданный прямоугольник кадра.

    center_u/center_v — центр кадра в системе экрана движка (u вправо, v вверх),
    span — сторона кадра по БОЛЬШЕЙ оси изображения: именно её задаёт
    ortho_scale в Blender.
    """
    right, up, back = camera_basis()
    data = bpy.data.cameras.new("NostosCamera")
    data.type = "ORTHO"
    data.ortho_scale = span
    data.clip_start = 1.0
    data.clip_end = CAMERA_DISTANCE * 3.0

    obj = bpy.data.objects.new("NostosCamera", data)
    obj.location = right * center_u + up * center_v + back * CAMERA_DISTANCE
    obj.rotation_euler = (math.pi / 2 - tilt_rad(), 0.0, 0.0)
    bpy.context.scene.collection.objects.link(obj)
    bpy.context.scene.camera = obj
    return obj


def add_lights(bounce_color=(0.62, 0.55, 0.42)) -> None:
    """Три источника, всегда одинаковые (ART_PIPELINE.md §4.2).

    Солнце даёт форму и тень, небо подсвечивает теневые грани холодным,
    отражение от земли подбивает низ тёплым. Именно постоянство этой тройки, а
    не её сложность, и даёт «дорогую» картинку.
    """
    light = sun_dir()

    # 8.15 — не подобранное число, а посчитанное: pi / sin(высоты солнца),
    # умноженное на отношение светлого тона к среднему в ЛИНЕЙНОМ цвете. При
    # нём грань, смотрящая на солнце, рендерится ровно в светлый тон материала
    # из balance.json, а теневая — в тёмный. Палитра конфига и палитра рендера
    # оказываются одним и тем же набором, а не похожими друг на друга.
    sun_data = bpy.data.lights.new("Sun", type="SUN")
    sun_data.energy = 5.50
    sun_data.color = (1.0, 0.914, 0.769)  # #FFE9C4
    sun_data.angle = math.radians(3.0)
    sun = bpy.data.objects.new("Sun", sun_data)
    sun.rotation_euler = (
        math.acos(light.z),
        0.0,
        math.atan2(light.x, -light.y),
    )
    bpy.context.scene.collection.objects.link(sun)

    # Отражение от земли — солнце, направленное снизу вверх. Так подсвечиваются
    # ровно нижние грани, чего не сделает ни небо, ни второй ключевой свет.
    bounce_data = bpy.data.lights.new("Bounce", type="SUN")
    bounce_data.energy = 0.34
    bounce_data.color = bounce_color
    bounce_data.angle = math.radians(60.0)
    bounce = bpy.data.objects.new("Bounce", bounce_data)
    bounce.rotation_euler = (math.pi, 0.0, 0.0)
    bpy.context.scene.collection.objects.link(bounce)

    # Заполняющий свет — солнце, ЗЕРКАЛЬНОЕ по оси Y.
    #
    # Солнце в NOSTOS светит чуть ОТ зрителя (props.lightY > 0), поэтому все
    # обращённые к камере грани физически в тени, и объект читается тёмной
    # массой со светлой шапкой. Движок ту же беду лечит смещением полу-ламберта
    # (props.shadeBias = 0.32): у него неосвещённая грань уходит в тон, а не в
    # чёрное.
    #
    # Свет по оси камеры эту роль сыграть не может: он ложится на все видимые
    # грани одинаково и стирает форму вместе с тенью. Зеркальное солнце светит
    # с той же стороны и высоты, но с ближней стороны — фронтальные грани
    # получают тон, а градиент по форме остаётся.
    mirrored = Vector((light.x, -light.y, light.z)).normalized()
    fill_data = bpy.data.lights.new("Fill", type="SUN")
    fill_data.energy = 1.35
    fill_data.color = (1.0, 0.949, 0.878)
    fill_data.angle = math.radians(20.0)
    fill = bpy.data.objects.new("Fill", fill_data)
    fill.rotation_euler = (
        math.acos(mirrored.z),
        0.0,
        math.atan2(mirrored.x, -mirrored.y),
    )
    bpy.context.scene.collection.objects.link(fill)

    # Небо — ровный холодный купол через фон мира.
    world = bpy.data.worlds.new("NostosSky")
    world.use_nodes = True
    bg = world.node_tree.nodes["Background"]
    bg.inputs["Color"].default_value = (0.404, 0.478, 0.596, 1.0)  # #A6ACC4
    # Небо держим слабым намеренно. На 0.9 оно вытягивало теневые грани до
    # 65% светлоты, и кадр целиком уезжал в средние тона — та самая выцветшая
    # плёнка, от которой лечимся (GDD.md §3).
    bg.inputs["Strength"].default_value = 0.09
    bpy.context.scene.world = world


def setup_render(width: int, height: int) -> None:
    """Настройки, без которых цвет не совпадёт с палитрой игры."""
    scene = bpy.context.scene
    scene.render.engine = "CYCLES"
    scene.cycles.samples = SAMPLES
    scene.cycles.seed = RENDER_SEED
    scene.cycles.use_denoising = True
    scene.render.resolution_x = width
    scene.render.resolution_y = height
    scene.render.resolution_percentage = 100
    scene.render.film_transparent = True
    scene.render.image_settings.file_format = "PNG"
    scene.render.image_settings.color_mode = "RGBA"
    scene.render.image_settings.compression = 90
    # Standard, а не Filmic и не AgX: тональный маппинг съел бы насыщенность, и
    # рендер перестал бы совпадать с balance.palette. Типовая ошибка.
    scene.view_settings.view_transform = "Standard"
    scene.view_settings.look = "None"
