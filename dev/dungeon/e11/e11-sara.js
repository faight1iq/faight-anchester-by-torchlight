// E11 Infinite Dreams: Sara Rose's room (P6, the Portrait Parlour).
// Builds the Posing Man, the three posed sitters and the camera, places their tokens and the empty chair in P6 on 11.01,
// writes the P6 page of the E11 journal, and drops a GM map note on the room. Safe to re-run: it replaces its own documents.
// ABTL Monster Design row 64: Posing Man, PL 15, Durability 1.5, Hit 70%, Dmg 18% -> HP 105, AC 17, Hit +16, Std 24, Alpha 48.
const MOD = "faight-anchester-by-torchlight", CODE = "E11", NAME = "E11 Infinite Dreams", TOP = "Faight: Anchester by Torchlight";
const SCENE = "EA2UdK9qQFbqbj3B", ROOM = "P6", PLAYER = "Sara Rose";
const TOK = `modules/${MOD}/assets/tokenizer/npc-images`;
const nest = async (type, path) => { let p = null; for (const n of path) { let f = game.folders.find(x => x.type === type && x.name === n && (x.folder?.id ?? null) === (p?.id ?? null)); if (!f) f = await Folder.create({ name: n, type, folder: p?.id ?? null }); p = f; } return p; };
const folder = await nest("Actor", [TOP, NAME, "Creatures"]);
const rid = () => foundry.utils.randomID();
const P = t => `<p>${t}</p>`;
const uses = r => r ? { max: "1", spent: 0, recovery: [{ period: "recharge", formula: String(r) }] } : {};
const cons = r => r ? { targets: [{ type: "itemUses", target: "", value: "1" }], scaling: { allowed: false } } : undefined;
const act = type => ({ type, value: 1 });
const ICONS = {
  "Disposition: Portraitist": "icons/magic/control/fear-fright-shadow-monster-red.webp",
  "The Plate": "icons/magic/light/explosion-star-glow-silhouette.webp",
  "Multiattack": "icons/tools/smithing/tongs-steel-grey.webp",
  "Posing Clamp": "icons/tools/smithing/tongs-steel-grey.webp",
  "Hold Still": "icons/magic/control/debuff-energy-hold-teal-blue.webp",
  "Pose": "icons/magic/control/silhouette-hold-change-blue.webp",
  "The Old Man's Truth": "icons/magic/death/undead-ghost-scream-teal.webp",
  "The Young Woman's Truth": "icons/magic/death/undead-ghost-scream-teal.webp",
  "The Child's Thanks": "icons/magic/death/undead-ghost-scream-teal.webp",
  "Its Face": "icons/magic/light/explosion-star-glow-silhouette.webp"
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

const poser = npc({ name: "Posing Man", slug: "posing-man", size: "med", type: "aberration", cr: 15, ac: 17, hp: 105, move: { walk: 30 }, w: 1, h: 1,
  abil: { str: 14, dex: 18, con: 14, int: 14, wis: 16, cha: 18 }, senses: { truesight: 30 },
  bio: P("<strong>Posing Man.</strong> <em>Medium aberration (Mythos). Sara Rose's horror in the Portrait Parlour (P6).</em>") +
    P("<em>Description</em>: A tall thin photographer with a glass lens where its face should be and brass clamps for fingers.") +
    P("<em>Intent</em>: Seat Sara in the empty chair and take her portrait.") +
    P("AC 17 (13 once the camera is destroyed); HP 105.") + P("<em>ABTL Monster Design row 64: Power Level 15, Durability 1.5.</em>"),
  items: [
    feat("Disposition: Portraitist", "The Posing Man wants Sara in the empty chair. He uses Hold Still whenever it is charged, then Poses whoever is Paralyzed."),
    feat("The Plate", "While the camera is intact, the Posing Man can use Hold Still. When the camera is destroyed, he loses Hold Still and his AC becomes 13."),
    feat("Multiattack", "The Posing Man makes two Posing Clamp attacks."),
    attack("Posing Clamp", "<em>Melee Attack Roll:</em> +16, reach 5 ft. <em>Hit:</em> 24 (4d8 + 6) Bludgeoning damage.", { hit: 16, dice: "4d8", bonus: 6, dtype: "bludgeoning" }),
    save("Hold Still (Recharge 5–6)", "<em>Wisdom Saving Throw:</em> DC 17, a creature that can see the Posing Man. A creature that moved 10 feet or more on its last turn has Advantage on the save. <em>Failure:</em> 48 (8d10 + 4) Psychic damage, and the target has the Paralyzed condition until the end of its next turn. <em>Success:</em> Half damage only.", { ability: "wis", dc: 17, dice: "8d10", bonus: 4, dtype: "psychic", rech: 5 }),
    feat("Pose", "The Posing Man drags a Paralyzed creature within 5 feet up to 10 feet. If he puts Sara in the empty chair, her portrait is taken as if she had sat.", "bonus")
  ] });

const OBJ_CI = ["blinded", "charmed", "deafened", "frightened", "paralyzed", "petrified", "poisoned"];
const sitter = (name, slug, truth, text, bio) => npc({ name, slug, size: "med", type: "undead", cr: 0, ac: 10, hp: 1, move: { walk: 0 }, w: 2, h: 1, disposition: 0,
  img: `${TOK}/${slug.replaceAll("-", "_")}.Token.webp`, abil: { str: 1, dex: 1, con: 1, int: 10, wis: 10, cha: 10 }, ci: OBJ_CI,
  bio: P(`<strong>${name}.</strong> <em>Posed dead, sitting for a post-mortem portrait in the Portrait Parlour (P6). ${bio}</em>`), items: [feat(truth, text)] });
const oldMan = sitter("The Old Man", "sitter-old-man", "The Old Man's Truth", "A creature that uses an action to listen to him hears: \"It can only pose what holds still.\" From then on, a creature that moved 10 feet or more on its last turn has Advantage on saves against Hold Still.", "Black suit, white whiskers.");
const woman = sitter("The Young Woman", "sitter-young-woman", "The Young Woman's Truth", "A creature that uses an action to listen to her hears: \"The plate in the camera holds its face.\" Smashing the camera (AC 12, HP 15) takes away Hold Still and drops the Posing Man's AC to 13.", "Grey dress, hands folded.");
const child = sitter("The Child", "sitter-child", "The Child's Thanks", "A creature that uses an action to listen to the child hears: \"Thank you for listening.\" When all three sitters have been heard, Sara gains Heroic Inspiration.", "White smock.");
const camera = npc({ name: "The Camera", slug: "portrait-camera", size: "med", type: "construct", cr: 0, ac: 12, hp: 15, move: { walk: 0 }, w: 1.8, h: 2, disposition: 0,
  img: `${TOK}/portrait_camera.Token.webp`, abil: { str: 1, dex: 1, con: 10, int: 1, wis: 1, cha: 1 }, di: ["poison", "psychic"], ci: OBJ_CI,
  bio: P("<strong>The Camera.</strong> <em>Object. A bellows camera on a tripod in the Portrait Parlour (P6), its lens on the chairs.</em>") + P("AC 12; HP 15."),
  items: [feat("Its Face", "The plate inside holds the Posing Man's face. While the camera is intact he can use Hold Still. When it is destroyed, he loses Hold Still and his AC becomes 13.")] });
camera.prototypeToken.displayBars = 20;

const report = { actors: [] };
const made = {};
for (const m of [poser, oldMan, woman, child, camera]) {
  if (!(await exists(m.img))) m.img = "icons/svg/mystery-man.svg";
  if (!(await exists(m.prototypeToken.texture.src))) m.prototypeToken.texture.src = m.img;
  for (const it of m.items) if (!(await exists(it.img))) it.img = "icons/svg/aura.svg";
  for (const old of game.actors.filter(a => a.getFlag(MOD, "slug") === m.flags[MOD].slug)) await old.delete();
  const a = await Actor.create(m); made[m.flags[MOD].slug] = a;
  report.actors.push(`${a.name}: HP ${a.system.attributes.hp.max} AC ${a.system.attributes.ac.value} items ${a.items.size} icons-fallback ${a.items.filter(i => i.img === "icons/svg/aura.svg").length}`);
}

// P6 is x 500-900, y 2400-2800 (100 px per 5 ft). Doors: north wall at x 700-800, east wall at y 2600-2700, south wall at x 700-800.
// Four chairs against the west wall, backs to the wall: three posed sitters (tokens) and, at the south end, the empty chair (tile).
// The camera (token) faces them from the north-east; the Posing Man (Medium = 1 grid square) starts hidden behind it.
const scene = game.scenes.get(SCENE);
const mine = ["posing-man", "sitter-old-man", "sitter-young-woman", "sitter-child", "portrait-camera"];
await scene.deleteEmbeddedDocuments("Token", scene.tokens.filter(t => mine.includes(game.actors.get(t.actorId)?.getFlag(MOD, "slug")) || (t.flags?.[MOD]?.room === ROOM && !game.actors.get(t.actorId))).map(t => t.id));
const tk = async (a, x, y, hidden) => { const t = (await a.getTokenDocument({ x, y, hidden })).toObject(); t.flags = { [MOD]: { room: ROOM } }; return t; };
await scene.createEmbeddedDocuments("Token", [
  await tk(made["sitter-old-man"], 505, 2445, false), await tk(made["sitter-young-woman"], 505, 2525, false), await tk(made["sitter-child"], 505, 2605, false),
  await tk(made["portrait-camera"], 790, 2440, false), await tk(made["posing-man"], 845, 2550, true)]);
report.tokens = scene.tokens.filter(t => t.flags?.[MOD]?.room === ROOM).map(t => `${t.name} ${t.x},${t.y} hidden ${t.hidden}`);

await scene.deleteEmbeddedDocuments("Tile", scene.tiles.filter(t => t.flags?.[MOD]?.part === "p6-chair").map(t => t.id));
await scene.createEmbeddedDocuments("Tile", [{ texture: { src: `modules/${MOD}/assets/scenes/abtl-e11-empty-chair.webp` }, x: 505, y: 2685, width: 50, height: 60, sort: 102, locked: true, flags: { [MOD]: { room: ROOM, part: "p6-chair" } } }]);
report.tiles = scene.tiles.filter(t => t.flags?.[MOD]?.part === "p6-chair").length;

// Journal: E11 Infinite Dreams, page "P6. The Portrait Parlour".
const jf = await nest("JournalEntry", [TOP, NAME]);
let j = game.journal.find(e => e.name === NAME && e.folder?.id === jf.id);
if (!j) j = await JournalEntry.create({ name: NAME, folder: jf.id, flags: { [MOD]: { adventure: CODE } }, ownership: { default: 0 } });
const link = (a) => `@UUID[Actor.${a.id}]{${a.name}}`;
const html = [
  "<h2>P6. The Portrait Parlour</h2>",
  "<p><em>Sara Rose. Solo. Night. ~30 min.</em></p>",
  "<h3>What Sara Sees</h3>",
  "<blockquote><p>Four high-backed chairs stand against the west wall. Three hold the dead, posed upright for a portrait: an old man in a black suit, a young woman in grey, a child in a white smock. Brass stands hold their heads straight, and their eyes are painted open on the lids. The fourth chair, red velvet, is empty, and it is just your size. A wooden bellows camera on a tripod faces the chairs, its black hood hanging. From behind the camera, a voice says: \"Hold still.\"</p></blockquote>",
  "<h3>How the Room Plays</h3>",
  `<p>Sara wakes standing in the middle of the room. All three doors are locked. The ${link(made["posing-man"])} waits behind ${link(made["portrait-camera"])}, hidden, and steps out on her first turn. He wants her in the empty chair. Hold Still paralyzes, which is her fear of being helpless.</p>`,
  `<p><strong>The dead must be heard (her duty).</strong> Any creature can use an action to listen to one of the sitters. Each tells one truth: ${link(made["sitter-old-man"])}: "It can only pose what holds still" (a creature that moved 10 feet or more on its last turn has Advantage on saves against Hold Still). ${link(made["sitter-young-woman"])}: "The plate in the camera holds its face" (smashing the camera, AC 12, HP 15, takes away Hold Still and drops his AC to 13). ${link(made["sitter-child"])}: "Thank you for listening" (once all three have been heard, Sara gains Heroic Inspiration).</p>`,
  "<p><strong>The empty chair (survive by being helpless).</strong> Sara can sit in the empty chair. The Posing Man stops attacking, takes her portrait and leaves, and the room is solved. She gains a Tormenting Curse (Wisdom), and her photograph joins the dead on the wall. If he Poses her into the chair while she is Paralyzed, the same happens.</p>",
  "<p>Don't point out the chair or the sitters. Let the voice and the painted eyes do the work.</p>",
  "<p>A player who has finished their own room may come in: unlock the door they reach.</p>",
  "<h3>Resolution</h3>",
  "<p>The room is solved when the Posing Man dies or Sara sits for the portrait. Unlock the three doors. Sara's key and a fragment of the Sanitorium picture lie on the empty chair.</p>"
].join("\n");
for (const p of j.pages.filter(p => p.name.startsWith("P6."))) await p.delete();
const [pg] = await j.createEmbeddedDocuments("JournalEntryPage", [{ name: "P6. The Portrait Parlour", type: "text", text: { content: html, format: 1 }, sort: 600000 }]);
// GM map note in the room, opening this page.
await scene.deleteEmbeddedDocuments("Note", scene.notes.filter(n => n.flags?.[MOD]?.part === "room-note-P6").map(n => n.id));
await scene.createEmbeddedDocuments("Note", [{ entryId: j.id, pageId: pg.id, x: 860, y: 2760, text: "P6 Sara", iconSize: 40, fontSize: 24, textAnchor: 1,
  texture: { src: "icons/svg/book.svg", tint: "#c9a2ff" }, global: false, flags: { [MOD]: { room: ROOM, part: "room-note-P6" } } }]);
report.note = scene.notes.filter(n => n.flags?.[MOD]?.part === "room-note-P6").length;
report.journal = `${j.name}: ${j.pages.size} pages`;
report;
