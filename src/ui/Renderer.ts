import { getBalance } from '../core/Balance.ts';
import type { Game } from '../core/Game.ts';
import type { Enemy } from '../world/Enemy.ts';
import { patrolOutline } from '../world/Patrol.ts';
import { Camera } from './Camera.ts';
import { drawBossProgress } from './BossProgress.ts';
import { drawBadge, drawDropTag } from './EnemyBadge.ts';
import { drawRespawnDial } from './RespawnDial.ts';
import { drawPlayerBar, drawTargetRing } from './Figures.ts';
import { drawSlashArc } from './SlashArc.ts';
import { short } from './Format.ts';
import { drawHud } from './Hud.ts';
import { drawJoystick } from './Joystick.ts';
import { drawFullMap, drawMinimap } from './Minimap.ts';
import { drawStatsScreen } from './StatsScreen.ts';
import { drawTerrain } from './Terrain.ts';
import { text, ui } from './UiKit.ts';
import { drawWeaponBar } from './WeaponBar.ts';
import { drawWorldLayer } from './WorldLayer.ts';
import { rgba } from './props/Optics.ts';

/** Сколько отрезков в нарисованном маршруте. Техническая константа рендера. */
const PATROL_STEPS = 48;

/** Порядок слоёв. Земля — в Terrain.ts, фигуры — в Figures.ts, панели — в ui/. */
export class Renderer {
  private readonly ctx: CanvasRenderingContext2D;
  readonly camera: Camera;

  constructor(ctx: CanvasRenderingContext2D, viewWidth: number, viewHeight: number) {
    this.ctx = ctx;
    this.camera = new Camera(viewWidth, viewHeight);
  }

  draw(game: Game): void {
    const ctx = this.ctx;
    const view = this.camera.viewHeight;

    this.camera.follow(game.player.x, game.player.y);

    ctx.save();
    ctx.translate(game.screenshake.x - this.camera.x, game.screenshake.y - this.camera.y);

    drawTerrain(ctx, game, this.camera);
    this.drawBossArena(game);

    const visible = this.visibleEnemies(game);
    for (const enemy of visible) {
      if (enemy.alive) this.drawPatrolPath(enemy);
    }

    // Циферблаты убитых узлов лежат на земле, под фигурами: они часть карты,
    // а не плашка поверх мира.
    for (const enemy of this.deadNodes(game)) drawRespawnDial(ctx, enemy);

    const target = game.target;
    if (target) drawTargetRing(ctx, target);

    // Декор, враги и игрок — одним списком по глубине, чтобы объект, за
    // которым стоит игрок, его перекрывал (WorldLayer). Плашки строго после
    // всех фигур: иначе сосед перекрывает чужие иконки, а три иконки над
    // врагом — единственный механизм решения в игре.
    drawWorldLayer(ctx, game, visible, this.camera);
    drawSlashArc(ctx, game);
    this.drawParticles(game);
    for (const enemy of visible) {
      // Мёртвый ещё дорисовывает распад, но плашка над ним уже лишняя:
      // цифры на исчезающем трупе читаются как живой враг.
      if (!enemy.alive) continue;
      drawBadge(ctx, enemy, game.player.stats, game.player.weapons);
      drawDropTag(ctx, enemy);
    }
    if (game.player.alive) drawPlayerBar(ctx, game);
    this.drawDamageNumbers(game);

    ctx.restore();

    this.drawHaze(view);
    this.drawInterface(game, view);
  }

