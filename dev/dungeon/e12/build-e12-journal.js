// Build the E12 journals and the plaque map notes. Expects window.__e12j = {pages, handouts}.
const MOD = 'faight-anchester-by-torchlight';
const D = window.__e12j;
const root = game.folders.get('KTfqJwJWPeSPqOAx');
let f = game.folders.find(x => x.type === 'JournalEntry' && x.name === 'E12 Can I Play With Madness');
if (!f) f = await Folder.create({ name: 'E12 Can I Play With Madness', type: 'JournalEntry', folder: root.id, sorting: 'm' });
async function upsert(name, pages, sort) {
  let j = game.journal.find(x => x.name === name && x.folder?.id === f.id);
  const data = pages.map((p, i) => ({ name: p.name, type: 'text', sort: (i + 1) * 100, text: { content: p.html, format: 1 }, title: { show: true, level: 1 } }));
  if (j) { await j.deleteEmbeddedDocuments('JournalEntryPage', j.pages.map(p => p.id)); await j.createEmbeddedDocuments('JournalEntryPage', data); }
  else j = await JournalEntry.create({ name, folder: f.id, sort, pages: data, flags: { [MOD]: { adventure: 'E12' } } });
  return j;
}
const main = await upsert('E12 Can I Play With Madness', D.pages, 100);
const ho = await upsert('E12 Handouts', D.handouts, 200);
await ho.update({ 'ownership.default': CONST.DOCUMENT_OWNERSHIP_LEVELS.OBSERVER });
// map notes on the plaque, each opening its room page
const plaque = game.scenes.get('ZkHbGi5SnQpGufR7');
const old = plaque.notes.filter(n => n.flags?.[MOD]?.part === 'room-note').map(n => n.id);
if (old.length) await plaque.deleteEmbeddedDocuments('Note', old);
const pg = n => main.pages.find(p => p.name.startsWith(n + '.'));
const spots = [['3', 1600, 1300, '12.02 Entrance Hall'], ['4', 1415, 1460, '12.03 Matron\'s Office'], ['5', 1600, 1470, '12.04 Reception Room'],
  ['8', 1780, 1460, '12.07 Consulting Room'], ['9', 1955, 1460, '12.08 Laboratory'], ['10', 1595, 680, '12.09 Kitchen'],
  ['11', 1520, 480, '12.10 Disinfector and Yard'], ['6', 690, 690, '12.05 Patient Rooms'], ['7', 2480, 1400, '12.06 Day Corridor'], ['12', 560, 1340, '12.11 Day Corridor West'], ['13', 2750, 610, '12.12 The Doctor\'s Rooms']];
const notes = spots.map(([n, x, y, text]) => ({ x, y, entryId: main.id, pageId: pg(n).id, text, iconSize: 56, fontSize: 28, textAnchor: 1,
  texture: { src: 'icons/svg/book.svg', tint: '#b388ff' }, global: false, flags: { [MOD]: { part: 'room-note' } } }));
await plaque.createEmbeddedDocuments('Note', notes);
// each room scene gets its journal page as the scene's journal
const link = { '12.02': '3', '12.03': '4', '12.04': '5', '12.05': '6', '12.06': '7', '12.07': '8', '12.08': '9', '12.09': '10', '12.10': '11', '12.11': '12', '12.12': '13' };
for (const s of game.scenes.filter(s => /^12\./.test(s.name))) {
  const n = link[s.name.slice(0, 5)];
  if (n) await s.update({ journal: main.id, journalEntryPage: pg(n).id });
  if (s.name.startsWith('12.01')) await s.update({ journal: main.id, journalEntryPage: main.pages.find(p => p.name.startsWith('Hawthorne')).id });
}
[main.id, main.pages.size, ho.id, ho.pages.size, plaque.notes.size];
