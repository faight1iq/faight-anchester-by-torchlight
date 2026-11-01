// Rebuild every Adventure in the module's Adventure pack from adventures.json, keeping each Adventure's
// current cover, caption, description and sort. Run in the Foundry console as GM:
//   const run = new (Object.getPrototypeOf(async function(){}).constructor)(await (await fetch('/modules/faight-anchester-by-torchlight/dev/dungeon/adventures/rebuild-all.js?'+Date.now(),{cache:'no-store'})).text());
//   await run();
const M = 'faight-anchester-by-torchlight', BASE = `/modules/${M}/dev/dungeon/adventures`;
const src = await (await fetch(`${BASE}/build-adventure.js?${Date.now()}`, { cache: 'no-store' })).text();
const build = new (Object.getPrototypeOf(async function () {}).constructor)('cfg', src);
const CFG = await (await fetch(`${BASE}/adventures.json?${Date.now()}`, { cache: 'no-store' })).json();
const pack = game.packs.get(`${M}.${M}`);
const existing = Object.fromEntries((await pack.getDocuments()).map(a => [a.flags[M]?.adventure, a]));
const out = [];
for (const c of CFG) {
  const old = existing[c.code];
  const cfg = { ...c, img: old?.img, caption: old?.caption, description: old?.description, sort: old?.sort ?? 0 };
  cfg.extraJournals = (c.extraJournalNames || []).map(n => game.journal.getName(n)?.id).filter(Boolean);
  cfg.extraActors = (c.extraActorFolderNames || []).flatMap(([fid, names]) => names.map(n => game.folders.get(fid)?.contents.find(a => a.name === n)?.id)).filter(Boolean);
  cfg.extraScenes = (c.extraSceneFolderDocs || []).flatMap(fid => game.scenes.filter(s => s.folder?.id === fid).map(s => s.id));
  if (c.allPlaylists) cfg.extraPlaylists = game.playlists.map(p => p.id);
  try { const r = await build(cfg); out.push(`${c.code}: ${r.scenes.length} sc, ${r.journals.length} jo, ${r.actors} ac, dropped ${r.dropped.length}`); }
  catch (e) { out.push(`${c.code}: ERROR ${e.message}`); }
}
return out;
