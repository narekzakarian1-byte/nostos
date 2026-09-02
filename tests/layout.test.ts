import { describe, it, expect, beforeEach } from 'vitest';
import { getBalance } from '../src/core/Balance.ts';
import { Game } from '../src/core/Game.ts';
import type { Input } from '../src/core/Input.ts';
import { clearNodes } from '../src/save/Save.ts';
import { hudButtonAt, hudButtons } from '../src/ui/Hud.ts';
import { isMinimapTap } from '../src/ui/Minimap.ts';
import { statsTap } from '../src/ui/StatsScreen.ts';
import { handleTap } from '../src/ui/Taps.ts';
import { slotAt, slotBoxes } from '../src/ui/WeaponBar.ts';

// Геометрия интерфейса — чистые числа, канвас для неё не нужен. Проверяется
// ровно одно: элементы не наезжают друг на друга и не отбирают тач у
// джойстика. Движение — единственный ввод в игре, и потерять его нельзя.

const balance = getBalance();
const W = balance.render.virtualWidth;
const H = 780;
const idleInput = { isHeld: false, dirX: 0, dirY: 0 } as unknown as Input;
const SLOTS = balance.weapons.slots.length;

function makeGame(): Game {
  return new Game(W, H * balance.render.worldScreensY, idleInput, () => {}, balance.rng.defaultSeed);
}

beforeEach(() => clearNodes());

describe('Раскладка интерфейса', () => {
  it('кнопки не попадают в кружок миникарты', () => {
    for (const box of hudButtons(W, H)) {
      const corners = [
        [box.x, box.y], [box.x + box.size, box.y],
        [box.x, box.y + box.size], [box.x + box.size, box.y + box.size],
      ] as const;
      for (const [x, y] of corners) {
        expect(isMinimapTap(x, y, W)).toBe(false);
      }
    }
  });

  it('кнопки не перекрывают друг друга', () => {
    const boxes = hudButtons(W, H);
    for (let i = 0; i < boxes.length; i++) {
      for (let j = i + 1; j < boxes.length; j++) {
        const a = boxes[i]!;
        const b = boxes[j]!;
        const overlap =
          a.x < b.x + b.size && b.x < a.x + a.size &&
          a.y < b.y + b.size && b.y < a.y + a.size;
        expect(overlap).toBe(false);
      }
    }
  });

  it('слоты оружия целиком на экране и не слипаются', () => {
    const boxes = slotBoxes(W, H);
    expect(boxes.length).toBe(SLOTS + 1); // три оружия плюс запертый VIP-слот
    for (const box of boxes) {
      expect(box.x).toBeGreaterThanOrEqual(0);
      expect(box.x + box.size).toBeLessThanOrEqual(W);
      expect(box.y + box.size).toBeLessThanOrEqual(H);
    }
    for (let i = 1; i < boxes.length; i++) {
      expect(boxes[i]!.x).toBeGreaterThanOrEqual(boxes[i - 1]!.x + boxes[i - 1]!.size);
    }
  });

  it('кольцо джойстика не попадает ни в один слот', () => {
    // Иначе тап по стику тратит копии вместо того, чтобы вести игрока.
    const { baseRadius, bottomMargin } = balance.joystick;
    const cx = W / 2;
    const cy = H - bottomMargin;
    for (let i = 0; i < 16; i++) {
      const angle = (Math.PI * 2 * i) / 16;
      const x = cx + Math.cos(angle) * baseRadius;
      const y = cy + Math.sin(angle) * baseRadius;
      expect(slotAt(x, y, W, H, SLOTS)).toBeNull();
      expect(hudButtonAt(x, y, W, H)).toBeNull();
      expect(isMinimapTap(x, y, W)).toBe(false);
    }
  });

  it('на экране характеристик крестик и карточки не перекрываются', () => {
    expect(statsTap(-100, -100, W, H)).toBeNull();
    const seen = new Set<string>();
    for (let x = 0; x < W; x += 4) {
      for (let y = 0; y < H; y += 4) {
        const hit = statsTap(x, y, W, H);
        if (hit !== null) seen.add(String(hit));
      }
    }
    expect(seen).toEqual(new Set(['close', '0', '1', '2']));
  });
});

describe('Маршрутизация тапов', () => {
  it('тап по пустому месту достаётся джойстику, а не интерфейсу', () => {
    const game = makeGame();
    expect(handleTap(game, W / 2, H - balance.joystick.bottomMargin, W, H, SLOTS)).toBe(false);
  });

  it('кнопка сумки открывает характеристики, крестик закрывает', () => {
    const game = makeGame();
    const bag = hudButtons(W, H).find((b) => b.id === 'bag')!;
    expect(handleTap(game, bag.x + 1, bag.y + 1, W, H, SLOTS)).toBe(true);
    expect(game.statsOpen).toBe(true);

    // Пока экран открыт, тач не должен доходить до мира ни в одной точке.
    expect(handleTap(game, W / 2, H - balance.joystick.bottomMargin, W, H, SLOTS)).toBe(true);
    expect(game.statsOpen).toBe(true);

    const close = statsTap(W - balance.ui.margin - balance.ui.sheetPad - 1,
      balance.ui.margin * 2 + balance.ui.sheetPad + 1, W, H);
    expect(close).toBe('close');
  });

  it('кнопка настроек глушит и возвращает звук', () => {
    const game = makeGame();
    const gear = hudButtons(W, H).find((b) => b.id === 'settings')!;
    expect(game.muted).toBe(false);
    handleTap(game, gear.x + 1, gear.y + 1, W, H, SLOTS);
    expect(game.muted).toBe(true);
    handleTap(game, gear.x + 1, gear.y + 1, W, H, SLOTS);
    expect(game.muted).toBe(false);
  });

  it('тап по миникарте открывает карту, следующий тап закрывает', () => {
    const game = makeGame();
    const { minimap } = balance;
    const x = W - minimap.margin - minimap.screenRadius;
    const y = minimap.margin + minimap.screenRadius;
    expect(handleTap(game, x, y, W, H, SLOTS)).toBe(true);
    expect(game.mapOpen).toBe(true);
    expect(handleTap(game, W / 2, H / 2, W, H, SLOTS)).toBe(true);
    expect(game.mapOpen).toBe(false);
  });

  it('тап по слоту тратит копии и поднимает уровень', () => {
    const game = makeGame();
    const weapon = game.player.weapons.pierce;
    game.inventory.add('pierce', game.inventory.costFor(weapon));
    const box = slotBoxes(W, H)[0]!;
    expect(handleTap(game, box.x + box.size / 2, box.y + box.size / 2, W, H, SLOTS)).toBe(true);
    expect(weapon.level).toBe(2);
  });
});
