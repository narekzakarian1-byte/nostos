"""Точка входа фабрики ассетов.

    blender --background --python art/blender/build.py -- <asset> [--seed N] [--px 6]

Собирает сцену, ставит камеру и свет из balance.json, рендерит тело и тень,
пишет метрики. Про конкретный объект знает только модуль в assets/ — здесь
одинаковая для всех обвязка.
"""

from __future__ import annotations

import importlib
import sys
from dataclasses import dataclass
from pathlib import Path

import bpy

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[1]
if str(HERE) not in sys.path:
    sys.path.insert(0, str(HERE))

from lib import export, optics, render  # noqa: E402

PX_PER_WORLD = 6.0  # пикселей на единицу мира; обоснование — ART_PIPELINE.md §4.3
MAX_SIDE = 2048     # потолок стороны картинки для ландмарка (§4.3)


@dataclass
class Context:
    body: bpy.types.Collection
    helpers: bpy.types.Collection
    seed: int


def _args() -> tuple[str, int, float, bool]:
    argv = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
    if not argv:
        raise SystemExit("нужно имя ассета: build.py -- <asset>")
    name = argv[0]
    seed = 0
    px = PX_PER_WORLD
    keep = False
    for i, token in enumerate(argv):
        if token == "--seed":
            seed = int(argv[i + 1])
        elif token == "--px":
            px = float(argv[i + 1])
        elif token == "--keep-blend":
            keep = True
    return name, seed, px, keep


def _fresh_scene() -> Context:
    bpy.ops.wm.read_factory_settings(use_empty=True)
    scene = bpy.context.scene
    body = bpy.data.collections.new("BODY")
    helpers = bpy.data.collections.new("HELPERS")
    scene.collection.children.link(body)
    scene.collection.children.link(helpers)
    return Context(body=body, helpers=helpers, seed=0)


def main() -> None:
    name, seed, px, keep = _args()
    module = importlib.import_module(f"assets.{name}")

    ctx = _fresh_scene()
    ctx.seed = seed
    body_objects = module.build(ctx)

    frame = render.Frame(body_objects, module.SIZE["value"], module.SIZE["fit"], px)
    # Крупный ландмарк на 6 px/единицу перерастает потолок. Понижаем плотность,
    # а не режем кадр: обрезанный ландмарк — это потерянный ассет, а лишняя
    # плотность всё равно не видна ни на одном реальном экране.
    longest = max(frame.width, frame.height)
    if longest > MAX_SIDE:
        px = px * MAX_SIDE / longest
        frame = render.Frame(body_objects, module.SIZE["value"], module.SIZE["fit"], px)
        print(f"  плотность понижена до {px:.2f} px/единицу: кадр упирался в потолок {MAX_SIDE}")

    optics.setup_render(frame.width, frame.height)
    optics.add_camera(frame.center_u, frame.center_v, frame.span)
    optics.add_lights()
    catcher = render.ground_plane(ctx.helpers, frame)

    out_dir = ROOT / "art" / "out"
    body_png, shadow_png = render.passes(body_objects, catcher, frame, out_dir, module.ID)

    data = export.write(
        asset_id=module.ID,
        frame=frame,
        body_objects=body_objects,
        seed=seed,
        px_per_world=px,
        size=module.SIZE,
        version=module.VERSION,
        script=f"art/blender/assets/{name}.py",
        out_dir=ROOT / "art" / "metrics",
    )

    if keep:
        blend_dir = ROOT / "art" / "blend"
        blend_dir.mkdir(parents=True, exist_ok=True)
        bpy.ops.wm.save_as_mainfile(filepath=str(blend_dir / f"{module.ID}.blend"))

    print("NOSTOS-ASSET", module.ID)
    print(f"  тело   {body_png.relative_to(ROOT)}")
    print(f"  тень   {shadow_png.relative_to(ROOT)}")
    print(f"  кадр   {data['pixels']['width']}x{data['pixels']['height']} px")
    print(f"  габарит{data['box']['width']:>8.1f} x {data['box']['height']:.1f} единиц мира")
    print(f"  якорь  {data['anchor']['x']:.3f}, {data['anchor']['y']:.3f}")
    print(f"  след   rx {data['footprint']['rx']}  ry {data['footprint']['ry']}")
    print(f"  граней {data['tris']}")


main()
