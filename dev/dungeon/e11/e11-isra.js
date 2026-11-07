// E11 Infinite Dreams: Isra Noctis's room (P3, the Room of Corners).
// Builds the Angle Hound and the Speaking Horn actors, places their tokens in P3 on 11.01, and writes the
// P3 page of the E11 journal. Safe to re-run: it replaces its own actors, tokens and page.
// ABTL Monster Design row 60: Angle Hound, PL 15, Durability 1.5, Hit 70%, Dmg 18% -> HP 105, AC 17, Hit +16, Std 24, Alpha 48.
const MOD = "faight-anchester-by-torchlight", CODE = "E11", NAME = "E11 Infinite Dreams", TOP = "Faight: Anchester by Torchlight";
const SCENE = "EA2UdK9qQFbqbj3B";
const TOK = `modules/${MOD}/assets/tokenizer/npc-images`;
const nest = async (type, path) => { let p = null; for (const n of path) { let f = game.folders.find(x => x.type === type && x.name === n && (x.folder?.id ?? null) === (p?.id ?? null)); if (!f) f = await Folder.create({ name: n, type, folder: p?.id ?? null }); p = f; } return p; };
const folder = await nest("Actor", [TOP, NAME, "Creatures"]);
const rid = () => foundry.utils.randomID();
const P = t => `<p>${t}</p>`;
const uses = r => r ? { max: "1", spent: 0, recovery: [{ period: "recharge", formula: String(r) }] } : {};
const cons = r => r ? { targets: [{ type: "itemUses", target: "", value: "1" }], scaling: { allowed: false } } : undefined;
const act = type => ({ type, value: 1 });
const ICONS = {
  "Disposition: Hunger": "icons/magic/control/fear-fright-shadow-monster-red.webp",
  "Corner Walker": "icons/magic/movement/portal-vortex-orange.webp",
  "Sealed Corners": "icons/magic/control/debuff-chains-ropes-net-white.webp",
  "Angle Sense": "icons/magic/perception/eye-slit-pink.webp",
  "Bite": "icons/creatures/abilities/mouth-teeth-tongue-purple.webp",
  "Out of the Corner": "icons/creatures/abilities/fang-tooth-blood-red.webp",
  "Back Into the Angle": "icons/magic/movement/trail-streak-impact-blue.webp",
  "The Voice": "icons/magic/sonic/scream-wail-shout-teal.webp",
  "Listen": "icons/magic/sonic/projectile-sound-rings-wave.webp"
};
const iconFor = n => ICONS[n.replace(/\s*\(Recharge[^)]*\)\s*$/, "")];
function feat(name, text, activation = "") {
  const it = { name, type: "feat", system: { description: { value: P(`<strong><em>${name}.</em></strong> ${text}`) }, type: { value: "monster" } } };
  if (activation) { const id = rid(); it.system.activities = { [id]: { _id: id, type: "utility", activation: act(activation), name: "" } }; }
  return it;
}
function attack(name, text, { hit, dice, bonus = "", dtype, reach = 5, rech = null, activation = "action" }) {
  const id = rid(); const [n, d] = dice.split("d").map(Number);
  return { name, type: "weapon", system: {
    description: { value: P(`<strong><em>${name}.</em></strong> ${text}`) }, type: { value: "natural" }, equipped: true, proficient: 1,
    range: { reach, units: "ft" }, damage: { base: { number: n, denomination: d, bonus: String(bonus), types: [dtype] } }, uses: uses(rech),
    activities: { [id]: { _id: id, type: "attack", activation: act(activation),
      attack: { flat: true, bonus: String(hit), type: { value: "melee", classification: "weapon" } },
      damage: { includeBase: true, parts: [] }, consumption: cons(rech) } } } };
}
const HD = { tiny: 4, sm: 6, med: 8, lg: 10 };
function hpf(hp, size, con) { const d = HD[size], m = Math.floor((con - 10) / 2), n = Math.max(1, Math.round(hp / (d / 2 + 0.5 + m))); const b = hp - Math.floor(n * (d / 2 + 0.5)); return `${n}d${d} ${b >= 0 ? "+" : "-"} ${Math.abs(b)}`; }
function npc({ name, slug, size, type, cr, ac, hp, speed, abil, senses = {}, di = [], ci = [], bio, items }) {
  const ab = {}; for (const [k, v] of Object.entries(abil)) ab[k] = { value: v };
  const s = slug.replaceAll("-", "_");
  return { name, type: "npc", folder: folder.id, img: `${TOK}/${s}.Avatar.webp`,
    flags: { [MOD]: { adventure: CODE, role: "monster", slug, room: "P3", player: "Isra Noctis" } },
    system: { abilities: ab,
      attributes: { ac: { flat: ac, calc: "flat" }, hp: { value: hp, max: hp, formula: hpf(hp, size, abil.con) },
        movement: { walk: speed, units: "ft" }, senses: { units: "ft", ...senses } },
      details: { cr, type: { value: type }, biography: { value: bio } },
      traits: { size, di: { value: di }, ci: { value: ci } } },
    prototypeToken: { name, alpha: 1, texture: { src: `${TOK}/${s}.Token.webp` }, width: 1, height: 1,
      actorLink: false, disposition: -1, displayName: 20, displayBars: 20, bar1: { attribute: "attributes.hp" }, sight: { enabled: true, range: 60 } },
    items: items.map(i => ({ ...i, img: iconFor(i.name) || "icons/svg/aura.svg" })) };
}
const exists = async p => p && (await fetch("/" + p, { method: "HEAD" })).ok;

