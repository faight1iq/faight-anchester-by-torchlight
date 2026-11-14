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
const SLEEP = P('When Orme is defeated, Clinker wakes: he drops his shovel and sits down in the yard. A creature that reduces him to 0 HP can choose to knock him out instead of killing him.');
defs.push({ slug: 'josiah-clinker', folder: fCre.id, name: 'Mr. Josiah Clinker', size: 'med', tok: 1,
  bio: P('The stoker of Hawthorne Greens, put under with the watch. He has one order: burn what comes up from the wards and keep strangers out of the yard. He has been trying to burn the Thing That Would Not Burn for three nights. A huge man black with coal dust, eyes open and empty.') + P('<strong>GM:</strong> he attacks the nearest creature, the Thing included. Fire heals the Thing, so his coals make it stronger.') + P('<em>Intent:</em> burn it all and keep the yard.'),
  sys: { abilities: ab(20, 12, 18, 8, 8, 8, ['str', 'con']), hp: 120, ac: 15, walk: 30, cr: 16, type: 'humanoid', subtype: 'Human', align: 'Unaligned', dr: ['fire'], ci: ['charmed', 'frightened'], langs: [], langCustom: 'understands Common but does not speak' },
  items: [
    await passive('Tranced', P('Clinker attacks the nearest creature, friend or foe, the Thing That Would Not Burn included.'), 'icons/magic/control/hypnosis-mesmerism-swirl.webp'),
    await passive('Sleepwalker', SLEEP, 'icons/magic/control/sleep-bubble-purple.webp'),
    await passive('Multiattack', P('Clinker makes two Coal Shovel attacks.'), 'icons/skills/melee/strike-polearm-glowing-white.webp'),
    await (async () => { const w = await attack('Coal Shovel', P('<em>Melee Attack Roll:</em> +12, reach 5 ft. <em>Hit:</em> 16 (2d10 + 5) Bludgeoning damage plus 10 (3d6) Fire damage.'), 'icons/tools/hand/shovel-spade-steel-grey.webp', { bonus: 12, reach: 5, n: 2, d: 10, dtype: 'bludgeoning' }); w.system.damage.base.bonus = '5'; Object.values(w.system.activities)[0].damage.parts = [dmgPart(3, 6, 'fire')]; return w; })(),
    await save('Hurl the Fire (Recharge 5–6)', P('Clinker scoops the firebox and throws it. <em>Dexterity Saving Throw:</em> DC 19, each creature in a 15-ft. Cone. <em>Failure:</em> 42 (12d6) Fire damage, and the target has the Burning condition (1d4 Fire damage at the start of each of its turns until it uses an action to put the fire out). <em>Success:</em> Half damage only.'), 'icons/magic/fire/projectile-fireball-embers-orange.webp', { ability: 'dex', dc: 19, parts: [dmgPart(12, 6, 'fire')], onSave: 'half', u: ['recharge', 5] }),
    await util('Stoke', P('<em>Bonus Action.</em> While within 5 ft. of the furnace, Clinker opens the draught and the firebox roars. Until the start of his next turn, each creature that starts its turn within 10 ft. of the furnace takes 10 (3d6) Fire damage.'), 'icons/magic/fire/flame-burning-campfire-orange.webp', { act: 'bonus', parts: [dmgPart(3, 6, 'fire')] }),
  ] });
