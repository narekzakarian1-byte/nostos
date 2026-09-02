"""
Раскладка сгенерированных картинок острова из islands/uploads/ в public/art/.

    python3 tools/import-island-art.py <id>       # один остров, например cyclops
    python3 tools/import-island-art.py _shared     # общие оверлеи оружия
    python3 tools/import-island-art.py --all        # все острова разом

Кладёшь скачанный из ChatGPT файл в islands/uploads/<id>/<категория>/<имя>.png
— имя ровно такое, какое написано в слоте файла острова (islands/<NN-id>.md).
Скрипт сам решает, что делать с фоном:

  ground/, road/   — бесшовный тайл без хромакея, просто копируется как есть
  borders/, props/, entities/, weapons/ — объект вырезается из фона:
      фон зелёный (#00FF00) — cutout.py, по хромакею;
      фон любой другой     — tools/matte, системным Vision.

Второй путь нужен, потому что генератор не всегда отдаёт хромакей: часть
картинок Исмары пришла на чёрном фоне с тёплым ореолом, а по цвету его не
отделить — тело кикона само почти чёрное (#080D14).

Ничего не удаляет из uploads/: исходники остаются, чтобы перегенерировать
можно было без похода в ChatGPT заново.
"""
from __future__ import annotations

import shutil
import subprocess
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
from cutout import cutout  # noqa: E402

ROOT = Path(__file__).parent.parent
UPLOADS = ROOT / 'islands' / 'uploads'
ART = ROOT / 'public' / 'art'

NO_CUTOUT = {'ground', 'road'}
MAX_SIDE = {'borders': 512, 'props': 512, 'entities': 512, 'weapons': 256}
MATTE = ROOT / 'tools' / 'matte'


def is_chroma_green(png: Path) -> bool:
    """Хромакей ли фон. Смотрим углы: у объекта в кадре они всегда фон."""
    from PIL import Image

    im = Image.open(png).convert('RGB')
    w, h = im.size
    corners = [im.getpixel(p) for p in ((1, 1), (w - 2, 1), (1, h - 2), (w - 2, h - 2))]
    return sum(g > r + 40 and g > b + 40 for r, g, b in corners) >= 3


def matte(src: Path, dst: Path, max_side: int) -> None:
    """Вырез объекта с непрозрачного фона. Инструмент собирается один раз."""
    if not MATTE.exists():
        subprocess.run(
            ['swiftc', '-O', str(ROOT / 'tools' / 'matte.swift'), '-o', str(MATTE)],
            check=True,
        )
    subprocess.run([str(MATTE), str(src), str(dst), str(max_side)], check=True)


def import_one(island_id: str) -> int:
    src_root = UPLOADS / island_id
    if not src_root.is_dir():
        print(f'нет папки {src_root}')
        return 0

    count = 0
    for category_dir in sorted(src_root.iterdir()):
        if not category_dir.is_dir():
            continue
        category = category_dir.name
        for png in sorted(category_dir.glob('*.png')):
            dest = ART / category / png.name
            dest.parent.mkdir(parents=True, exist_ok=True)
            side = MAX_SIDE.get(category, 512)
            if category in NO_CUTOUT:
                shutil.copy(png, dest)
                print(f'[копия]  {png.relative_to(ROOT)} -> {dest.relative_to(ROOT)}')
            elif is_chroma_green(png):
                cutout(str(png), str(dest), side)
                print(f'[хромакей] {png.relative_to(ROOT)} -> {dest.relative_to(ROOT)}')
            else:
                matte(png, dest, side)
                print(f'[vision] {png.relative_to(ROOT)} -> {dest.relative_to(ROOT)}')
            count += 1
    return count


def main() -> None:
    if len(sys.argv) != 2:
        print(__doc__)
        sys.exit(1)

    arg = sys.argv[1]
    total = 0
    if arg == '--all':
        for island_dir in sorted(UPLOADS.iterdir()):
            if island_dir.is_dir():
                total += import_one(island_dir.name)
    else:
        total = import_one(arg)

    if total == 0:
        print('Файлов не найдено — положи PNG в islands/uploads/<остров>/<категория>/ и запусти снова.')
    else:
        print(f'\nГотово: {total} файл(ов). Проверь по контракту (ISLANDS.md §4) и отметь чекбоксы в islands/<остров>.md.')


if __name__ == '__main__':
    main()
