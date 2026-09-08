"""Растительность Исмары: кипарис, пиния, олива, куст, тростник, шпалера.

Одним модулем, а не шестью, потому что все шесть — это lib/flora.py с разными
числами. Разнеси их по файлам, и через месяц крона куста разойдётся с кроной
оливы, хотя обе делает одна функция.

Растительность в этой камере несёт вертикаль. Кипарис выше ворот и уже колонны:
он единственный объект острова, который упирается в верхнюю кромку экрана, и
именно на нём держится ощущение, что мир имеет высоту.
"""

from __future__ import annotations

from lib import flora, materials, optics

KIND = "props"
VERSION = 1
VARIANTS = [
    "prop-cypress", "prop-pine", "prop-olive",
    "prop-shrub", "prop-reeds", "prop-vines",
]

MATS = ["wood", "woodDark", "foliage", "foliageDark", "foliageDry", "grape"]


def build(ctx, variant: str):
    mats = materials.library(MATS, seed=ctx.seed)
    # Высота модели берётся из мировой: пропорции кроны считаются от неё, и
    # менять размер объекта можно правкой одного числа в balance.json.
    size = optics.props()["sizes"][variant]["value"]
    seed = ctx.seed

    if variant == "prop-cypress":
        return flora.cypress(ctx.body, mats, seed, height=size * 0.11)
    if variant == "prop-pine":
        return flora.pine(ctx.body, mats, seed, height=size * 0.11)
    if variant == "prop-olive":
        return flora.olive(ctx.body, mats, seed, height=size * 0.115)
    if variant == "prop-shrub":
        return flora.shrub(ctx.body, mats, seed, height=size * 0.14)
    if variant == "prop-reeds":
        return flora.reeds(ctx.body, mats, seed, height=size * 0.16)
    if variant == "prop-vines":
        return flora.vine_row(ctx.body, mats, seed, height=size * 0.062, span=size * 0.088)
    raise KeyError(variant)