  /**
   * Дымка глубины: холодный градиент от верхнего края кадра вниз.
   *
   * Камера смотрит на мир сверху под наклоном, то есть верх экрана — это даль.
   * Без дымки даль освещена ровно так же, как земля под ногами, и сцена
   * читается плоской наклейкой независимо от того, насколько хорош сам арт.
   * GDD §3 берёт этот приём у постера прямым текстом.
   *
   * Ложится поверх мира, но под интерфейсом: затемнять собственные панели
   * незачем, а плашки над врагами она чуть притапливает вместе с фигурами —
   * это правильно, они принадлежат миру.
   */
  private drawHaze(view: number): void {
    const { render, palette } = getBalance();
    const { haze } = render;
    if (haze.topAlpha <= 0) return;

    const ctx = this.ctx;
    const height = view * haze.heightFraction;
    const gradient = ctx.createLinearGradient(0, 0, 0, height);
    gradient.addColorStop(0, rgba(palette[haze.color], haze.topAlpha));
    gradient.addColorStop(1, rgba(palette[haze.color], 0));
    ctx.save();
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, this.camera.viewWidth, height);
    ctx.restore();
  }

  /** Интерфейс живёт в координатах ОДНОГО экрана, камера его не двигает. */
  private drawInterface(game: Game, view: number): void {
    const ctx = this.ctx;
    const screenWidth = this.camera.viewWidth;

    // Экран гейта — самый верхний слой: после смерти от босса игрок должен
    // увидеть свой процент, а не полосу слотов.
    if (game.bossScreen) {
      drawBossProgress(ctx, game.bossScreen, screenWidth, view);
      return;
    }

    // Строки считаются один раз за кадр: внутри шесть прогонов формулы DPS,
    // а нужны они и полосе слотов, и плашке «ГОТОВО!».
    const rows = game.upgradeRows();

    if (game.statsOpen) {
      drawStatsScreen(ctx, game, rows, screenWidth, view);
      return;
    }

    drawHud(ctx, game, rows, screenWidth, view);
    drawWeaponBar(ctx, rows, screenWidth, view, game.player.equipped);

    if (game.mapOpen) {
      drawFullMap(ctx, game, screenWidth, view);
    } else {
      drawMinimap(ctx, game, screenWidth);
      drawJoystick(ctx, game.input);
    }
  }

  /** За экраном ничего не рисуем: на карте в девять экранов это почти все узлы. */
  private visibleEnemies(game: Game): Enemy[] {
    const { render } = getBalance();
    const visible: Enemy[] = [];
    for (const enemy of game.enemies) {
      // Мёртвый, но ещё распадающийся враг остаётся в списке: без него труп
      // пропадал бы в тот же кадр, в котором его добили.
      if (!enemy.alive && !enemy.anim.dying) continue;
      const margin = enemy.size + render.iconOffset;
      if (this.camera.isVisible(enemy.x, enemy.y, margin, margin)) visible.push(enemy);
    }
    return visible;
  }

  /**
   * Убитые узлы, у которых уже отыграл распад: под них рисуется циферблат.
   * Отдельно от visibleEnemies, где их намеренно нет — плашка с цифрами над
   * трупом читалась бы как живой враг.
   */
  private deadNodes(game: Game): Enemy[] {
    const { render } = getBalance();
    const nodes: Enemy[] = [];
    const margin = render.respawnDial.radius * 2;
    for (const enemy of game.enemies) {
      if (enemy.alive || enemy.anim.dying) continue;
      if (this.camera.isVisible(enemy.x, enemy.y, margin, margin)) nodes.push(enemy);
    }
    return nodes;
  }

  /**
   * Круг арены островного босса. Единственная разметка на земле, кроме дорог:
   * гейт должен быть виден раньше, чем игрок войдёт в радиус боя.
   */
  private drawBossArena(game: Game): void {
    const { render, palette } = getBalance();
    const { bossArena } = render;
    const boss = game.boss;
    if (!this.camera.isVisible(boss.x, boss.y, bossArena.radius, bossArena.radius)) return;

    const ctx = this.ctx;
    ctx.save();
    ctx.beginPath();
    ctx.ellipse(boss.x, boss.y, bossArena.radius, bossArena.radius * 0.62, 0, 0, Math.PI * 2);
    ctx.lineWidth = bossArena.ringWidth;
    // Мёртвый босс — открытый гейт: кольцо гаснет вместе с ним.
    ctx.strokeStyle = boss.alive ? palette.danger : palette.borderStone;
    ctx.stroke();
    ctx.restore();
  }

  /** Искры контакта. Поверх фигур: под ними всплеск съедается силуэтами. */
  private drawParticles(game: Game): void {
    const ctx = this.ctx;
    ctx.save();
    game.particles.forEach((item, progress) => {
      ctx.globalAlpha = 1 - progress;
      ctx.fillStyle = item.color;
      ctx.fillRect(item.x - item.size / 2, item.y - item.size / 2, item.size, item.size);
    });
    ctx.restore();
  }

  /**
   * Маршрут врага пунктиром под ногами. Рисуется именно потому, что он
   * повторяется: увидев круг, игрок понимает, где враг окажется через
   * секунду, и подход к узлу становится расчётом, а не реакцией.
   */
  private drawPatrolPath(enemy: Enemy): void {
    const { patrol, palette } = getBalance();
    const points = enemy.patrol ? patrolOutline(enemy.patrol, PATROL_STEPS) : [];
    if (points.length < 2) return;

    const ctx = this.ctx;
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(points[0]!.x, points[0]!.y);
    for (const point of points.slice(1)) ctx.lineTo(point.x, point.y);
    ctx.closePath();

    // Сплошная светлая подложка и тёмный пунктир поверх: на пёстрой земле
    // один пунктир любого цвета теряется, а маршрут должен читаться раньше,
    // чем игрок войдёт в радиус врага.
    ctx.globalAlpha = patrol.pathAlpha * 0.6;
    ctx.strokeStyle = palette.accentLight;
    ctx.lineWidth = patrol.pathWidth * 2.5;
    ctx.stroke();

    ctx.globalAlpha = patrol.pathAlpha;
    ctx.strokeStyle = palette.silhouette;
    ctx.lineWidth = patrol.pathWidth;
    ctx.setLineDash([...patrol.pathDash]);
    ctx.stroke();
    ctx.restore();
  }

  private drawDamageNumbers(game: Game): void {
    const { render } = getBalance();
    const u = ui();
    const ctx = this.ctx;

    game.damageNumbers.forEach((item, progress) => {
      const size = render.damageNumberFontSize * (item.crit ? render.damageNumberCritScale : 1);
      ctx.globalAlpha = 1 - progress;
      text(
        ctx,
        short(item.value),
        item.x + item.drift * render.damageNumberRise * 0.4,
        item.y - progress * render.damageNumberRise,
        { size, fill: item.crit ? u.colors.gold : u.colors.text },
      );
    });

    ctx.globalAlpha = 1;
  }
}
