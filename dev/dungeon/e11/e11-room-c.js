// E11 Infinite Dreams: room C, the Waking Room. The 18 dream visions step out of their pictures, six at a time;
// each one that shatters is replaced by the next in the queue, and its picture is laid into the floor mosaic.
// Builds 18 Vision actors, 18 tokens (6 visible, 12 queued hidden on the walls), the hidden floor mosaic, a GM NEXT button,
// the C journal page and map note. Safe to re-run. ABTL Monster Design row 71 (Vision: PL 15, Dur 0.5, Dmg 10% -> HP 35, AC 16, Std 13).
// NEXT plays a glass shatter (John's Dragon Studio sound, assets/sounds/dragon-studio-glass-breaking-504033.mp3) for everyone when a Vision breaks.
// To-hit +14 and save DC 19 (John: DC raised for Sister Curie's Aura of Protection).
const MOD = "faight-anchester-by-torchlight", CODE = "E11", NAME = "E11 Infinite Dreams", TOP = "Faight: Anchester by Torchlight";
const SCENE = "EA2UdK9qQFbqbj3B", ROOM = "C", PLAYER = "the party";
const TOK = `modules/${MOD}/assets/tokenizer/npc-images`, DREAM = `modules/${MOD}/assets/scenes/e11-dreams`;
const nest = async (type, path) => { let p = null; for (const n of path) { let f = game.folders.find(x => x.type === type && x.name === n && (x.folder?.id ?? null) === (p?.id ?? null)); if (!f) f = await Folder.create({ name: n, type, folder: p?.id ?? null }); p = f; } return p; };
const folder = await nest("Actor", [TOP, NAME, "Creatures"]);
const rid = () => foundry.utils.randomID();
const P = t => `<p>${t}</p>`;
const uses = r => r ? { max: "1", spent: 0, recovery: [{ period: "recharge", formula: String(r) }] } : {};
const cons = r => r ? { targets: [{ type: "itemUses", target: "", value: "1" }], scaling: { allowed: false } } : undefined;
const act = type => ({ type, value: 1 });
const ICONS = { "Touch": "icons/magic/unholy/strike-hand-glow-pink.webp", "Shatter": "icons/magic/earth/strike-body-stone-crumble.webp", "Ability": "icons/magic/control/hypnosis-mesmerism-swirl.webp" };
const iconFor = n => ICONS[n.replace(/\s*\(Recharge[^)]*\)\s*$/, "")] ?? ICONS.Ability;
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


