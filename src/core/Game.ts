import { getBalance } from './Balance.ts';
import type { ByType } from './Combat.ts';
import type { HapticEvent } from './BalanceTypes.ts';
import { hitDamage, incomingDps, totalDps } from './Combat.ts';
import { Engagement } from './Engagement.ts';
import { applyRegen, resetRegen } from './Regen.ts';
import { Rng } from './Rng.ts';
import type { Input } from './Input.ts';
import { Player } from '../player/Player.ts';
import { applyBossRegen, bossRegen } from '../world/Boss.ts';
import { blockersOf } from '../world/Blockers.ts';
import { Fog } from '../world/Fog.ts';
import { currentIslandId } from '../world/Island.ts';
import { islandLayout, toWorld } from '../world/Layout.ts';
import { Gate, type Attempt } from '../world/Gate.ts';
import { borderRect, Scenery } from '../world/Scenery.ts';
import { SpawnManager } from '../world/SpawnManager.ts';
import { stepPatrols } from '../world/Patrol.ts';
import { defenseProfile } from '../world/EnemyFactory.ts';
import { Inventory } from '../player/Inventory.ts';
import { rewardKill } from '../player/Rewards.ts';
import { upgradeRows, type UpgradeRow } from '../ui/UpgradeScreen.ts';
import type { Enemy } from '../world/Enemy.ts';
import { DamageNumbers } from '../juice/DamageNumbers.ts';
import { Screenshake } from '../juice/Screenshake.ts';
import { Sound } from '../juice/Sound.ts';
import { Hitstop } from '../juice/Hitstop.ts';
import { Particles } from '../juice/Particles.ts';
import { enemyImpact, playerImpact } from '../juice/Impact.ts';

/**
 * Состояние мира и один шаг симуляции. О канвасе не знает: рендер живёт в ui/.
 *
 * Цели асимметричны намеренно: бьют все, кто в радиусе, отвечаешь только
 * ближайшему. Толпа — чистая угроза, поэтому «где встать» становится решением
 * наравне с «дожать или отойти».
 */
export class Game {
  readonly rng: Rng;
  readonly player: Player;
  readonly spawns: SpawnManager;
  readonly scenery: Scenery;
  readonly fog: Fog;
  /** Полноэкранная карта поверх игры. Джойстик, пока открыта, не двигает игрока. */
  elapsed = 0;
  mapOpen = false;
  /** Экран характеристик и инвентаря. Ведёт себя так же: игра под ним замирает по вводу. */
  statsOpen = false;
  /** Островной гейт: попытки по боссу, лучший результат, флаг победы. */
  readonly gate = new Gate();
  /**
   * Итог последней попытки по боссу. Не null — поверх игры висит экран
   * прогресса (GDD §6.3). Гасится тапом.
   */
  bossScreen: Attempt | null = null;
  readonly damageNumbers: DamageNumbers;
  readonly screenshake: Screenshake;
  readonly particles: Particles;
  readonly sound: Sound;
  private readonly hitstop: Hitstop;
  /** Замедление времени на добивании босса (GDD §10). */
  private readonly slowmo: (scale: number, ms: number) => void;
  private readonly engagement = new Engagement();
  readonly inventory = new Inventory();
  /** Короткое уведомление о дропе редкости. Гаснет само. */
  toast: string | null = null;
  private toastLeft = 0;
  readonly worldWidth: number;
  readonly worldHeight: number;
  readonly input: Input;

  constructor(
    worldWidth: number,
    worldHeight: number,
    input: Input,
    freeze: (ms: number) => void,
    seed: number,
    slowmo: (scale: number, ms: number) => void = () => {},
  ) {
    this.worldWidth = worldWidth;
    this.worldHeight = worldHeight;
    this.input = input;
    this.slowmo = slowmo;
    this.rng = new Rng(seed);
    this.damageNumbers = new DamageNumbers(this.rng);
    this.screenshake = new Screenshake(this.rng);
    // Свой поток случайности: искры не должны сдвигать броски крита и дропа.
    this.particles = new Particles(this.rng.fork());
    this.sound = new Sound(this.rng);
    this.hitstop = new Hitstop(freeze);

    const { render } = getBalance();
    // Точка высадки берётся из раскладки острова: у Исмары это галечный берег
    // внизу по центру, и от него читается вся ось острова (world/Layout.ts).
    // Острова без раскладки стартуют по-прежнему — отодвинутыми от края на
    // экран, потому что камера держит игрока в центре (Camera.follow) и у
    // самого края полэкрана занимала бы пустота за границей.
    const layout = islandLayout(currentIslandId());
    const landing = layout
      ? toWorld(layout.landing, { width: worldWidth, height: worldHeight })
      : {
          x: worldWidth / 2,
          y: worldHeight
            - (worldHeight / render.worldScreensY) * render.playerStartInsetScreens,
        };
    const startX = landing.x;
    const startY = landing.y;
    const bounds = {
      width: worldWidth,
      height: worldHeight,
      top: render.hudHeight + render.enemySpawnMargin,
      startX,
      startY,
    };
    this.spawns = new SpawnManager(this.rng, seed, bounds);
    // После спавна: тем же rng, чтобы прогон по сиду оставался единой
    // воспроизводимой последовательностью (так же уже устроен SpawnManager выше).
    this.scenery = new Scenery(this.rng, bounds, this.spawns.enemies, currentIslandId());
    // Игрок создаётся последним: ему нужны следы пропов, а те известны только
    // после раскладки декора.
    this.player = new Player(
      startX, startY, borderRect(bounds), blockersOf(this.scenery.props),
    );
    this.fog = new Fog(worldWidth, worldHeight);
    this.fog.reveal(startX, startY);
  }

