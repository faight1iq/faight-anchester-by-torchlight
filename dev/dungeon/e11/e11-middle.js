// E11 Infinite Dreams: the three middle rooms (M1 the Hold and the Hunt, M2 the Choir, M3 the Pit).
// Builds their actors, places tokens, tiles and GM buttons on 11.01, writes the M1-M3 journal pages and drops a GM map note in each room.
// Safe to re-run: it replaces its own documents. ABTL Monster Design rows 66-70 (The Caller, Wall-Born, The Choir, Choir Shard, Hollow Brute).
// To-hit overrides agreed with John: Caller and Wall-Born +14 (50% vs Elias AC 18 beside Curie and Curie AC 24); Hollow Brute +7 and 23 damage
// (60% vs Vincent AC 16, 20% of the pair's average HP). Choir saves are Intelligence (John).
const MOD = "faight-anchester-by-torchlight", CODE = "E11", NAME = "E11 Infinite Dreams", TOP = "Faight: Anchester by Torchlight";
const SCENE = "EA2UdK9qQFbqbj3B";
let ROOM = "M1", PLAYER = "Elias Harlan and Sister Curie";
const TOK = `modules/${MOD}/assets/tokenizer/npc-images`;
const nest = async (type, path) => { let p = null; for (const n of path) { let f = game.folders.find(x => x.type === type && x.name === n && (x.folder?.id ?? null) === (p?.id ?? null)); if (!f) f = await Folder.create({ name: n, type, folder: p?.id ?? null }); p = f; } return p; };
const folder = await nest("Actor", [TOP, NAME, "Creatures"]);
const rid = () => foundry.utils.randomID();
const P = t => `<p>${t}</p>`;
const uses = r => r ? { max: "1", spent: 0, recovery: [{ period: "recharge", formula: String(r) }] } : {};
const cons = r => r ? { targets: [{ type: "itemUses", target: "", value: "1" }], scaling: { allowed: false } } : undefined;
const act = type => ({ type, value: 1 });
const ICONS = {
  "Disposition: Caller": "icons/magic/sonic/scream-wail-shout-teal.webp",
  "Among Them": "icons/magic/perception/silhouette-stealth-shadow.webp",
  "Rend": "icons/creatures/abilities/fang-tooth-blood-red.webp",
  "Unmaking Cry": "icons/magic/sonic/explosion-shock-wave-teal.webp",
  "Call": "icons/magic/sonic/bell-alarm-red-purple.webp",
  "Disposition: The Heart": "icons/magic/earth/strike-body-stone-crumble.webp",
  "Claw": "icons/magic/unholy/strike-hand-glow-pink.webp",
  "Breaking": "icons/magic/life/heart-cross-strong-flame-green.webp",
  "Disposition: Choir": "icons/magic/sonic/projectile-sound-rings-wave.webp",
  "Sung Ward": "icons/magic/control/silhouette-aura-energy.webp",
  "Hymn": "icons/magic/sonic/projectile-sound-rings-wave.webp",
  "High Note": "icons/magic/sonic/explosion-shock-wave-teal.webp",
  "Volley": "icons/magic/unholy/beam-ringed-impact-purple.webp",
  "Shard Strike": "icons/magic/unholy/beam-ringed-impact-purple.webp",
  "Orbit": "icons/magic/air/wind-tornado-funnel-blue.webp",
  "Regrow": "icons/magic/earth/barrier-stone-explosion-debris.webp",
  "Disposition: Hunters": "icons/creatures/abilities/bear-roar-bite-brown.webp",
  "Sound-Hunters": "icons/magic/sonic/projectile-sound-rings-wave.webp",
  "Slam": "icons/magic/earth/strike-fist-stone-gray.webp",
  "Haul": "icons/magic/control/debuff-chains-ropes-net-white.webp",
  "The Rift": "icons/magic/unholy/beam-ringed-impact-purple.webp"
};
const iconFor = n => ICONS[n.replace(/\s*\(Recharge[^)]*\)\s*$/, "")];
function feat(name, text, activation = "") {
  const it = { name, type: "feat", system: { description: { value: P(`<strong><em>${name}.</em></strong> ${text}`) }, type: { value: "monster" } } };
  if (activation) { const id = rid(); it.system.activities = { [id]: { _id: id, type: "utility", activation: act(activation), name: "" } }; }
  return it;
}
const part = (dice, bonus, type) => { const [n, d] = dice.split("d").map(Number); return { number: n, denomination: d, bonus: String(bonus), types: [type] }; };
function attack(name, text, { hit, dice, bonus = "", dtype, extra = [], reach = 5, rech = null, activation = "action" }) {
  const id = rid();
  return { name, type: "weapon", system: {
    description: { value: P(`<strong><em>${name}.</em></strong> ${text}`) }, type: { value: "natural" }, equipped: true, proficient: 1,
    range: { reach, units: "ft" }, damage: { base: part(dice, bonus, dtype) }, uses: uses(rech),
    activities: { [id]: { _id: id, type: "attack", activation: act(activation),
      attack: { flat: true, bonus: String(hit), type: { value: "melee", classification: "weapon" } },
      damage: { includeBase: true, parts: extra.map(e => part(...e)) }, consumption: cons(rech) } } } };
}
function save(name, text, { ability, dc, dice, bonus = "", dtype, onSave = "half", rech = null, activation = "action" }) {
  const id = rid();
  const a = { _id: id, type: "save", activation: act(activation), save: { ability: [ability], dc: { calculation: "", formula: String(dc) } }, damage: { onSave, parts: [part(dice, bonus, dtype)] }, consumption: cons(rech) };
  return { name, type: "feat", system: { description: { value: P(`<strong><em>${name}.</em></strong> ${text}`) }, type: { value: "monster" }, uses: uses(rech), activities: { [id]: a } } };
}
const HD = { tiny: 4, sm: 6, med: 8, lg: 10 };
function hpf(hp, size, con) { const d = HD[size], m = Math.floor((con - 10) / 2), n = Math.max(1, Math.round(hp / (d / 2 + 0.5 + m))); const b = hp - Math.floor(n * (d / 2 + 0.5)); return `${n}d${d} ${b >= 0 ? "+" : "-"} ${Math.abs(b)}`; }
function npc({ name, slug, size, type, cr, ac, hp, move, abil, senses = {}, di = [], ci = [], bio, items, img, w = 2, h = 2, disposition = -1 }) {
  const ab = {}; for (const [k, v] of Object.entries(abil)) ab[k] = { value: v };
  const s = slug.replaceAll("-", "_");
  return { name, type: "npc", folder: folder.id, img: img ?? `${TOK}/${s}.Avatar.webp`,
    flags: { [MOD]: { adventure: CODE, role: "monster", slug, room: ROOM, player: PLAYER } },
    system: { abilities: ab,
      attributes: { ac: { flat: ac, calc: "flat" }, hp: { value: hp, max: hp, formula: hp > 1 ? hpf(hp, size, abil.con) : "" },
        movement: { units: "ft", ...move }, senses: { units: "ft", ...senses } },
      details: { cr, type: { value: type }, biography: { value: bio } },
      traits: { size, di: { value: di }, ci: { value: ci } } },
    prototypeToken: { name, alpha: 1, texture: { src: `${TOK}/${s}.Token.webp` }, width: w, height: h, lockRotation: true,
      actorLink: false, disposition, displayName: disposition === -1 ? 20 : 0, displayBars: disposition === -1 ? 20 : 0, bar1: { attribute: "attributes.hp" }, sight: { enabled: true, range: 120 } },
    items: items.map(i => ({ ...i, img: iconFor(i.name) || "icons/svg/aura.svg" })) };
}
const exists = async p => p && (await fetch("/" + p, { method: "HEAD" })).ok;

