// Что генерируем для Исмары. Отдельно от tools/generate.mjs, потому что
// очередь — это данные: список правится чаще, чем сам гонщик.
//
// Палитра острова — из islands/01-ismaros.md: трава #3E7F3F / #2D5E31,
// олива #6E8A4B, охра #A8843F, известняк #C9C3AE, огонь #D9762B, угли #4A3F38.
// Зелёного на самих объектах быть не должно: фон хромакейный (ISLANDS.md §1.4).

const PALETTE = 'limestone #C9C3AE and #A89E86, dry ochre #A8843F, weathered wood #88603E and #68482E, charred wood #4A3F38 and #2A241F, ember orange #D9762B, bronze #B08550, dark outline #080D14';

export const JOBS = [
  // ── Ландмарки: то, без чего берег и арена остаются пустым полем ──────────
  {
    set: 'landmarks', category: 'props', name: 'ship-beached',
    preamble: 'prop', width: 1024, height: 1024, steps: 10,
    prompt: `An ancient Greek black-hulled galley hauled up onto a pebble beach and resting on wooden rollers, seen from above and slightly in front. Long low hull with a curved stern post and a ram at the bow, a single mast lowered and lashed along the deck, oars stacked inside, a boarding plank down to the ground on the right. Weathered dark timber hull with a painted eye near the bow. Wider than tall, lying along the horizontal axis. PALETTE: dark hull ${PALETTE}, painted eye white #E8DCC8 with black pupil.`,
  },
  {
    set: 'landmarks', category: 'props', name: 'temple-burnt',
    preamble: 'prop', width: 1024, height: 1024, steps: 10,
    prompt: `The burnt shell of a small ancient Greek temple, seen from above and slightly in front. A low stepped limestone platform, four fluted columns still standing along the front with two snapped off at mid height, the roof and pediment collapsed inward, charred roof beams sticking out of the rubble, thin smoke stains climbing the stone, faint orange embers glowing deep inside the ruin. Wider than tall. PALETTE: ${PALETTE}.`,
  },

  // ── Пропы взамен серой геометрии ────────────────────────────────────────
  {
    set: 'props', category: 'props', name: 'column',
    preamble: 'prop', width: 768, height: 1024,
    prompt: `A single standing ancient Greek fluted limestone column with a simple Doric capital, standing on a square base, weathered and chipped, taller than wide. PALETTE: ${PALETTE}.`,
  },
  {
    set: 'props', category: 'props', name: 'column-broken',
    preamble: 'prop', width: 1024, height: 768,
    prompt: `A broken ancient Greek limestone column: a waist-high stump with a jagged snapped top still standing on its base, and the upper shaft lying beside it on the ground, cracked into two drums. Wider than tall. PALETTE: ${PALETTE}.`,
  },
  {
    set: 'props', category: 'props', name: 'ruin-gate',
    preamble: 'prop', width: 1024, height: 768,
    prompt: `A ruined ancient Greek stone gateway: two thick limestone piers with a heavy cracked lintel still bridging them, one pier chipped away at the top, weathered blocks with dark joints. Wider than tall, an open passage clearly visible between the piers. PALETTE: ${PALETTE}.`,
  },
  {
    set: 'props', category: 'props', name: 'rock',
    preamble: 'prop', width: 1024, height: 768,
    prompt: `A single weathered limestone boulder with flat faceted faces and a chipped edge, sitting on the ground, wider than tall, no moss, no plants. PALETTE: ${PALETTE}.`,
  },
  {
    set: 'props', category: 'props', name: 'rubble',
    preamble: 'prop', width: 1024, height: 512,
    prompt: `A low scatter of broken masonry: five or six flat chipped limestone slabs and a few small stone chunks lying flat on the ground in a loose group, very low to the ground, much wider than tall. PALETTE: ${PALETTE}.`,
  },

  // ── Оружие в руке ───────────────────────────────────────────────────────
  {
    set: 'weapons', category: 'entities', name: 'club',
    preamble: 'prop', width: 512, height: 1024,
    prompt: `A single ancient Greek war club held upright, handle at the bottom: a heavy tapered oak shaft widening into a knotted head studded with four bronze bosses, a leather-wrapped grip and a wrist cord at the base. One connected object, the head firmly attached to the shaft. Much taller than wide, vertical, nothing else in frame. PALETTE: ${PALETTE}.`,
  },

  // ── Детали кикона под риг: тело, рука, нога отдельными картинками ────────
  {
    set: 'kikon', category: 'entities', name: 'kikon-torso',
    preamble: 'char', width: 512, height: 512,
    prompt: `ONLY the head and torso of a Thracian Kikone raider, cut off at the hips, no legs and no arms in frame. Short woollen tunic with a red zigzag hem, a fox-skin cap worn fur-out, a crescent wicker pelta shield slung on his back. Body almost black #080D14, the single colour accent is the red hem. Centered, upright, filling the frame. PALETTE: near-black body #080D14, red hem #C4342B, fur cap #88603E, wicker #A8843F.`,
  },
  {
    set: 'kikon', category: 'entities', name: 'kikon-arm',
    preamble: 'char', width: 512, height: 512,
    prompt: `ONLY a single bare human arm, detached, no body and no shoulder joint visible: straight, hanging down, palm forward, fist closed as if gripping a shaft. Nothing else in frame, no weapon, no torso. Vertical, filling the frame top to bottom. PALETTE: near-black skin #080D14 with one lighter edge tone #2A241F, leather wrist wrap #88603E.`,
  },
  {
    set: 'kikon', category: 'entities', name: 'kikon-leg',
    preamble: 'char', width: 512, height: 512,
    prompt: `ONLY a single bare human leg, detached, no body and no hip visible: straight, seen from the front, bare foot at the bottom, a leather thong wrapped around the ankle. Nothing else in frame. Vertical, filling the frame top to bottom. PALETTE: near-black skin #080D14 with one lighter edge tone #2A241F, leather thong #88603E.`,
  },
];
