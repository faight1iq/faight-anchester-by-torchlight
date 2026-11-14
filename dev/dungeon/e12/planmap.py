"""Plan-first battle maps: code owns the walls, doors, stairs and scale; ChatGPT only furnishes floors.

usage:
  python3 planmap.py plan  spec.json   -> <name>-plan.png  (for ChatGPT: dark outside, magenta floor, cyan stairs, grey walls)
  python3 planmap.py comp  spec.json render.webp  -> <name>.webp + <name>.walls.json (Foundry, px) + <name>-check.jpg

spec (all in feet):
  name, canvas [W,H], ppf (final px per foot, 40 = 100 px per 2.5 ft square), gpt [w,h] (ChatGPT output size)
  floors: [{"rect":[x0,y0,x1,y1]} | {"circle":[cx,cy,r]} | {"rect":..., "outdoor":true}]
  walls:  [[x1,y1,x2,y2], ...] interior (thick IN), outer: [[...]] (thick OUT)   (polylines allowed: x1,y1,x2,y2,x3,y3...)
  arcs:   [[cx,cy,r,a0,a1,"outer"|"inner"]]  degrees, y down
  doors:  [[x1,y1,x2,y2,"door"|"double"]]  must lie on a wall line
  stairs: [{"rect":[x0,y0,x1,y1],"dir":"n"|"s"|"e"|"w"}]   dir = the way UP
  IN, OUT: wall thickness in feet (default 1.0, 1.5)
"""
import sys, json, math
import numpy as np, cv2
from PIL import Image

mode, specf = sys.argv[1], sys.argv[2]
S = json.load(open(specf))
W, H = S["canvas"]
IN, OUT = S.get("IN", 0.75), S.get("OUT", 1.0)

def polys(pl):
    return [(pl[i], pl[i + 1]) for i in range(0, len(pl), 2)]

def arcpts(cx, cy, r, a0, a1, n=32):
    return [(cx + r * math.cos(math.radians(a0 + (a1 - a0) * i / n)), cy + r * math.sin(math.radians(a0 + (a1 - a0) * i / n))) for i in range(n + 1)]

def lines():
    L = []
    for pl in S.get("walls", []): L.append((polys(pl), IN))
    for pl in S.get("outer", []): L.append((polys(pl), OUT))
    for cx, cy, r, a0, a1, k in S.get("arcs", []): L.append((arcpts(cx, cy, r, a0, a1), OUT if k == "outer" else IN))
    return L

def masks(ppf):
    w, h = int(round(W * ppf)), int(round(H * ppf))
    floor = np.zeros((h, w), np.uint8); outdoor = np.zeros((h, w), np.uint8)
    for f in S["floors"]:
        m = outdoor if f.get("outdoor") else floor
        if "rect" in f:
            x0, y0, x1, y1 = f["rect"]; cv2.rectangle(m, (int(x0 * ppf), int(y0 * ppf)), (int(x1 * ppf), int(y1 * ppf)), 255, -1)
        else:
            cx, cy, r = f["circle"]; cv2.circle(m, (int(cx * ppf), int(cy * ppf)), int(r * ppf), 255, -1, cv2.LINE_AA)
    wall = np.zeros((h, w), np.uint8)
    for pts, t in lines():
        q = np.round(np.array(pts) * ppf).astype(np.int32)
        cv2.polylines(wall, [q], False, 255, max(2, int(round(t * ppf))), cv2.LINE_8)
    door = np.zeros((h, w), np.uint8)
    for x1, y1, x2, y2, k in S.get("doors", []):
        cv2.line(door, (int(x1 * ppf), int(y1 * ppf)), (int(x2 * ppf), int(y2 * ppf)), 255, int(OUT * ppf * 1.4))
    stair = np.zeros((h, w), np.uint8)
    for st in S.get("stairs", []):
        x0, y0, x1, y1 = st["rect"]; cv2.rectangle(stair, (int(x0 * ppf), int(y0 * ppf)), (int(x1 * ppf), int(y1 * ppf)), 255, -1)
    return w, h, floor, outdoor, wall, door, stair