const OBJ_CI = ["blinded", "charmed", "deafened", "frightened", "paralyzed", "petrified", "poisoned"];
const report = { actors: [] };
const made = {};
const scene = game.scenes.get(SCENE);
const build = async (list) => { for (const m of list) {
  if (!(await exists(m.img))) m.img = "icons/svg/mystery-man.svg";
  if (!(await exists(m.prototypeToken.texture.src))) m.prototypeToken.texture.src = m.img;
  for (const it of m.items) if (!(await exists(it.img))) it.img = "icons/svg/aura.svg";
  for (const old of game.actors.filter(a => a.getFlag(MOD, "slug") === m.flags[MOD].slug)) await old.delete();
  const a = await Actor.create(m); made[m.flags[MOD].slug] = a;
  report.actors.push(`${a.name}: HP ${a.system.attributes.hp.max} AC ${a.system.attributes.ac.value} items ${a.items.size} icons-fallback ${a.items.filter(i => i.img === "icons/svg/aura.svg").length}`);
} };
const clearRoom = async (room, slugs, parts) => {
  await scene.deleteEmbeddedDocuments("Token", scene.tokens.filter(t => slugs.includes(game.actors.get(t.actorId)?.getFlag(MOD, "slug")) || (t.flags?.[MOD]?.room === room && !game.actors.get(t.actorId))).map(t => t.id));
  await scene.deleteEmbeddedDocuments("Tile", scene.tiles.filter(t => parts.includes(t.flags?.[MOD]?.part)).map(t => t.id));
};
const tk = async (a, x, y, hidden = false, extra = {}) => { const t = (await a.getTokenDocument({ x, y, hidden })).toObject(); t.flags = { [MOD]: { room: ROOM } }; return Object.assign(t, extra); };
const button = (part, img, x, y, code) => ({ texture: { src: `modules/${MOD}/assets/scenes/${img}` }, x, y, width: 60, height: 60, hidden: true, locked: true, sort: 104,
  flags: { [MOD]: { room: ROOM, part }, "monks-active-tiles": { active: true, record: false, restriction: "all", controlled: "gm", trigger: ["click"], allowpaused: true,
    usealpha: false, pointer: true, vision: false, pertoken: false, minrequired: 0, cooldown: null, chance: 100, fileindex: 0, actions: [{ action: "runcode", data: { code }, id: rid() }] } } });
