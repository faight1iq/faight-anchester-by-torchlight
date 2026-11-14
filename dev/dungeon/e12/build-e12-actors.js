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

// ---------- Dr. Valentin Orme ----------
defs.push({ slug: 'dr-valentin-orme', folder: fCre.id, name: 'Dr. Valentin Orme', size: 'med', tok: 1,
  bio: P('Physician and mesmerist at Hawthorne Greens, paid by the Clairvoyant to run the dream spell from the basement. He hunts intruders through the building with a gold pocket watch and the staff he has put under, fighting from behind them and taking one mind at a time. He never stays to finish a fight.') + P('<em>Intent:</em> catch the players before they reach the machine and put them back to sleep.'),
  sys: { abilities: ab(10, 14, 14, 20, 18, 20, ['wis', 'cha']), hp: 297, ac: 19, walk: 30, cr: 16, type: 'humanoid', subtype: 'Human', align: 'Lawful Evil',
    skills: { dec: 1, ins: 1, med: 1, prc: 1 }, langs: ['common'] },
  items: [
    await passive('Init 10 (Epic Boss)', EPIC, 'icons/svg/clockwork.svg'),
    await passive('Epic Boss Resistance', EBR, 'icons/magic/control/debuff-chains-ropes-net-white.webp'),
    await passive('Behind His People', P('Attack rolls against Orme have Disadvantage while a Tranced Orderly is within 5 ft. of him.'), 'icons/magic/control/silhouette-hold-change-blue.webp'),
    await passive('Mesmerized', P('A Mesmerized creature has the Incapacitated condition and a Speed of 0. The effect ends early when the creature takes damage, or when another creature within 5 ft. of it takes an action to shake it.'), 'icons/magic/control/hypnosis-mesmerism-swirl.webp'),
    await attack('The Glint', P('Orme moves up to 10 ft. <em>Ranged Attack Roll:</em> +13, range 60 ft. <em>Hit:</em> 35 (10d6) Psychic damage, and the target is Mesmerized until the end of its next turn.'), 'icons/magic/control/hypnosis-mesmerism-eye.webp', { bonus: 13, range: 60, n: 10, d: 6, dtype: 'psychic' }),
    await util('Come Closer', P('Orme moves up to 10 ft. A creature of his choice that can hear the watch ticking walks up to 15 ft. straight toward him. No saving throw.'), 'icons/magic/control/mouth-smile-deception-purple.webp'),
    await util('Snap (Recharge 5–6)', P('Orme moves up to 10 ft. and snaps his fingers. Each Mesmerized creature takes 35 (10d6) Psychic damage, and one Tranced Orderly makes a Seize attack.'), 'icons/magic/sonic/explosion-shock-wave-teal.webp', { u: ['recharge', 5], parts: [dmgPart(10, 6, 'psychic')] }),
    await util('Response: Change Places (Recharge 5–6)', P('Orme swaps places with a Tranced Orderly within 30 ft. of him, then moves up to 10 ft.'), 'icons/magic/movement/trail-streak-impact-blue.webp', { act: 'special', u: ['recharge', 5] }),
    await util('Response: The Watch Stops (1/Day)', P('Orme moves up to 10 ft. and holds up the watch. Each creature within 60 ft. that can see it is Mesmerized until the end of the round. No saving throw. A creature that is Blinded, or that is keeping its eyes shut, is unaffected; keeping its eyes shut gives it Disadvantage on attack rolls.'), 'icons/magic/time/clock-stopwatch-white-blue.webp', { act: 'special', u: ['day'] }),
  ] });

