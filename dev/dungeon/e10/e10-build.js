// E10 Moonchild: builds the E10 actors, the journal "E10 Moonchild" and the scene 10.01 The Beastwood (run in the Foundry console as GM).
//   const run = new (Object.getPrototypeOf(async function(){}).constructor)(await (await fetch('/modules/faight-anchester-by-torchlight/dev/dungeon/e10/e10-build.js?'+Date.now())).text());
//   await run();
// Inputs (module folder): dev/dungeon/e10/scene.json and pages.json; map tiles assets/scenes/abtl-e10/abtl-e10-10-01-beastwood-q{ix}{iy}.webp.
// Re-running replaces everything it made before (matched by flags.<module>.adventure = "E10").
const MOD = "faight-anchester-by-torchlight", CODE = "E10", NAME = "E10 Moonchild", SCENE_FOLDER = "EP10: Moonchild", TOP = "Faight: Anchester by Torchlight";
// folders nest under the module's top folder, as E09 does; actors go in Creatures and NPCs subfolders
const nest = async (type, path) => { let p = null; for (const n of path) { let f = game.folders.find(x => x.type === type && x.name === n && (x.folder?.id ?? null) === (p?.id ?? null)); if (!f) f = await Folder.create({ name: n, type, folder: p?.id ?? null }); p = f; } return p; };
const BASE = `modules/${MOD}/dev/dungeon/e10`, ART = `modules/${MOD}/assets/scenes/abtl-e10`, TOK = `modules/${MOD}/assets/tokenizer/npc-images`;
const get = async (f) => (await fetch(`/${BASE}/${f}?${Date.now()}`)).json();
const folder = await nest("Actor", [TOP, NAME, "Creatures"]), npcFolder = await nest("Actor", [TOP, NAME, "NPCs"]);
const ICONS = {
  "Init 10 (Epic Boss)": "icons/svg/clockwork.svg", "Epic Boss Resistance": "icons/magic/control/debuff-chains-ropes-net-white.webp",
  "Disposition: Midwife": "icons/magic/control/fear-fright-shadow-monster-red.webp", "Disposition: Guardian": "icons/magic/control/fear-fright-shadow-monster-red.webp",
  "Hester's Ward": "icons/magic/unholy/hands-circle-light-green.webp", "Death Curse": "icons/magic/death/skull-energy-light-purple.webp",
  "Many Hands": "icons/magic/unholy/hand-grasping-green.webp", "Lullaby": "icons/magic/sonic/scream-wail-shout-teal.webp",
  "The Moon's Door": "icons/creatures/abilities/wolf-howl-moon-white.webp", "Response: Movement": "icons/magic/death/hand-withered-gray.webp",
  "Response: Hush": "icons/magic/control/hypnosis-mesmerism-swirl.webp", "Response: Take Hold": "icons/magic/unholy/hand-claw-fog-green.webp",
  "Ritual Lamp": "icons/sundries/lights/lantern-iron-lit-yellow.webp", "Lamp Pole": "icons/sundries/lights/lantern-steel.webp",
  "Moonlamp Flare": "icons/magic/light/beam-rays-blue-large.webp", "Hold the Ring": "icons/magic/unholy/orb-swirling-teal.webp",
  "Spiteful Curse": "icons/magic/unholy/hand-weapon-glow-black-green.webp", "In Labour": "icons/magic/perception/eye-ringed-green.webp"
};
const iconFor = n => ICONS[n.replace(/\s*\(Recharge[^)]*\)\s*$/, "")];
const rid = () => foundry.utils.randomID();
const P = t => `<p>${t}</p>`;
const uses = r => r ? { max: "1", spent: 0, recovery: [{ period: "recharge", formula: String(r) }] } : {};
const cons = r => r ? { targets: [{ type: "itemUses", target: "", value: "1" }], scaling: { allowed: false } } : undefined;
const act = type => ({ type, value: 1 });
function feat(name, text, activation = "") {
  const it = { name, type: "feat", system: { description: { value: P(`<strong><em>${name}.</em></strong> ${text}`) }, type: { value: "monster" } } };
  if (activation) { const id = rid(); it.system.activities = { [id]: { _id: id, type: "utility", activation: act(activation), name: "" } }; }
  return it;
}
function attack(name, text, { hit, dice, bonus = "", dtype, range = "melee", reach = 5, rng = null, rech = null, activation = "action", wtype = "natural" }) {
  const id = rid(); const [n, d] = dice.split("d").map(Number);
  return { name, type: "weapon", system: {
    description: { value: P(`<strong><em>${name}.</em></strong> ${text}`) }, type: { value: wtype }, equipped: true, proficient: 1,
    range: range === "melee" ? { reach, units: "ft" } : { value: rng[0], long: rng[1], units: "ft" },
    damage: { base: { number: n, denomination: d, bonus: String(bonus), types: [dtype] } }, uses: uses(rech),
    activities: { [id]: { _id: id, type: "attack", activation: act(activation),
      attack: { flat: true, bonus: String(hit), type: { value: range === "melee" ? "melee" : "ranged", classification: "weapon" } },
      damage: { includeBase: true, parts: [] }, consumption: cons(rech) } } } };
}
function save(name, text, { ability, dc, dice, bonus = "", dtype, onSave = "half", rech = null, activation = "action", tmpl = null }) {
  const id = rid();
  const parts = dice ? [{ number: Number(dice.split("d")[0]), denomination: Number(dice.split("d")[1]), bonus: String(bonus), types: [dtype] }] : [];
  const a = { _id: id, type: "save", activation: act(activation), save: { ability: [ability], dc: { calculation: "", formula: String(dc) } }, damage: { onSave, parts }, consumption: cons(rech) };
  if (tmpl) a.target = { template: tmpl, affects: { type: "creature" } };
  return { name, type: "feat", system: { description: { value: P(`<strong><em>${name}.</em></strong> ${text}`) }, type: { value: "monster" }, uses: uses(rech), activities: { [id]: a } } };
}
const SIZE = { tiny: 0.5, sm: 1, med: 1, lg: 2, huge: 3, grg: 4 };
const HD = { tiny: 4, sm: 6, med: 8, lg: 10, huge: 12, grg: 20 };
function hpf(hp, size, con) {
  const d = HD[size], m = Math.floor((con - 10) / 2), n = Math.max(1, Math.round(hp / (d / 2 + 0.5 + m)));
  const b = hp - Math.floor(n * (d / 2 + 0.5)); return `${n}d${d} ${b >= 0 ? "+" : "-"} ${Math.abs(b)}`;
}
function npc({ name, slug, size, type, cr, ac, hp, speed, burrow = 0, climb = 0, fly = 0, swim = 0, abil, dr = [], di = [], ci = [], senses = {}, skills = {}, langs = "", bio, items }) {
  const ab = {}; for (const [k, v] of Object.entries(abil)) ab[k] = { value: v };
  return { name, type: "npc", folder: folder.id, img: `${ART}/${slug}.webp`,
    flags: { [MOD]: { adventure: CODE, role: "monster", slug } },
    system: { abilities: ab,
      attributes: { ac: { flat: ac, calc: "flat" }, hp: { value: hp, max: hp, formula: hpf(hp, size, abil.con) },
        movement: { walk: speed, burrow, climb, fly, swim, hover: fly > 0, units: "ft" }, senses: { units: "ft", ...senses } },
      details: { cr, type: { value: type }, biography: { value: bio } },
      traits: { size, dr: { value: dr }, di: { value: di }, ci: { value: ci }, languages: { custom: langs } }, skills },
    prototypeToken: { name, alpha: 1, texture: { src: `${ART}/${slug}-token.webp` }, width: SIZE[size], height: SIZE[size],
      actorLink: false, disposition: -1, displayName: 20, displayBars: 20, bar1: { attribute: "attributes.hp" }, sight: { enabled: true, range: 60 } },
    items: items.map(i => ({ ...i, img: iconFor(i.name) || i.img })) };
}



