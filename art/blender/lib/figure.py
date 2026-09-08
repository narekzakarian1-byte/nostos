"""Человеческая фигура: из чего собран герой и любой пеший враг.

Фигура режется на те же кости, что и раньше рисованная бумажная кукла
(src/ui/rig/RigParts.ts): торс с головой, две руки, две ноги, плащ. Меняется
только источник картинок — теперь это рендер под общей оптикой, а не рисунок.

--- Почему фигура наклонена назад --------------------------------------------

Камера смотрит на мир под наклоном 55°, и вертикаль сжимается до cos 55° = 0.574.
Построенный стоймя человек отдаёт на экран 57% своего роста: получается пенёк,
у которого видно темя и плечи сверху, а лица нет вовсе.

Лечится наклоном САМОЙ ФИГУРЫ назад на LEAN_DEG. Точка на высоте h у наклонённой
на β фигуры проецируется в h·cos(55° − β); при β = 40° это 0.974 — фигура
почти не теряет роста и стоит к зрителю грудью. Оптика при этом не тронута ни
на градус: наклонён объект, а не камера.

Угол выбран не по картинке, а по свету. Нормаль груди у наклонённой фигуры
поднимается на β над горизонтом, и её скалярное произведение с солнцем растёт
вместе с β: на 24° это 0.21, на 32° — 0.33, на 40° — 0.46. Меньший наклон
оставляет героя в собственной тени при любом материале, и никакая палитра этого
уже не исправит.

--- Почему пропорции не анатомические ----------------------------------------

Фигура живёт на экране в 60–110 пикселей. На такой величине канонические
пропорции (голова в 1/7.5 роста) превращают лицо в четыре пикселя, и фигура
теряет единственное, по чему её узнают. Отсюда голова в 1/3.7 роста, плечи в
0.38 роста и короткие ноги: это не «мультяшность», а требование читаемости,
то же самое, по которому в референсе у героя голова размером с грудную клетку.

--- Пивоты -------------------------------------------------------------------

Каждая кость строится вокруг СВОЕГО сустава в начале координат: рука вокруг
плеча, нога вокруг тазобедренного. Тогда пивот картинки — это спроецированное
начало координат, то есть ровно то, что уже считает render.Frame.anchor, и
подгонять его по пикселям не надо (ART_RUNBOOK.md §7: «не подгонять якорь на
глаз»). Торс не вращается, поэтому его начало координат — точка касания земли.
"""

from __future__ import annotations

import math

from . import optics, shapes, solids
from .variants import jitter, unit

HEIGHT = 10.0
LEAN_DEG = 40.0

# Скелет: где какой сустав у стоящей фигуры. Одни и те же числа читают и
# строитель кости, и экспортёр сокетов — разъехаться они не могут.
HIP_Z = 3.72
HIP_X = 0.60
WAIST_Z = 4.62
SHOULDER_Z = 6.72
SHOULDER_X = 1.94
HEAD_Z = 6.86
HEAD_H = 3.20

SIDES = 10


def projected_height() -> float:
    """Рост эталонной фигуры на экране в модульных единицах.

    HEIGHT · cos(наклон камеры − наклон фигуры): из этой величины считается
    ростовая доля оружия, у которого своей фигуры под рукой нет.
    """
    return HEIGHT * math.cos(optics.tilt_rad() - math.radians(LEAN_DEG))


def lean(obj):
    """Наклон детали назад вокруг ПИВОТА КОСТИ, то есть начала её координат.

    Именно orbit, а не turn: деталь, поставленную через move(), turn() крутит
    на месте и оставляет на старом месте — волосы съезжают с головы, наплечник
    с плеча (shapes.orbit).
    """
    return shapes.orbit(obj, -LEAN_DEG, "X")


def lean_point(p: tuple[float, float, float]) -> tuple[float, float, float]:
    """Та же операция для точки: сустав обязан уехать туда же, куда деталь."""
    a = math.radians(-LEAN_DEG)
    x, y, z = p
    return (x, y * math.cos(a) - z * math.sin(a), y * math.sin(a) + z * math.cos(a))


def default_look() -> dict:
    """Костюм по умолчанию. Ассет переопределяет только то, что у него своё."""
    return {
        "skin": "skin",
        "tunic": "linen",       # хитон: основная площадь фигуры
        "armor": None,          # панцирь поверх хитона; None — только ткань
        "metal": "bronze",
        "strap": "woodDark",    # пояс, ремни, обувь — тёмный якорь светлоты
        "hair": "hair",
        "beard": True,
        "helmet": None,         # None | "pilos" | "corinthian" | "thracian"
        "crest": None,
        "cloak": None,
        "greaves": False,
        "shoulderW": SHOULDER_X,
        "bulk": 1.0,
    }


