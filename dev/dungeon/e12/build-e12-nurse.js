// Build E12 actors: Dr. Valentin Orme, Tranced Orderly, The Thing Under the Bed, The Dreamer in No. 8.
// Runs in the Foundry page (dnd5e 5.3). Rebuilds in place by flag slug.
const MOD = 'faight-anchester-by-torchlight';
const rid = () => foundry.utils.randomID();
const P = s => `<p>${s}</p>`;
const ok = {};
async function icon(path, fallback = 'icons/svg/aura.svg') {
  if (ok[path] !== undefined) return ok[path] ? path : fallback;
  try { const r = await fetch('/' + path, { method: 'HEAD' }); ok[path] = r.ok; } catch (e) { ok[path] = false; }
  return ok[path] ? path : fallback;
}
const uses = (kind, n) => kind === 'recharge' ? { max: '1', spent: 0, recovery: [{ period: 'recharge', formula: String(n), type: 'recoverAll' }] }
  : kind === 'day' ? { max: '1', spent: 0, recovery: [{ period: 'day', type: 'recoverAll' }] } : { spent: 0, recovery: [] };
const consume = u => u ? { targets: [{ type: 'itemUses', target: '', value: '1', scaling: {} }], scaling: { allowed: false }, spellSlot: true } : { targets: [], scaling: { allowed: false }, spellSlot: true };
const dmgPart = (n, d, type) => ({ number: n, denomination: d, bonus: '', types: [type], custom: { enabled: false }, scaling: { number: 1 } });

async function passive(name, text, img) {
  return { name, type: 'feat', img: await icon(img), system: { type: { value: 'monster', subtype: '' }, description: { value: text } } };
}
async function attack(name, text, img, { bonus, reach, range, n, d, dtype, act = 'action', u }) {
  const id = rid();
  const sys = { type: { value: 'natural', baseItem: '' }, description: { value: text }, damage: { base: dmgPart(n, d, dtype) },
    range: range ? { value: range, units: 'ft' } : { reach: reach ?? 5, units: 'ft' }, uses: uses(u?.[0], u?.[1]), properties: [],
    activities: { [id]: { _id: id, type: 'attack', activation: { type: act, value: 1, override: false },
      attack: { flat: true, bonus: String(bonus), type: { value: range ? 'ranged' : 'melee', classification: 'weapon' }, critical: {} },
      damage: { includeBase: true, parts: [], critical: {} }, consumption: consume(u), range: { units: 'self', override: false } } } };
  return { name, type: 'weapon', img: await icon(img), system: sys };
}
async function save(name, text, img, { ability, dc, parts = [], onSave = 'none', act = 'action', u, conc = false }) {
  const id = rid();
  return { name, type: 'feat', img: await icon(img), system: { type: { value: 'monster', subtype: '' }, description: { value: text }, uses: uses(u?.[0], u?.[1]),
    activities: { [id]: { _id: id, type: 'save', activation: { type: act, value: 1, override: false }, save: { ability: [ability], dc: { calculation: '', formula: String(dc) } },
      damage: { onSave, parts }, consumption: consume(u), duration: conc ? { value: '1', units: 'minute', concentration: true, override: false } : { units: 'inst', concentration: false, override: false },
      range: { units: 'self', override: false } } } } };
}
async function util(name, text, img, { act = 'action', u, parts } = {}) {
  const id = rid();
  const a = parts ? { _id: id, type: 'damage', activation: { type: act, value: 1, override: false }, damage: { parts }, consumption: consume(u), range: { units: 'self', override: false } }
    : { _id: id, type: 'utility', activation: { type: act, value: 1, override: false }, consumption: consume(u), range: { units: 'self', override: false }, roll: { prompt: false, visible: false } };
  return { name, type: 'feat', img: await icon(img), system: { type: { value: 'monster', subtype: '' }, description: { value: text }, uses: uses(u?.[0], u?.[1]), activities: { [id]: a } } };
}
const ab = (s, d, c, i, w, ch, saves = []) => Object.fromEntries([['str', s], ['dex', d], ['con', c], ['int', i], ['wis', w], ['cha', ch]].map(([k, v]) => [k, { value: v, proficient: saves.includes(k) ? 1 : 0 }]));

