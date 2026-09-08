"""Точка входа фабрики ассетов.

    blender --background --python art/blender/build.py -- <asset> [<asset> ...]
                                                         [--seed N] [--px 6] [--fig 320]

Собирает сцену, ставит камеру и свет из balance.json, рендерит и пишет метрики.
Про конкретный объект знает только модуль в assets/ — здесь одинаковая для всех
обвязка.

Ассеты бывают четырёх родов, и обвязка у них разная (module.KIND):

  prop    предмет на земле: тело + отброшенная тень двумя файлами, след, якорь.
  figure  фигура из костей: по файлу на кость, плюс посчитанный риг.
  part    одиночная деталь без тени — оружие в руке.
  tile    бесшовный кусок земли, кадрируемый числом, а не по вершинам.

Имён можно передать сколько угодно: Blender стартует три секунды, и на полсотне
ассетов это единственное, что отличает минуту работы от пяти.
"""

from __future__ import annotations

import importlib
import json
import sys
from dataclasses import dataclass
from pathlib import Path

import bpy

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[1]
if str(HERE) not in sys.path:
    sys.path.insert(0, str(HERE))

from lib import export, figure, optics, render, rig  # noqa: E402

PX_PER_WORLD = 6.0   # пикселей на единицу мира; обоснование — ART_PIPELINE.md §4.3
FIGURE_PX = 320      # пикселей на полный рост фигуры
MAX_SIDE = 2048      # потолок стороны картинки для ландмарка (§4.3)

OUT = ROOT / "art" / "out"
METRICS = ROOT / "art" / "metrics"


@dataclass
class Context:
    body: bpy.types.Collection
    helpers: bpy.types.Collection
    seed: int


def _args():
    argv = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
    names, seed, px, fig, keep = [], 0, PX_PER_WORLD, FIGURE_PX, False
    i = 0
    while i < len(argv):
        token = argv[i]
        if token == "--seed":
            seed = int(argv[i + 1]); i += 2
        elif token == "--px":
            px = float(argv[i + 1]); i += 2
        elif token == "--fig":
            fig = float(argv[i + 1]); i += 2
        elif token == "--keep-blend":
            keep = True; i += 1
        elif token.startswith("--"):
            i += 1
        else:
            names.append(token); i += 1
    if not names:
        raise SystemExit("нужно имя ассета: build.py -- <asset> [<asset> ...]")
    return names, seed, px, fig, keep


def _fresh_scene(seed: int) -> Context:
    bpy.ops.wm.read_factory_settings(use_empty=True)
    scene = bpy.context.scene
    body = bpy.data.collections.new("BODY")
    helpers = bpy.data.collections.new("HELPERS")
    scene.collection.children.link(body)
    scene.collection.children.link(helpers)
    return Context(body=body, helpers=helpers, seed=seed)


def _stage(frame) -> None:
    """Камера, свет и разрешение под готовый кадр. Одно на все роды ассетов."""
    optics.setup_render(frame.width, frame.height)
    optics.add_camera(frame.center_u, frame.center_v, frame.span)
    optics.add_lights()


