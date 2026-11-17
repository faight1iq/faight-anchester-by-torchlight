// Build E13 Fear is the Key: journals, scene folder, 13.00 landing (cloned from 12.00) and 13.01 The Basement.
// Run in the Foundry page as GM after build-e13-actors.js. Rebuilds in place.
const MOD = 'faight-anchester-by-torchlight';
const BASE = `modules/${MOD}/dev/dungeon/e13/`;
const get = async f => (await fetch('/' + BASE + f + '?' + Date.now(), { cache: 'no-store' })).json();
const D = await get('e13-scene.json'), PAGES = await get('e13-journal.json'), HAND = await get('e13-handouts.json');
const actorBySlug = s => game.actors.find(a => a.flags?.[MOD]?.slug === s);

// ---------- journals ----------
const jTop = game.folders.find(f => f.type === 'JournalEntry' && f.name === 'Faight: Anchester by Torchlight');
let jf = game.folders.find(f => f.type === 'JournalEntry' && f.name === 'E13 Fear is the Key');
if (!jf) jf = await Folder.create({ name: 'E13 Fear is the Key', type: 'JournalEntry', folder: jTop?.id ?? null, sorting: 'a' });
const link = h => h.replace(/\{\{actor:([^|}]+)\|([^}]+)\}\}/g, (m, slug, txt) => { const a = actorBySlug(slug); return a ? `@UUID[Actor.${a.id}]{${txt}}` : txt; });
async function journal(name, pages, ownership) {
  let j = game.journal.find(x => x.name === name && x.folder?.id === jf.id);
  if (j) await j.deleteEmbeddedDocuments('JournalEntryPage', j.pages.map(p => p.id));
  else j = await JournalEntry.create({ name, folder: jf.id, ownership: ownership ?? { default: 0 }, flags: { [MOD]: { adventure: 'E13' } } });
  await j.createEmbeddedDocuments('JournalEntryPage', pages.map((p, i) => ({ name: p.name, type: 'text', sort: (i + 1) * 100, text: { content: link(p.html), format: 1 } })));
  return j;
}
const J = await journal('E13 Fear is the Key', PAGES);
const H = await journal('E13 Handouts', HAND, { default: 2 });

// ---------- scene folder ----------
const s12 = game.scenes.get('vUxHCh5yq3CIMn0a');
let sf = game.folders.find(f => f.type === 'Scene' && f.name === 'EP13: Fear is the Key');
if (!sf) sf = await Folder.create({ name: 'EP13: Fear is the Key', type: 'Scene', folder: s12.folder?.folder?.id ?? null, sorting: 'a' });

// ---------- 13.00 landing ----------
let land = game.scenes.find(s => s.name === '13.00 Fear is the Key');
if (!land) {
  const data = s12.toObject(); delete data._id;
  data.name = '13.00 Fear is the Key'; data.navName = 'Fear is the Key'; data.folder = sf.id; data.active = false; data.navigation = true;
  data.background.src = `modules/${MOD}/assets/scenes/abtl-e13-13-00-landing-page.webp`;
  data.tokens = []; data.notes = [];
  foundry.utils.setProperty(data, `flags.${MOD}.adventure`, 'E13');
  land = await Scene.create(data);
}
await land.update({ journal: J.id, journalEntryPage: J.pages.find(p => p.name.startsWith('13.00')).id });

// ---------- 13.01 The Basement ----------
let sc = game.scenes.find(s => s.name === '13.01 The Basement');
const sceneData = {
  name: '13.01 The Basement', navName: 'The Basement', folder: sf.id, navigation: true, width: D.W, height: D.H, padding: 0,
  background: { src: `modules/${MOD}/assets/scenes/abtl-e13-basement.webp` },
  grid: { type: 1, size: 100, distance: 2.5, units: 'ft', alpha: 0.12 },
  tokenVision: true, fog: { exploration: true },
  environment: { darknessLevel: 0.8, globalLight: { enabled: false } },
  journal: J.id, journalEntryPage: J.pages.find(p => p.name.startsWith('13.00')).id,
  flags: { [MOD]: { adventure: 'E13', role: 'dungeon-scene', slug: 'e13-basement', entrance: { x: D.entrance[0], y: D.entrance[1] } } },
};
if (sc) {
  await sc.update(sceneData);
  for (const k of ['Wall', 'AmbientLight', 'Note', 'Token']) { const c = sc.getEmbeddedCollection(k); if (c.size) await sc.deleteEmbeddedDocuments(k, c.map(d => d.id)); }
} else sc = await Scene.create(sceneData);

await sc.createEmbeddedDocuments('Wall', D.walls.map(w => ({ c: w.c, door: w.door ?? 0, ds: w.ds ?? 0 })));
const ftpx = 40;
await sc.createEmbeddedDocuments('AmbientLight', D.lights.map(([x, y, dim, bright, color, alpha, anim]) => ({ x, y,
  config: { dim, bright, color, alpha, attenuation: 0.6, animation: anim ? { type: anim, speed: 3, intensity: 4 } : {} }, flags: { [MOD]: { part: 'e13-light' } } })));
await sc.createEmbeddedDocuments('Note', D.notes.map(([x, y, text, n]) => ({ x, y, entryId: J.id, pageId: J.pages.find(p => p.name.startsWith(n)).id, text,
  iconSize: 64, fontSize: 28, texture: { src: 'icons/svg/book.svg', tint: '#b388ff' }, flags: { [MOD]: { part: 'e13-note' } } })));
const toks = [];
const counts = {};
for (const [slug, xf, yf] of D.tokens) {
  const a = actorBySlug(slug); if (!a) { toks.push({ missing: slug }); continue; }
  const t = (await a.getTokenDocument()).toObject();
  const size = slug === 'the-machine' ? 6 : t.width;
  counts[slug] = (counts[slug] ?? 0) + 1;
  Object.assign(t, { x: Math.round(xf * ftpx - size * 50), y: Math.round(yf * ftpx - size * 50), width: size, height: size, hidden: slug !== 'the-machine', actorLink: false,
    name: a.name + (D.tokens.filter(d => d[0] === slug).length > 1 ? ' ' + counts[slug] : '') });
  if (slug === 'the-machine') Object.assign(t, { alpha: 0.3, disposition: 0, displayName: 0 });
  foundry.utils.setProperty(t, `flags.${MOD}.room`, slug);
  toks.push(t);
}
await sc.createEmbeddedDocuments('Token', toks.filter(t => !t.missing));
const th = await sc.createThumbnail(); await sc.update({ thumb: th.thumb });
return { journal: [J.id, J.pages.size], handouts: [H.id, H.pages.size], landing: land.id, scene: [sc.id, sc.walls.size, sc.lights.size, sc.notes.size, sc.tokens.size], missing: toks.filter(t => t.missing) };