const jf = await nest("JournalEntry", [TOP, NAME]);
let j = game.journal.find(e => e.name === NAME && e.folder?.id === jf.id);
if (!j) j = await JournalEntry.create({ name: NAME, folder: jf.id, flags: { [MOD]: { adventure: CODE } }, ownership: { default: 0 } });
const link = (a) => `@UUID[Actor.${a.id}]{${a.name}}`;
const page = async (prefix, name, html, sort, nx, ny, label) => {
  for (const p of j.pages.filter(p => p.name.startsWith(prefix))) await p.delete();
  const [pg] = await j.createEmbeddedDocuments("JournalEntryPage", [{ name, type: "text", text: { content: html.join("\n"), format: 1 }, sort }]);
  await scene.deleteEmbeddedDocuments("Note", scene.notes.filter(n => n.flags?.[MOD]?.part === `room-note-${ROOM}`).map(n => n.id));
  await scene.createEmbeddedDocuments("Note", [{ entryId: j.id, pageId: pg.id, x: nx, y: ny, text: label, iconSize: 40, fontSize: 24, textAnchor: 1,
    texture: { src: "icons/svg/book.svg", tint: "#c9a2ff" }, global: false, flags: { [MOD]: { room: ROOM, part: `room-note-${ROOM}` } } }]);
};