def _write(data: dict, asset_id: str) -> None:
    METRICS.mkdir(parents=True, exist_ok=True)
    with open(METRICS / f"{asset_id}.json", "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
        f.write("\n")


# --- Проп ---------------------------------------------------------------------

def build_prop(module, name: str, seed: int, px: float, keep: bool,
               variant: str | None = None) -> None:
    ctx = _fresh_scene(seed)
    asset_id = variant or module.ID
    size = optics.props()["sizes"][asset_id]
    body_objects = module.build(ctx, variant) if variant else module.build(ctx)

    frame = render.frame_for_prop(body_objects, size["value"], size["fit"], px)
    # Крупный ландмарк на 6 px/единицу перерастает потолок. Понижаем плотность,
    # а не режем кадр: обрезанный ландмарк — это потерянный ассет, а лишняя
    # плотность всё равно не видна ни на одном реальном экране.
    longest = max(frame.width, frame.height)
    if longest > MAX_SIDE:
        px = px * MAX_SIDE / longest
        frame = render.frame_for_prop(body_objects, size["value"], size["fit"], px)
        print(f"  плотность понижена до {px:.2f} px/единицу: кадр упирался в потолок {MAX_SIDE}")

    _stage(frame)
    catcher = render.ground_plane(ctx.helpers, frame)
    body_png, shadow_png = render.passes(body_objects, catcher, frame, OUT, asset_id)

    data = export.write(
        asset_id=asset_id, frame=frame, body_objects=body_objects, seed=seed,
        px_per_world=px, size=size, version=module.VERSION,
        script=f"art/blender/assets/{name}.py", out_dir=METRICS,
    )
    if keep:
        _save_blend(asset_id)

    print("NOSTOS-ASSET", asset_id)
    print(f"  тело   {body_png.relative_to(ROOT)}")
    print(f"  тень   {shadow_png.relative_to(ROOT)}")
    print(f"  кадр   {data['pixels']['width']}x{data['pixels']['height']} px")
    print(f"  габарит{data['box']['width']:>8.1f} x {data['box']['height']:.1f} единиц мира")
    print(f"  якорь  {data['anchor']['x']:.3f}, {data['anchor']['y']:.3f}")
    print(f"  след   rx {data['footprint']['rx']}  ry {data['footprint']['ry']}")
    print(f"  граней {data['tris']}")


# --- Фигура -------------------------------------------------------------------

def build_figure(module, name: str, seed: int, fig_px: float, keep: bool) -> None:
    """Все кости одной фигуры за один запуск.

    За один — потому что габарит фигуры считается по всем костям сразу, а
    ростовые доли и сокеты в риге без него не посчитать. Разбей на запуски —
    и числа придётся сводить руками, то есть промахиваться.
    """
    ctx = _fresh_scene(seed)
    bones = module.bones(ctx)

    placed = []
    for bone in bones:
        coll = bpy.data.collections.new(f"BONE.{bone.id}")
        bpy.context.scene.collection.children.link(coll)
        objects = bone.build(ctx, coll)
        placed.append(rig.Placed(bone=bone, objects=objects))

    # Первый проход: габариты каждой кости при плотности 1, чтобы узнать рост
    # фигуры. Плотность здесь не важна — важны экранные размеры.
    for item in placed:
        item.frame = render.Frame(item.objects, 1.0, with_shadow=False)
        item.socket = rig.screen(item.bone.at)
    box = rig.assemble(placed)
    px_per_model = fig_px / box["height"]

    # Второй проход: настоящие кадры на найденной плотности.
    for item in placed:
        item.frame = render.Frame(item.objects, px_per_model, with_shadow=False)

    everything = [obj for item in placed for obj in item.objects]
    files = []
    for item in placed:
        for obj in everything:
            obj.hide_render = obj not in item.objects
        _stage(item.frame)
        asset_id = f"{module.ID}-{item.bone.id}"
        files.append(render.body_only(item.objects, item.frame, OUT, asset_id))
    for obj in everything:
        obj.hide_render = False

    spec = rig.export(placed, box)
    data = {
        "id": module.ID, "kind": "figure", "version": module.VERSION,
        "script": f"art/blender/assets/{name}.py", "seed": seed,
        "blender": bpy.app.version_string, "balanceHash": export.balance_hash(),
        "figurePx": fig_px, **spec,
    }
    _write(data, module.ID)
    if keep:
        _save_blend(module.ID)

    print("NOSTOS-FIGURE", module.ID)
    for item, path in zip(placed, files):
        f = item.frame
        print(f"  {item.bone.id:<9} {f.width}x{f.height} px   {path.name}")
    print(f"  рост   {box['height']:.2f} × ширина {box['width']:.2f} экранных единиц")
    print(f"  граней {export.triangles(everything)}")


# --- Деталь без тени ----------------------------------------------------------

def build_part(module, name: str, seed: int, fig_px: float, keep: bool,
               variant: str | None = None) -> None:
    ctx = _fresh_scene(seed)
    objects = module.build(ctx, variant) if variant else module.build(ctx)
    asset_id = module.variant_id(variant) if variant else module.ID

    reference = figure.projected_height()
    px_per_model = fig_px / reference
    frame = render.Frame(objects, px_per_model, with_shadow=False)
    _stage(frame)
    path = render.body_only(objects, frame, OUT, asset_id)

    ax, ay = frame.anchor
    data = {
        "id": asset_id, "kind": "part", "version": module.VERSION,
        "script": f"art/blender/assets/{name}.py", "seed": seed,
        "blender": bpy.app.version_string, "balanceHash": export.balance_hash(),
        "pixels": {"width": frame.width, "height": frame.height},
        "pivot": {"x": round(ax, 4), "y": round(ay, 4)},
        "height": round((frame.v1 - frame.v0) / reference, 4),
        "tris": export.triangles(objects),
    }
    _write(data, asset_id)
    print("NOSTOS-PART", asset_id)
    print(f"  кадр   {frame.width}x{frame.height} px   {path.name}")
    print(f"  пивот  {ax:.3f}, {ay:.3f}   рост {data['height']:.3f} фигуры")


# --- Тайл земли ---------------------------------------------------------------

def build_tile(module, name: str, seed: int, keep: bool) -> None:
    ctx = _fresh_scene(seed)
    module.build(ctx)

    frame = render.TileFrame(module.TILE, module.tile_depth(), 1.0)
    _stage(frame)
    path = render.opaque(OUT, module.ID)

    data = {
        "id": module.ID, "kind": "tile", "version": module.VERSION,
        "script": f"art/blender/assets/{name}.py", "seed": seed,
        "blender": bpy.app.version_string, "balanceHash": export.balance_hash(),
        "pixels": {"width": frame.width, "height": frame.height},
        "unitsPerTile": module.TILE,
    }
    _write(data, module.ID)
    print("NOSTOS-TILE", module.ID)
    print(f"  кадр   {frame.width}x{frame.height} px   {path.name}")


def _save_blend(asset_id: str) -> None:
    blend_dir = ROOT / "art" / "blend"
    blend_dir.mkdir(parents=True, exist_ok=True)
    bpy.ops.wm.save_as_mainfile(filepath=str(blend_dir / f"{asset_id}.blend"))


def main() -> None:
    names, seed, px, fig, keep = _args()
    for name in names:
        module = importlib.import_module(f"assets.{name}")
        importlib.reload(module)
        kind = getattr(module, "KIND", "prop")
        if kind == "prop":
            build_prop(module, name, seed, px, keep)
        elif kind == "props":
            # Семейство пропов одним модулем: колонна, обломок и барабан — это
            # один и тот же ордер с разными числами, и разносить их по файлам
            # значит гарантировать, что они разойдутся (ART_RUNBOOK.md §6).
            for variant in module.VARIANTS:
                build_prop(module, name, seed, px, keep, variant)
        elif kind == "figure":
            build_figure(module, name, seed, fig, keep)
        elif kind == "part":
            build_part(module, name, seed, fig, keep)
        elif kind == "parts":
            # Семейство деталей одним запуском: пять ступеней редкости одного
            # оружия отличаются числами, а не файлами, и держать под них пять
            # почти одинаковых модулей значит гарантировать расхождение.
            for variant in module.VARIANTS:
                build_part(module, name, seed, fig, keep, variant)
        elif kind == "tile":
            build_tile(module, name, seed, keep)
        else:
            raise SystemExit(f"неизвестный род ассета «{kind}» у {name}")


main()
