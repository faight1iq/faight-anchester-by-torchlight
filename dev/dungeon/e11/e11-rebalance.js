// E11 solo rooms rebalanced (John, 2026-11-06): ~90% the dreamer solves the room, ~80% they end it below 66% of max HP,
// tuned by simulation against the six PCs of 2026-11-06 playing straight (attack the monster with their best options).
// Run after the room scripts and e11-agnostic.js.
const MOD = "faight-anchester-by-torchlight";
const R = [];
const actor = n => game.actors.find(a => a.name === n && a.flags?.[MOD]?.adventure === "E11");
async function hp(n, v) { const a = actor(n); await a.update({ "system.attributes.hp.max": v, "system.attributes.hp.value": v, "system.attributes.hp.formula": "" });
  const b = a.system.details.biography.value; if (/HP 105/.test(b)) await a.update({ "system.details.biography.value": b.replace("HP 105", "HP " + v) }); R.push(`${n} HP ${v}`); }
async function item(n, iname, { bonus, parts, pairs = [] }) {
  const a = actor(n); const it = a.items.find(i => i.name.startsWith(iname)); if (!it) { R.push(`MISSING ${n}/${iname}`); return; }
  let desc = it.system.description.value; for (const [x, y] of pairs) { if (!desc.includes(x)) R.push(`no text ${n}/${iname}: ${x}`); desc = desc.split(x).join(y); }
  const upd = { "system.description.value": desc };
  // Weapons keep their first damage part in system.damage.base (the attack activity includes it); other parts live on the activity.
  const src = it.toObject();
  for (const act of Object.values(src.system.activities ?? {})) {
    if (bonus !== undefined && act.type === "attack") upd[`system.activities.${act._id}.attack.bonus`] = String(bonus);
    if (!parts) continue;
    const useBase = act.type === "attack" && act.damage?.includeBase && src.system.damage?.base?.number;
    const raw = act.damage?.parts ?? [];
    if (useBase) {
      Object.assign(upd, { "system.damage.base.number": parts[0][0], "system.damage.base.denomination": parts[0][1], "system.damage.base.bonus": String(parts[0][2] ?? "") });
      upd[`system.activities.${act._id}.damage.parts`] = parts.slice(1).map((q, i) => ({ ...(raw[i] ?? { custom: { enabled: false }, scaling: { number: 1 }, types: ["psychic"] }), number: q[0], denomination: q[1], bonus: String(q[2] ?? "") }));
    } else if (raw.length) {
      upd[`system.activities.${act._id}.damage.parts`] = parts.map((q, i) => ({ ...raw[i], number: q[0], denomination: q[1], bonus: String(q[2] ?? "") }));
    }
  }
  await it.update(upd); R.push(`${n}/${iname} ok`);
}
// P1 Eye Swarm: out from round 1; HP 160; Stare 32 (5d10+5); Blink Together 65 (10d12). Unplugging saves the sleeper; it no longer kills the swarm.
await hp("Eye Swarm", 160);
await item("Eye Swarm", "Stare", { parts: [[5, 10, 5]], pairs: [["20 (3d10 + 4)", "32 (5d10 + 5)"]] });
await item("Eye Swarm", "Blink Together", { parts: [[10, 12, 0]], pairs: [["40 (5d12 + 8)", "65 (10d12)"]] });
await item("Eye Swarm", "Grows", { pairs: [["Each time a false sheet is pulled back, the swarm Grows", "The swarm is in the aisle from round 1. Each time a false sheet is pulled back, it Grows"]] });
await item("Eye Swarm", "Is Someone There?", { pairs: [["When the real sleeper wakes, every eye closes. The swarm dies.", "When the real sleeper wakes, it is safe. The swarm fights on."]] });
await item("The Real Sleeper", "Is Someone There?", { pairs: [["the sleeper wakes, and the Eye Swarm dies.", "the sleeper wakes and is safe. The swarm fights on."]] });
// P2 Stitched Subject: HP 120; Scalpel Hand +20, 14 (3d8+1); Harvest 38 (6d10+5).
await hp("Stitched Subject", 120);
await item("Stitched Subject", "Scalpel Hand", { bonus: 20, parts: [[3, 8, 1]], pairs: [["+16, reach 10 ft. <em>Hit:</em> 24 (4d8 + 6)", "+20, reach 10 ft. <em>Hit:</em> 14 (3d8 + 1)"]] });
await item("Stitched Subject", "Harvest", { parts: [[6, 10, 5]], pairs: [["48 (8d10 + 4)", "38 (6d10 + 5)"]] });
// P3 Angle Hound: HP 65; can't be Incapacitated.
await hp("Angle Hound", 65);
{ const a = actor("Angle Hound"); const ci = new Set(a.system.traits.ci.value); ci.add("incapacitated"); await a.update({ "system.traits.ci.value": [...ci] });
  if (!a.items.getName("Unbound")) await a.createEmbeddedDocuments("Item", [{ name: "Unbound", type: "feat", system: { type: { value: "monster" }, description: { value: "<p><strong><em>Unbound.</em></strong> The hound can't be Incapacitated.</p>" } } }]); R.push("Angle Hound immune to Incapacitated"); }
