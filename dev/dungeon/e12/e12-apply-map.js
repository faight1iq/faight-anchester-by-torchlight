// window.__apply(sceneId, file, wallsFile, W, H, lights[], tokenMoves{nameStartsWith:[x,y]}, notes[[x,y,text,pageN]])
window.__apply = async function (sceneId, imgFile, wallsFile, W, H, lights, moves, notes) {
  const MOD = 'faight-anchester-by-torchlight';
  const FP = foundry.applications.apps.FilePicker.implementation;
  await FP.upload('data', 'modules/faight-anchester-by-torchlight/assets/scenes', imgFile, {}, { notify: false });
  const walls = JSON.parse(await wallsFile.text()).map(w => ({ c: w.c, door: w.door ?? 0, ds: w.ds ?? 0 }));
  const s = game.scenes.get(sceneId);
  await s.deleteEmbeddedDocuments('Wall', s.walls.map(w => w.id));
  await s.deleteEmbeddedDocuments('AmbientLight', s.lights.map(w => w.id));
  await s.update({ width: W, height: H, 'background.src': 'modules/faight-anchester-by-torchlight/assets/scenes/' + imgFile.name });
  await s.createEmbeddedDocuments('Wall', walls);
  const L = lights.map(([x, y, dim, bright, color, alpha, anim]) => ({ x, y, config: { dim, bright, color, alpha: alpha ?? 0.35, attenuation: 0.6, animation: anim ? { type: anim, speed: 3, intensity: 4 } : {} }, flags: { [MOD]: { part: 'e12-light' } } }));
  await s.createEmbeddedDocuments('AmbientLight', L);
  const ups = [];
  for (const t of s.tokens) { const k = Object.keys(moves).find(k => t.name.startsWith(k)); if (k) { const m = moves[k]; const p = Array.isArray(m[0]) ? m.shift() : m; ups.push({ _id: t.id, x: p[0], y: p[1] }); } }
  await s.updateEmbeddedDocuments('Token', ups);
  const J = game.journal.getName('E12 Can I Play With Madness');
  await s.deleteEmbeddedDocuments('Note', s.notes.map(n => n.id));
  await s.createEmbeddedDocuments('Note', notes.map(([x, y, text, n]) => ({ x, y, entryId: J.id, pageId: J.pages.find(p => p.name.startsWith(n + '.')).id, text, iconSize: 48, fontSize: 24, texture: { src: 'icons/svg/book.svg', tint: '#b388ff' }, flags: { [MOD]: { part: 'e12-note' } } })));
  const t = await s.createThumbnail(); await s.update({ thumb: t.thumb });
  return [s.name, s.walls.size, s.lights.size, s.notes.size, s.tokens.map(t => [t.name, t.x, t.y])];
};
'ok';