const hound = npc({ name: "Angle Hound", slug: "angle-hound", size: "med", type: "aberration", cr: 15, ac: 17, hp: 105, speed: 40,
  abil: { str: 16, dex: 18, con: 14, int: 8, wis: 16, cha: 10 }, senses: { blindsight: 10, darkvision: 60 },
  bio: P("<strong>Angle Hound.</strong> <em>Medium aberration (Mythos). Isra Noctis's horror in the Room of Corners (P3).</em>") +
    P("<em>Description</em>: A lean, hairless, dog-shaped thing with too many angles and no eyes. It steps out of the corners of the room.") +
    P("<em>Intent</em>: Keep Isra listening, then take him through a corner.") +
    P("AC 17; HP 105. Can't see into magical darkness beyond 10 feet.") + P("<em>ABTL Monster Design row 60: Power Level 15, Durability 1.5.</em>"),
  items: [
    feat("Disposition: Hunger", "The hound stays in the corners and strikes from them. It uses Out of the Corner whenever it is charged, and Back Into the Angle after every attack it can."),
    feat("Corner Walker", "As part of its movement, the hound can enter any unsealed corner of the room and come out of any other unsealed corner, for 10 feet of movement."),
    feat("Sealed Corners", "The hound can't enter or leave through a corner that is inside magical darkness. If every corner of the room is sealed, the hound is Trapped: it can't use Corner Walker, Out of the Corner or Back Into the Angle, and it has Disadvantage on attack rolls."),
    feat("Angle Sense", "The hound has Blindsight 10 ft. Beyond 10 feet it can't see into magical darkness."),
    attack("Bite", "<em>Melee Attack Roll:</em> +16, reach 5 ft. <em>Hit:</em> 24 (4d8 + 6) Piercing damage.", { hit: 16, dice: "4d8", bonus: 6, dtype: "piercing" }),
    attack("Out of the Corner (Recharge 5–6)", "The hound comes out of an unsealed corner and moves up to 20 feet in a straight line, then bites. <em>Melee Attack Roll:</em> +16, reach 5 ft. <em>Hit:</em> 48 (8d10 + 4) Piercing damage, and the target makes a DC 17 Wisdom saving throw. <em>Failure:</em> The target has the Frightened condition until the end of its next turn.", { hit: 16, dice: "8d10", bonus: 4, dtype: "piercing", rech: 5 }),
    feat("Back Into the Angle", "If the hound is within 5 feet of an unsealed corner, it steps into the corner and has the Invisible condition until it next attacks.", "bonus")
  ] });

const gram = npc({ name: "Speaking Horn", slug: "speaking-horn", size: "sm", type: "construct", cr: 0, ac: 12, hp: 10, speed: 0,
  abil: { str: 1, dex: 1, con: 10, int: 1, wis: 1, cha: 1 }, di: ["poison", "psychic"], ci: ["blinded", "charmed", "deafened", "frightened", "paralyzed", "petrified", "poisoned"],
  bio: P("<strong>Speaking Horn.</strong> <em>Object. A brass speaking tube's horn set into the west wall of the Room of Corners (P3). The voice comes through it.</em>") +
    P("AC 12; HP 10. Smashing it silences the voice."),
  items: [
    feat("The Voice", "While the horn speaks, a voice from beyond tells Isra it knows who made him. Isra has Disadvantage on Constitution saving throws to keep Concentration."),
    feat("Listen", "Isra may choose to listen (no action). He hears a false answer about who made him, gains a Tormenting Curse (Wisdom), and the Angle Hound has Advantage on its next attack roll.")
  ] });
gram.prototypeToken.disposition = 0; gram.prototypeToken.displayBars = 0;
gram.img = gram.prototypeToken.texture.src; gram.prototypeToken.width = 3; gram.prototypeToken.height = 2; gram.prototypeToken.lockRotation = true;

const report = { actors: [] };
const made = {};
for (const m of [hound, gram]) {
  if (!(await exists(m.img))) m.img = "icons/svg/mystery-man.svg";
  if (!(await exists(m.prototypeToken.texture.src))) m.prototypeToken.texture.src = m.img;
  for (const it of m.items) if (!(await exists(it.img))) it.img = "icons/svg/aura.svg";
  for (const old of game.actors.filter(a => [m.flags[MOD].slug, ...(m.flags[MOD].slug === "speaking-horn" ? ["dream-gramophone"] : [])].includes(a.getFlag(MOD, "slug")))) await old.delete();
  const a = await Actor.create(m); made[m.flags[MOD].slug] = a;
  report.actors.push(`${a.name}: HP ${a.system.attributes.hp.max} AC ${a.system.attributes.ac.value} items ${a.items.size} img ${a.img.split("/").pop()} icons-fallback ${a.items.filter(i => i.img === "icons/svg/aura.svg").length}`);
}