// ======================= E10 actors =======================
const M = [];
const statLine = (s) => P(`<em>${s}</em>`);
// ---- Hester Crayle (ABTL Monster Design row 56: PL 15, Durability 6, Epic Boss): HP 417 -> 420, AC 22, hit +16, standard 39, alpha 78 ----
M.push(npc({ name: "Hester Crayle", slug: "hester-crayle", size: "lg", type: "aberration", cr: 15, ac: 22, hp: 420, speed: 30,
  abil: { str: 18, dex: 14, con: 20, int: 14, wis: 18, cha: 22 }, ci: ["charmed", "frightened"], senses: { darkvision: 120 }, langs: "Common",
  skills: { ins: { value: 1, ability: "wis" }, med: { value: 2, ability: "wis" } },
  bio: P("<strong>Hester Crayle.</strong> <em>Midwife of Silverbrook. Leader of the rite.</em>") +
    P("<em>Description</em>: Sixty, small and strong, sleeves rolled to the elbow, a midwife's bag at her knee. When the fight starts her arms split into many long, pale hands.") +
    P("<em>Mannerisms</em>: Talks to Edie as she has talked to every mother for forty years: low, steady, never hurried.") +
    P("<em>Intent</em>: Bring the child out under the open door and write down what comes for it.") +
    P("AC 22; HP 420; Many Hands +16, 6d10 + 6 necrotic; Insight +9, Medicine +14.") +
    statLine("ABTL Monster Design row 56: Power Level 15, Durability 6, Epic Boss."),
  items: [
    feat("Init 10 (Epic Boss)", "Hester does not roll initiative. On initiative count 10 she rolls for her recharges, moves up to her Speed, and may use one action. After each player character's turn she may take one Response. On her own turn she only moves."),
    feat("Epic Boss Resistance", "When Hester would suffer an effect, she rolls a d20. On an 11 or higher, the effect ends."),
    feat("Disposition: Midwife", "Hester stays within 15 feet of Edie and keeps the mound between herself and the nearest enemy. She uses Lullaby whenever it is charged and two or more enemies can hear her, and The Moon's Door when an enemy reaches the top of the mound."),
    feat("Hester's Ward", "While two or more ritual lamps burn, Hester has Resistance to all damage."),
    save("Death Curse", "When Hester dies, the creature that dealt the killing damage makes a DC 19 Charisma saving throw. <em>Failure:</em> The creature gains a Tormenting Pox. The door over the mound closes and the Birth Track stops.", { ability: "cha", dc: 19, onSave: "none", activation: "special" }),
    attack("Many Hands", "<em>Melee Attack Roll:</em> +16, reach 15 ft. <em>Hit:</em> 39 (6d10 + 6) Necrotic damage, and the target has the Grappled condition (escape DC 19). Hester moves up to 10 feet, pulling the target with her.", { hit: 16, dice: "6d10", bonus: 6, dtype: "necrotic", reach: 15 }),
    save("Lullaby (Recharge 5–6)", "Hester moves up to 10 feet and sings. Each creature of her choice within 60 feet that can hear her makes a DC 19 Charisma saving throw. <em>Failure:</em> 78 (12d12) Psychic damage, the Incapacitated condition until the end of its next turn, and a Tormenting Nox. <em>Success:</em> Half damage only.", { ability: "cha", dc: 19, dice: "12d12", dtype: "psychic", rech: 5, tmpl: { type: "radius", size: "60", units: "ft" } }),
    save("The Moon's Door (Recharge 6)", "Hester moves up to 10 feet and lifts her hands to the sky. Each creature of her choice within 60 feet makes a DC 19 Constitution saving throw. <em>Failure:</em> 39 (6d10 + 6) Necrotic damage, and the target is pushed 15 feet straight away from the mound. <em>Success:</em> Half damage only. The Birth Track advances by 1.", { ability: "con", dc: 19, dice: "6d10", bonus: 6, dtype: "necrotic", rech: 6, tmpl: { type: "radius", size: "60", units: "ft" } }),
    feat("Response: Movement", "Hester moves up to half her Speed.", "special"),
    save("Response: Hush (Recharge 4–6)", "Hester moves up to 10 feet and hushes a creature she can see. The creature makes a DC 19 Wisdom saving throw. <em>Failure:</em> The creature has Disadvantage on its next d20 Test.", { ability: "wis", dc: 19, onSave: "none", rech: 4, activation: "special" }),
    feat("Response: Take Hold (Recharge 5–6)", "Hester moves up to 10 feet and makes one Many Hands attack.", "special")
  ] }));