// ---------- Tranced Orderly ----------
const hint = '<strong><em>Modern medicine can be counteracted with other modern medicines.</em></strong>';
const syr = async (name, label, cond, img) => attack(`${name} Syringe`, P(`<em>Melee Attack Roll:</em> +12, reach 5 ft. <em>Hit:</em> 2 (1d4) Piercing damage. On a hit, the target must make a DC 20 Constitution saving throw or have the Poisoned condition until it finishes a long rest. While Poisoned, the target ${cond}`) + P(`The brass label on the barrel reads ${label}.`) + P(hint), img, { bonus: 12, reach: 5, n: 1, d: 4, dtype: 'piercing' });
defs.push({ slug: 'tranced-orderly', folder: fCre.id, name: 'Tranced Orderly', size: 'med', tok: 1,
  bio: P('A Hawthorne Greens orderly that Orme has put under with the watch. Its eyes are open and empty; when the handbell rings it moves, grabbing intruders and dragging them toward the doctor. It is an innocent man.') + P('<strong>One Syringe.</strong> Each orderly carries one loaded syringe. Delete the syringe actions this token does not carry (or roll a d6: 1 Paraldehyde, 2 Morphia, 3 Strychnine, 4 Adrenaline, 5 Pixie Dust, 6 The Doctor\'s Draught). Once it has used it, it only Seizes. A creature that searches a downed orderly (action) finds its syringe if unused.') + P('<strong>Cures (GM).</strong> Paraldehyde: Adrenaline. Strychnine: Paraldehyde, given carefully. Morphia: Adrenaline or smelling salts. Each cure is an action and a DC 15 Wisdom (Medicine) check. Anything that ends the Poisoned condition also works (Lesser Restoration, Protection from Poison, Lay on Hands).'),
  sys: { abilities: ab(18, 12, 14, 8, 6, 8), hp: 38, ac: 16, walk: 30, cr: 16, type: 'humanoid', subtype: 'Human', align: 'Unaligned', ci: ['charmed', 'frightened'], langs: [], langCustom: 'understands Common but does not speak' },
  items: [
    await passive('Sleepwalker', P('When Orme leaves the scene or is defeated, every Tranced Orderly wakes: it lets go, releases any grapple, and cowers or flees. A creature that reduces an orderly to 0 HP can choose to knock it out instead of killing it.'), 'icons/magic/control/sleep-bubble-purple.webp'),
    await attack('Seize', P('<em>Melee Attack Roll:</em> +12, reach 5 ft. <em>Hit:</em> 21 (6d6) Bludgeoning damage, and the target has the Grappled condition (escape DC 16). While grappling, the orderly moves at full speed and drags the target with it.'), 'icons/skills/melee/unarmed-punch-fist.webp', { bonus: 12, reach: 5, n: 6, d: 6, dtype: 'bludgeoning' }),
    await syr('Paraldehyde', 'PARALDEHYDE, SEDATIVE', 'has the Paralyzed condition.', 'icons/consumables/potions/vial-cork-empty.webp'),
    await syr('Morphia', 'MORPHIA', 'has the Incapacitated condition and a Speed of 0.', 'icons/consumables/potions/vial-cork-empty.webp'),
    await syr('Strychnine', 'STRYCHNINE, STIMULANT', 'has the Prone condition, can\'t stand up, and its Speed is halved.', 'icons/consumables/potions/vial-cork-empty.webp'),
    await util('Adrenaline Syringe (Self)', P('The orderly injects itself. Until the end of its next turn, its Speed doubles and each Seize action makes two Seize attacks. The brass label reads ADRENALINE.'), 'icons/magic/life/heart-pink.webp'),
    await util('Pixie Dust Syringe (Self)', P('The orderly injects itself. For 1 minute it has Resistance to all damage and ignores the Grappled and Prone conditions. The brass label reads ANCHOR.'), 'icons/magic/light/explosion-star-glow-purple.webp'),
    await util('The Doctor\'s Draught (Self)', P('The orderly injects itself with a violet fluid. It becomes Large, gains 38 Temporary Hit Points, and Seize deals double damage. Sleepwalker no longer wakes it. The syringe has no label.'), 'icons/magic/unholy/strike-body-explode-disintegrate.webp'),
    await attack('Shield the Doctor', P('<em>Trigger:</em> a creature within 5 ft. of the orderly makes an attack roll against Orme. <em>Response:</em> the orderly makes a Seize attack against that creature.'), 'icons/skills/melee/shield-block-gray-orange.webp', { bonus: 12, reach: 5, n: 6, d: 6, dtype: 'bludgeoning', act: 'reaction' }),
  ] });

