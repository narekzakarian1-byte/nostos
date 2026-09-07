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
    "bronze": (0.42, 1.0, 0.0),
    "gold": (0.22, 1.0, 0.0),
    "clay": (0.60, 0.0, 0.0),
    "wood": (0.80, 0.0, 0.0),
    "foliageDry": (0.90, 0.0, 0.0),
    "ember": (0.70, 0.0, 3.0),
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
    if emission > 0.0:
        lit = hex_to_linear(tones[name][0])
        _set(bsdf, "Emission Color", (*lit, 1.0))
        _set(bsdf, "Emission Strength", emission)
    return mat


def library(names: list[str], seed: int = 0, tone_shift: float = 0.06) -> dict:
    """Набор материалов на один ассет. Один вызов — один согласованный комплект."""
    return {n: make(n, seed=seed + i, tone_shift=tone_shift) for i, n in enumerate(names)}
