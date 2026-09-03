// Пятнадцать предметов: три типа урона × пять ступеней редкости.
//
// Зачем отдельные картинки на редкость. Оружие множит стат атаки, и разница
// между обычным и золотым — в четыре с лишним раза (balance.weapons.rarityMult).
// При этом в руке до сих пор один и тот же меч на все пять ступеней, то есть
// самый крупный прыжок силы в игре не виден вообще. Редкость читается только
// цифрой в меню, а игрок смотрит на фигуру.
//
// Прогрессия материалов сделана так, чтобы ступень читалась с одного взгляда и
// без подписи, силуэтом и одним доминирующим цветом:
//
//   common     дерево, тусклая бронза      — рабочий инструмент
//   uncommon   бронза, чистые формы        — снаряжение воина
//   rare       тёмное железо, гравировка   — оружие, сделанное мастером
//   epic       золото и камень, орнамент   — вещь из храма или дворца
//   legendary  свет, редкий материал       — предмет из мифа
//
// Названия — греческие и связаны с маршрутом: пелионский ясень Ахилла, клинок
// Гефеста, молот киклопов. Это не украшение: адрес гринда в GDD §6.5 работает
// только тогда, когда у предмета есть имя, которое можно назвать вслух.
//
// Формат кадра тот же, что у уже принятых деталей Одиссея: оружие стоит
// вертикально рукоятью вниз, потому что движок сажает его в кисть по пивоту
// (ui/rig/RigParts.ts), а не кладёт на землю.

const OUTLINE = 'dark outline #080D14';
const FRAME =
  'Held upright and straight, handle at the bottom, blade or head at the top, one single connected object with the head firmly attached to the shaft. Much taller than wide, vertical, centered, nothing else in frame, no hand, no arm, no ground.';

/** Палитра ступени. Один доминирующий цвет на редкость — чтобы читалась издали. */
const RARITY = {
  common: 'weathered ash wood #9C8B6E and #68482E, dull bronze #8A5526, leather wrap #4A3F38',
  uncommon: 'polished bronze #B87333 and #8A5526, oiled wood #68482E, cream cord #E8DCC8',
  rare: 'dark iron #6E7A8A and #46505E, blued steel highlight #B4BCC9, black oak #2A241F, bronze rings #8A5526',
  epic: 'gold #D9A72B and #A87C1E, deep garnet #7B2438, ivory #E8DCC8, dark iron core #46505E',
  legendary: 'white-hot ember #FF6B2B and #D9762B, molten gold #D9A72B, meteoric iron #2A2E38, ivory #E8DCC8',
};

const ITEMS = [
  // ── Копьё: длинное, узкое, наконечник наверху ────────────────────────────
  ['spear', 'common', 'A plain ancient Greek ash-wood spear: a slender straight shaft with a narrow bronze leaf-shaped head at the top and a simple bronze butt spike, a worn leather grip wrap at the middle. Poor and functional, nicked and used.'],
  ['spear', 'uncommon', 'A Kikonian bronze spear: a straight ash shaft with a broad leaf-shaped bronze head, a bronze collar below the head, a bronze butt spike, and a corded grip. Clean and well kept.'],
  ['spear', 'rare', 'An iron-headed dory: a long dark shaft bound with three bronze rings, topped by a narrow faceted iron spearhead with a raised central rib, a heavy iron butt spike at the base.'],
  ['spear', 'epic', "Athena's spear: a tall polished shaft with a long faceted spearhead inlaid with gold scrollwork, a chased bronze socket bearing a small owl in relief, a golden tassel hanging below the head."],
  ['spear', 'legendary', 'The Pelian ash: a massive heroic spear, thick pale ash shaft bound in gold and ivory, crowned by a broad blade-like head of meteoric iron with a rippling edge that glows faintly with ember light along the fuller.'],

  // ── Меч: короткий, широкий клинок, гарда ─────────────────────────────────
  ['sword', 'common', 'A plain bronze xiphos: a short leaf-shaped bronze blade, a simple straight crossguard, a plain wooden grip and a small round pommel. Dull, scratched, clearly old.'],
  ['sword', 'uncommon', 'A Kikonian xiphos: a broader leaf-shaped bronze blade with a raised midrib, a bronze crossguard with small curled ends, a cord-wrapped grip and a bronze pommel.'],
  ['sword', 'rare', 'An iron kopis: a heavy single-edged forward-curving iron blade, widening toward the tip, a knuckle-guard curving from grip to pommel, a bone grip with dark iron fittings.'],
  ['sword', 'epic', 'A palace sword: a long straight double-edged blade of bright steel, a golden crossguard shaped into two ram horns, a garnet set in the golden pommel, gold wire wound around an ivory grip.'],
  ['sword', 'legendary', "Hephaestus' blade: a dark meteoric-iron blade whose cutting edge glows white-hot as if just off the anvil, faint ember cracks running up the fuller, a heavy golden hilt, an anvil-shaped pommel, ivory grip."],

  // ── Палица: короткая, тяжёлая голова наверху ─────────────────────────────
  ['club', 'common', 'A plain wooden club: a knotted oak branch, thicker and gnarled at the top, bark still on it in places, a rough leather wrist cord at the base. Crude and heavy.'],
  ['club', 'uncommon', 'A studded war club: a tapered oak shaft widening into a knotted head set with four bronze bosses, bronze bands around the head, a leather-wrapped grip and a wrist cord.'],
  ['club', 'rare', 'A black-oak maul: a short dark shaft topped by a heavy faceted head of black oak banded with iron hoops and four iron spikes, an iron collar where head meets shaft.'],
  ['club', 'epic', "Heracles' club: a thick olive-wood club, its head carved into a snarling lion's face with golden mane inlay, golden rings down the shaft, garnet eyes, a braided golden cord at the grip."],
  ['club', 'legendary', 'The Kyklops hammer: a huge forge hammer with a squared bronze-and-gold head chased with lightning patterns, white-hot cracks glowing between the plates, arcs of ember sparks along the edges, a short thick haft bound in ivory.'],
];

export const WEAPON_JOBS = ITEMS.map(([kind, rarity, description]) => ({
  dir: 'islands/uploads/_shared/weapons',
  name: `${kind}-${rarity}`,
  preamble: 'prop',
  width: 512,
  height: 1024,
  steps: 10,
  prompt: `${description} ${FRAME} PALETTE: ${RARITY[rarity]}, ${OUTLINE}.`,
}));
