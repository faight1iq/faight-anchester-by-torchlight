// E11 Infinite Dreams: Elias "Grey" Harlan's room (P1, the Ward of Watchers).
// Builds the Eye Swarm, the two sleeper actors and the Galvanic Engine, places their tokens and the cable tile in P1 on 11.01,
// and writes the P1 page of the E11 journal. Safe to re-run: it replaces its own actors, tokens and page.
// ABTL Monster Design row 61: Eye Swarm, PL 15, Durability 1.5, Hit 70%, Dmg 15% -> HP 105, AC 17, Hit +16, Std 20, Alpha 40.
const MOD = "faight-anchester-by-torchlight", CODE = "E11", NAME = "E11 Infinite Dreams", TOP = "Faight: Anchester by Torchlight";
const SCENE = "EA2UdK9qQFbqbj3B", ROOM = "P1", PLAYER = 'Elias "Grey" Harlan';
const TOK = `modules/${MOD}/assets/tokenizer/npc-images`;
const nest = async (type, path) => { let p = null; for (const n of path) { let f = game.folders.find(x => x.type === type && x.name === n && (x.folder?.id ?? null) === (p?.id ?? null)); if (!f) f = await Folder.create({ name: n, type, folder: p?.id ?? null }); p = f; } return p; };
const folder = await nest("Actor", [TOP, NAME, "Creatures"]);
const rid = () => foundry.utils.randomID();
const P = t => `<p>${t}</p>`;
const uses = r => r ? { max: "1", spent: 0, recovery: [{ period: "recharge", formula: String(r) }] } : {};
const cons = r => r ? { targets: [{ type: "itemUses", target: "", value: "1" }], scaling: { allowed: false } } : undefined;
const act = type => ({ type, value: 1 });
const ICONS = {
  "Disposition: Watch": "icons/magic/perception/eye-ringed-glow-angry-red.webp",
  "Many Eyes": "icons/magic/perception/eye-tendrils-web-purple.webp",
  "One Mass": "icons/magic/perception/eye-slit-pink.webp",
  "Grows": "icons/magic/perception/eye-ringed-green.webp",
  "Stare": "icons/magic/perception/eye-ringed-glow-angry-red.webp",
  "Blink Together": "icons/magic/perception/eye-tendrils-web-purple.webp",
  "Watchful": "icons/magic/perception/eye-slit-pink.webp",
  "A Voice Under the Sheet": "icons/magic/sonic/projectile-sound-rings-wave.webp",
  "Is Someone There?": "icons/magic/sonic/projectile-sound-rings-wave.webp",
  "Drain": "icons/magic/unholy/hand-claw-glow-orange.webp"
};
const iconFor = n => ICONS[n.replace(/\s*\(Recharge[^)]*\)\s*$/, "")];
function feat(name, text, activation = "") {
  const it = { name, type: "feat", system: { description: { value: P(`<strong><em>${name}.</em></strong> ${text}`) }, type: { value: "monster" } } };
  if (activation) { const id = rid(); it.system.activities = { [id]: { _id: id, type: "utility", activation: act(activation), name: "" } }; }
  return it;
}
function attack(name, text, { hit, dice, bonus = "", dtype, range = "melee", reach = 5, rng = null, rech = null, activation = "action" }) {
  const id = rid(); const [n, d] = dice.split("d").map(Number);
  return { name, type: "weapon", system: {
    description: { value: P(`<strong><em>${name}.</em></strong> ${text}`) }, type: { value: "natural" }, equipped: true, proficient: 1,
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
const HD = { tiny: 4, sm: 6, med: 8, lg: 10 };
function hpf(hp, size, con) { const d = HD[size], m = Math.floor((con - 10) / 2), n = Math.max(1, Math.round(hp / (d / 2 + 0.5 + m))); const b = hp - Math.floor(n * (d / 2 + 0.5)); return `${n}d${d} ${b >= 0 ? "+" : "-"} ${Math.abs(b)}`; }
function npc({ name, slug, size, type, cr, ac, hp, speed, abil, senses = {}, di = [], ci = [], bio, items, img, tokenImg, w = 2, h = 2, tokenName = name, disposition = -1 }) {
  const ab = {}; for (const [k, v] of Object.entries(abil)) ab[k] = { value: v };
  const s = slug.replaceAll("-", "_");
  return { name, type: "npc", folder: folder.id, img: img ?? `${TOK}/${s}.Avatar.webp`,
    flags: { [MOD]: { adventure: CODE, role: "monster", slug, room: ROOM, player: PLAYER } },
    system: { abilities: ab,
      attributes: { ac: { flat: ac, calc: "flat" }, hp: { value: hp, max: hp, formula: hp > 1 ? hpf(hp, size, abil.con) : "" },
        movement: { walk: speed, units: "ft" }, senses: { units: "ft", ...senses } },
      details: { cr, type: { value: type }, biography: { value: bio } },
      traits: { size, di: { value: di }, ci: { value: ci } } },
    prototypeToken: { name: tokenName, alpha: 1, texture: { src: tokenImg ?? `${TOK}/${s}.Token.webp` }, width: w, height: h,
      actorLink: false, disposition, displayName: disposition === -1 ? 20 : 0, displayBars: disposition === -1 ? 20 : 0, bar1: { attribute: "attributes.hp" }, sight: { enabled: true, range: 60 } },
    items: items.map(i => ({ ...i, img: iconFor(i.name) || "icons/svg/aura.svg" })) };
}
const exists = async p => p && (await fetch("/" + p, { method: "HEAD" })).ok;
const OBJ_CI = ["blinded", "charmed", "deafened", "frightened", "paralyzed", "petrified", "poisoned"];
const COT = `${TOK}/dream_sleeper_cot.Token.webp`;

const swarm = npc({ name: "Eye Swarm", slug: "eye-swarm", size: "med", type: "aberration", cr: 15, ac: 17, hp: 105, speed: 30, w: 1, h: 1,
  abil: { str: 6, dex: 16, con: 14, int: 10, wis: 18, cha: 8 }, senses: { truesight: 60 },
  bio: P("<strong>Eye Swarm.</strong> <em>Medium swarm of Tiny aberrations (Mythos). Elias Harlan's horror in the Ward of Watchers (P1).</em>") +
    P("<em>Description</em>: Hundreds of small pale eyes joined by grey membrane, crawling out from under the sheets.") +
    P("<em>Intent</em>: Keep Elias pulling sheets until the real sleeper is drained.") +
    P("AC 17; HP 105. One creature: Sneak Attack works on it. No damage resistances.") + P("<em>ABTL Monster Design row 61: Power Level 15, Durability 1.5.</em>"),
  items: [
    feat("Disposition: Watch", "The swarm stays between Elias and the real sleeper's cot. It uses Blink Together whenever it is charged and Elias can see it."),
    feat("Many Eyes", "The first time the swarm opens, Elias makes a DC 17 Wisdom saving throw. <em>Failure:</em> He has the Frightened condition until the end of his next turn."),
    feat("One Mass", "The swarm is a single creature. It can occupy another creature's space and move through spaces as narrow as 1 inch. It has no resistance to weapon damage."),
    feat("Grows", "Each time a false sheet is pulled back, the swarm Grows (up to 3 times). Each time it Grows it gains a +1 bonus to attack rolls and Stare makes one more attack."),
    attack("Stare", "<em>Ranged Attack Roll:</em> +16 (+1 per Grows), range 30 ft. <em>Hit:</em> 20 (3d10 + 4) Psychic damage. The swarm makes one Stare attack, plus one more each time it has Grown (up to 4).", { hit: 16, dice: "3d10", bonus: 4, dtype: "psychic", range: "ranged", rng: [30, 30] }),
    save("Blink Together (Recharge 5–6)", "Every eye opens at once. Each creature within 30 feet that can see the swarm makes a DC 17 Constitution saving throw. <em>Failure:</em> 40 (5d12 + 8) Psychic damage, and the target has the Blinded condition until the end of its next turn. <em>Success:</em> Half damage only.", { ability: "con", dc: 17, dice: "5d12", bonus: 8, dtype: "psychic", rech: 5, tmpl: { type: "radius", size: "30", units: "ft" } }),
    feat("Watchful", "<em>Reaction</em> when a creature within 30 feet takes the Hide action, if the swarm has Grown twice or more: the creature is not hidden from the swarm.", "reaction"),
    feat("Is Someone There?", "When the real sleeper wakes, every eye closes. The swarm dies.")
  ] });

const falseS = npc({ name: "Sleeper Under a Sheet", slug: "dream-sleeper-false", size: "med", type: "aberration", cr: 0, ac: 10, hp: 1, speed: 0,
  abil: { str: 1, dex: 1, con: 1, int: 1, wis: 1, cha: 1 }, ci: OBJ_CI, img: COT, tokenImg: COT, w: 2, h: 1, tokenName: "Sleeper", disposition: 0,
  bio: P("<strong>Sleeper Under a Sheet.</strong> <em>False. Five of the six cots in the Ward of Watchers (P1).</em>") +
    P("A shape under a sheet, begging Elias by name. Under the sheet is nothing but eyes."),
  items: [feat("A Voice Under the Sheet", "The voice calls Elias by name and begs him for help. When the sheet is pulled back, eyes open beneath it and the Eye Swarm Grows.")] });

const realS = npc({ name: "The Real Sleeper", slug: "dream-sleeper-real", size: "med", type: "humanoid", cr: 0, ac: 10, hp: 4, speed: 0,
  abil: { str: 8, dex: 8, con: 8, int: 10, wis: 10, cha: 10 }, img: COT, tokenImg: COT, w: 2, h: 1, tokenName: "Sleeper", disposition: 0,
  bio: P("<strong>The Real Sleeper.</strong> <em>The one real person in the Ward of Watchers (P1): the southern cot on the west wall.</em>") +
    P("A stranger, asleep and wired to the engine. It never says Elias's name; it only asks, \"Is someone there?\""),
  items: [feat("Is Someone There?", "The real sleeper never uses Elias's name. Pull back the sheet, then use an action to unplug its cable (or destroy the Galvanic Engine): the sleeper wakes, and the Eye Swarm dies.")] });

const ENGINE = `${TOK}/galvanic_engine.Token.webp`;
const mach = npc({ name: "Galvanic Engine", slug: "galvanic-engine", size: "lg", type: "construct", cr: 0, ac: 15, hp: 30, speed: 0,
  abil: { str: 1, dex: 1, con: 10, int: 1, wis: 1, cha: 1 }, di: ["poison", "psychic"], ci: OBJ_CI, img: ENGINE, tokenImg: ENGINE, w: 4, h: 1.6, disposition: 0,
  bio: P("<strong>Galvanic Engine.</strong> <em>Object, against the south wall of the Ward of Watchers (P1): an iron cabinet of copper coils, brass bellows and violet valves, with six cables running to the cots.</em>") + P("AC 15; HP 30."),
  items: [feat("Drain", "The engine drains the real sleeper. At the end of round 4 the real sleeper dies. Destroying the engine wakes the real sleeper.")] });

const report = { actors: [] };
const made = {};
for (const m of [swarm, falseS, realS, mach]) {
  if (!(await exists(m.img))) m.img = "icons/svg/mystery-man.svg";
  if (!(await exists(m.prototypeToken.texture.src))) m.prototypeToken.texture.src = m.img;
  for (const it of m.items) if (!(await exists(it.img))) it.img = "icons/svg/aura.svg";
  for (const old of game.actors.filter(a => [m.flags[MOD].slug, ...(m.flags[MOD].slug === "galvanic-engine" ? ["dream-machine"] : [])].includes(a.getFlag(MOD, "slug")))) await old.delete();
  const a = await Actor.create(m); made[m.flags[MOD].slug] = a;
  report.actors.push(`${a.name}: HP ${a.system.attributes.hp.max} AC ${a.system.attributes.ac.value} items ${a.items.size} fallback-icons ${a.items.filter(i => i.img === "icons/svg/aura.svg").length}`);
}

// Tokens in P1 (squares x 15-18, y 9-14; 100 px per 5 ft). Doors: north at x 16, east at y 12, south at x 16.
// Cots with their heads to the wall at rows y 10, 11, 13 on both walls; the real sleeper is the west cot at y 13.
// The cot art has its head on the left. East cots are mirrored (scaleX -1), not rotated: lockRotation stops rotated art from turning.
const scene = game.scenes.get(SCENE);
const mine = new Set(["eye-swarm", "dream-sleeper-false", "dream-sleeper-real", "dream-machine", "galvanic-engine"]);
await scene.deleteEmbeddedDocuments("Token", scene.tokens.filter(t => mine.has(game.actors.get(t.actorId)?.getFlag(MOD, "slug")) || (t.flags?.[MOD]?.room === ROOM && !game.actors.get(t.actorId))).map(t => t.id));
const tk = async (a, x, y, hidden = false, mirror = false) => { const t = (await a.getTokenDocument({ x, y, hidden, rotation: 0 })).toObject(); t.flags = { [MOD]: { room: ROOM } }; t.lockRotation = true; if (mirror) t.texture.scaleX = -Math.abs(t.texture.scaleX ?? 1); return t; };
const T = [];
// Cots sit 10 px in from the walls so the cable ends tuck under their feet.
for (const y of [1000, 1100]) { T.push(await tk(made["dream-sleeper-false"], 1510, y + 25)); T.push(await tk(made["dream-sleeper-false"], 1790, y + 25, false, true)); }
T.push(await tk(made["dream-sleeper-real"], 1510, 1325));
T.push(await tk(made["dream-sleeper-false"], 1790, 1325, false, true));
T.push(await tk(made["galvanic-engine"], 1700, 1420)); // east of the south door (x 1600-1700)
T.push(await tk(made["eye-swarm"], 1625, 1175, true)); // Medium = 1 grid square (ABTL token rule)
await scene.createEmbeddedDocuments("Token", T);
report.tokens = scene.tokens.filter(t => t.flags?.[MOD]?.room === ROOM).length;
// Cable tile: one cable from the engine to the foot of each cot. Sits just above the room's dream picture tile (sort 101).
await scene.deleteEmbeddedDocuments("Tile", scene.tiles.filter(t => t.flags?.[MOD]?.part === "p1-cables").map(t => t.id));
await scene.createEmbeddedDocuments("Tile", [{ texture: { src: `modules/${MOD}/assets/scenes/abtl-e11-p1-cables-v3.webp` }, x: 1500, y: 900, width: 400, height: 600, sort: 102, locked: true, flags: { [MOD]: { room: ROOM, part: "p1-cables" } } }]);
report.cables = scene.tiles.filter(t => t.flags?.[MOD]?.part === "p1-cables").length;
// Sparks: animated arcs over the Galvanic Engine (traced from John's drawn lines), elevation 1 so they sit above the engine token,
// plus a small flickering violet light so the arcs light the floor.
await scene.deleteEmbeddedDocuments("Tile", scene.tiles.filter(t => t.flags?.[MOD]?.part === "p1-sparks").map(t => t.id));
await scene.createEmbeddedDocuments("Tile", [{ texture: { src: `modules/${MOD}/assets/scenes/abtl-e11-p1-sparks.webm` }, x: 1690, y: 1410, width: 220, height: 100, elevation: 1, sort: 103, locked: true,
  video: { autoplay: true, loop: true, volume: 0 }, flags: { [MOD]: { room: ROOM, part: "p1-sparks" } } }]);
await scene.deleteEmbeddedDocuments("AmbientLight", scene.lights.filter(l => l.flags?.[MOD]?.part === "p1-sparks").map(l => l.id));
await scene.createEmbeddedDocuments("AmbientLight", [{ x: 1800, y: 1460, config: { dim: 7.5, bright: 1.5, color: "#a07cff", alpha: 0.45, luminosity: 0.5, coloration: 1, attenuation: 0.5,
  animation: { type: "torch", speed: 10, intensity: 8 } }, flags: { [MOD]: { room: ROOM, part: "p1-sparks" } } }]);
// GM-only On/Off buttons in the void west of P1 (hidden tiles, so players never see them). Monk's Active Tiles click
// runs code that finds the sparks by flag (OFF sets the arcs fully transparent and hides the light), not by id, so the buttons survive ship.js re-iding tiles and lights.
const SW = (on) => `const MOD = "${MOD}", sc = canvas.scene;
await sc.updateEmbeddedDocuments("Tile", sc.tiles.filter(t => t.flags?.[MOD]?.part === "p1-sparks").map(t => ({ _id: t.id, hidden: false, alpha: ${on ? 1 : 0} })));
await sc.updateEmbeddedDocuments("AmbientLight", sc.lights.filter(l => l.flags?.[MOD]?.part === "p1-sparks").map(l => ({ _id: l.id, hidden: ${!on} })));`;
const swTile = (on, y) => ({ texture: { src: `modules/${MOD}/assets/scenes/abtl-e11-switch-${on ? "on" : "off"}.webp` }, x: 1380, y, width: 60, height: 60, hidden: true, locked: true, sort: 104,
  flags: { [MOD]: { room: ROOM, part: "p1-switch" }, "monks-active-tiles": { active: true, record: false, restriction: "all", controlled: "gm", trigger: ["click"], allowpaused: true,
    usealpha: false, pointer: true, vision: false, pertoken: false, minrequired: 0, cooldown: null, chance: 100, fileindex: 0,
    actions: [{ action: "runcode", data: { code: SW(on) }, id: rid() }] } } });
await scene.deleteEmbeddedDocuments("Tile", scene.tiles.filter(t => t.flags?.[MOD]?.part === "p1-switch").map(t => t.id));
await scene.createEmbeddedDocuments("Tile", [swTile(true, 1330), swTile(false, 1400)]);
report.switches = scene.tiles.filter(t => t.flags?.[MOD]?.part === "p1-switch").length;
report.sparks = `${scene.tiles.filter(t => t.flags?.[MOD]?.part === "p1-sparks").length} tile, ${scene.lights.filter(l => l.flags?.[MOD]?.part === "p1-sparks").length} light`;

// Journal page.
const jf = await nest("JournalEntry", [TOP, NAME]);
let j = game.journal.find(e => e.name === NAME && e.folder?.id === jf.id);
if (!j) j = await JournalEntry.create({ name: NAME, folder: jf.id, flags: { [MOD]: { adventure: CODE } }, ownership: { default: 0 } });
const link = (a) => `@UUID[Actor.${a.id}]{${a.name}}`;
const html = [
  "<h2>P1. The Ward of Watchers</h2>",
  "<p><em>Elias \"Grey\" Harlan. Solo. Night. ~30 min.</em></p>",
  "<h3>What Elias Sees</h3>",
  "<blockquote><p>Six iron cots line the walls, three to a side, each with a figure under a white sheet. An iron cabinet of copper coils and violet glass valves hums against the south wall, and sparks crawl over its coils. A black cable runs from it to the foot of every cot. From under the sheets, voices begin to call for help.</p></blockquote>",
  "<h3>How the Room Plays</h3>",
  `<p>Elias wakes in the aisle. All three doors are locked. All six sleepers beg him for help. Five are ${link(made["dream-sleeper-false"])}s, and they call him by name. ${link(made["dream-sleeper-real"])} lies on the southern cot of the west wall; it never says his name and only asks, "Is someone there?" Play the voices and let him notice the difference.</p>`,
  `<p>The ${link(made["galvanic-engine"])} is draining the real sleeper. Count rounds from Elias's first turn: at the end of round 4 the real sleeper dies.</p>`,
  `<p>When Elias pulls back a false sheet, eyes open beneath it: the ${link(made["eye-swarm"])} appears in the aisle the first time (Many Eyes) and Grows each time after.</p>`,
  "<p>To free the real sleeper, Elias pulls back its sheet and uses an action to unplug its cable, or destroys the engine (AC 15, HP 30). The sleeper wakes, every eye closes, and the swarm dies.</p>",
  "<p>The sparks on the engine are an effect only. Use the ON and OFF buttons in the void west of the room (GM only) to show or hide them, for example when the engine is destroyed.</p>",
  "<p>A player who has finished their own room may come in: unlock the door they reach.</p>",
  "<h3>Resolution</h3>",
  "<p>The room is solved when the real sleeper wakes or the swarm dies. Unlock the three doors. If the sleeper woke, Elias's key and a fragment of the Sanitorium picture lie on its cot. If the sleeper died, they lie where the swarm fell.</p>"
].join("\n");
for (const p of j.pages.filter(p => p.name.startsWith("P1."))) await p.delete();
const [pg] = await j.createEmbeddedDocuments("JournalEntryPage", [{ name: "P1. The Ward of Watchers", type: "text", text: { content: html, format: 1 }, sort: 100000 }]);
// GM map note in the room, opening this page.
const roomScene = game.scenes.get(SCENE);
await roomScene.deleteEmbeddedDocuments("Note", roomScene.notes.filter(n => n.flags?.[MOD]?.part === "room-note-P1").map(n => n.id));
await roomScene.createEmbeddedDocuments("Note", [{ entryId: j.id, pageId: pg.id, x: 1560, y: 950, text: "P1 Elias", iconSize: 40, fontSize: 24, textAnchor: 1,
  texture: { src: "icons/svg/book.svg", tint: "#c9a2ff" }, global: false, flags: { [MOD]: { room: "P1", part: "room-note-P1" } } }]);
report.note = roomScene.notes.filter(n => n.flags?.[MOD]?.part === "room-note-P1").length;
report.journal = `${j.name}: ${j.pages.size} pages`;
report;