const R = "(Recharge 5–6)";
// key, name, ability name, ability text, damage save (optional)
const VISIONS = [
  ["window", "Window", `Moonlight ${R}`, "A creature the Window can see is outlined in moonlight until the end of its next turn. It can't benefit from being hidden or having the Invisible condition, and attack rolls against it can't have Disadvantage."],
  ["moths", "Moths", "Swarm", "<em>Constitution Saving Throw:</em> DC 19, each creature in a 5-foot Emanation originating from the Moths. <em>Failure:</em> The target has the Blinded condition until the end of its next turn.", null, "bonus"],
  ["chart", "Chart", `Write a Name ${R}`, "<em>Charisma Saving Throw:</em> DC 19, a creature the Chart can see. <em>Failure:</em> The target's next saving throw has Disadvantage."],
  ["metronome", "Metronome", `Tick ${R}`, "<em>Wisdom Saving Throw:</em> DC 19, a creature the Metronome can see. <em>Failure:</em> Until the end of its next turn, the target can't take Reactions and has Disadvantage on its next attack roll."],
  ["wheelchair", "Wheelchair", `Charge ${R}`, "The Wheelchair moves up to 20 feet in a straight line without provoking Opportunity Attacks, then makes a Touch attack. On a hit, the target also has the Prone condition."],
  ["gramophone", "Gramophone", `A Voice ${R}`, "<em>Charisma Saving Throw:</em> DC 19, a creature that can hear the Gramophone. <em>Failure:</em> The target has the Frightened condition until the end of its next turn, with the Gramophone as the source."],
  ["gates", "Gates", `Shut ${R}`, "<em>Strength Saving Throw:</em> DC 19, a creature the Gates can see. <em>Failure:</em> The target's Speed is 0 until the end of its next turn."],
  ["stairs", "Stairs", `Down ${R}`, "<em>Strength Saving Throw:</em> DC 19, a creature the Stairs can see. <em>Failure:</em> The target is pulled 15 feet toward the centre of the room and has the Prone condition."],
  ["corridor", "Corridor", `Stretch ${R}`, "A creature the Corridor can see has its Speed halved until the end of its next turn."],
  ["cell", "Cell", `Padding ${R}`, "Until the start of the Cell's next turn, no spell with a Verbal component can be cast in a 10-foot Emanation originating from the Cell."],
  ["chair", "Chair", `Strap ${R}`, "<em>Dexterity Saving Throw:</em> DC 19, a creature the Chair can see. <em>Failure:</em> The target has the Restrained condition (escape DC 19)."],
  ["syringe", "Syringe", `Sedate ${R}`, "<em>Constitution Saving Throw:</em> DC 19, a creature the Syringe can see. <em>Failure:</em> The target has the Poisoned condition until the end of its next turn, and the next attack roll against it has Advantage."],
  ["ward", "Ward", `Lull ${R}`, "<em>Wisdom Saving Throw:</em> DC 19, a creature the Ward can see. <em>Failure:</em> The target has the Incapacitated condition until it takes damage or until the end of its next turn."],
  ["spiral", "Spiral", `Mesmerize ${R}`, "<em>Wisdom Saving Throw:</em> DC 19, a creature that can see the Spiral. <em>Failure:</em> On its next turn, the target uses all its movement to move straight toward the Spiral."],
  ["circle", "Circle", `Bind ${R}`, "<em>Charisma Saving Throw:</em> DC 19, two creatures the Circle can see, within 30 feet of each other. <em>Failure:</em> Until the end of the Circle's next turn, damage either one takes is also dealt to the other."],
  ["apparatus", "Apparatus", `Arc ${R}`, "<em>Dexterity Saving Throw:</em> DC 19, two creatures within 10 feet of each other. <em>Failure:</em> 26 (4d10 + 4) Lightning damage. <em>Success:</em> Half damage.", { ability: "dex", dc: 19, dice: "4d10", bonus: 4, dtype: "lightning", rech: 5 }],
  ["sleeper", "Sleeper", `Wire ${R}`, "<em>Constitution Saving Throw:</em> DC 19, a creature the Sleeper can see. <em>Failure:</em> The target takes 11 (2d10) Psychic damage at the start of each of its turns until the Sleeper takes damage.", { ability: "con", dc: 19, dice: "2d10", dtype: "psychic", rech: 5 }],
  ["watch", "Watch", "Swing", "Every other Vision moves up to 15 feet without provoking Opportunity Attacks.", null, "bonus"]
];
const QUEUE = ["window", "moths", "chart", "metronome", "wheelchair", "gramophone", "gates", "stairs", "corridor", "cell", "chair", "syringe", "ward", "spiral", "circle", "apparatus", "sleeper", "watch"];
const ROUTE = ["gates", "window", "stairs", "corridor", "cell", "wheelchair", "chair", "syringe", "chart", "ward", "metronome", "gramophone", "moths", "circle", "spiral", "apparatus", "sleeper", "watch"];

const report = { actors: 0 };
const made = {};
for (const [key, nm, an, text, dmg, act] of VISIONS) {
  const ability = dmg ? save(an, text, dmg) : feat(an, text, act ?? "action");
  const m = npc({ name: `The ${nm}`, slug: `vision-${key}`, size: "med", type: "aberration", cr: 4, ac: 16, hp: 35, move: { walk: 30 }, w: 1, h: 1,
    img: `${TOK}/vision_${key}.Token.webp`, abil: { str: 12, dex: 14, con: 12, int: 10, wis: 14, cha: 14 }, senses: { darkvision: 60 },
    bio: P(`<strong>The ${nm}.</strong> <em>Vision, Medium aberration (Mythos). Room C, the Waking Room.</em>`) + P("AC 16; HP 35. Shared Vision stat line; one ability from its image.") + P("<em>ABTL Monster Design row 71: PL 15, Durability 0.5. To-hit +14, save DC 19 (John).</em>"),
    items: [attack("Touch", "<em>Melee Attack Roll:</em> +14, reach 5 ft. <em>Hit:</em> 13 (2d8 + 4) Psychic damage.", { hit: 14, dice: "2d8", bonus: 4, dtype: "psychic" }),
      ability, feat("Shatter", "At 0 Hit Points the Vision breaks into its picture. It can't be healed or raised. Press NEXT.")] });
  m.flags[MOD].vision = key;
  for (const it of m.items) if (!(await exists(it.img))) it.img = "icons/svg/aura.svg";
  for (const old of game.actors.filter(a => a.getFlag(MOD, "slug") === m.flags[MOD].slug)) await old.delete();
  made[key] = await Actor.create(m); report.actors++;
}

