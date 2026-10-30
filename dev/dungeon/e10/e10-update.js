// E10 Moonchild, revision 3 (2026-10-30): the Crossing Track ritual.
// Updates Hester, adds the Greater Eye Fluke and Hester Ascended, rewrites the journal text pages from pages.json,
// adds the four handout image pages, and refreshes the compendium copies (actors and journals packs). The scene is left alone.
const MOD = "faight-anchester-by-torchlight", CODE = "E10", NAME = "E10 Moonchild", TOP = "Faight: Anchester by Torchlight";
const nest = async (type, path) => { let p = null; for (const n of path) { let f = game.folders.find(x => x.type === type && x.name === n && (x.folder?.id ?? null) === (p?.id ?? null)); if (!f) f = await Folder.create({ name: n, type, folder: p?.id ?? null }); p = f; } return p; };
const BASE = `modules/${MOD}/dev/dungeon/e10`, ART = `modules/${MOD}/assets/scenes/abtl-e10`, TOK = `modules/${MOD}/assets/tokenizer/npc-images`, JR = `modules/${MOD}/assets/journals`;
const get = async (f) => (await fetch(`/${BASE}/${f}?${Date.now()}`)).json();
const folder = await nest("Actor", [TOP, NAME, "Creatures"]);
const ICONS = {
  "Init 10 (Epic Boss)": "icons/svg/clockwork.svg", "Epic Boss Resistance": "icons/magic/control/debuff-chains-ropes-net-white.webp",
  "Disposition: Brood": "icons/magic/control/fear-fright-shadow-monster-red.webp", "The Outsider": "icons/magic/perception/eye-tendrils-web-purple.webp",
  "Many Hands": "icons/magic/unholy/hand-grasping-green.webp", "Seed": "icons/magic/perception/eye-slit-pink.webp",
  "The Eye Opens": "icons/magic/perception/eye-ringed-glow-angry-red.webp", "Response: Movement": "icons/magic/death/hand-withered-gray.webp",
  "Response: Hush": "icons/magic/control/hypnosis-mesmerism-swirl.webp", "Response: Take Hold": "icons/magic/unholy/hand-claw-fog-green.webp",
  "Through the Door": "icons/magic/perception/eye-ringed-green.webp", "Crossing": "icons/magic/perception/eye-tendrils-web-purple.webp",
  "Long Hands": "icons/magic/unholy/hand-grasping-green.webp"
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




const report = {};
const exists = async p => p && (await fetch("/" + p, { method: "HEAD" })).ok;
const fixImgs = async (m) => {
  const s = m.flags[MOD].slug.replaceAll("-", "_"), av = `${TOK}/${s}.Avatar.webp`, tk = `${TOK}/${s}.Token.webp`;
  m.img = (await exists(av)) ? av : "icons/svg/mystery-man.svg";
  m.prototypeToken.texture.src = (await exists(tk)) ? tk : m.img;
  for (const it of m.items) if (!(await exists(it.img))) it.img = "icons/magic/unholy/hand-claw-glow-orange.webp";
  for (const it of m.items) if (!(await exists(it.img))) it.img = "icons/svg/aura.svg";
};

// ---------- 1. Hester Crayle ----------
const hester = game.actors.find(a => a.getFlag(MOD, "slug") === "hester-crayle" && a.folder?.id === folder.id);
const desc = (n, t) => P(`<strong><em>${n}.</em></strong> ${t}`);
const upd = [];
for (const it of hester.items) {
  if (it.name === "Disposition: Midwife") upd.push({ _id: it.id, "system.description.value": desc(it.name, "Hester stays within 15 feet of Edie and keeps the mound between herself and the nearest enemy. She uses Lullaby whenever it is charged and two or more enemies can hear her, and The Moon's Door when an enemy reaches the top of the mound. She never attacks the Greater Eye Fluke.") });
  if (it.name === "Death Curse") upd.push({ _id: it.id, "system.description.value": desc(it.name, "When Hester dies, the creature that dealt the killing damage makes a DC 19 Charisma saving throw. <em>Failure:</em> The creature gains a Tormenting Pox. The Crossing Track stops.") });
  if (it.name.startsWith("The Moon's Door")) upd.push({ _id: it.id, "system.description.value": desc(it.name, "Hester moves up to 10 feet and lifts her hands to the sky. Each creature of her choice within 60 feet makes a DC 19 Constitution saving throw. <em>Failure:</em> 39 (6d10 + 6) Necrotic damage, and the target is pushed 15 feet straight away from the mound. <em>Success:</em> Half damage only. The Crossing Track advances by 1.") });
}
await hester.updateEmbeddedDocuments("Item", upd);
for (const it of hester.items.filter(i => i.name === "Long Hands")) await it.delete();
const lh = feat("Long Hands", "From 4 on the Crossing Track, Many Hands has reach 30 ft."); lh.img = iconFor("Long Hands");
await hester.createEmbeddedDocuments("Item", [lh]);
const mh = hester.items.find(i => i.name === "Many Hands");
await hester.update({ "system.details.biography.value": hester.system.details.biography.value.replace("Bring the child out under the open door and write down what comes for it.", "Be under the door when the child comes, and take what comes through into herself.") });
report.hester = `${upd.length} items updated, Long Hands added`;

// ---------- 2. New actors ----------
const ALL = ["acid","bludgeoning","cold","fire","force","lightning","necrotic","piercing","poison","psychic","radiant","slashing","thunder"];
const M = [];
M.push(npc({ name: "Greater Eye Fluke", slug: "greater-eye-fluke", size: "tiny", type: "aberration", cr: 14, ac: 16, hp: 98, speed: 10, climb: 10,
  abil: { str: 2, dex: 14, con: 12, int: 18, wis: 16, cha: 18 }, senses: { truesight: 60 },
  bio: P("<strong>Greater Eye Fluke.</strong> <em>Tiny aberration (Outsider). The thing that comes through the door.</em>") +
    P("<em>Description</em>: An eye as large as a man's fist, trailing pale tendrils.") +
    P("<em>Intent</em>: Reach Hester.") +
    P("AC 16; HP 98. Does not roll initiative.") + P("<em>ABTL Monster Design row 58: Power Level 14, Durability 1.5.</em>"),
  items: [
    feat("Through the Door", "The fluke drops through the door onto the mound when the Crossing Track reaches 6. It does not roll initiative."),
    feat("Crossing", "On the initiative count 10 after it lands, the fluke moves up to 10 feet to Hester and merges with her: it rips out her eye and pushes into the socket. Replace Hester Crayle with Hester Ascended. If the fluke is dead before that count, the door closes and nothing crosses.", "action")
  ] }));
M.push(npc({ name: "Hester Ascended", slug: "hester-ascended", size: "lg", type: "aberration", cr: 16, ac: 22, hp: 446, speed: 30,
  abil: { str: 18, dex: 14, con: 20, int: 18, wis: 18, cha: 22 }, dr: ALL, senses: { truesight: 60 }, langs: "Common",
  bio: P("<strong>Hester Ascended.</strong> <em>Large aberration (Outsider). Hester Crayle after the Greater Eye Fluke merges with her.</em>") +
    P("<em>Description</em>: An empty socket full of tendrils. Her hands reach farther than they did.") +
    P("<em>Intent</em>: Take Edie and the child as hosts, then anyone else.") +
    P("AC 22; HP 446, less the damage Hester Crayle had taken. Resists all damage.") + P("<em>ABTL Monster Design row 59: Power Level 16, Durability 6, Epic Boss.</em>"),
  items: [
    feat("Init 10 (Epic Boss)", "Hester does not roll initiative. On initiative count 10 she rolls for her recharges, moves up to her Speed, and may use one action. After each player character's turn she may take one Response. On her own turn she only moves."),
    feat("Epic Boss Resistance", "When Hester would suffer an effect, she rolls a d20. On an 11 or higher, the effect ends."),
    feat("Disposition: Brood", "Until Edie and the child are both Possessed, Hester uses Many Hands and Seed on them before anyone else."),
    feat("The Outsider", "Hester has Resistance to all damage. When she dies, the fluke in her skull dies with her, and every creature it Possessed is freed."),
    attack("Many Hands", "Hester moves up to 10 feet. <em>Melee Attack Roll:</em> +18, reach 30 ft. <em>Hit:</em> 49 (7d10 + 11) Necrotic damage, and the target has the Grappled condition (escape DC 21) and is pulled 10 feet toward her. Edie and the child take no damage from this attack.", { hit: 18, dice: "7d10", bonus: 11, dtype: "necrotic", reach: 30 }),
    save("Seed (Recharge 4–6)", "Hester moves up to 10 feet and presses a hand over the eyes of a creature she has Grappled. The creature makes a DC 21 Constitution saving throw. Edie and the child fail automatically. <em>Failure:</em> The target has the Blinded condition. At the start of Hester's next turn on count 10, the target is Possessed, as by the Eye Fluke (Episode Two).", { ability: "con", dc: 21, onSave: "none", rech: 4 }),
    save("The Eye Opens (Recharge 5–6)", "Hester moves up to 10 feet and turns the thing in her socket on the clearing. Each creature of her choice within 60 feet that can see her makes a DC 21 Wisdom saving throw. <em>Failure:</em> 98 (14d12 + 7) Psychic damage, the Blinded condition until the end of its next turn, and a Tormenting Nox. <em>Success:</em> Half damage only.", { ability: "wis", dc: 21, dice: "14d12", bonus: 7, dtype: "psychic", rech: 5, tmpl: { type: "radius", size: "60", units: "ft" } }),
    feat("Response: Movement", "Hester moves up to half her Speed.", "special"),
    save("Response: Hush (Recharge 4–6)", "Hester moves up to 10 feet and hushes a creature she can see. The creature makes a DC 21 Wisdom saving throw. <em>Failure:</em> The creature has Disadvantage on its next d20 Test.", { ability: "wis", dc: 21, onSave: "none", rech: 4, activation: "special" }),
    feat("Response: Take Hold (Recharge 5–6)", "Hester moves up to 10 feet and makes one Many Hands attack.", "special")
  ] }));
report.actors = [];
for (const m of M) {
  m.prototypeToken.width *= 2; m.prototypeToken.height *= 2;
  await fixImgs(m);
  for (const old of game.actors.filter(a => a.getFlag(MOD, "slug") === m.flags[MOD].slug && a.folder?.id === folder.id)) await old.delete();
  const a = await Actor.create(m);
  report.actors.push(`${a.name}: HP ${a.system.attributes.hp.max} AC ${a.system.attributes.ac.value} items ${a.items.size} img ${a.img.split('/').pop()}`);
}

// ---------- 3. Journal ----------
const jfolder = await nest("JournalEntry", [TOP, NAME]);
const journal = game.journal.find(j => j.name === NAME && j.folder?.id === jfolder.id);
const PAGES = await get("pages.json");
// only the actors in the episode's own folder (a world that has imported the E10 Adventure has same-named copies elsewhere)
const inTree = new Set([folder.folder.id, ...folder.folder.getSubfolders(true).map(f => f.id)]);
const actorsBy = Object.fromEntries(game.actors.filter(a => a.folder && inTree.has(a.folder.id)).map(a => [a.name, a]));
const linkify = (h) => { for (const [n, a] of Object.entries(actorsBy)) h = h.replaceAll(`<strong>${n}</strong>`, `@UUID[Actor.${a.id}]{${n}}`); return h; };
const byName = Object.fromEntries(journal.pages.contents.map(p => [p.name, p]));
const pu = []; const missing = [];
for (const p of PAGES) { const pg = byName[p.name]; if (pg) pu.push({ _id: pg.id, "text.content": linkify(p.html) }); else missing.push(p.name); }
await journal.updateEmbeddedDocuments("JournalEntryPage", pu);
for (const n of ["Handouts", "Handout: The Proving", "Handout: The Second Leaf", "Handout: Letter to Mrs. Crayle", "Handout: A Page of the Pale Journals"]) for (const pg of journal.pages.filter(p => p.name === n)) await pg.delete();
const HO = [["The Proving", "01"], ["The Second Leaf", "02"], ["Letter to Mrs. Crayle", "03"], ["A Page of the Pale Journals", "04"]];
await journal.createEmbeddedDocuments("JournalEntryPage", HO.map(([n, k], i) => ({ name: `Handout: ${n}`, type: "image", sort: 710 + i * 5, src: `${JR}/abtl-e10-handout-${k}.webp`, image: { caption: n } })));
report.journal = `${pu.length} text pages updated, ${HO.length} handout pages, missing: ${missing.join(", ") || "none"}`;

// ---------- 4. Compendium copies ----------
const AP = game.packs.get(`${MOD}.actors`), JP = game.packs.get(`${MOD}.journals`);
const unlock = async p => { const l = p.locked; if (l) await p.configure({ locked: false }); return l; };
const la = await unlock(AP), lj = await unlock(JP);
try {
  const ai = await AP.getIndex({ fields: ["flags", "folder"] });
  const oldH = ai.find(e => e.name === "Hester Crayle");
  const pFolder = oldH?.folder ?? null;
  const packIds = {};
  for (const a of [hester, ...game.actors.filter(a => ["greater-eye-fluke", "hester-ascended"].includes(a.getFlag(MOD, "slug")) && a.folder?.id === folder.id)]) {
    for (const e of ai.filter(e => e.name === a.name)) await Actor.deleteDocuments([e._id], { pack: AP.collection });
    const o = a.toObject(); delete o._id; o.folder = pFolder;
    const [c] = await Actor.createDocuments([o], { pack: AP.collection }); packIds[a.id] = c.id;
  }
  // every other E10 world actor already has a pack copy; map them by name for the journal links
  const ai2 = await AP.getIndex();
  for (const a of Object.values(actorsBy)) if (!packIds[a.id]) { const e = ai2.find(x => x.name === a.name); if (e) packIds[a.id] = e._id; }
  const ji = await JP.getIndex({ fields: ["folder"] });
  const oldJ = ji.find(e => e.name === NAME);
  if (oldJ) await JournalEntry.deleteDocuments([oldJ._id], { pack: JP.collection });
  const jo = journal.toObject(); delete jo._id; jo.folder = oldJ?.folder ?? null;
  let txt = JSON.stringify(jo);
  for (const [w, p] of Object.entries(packIds)) txt = txt.replaceAll(`@UUID[Actor.${w}]`, `@UUID[Compendium.${MOD}.actors.Actor.${p}]`);
  await JournalEntry.createDocuments([JSON.parse(txt)], { pack: JP.collection });
  report.packs = `actors copied ${Object.keys(packIds).length} mapped; journal replaced`;
} finally { if (la) await AP.configure({ locked: true }); if (lj) await JP.configure({ locked: true }); }
return report;
