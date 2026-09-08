"""Библиотека материалов NOSTOS.

Цвета берутся из balance.json (props.materials) — там же, откуда их берёт
движок для геометрических пропов. Иначе мрамор рендера и мрамор движка
разъехались бы, и это была бы та же болезнь, от которой мы лечимся.

Шероховатость, металличность и эмиссия живут здесь, а не в конфиге: движок их
не видит вообще — он получает готовый PNG. В balance.json им делать нечего.
"""

from __future__ import annotations

import bpy

from . import optics
from .variants import jitter

# Поведение материала под светом. Ключ — имя из balance.json props.materials.
# (roughness, metallic, emission_strength)
BEHAVIOUR = {
    "marble": (0.52, 0.0, 0.0),
    "limestone": (0.82, 0.0, 0.0),
    "stone": (0.78, 0.0, 0.0),
    "rubble": (0.85, 0.0, 0.0),
    "clay": (0.60, 0.0, 0.0),
    "wood": (0.80, 0.0, 0.0),
    "woodDark": (0.88, 0.0, 0.0),
    "thatch": (0.92, 0.0, 0.0),
    "ash": (0.94, 0.0, 0.0),
    # Металлы. Полированная бронза и золото — металлические, патина уже нет:
    # окисел рассеивает, и металличность на нём даёт зеркало вместо зелени.
    "bronze": (0.34, 1.0, 0.0),
    "patina": (0.66, 0.2, 0.0),
    "gold": (0.22, 1.0, 0.0),
    "iron": (0.44, 1.0, 0.0),
    "ember": (0.70, 0.0, 3.0),
    "foliage": (0.88, 0.0, 0.0),
    "foliageDark": (0.86, 0.0, 0.0),
    "foliageDry": (0.90, 0.0, 0.0),
    "grape": (0.55, 0.0, 0.0),
    "skin": (0.62, 0.0, 0.0),
    "linen": (0.86, 0.0, 0.0),
    "crimson": (0.78, 0.0, 0.0),
    "hair": (0.80, 0.0, 0.0),
    "bone": (0.72, 0.0, 0.0),
    "sand": (0.92, 0.0, 0.0),
    "grass": (0.92, 0.0, 0.0),
    "dirt": (0.92, 0.0, 0.0),
    # Чернота зева пещеры и дверного проёма. Шероховатость на единице, чтобы
    # ни одна грань не поймала блик: провал обязан оставаться провалом.
    "voidDark": (1.0, 0.0, 0.0),
}

# Базовый цвет — СРЕДНИЙ тон из balance.json.
#
# Свет откалиброван под него: солнце даёт ровно тот прирост, который переводит
# средний тон в светлый, а небо с отражением — тот спад, который переводит его
# в тёмный. Поэтому три тона рендера и три тона конфига совпадают по
# построению, и рендерёный проп встаёт рядом с геометрическим (ui/props/) без
# подгонки цвета.
BASE_TONE = 1


def _srgb_to_linear(c: float) -> float:
    return c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4


def hex_to_linear(value: str) -> tuple[float, float, float]:
    r = int(value[1:3], 16) / 255.0
    g = int(value[3:5], 16) / 255.0
    b = int(value[5:7], 16) / 255.0
    return (_srgb_to_linear(r), _srgb_to_linear(g), _srgb_to_linear(b))


def _set(bsdf, name: str, value) -> None:
    """Вход по имени, если он есть: имена входов Principled менялись между версиями."""
    if name in bsdf.inputs:
        bsdf.inputs[name].default_value = value


def make(name: str, seed: int = 0, tone_shift: float = 0.0) -> bpy.types.Material:
    """Материал по имени из balance.json props.materials.

    tone_shift — сидированное отклонение светлоты в долях. Без него десять
    колонн выглядят десятью копиями одного файла (ART_PIPELINE.md §3.3).
    """
    tones = optics.props()["materials"]
    if name not in tones:
        raise KeyError(f"нет материала «{name}» в balance.json props.materials")

    roughness, metallic, emission = BEHAVIOUR.get(name, (0.75, 0.0, 0.0))
    base = hex_to_linear(tones[name][BASE_TONE])
    shift = 1.0 + tone_shift * jitter(seed, name)
    color = tuple(min(1.0, max(0.0, c * shift)) for c in base)

    mat = bpy.data.materials.new(f"{name}.{seed}")
    mat.use_nodes = True
    bsdf = mat.node_tree.nodes["Principled BSDF"]
    _set(bsdf, "Base Color", (*color, 1.0))
    _set(bsdf, "Roughness", roughness)
    _set(bsdf, "Metallic", metallic)
    # Зеркальный отблеск у неметаллов почти выключен. При заводских 0.5 грань,
    # смотрящая на солнце, ловила блик поверх и без того светлого тона и
    # уходила в чистый белый: замер светлот упирался в 100%, а на картинке это
    # выглядит пластиком. Камню, ткани и коже блик не нужен вовсе.
    if metallic < 0.5:
        _set(bsdf, "Specular IOR Level", 0.12)
    if emission > 0.0:
        lit = hex_to_linear(tones[name][0])
        _set(bsdf, "Emission Color", (*lit, 1.0))
        _set(bsdf, "Emission Strength", emission)
    return mat


def from_tone(name: str, index: int, seed: int = 0) -> bpy.types.Material:
    """Материал из КОНКРЕТНОГО тона таблицы, а не из среднего.

    Нужен там, где объект обязан отличаться от соседа только светлотой:
    галька на лугу — это та же трава, но темнее, а не другой материал.
    Взять для неё чужой материал значит получить цветное пятно на зелёном.
    """
    tones = optics.props()["materials"][name]
    roughness, metallic, emission = BEHAVIOUR.get(name, (0.75, 0.0, 0.0))
    mat = bpy.data.materials.new(f"{name}.{index}.{seed}")
    mat.use_nodes = True
    bsdf = mat.node_tree.nodes["Principled BSDF"]
    _set(bsdf, "Base Color", (*hex_to_linear(tones[index]), 1.0))
    _set(bsdf, "Roughness", roughness)
    _set(bsdf, "Metallic", metallic)
    if metallic < 0.5:
        _set(bsdf, "Specular IOR Level", 0.12)
    return mat


def library(names: list[str], seed: int = 0, tone_shift: float = 0.06) -> dict:
    """Набор материалов на один ассет. Один вызов — один согласованный комплект."""
    return {n: make(n, seed=seed + i, tone_shift=tone_shift) for i, n in enumerate(names)}
