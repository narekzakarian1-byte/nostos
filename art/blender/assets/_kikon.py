"""Общая сборка кикона — народа первого острова.

Три тира носят один костюм и различаются снаряжением: рядовой в шкурах,
элита в шлеме, вождь в бронзе с гребнем. Общая сборка здесь, а не копией в
каждом модуле, ровно поэтому: остров — одна семья (ISLANDS.md §1.5), и если
костюм разъедется, эскалация перестанет читаться как рост одного и того же
противника.

Киконы держатся в земляных тонах — охра, бурое дерево, зелёная патина. Одиссей
рядом с ними идёт кремовым, полированной бронзой и багрецом. Это не украшение,
а разделение по цветовому тону: на телефоне игрок обязан отличить себя от врага
раньше, чем разберёт форму.
"""

from __future__ import annotations

from lib import figure, materials, shapes, solids
from lib.rig import Bone

MATS = ["skin", "wood", "clay", "woodDark", "hair", "patina",
        "foliageDark", "bone", "crimson"]


def look(tier: str) -> dict:
    spec = figure.default_look()
    spec.update({"tunic": "wood", "strap": "woodDark", "metal": "patina", "hair": "hair"})
    if tier == "normal":
        spec.update({"armor": None, "helmet": None, "beard": True, "bulk": 0.94})
    elif tier == "elite":
        spec.update({"armor": "clay", "helmet": "pilos", "beard": True, "bulk": 1.0})
    else:
        spec.update({
            "armor": "patina", "helmet": "thracian", "crest": "crimson",
            "cloak": "foliageDark", "greaves": True, "beard": True, "bulk": 1.12,
        })
    return spec


def mats(seed: int) -> dict:
    return materials.library(MATS, seed=seed)


def torso(tier: str):
    def make(ctx, coll):
        m = mats(ctx.seed)
        spec = look(tier)
        parts = figure.torso(coll, m, spec, ctx.seed)
        if tier == "normal":
            # Шкура через плечо: у рядового это единственная деталь снаряжения,
            # и она же — та неровная диагональ, по которой он отличается от
            # ровного силуэта элиты.
            pelt = shapes.new_object(
                "pelt",
                solids.slab(1.10, 0.40, 2.60, at=(-0.34, -0.62, figure.WAIST_Z + 0.20),
                            shift=(0.92, 0.0)),
                m["woodDark"], coll,
            )
            shapes.bevel(pelt, 0.10)
            parts.append(pelt)
        if tier == "chief":
            # Бычий череп на груди — знак вождя (ISLANDS.md §1.5).
            skull = shapes.new_object(
                "trophy",
                solids.dome(0.62, 0.44, 0.60, sides=9, rows=2),
                m["bone"], coll,
            )
            shapes.turn(skull, -84.0, "X")
            shapes.move(skull, dy=-0.86, dz=figure.SHOULDER_Z - 1.30)
            parts.append(skull)
            for side in (-1, 1):
                horn = shapes.new_object(
                    f"horn{side}",
                    solids.cone(0.14, 0.68, sides=6, top=0.02),
                    m["bone"], coll,
                )
                shapes.turn(horn, side * 62.0, "Y")
                shapes.move(horn, side * 0.44, -0.86, figure.SHOULDER_Z - 0.96)
                parts.append(horn)
        for obj in parts:
            figure.lean(obj)
        return parts
    return make


def _limb(builder, tier: str, name: str, mirror: bool):
    def make(ctx, coll):
        parts = builder(coll, mats(ctx.seed), look(tier), ctx.seed, name=name)
        for obj in parts:
            if mirror:
                obj.scale = (-1.0, 1.0, 1.0)
            figure.lean(obj)
        return parts
    return make


def _cloak(tier: str):
    def make(ctx, coll):
        parts = figure.cloak(coll, mats(ctx.seed), look(tier), ctx.seed)
        for obj in parts:
            figure.lean(obj)
        return parts
    return make


def bones(tier: str):
    """Кости тира. Плащ есть только у вождя — по нему он и читается издалека."""
    spec = look(tier)
    out = []
    if spec["cloak"]:
        out.append(Bone(id="cloak", build=_cloak(tier),
                        at=(0.0, 0.36, figure.SHOULDER_Z + 0.62)))
    out += [
        Bone(id="legBack", build=_limb(figure.leg, tier, "legB", True),
             at=(figure.HIP_X, 0.30, figure.HIP_Z), behind=True),
        Bone(id="armOff", build=_limb(figure.arm, tier, "armO", True),
             at=(figure.SHOULDER_X, 0.30, figure.SHOULDER_Z), behind=True),
        Bone(id="torso", build=torso(tier), at=(0.0, 0.0, 0.0)),
        Bone(id="legFront", build=_limb(figure.leg, tier, "legF", False),
             at=(-figure.HIP_X, -0.30, figure.HIP_Z)),
        Bone(id="armMain", build=_limb(figure.arm, tier, "armM", False),
             at=(-figure.SHOULDER_X, -0.30, figure.SHOULDER_Z),
             hand=figure.hand_point(spec)),
    ]
    return out