defs.push({ slug: 'thing-that-would-not-burn', folder: fCre.id, name: 'The Thing That Would Not Burn', size: 'lg', tok: 2,
  bio: P('The wards send their soiled bedding to the yard to be steamed or burned, and the bedding has soaked up what the sleepers dream. Three nights ago the ash in the furnace stood up. A heap of smouldering ticking, horsehair and ash in the shape of a man.') + P('<strong>GM:</strong> the first time it drops to 0 HP it rises next round with half its HP, unless its heap is in the steam chamber when the steam runs. Closing the chamber door and pulling the lever is one action; a creature inside takes 44 (8d10) damage, and steam is not fire, so the Thing takes it too. Water from the pump ends the Blindness from Ash Breath.') + P('<em>Intent:</em> smother whatever came to burn it.'),
  sys: { abilities: ab(20, 10, 20, 4, 12, 6, ['con']), hp: 210, ac: 17, walk: 30, climb: 20, cr: 16, type: 'aberration', subtype: 'Mythos', align: 'Chaotic Evil', di: ['fire'], ci: ['charmed', 'frightened', 'exhaustion'], dv: 60, langs: [] },
  items: [
    await passive('Fed by Fire', P('Whenever the Thing would take Fire damage, it takes none and regains Hit Points equal to the Fire damage instead. It burns, but it will not burn up.'), 'icons/magic/fire/flame-burning-skull-orange.webp'),
    await passive('Comes Back', P('The first time the Thing drops to 0 Hit Points, it collapses into a smouldering heap. At the start of the next round it rises with half its Hit Point maximum. It does not rise if the heap was steamed in the disinfector\'s chamber. <em>Steam is not fire.</em>'), 'icons/magic/death/skull-energy-light-white.webp'),
    await passive('Multiattack', P('The Thing makes two Smother attacks.'), 'icons/magic/unholy/hand-fire-ghoul-orange.webp'),
    await attack('Smother', P('<em>Melee Attack Roll:</em> +13, reach 10 ft. <em>Hit:</em> 22 (4d10) Bludgeoning damage, and the target has the Grappled condition (escape DC 18). While Grappled, the target can\'t breathe or speak, and it takes 7 (2d6) Fire damage at the start of each of its turns. The Thing can grapple two creatures at once.'), 'icons/magic/unholy/hand-fire-ghoul-orange.webp', { bonus: 13, reach: 10, n: 4, d: 10, dtype: 'bludgeoning' }),
    await save('Ash Breath (Recharge 5–6)', P('The Thing breathes out a cloud of hot ash. <em>Constitution Saving Throw:</em> DC 19, each creature in a 20-ft. Emanation. <em>Failure:</em> 36 (8d8) Necrotic damage, and the target has the Blinded condition until it uses an action to wash the ash from its eyes with water. <em>Success:</em> Half damage only.') + P('<em>Water washes ash away.</em>'), 'icons/magic/air/fog-gas-smoke-dense-gray.webp', { ability: 'con', dc: 19, parts: [dmgPart(8, 8, 'necrotic')], onSave: 'half', u: ['recharge', 5] }),
  ] });

// ---------- create / update ----------
const report = [];
for (const d of defs) {
  const s = d.sys;
  const system = {
    abilities: s.abilities,
    attributes: { ac: { calc: 'flat', flat: s.ac }, hp: { value: s.hp, max: s.hp }, movement: { walk: s.walk, climb: s.climb ?? 0, units: 'ft' },
      senses: { darkvision: s.dv ?? 0, units: 'ft' } },
    details: { cr: s.cr, type: { value: s.type, subtype: s.subtype ?? '' }, alignment: s.align, biography: { value: d.bio } },
    traits: { size: d.size, di: { value: s.di ?? [] }, dr: { value: s.dr ?? [] }, ci: { value: s.ci ?? [] }, languages: { value: s.langs ?? [], custom: s.langCustom ?? '' } },
    skills: Object.fromEntries(Object.entries(s.skills ?? {}).map(([k, v]) => [k, { value: v }])),
  };
  const flags = { [MOD]: { adventure: 'E12', role: 'monster', slug: d.slug } };
  let a = game.actors.find(x => x.flags?.[MOD]?.slug === d.slug);
  const proto = { width: d.tok, height: d.tok, disposition: -1, actorLink: false, displayName: 20, displayBars: 20, bar1: { attribute: 'attributes.hp' } };
  if (a) {
    await a.deleteEmbeddedDocuments('Item', a.items.map(i => i.id));
    await a.update({ name: d.name, folder: d.folder, system, flags, prototypeToken: proto });
  } else {
    a = await Actor.create({ name: d.name, type: 'npc', folder: d.folder, system, flags, prototypeToken: proto });
  }
  if (d.items.length) await a.createEmbeddedDocuments('Item', d.items);
  report.push([d.name, a.id, a.system.attributes.hp.max, a.system.attributes.ac.value, a.items.size]);
}
const fallbacks = Object.entries(ok).filter(([k, v]) => !v).map(([k]) => k);
report.push(['icon fallbacks', fallbacks]);
report;
