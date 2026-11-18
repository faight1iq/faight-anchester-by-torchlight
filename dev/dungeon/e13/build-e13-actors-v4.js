// Build E13 actors (v4, 2026-11-17: tuned for six level 14-17 characters, ~115 HP, ~AC 17).
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
const dmgPart = (n, d, type, bonus = '') => ({ number: n, denomination: d, bonus: String(bonus), types: [type], custom: { enabled: false }, scaling: { number: 1 } });

async function passive(name, text, img) {
  return { name, type: 'feat', img: await icon(img), system: { type: { value: 'monster', subtype: '' }, description: { value: text } } };
}
async function attack(name, text, img, { bonus, reach, range, n, d, dtype, db, act = 'action', u }) {
  const id = rid();
  const sys = { type: { value: 'natural', baseItem: '' }, description: { value: text }, damage: { base: dmgPart(n, d, dtype, db ?? '') },
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
const e12 = game.folders.find(f => f.type === 'Actor' && f.name === 'E12 Can I Play With Madness');
let top = game.folders.find(f => f.type === 'Actor' && f.name === 'E13 Fear is the Key');
if (!top) top = await Folder.create({ name: 'E13 Fear is the Key', type: 'Actor', folder: e12?.folder?.id ?? null, sorting: 'a' });
const sub = async n => game.folders.find(f => f.type === 'Actor' && f.name === n && f.folder?.id === top.id) ?? await Folder.create({ name: n, type: 'Actor', folder: top.id });
const fCre = await sub('Creatures'), fNpc = await sub('NPCs');
const EPIC = P('<strong>Init 10 (Epic Boss).</strong> Does not roll initiative. On initiative count 10 it rolls for its recharges, moves up to its Speed and uses one action. After each player character\'s turn it may take one Response. It has no reactions or bonus actions.');
const EBR = P('<strong>Epic Boss Resistance.</strong> When it would suffer an effect, it rolls a d20. On an 11 or higher, the effect ends.');
const IMG = 'modules/faight-anchester-by-torchlight/assets/tokenizer/npc-images/';
const defs = [];
const I = {
  grip: 'icons/skills/melee/unarmed-punch-fist.webp', inject: 'icons/tools/laboratory/vial-orange.webp', drag: 'icons/skills/movement/arrow-down-pink.webp', pin: 'icons/magic/control/debuff-chains-ropes-net-white.webp',
  eye: 'icons/magic/perception/eye-tendrils-web-purple.webp', bite: 'icons/creatures/abilities/mouth-teeth-long-red.webp', corner: 'icons/magic/movement/portal-vortex-orange.webp',
  howl: 'icons/creatures/abilities/wolf-howl-moon-purple.webp', brain: 'icons/magic/control/hypnosis-mesmerism-swirl.webp', tendril: 'icons/creatures/tentacles/tentacles-thing-green.webp',
  clock: 'icons/svg/clockwork.svg', watch: 'icons/svg/clockwork.svg', scalpel: 'icons/weapons/daggers/dagger-straight-thin-black.webp', fear: 'icons/magic/death/skull-horned-worn-fire-blue.webp',
  gas: 'icons/magic/air/fog-gas-smoke-swirling-green.webp', doll: 'icons/magic/control/silhouette-hold-change-blue.webp', needle: 'icons/weapons/ammunition/arrow-head-war-flight.webp', shatter: 'icons/magic/defensive/shield-barrier-glowing-triangle-blue.webp',
  gear: 'icons/commodities/tech/cog-brass.webp', bed: 'icons/magic/control/sleep-bubble-purple.webp', feed: 'icons/magic/unholy/orb-glowing-purple.webp', curse: 'icons/magic/unholy/hand-claw-glow-orange.webp',
};
const resp = (name, text, img, u) => util('Response: ' + name, P(text), img, { act: 'special', u });

defs.push({ slug: 'fluke-ridden-orderly', folder: fCre.id, name: 'Fluke-Ridden Orderly', size: 'med', tok: 1, img: 'fluke_ridden_orderly',
  bio: P('A Hawthorne Greens orderly that Dr. Orme injected with an eye fluke larva. The fluke sits in his left eye socket and rides him. The man underneath is still alive.') + P('<strong>GM:</strong> when he drops, an Eye Fluke Larva crawls out of his eye. Medicine DC 17 shows he is alive; cutting the larva out (Medicine DC 19, 1 minute) saves him.') + P('<em>Intent:</em> hold each intruder in a chair and inject them.'),
  sys: { abilities: ab(18, 14, 13, 6, 12, 6), hp: 130, ac: 17, walk: 30, cr: 13, type: 'humanoid', subtype: 'Human', align: 'Neutral Evil', ci: ['charmed', 'frightened'], langs: [] },
  items: [
    await passive('Disposition: Grappler', P('The orderly moves to the nearest creature, grabs it and injects it. It drags grabbed creatures toward the other orderlies.'), I.drag),
    await passive('Ridden', P('When the orderly drops to 0 Hit Points, an Eye Fluke Larva crawls out of its eye into its space. The larva rolls initiative.'), I.eye),
    await attack('Restraining Grip', P('<em>Melee Attack Roll:</em> +9, reach 5 ft. <em>Hit:</em> 24 (5d8 + 2) Bludgeoning damage, and the target has the Grappled condition (escape DC 17).'), I.grip, { bonus: 9, reach: 5, n: 5, d: 8, db: 2, dtype: 'bludgeoning' }),
    await save('Larva Injection (Recharge 5–6)', P('<em>Constitution Saving Throw:</em> DC 17, one creature the orderly is grappling. <em>Failure:</em> 49 (9d10) Poison damage, and the target has the Blinded condition until the end of its next turn and gains a Tormenting Pox. <em>Success:</em> Half damage only.'), I.inject, { ability: 'con', dc: 17, parts: [dmgPart(9, 10, 'poison')], onSave: 'half', u: ['recharge', 5] }),
    await util('Drag', P('<strong>Bonus Action.</strong> The orderly moves up to half its Speed, pulling a creature it is grappling with it.'), I.drag, { act: 'bonus' }),
    await util('Pin', P('<strong>Reaction.</strong> <em>Trigger:</em> A creature the orderly is grappling fails an escape check. <em>Response:</em> The creature has the Prone condition.'), I.pin, { act: 'reaction' }),
  ] });
defs.push({ slug: 'eye-fluke-larva', folder: fCre.id, name: 'Eye Fluke Larva', size: 'tiny', tok: 0.5, img: 'eye_fluke_larva',
  bio: P('A pale eye the size of a walnut with a fringe of white tendrils. It leaps for the nearest open eye.') + P('<em>Intent:</em> get into an eye.'),
  sys: { abilities: ab(2, 18, 12, 3, 12, 3), hp: 19, ac: 16, walk: 20, climb: 20, cr: 5, type: 'aberration', subtype: 'Mythos', align: 'Unaligned', bs: 30, langs: [] },
  items: [
    await passive('Disposition: Seeker', P('The larva goes for the nearest creature whose eyes are open.'), I.eye),
    await passive('Eyeless Prey', P('The larva can\'t use Leap for the Eye against a creature that has the Blinded condition or has its eyes shut.'), I.eye),
    await save('Leap for the Eye', P('<em>Dexterity Saving Throw:</em> DC 16, one creature within 10 feet. <em>Failure:</em> 14 (4d6) Psychic damage, the target has the Blinded condition until the end of its next turn and gains a Tormenting Pox, and the larva dies inside the eye. <em>Success:</em> Half damage only, and the larva has the Prone condition.'), I.eye, { ability: 'dex', dc: 16, parts: [dmgPart(4, 6, 'psychic')], onSave: 'half' }),
  ] });
const corner = P('The hound can move from one corner (a place where two walls meet at an angle) to another corner within 60 feet that it can see, using 10 feet of movement. A corner with magical darkness, a creature, or salt, chalk or plaster pressed into it is sealed, and the hound can\'t use it.');
defs.push({ slug: 'angle-hound-e13', folder: fCre.id, name: 'Angle Hound', size: 'med', tok: 1, img: 'angle_hound',
  bio: P('A lean, hairless dog-shaped thing from beyond time that lives in the angles of the Crooked Knot and steps from corner to corner.') + P('<strong>GM:</strong> sealing corners (magical darkness, a creature standing in it, or salt, chalk or plaster pressed in) takes its ground away.') + P('<em>Intent:</em> bite and step back into the angle.'),
  sys: { abilities: ab(16, 20, 15, 7, 16, 10), hp: 140, ac: 18, walk: 40, cr: 15, type: 'aberration', subtype: 'Mythos', align: 'Neutral Evil', ci: ['incapacitated'], bs: 30, langs: [] },
  items: [
    await passive('Disposition: Skirmisher', P('The hound bites and steps back into a corner. It goes for a creature standing away from its friends.'), I.corner),
    await passive('Pack Hunter', P('The hound has Advantage on attack rolls against a creature if another hound is within 5 feet of that creature.'), I.howl),
    await passive('Corner Walker', corner, I.corner),
    await attack('Bite', P('<em>Melee Attack Roll:</em> +10, reach 5 ft. <em>Hit:</em> 22 (4d8 + 4) Piercing damage.'), I.bite, { bonus: 10, reach: 5, n: 4, d: 8, db: 4, dtype: 'piercing' }),
    await attack('Out of the Corner (Recharge 5–6)', P('The hound uses Corner Walker, moves up to 20 feet and bites. <em>Melee Attack Roll:</em> +10, reach 5 ft. <em>Hit:</em> 44 (8d10) Piercing damage, and the target makes a DC 16 Wisdom saving throw. <em>Failure:</em> the target has the Frightened condition until the end of its next turn.'), I.corner, { bonus: 10, reach: 5, n: 8, d: 10, dtype: 'piercing', u: ['recharge', 5] }),
    await util('Back Into the Angle', P('<strong>Bonus Action.</strong> The hound moves into a corner within 5 feet. Until the start of its next turn, attack rolls against it have Disadvantage.'), I.corner, { act: 'bonus' }),
  ] });
defs.push({ slug: 'elder-angle-hound', folder: fCre.id, name: 'Elder Angle Hound', size: 'lg', tok: 2, img: 'elder_angle_hound',
  bio: P('The leader of the pack in the Crooked Knot, larger and older, its body all angles.') + P('<strong>GM:</strong> when it dies, each Angle Hound makes a DC 15 Wisdom save or leaves through the nearest corner and does not return.') + P('<em>Intent:</em> stay in the corners and send the pack.'),
  sys: { abilities: ab(20, 20, 18, 10, 18, 14), hp: 280, ac: 19, walk: 50, cr: 17, type: 'aberration', subtype: 'Mythos', align: 'Neutral Evil', ci: ['incapacitated'], bs: 60, langs: [] },
  items: [
    await passive('Disposition: Leader', P('The Elder stays in the corners of the Knot and sends the pack.'), I.howl),
    await passive('Corner Walker', corner.replaceAll('The hound', 'The Elder').replaceAll('the hound', 'the Elder'), I.corner),
    await passive('Head of the Pack', P('When the Elder dies, each Angle Hound makes a DC 15 Wisdom saving throw. <em>Failure:</em> it leaves through the nearest corner and does not return.'), I.howl),
    await attack('Maw', P('<em>Melee Attack Roll:</em> +11, reach 10 ft. <em>Hit:</em> 30 (4d12 + 4) Piercing damage.'), I.bite, { bonus: 11, reach: 10, n: 4, d: 12, db: 4, dtype: 'piercing' }),
    await attack('Through All the Angles (Recharge 5–6)', P('The Elder uses Corner Walker, moves up to 30 feet and bites. <em>Melee Attack Roll:</em> +11, reach 10 ft. <em>Hit:</em> 60 (11d10) Piercing damage, and the target has the Prone condition.'), I.corner, { bonus: 11, reach: 10, n: 11, d: 10, dtype: 'piercing', u: ['recharge', 5] }),
    await util('Call the Pack (Recharge 5–6)', P('Each Angle Hound within 120 feet uses Corner Walker and makes one Bite, without using its own actions.'), I.howl, { u: ['recharge', 5] }),
    await util('Into the Angle', P('<strong>Reaction.</strong> <em>Trigger:</em> The Elder takes damage. <em>Response:</em> It uses Corner Walker to a corner within 30 feet.'), I.corner, { act: 'reaction' }),
  ] });
defs.push({ slug: 'gedwild-e13', folder: fCre.id, name: 'Gedwild', size: 'lg', tok: 2, img: 'gedwild_grown',
  bio: P('The last form of the Saed the Clairvoyant sent Dr. Orme. A brain the size of a bear on a nest of grey tendrils and spindly legs. Orme fed it on the brains in his specimen jars.') + P('<strong>GM:</strong> eight jars on the vault shelves (AC 12, HP 5 each). At the start of each Init 10 turn it eats one within 15 ft. and regains 30 HP. Fire of 10 or more on a shelf breaks the two jars on it.') + P('<em>Intent:</em> feed on the minds of whoever casts spells.'),
  sys: { abilities: ab(22, 12, 24, 26, 20, 16, ['int', 'wis']), hp: 800, ac: 20, walk: 40, climb: 30, cr: 19, type: 'aberration', subtype: 'Mythos', align: 'Neutral Evil', ci: ['blinded', 'charmed', 'frightened'], bs: 120, langs: [] },
  items: [
    await passive('Init 10 (Epic Boss)', EPIC, I.clock), await passive('Epic Boss Resistance', EBR, I.pin),
    await passive('Disposition: Feeder', P('Gedwild grabs the creature that last cast a spell and feeds on it.'), I.feed),
    await passive('Feeding', P('At the start of its Init 10 turn, Gedwild eats one specimen jar within 15 feet and regains 30 Hit Points.'), I.feed),
    await save('Thought Pressure (Aura)', P('A creature that starts its turn within 30 feet of Gedwild makes a DC 18 Wisdom saving throw. <em>Failure:</em> it can\'t take Reactions until the start of its next turn.'), I.brain, { ability: 'wis', dc: 18, act: 'special' }),
    await save('Death Curse', P('When Gedwild dies, the creature that dealt the killing damage makes a DC 18 Charisma saving throw. <em>Failure:</em> it gains a Befuddling Nox.'), I.curse, { ability: 'cha', dc: 18, act: 'special' }),
    await attack('Tendril Grasp', P('<em>Melee Attack Roll:</em> +11, reach 15 ft. <em>Hit:</em> 35 (6d10 + 2) Psychic damage, and the target has the Grappled condition (escape DC 18). Gedwild can grapple up to three creatures.'), I.tendril, { bonus: 11, reach: 15, n: 6, d: 10, db: 2, dtype: 'psychic' }),
    await save('Thought Harvest (Recharge 5–6)', P('<em>Intelligence Saving Throw:</em> DC 18, each creature Gedwild is grappling. <em>Failure:</em> 58 (9d10 + 8) Psychic damage, and the target gains a Befuddling Curse. <em>Success:</em> Half damage only.'), I.brain, { ability: 'int', dc: 18, parts: [dmgPart(9, 10, 'psychic', 8)], onSave: 'half', u: ['recharge', 5] }),
    await resp('Movement', 'Gedwild moves up to half its Speed.', I.drag),
    await save('Response: Already Thought It (Recharge 5–6)', P('<em>Trigger:</em> A creature within 60 feet casts a spell. <em>Intelligence Saving Throw:</em> DC 18, the caster. <em>Failure:</em> the spell fails and is wasted, and the caster takes 22 (4d10) Psychic damage.'), I.brain, { ability: 'int', dc: 18, parts: [dmgPart(4, 10, 'psychic')], act: 'special', u: ['recharge', 5] }),
    await resp('Mind Lash (Recharge 4–6)', '<em>Trigger:</em> A creature ends its turn within 15 feet of Gedwild. Gedwild makes one Tendril Grasp against it.', I.tendril, ['recharge', 4]),
  ] });
defs.push({ slug: 'orme-e13', folder: fNpc.id, name: 'Dr. Valentin Orme', size: 'med', tok: 1, img: 'dr_valentin_orme',
  bio: P('Physician and mesmerist of Hawthorne Greens, paid by the Clairvoyant to run the dream spell from his basement. His mesmerism is a gas from his gold watch. He keeps a porcelain doll for each sleeper in his machine and talks to them.') + P('<strong>GM:</strong> while the machine runs he regains 26 HP each Init 10 turn and the GM may spend Doom on the machine. If the fans in the Gas Works run, Mesmeric Gas does nothing. He uses The Watch Stops the first time he is Bloodied.') + P('<em>Intent:</em> put the players to sleep with the others.'),
  sys: { abilities: ab(10, 16, 18, 22, 18, 22, ['wis', 'cha']), hp: 900, ac: 21, walk: 30, cr: 20, type: 'humanoid', subtype: 'Human', align: 'Lawful Evil', ci: ['charmed', 'frightened'], langs: ['common'] },
  items: [
    await passive('Init 10 (Epic Boss)', EPIC, I.clock), await passive('Epic Boss Resistance', EBR, I.pin),
    await passive('Disposition: Puppeteer', P('Orme stays behind the beds and the dolls and turns the frightened against each other.'), I.doll),
    await passive('Machine-Fed', P('While the machine runs, Orme regains 26 Hit Points at the start of his Init 10 turn.'), I.gear),
    await save('Mesmeric Gas (Aura)', P('A creature that starts its turn within 30 feet of Orme makes a DC 18 Wisdom saving throw. <em>Failure:</em> it has the Frightened condition until the start of its next turn. <em>Success:</em> it is immune to this aura for the rest of the fight. This trait does nothing while the fans in the Gas Works run.'), I.gas, { ability: 'wis', dc: 18, act: 'special' }),
    await attack('Scalpel', P('<em>Melee Attack Roll:</em> +11, reach 5 ft. <em>Hit:</em> 40 (6d10 + 7) Slashing damage.'), I.scalpel, { bonus: 11, reach: 5, n: 6, d: 10, db: 7, dtype: 'slashing' }),
    await save('Show Me Your Fear (Recharge 5–6)', P('<em>Wisdom Saving Throw:</em> DC 19, one creature within 60 feet that Orme can see. <em>Failure:</em> 70 (12d10 + 4) Psychic damage, and the target has the Frightened condition for 1 minute (it repeats the save at the end of each of its turns, ending the effect on itself on a success) and gains a Tormenting Curse. <em>Success:</em> Half damage only.'), I.fear, { ability: 'wis', dc: 19, parts: [dmgPart(12, 10, 'psychic', 4)], onSave: 'half', u: ['recharge', 5] }),
    await save('The Watch Stops (1/Day)', P('The gold watch stops and the room stops with it. <em>Wisdom Saving Throw:</em> DC 19, each enemy within 60 feet of Orme. <em>Failure:</em> the creature has the Incapacitated condition until the end of its next turn. <em>Success:</em> its Speed is 0 until the end of its next turn. Orme uses it the first time he is Bloodied.'), I.watch, { ability: 'wis', dc: 19, u: ['day'] }),
    await resp('Movement', 'Orme moves up to half his Speed.', I.drag),
    await util('Response: Tick (Recharge 4–6)', P('<em>Trigger:</em> A creature that is Frightened of Orme moves. <em>Response:</em> the creature takes 22 (4d10) Psychic damage.'), I.watch, { act: 'special', u: ['recharge', 4], parts: [dmgPart(4, 10, 'psychic')] }),
    await resp('Dolls\' Hands (Recharge 5–6)', '<em>Trigger:</em> A creature hits Orme with an attack. Orme swaps places with a Porcelain Doll or a sleeper\'s bed within 30 feet.', I.doll, ['recharge', 5]),
  ] });
defs.push({ slug: 'porcelain-doll', folder: fCre.id, name: 'Porcelain Doll', size: 'tiny', tok: 0.5, img: 'porcelain_doll',
  bio: P('One of the dolls on the ends of the sleepers\' beds. Each has a name card in Orme\'s hand. The machine wakes them (The Dolls Wake, 2 Doom).') + P('<em>Intent:</em> stitch the frightened and the sleeping.'),
  sys: { abilities: ab(4, 18, 10, 3, 10, 3), hp: 20, ac: 17, walk: 20, climb: 20, cr: 6, type: 'construct', subtype: '', align: 'Unaligned', di: ['poison', 'psychic'], ci: ['charmed', 'frightened', 'poisoned'], dv: 60, langs: [] },
  items: [
    await passive('Disposition: Swarm', P('The dolls go for a Frightened or sleeping creature.'), I.doll),
    await save('Shatter', P('When the doll drops to 0 Hit Points it breaks. Each creature within 5 feet makes a DC 15 Dexterity saving throw. <em>Failure:</em> 7 (2d6) Slashing damage.'), I.shatter, { ability: 'dex', dc: 15, parts: [dmgPart(2, 6, 'slashing')], act: 'special' }),
    await attack('Needles', P('<em>Melee Attack Roll:</em> +9, reach 5 ft. <em>Hit:</em> 12 (3d6 + 2) Piercing damage. If the target is asleep, it wakes.'), I.needle, { bonus: 9, reach: 5, n: 3, d: 6, db: 2, dtype: 'piercing' }),
  ] });
defs.push({ slug: 'the-machine', folder: fNpc.id, name: 'The Machine', size: 'huge', tok: 3, img: null,
  bio: P('Orme\'s brass dream machine in the Machine Ward, wired to the seven sleepers "removed below" (twelve beds; five wait empty). While it runs, the Damnation of Episode Eleven returns after every long rest, Orme is Machine-Fed, and the GM may spend Doom on its effects.') + P('<strong>Stopping it:</strong> destroy it (AC 19, HP 250, immune to poison and psychic), or three successful DC 18 checks at the clock face (Arcana, Tinker\'s Tools, or Medicine to free the sleepers safely), each an action. Destroying it while sleepers are wired in: each takes 10 (3d6) psychic damage and survives.'),
  sys: { abilities: ab(10, 1, 20, 1, 1, 1), hp: 250, ac: 19, walk: 0, cr: 0, type: 'construct', subtype: 'Object', align: 'Unaligned', di: ['poison', 'psychic'], ci: ['blinded', 'charmed', 'deafened', 'frightened', 'paralyzed', 'petrified', 'poisoned', 'stunned', 'unconscious'], langs: [] },
  items: [
    await save('Lullaby (1 Doom)', P('Every creature in the ward hears a lullaby. <em>Wisdom Saving Throw:</em> DC 18, each player character. <em>Failure:</em> the creature drowses: it has the Prone and Incapacitated conditions until the end of its next turn, or until it takes damage or another creature uses an action to shake it.'), I.bed, { ability: 'wis', dc: 18, act: 'special' }),
    await util('Gas Vent (1 Doom)', P('A 20-ft-radius sphere around one gas cylinder fills with Orme\'s gas. The area is Heavily Obscured until the end of the next round, and creatures inside have Disadvantage on Mesmeric Gas saves. No effect while the fans in the Gas Works run.'), I.gas, { act: 'special' }),
    await util('The Dolls Wake (2 Doom)', P('Four Porcelain Dolls climb down from the beds. They roll initiative.'), I.doll, { act: 'special' }),
    await util('A Sleeper\'s Nightmare (2 Doom)', P('One sleeper\'s nightmare steps out of its bed: place a Vision (Episode Eleven) beside the bed. It rolls initiative.'), I.bed, { act: 'special' }),
    await util('The Clock Strikes (3 Doom)', P('Orme\'s Show Me Your Fear recharges and he regains 52 Hit Points.'), I.clock, { act: 'special' }),
  ] });

const report = [];
for (const d of defs) {
  const s = d.sys;
  const system = {
    abilities: s.abilities,
    attributes: { ac: { calc: 'flat', flat: s.ac }, hp: { value: s.hp, max: s.hp }, movement: { walk: s.walk, climb: s.climb ?? 0, units: 'ft' }, senses: { darkvision: s.dv ?? 0, blindsight: s.bs ?? 0, units: 'ft' } },
    details: { cr: s.cr, type: { value: s.type, subtype: s.subtype ?? '' }, alignment: s.align, biography: { value: d.bio } },
    traits: { size: d.size, di: { value: s.di ?? [] }, dr: { value: s.dr ?? [] }, ci: { value: s.ci ?? [] }, languages: { value: s.langs ?? [], custom: '' } },
  };
  const flags = { [MOD]: { adventure: 'E13', role: d.folder === fNpc.id ? 'npc' : 'monster', slug: d.slug } };
  const tex = d.img ? IMG + d.img + '.Token.webp' : 'icons/commodities/tech/cog-brass.webp';
  const proto = { width: d.tok, height: d.tok, disposition: -1, actorLink: false, displayName: 20, displayBars: 20, bar1: { attribute: 'attributes.hp' }, texture: { src: tex } };
  const aimg = d.img ? IMG + d.img + '.Avatar.webp' : tex;
  let a = game.actors.find(x => x.flags?.[MOD]?.slug === d.slug);
  if (a) { await a.deleteEmbeddedDocuments('Item', a.items.map(i => i.id)); await a.update({ name: d.name, folder: d.folder, img: aimg, system, flags, prototypeToken: proto }); }
  else a = await Actor.create({ name: d.name, type: 'npc', folder: d.folder, img: aimg, system, flags, prototypeToken: proto });
  await a.createEmbeddedDocuments('Item', d.items);
  const up = a.items.filter(i => i.type === 'weapon').map(w => ({ _id: w.id, [`system.activities.${w.system.activities.contents[0].id}.attack.ability`]: 'none' }));
  if (up.length) await a.updateEmbeddedDocuments('Item', up);
  report.push([d.name, a.id, a.items.size]);
}
report.push(['icon fallbacks', Object.entries(ok).filter(([k, v]) => !v).map(([k]) => k)]);
return report;