# --- Торс ---------------------------------------------------------------------

def torso(coll, mats: dict, look: dict, seed: int) -> list:
    """Юбка хитона, пояс, панцирь, шея и голова.

    Начало координат — между стопами. Юбка и панцирь разными материалами
    намеренно: горизонтальная граница на поясе делит силуэт пополам, и фигура
    перестаёт быть одной вертикальной колбасой.
    """
    parts = []
    bulk = look["bulk"]
    sw = look["shoulderW"] * bulk
    tunic = mats[look["tunic"]]

    skirt = shapes.new_object(
        "skirt",
        solids.slab(1.84 * bulk, 1.16 * bulk, WAIST_Z - HIP_Z + 0.52,
                    at=(0, 0, HIP_Z - 0.34), top_scale=(0.80, 0.88)),
        tunic, coll,
    )
    shapes.bevel(skirt, 0.16, segments=2)
    parts.append(skirt)

    # Птеруги: четыре широкие полосы, а не восемь узких. Узкие на 90 пикселях
    # сливаются в бахрому и читаются шумом, широкие дают зубчатый край.
    for i in range(4):
        x = (i - 1.5) * 0.52 * bulk
        flap = shapes.new_object(
            f"pteryx{i}",
            solids.slab(0.30 * bulk, 1.10 * bulk, 0.40 + 0.10 * unit(seed, f"pt{i}"),
                        at=(x, -0.04, HIP_Z - 0.40)),
            mats[look["strap"]], coll,
        )
        shapes.bevel(flap, 0.06)
        parts.append(flap)

    belt = shapes.new_object(
        "belt",
        solids.slab(1.56 * bulk, 1.06 * bulk, 0.34, at=(0, 0, WAIST_Z - 0.02)),
        mats[look["strap"]], coll,
    )
    shapes.bevel(belt, 0.08)
    parts.append(belt)

    # Корпус: клин от пояса к плечам. Именно этот клин, а не мускулатура,
    # делает фигуру героической на любом размере.
    chest_m = mats[look["armor"]] if look["armor"] else tunic
    chest = shapes.new_object(
        "chest",
        solids.slab(1.44 * bulk, 1.10 * bulk, SHOULDER_Z - WAIST_Z + 0.42,
                    at=(0, 0, WAIST_Z + 0.06),
                    top_scale=(sw * 1.62 / (1.44 * bulk), 1.02)),
        chest_m, coll,
    )
    shapes.bevel(chest, 0.18, segments=2)
    parts.append(chest)

    if look["armor"]:
        # Нагрудная пластина отдельным телом: её светлая фаска проходит по
        # груди отдельной линией, и панцирь перестаёт быть окрашенным торсом.
        plate = shapes.new_object(
            "plate",
            solids.slab(sw * 1.44, 0.34, 1.24, at=(0, -0.60, SHOULDER_Z - 1.60),
                        top_scale=(1.10, 1.0)),
            mats[look["armor"]], coll,
        )
        shapes.bevel(plate, 0.16, segments=2)
        parts.append(plate)

    neck = shapes.new_object(
        "neck",
        solids.loft([(0.40, 0.38, SHOULDER_Z - 0.14), (0.38, 0.36, HEAD_Z + 0.16)], 8),
        mats[look["skin"]], coll,
    )
    parts.append(neck)

    parts += _head(coll, mats, look, seed)
    return parts


def _head(coll, mats: dict, look: dict, seed: int) -> list:
    """Голова: череп, волосы, борода, шлем. Половина узнавания фигуры."""
    parts = []
    skull = shapes.new_object(
        "skull",
        solids.slab(2.02, 1.74, HEAD_H * 0.62, at=(0, 0, HEAD_Z), top_scale=(0.96, 0.96)),
        mats[look["skin"]], coll,
    )
    shapes.bevel(skull, 0.26, segments=3)
    parts.append(skull)

    if look["helmet"] is None:
        hair = shapes.new_object(
            "hair",
            solids.dome(1.10, 0.98, HEAD_H * 0.34, sides=12, rows=3),
            mats[look["hair"]], coll,
        )
        shapes.move(hair, dz=HEAD_Z + HEAD_H * 0.54)
        parts.append(hair)

    if look["beard"]:
        # Борода широкая и тёмная: на фигуре это единственное большое тёмное
        # пятно у лица, и по нему голова читается головой, а не кубиком.
        beard = shapes.new_object(
            "beard",
            solids.slab(1.60, 0.72, 1.28, at=(0, -0.60, HEAD_Z - 0.26),
                        top_scale=(1.06, 1.0)),
            mats[look["hair"]], coll,
        )
        shapes.bevel(beard, 0.18, segments=2)
        parts.append(beard)

    if look["helmet"]:
        parts += _helmet(coll, mats, look, seed)
    return parts