// ---- Lamp Keeper (row 57: PL 9, Durability 1.5): HP 60, AC 15, hit +11, standard 17, alpha 34 ----
M.push(npc({ name: "Lamp Keeper", slug: "lamp-keeper", size: "med", type: "humanoid", cr: 9, ac: 15, hp: 60, speed: 30,
  abil: { str: 16, dex: 12, con: 12, int: 10, wis: 14, cha: 18 }, senses: { }, langs: "Common",
  skills: { prc: { value: 1, ability: "wis" }, rel: { value: 1, ability: "int" } },
  bio: P("<strong>The Lamp Keepers.</strong> <em>Five villagers of Silverbrook, sworn to the cult.</em>") +
    P("<em>Description</em>: Amos Wick, the chandler; Nan Tallow, his sister; Gideon Hookes, the reeve; Prue Mutter, the sexton's wife; Will Shank, the carter's boy. Each holds a lamp on a pole.") +
    P("<em>Mannerisms</em>: Chant with Hester and keep their eyes on the mound.") +
    P("<em>Intent</em>: Keep the lamps burning. None of them leaves the ring.") +
    P("AC 15; HP 60; Lamp Pole +11, 3d8 + 4 bludgeoning; Perception +6, Religion +4.") +
    statLine("ABTL Monster Design row 57: Power Level 9, Durability 1.5."),
  items: [
    feat("Disposition: Guardian", "The Keeper holds its place in the ring around the mound and never leaves it. It uses Moonlamp Flare whenever it is charged and two or more enemies are in the cone."),
    feat("Ritual Lamp", "The Keeper holds a ritual lamp on a pole. The lamp goes out when the Keeper dies, or when a creature within 5 feet of the Keeper uses an action to put it out. It cannot be lit again tonight."),
    save("Death Curse", "When the Keeper dies, its lamp goes out, and the creature that dealt the killing damage makes a DC 16 Charisma saving throw. <em>Failure:</em> The creature gains a Tormenting Nox.", { ability: "cha", dc: 16, onSave: "none", activation: "special" }),
    attack("Lamp Pole", "<em>Melee Attack Roll:</em> +11, reach 10 ft. <em>Hit:</em> 17 (3d8 + 4) Bludgeoning damage, and the target is pushed 10 feet away from the Keeper.", { hit: 11, dice: "3d8", bonus: 4, dtype: "bludgeoning", reach: 10, wtype: "simpleM" }),
    save("Moonlamp Flare (Recharge 5–6)", "Each creature in a 45-foot Cone makes a DC 16 Charisma saving throw. <em>Failure:</em> 34 (6d8 + 7) Psychic damage, and the target has the Blinded condition until the end of its next turn. <em>Success:</em> Half damage only.", { ability: "cha", dc: 16, dice: "6d8", bonus: 7, dtype: "psychic", rech: 5, tmpl: { type: "cone", size: "45", units: "ft" } }),
    feat("Hold the Ring", "<em>Bonus Action.</em> The Keeper moves up to 10 feet without provoking Opportunity Attacks and ends the move within 10 feet of its place in the ring.", "bonus"),
    save("Spiteful Curse", "<em>Reaction.</em> When a creature the Keeper can see within 60 feet makes an attack roll against it, the attacker makes a DC 16 Constitution saving throw. <em>Failure:</em> The attacker gains a Rotting Pox.", { ability: "con", dc: 16, onSave: "none", activation: "reaction" })
  ] }));
