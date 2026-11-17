"""E13 map: plan crops for ChatGPT and composite. Code owns walls and doors.
  python3 e13map.py plan        -> plan-<region>.png (magenta = this region's floor, dark = everything else)
  python3 e13map.py comp        -> reads r-<region>.png renders, writes e13-dungeon.webp, e13-dungeon.walls.json, e13-check.jpg
"""
import sys, json, math
import numpy as np, cv2
from PIL import Image
from shapely.geometry import Polygon, LineString
from shapely.ops import unary_union

L = json.load(open("layout.json")); W, H = L["W"], L["H"]; PPF = 40
IN, OUT = 0.75, 1.0
CW = 11.0
rooms = {k: Polygon(v["poly"]) for k, v in L["rooms"].items()}
halls = {k: LineString(v["line"]).buffer(CW/2, cap_style="flat", join_style="mitre", mitre_limit=4) for k, v in L["halls"].items()}
REG = {  # region: (parts, crop box in ft)
 "r01": (["01", "02"], (2, 2, 120, 80)),
 "r03": (["03"], (106, 10, 172, 76)),
 "r04": (["04", "c2", "c3", "c4", "c5"], (14, 30, 152, 122)),
 "r05": (["05"], (4, 30, 42, 68)),
 "r06": (["06"], (0, 86, 42, 128)),
 "r07": (["07", "c6"], (96, 84, 158, 130)),
 "r08": (["08"], (146, 60, 194, 130)),
}
def part(k): return rooms.get(k) or halls[k]
# doors: one per mouth; machine ward mouth gets a double door
doors = []
for d in L["doors"]:
    x1, y1, x2, y2 = d["mouth"]; a, b = np.array([x1, y1]), np.array([x2, y2]); m = (a + b) / 2; u = (b - a) / np.linalg.norm(b - a)
    half = 4.0 if d["room"] == "08" else 2.5
    p, q = m - u * half, m + u * half
    doors.append([*p.round(2), *q.round(2), "double" if d["room"] == "08" else "door", d["room"], d["hall"]])
U = unary_union(list(rooms.values()) + list(halls.values()))
rings = [list(U.exterior.coords)] + [list(i.coords) for i in U.interiors]
mouths = [d["mouth"] for d in L["doors"]]
def wall_lines():
    out = [(r, OUT) for r in rings]
    out += [([(m[0], m[1]), (m[2], m[3])], IN) for m in mouths]
    return out
def mask(polys, ppf, w, h):
    m = np.zeros((h, w), np.uint8)
    for P in polys:
        geoms = [P] if P.geom_type == "Polygon" else list(P.geoms)
        for g in geoms: cv2.fillPoly(m, [np.round(np.array(g.exterior.coords) * ppf).astype(np.int32)], 255)
    return m

if sys.argv[1] == "plan":
    for rk, (parts, (x0, y0, x1, y1)) in REG.items():
        bw, bh = x1 - x0, y1 - y0
        gw, gh = (1536, 1024) if bw / bh > 1.25 else ((1024, 1536) if bh / bw > 1.25 else (1024, 1024))
        ppf = min(gw / bw, gh / bh)
        # expand box to the output aspect
        bw2, bh2 = gw / ppf, gh / ppf; x0 -= (bw2 - bw) / 2; y0 -= (bh2 - bh) / 2
        REG[rk] = (parts, (x0, y0, x0 + bw2, y0 + bh2))
        T = lambda P: __import__("shapely").affinity.translate(P, -x0, -y0)
        img = np.zeros((gh, gw, 3), np.uint8); img[:] = (24, 24, 24)
        fm = mask([T(part(p)) for p in parts], ppf, gw, gh)
        img[fm > 0] = (255, 0, 255)
        wm = np.zeros((gh, gw), np.uint8)
        for pts, t in wall_lines():
            q = np.round((np.array(pts) - [x0, y0]) * ppf).astype(np.int32)
            cv2.polylines(wm, [q], False, 255, max(2, int(round(t * ppf))), cv2.LINE_8)
        dm = np.zeros((gh, gw), np.uint8)
        for x1_, y1_, x2_, y2_, *_ in doors:
            cv2.line(dm, (int((x1_ - x0) * ppf), int((y1_ - y0) * ppf)), (int((x2_ - x0) * ppf), int((y2_ - y0) * ppf)), 255, int(OUT * ppf * 1.4))
        img[(wm > 0) & (dm == 0)] = (70, 70, 70)
        if "01" in parts:
            sx0, sy0, sx1, sy1 = L["stairs"][0]["rect"]; cv2.rectangle(img, (int((sx0 - x0) * ppf), int((sy0 - y0) * ppf)), (int((sx1 - x0) * ppf), int((sy1 - y0) * ppf)), (0, 255, 255), -1)
        Image.fromarray(img).save(f"plan-{rk}.png")
        print(rk, gw, gh, round(ppf, 2), [round(v, 2) for v in REG[rk][1]])
    json.dump({k: v[1] for k, v in REG.items()}, open("crops.json", "w"))
    sys.exit()

