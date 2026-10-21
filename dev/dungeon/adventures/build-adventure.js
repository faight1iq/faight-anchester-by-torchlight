// Build one episode Adventure in the module's Adventure compendium.
// Run in the Foundry page console as GM:
//   const run = new (Object.getPrototypeOf(async function(){}).constructor)("cfg",
//     await (await fetch('/modules/faight-anchester-by-torchlight/dev/dungeon/adventures/build-adventure.js?'+Date.now())).text());
//   await run({ code:'E01', name:'E01: Fear of the Dark', sceneFolders:[id], journalFolders:[id], actorFolders:[id], ... });
//
// cfg fields:
//   code            short key stored in flags (an existing Adventure with the same code is replaced)
//   name            Adventure name, also the name of its root folders
//   sceneFolders, journalFolders, actorFolders, playlistFolders   world folder ids (subfolders included)
//   extraScenes, extraJournals, extraActors, extraPlaylists       world document ids
//   img, caption, description   cover and text (img defaults to the first scene's background)
//   sort            sort order in the compendium
//   dry             true = report only, write nothing
//
// What it pulls in automatically:
//   - every actor that has a token on an included scene (Core NPCs travel with the episode)
//   - each scene's linked journal and the journals its map notes point to
//   - each scene's playlist
//   - actors linked from included journals with @UUID[Actor.id]
// Every copied document gets a new id. Every reference to an old id inside the copies
// (tokens, notes, @UUID links, Monk's Active Tiles actions, Token Attacher data) is rewritten.

const M = 'faight-anchester-by-torchlight';
const PACK = `${M}.${M}`;
const ID = /^[A-Za-z0-9]{16}$/;

const subIds = (ids = []) => {
  const out = new Set();
  for (const id of ids) {
    const f = game.folders.get(id);
    if (!f) throw new Error(`No folder ${id}`);
    out.add(f.id);
    for (const s of f.getSubfolders(true)) out.add(s.id);
  }
  return out;
};
const inFolders = (coll, ids) => { const s = subIds(ids); return coll.filter(d => d.folder && s.has(d.folder.id)); };

const scenes = new Map(), journals = new Map(), actors = new Map(), playlists = new Map();
// Source-tracking ids (_stats.compendiumSource, duplicateSource, exportSource) point at the
// documents a copy was made from. They are not real links, so they are cleared everywhere.
const strip = o => {
  if (Array.isArray(o)) { o.forEach(strip); return o; }
  if (o && typeof o === 'object') {
    if (o._stats) { o._stats.compendiumSource = null; o._stats.duplicateSource = null; o._stats.exportSource = null; }
    if (o.flags?.core?.sourceId) delete o.flags.core.sourceId;
    for (const v of Object.values(o)) strip(v);
  }
  return o;
};
const clean = d => strip(d.toObject());
const add = (map, doc) => { if (doc && !map.has(doc.id)) map.set(doc.id, doc); };

inFolders(game.scenes, cfg.sceneFolders).forEach(d => add(scenes, d));
(cfg.extraScenes || []).forEach(id => add(scenes, game.scenes.get(id)));
inFolders(game.journal, cfg.journalFolders).forEach(d => add(journals, d));
(cfg.extraJournals || []).forEach(id => add(journals, game.journal.get(id)));
inFolders(game.actors, cfg.actorFolders).forEach(d => add(actors, d));
(cfg.extraActors || []).forEach(id => add(actors, game.actors.get(id)));
inFolders(game.playlists, cfg.playlistFolders).forEach(d => add(playlists, d));
(cfg.extraPlaylists || []).forEach(id => add(playlists, game.playlists.get(id)));

const pulled = { actors: [], journals: [], playlists: [] };
const missing = [];
const dropped = []; // player-character tokens: test tokens, never shipped
for (const s of scenes.values()) {
  for (const t of s.tokens) {
    if (!t.actorId) continue;
    const a = game.actors.get(t.actorId);
    if (!a) { missing.push(`token ${t.name} on ${s.name}: actor ${t.actorId} not in world`); continue; }
    if (a.type === 'character') { dropped.push(`${t.name} on ${s.name}`); continue; }
    if (!actors.has(a.id)) { add(actors, a); pulled.actors.push(a.name); }
  }
  const js = [s.journal?.id, ...s.notes.map(n => n.entryId)].filter(Boolean);
  for (const jid of js) {
    const j = game.journal.get(jid);
    if (!j) { missing.push(`journal ${jid} on ${s.name}`); continue; }
    if (!journals.has(j.id)) { add(journals, j); pulled.journals.push(j.name); }
  }
  if (s.playlist && !playlists.has(s.playlist.id)) { add(playlists, s.playlist); pulled.playlists.push(s.playlist.name); }
}
// Actors named by id anywhere in the copies (journal links, Monk's Active Tiles spawns,
// Token Attacher data, actor descriptions). Repeat until nothing new turns up.
for (let grew = true; grew;) {
  grew = false;
  for (const d of [...scenes.values(), ...journals.values(), ...actors.values()]) {
    const txt = JSON.stringify(clean(d));
    for (const m of txt.matchAll(/Actor\.([A-Za-z0-9]{16})/g)) {
      const a = game.actors.get(m[1]);
      if (a && a.type !== 'character' && !actors.has(a.id)) { add(actors, a); pulled.actors.push(`${a.name} (linked from ${d.name})`); grew = true; }
    }
  }
}

