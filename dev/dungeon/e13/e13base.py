"""E13 base map in code: textured floors, Long Hall gutter, walls, door-mouth walls, doors, stair. 40 px per ft.
usage: python3 e13base.py <tex_dir>   -> base.png (7800x5200), base-masks.npz"""
import sys, os
import numpy as np, cv2
from PIL import Image
from shapely.geometry import LineString
from e13geo import *

TEX = sys.argv[1] if len(sys.argv) > 1 else "tex"
w, h = W * PPF, H * PPF
rng = np.random.default_rng(13)


def noise(sig, amp, shape=(h, w)):
    return cv2.GaussianBlur(rng.normal(0, 1, shape).astype(np.float32), (0, 0), sig) * amp


def tile_tex(name, ft, tint=None, rot=0):
    """Tile texture file <name> so one image covers `ft` feet."""
    p = os.path.join(TEX, f"e13tex-{name}.png")
    t = np.array(Image.open(p).convert("RGB")).astype(np.float32)
    if rot: t = np.rot90(t, rot).copy()
    n = int(round(ft * PPF)); t = cv2.resize(t, (n, n), interpolation=cv2.INTER_AREA)
    if tint is not None: t = t * np.array(tint, np.float32)
    reps = (h // n + 2, w // n + 2)
    return np.tile(t, (reps[0], reps[1], 1))[:h, :w]


def concrete():
    base = np.array([96, 94, 90], np.float32)
    g = noise(1.2, 9) + noise(6, 10) + noise(40, 14)
    img = base[None, None, :] + g[..., None]
    # expansion joints every 10 ft
    for x in range(0, w, 400): cv2.line(img, (x, 0), (x, h), (62, 60, 58), 3)
    for y in range(0, h, 400): cv2.line(img, (0, y), (w, y), (62, 60, 58), 3)
    stains = np.clip(noise(25, 3.0), 0, None)
    return img * (1 - 0.18 * np.clip(stains, 0, 1))[..., None]


def floors():
    texs = {}
    def get(kind):
        if kind in texs: return texs[kind]
        if kind == "flag": t = tile_tex("flag", 10)
        elif kind == "vault": t = tile_tex("flag", 12, tint=(0.82, 0.86, 0.80), rot=1)
        elif kind == "tile":
            t = tile_tex("tile", 8); g = t.mean(-1, keepdims=True)
            t = np.clip(0.3 * t + 0.7 * g * np.array([1.0, 1.0, 1.03], np.float32) * 1.06, 0, 255)
        elif kind == "brick": t = tile_tex("brick", 8)
        elif kind == "wood": t = tile_tex("wood", 8)
        elif kind == "concrete": t = concrete()
        texs[kind] = t; return t
    img = np.zeros((h, w, 3), np.float32); img[:] = (20, 19, 18)
    for rk, (parts, clip, kind) in REG.items():
        m = mask(region_floor(rk).buffer(0.6), PPF, w, h) > 0
        m &= ~(mask(STAIR, PPF, w, h) > 0) if rk == "r01" else m
        img[m] = get(kind)[m]
    return img


img = floors()
fl = mask(FLOOR, PPF, w, h)
# grime: darker, blotchy, stronger towards the walls
din = cv2.distanceTransform((fl > 0).astype(np.uint8), cv2.DIST_L2, 5)
grime = 0.86 + noise(30, 0.05) + noise(6, 0.025)
ao = 1 - 0.45 * np.exp(-din / (0.9 * PPF))
img *= (grime * ao)[..., None]

# Long Hall gutter: 0.8 ft channel, its centre 2 ft inside the north/east wall of the hall
line = LineString(L["halls"]["02"]["line"])
g = line.offset_curve(-(CW / 2 - 2.0), join_style=2)
gm = np.zeros((h, w), np.uint8)
gpts = np.round(np.array(g.coords) * PPF).astype(np.int32)
cv2.polylines(gm, [gpts], False, 255, int(0.8 * PPF), cv2.LINE_AA)
gm[mask(FLOOR, PPF, w, h) == 0] = 0
gm[mask(ROOMS_U, PPF, w, h) > 0] = 0
gmf = gm.astype(np.float32) / 255
edge = cv2.GaussianBlur(gmf, (0, 0), 3) - gmf
water = np.array([34, 40, 38], np.float32)[None, None, :] + noise(3, 6)[..., None] + np.clip(noise(2, 30), 0, None)[..., None] * 0.6
img = img * (1 - gmf[..., None]) + water * gmf[..., None]
img *= (1 - 0.5 * np.clip(edge * 3, 0, 1))[..., None]
lip = cv2.dilate(gm, np.ones((9, 9), np.uint8)).astype(bool) & (gm < 40)
img[lip] *= 0.7

# stair: wooden treads rising north (lighter = higher)
sx0, sy0, sx1, sy1 = [int(v * PPF) for v in L["stairs"][0]["rect"]]
n = int(round((sy1 - sy0) / (PPF * 0.85)))
for i in range(n):
    a, b = sy0 + (sy1 - sy0) * i / n, sy0 + (sy1 - sy0) * (i + 1) / n
    lum = 1.15 - 0.55 * i / max(1, n - 1)
    tread = np.array([112, 80, 52], np.float32) * lum
    seg = img[int(a):int(b), sx0:sx1]
    seg[:] = tread + noise(1.5, 6, seg.shape[:2])[..., None] + np.sin(np.arange(sx1 - sx0) / 9.0)[None, :, None] * 3
    cv2.line(img, (sx0, int(b) - 1), (sx1, int(b) - 1), (28, 19, 13), 5)          # riser shadow under each nosing
    cv2.line(img, (sx0, int(a) + 2), (sx1, int(a) + 2), (150, 112, 78), 2)       # worn nosing edge
for x in (sx0, sx1 - 22):
    cv2.rectangle(img, (x, sy0), (x + 22, sy1), (62, 42, 28), -1)               # stringers
    cv2.line(img, (x + 3, sy0), (x + 3, sy1), (88, 62, 42), 2)

# walls: band from 0.4 ft inside the floor edge to 0.9 ft outside (Foundry walls sit on the edge line)
dout = cv2.distanceTransform((fl == 0).astype(np.uint8), cv2.DIST_L2, 5)
band = (mask(FLOOR.buffer(0.9, join_style=2, mitre_limit=6), PPF, w, h) > 0) & ~(mask(FLOOR.buffer(-0.4, join_style=2, mitre_limit=6), PPF, w, h) > 0)
mw = np.zeros((h, w), np.uint8)
for p, q, kind, room, hall in doors():
    pass
mouths = [d["mouth"] for d in L["doors"]]
for m in mouths:   # wall across each door mouth, 0.75 ft
    cv2.line(mw, (int(m[0] * PPF), int(m[1] * PPF)), (int(m[2] * PPF), int(m[3] * PPF)), 255, int(0.75 * PPF), cv2.LINE_AA)
band = band | (mw > 128)
dm = np.zeros((h, w), np.uint8)
for p, q, kind, room, hall in doors():
    cv2.line(dm, tuple((p * PPF).astype(int)), tuple((q * PPF).astype(int)), 255, int(0.95 * PPF), cv2.LINE_8)
band &= dm == 0
bandf = cv2.GaussianBlur(band.astype(np.float32), (0, 0), 0.9)
# stone-block wall top
blk = np.zeros((h, w), np.float32)
for y in range(0, h, 30):
    off = 0 if (y // 30) % 2 else 22
    blk[y:y + 2, :] = 1
    for x in range(off, w, 44): blk[y:y + 30, x:x + 2] = 1
wallc = np.array([78, 73, 68], np.float32)[None, None, :] + noise(1.2, 7)[..., None] + noise(10, 6)[..., None]
wallc *= (1 - 0.35 * blk)[..., None]
inner = cv2.distanceTransform(band.astype(np.uint8), cv2.DIST_L2, 5)
wallc *= (0.62 + 0.38 * np.clip(inner / (0.3 * PPF), 0, 1))[..., None]
# soft shadow cast by the walls onto the floor
shadow = np.clip(1 - cv2.distanceTransform((~band).astype(np.uint8), cv2.DIST_L2, 5) / (0.5 * PPF), 0, 1) * 0.45
img *= (1 - shadow * (fl > 0))[..., None]
img = img * (1 - bandf[..., None]) + wallc * bandf[..., None]

# doors (closed, drawn in the mouth line): oak planks with iron straps; the Machine Ward double door with a lock plate
for p, q, kind, room, hall in doors():
    a, b = p * PPF, q * PPF
    u = (b - a) / np.linalg.norm(b - a); nn = np.array([-u[1], u[0]]); th = 0.45 * PPF
    leaves = [(a, b)] if kind == "door" else [(a, (a + b) / 2), ((a + b) / 2, b)]
    for p0, p1 in leaves:
        poly = np.array([p0 + nn * th / 2, p1 + nn * th / 2, p1 - nn * th / 2, p0 - nn * th / 2])
        cv2.fillPoly(img, [np.round(poly).astype(np.int32)], (104, 72, 46), cv2.LINE_AA)
        Ln = np.linalg.norm(p1 - p0)
        for t in np.arange(0.2, 1, 0.2):   # plank seams
            c = p0 + (p1 - p0) * t
            cv2.line(img, tuple(np.round(c + nn * th / 2).astype(int)), tuple(np.round(c - nn * th / 2).astype(int)), (60, 40, 26), 2, cv2.LINE_AA)
        for t in (0.15, 0.85):           # iron straps
            c = p0 + (p1 - p0) * t
            cv2.line(img, tuple(np.round(c + nn * th / 2).astype(int)), tuple(np.round(c - nn * th / 2).astype(int)), (46, 46, 48), 6, cv2.LINE_AA)
        cv2.polylines(img, [np.round(poly).astype(np.int32)], True, (30, 21, 14), 3, cv2.LINE_AA)
    if kind == "double":
        c = (a + b) / 2
        cv2.circle(img, tuple(np.round(c).astype(int)), 9, (150, 120, 60), -1, cv2.LINE_AA)
        cv2.circle(img, tuple(np.round(c).astype(int)), 9, (40, 30, 18), 2, cv2.LINE_AA)
    for e in (a, b):                     # stone jambs
        cv2.circle(img, tuple(np.round(e).astype(int)), int(0.3 * PPF), (70, 66, 62), -1, cv2.LINE_AA)

out = np.clip(img, 0, 255).astype(np.uint8)
Image.fromarray(out).save("base.png")
np.savez_compressed("base-masks.npz", floor=fl, band=band)
print("base", out.shape)
