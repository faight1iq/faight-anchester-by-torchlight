// P6 Portrait Parlour: three velvet drapes along the south wall a hiding character can use (John, 2026-11-06).
// Each drape: tile (flag part p6-drape-<n>) + a sight-blocking curtain wall (no movement block). Clicking a drape tile (GM)
// sweeps it aside: tile hidden, wall stops blocking sight; click again to hang it back. Also adds the Posing Man feature
// "Behind the Velvet" and the P6 page text. Idempotent.
const MOD = "faight-anchester-by-torchlight", SCENE = "EA2UdK9qQFbqbj3B";
const sc = game.scenes.get(SCENE); const report = [];
const old = sc.tiles.filter(t => /^p6-drape-/.test(t.flags?.[MOD]?.part ?? "")).map(t => t.id);
if (old.length) await sc.deleteEmbeddedDocuments("Tile", old);
const oldW = sc.walls.filter(w => /^p6-drape-/.test(w.flags?.[MOD]?.part ?? "")).map(w => w.id);
if (oldW.length) await sc.deleteEmbeddedDocuments("Wall", oldW);
const X0 = 517, Y = 2740, W = 60, H = 50;
const code = n => `const MOD="${MOD}"; const sc=canvas.scene; const part="p6-drape-${n}";
const t=sc.tiles.find(x=>x.flags?.[MOD]?.part===part); const up=!(t.flags?.[MOD]?.down);
await t.update({alpha: up ? 0.15 : 1, ["flags."+MOD+".down"]: up});
for (const w of sc.walls.filter(x=>x.flags?.[MOD]?.part===part)) await w.update({sight: up ? 0 : 20, light: up ? 0 : 20});
ui.notifications.info(up ? "Drape ${n} swept aside." : "Drape ${n} hung back.");`;
const tiles = [1, 2, 3].map(n => ({
  texture: { src: `modules/${MOD}/assets/scenes/abtl-e11-drape.webp` }, x: X0 + (n - 1) * W, y: Y, width: W, height: H, sort: 103,
  flags: { [MOD]: { part: `p6-drape-${n}`, down: false },
    "monks-active-tiles": { active: true, controlled: "gm", trigger: ["click"], restriction: "all", pertoken: false, minrequired: 0,
      actions: [{ action: "runcode", data: { code: code(n) }, id: foundry.utils.randomID() }] } } }));
await sc.createEmbeddedDocuments("Tile", tiles);
const yc = Y + Math.round(0.34 * H);
await sc.createEmbeddedDocuments("Wall", [1, 2, 3].map(n => ({ c: [X0 + (n - 1) * W, yc, X0 + n * W, yc], move: 0, sight: 20, light: 20, sound: 0,
  flags: { [MOD]: { part: `p6-drape-${n}` } } })));
report.push("3 drapes + curtain walls");
const pm = game.actors.find(a => a.name === "Posing Man" && a.flags?.[MOD]?.adventure === "E11");
const FEAT = "<p><strong><em>Behind the Velvet.</em></strong> Three velvet drapes hang along the south wall. A creature behind one is Heavily Obscured from the Posing Man and can Hide there; he can't use Hold Still on a creature he can't see. Once on each of his turns, as he moves past a drape, he can sweep it aside (no action). A creature behind it is found, and he can attack it.</p>";
const f = pm.items.getName("Behind the Velvet");
if (f) await f.update({ "system.description.value": FEAT });
else await pm.createEmbeddedDocuments("Item", [{ name: "Behind the Velvet", type: "feat", system: { type: { value: "monster" }, description: { value: FEAT } } }]);
report.push("Posing Man: Behind the Velvet");
const j = game.journal.getName("E11 Infinite Dreams"); const p = j.pages.getName("P6. The Portrait Parlour"); let c = p.text.content;
const RA = "A wooden bellows camera on a tripod faces the chairs, its black hood hanging.";
if (!c.includes("Heavy velvet drapes")) c = c.replace(RA, RA + " Heavy velvet drapes, deep red, hang in three sections along the south wall.");
const PLAY = `<p><strong>The drapes (hiding).</strong> A creature behind a drape is Heavily Obscured from the Posing Man and can Hide there. While the dreamer is hidden, he can't use Hold Still on them. Attacking from behind a drape gives Advantage and reveals the attacker; a rogue can Hide again with Cunning Action. Once on each of his turns, as he moves past a drape, the Posing Man sweeps it aside: click the drape (GM) and it falls. Anyone behind it is found, and he can attack them that turn. With all three drapes down, there is nowhere left to hide.</p>\n`;
if (!c.includes("The drapes (hiding)")) c = c.replace("<p>Don't point out the chair or the sitters.", PLAY + "<p>Don't point out the chair or the sitters.");
await p.update({ "text.content": c }); report.push(c.includes("The drapes (hiding)") && c.includes("Heavy velvet drapes") ? "P6 page ok" : "P6 page MISS");
report;
