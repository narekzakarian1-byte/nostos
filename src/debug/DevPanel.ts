import { getBalance } from '../core/Balance.ts';
import type { DamageType, Rarity, StatKey } from '../core/BalanceTypes.ts';
import { RARITY_ORDER, TYPE_RU } from '../player/Weapon.ts';
import type { Game } from '../core/Game.ts';
import type { GameLoop } from '../core/GameLoop.ts';

const TYPES: readonly DamageType[] = ['pierce', 'slash', 'crush'];
const ATK_KEYS: readonly StatKey[] = ['pierceAtk', 'slashAtk', 'crushAtk'];

/**
 * Дев-панель по ?dev=1. Без неё баланс проверять невозможно.
 * Подключается динамическим импортом и вырезается из продакшн-сборки целиком.
 *
 * Свёрнута по умолчанию: развёрнутая она закрывает панель апгрейда внизу экрана.
 */
export class DevPanel {
  private readonly root = document.createElement('div');
  private readonly body = document.createElement('div');
  private readonly readout = document.createElement('div');
  private readonly toggle = document.createElement('button');
  private readonly game: Game;
  private readonly loop: GameLoop;
  private open = false;

  constructor(game: Game, loop: GameLoop) {
    this.game = game;
    this.loop = loop;
    const { palette } = getBalance();

    this.toggle.textContent = 'dev';
    // Страница растянута под вырез (viewport-fit=cover), поэтому без учёта
    // безопасной зоны кнопка уезжает под статус-бар айфона и становится не видна.
    this.toggle.style.cssText = [
      'position:fixed', 'z-index:11',
      'right:calc(env(safe-area-inset-right, 0px) + 8px)',
      'top:calc(env(safe-area-inset-top, 0px) + 8px)',
      'font:13px system-ui,sans-serif', 'padding:8px 14px',
      `background:${palette.bgFar}`, `color:${palette.accentWarm}`,
      `border:2px solid ${palette.accentWarm}`, 'border-radius:6px',
    ].join(';');
    this.toggle.addEventListener('click', () => this.setOpen(!this.open));

    this.root.style.cssText = [
      'position:fixed', 'left:0', 'right:0', 'top:0', 'bottom:0', 'z-index:10',
      'font:12px system-ui,sans-serif', 'overflow:auto',
      'padding:calc(env(safe-area-inset-top, 0px) + 52px) 10px',
      'padding-bottom:calc(env(safe-area-inset-bottom, 0px) + 20px)',
      `background:${palette.bgFar}f2`, `color:${palette.accentLight}`,
    ].join(';');

    this.body.style.cssText = 'display:flex;flex-wrap:wrap;gap:6px;align-items:center';
    this.root.appendChild(this.body);
    this.build();

    document.body.append(this.toggle, this.root);
    this.setOpen(false);
  }

  private build(): void {
    const { devPanel } = getBalance();

    this.section('сила для теста');
    // Быстрый способ стать сильнее без правки balance.json: числа баланса
    // трогать нельзя, а играбельность для проверки механик нужна сейчас.
    this.add(this.button('урон ×10', () => this.scaleAttack(10)));
    this.add(this.button('урон ×100', () => this.scaleAttack(100)));
    this.add(this.button('HP ×100', () => this.scale('maxHp', 100)));
    this.add(this.button('крит 500', () => this.game.player.stats.set('crit', 500)));
    this.add(this.button('сброс статов', () => this.resetStats()));

    this.section('гейт');
    // Без телепорта к боссу гейт проверяется только пешком через весь остров,
    // а крутить его придётся десятки раз (BALANCE.md §11).
    this.add(this.button('к боссу', () => this.teleportToBoss()));
    this.add(this.button('поднять босса', () => this.reviveBoss()));

    this.section('время');
    for (const scale of devPanel.timeScales) {
      this.add(this.button(`${scale}x`, () => { this.loop.timeScale = scale; }));
    }
    this.add(this.button('сброс респауна', () => this.game.spawns.resetTimers()));

    this.section('оружие и копии');
    for (const type of TYPES) {
      this.add(this.button(`+100 ${TYPE_RU[type]}`, () => this.game.inventory.add(type, 100)));
      this.add(this.weaponField(type));
    }

    this.section('статы');
    for (const key of this.game.player.stats.keys()) this.add(this.statField(key));

    this.readout.style.cssText = 'flex-basis:100%;padding-top:8px';
    this.add(this.readout);
  }