// ---- Edie Lamb (story NPC, not a combatant) ----
M.push(npc({ name: "Edie Lamb", slug: "edie-lamb", size: "med", type: "humanoid", cr: 0, ac: 10, hp: 9, speed: 0,
  abil: { str: 10, dex: 10, con: 12, int: 10, wis: 12, cha: 11 }, langs: "Common",
  bio: P("<strong>Edie Lamb.</strong> <em>Dairymaid of Hollow Farm, Silverbrook. Nineteen.</em>") +
    P("<em>Description</em>: Dark hair stuck to her face, a borrowed nightgown, a wedding ring on a string round her neck.") +
    P("<em>Mannerisms</em>: Grips the nearest hand and will not let go. Asks for her husband, Tom, a gunner on the harbour batteries.") +
    P("<em>Intent</em>: Live, and keep her child. Trusted Hester until tonight.") +
    P("AC 10; HP 9. In labour: cannot move, run or fight. At 0 HP she makes death saving throws."),
  items: [feat("In Labour", "Edie cannot move, run or fight. Area spells and curses that cover the mound cover her.")] }));

// story NPC tweaks: Edie is friendly and linked; Hester linked
for (const m of M) {
  if (m.flags[MOD].slug === "edie-lamb") { Object.assign(m.prototypeToken, { disposition: 1, actorLink: true }); m.folder = npcFolder.id; }
  // 2.5 ft squares: a Medium creature is 2 squares across
  m.prototypeToken.width *= 2; m.prototypeToken.height *= 2;
  if (m.flags[MOD].slug === "hester-crayle") Object.assign(m.prototypeToken, { actorLink: true });
}
// portraits: use the tokenizer files if they exist, otherwise a placeholder
const exists = async p => p && (await fetch("/" + p, { method: "HEAD" })).ok;
for (const m of M) {
  const s = m.flags[MOD].slug.replaceAll("-", "_"), av = `${TOK}/${s}.Avatar.webp`, tk = `${TOK}/${s}.Token.webp`;
  m.img = (await exists(av)) ? av : "icons/svg/mystery-man.svg";
  m.prototypeToken.texture.src = (await exists(tk)) ? tk : m.img;
  for (const it of m.items) if (!(await exists(it.img))) it.img = "icons/magic/unholy/hand-claw-glow-orange.webp";
  for (const it of m.items) if (!(await exists(it.img))) it.img = "icons/svg/aura.svg";
}
const report = { actors: [] };
for (const data of M) {
  for (const old of game.actors.filter(a => a.getFlag(MOD, "slug") === data.flags[MOD].slug && a.getFlag(MOD, "adventure") === CODE)) await old.delete();
  const a = await Actor.create(data);
  report.actors.push(`${a.name}: HP ${a.system.attributes.hp.max} AC ${a.system.attributes.ac.value} items ${a.items.size}`);
}
// returning cultists: copy the E09 world actors into the E10 folder
for (const [src, slug, names] of [["Awakened Cultist", "awakened-cultist", ["Jem Pike", "Abel Pike"]], ["Corrupted Cultist", "corrupted-cultist", ["Carter"]]]) {
  const base = game.actors.find(a => a.name === src && !a.getFlag(MOD, "adventure"));
  if (!base) { report.actors.push(`MISSING world actor ${src}`); continue; }
  for (const old of game.actors.filter(a => a.getFlag(MOD, "slug") === slug && a.getFlag(MOD, "adventure") === CODE)) await old.delete();
  const o = base.toObject(); delete o._id; o.folder = folder.id; o.prototypeToken = { ...(o.prototypeToken ?? {}), width: 2, height: 2 };
  foundry.utils.setProperty(o, `flags.${MOD}`, { adventure: CODE, role: "monster", slug });
  const a = await Actor.create(o); report.actors.push(`${a.name} (copy of ${src})`);
}