// ---------- M1, the Hold and the Hunt (Elias and Sister Curie). Room x 2700-3300, y 1500-2000; doors N x 2800-2900, E y 1600-1700, S x 2800-2900.
ROOM = "M1"; PLAYER = "Elias Harlan and Sister Curie";
const WB = `${TOK}/wall_born.Token.webp`, CALLER = `${TOK}/the_caller.Token.webp`;
const caller = npc({ name: "The Caller", slug: "the-caller", size: "med", type: "aberration", cr: 15, ac: 17, hp: 105, move: { walk: 30 }, w: 1, h: 1,
  abil: { str: 12, dex: 18, con: 14, int: 12, wis: 16, cha: 16 }, senses: { darkvision: 60 },
  bio: P("<strong>The Caller.</strong> <em>Medium aberration (Mythos). M1, the Hold and the Hunt.</em>") + P("<em>Description</em>: A gaunt figure of cracked plaster with a mouth stretched open in a silent cry.") +
    P("<em>Intent</em>: Hide among the Wall-Born and keep calling them until the Heart breaks.") + P("AC 17; HP 105. Its token looks like a Wall-Born until spotted; press SPOT.") + P("<em>ABTL Monster Design row 66: Power Level 15, Durability 1.5, Damage 25%. To-hit +14 (John).</em>"),
  items: [
    feat("Disposition: Caller", "The Caller stays among the Wall-Born and uses Call every turn. It uses Unmaking Cry whenever it is charged and the Heart is in range."),
    feat("Among Them", "While the Caller is within 5 feet of a Wall-Born, it looks like one of them. A creature that uses an action to study the crowd spots it with a DC 17 Wisdom (Perception) check."),
    attack("Rend", "<em>Melee Attack Roll:</em> +14, reach 5 ft. <em>Hit:</em> 33 (6d8 + 6) Slashing damage.", { hit: 14, dice: "6d8", bonus: 6, dtype: "slashing" }),
    save("Unmaking Cry (Recharge 5–6)", "<em>Constitution Saving Throw:</em> DC 17, each creature in a 30-foot Emanation originating from the Caller. <em>Failure:</em> 66 (12d10) Thunder damage. <em>Success:</em> Half damage. If the Heart is in the Emanation, it takes the same damage.", { ability: "con", dc: 17, dice: "12d10", dtype: "thunder", rech: 5 }),
    feat("Call", "Two Wall-Born step out of the walls (reveal two hidden Wall-Born tokens). No more than eight Wall-Born are ever out at once.", "bonus")
  ] });
caller.prototypeToken.texture.src = WB; caller.prototypeToken.name = "Wall-Born"; caller.prototypeToken.displayName = 0;
const wallBorn = npc({ name: "Wall-Born", slug: "wall-born", size: "med", type: "aberration", cr: 3, ac: 16, hp: 18, move: { walk: 30 }, w: 1, h: 1,
  abil: { str: 14, dex: 12, con: 12, int: 3, wis: 8, cha: 3 }, senses: { darkvision: 60 },
  bio: P("<strong>Wall-Born.</strong> <em>Medium aberration (Mythos), minion of the Caller. M1.</em>") + P("<em>Description</em>: A squat faceless plaster thing stepping out of the wall.") + P("<em>Intent</em>: Break the Heart.") + P("<em>ABTL Monster Design row 67: Power Level 15, Durability 0.25. To-hit +14 (John).</em>"),
  items: [
    feat("Disposition: The Heart", "Wall-Born go for the Heart. They attack a creature only when it stands between them and the Heart."),
    attack("Claw", "<em>Melee Attack Roll:</em> +14, reach 5 ft. <em>Hit:</em> 11 (2d6 + 4) Slashing damage.", { hit: 14, dice: "2d6", bonus: 4, dtype: "slashing" })
  ] });
const heart = npc({ name: "The Heart", slug: "stone-heart", size: "med", type: "construct", cr: 0, ac: 20, hp: 80, move: { walk: 0 }, w: 1.4, h: 1.5, disposition: 1,
  img: `${TOK}/stone_heart.Token.webp`, abil: { str: 1, dex: 1, con: 10, int: 1, wis: 1, cha: 1 }, di: ["poison", "psychic"], ci: OBJ_CI,
  bio: P("<strong>The Heart.</strong> <em>Object. A cracked stone heart on a plinth in the middle of M1.</em>") + P("AC 20; HP 80."),
  items: [feat("Breaking", "If the Heart drops to 0 Hit Points, it breaks: Elias and Sister Curie each gain a Tormenting Nox. The room still needs the Caller dead.")] });
