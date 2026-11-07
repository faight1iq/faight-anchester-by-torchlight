// E11 re-ship (John, 2026-11-07), after the 2026-11-06 game. Run after every other E11 script.
// 1. Attack bonuses lowered: every E11 attack at +16 drops to +12; the Stitched Subject's Scalpel Hand +20 drops to +15.
// 2. Each Vision's ability is now a Reaction: Trigger, an attack roll hits the Vision; Response, the effect, usually on the attacker.
// Idempotent. Edits the world documents in place and reports anything it could not find.
const MOD = "faight-anchester-by-torchlight";
const R = [];
const e11 = game.actors.filter(a => a.flags?.[MOD]?.adventure === "E11");

// 1. Attack bonuses.
const DROP = { "16": "12", "20": "15" };
for (const a of e11) for (const it of a.items) {
  const src = it.toObject(); const upd = {};
  for (const act of Object.values(src.system.activities ?? {})) {
    const b = String(act.attack?.bonus ?? "").trim();
    if (act.type === "attack" && DROP[b]) upd[`system.activities.${act._id}.attack.bonus`] = DROP[b];
  }
  if (!Object.keys(upd).length) continue;
  const nb = Object.values(upd)[0];
  let d = it.system.description.value;
  d = d.replace(/\+(16|20)(?=, reach|, range| to hit)/g, "+" + nb);
  upd["system.description.value"] = d;
  await it.update(upd); R.push(`${a.name}/${it.name} -> +${nb}`);
}

// 2. Vision reactions. key: [Vision name, Response text]
const T = (n) => `<em>Trigger:</em> An attack roll hits the ${n}. <em>Response:</em> `;
const V = {
  window: ["Window", "The attacker is outlined in moonlight until the end of its next turn. It can't benefit from being hidden or having the Invisible condition, and attack rolls against it can't have Disadvantage."],
  moths: ["Moths", "<em>Constitution Saving Throw:</em> DC 19, each creature in a 5-foot Emanation originating from the Moths. <em>Failure:</em> The target has the Blinded condition until the end of its next turn."],
  chart: ["Chart", "<em>Charisma Saving Throw:</em> DC 19, the attacker. <em>Failure:</em> The target's next saving throw has Disadvantage."],
  metronome: ["Metronome", "<em>Wisdom Saving Throw:</em> DC 19, the attacker. <em>Failure:</em> Until the end of its next turn, the target can't take Reactions and has Disadvantage on its next attack roll."],
  wheelchair: ["Wheelchair", "The Wheelchair moves up to 20 feet in a straight line toward the attacker without provoking Opportunity Attacks, then makes a Touch attack against it. On a hit, the target also has the Prone condition."],
  gramophone: ["Gramophone", "<em>Charisma Saving Throw:</em> DC 19, the attacker, if it can hear the Gramophone. <em>Failure:</em> The target has the Frightened condition until the end of its next turn, with the Gramophone as the source."],
  gates: ["Gates", "<em>Strength Saving Throw:</em> DC 19, the attacker. <em>Failure:</em> The target's Speed is 0 until the end of its next turn."],
  stairs: ["Stairs", "<em>Strength Saving Throw:</em> DC 19, the attacker. <em>Failure:</em> The target is pulled 15 feet toward the centre of the room and has the Prone condition."],
  corridor: ["Corridor", "The attacker's Speed is halved until the end of its next turn."],
  cell: ["Cell", "Until the start of the Cell's next turn, no spell with a Verbal component can be cast in a 10-foot Emanation originating from the Cell."],
  chair: ["Chair", "<em>Dexterity Saving Throw:</em> DC 19, the attacker. <em>Failure:</em> The target has the Restrained condition (escape DC 19)."],
  syringe: ["Syringe", "<em>Constitution Saving Throw:</em> DC 19, the attacker. <em>Failure:</em> The target has the Poisoned condition until the end of its next turn, and the next attack roll against it has Advantage."],
  ward: ["Ward", "<em>Wisdom Saving Throw:</em> DC 19, the attacker. <em>Failure:</em> The target has the Incapacitated condition until it takes damage or until the end of its next turn."],
  spiral: ["Spiral", "<em>Wisdom Saving Throw:</em> DC 19, the attacker, if it can see the Spiral. <em>Failure:</em> On its next turn, the target uses all its movement to move straight toward the Spiral."],
  circle: ["Circle", "<em>Charisma Saving Throw:</em> DC 19, the attacker and the creature nearest to it. <em>Failure:</em> Until the end of the Circle's next turn, damage either one takes is also dealt to the other."],
  apparatus: ["Apparatus", "<em>Dexterity Saving Throw:</em> DC 19, the attacker and each other creature within 10 feet of it. <em>Failure:</em> 26 (4d10 + 4) Lightning damage. <em>Success:</em> Half damage."],
  sleeper: ["Sleeper", "<em>Constitution Saving Throw:</em> DC 19, the attacker. <em>Failure:</em> The target takes 11 (2d10) Psychic damage at the start of each of its turns until the Sleeper shatters."],
  watch: ["Watch", "Every other Vision moves up to 15 feet without provoking Opportunity Attacks."],
};
for (const a of e11.filter(a => a.flags[MOD].vision)) {
  const key = a.flags[MOD].vision, [nm, resp] = V[key] ?? [];
  if (!nm) { R.push("no text for " + key); continue; }
  const it = a.items.find(i => !["Touch", "Shatter"].includes(i.name));
  if (!it) { R.push("no ability on " + a.name); continue; }
  const label = it.name;
  const upd = { "system.description.value": `<p><strong><em>${label}.</em></strong> ${T(nm)}${resp}</p>` };
  const acts = Object.values(it.toObject().system.activities ?? {});
  if (acts.length) for (const act of acts) upd[`system.activities.${act._id}.activation`] = { type: "reaction", value: 1, condition: `An attack roll hits the ${nm}.` };
  else { const id = foundry.utils.randomID(); upd["system.activities"] = { [id]: { _id: id, type: "utility", activation: { type: "reaction", value: 1, condition: `An attack roll hits the ${nm}.` }, name: "" } }; }
  await it.update(upd);
  const bio = a.system.details.biography.value.replace("one ability from its image.", "one reaction from its image, used when an attack roll hits it.");
  await a.update({ "system.details.biography.value": bio });
  R.push(`${a.name}/${label} -> reaction`);
}

// 3. Journal pages.
const j = game.journal.getName("E11 Infinite Dreams");
const fix = async (page, pairs) => {
  const p = j.pages.getName(page); if (!p) { R.push("no page " + page); return; }
  let c = p.text.content;
  for (const [x, y] of pairs) { if (typeof x === "string" && !c.includes(x)) { R.push(`${page} miss: ${x.slice(0, 50)}`); continue; } c = c.replace(x, y); }
  await p.update({ "text.content": c });
};
await fix("C. The Waking Room", [
  ["and one ability from its image (saves are DC 19)", "and one reaction from its image: when an attack roll hits a Vision, it uses its reaction, usually on the attacker (saves are DC 19)"],
  ["The Watch comes last; its Swing moves every other Vision 15 feet each round.", "The Watch comes last; when it is hit, its Swing moves every other Vision 15 feet."],
]);
await fix("Cast and Horrors", [
  ["Touch +14 for 13 psychic, one ability each from its picture.", "Touch +14 for 13 psychic, and one reaction each from its picture, used when an attack roll hits it."],
]);
for (const p of j.pages) if (p.type === "text" && /\+(16|20)\b/.test(p.text.content ?? "")) R.push(`page still says +16/+20: ${p.name}`);
const report = R; report;