# ---------- composite ----------
crops = json.load(open("crops.json"))
w, h = W * PPF, H * PPF
img = np.zeros((h, w, 3), np.float32); img[:] = (20, 19, 18)
for rk, (parts, _) in REG.items():
    x0, y0, x1, y1 = crops[rk]
    src = np.array(Image.open(f"r-{rk}.png").convert("RGB")).astype(np.float32)
    X0, Y0, X1, Y1 = [int(round(v * PPF)) for v in (x0, y0, x1, y1)]
    big = cv2.resize(src, (X1 - X0, Y1 - Y0), interpolation=cv2.INTER_LANCZOS4)
    fm = mask([part(p).buffer(0.6) for p in parts], PPF, w, h)
    # paste where this region's floor is and inside the canvas
    ys, xs = np.nonzero(fm)
    ok = (xs >= X0) & (xs < X1) & (ys >= Y0) & (ys < Y1)
    img[ys[ok], xs[ok]] = big[ys[ok] - Y0, xs[ok] - X0]
# c3: ChatGPT drew blue boards in the north hall; turn them into dull wood
m3 = mask([halls["c3"]], PPF, w, h) > 0
R, G, B = img[..., 0], img[..., 1], img[..., 2]
blue = m3 & ((B + G) / 2 > R + 5)
grey = (0.3 * R + 0.59 * G + 0.11 * B)
for i, f in enumerate((1.0, 0.82, 0.64)): img[..., i] = np.where(blue, grey * f * 0.9, img[..., i])
rng = np.random.default_rng(7)
# stairs
sx0, sy0, sx1, sy1 = [int(v * PPF) for v in L["stairs"][0]["rect"]]
n = int(round((sy1 - sy0) / (PPF * 0.9)))
for i in range(n):
    a, b = sy0 + (sy1 - sy0) * i / n, sy0 + (sy1 - sy0) * (i + 1) / n
    col = np.array([118, 84, 54]) * (0.6 + 0.55 * (1 - i / max(1, n - 1)))
    cv2.rectangle(img, (sx0, int(a)), (sx1, int(b)), col.tolist(), -1); cv2.line(img, (sx0, int(b)), (sx1, int(b)), (30, 20, 14), 6)
cv2.rectangle(img, (sx0, sy0), (sx0 + 14, sy1), (70, 48, 32), -1); cv2.rectangle(img, (sx1 - 14, sy0), (sx1, sy1), (70, 48, 32), -1)
cx, cy = (sx0 + sx1) // 2, (sy0 + sy1) // 2
cv2.arrowedLine(img, (cx, cy + 60), (cx, cy - 60), (230, 220, 200), 5, cv2.LINE_AA, 0, 0.35)
# walls
wm = np.zeros((h, w), np.uint8)
for pts, t in wall_lines():
    cv2.polylines(wm, [np.round(np.array(pts) * PPF).astype(np.int32)], False, 255, int(round((t + 0.3) * PPF)), cv2.LINE_AA)