heart.prototypeToken.displayBars = 20;
await build([caller, wallBorn, heart]);
await clearRoom("M1", ["the-caller", "wall-born", "stone-heart"], ["m1-spot"]);
const wbSpots = [[2710, 1560], [2710, 1770], [2710, 1900], [3240, 1540], [3240, 1790], [3240, 1900], [3060, 1510], [3060, 1940]];
await scene.createEmbeddedDocuments("Token", [await tk(made["stone-heart"], 2965, 1713), await tk(made["the-caller"], 3180, 1850, true),
  ...await Promise.all(wbSpots.map(([x, y]) => tk(made["wall-born"], x, y, true)))]);
const SPOT = `const MOD = "${MOD}", sc = canvas.scene;
for (const t of sc.tokens.filter(t => game.actors.get(t.actorId)?.getFlag(MOD, "slug") === "the-caller")) {
  const hiding = t.name === "Wall-Born";
  await t.update({ "texture.src": hiding ? "${CALLER}" : "${WB}", name: hiding ? "The Caller" : "Wall-Born", displayName: hiding ? 20 : 0 });
}`;
await scene.createEmbeddedDocuments("Tile", [button("m1-spot", "abtl-e11-switch-spot.webp", 3340, 1420, SPOT)]);
await page("M1.", "M1. The Hold and the Hunt", [
  "<h2>M1. The Hold and the Hunt</h2>",
  "<p><em>Elias \"Grey\" Harlan and Sister Curie, after P1 and P2. Night. ~40 min.</em></p>",
  "<h3>What They See</h3>",
  "<blockquote><p>A bare stone hall, its plaster walls cracked from floor to ceiling. In the middle, on a low round plinth, sits a heart of grey stone the size of a barrel, split with dark red veins. Every crack in the walls is wet and moving.</p></blockquote>",
  "<h3>How the Room Plays</h3>",
  `<p>Start the room when the first of them arrives; the second joins when they come through. Lock the doors behind them. On the first round, ${link(made["the-caller"])} and two ${link(made["wall-born"])} step out of the walls (reveal the Caller and two Wall-Born). The Caller's token looks like a Wall-Born and is named "Wall-Born".</p>`,
  `<p>The Wall-Born go for ${link(made["stone-heart"])} (AC 20, HP 80). The Caller uses Call every turn: reveal two more hidden Wall-Born, up to eight out at once. Curie's job is to hold the Heart: her aura, Shield Master and standing in the way.</p>`,
  "<p>Elias's job is the hunt. A creature that uses an action to study the crowd spots the Caller with a DC 17 Wisdom (Perception) check. When it is spotted, press the SPOT button in the void north-east of the room (GM only) to show its true form. Killing the Caller ends the room: every Wall-Born crumbles.</p>",
  "<p>The Caller and Wall-Born attack at +14. Elias standing beside Curie gets the benefit of her protection; Elias firing from range keeps his distance from the crowd.</p>",
  "<p>If the Heart breaks, each of them gains a Tormenting Nox. The room still needs the Caller dead.</p>",
  "<h3>Resolution</h3>",
  "<p>The room is solved when the Caller dies. The Wall-Born crumble back into the walls. Fragment M1 of the Sanitorium picture lies where the Caller fell. Unlock the doors. The hall to the keyed door into C is open.</p>"
], 700000, 2730, 1540, "M1 Hold and Hunt");
report.M1 = scene.tokens.filter(t => t.flags?.[MOD]?.room === "M1").length;