  /** Обновляется каждый кадр: цифры должны совпадать с тем, что происходит. */
  update(): void {
    if (!this.open) return;
    const target = this.game.target;
    this.readout.textContent =
      `цель: ${target ? `${target.tier}, слаб. ${target.weakness}` : '—'} · ` +
      `DPS ${this.game.currentDps.toFixed(0)} · ` +
      `чистый ${this.game.netDps.toFixed(0)} · ` +
      `входящий ${this.game.incomingDps.toFixed(0)} (врагов ${this.game.engagedCount}) · ` +
      `гейт ${(this.game.gate.best * 100).toFixed(0)}%${this.game.gate.canAdvance ? ' пройден' : ''}`;
  }

  private setOpen(open: boolean): void {
    this.open = open;
    this.root.style.display = open ? 'block' : 'none';
    this.toggle.textContent = open ? 'закрыть' : 'dev';
  }

  /**
   * Встать внутрь радиуса сцепки, а не на край арены: кнопка нужна, чтобы
   * начать бой с боссом, а с края (74 единицы) сцепка не срабатывает — она
   * живёт на engageRange (48), и телепорт молча ничего не делал.
   */
  private teleportToBoss(): void {
    const boss = this.game.boss;
    const { engageRange } = getBalance().combat;
    this.game.player.x = boss.x;
    this.game.player.y = boss.y + engageRange * 0.8;
    this.game.fog.reveal(this.game.player.x, this.game.player.y);
    this.setOpen(false);
  }

  private reviveBoss(): void {
    if (!this.game.boss.alive) this.game.boss.revive();
    this.game.spawns.persist();
  }

  private scaleAttack(factor: number): void {
    for (const key of ATK_KEYS) this.scale(key, factor);
  }

  private scale(key: StatKey, factor: number): void {
    const stats = this.game.player.stats;
    stats.set(key, stats.get(key) * factor);
    this.game.player.hp = this.game.player.maxHp;
    this.refreshFields();
  }

  private resetStats(): void {
    const base = getBalance().player.baseStats;
    for (const key of this.game.player.stats.keys()) this.game.player.stats.set(key, base[key]);
    this.game.player.clampHp();
    this.refreshFields();
  }

  private readonly fields = new Map<StatKey, HTMLInputElement>();

  private refreshFields(): void {
    for (const [key, input] of this.fields) input.value = String(Math.round(this.game.player.stats.get(key)));
  }

  private section(title: string): void {
    const label = document.createElement('div');
    label.textContent = title;
    label.style.cssText = `flex-basis:100%;opacity:0.6;padding-top:6px`;
    this.body.appendChild(label);
  }

  private add(node: HTMLElement): void {
    this.body.appendChild(node);
  }

  private button(label: string, onClick: () => void): HTMLButtonElement {
    const button = document.createElement('button');
    button.textContent = label;
    button.style.cssText = 'font:inherit;padding:6px 10px';
    button.addEventListener('click', onClick);
    return button;
  }

  /** Задать редкость и уровень оружия: без этого наследование не проверить руками. */
  private weaponField(type: DamageType): HTMLLabelElement {
    const label = document.createElement('label');
    label.style.cssText = 'display:flex;gap:2px;align-items:center';
    const weapon = () => this.game.player.weapons[type];

    const rarity = document.createElement('select');
    rarity.style.cssText = 'font:inherit';
    for (const option of RARITY_ORDER) {
      const item = document.createElement('option');
      item.value = option;
      item.textContent = option;
      rarity.appendChild(item);
    }
    rarity.value = weapon().rarity;
    rarity.addEventListener('change', () => { weapon().rarity = rarity.value as Rarity; });

    const level = document.createElement('input');
    level.type = 'number';
    level.value = String(weapon().level);
    level.style.cssText = 'width:52px;font:inherit';
    level.addEventListener('input', () => {
      const value = Number(level.value);
      if (Number.isFinite(value) && value >= 1) weapon().level = value;
    });

    label.append(`${TYPE_RU[type]} `, rarity, level);
    return label;
  }

  private statField(key: StatKey): HTMLLabelElement {
    const stats = this.game.player.stats;
    const label = document.createElement('label');
    label.style.cssText = 'display:flex;gap:2px;align-items:center';

    const input = document.createElement('input');
    input.type = 'number';
    input.value = String(Math.round(stats.get(key)));
    input.style.cssText = 'width:64px;font:inherit';
    input.addEventListener('input', () => {
      const value = Number(input.value);
      if (Number.isFinite(value)) stats.set(key, value);
    });
    this.fields.set(key, input);

    label.append(`${key} `, input);
    return label;
  }
}