  /** Эталон для панели апгрейда: текущая цель, иначе обычный враг острова. */
  private referenceDefense(): ByType {
    const target = this.target;
    if (target) return target.def;
    return defenseProfile('pierce', getBalance().prototype.islandNumber, 'normal');
  }

  upgradeRows(): UpgradeRow[] {
    return upgradeRows(
      this.player.stats, this.player.weapons, this.inventory, this.referenceDefense(),
    );
  }

  /** Тап по строке панели апгрейда. */
  tryUpgrade(index: number): void {
    const type = (['pierce', 'slash', 'crush'] as const)[index];
    if (!type) return;
    this.inventory.upgrade(this.player.weapons[type]);
  }

  get muted(): boolean {
    return this.sound.muted;
  }

  toggleSound(): void {
    this.sound.muted = !this.sound.muted;
  }

  /** Любой оверлей поверх мира: пока он открыт, джойстик не двигает игрока. */
  get overlayOpen(): boolean {
    return this.mapOpen || this.statsOpen || this.bossScreen !== null;
  }

  /** Островной босс — гейт острова. Всегда существует, может быть мёртв. */
  get boss(): Enemy {
    return this.spawns.boss;
  }

  get enemies(): readonly Enemy[] {
    return this.spawns.enemies;
  }

  get engagedCount(): number {
    return this.engagement.count;
  }

  /** В бою ли враг прямо сейчас. Рендер показывает замах только сцепленным:
   *  у остальных счётчик удара стоит на месте, и поза застыла бы навсегда. */
  isEngaged(enemy: Enemy): boolean {
    return this.engagement.has(enemy);
  }

  get target(): Enemy | null {
    return this.engagement.nearest(this.player.x, this.player.y);
  }

  /** DPS по текущей цели — то, что показывает HUD. */
  get currentDps(): number {
    const target = this.target;
    if (!target) return 0;
    return totalDps(this.player.stats, this.player.weapons, target.def);
  }

  /**
   * Чистый DPS по цели: у босса из урона вычитается его реген в бою
   * (BALANCE.md §5.1). Ноль или меньше — шкала стоит, и победить нельзя,
   * сколько ни бей. Это то самое число, ради которого игрок идёт качаться.
   */
  get netDps(): number {
    const target = this.target;
    if (!target) return 0;
    if (target.tier !== 'boss') return this.currentDps;
    return this.currentDps - bossRegen(target);
  }

  /** Суммарный входящий DPS от всех сцепленных врагов — для дев-панели. */
  get incomingDps(): number {
    return this.engagement.incomingDps(this.player.stats, this.player.armor);
  }

  tick(dt: number): void {
    // Накопленное игровое время. Растёт только на фиксированном шаге, поэтому
    // им можно качать плащ и траву, не заводя вторых часов рядом с логикой.
    this.elapsed += dt;
    stepPatrols(this.enemies, (enemy) => this.engagement.has(enemy), dt);

    if (this.player.alive) {
      if (this.input.isHeld && !this.overlayOpen) {
        this.player.move(this.input.dirX, this.input.dirY, dt);
        this.fog.reveal(this.player.x, this.player.y);
      }
      this.engagement.update(this.enemies, this.player.x, this.player.y);
      this.playerAttack(dt);
      this.enemyAttacks(dt);
    } else {
      this.engagement.clear();
      this.player.respawnIn -= dt;
      if (this.player.respawnIn <= 0) this.player.respawn();
    }

    this.player.clampHp();
    if (this.player.alive) applyRegen(this.player, getBalance().regen.player, dt);
    for (const enemy of this.enemies) {
      if (!enemy.alive) continue;
      // Босс регенерирует В БОЮ и всегда: это единственный регулятор жёсткости
      // гейта (GDD §6.2). Остальные — только в окне вне боя.
      if (enemy.tier === 'boss') applyBossRegen(enemy, dt);
      else applyRegen(enemy, getBalance().regen[enemy.tier], dt);
    }

    this.trackGate();

    this.spawns.tick(dt);
    this.damageNumbers.tick(dt);
    this.screenshake.tick(dt);
    this.particles.tick(dt);
    // Анимация тикается и у мёртвых: труп ещё должен досыпаться, а не пропасть.
    this.player.anim.tick(dt);
    for (const enemy of this.enemies) enemy.anim.tick(dt);

    if (this.toastLeft > 0) {
      this.toastLeft -= dt;
      if (this.toastLeft <= 0) this.toast = null;
    }
  }