// ---------- M2, the Choir (Isra and Frag). Room x 3900-4500, y 3300-3800; doors S x 4000-4100 and 4300-4400, E y 3600-3700.
ROOM = "M2"; PLAYER = "Isra Noctis and Frag";
const choir = npc({ name: "The Choir", slug: "the-choir", size: "lg", type: "aberration", cr: 15, ac: 17, hp: 139, move: { walk: 0, fly: 10, hover: true }, w: 2, h: 2,
  abil: { str: 10, dex: 10, con: 16, int: 14, wis: 16, cha: 18 }, senses: { truesight: 60 },
  bio: P("<strong>The Choir.</strong> <em>Large aberration (Mythos), hovering 15 feet up. M2, the Choir.</em>") + P("<em>Description</em>: A floating stone mask of singing mouths, ringed by violet shards.") +
    P("<em>Intent</em>: Sing them down.") + P("AC 17; HP 139. Resistance to all damage while any shard remains.") + P("<em>ABTL Monster Design row 68: Power Level 15, Durability 2, Damage 12%. Saves are Intelligence (John).</em>"),
  items: [
    feat("Disposition: Choir", "The Choir hangs over the middle of the room. It uses High Note whenever it is charged and Hymn otherwise, and the shards Volley every turn."),
    feat("Sung Ward", "While any Choir Shard remains, the Choir has Resistance to all damage."),
    save("Hymn", "<em>Intelligence Saving Throw:</em> DC 17, each creature in a 60-foot Cone. <em>Failure:</em> 16 (3d10) Psychic damage.", { ability: "int", dc: 17, dice: "3d10", dtype: "psychic" }),
    save("High Note (Recharge 5–6)", "<em>Intelligence Saving Throw:</em> DC 17, each creature in a 60-foot Emanation originating from the Choir. <em>Failure:</em> 32 (5d12) Psychic damage, and the target has the Incapacitated condition until the end of its next turn. <em>Success:</em> Half damage only.", { ability: "int", dc: 17, dice: "5d12", dtype: "psychic", rech: 5 }),
    feat("Volley", "Each Choir Shard makes one Shard Strike.", "bonus")
  ] });
choir.prototypeToken.elevation = 15;
const shard = npc({ name: "Choir Shard", slug: "choir-shard", size: "tiny", type: "aberration", cr: 1, ac: 19, hp: 7, move: { walk: 0, fly: 30, hover: true }, w: 0.5, h: 0.5,
  abil: { str: 1, dex: 18, con: 10, int: 1, wis: 10, cha: 1 },
  bio: P("<strong>Choir Shard.</strong> <em>Tiny, orbiting the Choir 20 feet up. M2.</em>") + P("AC 19; HP 7.") + P("<em>ABTL Monster Design row 69 (AC raised to 19 so they are a crossbow job).</em>"),
  items: [
    feat("Orbit", "The shard circles the Choir 20 feet above the floor, out of melee reach."),
    { ...attack("Shard Strike", "<em>Ranged Attack Roll:</em> +16, range 60 ft. <em>Hit:</em> 6 (1d6 + 3) Piercing damage.", { hit: 16, dice: "1d6", bonus: 3, dtype: "piercing" }) }
  ] });
shard.items[1].system.range = { value: 60, long: 60, units: "ft" }; Object.values(shard.items[1].system.activities)[0].attack.type.value = "ranged";
shard.prototypeToken.elevation = 20; shard.prototypeToken.displayBars = 20;
const anchor = npc({ name: "Anchor Stone", slug: "anchor-stone", size: "sm", type: "construct", cr: 0, ac: 15, hp: 10, move: { walk: 0 }, w: 1, h: 1.1, disposition: 0,
  img: `${TOK}/anchor_stone.Token.webp`, abil: { str: 1, dex: 1, con: 10, int: 1, wis: 1, cha: 1 }, di: ["poison", "psychic", "bludgeoning", "piercing", "slashing"], ci: OBJ_CI,
  bio: P("<strong>Anchor Stone.</strong> <em>Object. A spiral-carved standing stone on the floor of M2.</em>") + P("Weapons can't harm it. A spell of 1st level or higher that targets it or includes it shatters it."),
  items: [feat("Regrow", "At the start of the Choir's turn, each standing Anchor Stone regrows one destroyed Choir Shard (reveal or restore one shard token). A spell of 1st level or higher that targets or includes the stone shatters it; weapons can't harm it.")] });
