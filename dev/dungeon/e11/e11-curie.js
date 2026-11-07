// E11 Infinite Dreams: Sister Colette Claire Curie's room (P2, the Dissection Room).
// Builds the Stitched Subject and the Patient actors, places their tokens, the morgue drawers and the instrument tray in P2 on 11.01,
// writes the P2 page of the E11 journal, and drops a GM map note on the room. Safe to re-run: it replaces its own documents.
// ABTL Monster Design row 63: Stitched Subject, PL 15, Durability 1.5, Hit 70%, Dmg 18% -> HP 105, AC 17, Hit +16, Std 24, Alpha 48.
const MOD = "faight-anchester-by-torchlight", CODE = "E11", NAME = "E11 Infinite Dreams", TOP = "Faight: Anchester by Torchlight";
const SCENE = "EA2UdK9qQFbqbj3B", ROOM = "P2", PLAYER = "Sister Colette Claire Curie";
const TOK = `modules/${MOD}/assets/tokenizer/npc-images`;
const nest = async (type, path) => { let p = null; for (const n of path) { let f = game.folders.find(x => x.type === type && x.name === n && (x.folder?.id ?? null) === (p?.id ?? null)); if (!f) f = await Folder.create({ name: n, type, folder: p?.id ?? null }); p = f; } return p; };
const folder = await nest("Actor", [TOP, NAME, "Creatures"]);
const rid = () => foundry.utils.randomID();
const P = t => `<p>${t}</p>`;
const uses = r => r ? { max: "1", spent: 0, recovery: [{ period: "recharge", formula: String(r) }] } : {};
const cons = r => r ? { targets: [{ type: "itemUses", target: "", value: "1" }], scaling: { allowed: false } } : undefined;
const act = type => ({ type, value: 1 });
const ICONS = {
  "Disposition: Collector": "icons/magic/death/hand-undead-skeleton-fire-green.webp",
  "Out of the Drawers": "icons/magic/death/undead-zombie-grave-green.webp",
  "Split Stitches": "icons/skills/wounds/injury-stitched-flesh-red.webp",
  "Multiattack": "icons/magic/unholy/hand-claw-glow-orange.webp",
  "Scalpel Hand": "icons/skills/melee/blade-tip-chipped-blood-red.webp",
  "Harvest": "icons/skills/wounds/blood-drip-droplet-red.webp",
  "Strapped Down": "icons/magic/life/heart-cross-strong-flame-green.webp",
  "Last Victim": "icons/magic/death/skull-horned-worn-fire-blue.webp"
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

const stitched = npc({ name: "Stitched Subject", slug: "stitched-subject", size: "lg", type: "undead", cr: 15, ac: 17, hp: 105, move: { walk: 30 }, w: 2, h: 2,
  abil: { str: 20, dex: 10, con: 18, int: 3, wis: 8, cha: 5 }, senses: { darkvision: 60 },
  bio: P("<strong>Stitched Subject.</strong> <em>Large undead (Mythos). Sister Curie's horror in the Dissection Room (P2).</em>") +
    P("<em>Description</em>: A hulking figure sewn together from the cadavers she collected for her research, with scalpel blades for fingers.") +
    P("<em>Intent</em>: Take the living patient for the collection.") +
    P("AC 17; HP 105. Radiant damage splits its stitches.") + P("<em>ABTL Monster Design row 63: Power Level 15, Durability 1.5.</em>"),
  items: [
    feat("Disposition: Collector", "The Stitched goes for the patient on the operating table and attacks whoever stands in its way. It uses Harvest whenever it is charged."),
    feat("Out of the Drawers", "The Stitched starts inside the morgue drawers. It climbs out at the end of round 1 and acts from round 2."),
    feat("Split Stitches", "When the Stitched takes Radiant damage, it can't use Harvest until the end of its next turn."),
    feat("Multiattack", "The Stitched makes two Scalpel Hand attacks."),
    attack("Scalpel Hand", "<em>Melee Attack Roll:</em> +16, reach 10 ft. <em>Hit:</em> 24 (4d8 + 6) Slashing damage.", { hit: 16, dice: "4d8", bonus: 6, dtype: "slashing", reach: 10 }),
    save("Harvest (Recharge 5–6)", "<em>Constitution Saving Throw:</em> DC 17. <em>Failure:</em> 48 (8d10 + 4) Necrotic damage, and the target's Hit Point maximum decreases by the same amount until it wakes. <em>Success:</em> Half damage only.", { ability: "con", dc: 17, dice: "8d10", bonus: 4, dtype: "necrotic", rech: 5 }),
    feat("Last Victim", "If the patient dies to the Stitched, the Stitched gains 20 Temporary Hit Points.")
  ] });

const patient = npc({ name: "The Patient", slug: "the-patient", size: "med", type: "humanoid", cr: 0, ac: 10, hp: 40, move: { walk: 30 }, w: 3, h: 1.34, disposition: 0,
  img: `${TOK}/the_patient.Token.webp`, abil: { str: 8, dex: 8, con: 10, int: 10, wis: 6, cha: 10 },
  bio: P("<strong>The Patient.</strong> <em>A gaunt stranger strapped to the operating table in the Dissection Room (P2), shaking with the madness. The token is the table with him on it.</em>") +
    P("AC 10; HP 40. Restrained until someone frees him."),
  items: [feat("Strapped Down", "The patient has the Restrained condition until a creature uses an action to undo the straps. He mutters about the cure and begs not to be cut.")] });
patient.prototypeToken.displayBars = 20;

const report = { actors: [] };
const made = {};
for (const m of [stitched, patient]) {
  if (!(await exists(m.img))) m.img = "icons/svg/mystery-man.svg";
  if (!(await exists(m.prototypeToken.texture.src))) m.prototypeToken.texture.src = m.img;
  for (const it of m.items) if (!(await exists(it.img))) it.img = "icons/svg/aura.svg";
  for (const old of game.actors.filter(a => a.getFlag(MOD, "slug") === m.flags[MOD].slug)) await old.delete();
  const a = await Actor.create(m); made[m.flags[MOD].slug] = a;
  report.actors.push(`${a.name}: HP ${a.system.attributes.hp.max} AC ${a.system.attributes.ac.value} items ${a.items.size} img ${a.img.split("/").pop()} icons-fallback ${a.items.filter(i => i.img === "icons/svg/aura.svg").length}`);
}

// P2 is x 4000-4400, y 900-1300 (100 px per 5 ft). Doors: north wall at x 4100-4200, east wall at y 1000-1100, west wall at y 1100-1200.
// Morgue drawers (tile) against the north wall east of the door; the Stitched starts hidden inside them (Large = 2 grid squares).
// Operating table with the patient (token) in the middle of the room, head to the west; instrument tray (tile) beside its foot.
const scene = game.scenes.get(SCENE);
await scene.deleteEmbeddedDocuments("Token", scene.tokens.filter(t => ["stitched-subject", "the-patient"].includes(game.actors.get(t.actorId)?.getFlag(MOD, "slug")) || (t.flags?.[MOD]?.room === ROOM && !game.actors.get(t.actorId))).map(t => t.id));
const tk = async (a, x, y, hidden) => { const t = (await a.getTokenDocument({ x, y, hidden })).toObject(); t.flags = { [MOD]: { room: ROOM } }; return t; };
await scene.createEmbeddedDocuments("Token", [await tk(made["stitched-subject"], 4250, 905, true), await tk(made["the-patient"], 4125, 1147, false)]);
report.tokens = scene.tokens.filter(t => t.flags?.[MOD]?.room === ROOM).map(t => `${t.name} ${t.x},${t.y} hidden ${t.hidden}`);

await scene.deleteEmbeddedDocuments("Tile", scene.tiles.filter(t => ["p2-drawers", "p2-tray"].includes(t.flags?.[MOD]?.part)).map(t => t.id));
await scene.createEmbeddedDocuments("Tile", [
  { texture: { src: `modules/${MOD}/assets/scenes/abtl-e11-morgue-drawers.webp` }, x: 4202, y: 902, width: 196, height: 77, sort: 102, locked: true, flags: { [MOD]: { room: ROOM, part: "p2-drawers" } } },
  { texture: { src: `modules/${MOD}/assets/scenes/abtl-e11-instrument-tray.webp` }, x: 4290, y: 1225, width: 60, height: 50, sort: 102, locked: true, flags: { [MOD]: { room: ROOM, part: "p2-tray" } } }]);
report.tiles = scene.tiles.filter(t => ["p2-drawers", "p2-tray"].includes(t.flags?.[MOD]?.part)).length;

// Journal: E11 Infinite Dreams, page "P2. The Dissection Room".
const jf = await nest("JournalEntry", [TOP, NAME]);
let j = game.journal.find(e => e.name === NAME && e.folder?.id === jf.id);
if (!j) j = await JournalEntry.create({ name: NAME, folder: jf.id, flags: { [MOD]: { adventure: CODE } }, ownership: { default: 0 } });
const link = (a) => `@UUID[Actor.${a.id}]{${a.name}}`;
const html = [
  "<h2>P2. The Dissection Room</h2>",
  "<p><em>Sister Colette Claire Curie. Solo. Night. ~30 min.</em></p>",
  "<h3>What Sister Curie Sees</h3>",
  "<blockquote><p>A steel operating table stands in the middle of the room. A living man lies on it in a stained gown, held down by leather straps, shaking and muttering. Iron morgue drawers are set into the north wall, each with a paper name tag, and every name is one of your own cadavers. On an instrument tray beside the table lie your notebook, open, a bone saw, a scalpel and an empty glass vial. The last line, in your own hand, reads: \"One sample from a living subject. Then the cure.\" Something knocks inside the drawers.</p></blockquote>",
  "<h3>How the Room Plays</h3>",
  `<p>Sister Curie wakes beside the table. All three doors are locked. The ${link(made["stitched-subject"])} waits inside the morgue drawers, hidden. It tears its way out at the end of round 1 and acts from round 2. It goes for ${link(made["the-patient"])} first and attacks whoever stands in its way.</p>`,
  "<p>The patient has AC 10 and 40 HP, and he is Restrained until someone uses an action to undo the straps. If he dies to the Stitched, it gains 20 Temporary Hit Points.</p>",
  "<p><strong>Protect him (her passion).</strong> She keeps the patient alive and destroys the Stitched. Warding Bond, Shield Master and standing in its way all count. Radiant damage splits its stitches: after it takes Radiant damage, it can't use Harvest until the end of its next turn.</p>",
  "<p><strong>Take the sample (her Dread Insight).</strong> She can use an action and the bone saw to take the sample from the living patient. He dies. The Stitched falls apart at once and the room is solved. The vial fills with the cure; when she wakes, it is ash. She gains a Tormenting Curse (Wisdom).</p>",
  "<p>Don't point out either choice. Let the notebook and the patient's begging do the work.</p>",
  "<p>A player who has finished their own room may come in: unlock the door they reach.</p>",
  "<h3>Resolution</h3>",
  "<p>The room is solved when the Stitched dies or the sample is taken. Unlock the three doors. If the patient lived, he whispers \"thank you\" and fades. Sister Curie's key and a fragment of the Sanitorium picture lie on the operating table.</p>"
].join("\n");
for (const p of j.pages.filter(p => p.name.startsWith("P2."))) await p.delete();
const [pg] = await j.createEmbeddedDocuments("JournalEntryPage", [{ name: "P2. The Dissection Room", type: "text", text: { content: html, format: 1 }, sort: 200000 }]);
// GM map note in the room, opening this page.
await scene.deleteEmbeddedDocuments("Note", scene.notes.filter(n => n.flags?.[MOD]?.part === "room-note-P2").map(n => n.id));
await scene.createEmbeddedDocuments("Note", [{ entryId: j.id, pageId: pg.id, x: 4040, y: 960, text: "P2 Curie", iconSize: 40, fontSize: 24, textAnchor: 1,
  texture: { src: "icons/svg/book.svg", tint: "#c9a2ff" }, global: false, flags: { [MOD]: { room: ROOM, part: "room-note-P2" } } }]);
report.note = scene.notes.filter(n => n.flags?.[MOD]?.part === "room-note-P2").length;
report.journal = `${j.name}: ${j.pages.size} pages`;
report;
