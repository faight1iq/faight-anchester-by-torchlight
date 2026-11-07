// E11: take player names out of the dream maze (rooms are built for kinds of character). Run after the room scripts,
// e11-fragments.js and e11-overview.js. Reads e11-agnostic.json (built by agnostic_data.py). Each pair must match exactly once.
const MOD = "faight-anchester-by-torchlight";
const D = await (await fetch(`/modules/${MOD}/assets/scenes/e11v/e11-agnostic-v1.json?` + Date.now())).json();
const report = { pages: [], bios: [], items: [], misses: [], flags: 0, notes: [], captions: 0 };
const apply = (txt, pairs, label) => { for (const [a, b] of pairs) { const n = txt.split(a).length - 1; if (n !== 1) { report.misses.push(`${label}: ${n}x ${a.slice(0, 50)}`); continue; } txt = txt.replace(a, () => b); } return txt; };
const j = game.journal.getName("E11 Infinite Dreams");
for (const [name, pairs] of Object.entries(D.pages)) {
  const p = j.pages.getName(name); if (!p) { report.misses.push("no page " + name); continue; }
  await p.update({ "text.content": apply(p.text.content, pairs, name) }); report.pages.push(name);
}
const acts = game.actors.filter(a => a.flags?.[MOD]?.adventure === "E11");
for (const [name, pairs] of Object.entries(D.bios)) {
  const a = acts.find(x => x.name === name); if (!a) { report.misses.push("no actor " + name); continue; }
  await a.update({ "system.details.biography.value": apply(a.system.details.biography.value, pairs, name) }); report.bios.push(name);
}
for (const [key, pairs] of Object.entries(D.items)) {
  const [an, iname] = key.split(" :: "); const a = acts.find(x => x.name === an); const it = a?.items.getName(iname);
  if (!it) { report.misses.push("no item " + key); continue; }
  await it.update({ "system.description.value": apply(it.system.description.value, pairs, key) }); report.items.push(key);
}
for (const a of acts) { const r = a.flags[MOD].room; if (a.flags[MOD].player !== undefined) { await a.update({ [`flags.${MOD}.player`]: D.flagRole[r] ?? "" }); report.flags++; } }
const sc = game.scenes.get("EA2UdK9qQFbqbj3B");
for (const n of sc.notes) if (D.notes[n.text]) { report.notes.push(n.text + " -> " + D.notes[n.text]); await n.update({ text: D.notes[n.text] }); }
const fj = game.journal.getName("E11 Sanitorium Fragments");
for (const p of fj.pages) { let c = p.image?.caption || ""; const c2 = c.replace(/ \((P\d|M\d), [^)]*\)\./, " ($1).").replace("the basement of Hawthorne Greens", "the basement of the Sanitorium"); if (c2 !== c) { await p.update({ "image.caption": c2 }); report.captions++; } }
const re = /Elias|Curie|Isra|Frag\b|Vincent|Malfieri|Sara\b|Harlan|Noctis|Colette|Hawthorn/;
report.left = [...j.pages, ...fj.pages].filter(p => re.test((p.text?.content || "") + (p.image?.caption || ""))).map(p => p.name)
  .concat(acts.filter(a => re.test(JSON.stringify(a.toObject()))).map(a => "actor " + a.name)).concat(sc.notes.filter(n => re.test(n.text)).map(n => "note " + n.text));
report;