await build([choir, shard, anchor]);
await clearRoom("M2", ["the-choir", "choir-shard", "anchor-stone"], []);
const shardSpots = [0, 60, 120, 180, 240, 300].map(a => [Math.round(4200 + 140 * Math.cos(a * Math.PI / 180) - 12), Math.round(3550 + 140 * Math.sin(a * Math.PI / 180) - 12)]);
await scene.createEmbeddedDocuments("Token", [await tk(made["the-choir"], 4150, 3500),
  ...await Promise.all(shardSpots.map(([x, y]) => tk(made["choir-shard"], x, y))),
  await tk(made["anchor-stone"], 3960, 3380), await tk(made["anchor-stone"], 4420, 3380), await tk(made["anchor-stone"], 4175, 3700)]);
await page("M2.", "M2. The Choir", [
  "<h2>M2. The Choir</h2>",
  "<p><em>Isra Noctis and Frag, after P3 and P4. Night. ~40 min.</em></p>",
  "<h3>What They See</h3>",
  "<blockquote><p>A high round hall with nothing on the walls. A great stone mask hangs in the air over the middle of the room, its face crowded with open mouths, and a ring of violet crystal shards turns slowly around it, high above the floor. Three standing stones carved with glowing spirals stand around the edges. The air hums.</p></blockquote>",
  "<h3>How the Room Plays</h3>",
  `<p>Start the room when the first of them arrives; the second joins when they come through. Lock the doors behind them. ${link(made["the-choir"])} hangs 15 feet up and sings: Hymn (60-foot cone) and, when charged, High Note (60-foot emanation, Incapacitated). Both are Intelligence saves.</p>`,
  `<p><strong>Isra's room.</strong> The room is soaked in magic: every spell Isra casts here counts as one slot level higher. Tell her the first time she casts.</p>`,
  `<p>Six ${link(made["shard"] ?? made["choir-shard"])}s orbit 20 feet up (AC 19, HP 7), out of melee reach, and Volley every turn. While any shard remains, the Choir has Resistance to all damage. That is Frag's job.</p>`,
  `<p>The three ${link(made["anchor-stone"])}s regrow one destroyed shard each at the start of the Choir's turn. Weapons can't harm them. A spell of 1st level or higher that targets or includes a stone shatters it. That is Isra's job.</p>`,
  "<p>Stones down, shards down, and the Choir is open.</p>",
  "<h3>Resolution</h3>",
  "<p>The room is solved when the Choir dies. Its mouths fall silent and the shards drop and shatter. Fragment M2 of the Sanitorium picture lies where the Choir fell. Unlock the doors. The hall to the keyed door into C is open.</p>"
], 800000, 4460, 3330, "M2 Choir");
report.M2 = scene.tokens.filter(t => t.flags?.[MOD]?.room === "M2").length;

