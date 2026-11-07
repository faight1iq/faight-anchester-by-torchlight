// E11 Infinite Dreams: Vincent Malfieri's room (P5, the Curio Room).
// Builds the Dream Fluke and the Seeing Glass actors, places their tokens and the three curio case tiles in P5 on 11.01,
// and writes the P5 page of the E11 journal. Safe to re-run: it replaces its own actors, tokens, tiles and page.
// ABTL Monster Design row 62: Dream Fluke, PL 15, Durability 1.5, Hit 70%, Dmg 18% -> HP 105, AC 17, Hit +16, Std 24, Alpha 48.
const MOD = "faight-anchester-by-torchlight", CODE = "E11", NAME = "E11 Infinite Dreams", TOP = "Faight: Anchester by Torchlight";
const SCENE = "EA2UdK9qQFbqbj3B", ROOM = "P5", PLAYER = "Vincent Malfieri";
const TOK = `modules/${MOD}/assets/tokenizer/npc-images`;
const nest = async (type, path) => { let p = null; for (const n of path) { let f = game.folders.find(x => x.type === type && x.name === n && (x.folder?.id ?? null) === (p?.id ?? null)); if (!f) f = await Folder.create({ name: n, type, folder: p?.id ?? null }); p = f; } return p; };
const folder = await nest("Actor", [TOP, NAME, "Creatures"]);
const rid = () => foundry.utils.randomID();
const P = t => `<p>${t}</p>`;
const uses = r => r ? { max: "1", spent: 0, recovery: [{ period: "recharge", formula: String(r) }] } : {};
const cons = r => r ? { targets: [{ type: "itemUses", target: "", value: "1" }], scaling: { allowed: false } } : undefined;
const act = type => ({ type, value: 1 });
const ICONS = {
  "Disposition: Hunger for Eyes": "icons/magic/control/fear-fright-monster-grin-red-orange.webp",
  "Eye-Seeker": "icons/creatures/eyes/humanoid-single-red-brown.webp",
  "Behind the Glass": "icons/magic/perception/silhouette-stealth-shadow.webp",
  "Multiattack": "icons/creatures/tentacles/tentacles-octopus-black-pink.webp",
  "Tendril": "icons/creatures/tentacles/tentacle-eyes-yellow-pink.webp",
  "Into the Socket": "icons/skills/wounds/injury-eyes-blood-red.webp",
  "Price: One Eye": "icons/tools/scribal/magnifying-glass.webp"
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

const fluke = npc({ name: "Dream Fluke", slug: "dream-fluke", size: "lg", type: "aberration", cr: 15, ac: 17, hp: 105, move: { walk: 20, climb: 20 }, w: 2, h: 2,
  abil: { str: 16, dex: 16, con: 14, int: 4, wis: 16, cha: 6 }, senses: { special: "Eyesight 120 ft. (sees only open eyes; blind beyond that)" },
  bio: P("<strong>Dream Fluke.</strong> <em>Large aberration (Mythos). Vincent Malfieri's horror in the Curio Room (P5).</em>") +
    P("<em>Description</em>: The Eye Fluke from Episode Two, grown to the size of a cartwheel: a huge pale eye trailing long pale tendrils.") +
    P("<em>Intent</em>: Push into Vincent's eye socket.") +
    P("AC 17; HP 105. It can't see a creature whose eyes are shut or that is in magical darkness.") + P("<em>ABTL Monster Design row 62: Power Level 15, Durability 1.5.</em>"),
  items: [
    feat("Disposition: Hunger for Eyes", "The fluke goes for Vincent's face, and uses Into the Socket whenever it is charged."),
    feat("Eye-Seeker", "The fluke perceives only open eyes, out to 120 feet. It can't see a creature that has the Blinded condition or has its eyes shut, or a creature inside magical darkness. It has Disadvantage on attack rolls against a creature it can't see, and it can't use Into the Socket on it."),
    feat("Behind the Glass", "The fluke can move through the curio cases. While it is inside a case, it has Half Cover."),
    feat("Multiattack", "The fluke makes two Tendril attacks."),
    attack("Tendril", "<em>Melee Attack Roll:</em> +16, reach 10 ft. <em>Hit:</em> 13 (2d8 + 4) Piercing damage plus 11 (2d10) Psychic damage.", { hit: 16, dice: "2d8", bonus: 4, dtype: "piercing", extra: [["2d10", "", "psychic"]], reach: 10 }),
    save("Into the Socket (Recharge 5–6)", "<em>Dexterity Saving Throw:</em> DC 17, a creature the fluke can see. <em>Failure:</em> 48 (8d10 + 4) Piercing damage, and the target has the Blinded condition and the Grappled condition (escape DC 17). While Grappled this way, it takes 11 (2d10) Psychic damage at the start of each of its turns. <em>Success:</em> Half damage only.", { ability: "dex", dc: 17, dice: "8d10", bonus: 4, dtype: "piercing", rech: 5 })
  ] });

const glass = npc({ name: "The Seeing Glass", slug: "seeing-glass", size: "tiny", type: "construct", cr: 0, ac: 10, hp: 1, move: { walk: 0 }, w: 1.4, h: 1.4, disposition: 0,
  img: `${TOK}/seeing_glass.Token.webp`, abil: { str: 1, dex: 1, con: 1, int: 1, wis: 1, cha: 1 }, di: ["poison", "psychic"],
  ci: ["blinded", "charmed", "deafened", "frightened", "paralyzed", "petrified", "poisoned"],
  bio: P("<strong>The Seeing Glass.</strong> <em>Object. A brass monocle on a velvet cushion, on the pedestal in the middle of the Curio Room (P5). Its tag reads \"Price: one eye.\"</em>"),
  items: [feat("Price: One Eye", "Vincent can take the monocle and put it on as an action. While he wears it, he sees through any darkness, including magical darkness, but the Dream Fluke always knows where he is and has Advantage on attack rolls against him. When the room is solved, he gains a Tormenting Curse (Wisdom).")] });

const report = { actors: [] };
const made = {};
for (const m of [fluke, glass]) {
  if (!(await exists(m.img))) m.img = "icons/svg/mystery-man.svg";
  if (!(await exists(m.prototypeToken.texture.src))) m.prototypeToken.texture.src = m.img;
  for (const it of m.items) if (!(await exists(it.img))) it.img = "icons/svg/aura.svg";
  for (const old of game.actors.filter(a => a.getFlag(MOD, "slug") === m.flags[MOD].slug)) await old.delete();
  const a = await Actor.create(m); made[m.flags[MOD].slug] = a;
  report.actors.push(`${a.name}: HP ${a.system.attributes.hp.max} AC ${a.system.attributes.ac.value} items ${a.items.size} img ${a.img.split("/").pop()} icons-fallback ${a.items.filter(i => i.img === "icons/svg/aura.svg").length}`);
}

// P5 is x 1700-2200, y 4900-5300 (100 px per 5 ft). Doors: west and east walls at y 5000-5100, north wall at x 1800-1900.
// Three curio cases (tiles) against the north, west and east walls, clear of the doors. The Seeing Glass on its pedestal in the middle.
// The fluke starts hidden inside the north case. Token size follows the ABTL rule: Medium = 1 grid square, Large = 2.
const scene = game.scenes.get(SCENE);
await scene.deleteEmbeddedDocuments("Token", scene.tokens.filter(t => ["dream-fluke", "seeing-glass"].includes(game.actors.get(t.actorId)?.getFlag(MOD, "slug")) || (t.flags?.[MOD]?.room === ROOM && !game.actors.get(t.actorId))).map(t => t.id));
const tk = async (a, x, y, hidden) => { const t = (await a.getTokenDocument({ x, y, hidden })).toObject(); t.flags = { [MOD]: { room: ROOM } }; return t; };
await scene.createEmbeddedDocuments("Token", [await tk(made["dream-fluke"], 1990, 4905, true), await tk(made["seeing-glass"], 1915, 5095, false)]);
report.tokens = scene.tokens.filter(t => t.flags?.[MOD]?.room === ROOM).map(t => `${t.name} ${t.x},${t.y} hidden ${t.hidden}`);

const CASE = `modules/${MOD}/assets/scenes/abtl-e11-curio-case.webp`;
const caseTile = (cx, cy, rotation) => ({ texture: { src: CASE }, x: cx - 75, y: cy - 34, width: 150, height: 68, rotation, sort: 102, locked: true, flags: { [MOD]: { room: ROOM, part: "p5-case" } } });
await scene.deleteEmbeddedDocuments("Tile", scene.tiles.filter(t => t.flags?.[MOD]?.part === "p5-case").map(t => t.id));
await scene.createEmbeddedDocuments("Tile", [caseTile(2040, 4939, 0), caseTile(1742, 5180, 90), caseTile(2158, 5180, 270)]);
report.cases = scene.tiles.filter(t => t.flags?.[MOD]?.part === "p5-case").length;

// Journal: E11 Infinite Dreams, page "P5. The Curio Room".
const jf = await nest("JournalEntry", [TOP, NAME]);
let j = game.journal.find(e => e.name === NAME && e.folder?.id === jf.id);
if (!j) j = await JournalEntry.create({ name: NAME, folder: jf.id, flags: { [MOD]: { adventure: CODE } }, ownership: { default: 0 } });
const link = (a) => `@UUID[Actor.${a.id}]{${a.name}}`;
const html = [
  "<h2>P5. The Curio Room</h2>",
  "<p><em>Vincent Malfieri. Solo. Night. ~30 min.</em></p>",
  "<h3>What Vincent Sees</h3>",
  "<blockquote><p>Glass display cases stand against the walls, full of curios on dark velvet: a skull, a squatting idol, an amulet, old keys, a bottle of cloudy liquid, a dried hand. Every piece has a paper price tag. On a black marble pedestal in the middle of the room, a brass monocle rests on a red cushion. Its tag reads \"Price: one eye.\" Behind the glass of the north case, something wet moves.</p></blockquote>",
  "<h3>How the Room Plays</h3>",
  `<p>Vincent wakes beside the pedestal. All three doors are locked. The ${link(made["dream-fluke"])} waits inside the north case, hidden. On Vincent's first turn it slides out through the glass.</p>`,
  "<p>The fluke sees only open eyes. If Vincent shuts his eyes, he has the Blinded condition and the fluke can't see him: it has Disadvantage on attack rolls against him and can't use Into the Socket on him. Inside magical darkness, such as his own <em>Darkness</em> spell, he is hidden from it in the same way, and he is effectively blind too (his darkvision doesn't see into magical darkness).</p>",
  "<p>Let him find the answer. If he fights with his eyes open, the fluke goes for his face. If he grapples it, he can fight blind: his grapple uses a saving throw, not an attack roll, and Grappler gives him Advantage on attack rolls against a creature he is grappling, which cancels the Disadvantage from being Blinded.</p>",
  `<p>${link(made["seeing-glass"])}: Vincent can take the monocle and put it on as an action. While he wears it, he sees through any darkness, but the fluke always knows where he is and has Advantage on attack rolls against him. When the room is solved, he gains a Tormenting Curse (Wisdom).</p>`,
  "<p>The fluke can move through the curio cases and has Half Cover while inside one.</p>",
  "<p>A player who has finished their own room may come in: unlock the door they reach. The fluke can see their open eyes too.</p>",
  "<h3>Resolution</h3>",
  "<p>The room is solved when the fluke dies. Unlock the three doors. Vincent's key and a fragment of the Sanitorium picture lie where the fluke fell. If he wore the monocle, he gains the Tormenting Curse now.</p>"
].join("\n");
for (const p of j.pages.filter(p => p.name.startsWith("P5."))) await p.delete();
const [pg] = await j.createEmbeddedDocuments("JournalEntryPage", [{ name: "P5. The Curio Room", type: "text", text: { content: html, format: 1 }, sort: 500000 }]);
// GM map note in the room, opening this page.
const roomScene = game.scenes.get(SCENE);
await roomScene.deleteEmbeddedDocuments("Note", roomScene.notes.filter(n => n.flags?.[MOD]?.part === "room-note-P5").map(n => n.id));
await roomScene.createEmbeddedDocuments("Note", [{ entryId: j.id, pageId: pg.id, x: 2160, y: 4960, text: "P5 Vincent", iconSize: 40, fontSize: 24, textAnchor: 1,
  texture: { src: "icons/svg/book.svg", tint: "#c9a2ff" }, global: false, flags: { [MOD]: { room: "P5", part: "room-note-P5" } } }]);
report.note = roomScene.notes.filter(n => n.flags?.[MOD]?.part === "room-note-P5").length;
report.journal = `${j.name}: ${j.pages.size} pages`;
report;