dmk = np.zeros((h, w), np.uint8)
for x1, y1, x2, y2, *_ in doors: cv2.line(dmk, (int(x1 * PPF), int(y1 * PPF)), (int(x2 * PPF), int(y2 * PPF)), 255, int((OUT + 0.6) * PPF), cv2.LINE_8)
wm[dmk > 0] = 0
dist = cv2.distanceTransform((wm < 128).astype(np.uint8), cv2.DIST_L2, 5)
shadow = 0.5 * np.exp(-dist / (0.35 * PPF)); img *= (1 - shadow[..., None] * (wm < 128)[..., None])
noise = cv2.GaussianBlur(rng.normal(0, 1, (h, w)).astype(np.float32), (0, 0), 2.0) * 6 + cv2.GaussianBlur(rng.normal(0, 1, (h, w)).astype(np.float32), (0, 0), 8.0) * 5
innerd = cv2.distanceTransform((wm > 128).astype(np.uint8), cv2.DIST_L2, 5)
wallc = np.array([74, 68, 64], np.float32)[None, None, :] + noise[..., None]
wallc = wallc * (1 - 0.45 * np.clip(1 - innerd / (0.12 * PPF), 0, 1)[..., None])
wmf = cv2.GaussianBlur(wm.astype(np.float32) / 255, (0, 0), 0.8)
img = img * (1 - wmf[..., None]) + wallc * wmf[..., None]
for x1, y1, x2, y2, k, *_ in doors:
    a, b = np.array([x1, y1]) * PPF, np.array([x2, y2]) * PPF
    u = (b - a) / np.linalg.norm(b - a); nn = np.array([-u[1], u[0]]); th = IN * PPF * 0.45
    for p0, p1 in ([(a, b)] if k == "door" else [(a, (a + b) / 2), ((a + b) / 2, b)]):
        poly = np.array([p0 + nn * th / 2, p1 + nn * th / 2, p1 - nn * th / 2, p0 - nn * th / 2], np.float32)
        cv2.fillPoly(img, [np.round(poly).astype(np.int32)], (110, 80, 60), cv2.LINE_AA)
        cv2.polylines(img, [np.round(poly).astype(np.int32)], True, (38, 26, 18), 2, cv2.LINE_AA)
out = np.clip(img, 0, 255).astype(np.uint8)
Image.fromarray(out).save("e13-dungeon.webp", quality=88)
# Foundry walls
def seg_minus(p, q):
    p, q = np.array(p, float), np.array(q, float); Ln = np.linalg.norm(q - p)
    if Ln < 1e-6: return []
    u = (q - p) / Ln; cuts = []
    for x1, y1, x2, y2, *_ in doors:
        a, b = np.array([x1, y1]), np.array([x2, y2]); cr = lambda v: u[0] * v[1] - u[1] * v[0]
        if abs(cr(a - p)) < 0.3 and abs(cr(b - p)) < 0.3:
            ta, tb = sorted([np.dot(a - p, u), np.dot(b - p, u)])
            if tb > 0 and ta < Ln: cuts.append((max(0, ta), min(Ln, tb)))
    cuts.sort(); res = []; t = 0
    for ta, tb in cuts:
        if ta > t: res.append((p + u * t, p + u * ta))
        t = max(t, tb)
    if t < Ln: res.append((p + u * t, q))
    return res
fw = []
for pts, _ in wall_lines():
    for p, q in zip(pts, pts[1:]):
        for a, b in seg_minus(p, q): fw.append({"c": [round(a[0] * PPF), round(a[1] * PPF), round(b[0] * PPF), round(b[1] * PPF)]})
for x1, y1, x2, y2, k, *_ in doors: fw.append({"c": [round(x1 * PPF), round(y1 * PPF), round(x2 * PPF), round(y2 * PPF)], "door": 1, "ds": 0})
json.dump(fw, open("e13-dungeon.walls.json", "w"))
chk = out.copy()
for x in range(0, w, 100): cv2.line(chk, (x, 0), (x, h), (255, 0, 0) if x % 400 == 0 else (90, 90, 90), 2)
for y in range(0, h, 100): cv2.line(chk, (0, y), (w, y), (255, 0, 0) if y % 400 == 0 else (90, 90, 90), 2)
Image.fromarray(chk).resize((w // 4, h // 4)).save("e13-check.jpg", quality=80)
print(w, h, len(fw), "walls", len(doors), "doors")
