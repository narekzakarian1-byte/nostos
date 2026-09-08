"""Одиссей — фигура игрока.

Собран из костей lib/figure.py: торс с головой, две руки, две ноги, плащ.
Кости рендерятся отдельными файлами и шевелятся в игре (src/ui/rig/), поэтому
поза здесь ровно одна — покой. Замах, шаг и наклон считает движок, и
смоделированная поза вошла бы с ним в конфликт.

Узнаётся четырьмя вещами, и каждая работает на силуэте, залитом чёрным:
борода, багряный плащ, бронзовый панцирь и то, что он единственный на острове
без шлема. Голова открыта намеренно — герой обязан отличаться от врага раньше,
чем зритель разберёт детали.
"""

from __future__ import annotations

from lib import figure, materials, shapes, solids
from lib.rig import Bone

KIND = "figure"
ID = "odysseus"
VERSION = 1

MATS = ["skin", "linen", "bronze", "woodDark", "hair", "crimson"]


def look() -> dict:
    spec = figure.default_look()
    spec.update({
        "tunic": "linen",
        "armor": "bronze",
        "cloak": "crimson",
        "strap": "woodDark",
        "helmet": None,
        "greaves": True,
        "bulk": 1.0,
    })
    return spec


def _mats(seed: int) -> dict:
    return materials.library(MATS, seed=seed)


def _torso(ctx, coll):
    mats = _mats(ctx.seed)
    spec = look()
    parts = figure.torso(coll, mats, spec, ctx.seed)

    # Наручи: две бронзовые полосы на предплечьях героя. Метка ранга уехала с
    # головы на руки намеренно — на голове любая горизонтальная полоса
    # садится на линию глаз и читается деталью лица, а не украшением.

    for obj in parts:
        figure.lean(obj)
    return parts


def _limb(builder, name: str, mirror: bool):
    def make(ctx, coll):
        mats = _mats(ctx.seed)
        parts = builder(coll, mats, look(), ctx.seed, name=name)
        for obj in parts:
            if mirror:
                obj.scale = (-1.0, 1.0, 1.0)
            figure.lean(obj)
        return parts
    return make


def _cloak(ctx, coll):
    mats = _mats(ctx.seed)
    parts = figure.cloak(coll, mats, look(), ctx.seed)
    for obj in parts:
        figure.lean(obj)
    return parts


# Порядок списка — порядок отрисовки, от дальнего к ближнему: плащ за спину,
# задние конечности за торс, ведущая рука с оружием поверх всего.
#
# Ближние конечности сдвинуты к камере (отрицательный y), дальние — от неё.
# Это не украшение: разница в глубине даёт им разную высоту на экране, и без
# неё две ноги садятся на одну линию, а шаг перестаёт читаться.
def bones(ctx):
    return [
        Bone(id="cloak", build=_cloak, at=(0.0, 0.36, figure.SHOULDER_Z + 0.62)),
        Bone(id="legBack", build=_limb(figure.leg, "legB", True),
             at=(figure.HIP_X, 0.30, figure.HIP_Z), behind=True),
        Bone(id="armOff", build=_limb(figure.arm, "armO", True),
             at=(figure.SHOULDER_X, 0.30, figure.SHOULDER_Z), behind=True),
        Bone(id="torso", build=_torso, at=(0.0, 0.0, 0.0)),
        Bone(id="legFront", build=_limb(figure.leg, "legF", False),
             at=(-figure.HIP_X, -0.30, figure.HIP_Z)),
        Bone(id="armMain", build=_limb(figure.arm, "armM", False),
             at=(-figure.SHOULDER_X, -0.30, figure.SHOULDER_Z),
             hand=figure.hand_point(look())),
    ]