// ---------- M3, the Pit (Vincent and Sara). Room x 1600-2100, y 3200-3800; doors N x 1700-1800, W y 3300-3400, W y 3500-3600.
ROOM = "M3"; PLAYER = "Vincent Malfieri and Sara Rose";
const brute = npc({ name: "Hollow Brute", slug: "hollow-brute", size: "med", type: "aberration", cr: 8, ac: 16, hp: 70, move: { walk: 30 }, w: 1, h: 1,
  abil: { str: 14, dex: 10, con: 16, int: 3, wis: 12, cha: 3 }, senses: { blindsight: 60, special: "Blind beyond hearing; see Sound-Hunters" },
  bio: P("<strong>Hollow Brute.</strong> <em>Medium aberration (Mythos). M3, the Pit.</em>") + P("<em>Description</em>: A heavy eyeless brute with huge ears, always listening.") +
    P("<em>Intent</em>: Find the noise and haul it to the rift.") + P("AC 16; HP 70. Strength 14, no save proficiencies.") + P("<em>ABTL Monster Design row 70: Power Level 15, Durability 1, Damage 17%. To-hit +7, 23 per hit (John).</em>"),
  items: [
    feat("Disposition: Hunters", "The brutes go for the last creature that made a noise, and drag what they catch toward the rift."),
    feat("Sound-Hunters", "The brutes have no eyes. A creature that made no noise on its last turn (no attack, no spell with a Verbal component, no shout) has the Invisible condition against them. Telekinetic's shove is silent."),
    attack("Slam", "<em>Melee Attack Roll:</em> +7, reach 5 ft. <em>Hit:</em> 23 (4d8 + 5) Bludgeoning damage.", { hit: 7, dice: "4d8", bonus: 5, dtype: "bludgeoning" }),
    save("Haul (Recharge 5–6)", "<em>Strength Saving Throw:</em> DC 13. <em>Failure:</em> 23 (4d8 + 5) Bludgeoning damage, the target has the Grappled condition (escape DC 13), and the brute moves 10 feet dragging it toward the rift. A player character stops at the rift's edge. <em>Success:</em> Half damage only.", { ability: "str", dc: 13, dice: "4d8", bonus: 5, dtype: "bludgeoning", rech: 5 }),
    feat("The Rift", "A brute that enters the rift is gone.")
  ] });
await build([brute]);
await clearRoom("M3", ["hollow-brute"], ["m3-rift"]);
await scene.createEmbeddedDocuments("Token", [await tk(made["hollow-brute"], 2030, 3260), await tk(made["hollow-brute"], 2030, 3720), await tk(made["hollow-brute"], 1680, 3720)]);
await scene.createEmbeddedDocuments("Tile", [{ texture: { src: `modules/${MOD}/assets/scenes/abtl-e11-rift.webp` }, x: 1800, y: 3456, width: 200, height: 188, sort: 102, locked: true, flags: { [MOD]: { room: ROOM, part: "m3-rift" } } }]);
await page("M3.", "M3. The Pit", [
  "<h2>M3. The Pit</h2>",
  "<p><em>Vincent Malfieri and Sara Rose, after P5 and P6. Night. ~40 min.</em></p>",
  "<h3>What They See</h3>",
  "<blockquote><p>A wide flagstone hall. In the middle of the floor the stones have broken away into a jagged rift, and below it there is nothing: black, a violet mist, and very far down, stars. Three huge grey figures stand at the edges of the room with their heads cocked, listening. They have no eyes.</p></blockquote>",
  "<h3>How the Room Plays</h3>",
  `<p>Start the room when the first of them arrives; the second joins when they come through. Lock the doors behind them. The three ${link(made["hollow-brute"])}s hunt by sound. A creature that made no noise on its last turn has the Invisible condition against them. Telekinetic's shove is silent, so Sara can shove from hiding and stay hidden.</p>`,
  "<p>The rift takes monsters: a brute that enters it is gone. A player character never falls in; a dragged player stops at the edge. Their Strength saves are weak (+2), so Vincent's grapples and throws and Sara's shoves are the fast way through. Let the players find this; don't point it out.</p>",
  "<p>The brutes hit at +7 for 23. Haul is a DC 13 Strength save.</p>",
  "<h3>Resolution</h3>",
  "<p>The room is solved when the last brute is dead or in the rift. Fragment M3 of the Sanitorium picture lies on the lip of the rift. Unlock the doors. The hall to the keyed door into C is open.</p>"
], 900000, 1640, 3240, "M3 Pit");
report.M3 = scene.tokens.filter(t => t.flags?.[MOD]?.room === "M3").length + " tokens, rift " + scene.tiles.filter(t => t.flags?.[MOD]?.part === "m3-rift").length;
report.journal = `${j.name}: ${j.pages.size} pages`;
report;