// Tokens in P3 (squares x 52-55, y 24-28; 100 px per 5 ft). Hound hidden in the north-east corner (Medium = 1 grid square, ABTL token rule); speaking horn set into the west wall between its doors, mouth to the east.
const scene = game.scenes.get(SCENE);
await scene.deleteEmbeddedDocuments("Token", scene.tokens.filter(t => ["angle-hound", "dream-gramophone", "speaking-horn"].includes(game.actors.get(t.actorId)?.getFlag(MOD, "slug")) || (t.flags?.[MOD]?.room === "P3" && !game.actors.get(t.actorId))).map(t => t.id));
const tk = async (a, x, y, hidden) => { const t = (await a.getTokenDocument({ x, y, hidden })).toObject(); t.flags = { [MOD]: { room: "P3" } }; return t; };
await scene.createEmbeddedDocuments("Token", [await tk(made["angle-hound"], 5525, 2425, true), await tk(made["speaking-horn"], 5200, 2600, false)]);
report.tokens = scene.tokens.filter(t => t.flags?.[MOD]?.room === "P3").map(t => `${t.name} ${t.x},${t.y} hidden ${t.hidden}`);

// Journal: E11 Infinite Dreams, page "P3. The Room of Corners".
const jf = await nest("JournalEntry", [TOP, NAME]);
let j = game.journal.find(e => e.name === NAME && e.folder?.id === jf.id);
if (!j) j = await JournalEntry.create({ name: NAME, folder: jf.id, flags: { [MOD]: { adventure: CODE } }, ownership: { default: 0 } });
const link = (a) => `@UUID[Actor.${a.id}]{${a.name}}`;
const html = [
  "<h2>P3. The Room of Corners</h2>",
  "<p><em>Isra Noctis. Solo. Night. ~30 min.</em></p>",
  "<h3>What Isra Sees</h3>",
  "<blockquote><p>White tile covers every wall, and every wall meets the next in a hard, clean corner. A brass horn juts from the west wall, its wide mouth turned toward the room. Somewhere in the corners, something pants like a dog.</p></blockquote>",
  "<h3>How the Room Plays</h3>",
  `<p>Isra Noctis wakes here alone. All three doors are locked. The ${link(made["angle-hound"])} waits inside the north-east corner, hidden.</p>`,
  `<p>At the start of Isra's first turn a voice comes through the ${link(made["speaking-horn"])}. It says it knows who made him and will tell him if he listens. While it speaks, Isra has Disadvantage on Constitution saving throws to keep Concentration. Isra can smash the horn (AC 12, HP 10).</p>`,
  "<p>If Isra chooses to listen, give him a false answer about his maker, give him a Tormenting Curse (Wisdom), and give the hound Advantage on its next attack roll.</p>",
  "<p>The room has four corners. A corner inside magical darkness is sealed, and the hound can't use it. One <em>Darkness</em> spell seals two corners; Isra needs a second source, such as <em>Tide of Darkness</em> or his summoned shadow, to seal all four. With all four sealed, the hound is Trapped.</p>",
  "<p>Isra sees through his own magical darkness. The hound can't see into it beyond 10 feet.</p>",
  "<p>A player who has finished their own room may come in: unlock the door they reach.</p>",
  "<h3>Resolution</h3>",
  "<p>The room is solved when the hound dies. The voice stops. Unlock the three doors. Isra's key and a fragment of the Sanitorium picture lie where the hound fell.</p>"
].join("\n");
for (const p of j.pages.filter(p => p.name.startsWith("P3."))) await p.delete();
const [pg] = await j.createEmbeddedDocuments("JournalEntryPage", [{ name: "P3. The Room of Corners", type: "text", text: { content: html, format: 1 }, sort: 300000 }]);
// GM map note in the room, opening this page.
const roomScene = game.scenes.get(SCENE);
await roomScene.deleteEmbeddedDocuments("Note", roomScene.notes.filter(n => n.flags?.[MOD]?.part === "room-note-P3").map(n => n.id));
await roomScene.createEmbeddedDocuments("Note", [{ entryId: j.id, pageId: pg.id, x: 5260, y: 2840, text: "P3 Isra", iconSize: 40, fontSize: 24, textAnchor: 1,
  texture: { src: "icons/svg/book.svg", tint: "#c9a2ff" }, global: false, flags: { [MOD]: { room: "P3", part: "room-note-P3" } } }]);
report.note = roomScene.notes.filter(n => n.flags?.[MOD]?.part === "room-note-P3").length;
report.journal = `${j.name}: ${j.pages.size} pages`;
report;
