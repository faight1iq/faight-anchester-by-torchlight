// E11 pair rooms rebalanced for straight play (John, 2026-11-06). Run after e11-rebalance.js.
// No healing between rooms (John: let the players sweat; they have potions and magic).
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

// M1: Caller visible after its first Call; HP 110; Rend 23 (4d8+5); Unmaking Cry 46 (8d10+2); Wall-Born Claw 8 (2d4+3).
await hp("The Caller", 110);
await item("The Caller", "Rend", { parts: [[4, 8, 5]], pairs: [["33 (6d8 + 6)", "23 (4d8 + 5)"]] });
await item("The Caller", "Unmaking Cry", { parts: [[8, 10, 2]], pairs: [["66 (12d10)", "46 (8d10 + 2)"]] });
await item("The Caller", "Among Them", { pairs: [["it looks like one of them. A creature that uses an action to study the crowd spots it with a DC 17 Wisdom (Perception) check.", "it looks like one of them, until it first uses Call. From then on it is plain to see (press SPOT)."]] });
await item("Wall-Born", "Claw", { parts: [[2, 4, 3]], pairs: [["11 (2d6 + 4)", "8 (2d4 + 3)"]] });
// M2: no Anchor Stones; Choir HP 100; Hymn 6 (1d10+1); High Note 13 (2d12); Shard Strike 2 (1d4).
await hp("The Choir", 100);
await item("The Choir", "Hymn", { parts: [[1, 10, 1]], pairs: [["16 (3d10)", "6 (1d10 + 1)"]] });
await item("The Choir", "High Note", { parts: [[2, 12, 0]], pairs: [["32 (5d12)", "13 (2d12)"]] });
await item("Choir Shard", "Shard Strike", { parts: [[1, 4, 0]], pairs: [["6 (1d6 + 3)", "2 (1d4)"]] });
const sc = game.scenes.get("EA2UdK9qQFbqbj3B");
const stones = sc.tokens.filter(t => t.actor?.name === "Anchor Stone").map(t => t.id);
if (stones.length) await sc.deleteEmbeddedDocuments("Token", stones); R.push(`removed ${stones.length} Anchor Stone tokens`);
// M3: Hollow Brute HP 80; Slam 35 (6d8+8); Haul 35 (6d8+8).
await hp("Hollow Brute", 80);
await item("Hollow Brute", "Slam", { parts: [[6, 8, 8]], pairs: [["23 (4d8 + 5)", "35 (6d8 + 8)"]] });
await item("Hollow Brute", "Haul", { parts: [[6, 8, 8]], pairs: [["23 (4d8 + 5)", "35 (6d8 + 8)"]] });
// Journal pages.
const j = game.journal.getName("E11 Infinite Dreams");
async function page(n, pairs) { const p = j.pages.getName(n); let c = p.text.content;
  for (const [x, y] of pairs) { if (!c.includes(x)) { R.push(`${n} miss: ${x.slice(0, 50)}`); continue; } c = c.replace(x, y); }
  await p.update({ "text.content": c }); R.push(n + " ok"); }
await page("M1. The Hold and the Hunt", [
 ["A creature that uses an action to study the crowd spots the Caller with a DC 17 Wisdom (Perception) check. When it is spotted, press the SPOT button in the void north-east of the room (GM only) to show its true form.",
  "The Caller hides among them until it first uses Call; from then on it is plain to see: press the SPOT button in the void north-east of the room (GM only) to show its true form."]]);
await page("M2. The Choir", [
 [/<p>The three @UUID\[Actor\.[^\]]+\]\{Anchor Stone\}s[^<]*<\/p>\n?/.exec(j.pages.getName("M2. The Choir").text.content)?.[0] ?? "@@none@@", ""],
 ["Stones down, shards down, and the Choir is open.", "Shards down, and the Choir is open."]]);
const report = R; report;