// ======================= E10 journal =======================
const jf = await nest("JournalEntry", [TOP, NAME]);
for (const j of game.journal.filter(j => j.getFlag(MOD, "adventure") === CODE)) await j.delete();
const PAGES = await get("pages.json");
const actorsBy = Object.fromEntries(game.actors.filter(a => a.getFlag(MOD, "adventure") === CODE).map(a => [a.name, a]));
const linkify = (h) => { for (const [n, a] of Object.entries(actorsBy)) h = h.replaceAll(`<strong>${n}</strong>`, `@UUID[Actor.${a.id}]{${n}}`); return h; };
const journal = await JournalEntry.create({ name: NAME, folder: jf.id, flags: { [MOD]: { adventure: CODE } },
  pages: PAGES.map((p, i) => ({ name: p.name, type: "text", sort: (i + 1) * 100, text: { content: linkify(p.html) }, flags: { [MOD]: { key: p.key ?? null } } })) });
report.journal = `${journal.id} (${journal.pages.size} pages)`;

// ======================= 10.01 The Beastwood =======================
const sf = await nest("Scene", [TOP, SCENE_FOLDER]);
for (const s of game.scenes.filter(s => s.getFlag(MOD, "adventure") === CODE && s.getFlag(MOD, "role") === "beastwood")) await s.delete();
const S = await get("scene.json");
const scene = await Scene.create({ name: "10.01 The Beastwood", folder: sf.id, width: S.width, height: S.height, padding: 0, backgroundColor: "#1e3231",
  grid: { type: 0, size: S.grid.size, distance: S.grid.distance, units: S.grid.units }, tokenVision: true, fog: { exploration: true },
  environment: { darknessLevel: 0.8, globalLight: { enabled: false } }, navigation: true,
  initial: { x: S.entrance.landing[0], y: S.entrance.landing[1], scale: 0.35 },
  flags: { [MOD]: { adventure: CODE, role: "beastwood" } } });
