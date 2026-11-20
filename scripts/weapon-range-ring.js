/**
 * Weapon reach ring — during an active encounter, draws a red magic circle with a red glow under
 * the player character whose turn it is, sized to the reach of their main melee weapon
 * (Foundry 13, dnd5e). Ranged weapons and spells are ignored.
 *
 * Drop this file in any module and list it in module.json "esmodules". No settings.
 * Circle art: RING_TEXTURE (transparent WebP whose outer ring touches the image edges).
 *
 * Radius = weapon range + half the token's width, measured from the token centre, so a Medium
 * creature with a 5 ft melee weapon gets a 7.5 ft radius ring that covers every square it can hit.
 *
 * Main weapon: an equipped melee weapon, preferring (in order) one on the sheet's favorites, a
 * non-natural weapon over Unarmed Strike and natural weapons, then sheet order.
 * Reach: the weapon's reach, else 10 ft with the Reach property, else 5 ft. No equipped melee
 * weapon means no ring.
 *
 * Only combatants with a player owner get a ring. The ring is drawn locally on every client
 * (no documents are created), sits below tokens, follows the token as it moves, and is shown only
 * on clients that can currently see the token.
 */

const RING_TEXTURE = "modules/faight-anchester-by-torchlight/assets/ui/weapon-range-ring.webp";
const RING_ALPHA = 0.9;
const GLOW_COLOR = [0.85, 0.08, 0.08, 1]; // red, RGBA 0..1
const GLOW_DISTANCE = 10;                 // glow spread in screen pixels
const GLOW_QUALITY = 0.1;

let ring = null;
let drawSerial = 0; // guards against an older async draw finishing after a newer one

function isRangedWeapon(item) {
  return item.system.attackType === "ranged" || /R$/.test(item.system.type?.value ?? "");
}

function mainWeapon(actor) {
  // Melee weapons only (thrown melee weapons such as daggers count, at their reach).
  const weapons = actor.items.filter(i => i.type === "weapon" && i.system.equipped && !isRangedWeapon(i));
  if (!weapons.length) return null;
  const favorites = (actor.system.favorites ?? []).map(f => f.id ?? "");
  const isFavorite = i => favorites.some(id => id.endsWith(`.Item.${i.id}`));
  const isNatural = i => i.system.type?.value === "natural";
  const score = i => (isFavorite(i) ? 0 : 2) + (isNatural(i) ? 1 : 0);
  return [...weapons].sort((a, b) => score(a) - score(b) || (a.sort ?? 0) - (b.sort ?? 0))[0];
}

function weaponReachFeet(item) {
  return Number(item.system.range?.reach) || (item.system.properties?.has?.("rch") ? 10 : 5);
}

function clearRing() {
  if (!ring) return;
  ring.parent?.removeChild(ring);
  ring.destroy({ children: true }); // keeps the shared texture
  ring = null;
}

async function drawRing() {
  const serial = ++drawSerial;
  clearRing();
  const combat = game.combat;
  if (!canvas?.ready || !combat?.started) return;
  // TokenDocument#object only exists for the scene currently on the canvas, which also covers
  // encounters that are not linked to a scene.
  const token = combat.combatant?.token?.object;
  const actor = token?.actor;
  if (!token || !actor?.hasPlayerOwner || token.document.hidden) return;
  const weapon = mainWeapon(actor);
  if (!weapon) return;

  const grid = canvas.scene.grid;
  const pxPerFt = grid.size / grid.distance;
  const halfTokenFt = (token.document.width * grid.distance) / 2;
  const radius = (weaponReachFeet(weapon) + halfTokenFt) * pxPerFt;
  if (!(radius > 0)) return;

  const texture = await foundry.canvas.loadTexture(RING_TEXTURE);
  if (serial !== drawSerial || !texture || token.destroyed) return;

  const sprite = new foundry.canvas.primary.PrimarySpriteMesh(texture);
  sprite.anchor.set(0.5, 0.5);
  sprite.width = sprite.height = radius * 2;
  sprite.alpha = RING_ALPHA;
  sprite.sortLayer = foundry.canvas.groups.PrimaryCanvasGroup.SORT_LAYERS.TOKENS - 1;
  sprite.elevation = token.document.elevation;
  sprite.eventMode = "none";
  sprite.filters = [foundry.canvas.rendering.filters.GlowOverlayFilter.create({
    glowColor: GLOW_COLOR, distance: GLOW_DISTANCE, quality: GLOW_QUALITY, knockout: false
  })];
  sprite.tokenId = token.id;

  ring = sprite;
  canvas.primary.addChild(ring);
  placeRing(token);
}

function placeRing(token) {
  if (!ring || token.isPreview || token.id !== ring.tokenId) return;
  // Token#center follows the animated position in v13, so the ring travels with the token.
  const c = token.center;
  ring.position.set(c.x, c.y);
  ring.elevation = token.document.elevation;
  // Respect this client's vision and fog: no ring for a token this client cannot see.
  ring.visible = token.visible && !token.document.hidden;
}

function isActiveActor(item) {
  return item.parent?.id && item.parent.id === game.combat?.combatant?.actor?.id;
}

Hooks.on("canvasReady", () => drawRing());
Hooks.on("canvasTearDown", () => { drawSerial++; clearRing(); });
Hooks.on("combatStart", () => drawRing());
Hooks.on("updateCombat", () => drawRing());
Hooks.on("deleteCombat", () => drawRing());
Hooks.on("updateCombatant", () => drawRing());
Hooks.on("deleteCombatant", () => drawRing());
Hooks.on("refreshToken", token => placeRing(token));
// Keyed on the active combatant, not the ring: a hidden token has no ring, and un-hiding must redraw it.
Hooks.on("updateToken", doc => { if (doc.id === game.combat?.combatant?.tokenId) drawRing(); });
// Favorites live on the actor, so changing them is an actor update.
Hooks.on("updateActor", actor => { if (actor.id === game.combat?.combatant?.actor?.id) drawRing(); });
Hooks.on("createItem", item => { if (isActiveActor(item)) drawRing(); });
Hooks.on("updateItem", item => { if (isActiveActor(item)) drawRing(); });
Hooks.on("deleteItem", item => { if (isActiveActor(item)) drawRing(); });