if mode == "plan":
    gw, gh = S["gpt"]; ppf = gw / W
    w, h, floor, outdoor, wall, door, stair = masks(ppf)
    img = np.zeros((h, w, 3), np.uint8); img[:] = (24, 24, 24)
    img[floor > 0] = (255, 0, 255); img[outdoor > 0] = (255, 160, 0)
    img[(wall > 0) & (door == 0)] = (70, 70, 70)
    img[stair > 0] = (0, 255, 255)
    img = cv2.resize(img, (gw, gh), interpolation=cv2.INTER_NEAREST)
    Image.fromarray(img).save(S["name"] + "-plan.png"); print(S["name"] + "-plan.png", gw, gh)
    sys.exit()

# ---------- composite ----------
ppf = S.get("ppf", 40)
w, h, floor, outdoor, wall, door, stair = masks(ppf)
src = np.array(Image.open(sys.argv[3]).convert("RGB"))
img = cv2.resize(src, (w, h), interpolation=cv2.INTER_LANCZOS4).astype(np.float32)
rng = np.random.default_rng(7)
inside = ((floor > 0) | (outdoor > 0)).astype(np.uint8)
# outside the building: near-black ground
img[inside == 0] = (20, 19, 18)

# stairs: wooden treads, drawn in code (no rails in the middle)
for st in S.get("stairs", []):
    x0, y0, x1, y1 = [v * ppf for v in st["rect"]]; d = st["dir"]
    x0, y0, x1, y1 = int(x0), int(y0), int(x1), int(y1)
    horiz = d in ("e", "w")
    n = int(round(((x1 - x0) if horiz else (y1 - y0)) / (ppf * 0.9)))
    for i in range(n):
        if horiz:
            a, b = x0 + (x1 - x0) * i / n, x0 + (x1 - x0) * (i + 1) / n
            k = i / max(1, n - 1) if d == "e" else 1 - i / max(1, n - 1)
            col = np.array([118, 84, 54]) * (0.6 + 0.55 * k)
            cv2.rectangle(img, (int(a), y0), (int(b), y1), col.tolist(), -1)
            cv2.line(img, (int(b), y0), (int(b), y1), (30, 20, 14), max(3, int(ppf * 0.14)))
        else:
            a, b = y0 + (y1 - y0) * i / n, y0 + (y1 - y0) * (i + 1) / n
            k = i / max(1, n - 1) if d == "s" else 1 - i / max(1, n - 1)
            col = np.array([118, 84, 54]) * (0.6 + 0.55 * k)
            cv2.rectangle(img, (x0, int(a)), (x1, int(b)), col.tolist(), -1)
            cv2.line(img, (x0, int(b)), (x1, int(b)), (30, 20, 14), max(3, int(ppf * 0.14)))
    # stringers along the two long sides
    if horiz:
        cv2.rectangle(img, (x0, y0), (x1, y0 + int(ppf * 0.35)), (70, 48, 32), -1); cv2.rectangle(img, (x0, y1 - int(ppf * 0.35)), (x1, y1), (70, 48, 32), -1)
    else:
        cv2.rectangle(img, (x0, y0), (x0 + int(ppf * 0.35), y1), (70, 48, 32), -1); cv2.rectangle(img, (x1 - int(ppf * 0.35), y0), (x1, y1), (70, 48, 32), -1)
    # grain
    reg = img[y0:y1, x0:x1]; reg += cv2.GaussianBlur(rng.normal(0, 1, reg.shape[:2]).astype(np.float32), (0, 0), 1.5)[..., None] * 6
    # arrow showing UP
    cx, cy = (x0 + x1) // 2, (y0 + y1) // 2; L = int(min(x1 - x0, y1 - y0) * 0.3)
    v = {"n": (0, -1), "s": (0, 1), "e": (1, 0), "w": (-1, 0)}[d]
    cv2.arrowedLine(img, (cx - v[0] * L, cy - v[1] * L), (cx + v[0] * L, cy + v[1] * L), (230, 220, 200), max(2, int(ppf * 0.1)), cv2.LINE_AA, 0, 0.35)

# walls a little thicker than the plan, to cover any wall faces ChatGPT painted
wm = np.zeros((h, w), np.uint8)
for pts, t in lines():
    q = np.round(np.array(pts) * ppf).astype(np.int32)
    cv2.polylines(wm, [q], False, 255, int(round((t + 0.3) * ppf)), cv2.LINE_AA)
dm = np.zeros((h, w), np.uint8)
for x1, y1, x2, y2, k in S.get("doors", []):
    cv2.line(dm, (int(x1 * ppf), int(y1 * ppf)), (int(x2 * ppf), int(y2 * ppf)), 255, int((OUT + 0.6) * ppf), cv2.LINE_8)