// Room C is x 2600-3400, y 2600-3400 (100 px per 5 ft). Keyed doors: N x 3200-3300 (M1), W y 2700-2800 (M3), S x 3200-3300 (M2).
const scene = game.scenes.get(SCENE);
await scene.deleteEmbeddedDocuments("Token", scene.tokens.filter(t => t.flags?.[MOD]?.vision || (t.flags?.[MOD]?.room === ROOM && !game.actors.get(t.actorId))).map(t => t.id));
await scene.deleteEmbeddedDocuments("Tile", scene.tiles.filter(t => t.flags?.[MOD]?.mosaic || t.flags?.[MOD]?.part === "c-next").map(t => t.id));
// 18 wall spots (each Vision steps out of its picture there), clear of the three doors.
const SPOTS = [[2650, 2610], [2800, 2610], [2950, 2610], [3100, 2610], [3340, 2610], [3340, 2700], [3340, 2850], [3340, 3000], [3340, 3150], [3340, 3340],
  [3100, 3340], [2950, 3340], [2800, 3340], [2650, 3340], [2610, 3300], [2610, 3100], [2610, 2900], [2610, 2610]];
const toks = [];
for (const [i, key] of QUEUE.entries()) {
  const [x, y] = SPOTS[(i * 7) % 18];
  const t = (await made[key].getTokenDocument({ x, y, hidden: i >= 6 })).toObject();
  t.flags = { [MOD]: { room: ROOM, vision: key, order: i } }; toks.push(t);
}
await scene.createEmbeddedDocuments("Token", toks);
// Floor mosaic: 5 x 5 cells of 150 px; outer ring clockwise from the north-west corner, then one inner cell, then the centre (the Watch).
const CELLS = [[0,0],[1,0],[2,0],[3,0],[4,0],[4,1],[4,2],[4,3],[4,4],[3,4],[2,4],[1,4],[0,4],[0,3],[0,2],[0,1],[1,1],[2,2]];
const mosaic = ROUTE.map((key, i) => ({ texture: { src: `${DREAM}/abtl-e11-dream-${key}.webp` }, x: 2625 + CELLS[i][0] * 150, y: 2625 + CELLS[i][1] * 150, width: 150, height: 150,
  hidden: true, locked: true, sort: 102, flags: { [MOD]: { room: ROOM, mosaic: key } } }));
for (const m of mosaic) if (!(await exists(m.texture.src))) report.missingArt = (report.missingArt || []).concat(m.texture.src);
const NEXT = `const MOD = "${MOD}", sc = canvas.scene;
const V = sc.tokens.filter(t => t.flags?.[MOD]?.vision);
const dead = V.filter(t => !t.hidden && (t.actor?.system?.attributes?.hp?.value ?? 1) <= 0);
const tokUpd = dead.map(t => ({ _id: t.id, hidden: true, "flags.${MOD}.shattered": true }));
const tileUpd = dead.map(t => sc.tiles.find(x => x.flags?.[MOD]?.mosaic === t.flags[MOD].vision)).filter(Boolean).map(x => ({ _id: x.id, hidden: false }));
const queue = V.filter(t => t.hidden && !t.flags[MOD].shattered).sort((a, b) => a.flags[MOD].order - b.flags[MOD].order);
for (const t of queue.slice(0, dead.length)) tokUpd.push({ _id: t.id, hidden: false });
const left = V.filter(t => !t.flags[MOD].shattered).length - dead.length;
if (dead.length) foundry.audio.AudioHelper.play({ src: "modules/${MOD}/assets/sounds/dragon-studio-glass-breaking-504033.mp3", volume: 0.8, autoplay: true, loop: false }, true);
await sc.updateEmbeddedDocuments("Token", tokUpd); await sc.updateEmbeddedDocuments("Tile", tileUpd);
ChatMessage.create({ content: dead.length ? \`\${dead.length} shattered; \${Math.min(dead.length, queue.length)} stepped in; \${left} Visions left.\${left === 0 ? " The floor is complete." : ""}\` : "No Vision at 0 HP.", whisper: ChatMessage.getWhisperRecipients("GM") });`;
await scene.createEmbeddedDocuments("Tile", [...mosaic, { texture: { src: `modules/${MOD}/assets/scenes/abtl-e11-switch-next.webp` }, x: 3450, y: 2500, width: 60, height: 60, hidden: true, locked: true, sort: 104,
  flags: { [MOD]: { room: ROOM, part: "c-next" }, "monks-active-tiles": { active: true, record: false, restriction: "all", controlled: "gm", trigger: ["click"], allowpaused: true,
    usealpha: false, pointer: true, vision: false, pertoken: false, minrequired: 0, cooldown: null, chance: 100, fileindex: 0, actions: [{ action: "runcode", data: { code: NEXT }, id: rid() }] } } }]);