// P4 Grazer: HP 145; Gore 40 (8d8+4); Swallow 79 (14d10+2), digesting 18 (4d8).
await hp("Grazer", 145);
await item("Grazer", "Gore", { parts: [[8, 8, 4]], pairs: [["24 (4d8 + 6)", "40 (8d8 + 4)"]] });
await item("Grazer", "Swallow", { parts: [[14, 10, 2]], pairs: [["48 (8d10 + 4)", "79 (14d10 + 2)"], ["11 (2d10) Necrotic", "18 (4d8) Necrotic"]] });
// P5 Dream Fluke: HP 130; Tendril 17 (3d8+4) piercing + 16 (3d10) psychic; Into the Socket 67 (12d10+1), 16 (3d10) a turn.
await hp("Dream Fluke", 130);
await item("Dream Fluke", "Tendril", { parts: [[3, 8, 4], [3, 10, 0]], pairs: [["13 (2d8 + 4) Piercing damage plus 11 (2d10) Psychic", "17 (3d8 + 4) Piercing damage plus 16 (3d10) Psychic"]] });
await item("Dream Fluke", "Into the Socket", { parts: [[12, 10, 1]], pairs: [["48 (8d10 + 4)", "67 (12d10 + 1)"], ["11 (2d10) Psychic", "16 (3d10) Psychic"]] });
// P6 Posing Man: HP 85; Clamp 10 (2d8+1); Hold Still 19 (3d10+3).
await hp("Posing Man", 85);
await item("Posing Man", "Posing Clamp", { parts: [[2, 8, 1]], pairs: [["24 (4d8 + 6)", "10 (2d8 + 1)"]] });
await item("Posing Man", "Hold Still", { parts: [[3, 10, 3]], pairs: [["48 (8d10 + 4)", "19 (3d10 + 3)"]] });
// P1 page and token: swarm visible from the start.
const sc = game.scenes.get("EA2UdK9qQFbqbj3B");
for (const t of sc.tokens.filter(t => t.actor?.name === "Eye Swarm")) await t.update({ hidden: false });
const j = game.journal.getName("E11 Infinite Dreams"); const p = j.pages.getName("P1. The Ward of Watchers");
const P = [
 ["<p>When the dreamer pulls back a false sheet, eyes open beneath it: the @UUID[Actor.caK9YQbSDkuwRUKh]{Eye Swarm} appears in the aisle the first time (Many Eyes) and Grows each time after.</p>",
  "<p>The @UUID[Actor.caK9YQbSDkuwRUKh]{Eye Swarm} is in the aisle from round 1 (Many Eyes) and fights at once. Each false sheet the dreamer pulls back opens more eyes: the swarm Grows.</p>"],
 ["or destroys the engine (AC 15, HP 30). The sleeper wakes, every eye closes, and the swarm dies.</p>", "or destroys the engine (AC 15, HP 30). The sleeper wakes and is safe. The swarm fights on.</p>"],
 ["The room is solved when the real sleeper wakes or the swarm dies.", "The room is solved when the swarm dies."],
];
let c = p.text.content; for (const [x, y] of P) { if (!c.includes(x)) R.push("P1 page miss: " + x.slice(0, 40)); c = c.replace(x, y); }
await p.update({ "text.content": c });
const p3 = j.pages.getName("P3. The Room of Corners"); let c3 = p3.text.content;
if (!c3.includes("can't be Incapacitated")) { c3 = c3.replace("<p>A player who has finished their own room may come in", "<p>The hound can't be Incapacitated.</p>\n<p>A player who has finished their own room may come in"); await p3.update({ "text.content": c3 }); }
const report = R; report;
