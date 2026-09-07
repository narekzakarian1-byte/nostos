"""Превью ассета на игровой земле.

    blender --background --python art/blender/preview.py -- <asset-id> [--bg "#8E9B5A"]

Судить ассет по PNG с прозрачным фоном бессмысленно: тень и фаска читаются
только на той земле, на которой объект будет стоять. Складывает тень и тело в
том же порядке, в каком их рисует движок, и кладёт рядом столбик высотой с
игрока — масштаб проверяется глазом, а не арифметикой.
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
    out = buf.reshape(image.size[1], image.size[0], 4).copy()
    bpy.data.images.remove(image)
    return out


def _over(dst: np.ndarray, src: np.ndarray) -> np.ndarray:
    a = src[:, :, 3:4]
    dst[:, :, :3] = src[:, :, :3] * a + dst[:, :, :3] * (1.0 - a)
    return dst


def main() -> None:
    argv = sys.argv[sys.argv.index("--") + 1:]
    asset = argv[0]
    ground = "#8E9B5A"
    if "--bg" in argv:
        ground = argv[argv.index("--bg") + 1]

    out = ROOT / "art" / "out"
    body = _load(out / f"{asset}.png")
    shadow = _load(out / f"{asset}-shadow.png")
    meta = json.loads((ROOT / "art" / "metrics" / f"{asset}.json").read_text(encoding="utf-8"))

    canvas = np.ones_like(body)
    canvas[:, :, :3] = hex_to_linear(ground)
    canvas = _over(canvas, shadow)
    canvas = _over(canvas, body)

    # Столбик роста игрока у точки касания земли: 92 единицы мира (render.playerSize).
    h, w, _ = canvas.shape
    px_per_world = meta["pxPerUnit"]
    player_px = int(92 * px_per_world)
    ax = int(meta["anchor"]["x"] * w)
    ay = int(meta["anchor"]["y"] * h)
    x0 = max(0, min(w - 8, ax + int(0.30 * w)))
    y0 = max(0, ay - player_px)
    canvas[y0:ay, x0:x0 + 7, :3] = hex_to_linear("#D9762B")

    # Замер светлот: правило 15/45/85 (GDD.md §3) проверяется числом, а не
    # глазом — на глаз выцветший кадр опознаётся уже только рядом с хорошим.
    opaque = body[:, :, 3] > 0.5
    if opaque.any():
        lum = (0.2126 * body[:, :, 0] + 0.7152 * body[:, :, 1] + 0.0722 * body[:, :, 2])[opaque]
        srgb = np.where(lum <= 0.0031308, lum * 12.92, 1.055 * np.power(np.clip(lum, 1e-6, None), 1 / 2.4) - 0.055)
        qs = np.percentile(srgb, [2, 50, 90]) * 100
        print(f"NOSTOS-VALUES тень {qs[0]:.0f}%  средняя {qs[1]:.0f}%  свет {qs[2]:.0f}%   (цель 30 / 62 / 89)")

    result = bpy.data.images.new("preview", width=w, height=h, alpha=True)
    canvas[:, :, 3] = 1.0
    result.pixels.foreach_set(canvas.reshape(-1))
    result.file_format = "PNG"
    result.filepath_raw = str(out / f"{asset}-preview.png")
    result.save()
    print("NOSTOS-PREVIEW", out / f"{asset}-preview.png")


main()