  private playerAttack(dt: number): void {
    const target = this.target;
    if (!target) return;

    const { baseAttackSpeed } = getBalance().combat;
    this.player.attackCooldown -= dt;
    if (this.player.attackCooldown > 0) return;
    this.player.attackCooldown += 1 / baseAttackSpeed;

    const crit = this.rng.chance(this.player.stats.critChance);
    const base = hitDamage(this.player.stats, this.player.weapons, target.def);
    const damage = crit ? base * this.player.stats.critMult : base;

    target.hp -= damage;
    // Гейт отмечается здесь, а не только в trackGate: если этим же тиком игрок
    // умрёт, Gate.end() успеет закрыть попытку раньше, чем trackGate дойдёт до
    // очереди, и последний удар пропадёт из процента. Игрок при этом видел, как
    // шкала дёрнулась — и не увидел бы этого в итоге попытки.
    if (target.tier === 'boss') this.gate.note(target.hpFraction);
    resetRegen(target);
    resetRegen(this.player); // урон нанесённый тоже закрывает окно регена

    this.damageNumbers.spawn(damage, target.x, target.y, crit);
    this.screenshake.hit(crit);
    this.hitstop.hit(crit);
    this.sound.play(crit ? 'crit' : 'hit');
    if (crit) this.vibrate('crit');
    playerImpact(this.player, target, this.particles, crit);

    if (target.hp <= 0) {
      target.anim.die();
      this.showToast(rewardKill(this.player, this.inventory, target, this.rng));
      this.spawns.scheduleRespawn(target);
      this.engagement.drop(target);
      this.sound.play('kill');

      if (target.tier === 'boss') this.onBossKilled();
      else this.vibrate('kill');
    }
  }

  /**
   * Ход попытки по боссу.
   *
   * Лучшее за попытку берётся каждый тик, а не в момент смерти: босс отрастает
   * по ходу боя, и на экране должно остаться то, чего игрок реально достиг.
   *
   * Отошёл от арены — попытка закрывается молча, без экрана. Иначе она висела
   * бы открытой, и экран босса всплыл бы после смерти от случайной козы на
   * другом конце острова.
   */
  private trackGate(): void {
    const boss = this.boss;
    const fighting = this.player.alive && boss.alive && this.engagement.has(boss);
    if (fighting) {
      this.gate.note(boss.hpFraction);
      return;
    }
    if (this.player.alive && this.gate.inAttempt) this.gate.end();
  }

  /**
   * Остров пройден. Слоумо и вибрация — единственный момент в игре, где они
   * такой длины: гейт был потолком, и его падение должно ощущаться событием,
   * а не очередным убийством.
   */
  private onBossKilled(): void {
    const { slowmoOnBossKill } = getBalance().juice;
    this.slowmo(slowmoOnBossKill.scale, slowmoOnBossKill.durationMs);
    this.vibrate('bossKill');
    this.bossScreen = this.gate.markDefeated();
  }

  private showToast(text: string | null): void {
    if (!text) return;
    this.toast = text;
    this.toastLeft = getBalance().render.toastSeconds;
  }

  private enemyAttacks(dt: number): void {
    const { baseAttackSpeed } = getBalance().combat;
    for (const enemy of this.engagement.attackers()) {
      enemy.attackCooldown -= dt;
      if (enemy.attackCooldown > 0) continue;
      enemy.attackCooldown += 1 / baseAttackSpeed;

      const damage =
        incomingDps(enemy.dps, enemy.weakness, this.player.stats, this.player.armor)
        / baseAttackSpeed;
      this.player.hp -= damage;
      resetRegen(this.player);
      resetRegen(enemy);

      enemyImpact(enemy, this.player, this.particles);

      if (this.player.hp <= 0) {
        this.player.die();
        this.sound.play('death');
        this.vibrate('death');
        // Экран прогресса всплывает только после боя с боссом: после смерти
        // от обычного врага показывать нечего (Gate.end вернёт null).
        this.bossScreen = this.gate.end();
        return;
      }
    }
  }

  private vibrate(event: HapticEvent): void {
    const { hapticsOn, hapticsMs } = getBalance().juice;
    if (!hapticsOn.includes(event)) return;
    navigator.vibrate?.(hapticsMs[event]);
  }

}
