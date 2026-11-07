// E11 Infinite Dreams: Frag's room (P4, the Byre).
// Builds the Grazer and the three hanging joints, places their tokens, the feed trough and a GM TURN button for P4 on 11.01,
// writes the P4 page of the E11 journal, and drops a GM map note on the room. Safe to re-run: it replaces its own documents.
// ABTL Monster Design row 65: Grazer, PL 15, Durability 1.5, Hit 70%, Dmg 18% -> HP 105, AC 17, Hit +16, Std 24, Alpha 48.
const MOD = "faight-anchester-by-torchlight", CODE = "E11", NAME = "E11 Infinite Dreams", TOP = "Faight: Anchester by Torchlight";
const SCENE = "EA2UdK9qQFbqbj3B", ROOM = "P4", PLAYER = "Frag";
const TOK = `modules/${MOD}/assets/tokenizer/npc-images`;
const nest = async (type, path) => { let p = null; for (const n of path) { let f = game.folders.find(x => x.type === type && x.name === n && (x.folder?.id ?? null) === (p?.id ?? null)); if (!f) f = await Folder.create({ name: n, type, folder: p?.id ?? null }); p = f; } return p; };
const folder = await nest("Actor", [TOP, NAME, "Creatures"]);
const rid = () => foundry.utils.randomID();
const P = t => `<p>${t}</p>`;
const uses = r => r ? { max: "1", spent: 0, recovery: [{ period: "recharge", formula: String(r) }] } : {};
const cons = r => r ? { targets: [{ type: "itemUses", target: "", value: "1" }], scaling: { allowed: false } } : undefined;
const act = type => ({ type, value: 1 });
const ICONS = {
  "Disposition: Ravenous": "icons/creatures/mammals/bull-horns-eyes-glowin-orange.webp",
  "Only a Cow": "icons/creatures/mammals/ox-bull-horned-glowing-orange.webp",
  "Dread of the Dead": "icons/magic/control/fear-fright-monster-grin-red-orange.webp",
  "Multiattack": "icons/creatures/abilities/mouth-teeth-sharp.webp",
  "Gore": "icons/creatures/abilities/fang-tooth-blood-red.webp",
  "Swallow": "icons/creatures/abilities/mouth-teeth-long-red.webp",
  "Blood Grazing": "icons/consumables/meat/steak-raw-red-pink.webp",
  "The Grafted Bolt": "icons/weapons/ammunition/arrow-broadhead-glowing-orange.webp",
  "Food": "icons/consumables/meat/hock-leg-pink-brown.webp"
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

const COW = `${TOK}/grazer_cow.Token.webp`, TRUE = `${TOK}/grazer.Token.webp`;
const grazer = npc({ name: "Grazer", slug: "grazer", size: "lg", type: "aberration", cr: 15, ac: 17, hp: 105, move: { walk: 40 }, w: 2, h: 2,
  abil: { str: 22, dex: 10, con: 20, int: 2, wis: 12, cha: 4 }, senses: { darkvision: 60 },
  bio: P("<strong>Grazer.</strong> <em>Large aberration (Mythos). Frag's horror in the Byre (P4).</em>") +
    P("<em>Description</em>: The Unholy Cow of Paschendale (Episode Four), back in a dream: an ordinary cow in the fog until it turns and shows its maw.") +
    P("<em>Intent</em>: Charge, gore, swallow, and eat.") +
    P("AC 17; HP 105. The token starts as an ordinary cow; press TURN when it first acts.") + P("<em>ABTL Monster Design row 65: Power Level 15, Durability 1.5.</em>"),
  items: [
    feat("Disposition: Ravenous", "The Grazer charges the nearest living creature. Once it is below half its Hit Points, it uses Blood Grazing whenever it can."),
    feat("Only a Cow", "Until it first acts, the Grazer looks like an ordinary cow."),
    feat("Dread of the Dead", "The first time Frag sees the Grazer turn, he makes a DC 17 Wisdom saving throw. <em>Failure:</em> He has the Frightened condition until the end of his next turn."),
    feat("Multiattack", "The Grazer makes two Gore attacks."),
    attack("Gore", "<em>Melee Attack Roll:</em> +16, reach 5 ft. <em>Hit:</em> 24 (4d8 + 6) Piercing damage.", { hit: 16, dice: "4d8", bonus: 6, dtype: "piercing" }),
    save("Swallow (Recharge 5–6)", "<em>Dexterity Saving Throw:</em> DC 17. <em>Failure:</em> 48 (8d10 + 4) Necrotic damage, and the target is swallowed: it has the Blinded and Restrained conditions and Total Cover, and it takes 11 (2d10) Necrotic damage at the start of each of the Grazer's turns. If the swallowed creature deals 20 damage or more to the Grazer in one turn, or the Grazer dies, the creature is spat out and has the Prone condition. <em>Success:</em> Half damage only.", { ability: "dex", dc: 17, dice: "8d10", bonus: 4, dtype: "necrotic", rech: 5 }),
    feat("Blood Grazing", "While within 5 feet of an intact hanging joint, the Grazer eats it and regains 20 Hit Points. The joint is gone.", "bonus"),
    feat("The Grafted Bolt", "A crossbow bolt grown from the Grazer's own bone lies in the feed trough. A creature can reach into the rot and take it as an action. Fired from a crossbow, a hit with it is a Critical Hit, and the Grazer can't use Blood Grazing again. When the room is solved, the creature who fired it gains a Tormenting Curse (Wisdom).")
  ] });
grazer.prototypeToken.texture.src = COW; grazer.prototypeToken.name = "Cow"; grazer.prototypeToken.displayName = 0; grazer.prototypeToken.displayBars = 0;

const OBJ_CI = ["blinded", "charmed", "deafened", "frightened", "paralyzed", "petrified", "poisoned"];
const joint = n => { const a = npc({ name: `Hanging Joint ${n}`, slug: `hanging-joint-${n}`, size: "sm", type: "construct", cr: 0, ac: 10, hp: 10, move: { walk: 0 }, w: 0.9, h: 1.24, disposition: 0,
  img: `${TOK}/hanging_joint_${n}.Token.webp`, abil: { str: 1, dex: 1, con: 10, int: 1, wis: 1, cha: 1 }, di: ["poison", "psychic"], ci: OBJ_CI,
  bio: P("<strong>Hanging Joint.</strong> <em>Object. A joint of meat on an iron hook along the east wall of the Byre (P4).</em>") + P("AC 10; HP 10."),
  items: [feat("Food", "The Grazer heals 20 Hit Points when it eats this joint (Blood Grazing). Shoot it down and the Grazer can't.")] }); a.prototypeToken.displayBars = 20; a.prototypeToken.name = "Hanging Joint"; return a; };

const report = { actors: [] };
const made = {};
for (const m of [grazer, joint(1), joint(2), joint(3)]) {
  if (!(await exists(m.img))) m.img = "icons/svg/mystery-man.svg";
  if (!(await exists(m.prototypeToken.texture.src))) m.prototypeToken.texture.src = m.img;
  for (const it of m.items) if (!(await exists(it.img))) it.img = "icons/svg/aura.svg";
  for (const old of game.actors.filter(a => a.getFlag(MOD, "slug") === m.flags[MOD].slug)) await old.delete();
  const a = await Actor.create(m); made[m.flags[MOD].slug] = a;
  report.actors.push(`${a.name}: HP ${a.system.attributes.hp.max} AC ${a.system.attributes.ac.value} items ${a.items.size} icons-fallback ${a.items.filter(i => i.img === "icons/svg/aura.svg").length}`);
}

// P4 is x 3900-4300, y 4800-5300 (100 px per 5 ft). Doors: north wall at x 4100-4200, east wall at y 4900-5000, west wall at y 5100-5200.
// Hanging joints (tokens) along the east wall south of its door; feed trough (tile) along the west wall north of its door;
// the Grazer (Large = 2 grid squares) grazing at the south end, shown as an ordinary cow until the GM presses TURN.
const scene = game.scenes.get(SCENE);
const mine = ["grazer", "hanging-joint-1", "hanging-joint-2", "hanging-joint-3"];
await scene.deleteEmbeddedDocuments("Token", scene.tokens.filter(t => mine.includes(game.actors.get(t.actorId)?.getFlag(MOD, "slug")) || (t.flags?.[MOD]?.room === ROOM && !game.actors.get(t.actorId))).map(t => t.id));
const tk = async (a, x, y, hidden) => { const t = (await a.getTokenDocument({ x, y, hidden })).toObject(); t.flags = { [MOD]: { room: ROOM } }; return t; };
await scene.createEmbeddedDocuments("Token", [
  await tk(made["hanging-joint-1"], 4240, 5020, false), await tk(made["hanging-joint-2"], 4240, 5095, false), await tk(made["hanging-joint-3"], 4240, 5170, false),
  await tk(made["grazer"], 4050, 5190, false)]);
report.tokens = scene.tokens.filter(t => t.flags?.[MOD]?.room === ROOM).map(t => `${t.name} ${t.x},${t.y} hidden ${t.hidden}`);

// GM-only TURN button (hidden tile) in the void east of the room. Monk's Active Tiles click swaps the Grazer token between cow and true form, found by actor flag.
const TURN = `const MOD = "${MOD}", sc = canvas.scene;
for (const t of sc.tokens.filter(t => game.actors.get(t.actorId)?.getFlag(MOD, "slug") === "grazer")) {
  const cow = t.name === "Cow";
  await t.update({ "texture.src": cow ? "${TRUE}" : "${COW}", name: cow ? "Grazer" : "Cow", displayName: cow ? 20 : 0, displayBars: cow ? 20 : 0 });
}`;
await scene.deleteEmbeddedDocuments("Tile", scene.tiles.filter(t => ["p4-trough", "p4-turn"].includes(t.flags?.[MOD]?.part)).map(t => t.id));
await scene.createEmbeddedDocuments("Tile", [
  { texture: { src: `modules/${MOD}/assets/scenes/abtl-e11-feed-trough.webp` }, x: 3905, y: 4880, width: 62, height: 170, sort: 102, locked: true, flags: { [MOD]: { room: ROOM, part: "p4-trough" } } },
  { texture: { src: `modules/${MOD}/assets/scenes/abtl-e11-switch-turn.webp` }, x: 4350, y: 5180, width: 60, height: 60, hidden: true, locked: true, sort: 104,
    flags: { [MOD]: { room: ROOM, part: "p4-turn" }, "monks-active-tiles": { active: true, record: false, restriction: "all", controlled: "gm", trigger: ["click"], allowpaused: true,
      usealpha: false, pointer: true, vision: false, pertoken: false, minrequired: 0, cooldown: null, chance: 100, fileindex: 0, actions: [{ action: "runcode", data: { code: TURN }, id: rid() }] } } }]);
report.tiles = scene.tiles.filter(t => ["p4-trough", "p4-turn"].includes(t.flags?.[MOD]?.part)).length;

// Journal: E11 Infinite Dreams, page "P4. The Byre".
const jf = await nest("JournalEntry", [TOP, NAME]);
let j = game.journal.find(e => e.name === NAME && e.folder?.id === jf.id);
if (!j) j = await JournalEntry.create({ name: NAME, folder: jf.id, flags: { [MOD]: { adventure: CODE } }, ownership: { default: 0 } });
const link = (a) => `@UUID[Actor.${a.id}]{${a.name}}`;
const html = [
  "<h2>P4. The Byre</h2>",
  "<p><em>Frag. Solo. Night. ~30 min.</em></p>",
  "<h3>What Frag Sees</h3>",
  "<blockquote><p>A cattle stall in fog, straw over mud. Three joints of meat hang from iron hooks along the east wall. A wooden feed trough runs along the west wall, full of black wet rot, and something pale sticks up out of it. At the far end of the stall a black-and-white cow stands with its head down, grazing. It is only a cow.</p></blockquote>",
  "<h3>How the Room Plays</h3>",
  `<p>Frag wakes by the north door. All three doors are locked. The ${link(made["grazer"])} grazes at the south end and looks like an ordinary cow (its token shows a cow and its name reads "Cow"). It acts on its first turn: when it does, it lifts its head and shows its maw. Press the TURN button in the void just east of the room (GM only) to change the token to its true form. The first time Frag sees it turn, he makes a DC 17 Wisdom saving throw or has the Frightened condition until the end of his next turn.</p>`,
  "<p>The Grazer charges the nearest living creature, gores, and swallows. Once it is below half its Hit Points, it uses Blood Grazing: within 5 feet of a hanging joint, it eats it and regains 20 Hit Points. Each joint has AC 10 and 10 HP; shooting them down takes that away.</p>",
  "<p><strong>The grafted bolt (his passion against his fear).</strong> The pale thing in the trough is a crossbow bolt grown from the Grazer's own bone. Taking it means reaching into the rot (an action). Fired from a crossbow, a hit with it is a Critical Hit, and the Grazer can't use Blood Grazing again. When the room is solved, Frag gains a Tormenting Curse (Wisdom).</p>",
  "<p>Don't point out the bolt or the joints. Let him find them.</p>",
  "<p>A player who has finished their own room may come in: unlock the door they reach.</p>",
  "<h3>Resolution</h3>",
  "<p>The room is solved when the Grazer dies. Unlock the three doors. Frag's key and a fragment of the Sanitorium picture spill out of its belly where it falls.</p>"
].join("\n");
for (const p of j.pages.filter(p => p.name.startsWith("P4."))) await p.delete();
const [pg] = await j.createEmbeddedDocuments("JournalEntryPage", [{ name: "P4. The Byre", type: "text", text: { content: html, format: 1 }, sort: 400000 }]);
// GM map note in the room, opening this page.
await scene.deleteEmbeddedDocuments("Note", scene.notes.filter(n => n.flags?.[MOD]?.part === "room-note-P4").map(n => n.id));
await scene.createEmbeddedDocuments("Note", [{ entryId: j.id, pageId: pg.id, x: 3940, y: 5260, text: "P4 Frag", iconSize: 40, fontSize: 24, textAnchor: 1,
  texture: { src: "icons/svg/book.svg", tint: "#c9a2ff" }, global: false, flags: { [MOD]: { room: ROOM, part: "room-note-P4" } } }]);
report.note = scene.notes.filter(n => n.flags?.[MOD]?.part === "room-note-P4").length;
report.journal = `${j.name}: ${j.pages.size} pages`;
report;