// ---------- folders ----------
const e11 = game.folders.find(f => f.type === 'Actor' && f.name === 'E11 Infinite Dreams');
let top = game.folders.find(f => f.type === 'Actor' && f.name === 'E12 Can I Play With Madness');
if (!top) top = await Folder.create({ name: 'E12 Can I Play With Madness', type: 'Actor', folder: e11?.folder?.id ?? null, sorting: 'a' });
const sub = async n => game.folders.find(f => f.type === 'Actor' && f.name === n && f.folder?.id === top.id) ?? await Folder.create({ name: n, type: 'Actor', folder: top.id });
const fCre = await sub('Creatures'), fNpc = await sub('NPCs');

const EPIC = P('<strong>Epic Boss.</strong> Acts on Initiative 10 and has no reactions or bonus actions. On its own turn it only moves. After each player\'s turn it uses one Ability.');
const EBR = P('<strong>Epic Boss Resistance.</strong> When subjected to an effect, it rolls a d20. On an 11 or higher, the effect ends.');

const defs = [];
const IMG = 'modules/faight-anchester-by-torchlight/assets/tokenizer/npc-images/';
defs.push({ slug: 'night-nurse', folder: fCre.id, name: 'The Night Nurse', size: 'lg', tok: 2, img: 'night_nurse',
  bio: P('The nightmare that all five sleepers of the west wing dream, made strong enough by Orme\'s machine to walk their corridor. An impossibly tall nurse in starched white, with a porcelain face, a brass lamp and a tray of bromide. The sleepers walk behind her in a slow line.') + P('<strong>GM:</strong> she sees only by her lamp. Breaking it (AC 15, HP 20; an attack against it has no penalty) leaves her blind beyond 10 ft. She hides behind the sleepwalkers. Damage wakes a sleepwalker; if all five are awake, she loses Epic Boss Resistance.') + P('<em>Intent:</em> put every visitor to bed.'),
  sys: { abilities: ab(16, 18, 18, 10, 16, 18, ['dex', 'wis']), hp: 280, ac: 18, walk: 30, cr: 16, type: 'aberration', subtype: 'Mythos', align: 'Lawful Evil', dr: ['psychic'], ci: ['charmed', 'frightened'], dv: 0, langs: ['common'] },
  items: [
    await passive('Init 10 (Epic Boss)', EPIC, 'icons/svg/clockwork.svg'),
    await passive('Epic Boss Resistance', EBR, 'icons/magic/control/debuff-chains-ropes-net-white.webp'),
    await passive('By Lamplight', P('The Night Nurse sees only within the light of her lamp (bright light 20 ft.). If the lamp is broken (AC 15, HP 20), she has Blindsight 10 ft. and is otherwise Blinded.'), 'icons/sundries/lights/lantern-iron-yellow.webp'),
    await passive('The Dreamers of the West Wing', P('Five sleepwalking patients dream her. If all five are awake (any damage, or a shot of Adrenaline, wakes one), she loses Epic Boss Resistance.'), 'icons/magic/control/sleep-bubble-purple.webp'),
    await attack('Hush', P('The Night Nurse moves up to 10 ft. <em>Melee Attack Roll:</em> +13, reach 10 ft. <em>Hit:</em> 35 (10d6) Psychic damage, and the target gains a Tormenting Pox (−2 Wisdom until a long rest). The Pox stacks with itself.'), 'icons/magic/control/silhouette-hold-change-blue.webp', { bonus: 13, reach: 10, n: 10, d: 6, dtype: 'psychic' }),
    await save('Lights Out (Recharge 5–6)', P('The Night Nurse moves up to 10 ft. and turns down her lamp on one creature she can see. <em>Wisdom Saving Throw:</em> DC 19. <em>Failure:</em> 36 (8d8) Psychic damage, and the target is put to bed: it appears in an empty bed on the map and has the Unconscious and Restrained conditions while she concentrates, up to 1 minute. Taking damage does not wake it; another creature wakes it by shaking it (an action). <em>Success:</em> Half damage only.'), 'icons/magic/control/sleep-bubble-purple.webp', { ability: 'wis', dc: 19, parts: [dmgPart(8, 8, 'psychic')], onSave: 'half', u: ['recharge', 5], conc: true }),
    await save('Bromide', P('The Night Nurse moves up to 10 ft. and spoons bromide into one creature within 5 ft. <em>Constitution Saving Throw:</em> DC 19. <em>Failure:</em> the target has the Poisoned condition until it finishes a long rest. While Poisoned, it has Disadvantage on Wisdom saving throws. <em>Success:</em> no effect.') + P('<em>Modern medicine can be counteracted with other modern medicines.</em>'), 'icons/consumables/potions/bottle-round-corked-brown.webp', { ability: 'con', dc: 19 }),
    await util('Line Up, Ladies', P('The Night Nurse moves up to 10 ft. Each sleepwalker moves up to 15 ft. to a space she chooses, usually between her and her attackers.'), 'icons/creatures/abilities/mouth-teeth-human.webp'),
    await util('Response: Rounds (Recharge 4–6)', P('The Night Nurse moves up to 10 ft. and raises her lamp. Each creature within 20 ft. that can see the lamp must succeed on a DC 19 Constitution saving throw or have the Blinded condition until the end of its next turn.'), 'icons/sundries/lights/lantern-iron-yellow.webp', { act: 'special', u: ['recharge', 4] }),
    await util('Response: Bedside Manner (Recharge 5–6)', P('The Night Nurse moves up to 10 ft. A sleepwalker within 5 ft. of her steps into the path of the next attack against her and takes the hit instead.'), 'icons/magic/defensive/shield-barrier-glowing-triangle-blue.webp', { act: 'special', u: ['recharge', 5] }),
  ] });