def _helmet(coll, mats: dict, look: dict, seed: int) -> list:
    """Шлем. Тремя формами на выбор — по ним и различаются тиры одного народа."""
    parts = []
    metal = mats[look["metal"]]
    kind = look["helmet"]

    if kind == "pilos":
        cap = shapes.new_object(
            "helm", solids.cone(0.98, 1.42, sides=10, top=0.18), metal, coll,
        )
        shapes.move(cap, dz=HEAD_Z + HEAD_H * 0.46)
        shapes.bevel(cap, 0.07)
        parts.append(cap)
    else:
        bowl = shapes.new_object(
            "helm", solids.dome(0.98, 0.90, HEAD_H * 0.60, sides=12, rows=3), metal, coll,
        )
        shapes.move(bowl, dz=HEAD_Z + HEAD_H * 0.44)
        parts.append(bowl)
        skirt = shapes.new_object(
            "helm.skirt",
            solids.slab(1.74, 1.58, 1.06, at=(0, 0, HEAD_Z + 0.30)),
            metal, coll,
        )
        shapes.bevel(skirt, 0.14, segments=2)
        parts.append(skirt)
        if kind == "thracian":
            peak = shapes.new_object(
                "helm.peak",
                solids.slab(1.56, 0.54, 0.24, at=(0, -0.84, HEAD_Z + 1.22),
                            shift=(0.0, -0.34)),
                metal, coll,
            )
            shapes.bevel(peak, 0.06)
            parts.append(peak)

    if look["crest"]:
        # Гребень гребёнкой из пластин: цельная плита читается доской, а зубцы
        # дают конский волос даже на сорока пикселях.
        for i in range(7):
            t = i / 6.0
            h = 0.86 * math.sin(math.pi * (0.22 + 0.78 * t)) + 0.22
            plate = shapes.new_object(
                f"crest{i}",
                solids.slab(0.16, 0.24, h, at=(0, 0.62 - t * 1.40, HEAD_Z + HEAD_H * 0.92)),
                mats[look["crest"]], coll,
            )
            shapes.bevel(plate, 0.05)
            parts.append(plate)
    return parts


# --- Конечности ---------------------------------------------------------------

def arm(coll, mats: dict, look: dict, seed: int, name: str = "arm") -> list:
    """Рука от плеча вниз. Пивот — плечевой сустав в начале координат.

    Строится ВИСЯЩЕЙ: угол покоя ей задаёт игра (balance.anim.strokes), и
    смоделированный замах вошёл бы с ним в конфликт.
    """
    bulk = look["bulk"]
    length = 3.10
    skin = mats[look["skin"]]
    parts = []

    upper = shapes.new_object(
        f"{name}.upper",
        solids.loft(
            [(0.50 * bulk, 0.46 * bulk, 0.10),
             (0.44 * bulk, 0.41 * bulk, -length * 0.48)],
            SIDES,
        ),
        skin, coll,
    )
    shapes.bevel(upper, 0.06)
    parts.append(upper)

    fore = shapes.new_object(
        f"{name}.fore",
        solids.loft(
            [(0.40 * bulk, 0.38 * bulk, -length * 0.46),
             (0.31 * bulk, 0.30 * bulk, -length * 0.84)],
            SIDES,
        ),
        skin, coll,
    )
    shapes.bevel(fore, 0.06)
    parts.append(fore)

    fist = shapes.new_object(
        f"{name}.fist",
        solids.slab(0.62 * bulk, 0.58 * bulk, 0.62, at=(0, 0, -length - 0.06)),
        skin, coll,
    )
    shapes.bevel(fist, 0.14, segments=2)
    parts.append(fist)

    # Наплечник — единственная деталь руки, которая читается на её силуэте.
    # Без него рука остаётся сарделькой при любом качестве материала.
    pad = shapes.new_object(
        f"{name}.pad",
        solids.dome(0.72 * bulk, 0.66 * bulk, 0.66, sides=10, rows=2),
        mats[look["armor"]] if look["armor"] else mats[look["strap"]],
        coll,
    )
    shapes.move(pad, dz=-0.06)
    shapes.bevel(pad, 0.05)
    parts.append(pad)
    return parts


