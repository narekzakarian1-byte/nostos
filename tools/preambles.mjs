// Три преамбулы промптов — ISLANDS.md §1.4.
//
// ВНИМАНИЕ: PROP и CHAR заказывают плоскую векторную иллюстрацию с обводкой и
// лимитом в шесть цветов. Это стиль, отменённый в GDD.md §3: объекты и фигуры
// теперь строятся скриптом в Blender и рендерятся под камеру игры
// (ART_PIPELINE.md). Гонять по ним новый арт нельзя — он приедет в старом
// стиле. TILE остаётся в силе: для бесшовной текстуры поверхности ракурс и свет
// не важны, и диффузия там по-прежнему лучший инструмент.
//
// Их соблюдение и есть причина, по которой сгенерированный объект встаёт рядом
// с уже готовыми и не разъезжается с ними по камере и свету. Держатся отдельно,
// потому что ими пользуются оба гонщика: tools/generate.mjs (набор Исмары) и
// tools/generate-island.mjs (задания из файлов островов).
//
// Против текста в ISLANDS.md здесь дописаны блоки NEGATIVE: без них Flux
// подставлял под объект землю и тень, и картинка не проходила приёмку.

export const TILE = `Seamless tileable top-down ground texture for a stylized mobile game, ~55-degree top-down angle, flat stylized vector-like illustration, hand-painted mobile game art, clean flat color fills with no grain and no speckle, no visible noise, low contrast, soft even lighting from one direction, no shadows cast by anything, calm and uncluttered. At least 70 percent of the surface must be plain unbroken ground. Details must be small (5-20 px on a 512 px tile) and scattered far apart. No large objects, no focal point, no path, no road, no characters, no text. Edges must tile seamlessly and continuously.
NEGATIVE: noise, grain, speckle, dense texture, busy pattern, high contrast, dark outlines, photorealistic, 3d render, gradient mesh, vignette, drop shadow, large rocks, trees, path, road, tiled seams, borders, frame, text, watermark.`;

export const PROP = `Top-down mobile game prop, single isolated object.
CAMERA: fixed 55-degree top-down three-quarter view, as in a mobile action RPG. The viewer looks DOWN at the object from above and slightly in front; top faces are clearly visible. Orthographic projection, no lens perspective, no vanishing point, no wide-angle distortion, no eye-level view.
LIGHT: exactly one hard light source from the RIGHT and slightly toward the viewer. Lit faces point right and down-screen, shaded faces point left and up-screen. Consistent across every surface.
NO SHADOW: do not draw any shadow on the ground. No drop shadow, no contact shadow, no cast shadow, no dark ellipse, no blur under the object. Nothing beneath it at all. Shading ON the object itself is fine.
NO GROUND UNDER IT: the object must not stand on sand, soil, pebbles, gravel, grass, a stone slab, a dirt patch or any other ground. There is no ground in this image at all. Nothing whatsoever below or around the object except the flat green background — its base meets the green directly.
BACKGROUND: completely flat uniform pure chroma green #00FF00, edge to edge. No gradient, no texture, no ground, no grass, no horizon, no scenery. Absolutely no green of any kind anywhere on the object itself.
OUTLINE: a clean, closed, continuous near-black outline #080D14, 6-8 px thick, tracing the entire outer silhouette where it meets the background, including inner openings. No fuzzy edges, no glow, no feathering.
STYLE: flat stylized vector illustration, bold clean shapes, hard-edged flat color fills, 3-4 tones per material (light / mid / dark). No gradients, no airbrush, no photorealism, no 3D render, no ambient occlusion, no specular highlights, no noise texture.
FRAMING: object centered horizontally, filling ~90% of the frame. Its base sits exactly on the bottom edge of the image, no empty margin below the base. No text, no watermark, no logo, no UI, no border frame.
NEGATIVE: ground patch, sand, soil, dirt, pebbles, gravel, grass, base plate, pedestal, drop shadow, cast shadow, scenery, horizon, photorealism, 3d render, text, watermark.`;

export const CHAR = `Top-down mobile game character sprite, single figure, centered.
CAMERA: fixed 55-degree top-down three-quarter view. The viewer looks DOWN at the figure from above and slightly in front. Orthographic projection, no lens perspective, no eye-level view.
LIGHT: exactly one hard light source from the RIGHT and slightly toward the viewer.
NO SHADOW: no drop shadow, no contact shadow, no dark ellipse under the figure. Nothing beneath it at all.
BACKGROUND: completely flat uniform pure chroma green #00FF00, edge to edge. No gradient, no texture, no ground, no scenery. Absolutely no green anywhere on the figure itself.
OUTLINE: a clean, closed, continuous near-black outline #080D14, 6-8 px thick around the entire silhouette.
STYLE: flat stylized vector illustration, bold clean shapes, hard-edged flat fills, no more than 6 colors total. The silhouette must stay recognizable when filled with solid black.
POSE: standing, weight forward, aggressive readable stance, seen from above and slightly in front — head, shoulders and both feet clearly visible.
FRAMING: the figure fills ~85% of the frame, feet touching the bottom edge, centered horizontally.
HANDS EMPTY: no weapon in the hands — the weapon is a separate overlay drawn by the engine. Sheathed weapons, quivers and shields on the back are fine.
No text, no watermark, no logo, no UI, no border frame.
NEGATIVE: ground patch, sand, soil, dirt, pebbles, gravel, grass, base plate, pedestal, drop shadow, cast shadow, scenery, horizon, photorealism, 3d render, text, watermark.`;

export const PREAMBLES = { tile: TILE, prop: PROP, char: CHAR };