// ---------- The Thing Under the Bed ----------
defs.push({ slug: 'thing-under-the-bed', folder: fCre.id, name: 'The Thing Under the Bed', size: 'lg', tok: 2,
  bio: P('The nightmare of the old woman in No. 8, dreamed every night since she was six and made strong enough by Orme\'s machine to leave her head. Long grey arms and a face like a pillowcase pulled tight.') + P('<em>Intent:</em> lock one mind away and feed on it while the others try to reach it.'),
  sys: { abilities: ab(20, 16, 18, 6, 14, 18, ['con', 'cha']), hp: 297, ac: 19, walk: 30, climb: 30, cr: 16, type: 'aberration', subtype: 'Mythos', align: 'Chaotic Evil', dr: ['psychic'], ci: ['charmed', 'frightened'], dv: 120, langs: [] },
  items: [
    await passive('Init 10 (Epic Boss)', EPIC, 'icons/svg/clockwork.svg'),
    await passive('Epic Boss Resistance', EBR, 'icons/magic/control/debuff-chains-ropes-net-white.webp'),
    await passive('Bed-Walker', P('When the Thing moves, it can go under any bed and come out from under any other bed in the scene. The trip costs 5 ft. of movement.'), 'icons/magic/movement/portal-vortex-purple.webp'),
    await passive('The Dreamer in No. 8', P('If the woman in No. 8 wakes (any damage, or a shot of Adrenaline), the Thing loses Bed-Walker and Epic Boss Resistance.'), 'icons/magic/control/sleep-bubble-purple.webp'),
    await attack('Long Arms', P('The Thing moves up to 10 ft. <em>Melee Attack Roll:</em> +13, reach 15 ft. <em>Hit:</em> 35 (10d6) Psychic damage, and the target gains a Befuddling Pox (−2 Intelligence until a long rest). The Pox stacks with itself.'), 'icons/magic/unholy/hand-claw-fog-green.webp', { bonus: 13, reach: 15, n: 10, d: 6, dtype: 'psychic' }),
    await save('Exploit Dread Insight (Recharge 5–6)', P('The Thing moves up to 10 ft. and reaches into a mind for the fear already waiting there. <em>Intelligence Saving Throw:</em> DC 19, one creature it can see within 60 ft. <em>Failure:</em> 27 (5d10) Psychic damage. The target is shut inside its own Dread Insight while the Thing concentrates, up to 1 minute: it has the Restrained condition and can\'t see or hear anything beyond the prison. If it is moved out, makes a melee attack through the prison, or reaches through it, it takes 55 (10d10) Psychic damage and the effect ends. <em>Success:</em> 27 (5d10) Psychic damage only.') + P('This is not a spell, but <em>Dispel Magic</em> ends it as a 6th-level effect.'), 'icons/magic/control/fear-fright-shadow-monster-red.webp', { ability: 'int', dc: 19, parts: [dmgPart(5, 10, 'psychic')], onSave: 'full', u: ['recharge', 5], conc: true }),
    await util('Feed on Terror', P('The Thing moves up to 10 ft. A creature trapped by its Exploit Dread Insight takes 11 (2d10) Psychic damage, and the Thing regains Hit Points equal to the damage dealt.'), 'icons/magic/unholy/orb-hands-pink.webp', { parts: [dmgPart(2, 10, 'psychic')] }),
    await util('Snatch', P('The Thing moves up to 10 ft. One creature within 15 ft. is pulled up to 15 ft. toward the nearest bed, has the Prone condition, and takes 17 (5d6) Bludgeoning damage.'), 'icons/magic/death/hand-withered-gray.webp', { parts: [dmgPart(5, 6, 'bludgeoning')] }),
    await util('Response: Slip Under (Recharge 4–6)', P('The Thing moves up to 10 ft. and may use Bed-Walker as part of that move.'), 'icons/magic/perception/silhouette-stealth-shadow.webp', { act: 'special', u: ['recharge', 4] }),
    await util('Response: The Dark Under Everything (Recharge 5–6)', P('The Thing moves up to 10 ft. Each creature within 10 ft. of any bed takes 17 (5d6) Psychic damage.'), 'icons/magic/unholy/barrier-fire-pink.webp', { act: 'special', u: ['recharge', 5], parts: [dmgPart(5, 6, 'psychic')] }),
  ] });

// ---------- The Dreamer in No. 8 ----------
defs.push({ slug: 'dreamer-in-no-8', folder: fNpc.id, name: 'The Dreamer in No. 8', size: 'med', tok: 1,
  bio: P('An old woman, a patient at Hawthorne Greens, dosed with morphia. She has had the same nightmare every night since she was six; Orme\'s machine has made it strong enough to leave her head. Any damage, or a shot of Adrenaline, wakes her, and the Thing Under the Bed loses its hold.'),
  sys: { abilities: ab(8, 8, 9, 12, 13, 11), hp: 4, ac: 10, walk: 20, cr: 0, type: 'humanoid', subtype: 'Human', align: 'Neutral', langs: ['common'] }, items: [] });

// ---------- create / update ----------
const report = [];
for (const d of defs) {
  const s = d.sys;
  const system = {
    abilities: s.abilities,
    attributes: { ac: { calc: 'flat', flat: s.ac }, hp: { value: s.hp, max: s.hp }, movement: { walk: s.walk, climb: s.climb ?? 0, units: 'ft' },
      senses: { darkvision: s.dv ?? 0, units: 'ft' } },
    details: { cr: s.cr, type: { value: s.type, subtype: s.subtype ?? '' }, alignment: s.align, biography: { value: d.bio } },
    traits: { size: d.size, dr: { value: s.dr ?? [] }, ci: { value: s.ci ?? [] }, languages: { value: s.langs ?? [], custom: s.langCustom ?? '' } },
    skills: Object.fromEntries(Object.entries(s.skills ?? {}).map(([k, v]) => [k, { value: v }])),
  };
  const flags = { [MOD]: { adventure: 'E12', role: d.slug === 'dreamer-in-no-8' ? 'npc' : 'monster', slug: d.slug } };
  let a = game.actors.find(x => x.flags?.[MOD]?.slug === d.slug);
  const proto = { width: d.tok, height: d.tok, disposition: d.slug === 'dreamer-in-no-8' ? 0 : -1, actorLink: false, displayName: 20, displayBars: 20, bar1: { attribute: 'attributes.hp' } };
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