def hand_point(look: dict) -> tuple[float, float, float]:
    """Где в системе руки лежит рукоять. Отсюда считается сокет оружия."""
    return (0.0, -0.24, -3.16)


def leg(coll, mats: dict, look: dict, seed: int, name: str = "leg") -> list:
    """Нога от бедра вниз. Пивот — тазобедренный сустав."""
    bulk = look["bulk"]
    skin = mats[look["skin"]]
    parts = []

    thigh = shapes.new_object(
        f"{name}.thigh",
        solids.loft(
            [(0.60 * bulk, 0.56 * bulk, 0.10), (0.50 * bulk, 0.48 * bulk, -HIP_Z * 0.48)],
            SIDES,
        ),
        skin, coll,
    )
    shapes.bevel(thigh, 0.06)
    parts.append(thigh)

    shin = shapes.new_object(
        f"{name}.shin",
        solids.loft(
            [(0.48 * bulk, 0.46 * bulk, -HIP_Z * 0.46), (0.34 * bulk, 0.33 * bulk, -HIP_Z * 0.86)],
            SIDES,
        ),
        mats[look["metal"]] if look["greaves"] else skin, coll,
    )
    shapes.bevel(shin, 0.06)
    parts.append(shin)

    # Обувь тёмная и крупная. Тёмное пятно у земли — то, что ставит фигуру НА
    # землю: без него ноги растворяются в траве вместе с контактной тенью.
    boot = shapes.new_object(
        f"{name}.boot",
        solids.slab(0.66 * bulk, 1.30, 0.62, at=(0, -0.22, -HIP_Z), top_scale=(1.0, 0.66)),
        mats[look["strap"]], coll,
    )
    shapes.bevel(boot, 0.12, segments=2)
    parts.append(boot)
    return parts


def cloak(coll, mats: dict, look: dict, seed: int) -> list:
    """Плащ за спиной. Пивот — точка у основания шеи, вокруг неё он и качается.

    Заведомо ШИРЕ плеч: плащ по ширине корпуса не виден вовсе — его целиком
    перекрывает торс, который рисуется поверх. Работает только то, что торчит
    по сторонам, и именно этот трапециевидный вынос делает силуэт героя
    отличимым от силуэта любого врага на острове.
    """
    material = mats[look["cloak"]]
    parts = []
    half = SHOULDER_X * 1.62

    for i in range(5):
        t = (i - 2) / 2.0
        drop = 5.10 * (1.0 - 0.20 * t * t) + 0.26 * jitter(seed, f"cloak{i}")
        panel = shapes.new_object(
            f"cloak{i}",
            solids.slab(
                half * 0.52, 0.34, drop,
                at=(t * half * 0.48, 0.30 + 0.12 * abs(t), -drop),
                # Низ уводится наружу: трапеция книзу — это ткань, а
                # прямоугольник — доска, и разница видна даже на силуэте.
                shift=(-t * 0.96, 0.0),
            ),
            material, coll,
        )
        shapes.bevel(panel, 0.10)
        parts.append(panel)

    yoke = shapes.new_object(
        "cloak.yoke",
        solids.slab(half * 1.30, 0.46, 1.02, at=(0, 0.22, -0.78), top_scale=(0.82, 1.0)),
        material, coll,
    )
    shapes.bevel(yoke, 0.16, segments=2)
    parts.append(yoke)
    return parts


def shield(coll, mats: dict, look: dict, seed: int) -> list:
    """Круглый щит-аспис. Отдельная кость: его носят не все."""
    parts = []
    face = shapes.new_object(
        "shield",
        solids.loft([(1.62, 1.62, 0.0), (1.66, 1.66, 0.16), (1.48, 1.48, 0.42), (1.06, 1.06, 0.54)], 16),
        mats[look["metal"]], coll,
    )
    shapes.turn(face, 90.0, "X")
    shapes.bevel(face, 0.09)
    parts.append(face)

    boss = shapes.new_object(
        "shield.boss",
        solids.dome(0.44, 0.44, 0.40, sides=10, rows=2),
        mats[look["metal"]], coll,
    )
    shapes.turn(boss, -90.0, "X")
    shapes.move(boss, dy=-0.52)
    parts.append(boss)
    return parts