defs.push({ slug: 'sleepwalking-patient', folder: fNpc.id, name: 'Sleepwalking Patient', size: 'med', tok: 1, img: 'sleepwalking_patient', disp: 0,
  bio: P('A patient of the west wing, walking in her sleep behind the Night Nurse. She is harmless and does not fight. Any damage, or a shot of Adrenaline, wakes her; she collapses where she stands and cries.'),
  sys: { abilities: ab(8, 10, 10, 10, 10, 10), hp: 9, ac: 10, walk: 20, cr: 0, type: 'humanoid', subtype: 'Human', align: 'Neutral', langs: ['common'] },
  items: [await passive('Sleepwalking', P('She moves only when the Night Nurse tells her to. Any damage, or a shot of Adrenaline, wakes her and she has the Prone condition.'), 'icons/magic/control/sleep-bubble-purple.webp')] });

const report = [];
for (const d of defs) {
  const s = d.sys;
  const system = {
    abilities: s.abilities,
    attributes: { ac: { calc: 'flat', flat: s.ac }, hp: { value: s.hp, max: s.hp }, movement: { walk: s.walk, units: 'ft' }, senses: { darkvision: s.dv ?? 0, units: 'ft' } },
    details: { cr: s.cr, type: { value: s.type, subtype: s.subtype ?? '' }, alignment: s.align, biography: { value: d.bio } },
    traits: { size: d.size, dr: { value: s.dr ?? [] }, ci: { value: s.ci ?? [] }, languages: { value: s.langs ?? [], custom: '' } },
  };
  const flags = { [MOD]: { adventure: 'E12', role: d.disp === 0 ? 'npc' : 'monster', slug: d.slug } };
  const proto = { width: d.tok, height: d.tok, disposition: d.disp ?? -1, actorLink: false, displayName: 20, displayBars: 20, bar1: { attribute: 'attributes.hp' }, texture: { src: IMG + d.img + '.Token.webp' } };
  let a = game.actors.find(x => x.flags?.[MOD]?.slug === d.slug);
  if (a) { await a.deleteEmbeddedDocuments('Item', a.items.map(i => i.id)); await a.update({ name: d.name, folder: d.folder, img: IMG + d.img + '.Avatar.webp', system, flags, prototypeToken: proto }); }
  else a = await Actor.create({ name: d.name, type: 'npc', folder: d.folder, img: IMG + d.img + '.Avatar.webp', system, flags, prototypeToken: proto });
  await a.createEmbeddedDocuments('Item', d.items);
  const up = a.items.filter(i => i.type === 'weapon').map(w => ({ _id: w.id, [`system.activities.${w.system.activities.contents[0].id}.attack.ability`]: 'none' }));
  if (up.length) await a.updateEmbeddedDocuments('Item', up);
  report.push([d.name, a.id, a.items.size]);
}
report.push(['icon fallbacks', Object.entries(ok).filter(([k, v]) => !v).map(([k]) => k)]);
report;