wm[dm > 0] = 0
dist = cv2.distanceTransform((wm < 128).astype(np.uint8), cv2.DIST_L2, 5)
shadow = 0.5 * np.exp(-dist / (0.35 * ppf))
img *= (1 - shadow[..., None] * (wm < 128)[..., None])
noise = cv2.GaussianBlur(rng.normal(0, 1, (h, w)).astype(np.float32), (0, 0), 2.0) * 6 + cv2.GaussianBlur(rng.normal(0, 1, (h, w)).astype(np.float32), (0, 0), 8.0) * 5
innerd = cv2.distanceTransform((wm > 128).astype(np.uint8), cv2.DIST_L2, 5)
base = np.array([86, 80, 74], np.float32)
wallc = base[None, None, :] + noise[..., None]
rim = np.clip(1 - innerd / (0.12 * ppf), 0, 1)[..., None]
wallc = wallc * (1 - 0.45 * rim)
wmf = cv2.GaussianBlur(wm.astype(np.float32) / 255, (0, 0), 0.8)
img = img * (1 - wmf[..., None]) + wallc * wmf[..., None]

# doors: closed wooden slabs, flush top-down
for x1, y1, x2, y2, k in S.get("doors", []):
    a, b = np.array([x1, y1]) * ppf, np.array([x2, y2]) * ppf
    u = (b - a) / np.linalg.norm(b - a); n = np.array([-u[1], u[0]]); th = IN * ppf * 0.45
    parts = [(a, b)] if k == "door" else [(a, (a + b) / 2), ((a + b) / 2, b)]
    for p0, p1 in parts:
        poly = np.array([p0 + n * th / 2, p1 + n * th / 2, p1 - n * th / 2, p0 - n * th / 2], np.float32)
        cv2.fillPoly(img, [np.round(poly).astype(np.int32)], (124, 86, 52), cv2.LINE_AA)
        cv2.polylines(img, [np.round(poly).astype(np.int32)], True, (38, 26, 18), 2, cv2.LINE_AA)

out = np.clip(img, 0, 255).astype(np.uint8)
Image.fromarray(out).save(S["name"] + ".webp", quality=90)

# Foundry walls (px)
def seg_minus_doors(p, q):
    p, q = np.array(p, float), np.array(q, float); L = np.linalg.norm(q - p)
    if L < 1e-6: return []
    u = (q - p) / L; cuts = []
    for x1, y1, x2, y2, k in S.get("doors", []):
        a, b = np.array([x1, y1], float), np.array([x2, y2], float)
        cr = lambda v: u[0] * v[1] - u[1] * v[0]
        if abs(cr(a - p)) < 0.3 and abs(cr(b - p)) < 0.3:
            ta, tb = sorted([np.dot(a - p, u), np.dot(b - p, u)])
            if tb > 0 and ta < L: cuts.append((max(0, ta), min(L, tb)))
    cuts.sort(); res = []; t = 0
    for ta, tb in cuts:
        if ta > t: res.append((p + u * t, p + u * ta))
        t = max(t, tb)
    if t < L: res.append((p + u * t, q))
    return res
fw = []
for pts, _ in lines():
    for p, q in zip(pts, pts[1:]):
        for a, b in seg_minus_doors(p, q):
            fw.append({"c": [round(a[0] * ppf), round(a[1] * ppf), round(b[0] * ppf), round(b[1] * ppf)]})
for x1, y1, x2, y2, k in S.get("doors", []):
    fw.append({"c": [round(x1 * ppf), round(y1 * ppf), round(x2 * ppf), round(y2 * ppf)], "door": 1, "ds": 0})
json.dump(fw, open(S["name"] + ".walls.json", "w"))
# check image with a 10-ft ruler grid
chk = out.copy()
for x in range(0, w, int(ppf * 2.5)): cv2.line(chk, (x, 0), (x, h), (255, 0, 0) if x % int(ppf * 10) == 0 else (90, 90, 90), 1)
for y in range(0, h, int(ppf * 2.5)): cv2.line(chk, (0, y), (w, y), (255, 0, 0) if y % int(ppf * 10) == 0 else (90, 90, 90), 1)
Image.fromarray(chk).resize((w // 2, h // 2)).save(S["name"] + "-check.jpg", quality=80)
print(S["name"], w, h, len(fw), "walls")