report.tokens = scene.tokens.filter(t => t.flags?.[MOD]?.vision).length; report.visible = scene.tokens.filter(t => t.flags?.[MOD]?.vision && !t.hidden).length;
report.mosaic = scene.tiles.filter(t => t.flags?.[MOD]?.mosaic).length;

const jf = await nest("JournalEntry", [TOP, NAME]);
let j = game.journal.find(e => e.name === NAME && e.folder?.id === jf.id);
if (!j) j = await JournalEntry.create({ name: NAME, folder: jf.id, flags: { [MOD]: { adventure: CODE } }, ownership: { default: 0 } });
const link = (k) => `@UUID[Actor.${made[k].id}]{${made[k].name}}`;
const html = [
  "<h2>C. The Waking Room</h2>",
  "<p><em>The whole party, after M1-M3. Night. ~60 min.</em></p>",
  "<h3>What They See</h3>",
  "<blockquote><p>A wide square hall with a bare stone floor. The walls are hung edge to edge with dim pictures in plain frames: a window with bars, moths at a lamp, a metronome, iron gates, a staircase going down, a pocket watch. Some of the pictures are moving.</p></blockquote>",
  "<h3>How the Room Plays</h3>",
  "<p>Each keyed door needs both keys from its pair of solo rooms. Lock the doors behind them. Start when the first players arrive; the others join as their doors open.</p>",
  `<p>Six Visions step out of their pictures on the first round: ${QUEUE.slice(0, 6).map(link).join(", ")}. Every Vision has AC 16, HP 35, Touch +14 for 13 Psychic, and one ability from its image (saves are DC 19). When a Vision drops to 0 Hit Points it shatters. Press the NEXT button outside the room's north-east corner (GM only): the dead Vision disappears, its picture appears in the floor, and the next Vision in the queue steps out of its picture on the wall. There are never more than six.</p>`,
  `<p>Queue: ${QUEUE.slice(6).map(link).join(", ")}. The Watch comes last; its Swing moves every other Vision 15 feet each round.</p>`,
  "<p>As the pictures fill the floor, they fall into place as one route: gates, window, stairs, corridor, cell, wheelchair, chair, syringe, chart, ward, metronome, gramophone, moths, circle, spiral, apparatus, sleeper, and the Watch in the centre. Let the players read it. Each solo and middle room gave them one of these pictures as a fragment; these are the same pictures.</p>",
  "<h3>Resolution</h3>",
  "<p>The room is solved when the Watch shatters and the floor is complete. Read: the floor is one building, an asylum, from its gates down its stairs to a ward of sleepers wired to a machine, and a watch swinging over all of it. Then they wake, each in their own bed, with the Damnation. While Dr. Orme's spell runs, it comes back after every long rest.</p>"
].join("\n");
for (const p of j.pages.filter(p => p.name.startsWith("C."))) await p.delete();
const [pg] = await j.createEmbeddedDocuments("JournalEntryPage", [{ name: "C. The Waking Room", type: "text", text: { content: html, format: 1 }, sort: 1000000 }]);
await scene.deleteEmbeddedDocuments("Note", scene.notes.filter(n => n.flags?.[MOD]?.part === "room-note-C").map(n => n.id));
await scene.createEmbeddedDocuments("Note", [{ entryId: j.id, pageId: pg.id, x: 2640, y: 2850, text: "C Waking Room", iconSize: 40, fontSize: 24, textAnchor: 1,
  texture: { src: "icons/svg/book.svg", tint: "#c9a2ff" }, global: false, flags: { [MOD]: { room: ROOM, part: "room-note-C" } } }]);
report.journal = `${j.name}: ${j.pages.size} pages`;
report;
