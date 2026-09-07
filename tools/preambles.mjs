// Преамбула промпта для бесшовного тайла земли — ISLANDS.md §1.4.
//
// Была ещё пара — PROP и CHAR. Удалены: они требовали от диффузионной модели
// держать камеру 55° и один источник света, чего у неё нет и чего она соблюсти
// не может — разъезд объектов по ракурсу был виден в игре глазом. Объекты,
// фигуры и оружие теперь собираются в Blender (ART_RUNBOOK.md).
//
// Тайлу это не мешает: у поверхности нет ни ракурса, ни собственной тени, и
// диффузия там по-прежнему лучший инструмент.

export const TILE = `Seamless tileable top-down ground texture for a stylized mobile game, ~55-degree top-down angle, flat stylized vector-like illustration, hand-painted mobile game art, clean flat color fills with no grain and no speckle, no visible noise, low contrast, soft even lighting from one direction, no shadows cast by anything, calm and uncluttered. At least 70 percent of the surface must be plain unbroken ground. Details must be small (5-20 px on a 512 px tile) and scattered far apart. No large objects, no focal point, no path, no road, no characters, no text. Edges must tile seamlessly and continuously.
NEGATIVE: noise, grain, speckle, dense texture, busy pattern, high contrast, dark outlines, photorealistic, 3d render, gradient mesh, vignette, drop shadow, large rocks, trees, path, road, tiled seams, borders, frame, text, watermark.`;

export const PREAMBLES = { tile: TILE };