// New ids for every top-level document and the root folders.
const map = new Map();
const nid = old => { if (!map.has(old)) map.set(old, foundry.utils.randomID()); return map.get(old); };
for (const c of [scenes, journals, actors, playlists]) for (const id of c.keys()) nid(id);

const folders = [];
const root = type => { const f = { _id: foundry.utils.randomID(), name: cfg.name, type, folder: null, sorting: 'a', sort: 0, color: null, flags: {} }; folders.push(f); return f._id; };
const prep = (coll, type) => {
  if (!coll.size) return [];
  const fid = root(type);
  let i = 0;
  return [...coll.values()].map(d => { const o = clean(d); o.folder = fid; o.sort = (i++) * 100000; return o; });
};
const data = {
  scenes: prep(scenes, 'Scene').map(o => { o.tokens = o.tokens.filter(t => game.actors.get(t.actorId)?.type !== 'character'); return o; }),
  journal: prep(journals, 'JournalEntry'),
  actors: prep(actors, 'Actor'),
  playlists: prep(playlists, 'Playlist'),
};

// Rewrite every old id to its new id, inside all copies.
let text = JSON.stringify(data);
const outside = new Set();
// Whole-id matches only, and never a file name such as "<sceneId>-thumb.webp".
text = text.replace(/(?<![A-Za-z0-9])([A-Za-z0-9]{16})(?![A-Za-z0-9-])/g, (m, id) => map.get(id) || m);
const out = JSON.parse(text);
// References to documents of the same kinds that are not in this Adventure (left as they are).
for (const m of text.matchAll(/(Scene|JournalEntry|Actor)\.([A-Za-z0-9]{16})/g)) {
  const kind = m[1], id = m[2];
  const inside = [...map.values()].includes(id);
  if (!inside && (kind === 'Scene' ? game.scenes.get(id) : kind === 'Actor' ? game.actors.get(id) : game.journal.get(id))) outside.add(`${kind}.${id} ${(kind === 'Scene' ? game.scenes.get(id) : kind === 'Actor' ? game.actors.get(id) : game.journal.get(id)).name}`);
}

// Cover: the wide 1536x600 crop of the landing page's top banner, by naming convention.
const coverPath = `modules/${M}/assets/scenes/adventure-covers/abtl-${String(cfg.code).toLowerCase().replace('.', '-')}-adventure-cover.webp`;
const cover = (await fetch(coverPath, { method: 'HEAD' })).ok ? coverPath : null;
const firstScene = [...scenes.values()].sort((a, b) => a.name.localeCompare(b.name))[0];
const adv = {
  name: cfg.name,
  img: cfg.img || cover || firstScene?.background?.src || null,
  caption: cfg.caption || '',
  description: cfg.description || '',
  sort: cfg.sort ?? 0,
  folders,
  ...out,
  items: [], tables: [], macros: [], cards: [], combats: [],
  flags: { [M]: { adventure: cfg.code } },
};

const report = {
  name: cfg.name, img: adv.img,
  scenes: [...scenes.values()].map(d => d.name).sort(),
  journals: [...journals.values()].map(d => d.name).sort(),
  actors: actors.size, playlists: [...playlists.values()].map(d => d.name),
  pulled, missing, dropped, linksOutside: [...outside],
};
if (cfg.dry) return report;

const pack = game.packs.get(PACK);
const wasLocked = pack.locked;
if (wasLocked) await pack.configure({ locked: false });
try {
  const idx = await pack.getIndex({ fields: ['flags'] });
  const old = idx.filter(e => e.flags?.[M]?.adventure === cfg.code).map(e => e._id);
  if (old.length) await Adventure.deleteDocuments(old, { pack: PACK });
  const [doc] = await Adventure.createDocuments([adv], { pack: PACK });
  report.id = doc.id;
} finally {
  if (wasLocked) await pack.configure({ locked: true });
}
return report;
