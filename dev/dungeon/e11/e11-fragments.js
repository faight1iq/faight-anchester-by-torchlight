// E11 Infinite Dreams: the Sanitorium fragment handouts. One picture of the ritual chamber in the basement of Hawthorne Greens,
// torn into nine pieces: each solo room (P1-P6) and middle room (M1-M3) gives one. Grid: P1 M1 P2 / P3 M2 P4 / P5 M3 P6.
// Builds the journal "E11 Sanitorium Fragments" (nine player pages + the whole picture for the GM) and links each room page's
// Resolution to its piece. Run it after the room scripts (a room script rerun rewrites its page without the link). Safe to re-run.
const MOD = "faight-anchester-by-torchlight", NAME = "E11 Infinite Dreams", TOP = "Faight: Anchester by Torchlight", FR = "E11 Sanitorium Fragments";
const IMG = k => `modules/${MOD}/assets/journals/abtl-e11-fragment-${k}`;
const nest = async (type, path) => { let p = null; for (const n of path) { let f = game.folders.find(x => x.type === type && x.name === n && (x.folder?.id ?? null) === (p?.id ?? null)); if (!f) f = await Folder.create({ name: n, type, folder: p?.id ?? null }); p = f; } return p; };
const jf = await nest("JournalEntry", [TOP, NAME]);
for (const old of game.journal.filter(e => e.name === FR)) await old.delete();
const PIECES = [["P1", "Elias", "top left"], ["M1", "Elias and Sister Curie", "top middle"], ["P2", "Sister Curie", "top right"], ["P3", "Isra", "middle left"],
  ["M2", "Isra and Frag", "centre"], ["P4", "Frag", "middle right"], ["P5", "Vincent", "bottom left"], ["M3", "Vincent and Sara", "bottom middle"], ["P6", "Sara", "bottom right"]];
const j = await JournalEntry.create({ name: FR, folder: jf.id, ownership: { default: 0 }, flags: { [MOD]: { adventure: "E11", role: "handouts" } } });
await j.createEmbeddedDocuments("JournalEntryPage", [
  ...PIECES.map(([k, who, where], i) => ({ name: `Fragment ${k}`, type: "image", src: `${IMG(k.toLowerCase())}.png`, sort: (i + 1) * 1000,
    image: { caption: `A torn piece of a picture (${k}, ${who}).` }, flags: { [MOD]: { fragment: k, grid: where } } })),
  { name: "The Whole Picture (GM)", type: "image", src: `${IMG("whole")}.jpg`, sort: 20000, image: { caption: "The ritual chamber in the basement of Hawthorne Greens. GM only: do not show until the players have put the pieces together." } }]);
const link = k => { const p = j.pages.find(p => p.name === `Fragment ${k}`); return `@UUID[${p.uuid}]{Fragment ${k}}`; };
const report = { pages: j.pages.size, linked: [] };
const ej = game.journal.find(e => e.name === NAME && e.folder?.id === jf.id);
for (const [k] of PIECES) {
  const pg = ej?.pages.find(p => p.name.startsWith(`${k}.`)); if (!pg) continue;
  let c = pg.text.content;
  if (c.includes(`{Fragment ${k}}`)) { report.linked.push(k + " (already)"); continue; }
  c = c.replace("a fragment of the Sanitorium picture", `${link(k)} of the Sanitorium picture`).replace(`Fragment ${k} of the Sanitorium picture`, `${link(k)} of the Sanitorium picture`);
  if (c.includes(`{Fragment ${k}}`)) { await pg.update({ "text.content": c }); report.linked.push(k); }
}
report;