await scene.createEmbeddedDocuments("Tile", S.tiles.map(t => ({ texture: { src: `${ART}/abtl-e10-10-01-beastwood-v2-${t.img}.webp` }, x: t.x, y: t.y, width: t.w, height: t.h, locked: true, elevation: 0, sort: 0 })));
// walls: the wood's outer edge blocks everything; the glade edges block sight and light only (tree stands are passable at half speed)
const W = CONST.WALL_SENSE_TYPES, MV = CONST.WALL_MOVEMENT_TYPES;
await scene.createEmbeddedDocuments("Wall", S.walls.map(w => w.kind === "edge"
  ? { c: w.c, move: MV.NORMAL, sight: W.NORMAL, light: W.NORMAL, sound: W.NORMAL }
  : { c: w.c, move: MV.NORMAL, sight: W.LIMITED, light: W.LIMITED, sound: W.LIMITED }));
await scene.createEmbeddedDocuments("AmbientLight", S.lights.map(l => ({ x: l.x, y: l.y, hidden: !!l.hidden,
  config: { ...(l.role.startsWith("lamp-") ? { dim: 15, bright: 2.5, color: "#8fb4ff", alpha: 0.25, luminosity: 0.3, attenuation: 0.7 } : l.role === "lantern" ? { dim: 20, bright: 5, color: "#ffb85c", alpha: 0.35 } : { dim: l.dim, bright: l.bright, color: l.color, alpha: l.alpha }), negative: !!l.negative, animation: l.anim ? { type: l.anim, speed: 2, intensity: 3 } : { type: null } },
  flags: { [MOD]: { role: l.role } } })));
const pageFor = Object.fromEntries(journal.pages.contents.filter(p => p.getFlag(MOD, "key")).map(p => [p.getFlag(MOD, "key"), p]));
await scene.createEmbeddedDocuments("Note", S.notes.map(n => ({ x: n.x, y: n.y, entryId: journal.id, pageId: pageFor[n.k]?.id, text: `${n.k}. ${n.name}`,
  iconSize: 60, fontSize: 36, texture: { src: "icons/svg/book.svg" }, global: false })));
const bySlug = Object.fromEntries(game.actors.filter(a => a.getFlag(MOD, "adventure") === CODE).map(a => [a.getFlag(MOD, "slug"), a]));
const toks = [];
for (const t of S.tokens) {
  const a = bySlug[t.slug]; if (!a) continue;
  const half = a.prototypeToken.width * 50 + (t.slug === "hester-crayle" ? 120 : t.slug === "edie-lamb" ? -110 : 0);
  const td = await a.getTokenDocument({ x: t.x - a.prototypeToken.width * 50, y: t.y - half, hidden: false, ...(t.name ? { name: t.name } : {}), flags: { [MOD]: { place: t.place } } });
  toks.push(td.toObject());
}
await scene.createEmbeddedDocuments("Token", toks);
await scene.update({ thumb: (await scene.createThumbnail({ width: 300, height: 400 })).thumb }).catch(() => {});
Object.assign(report, { scene: scene.id, walls: scene.walls.size, lights: scene.lights.size, notes: scene.notes.size, tokens: scene.tokens.size, tiles: scene.tiles.size });
return report;
