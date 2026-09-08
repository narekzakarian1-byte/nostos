"""Сборка фигуры из костей — та же арифметика, что в src/ui/rig/DrawRig.ts.

    blender --background --python art/blender/rig_preview.py -- <figure> [--px 420]

Судить кости по отдельным PNG бессмысленно: собирается фигура числами рига, и
ошибка в сокете видна только на собранной. Здесь эти числа и проверяются — если
превью разъехалось, значит разъедется и в игре.

Поза покоя, без углов: проверяется стыковка, а не анимация.
"""

from __future__ import annotations

import json
import sys
from pathlib import Path

import bpy
import numpy as np

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[1]
if str(HERE) not in sys.path:
    sys.path.insert(0, str(HERE))

from lib.materials import hex_to_linear  # noqa: E402


def _load(path: Path) -> np.ndarray:
    image = bpy.data.images.load(str(path))
    buf = np.empty(len(image.pixels), dtype=np.float32)
    image.pixels.foreach_get(buf)
    # Blender отдаёт снизу вверх — переворачиваем в экранный порядок.
    out = buf.reshape(image.size[1], image.size[0], 4)[::-1].copy()
    bpy.data.images.remove(image)
    return out


def _resize(src: np.ndarray, w: int, h: int) -> np.ndarray:
    """Ближайший сосед. Превью, а не продакшн: важна геометрия, не фильтрация."""
    h0, w0, _ = src.shape
    ys = np.clip((np.arange(h) * h0 // max(1, h)), 0, h0 - 1)
    xs = np.clip((np.arange(w) * w0 // max(1, w)), 0, w0 - 1)
    return src[ys][:, xs]


def _over(dst: np.ndarray, src: np.ndarray, x: int, y: int, shade: float = 0.0) -> None:
    h, w, _ = src.shape
    H, W, _ = dst.shape
    x0, y0 = max(0, x), max(0, y)
    x1, y1 = min(W, x + w), min(H, y + h)
    if x1 <= x0 or y1 <= y0:
        return
    patch = src[y0 - y:y1 - y, x0 - x:x1 - x]
    rgb = patch[:, :, :3] * (1.0 - shade)
    a = patch[:, :, 3:4]
    region = dst[y0:y1, x0:x1]
    region[:, :, :3] = rgb * a + region[:, :, :3] * (1.0 - a)


def main() -> None:
    argv = sys.argv[sys.argv.index("--") + 1:]
    figure_id = argv[0]
    size = int(argv[argv.index("--px") + 1]) if "--px" in argv else 420

    meta = json.loads((ROOT / "art" / "metrics" / f"{figure_id}.json").read_text("utf-8"))
    bones = {b["id"]: b for b in meta["bones"]}
    root = bones["torso"]
    out = ROOT / "art" / "out"

    pad = int(size * 0.35)
    canvas = np.ones((size + pad * 2, size + pad * 2, 4), dtype=np.float32)
    canvas[:, :, :3] = hex_to_linear("#6D9C3C")

    def rect(bone):
        h = bone["height"] * size
        w = h * bone["pixels"]["width"] / bone["pixels"]["height"]
        return w, h

    root_w, root_h = rect(root)
    cx = cy = pad + size / 2.0

    for bone in meta["bones"]:
        w, h = rect(bone)
        ox = cx + (root["socketX"] - 0.5) * size
        oy = cy + (root["socketY"] - 0.5) * size
        if bone["id"] != "torso":
            ox += (bone["socketX"] - root["pivotX"]) * root_w
            oy += (bone["socketY"] - root["pivotY"]) * root_h
        img = _resize(_load(out / f"{figure_id}-{bone['id']}.png"), max(1, int(w)), max(1, int(h)))
        _over(canvas, img, int(ox - bone["pivotX"] * w), int(oy - bone["pivotY"] * h),
              shade=0.35 if bone["behind"] else 0.0)

    body = canvas[:, :, :3].reshape(-1, 3)
    lum = 0.2126 * body[:, 0] + 0.7152 * body[:, 1] + 0.0722 * body[:, 2]
    ground = hex_to_linear("#6D9C3C")
    gl = 0.2126 * ground[0] + 0.7152 * ground[1] + 0.0722 * ground[2]
    fig = lum[np.abs(lum - gl) > 1e-4]
    if fig.size:
        srgb = np.where(fig <= 0.0031308, fig * 12.92,
                        1.055 * np.power(np.clip(fig, 1e-6, None), 1 / 2.4) - 0.055)
        qs = np.percentile(srgb, [3, 50, 92]) * 100
        gs = (1.055 * gl ** (1 / 2.4) - 0.055) * 100
        print(f"NOSTOS-VALUES тень {qs[0]:.0f}%  средняя {qs[1]:.0f}%  свет {qs[2]:.0f}%"
              f"   земля {gs:.0f}%   (цель 20 / 55 / 88 при земле ~45)")

    if "handX" in meta:
        arm = bones["armMain"]
        aw, ah = rect(arm)
        ox = cx + (root["socketX"] - 0.5) * size + (arm["socketX"] - root["pivotX"]) * root_w
        oy = cy + (root["socketY"] - 0.5) * size + (arm["socketY"] - root["pivotY"]) * root_h
        hx = int(ox + (meta["handX"] - arm["pivotX"]) * aw)
        hy = int(oy + (meta["handY"] - arm["pivotY"]) * ah)
        canvas[max(0, hy - 3):hy + 3, max(0, hx - 3):hx + 3, :3] = hex_to_linear("#FF0000")

    # Линия земли: подошва обязана стоять на ней, а не висеть и не тонуть.
    ground = int(cy + size / 2.0)
    canvas[ground:ground + 2, :, :3] = hex_to_linear("#FFFFFF")

    h, w, _ = canvas.shape
    result = bpy.data.images.new("rigpreview", width=w, height=h, alpha=True)
    canvas[:, :, 3] = 1.0
    result.pixels.foreach_set(canvas[::-1].reshape(-1))
    result.file_format = "PNG"
    result.filepath_raw = str(out / f"{figure_id}-preview.png")
    result.save()
    print("NOSTOS-PREVIEW", out / f"{figure_id}-preview.png")


main()
