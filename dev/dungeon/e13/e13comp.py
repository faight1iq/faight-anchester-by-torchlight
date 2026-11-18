"""Composite ChatGPT returns (ret/r-<rk>.png) onto base.png. Code owns floors, walls, doors; ChatGPT only furnishes.
usage: python3 e13comp.py <ret_dir> [rk ...]      env: SHRINK_<rk>=f  (shrink objects about their centres / walls)
Writes e13-final.png, comp.log, dbg-<rk>.jpg."""
import sys, os, json
import numpy as np, cv2
from PIL import Image
from shapely import affinity
from e13geo import *
Image.MAX_IMAGE_PIXELS = None
RET = sys.argv[1]
ONLY = sys.argv[2:]
C = json.load(open("crops2.json"))
base = np.array(Image.open("base.png").convert("RGB")).astype(np.float32)
MH, MW = base.shape[:2]
LANES = lanes()
log = []


def magmask(a):
    a = a.astype(int)
    return (a[..., 0] > 150) & (a[..., 2] > 150) & (a[..., 1] < 120)


def align(crop, ret):
    N = crop.shape
    def struct(a):
        g = cv2.cvtColor(a.astype(np.uint8), cv2.COLOR_RGB2GRAY).astype(np.float32) / 255
        g[magmask(a)] = 1.0
        return cv2.GaussianBlur(g, (0, 0), 2)
    fm = lambda a: cv2.GaussianBlur(magmask(a).astype(np.float32), (0, 0), 4)
    crit = (cv2.TERM_CRITERIA_EPS | cv2.TERM_CRITERIA_COUNT, 300, 1e-6)
    cands = {"identity": np.eye(2, 3, dtype=np.float32)}
    for nm, f, mode in (("walls-aff", struct, cv2.MOTION_AFFINE), ("walls-tr", struct, cv2.MOTION_TRANSLATION),
                        ("mag-aff", fm, cv2.MOTION_AFFINE), ("mag-tr", fm, cv2.MOTION_TRANSLATION)):
        try:
            _, wm = cv2.findTransformECC(f(crop), f(ret), np.eye(2, 3, dtype=np.float32), mode, crit, None, 5); cands[nm] = wm
        except cv2.error: pass
    hN, wN = crop.shape[:2]
    ok = lambda w: abs(w[0, 0] - 1) < 0.06 and abs(w[1, 1] - 1) < 0.06 and abs(w[0, 1]) < 0.03 and abs(w[1, 0]) < 0.03 and abs(w[0, 2]) < wN * 0.06 and abs(w[1, 2]) < hN * 0.06
    cm = ~magmask(crop) & (cv2.cvtColor(crop, cv2.COLOR_RGB2GRAY) > 80)          # the grey wall strips
    def score(w):
        r = cv2.warpAffine(ret, w, (wN, hN), flags=cv2.INTER_NEAREST + cv2.WARP_INVERSE_MAP)
        g = cv2.cvtColor(r, cv2.COLOR_RGB2GRAY).astype(np.float32)
        rr = r.astype(int); grey = (np.abs(rr[..., 0] - rr[..., 1]) < 25) & (np.abs(rr[..., 2] - rr[..., 1]) < 25) & (g > 80) & (g < 170)
        return float((cm & grey).sum() / max(1, (cm | grey).sum()))
    sc = {k: score(v) for k, v in cands.items() if ok(v)}
    best = max(sc, key=sc.get)
    return cands[best], best, sc[best]


def key(al):
    R, G, B = al[..., 0], al[..., 1], al[..., 2]
    k = np.clip((np.minimum(R, B) - G) / np.maximum(np.maximum(R, B), 1), 0, 1)
    bg = k > 0.55
    shade = np.clip((R + B) / 2 / 255, 0, 1)
    sh = np.where(bg, np.clip((1 - shade / 0.97 - 0.06) / 0.94, 0, 0.8), 0)
    ob = np.clip((0.55 - k) / 0.35, 0, 1)
    col = al.copy()
    col[..., 0] = np.minimum(col[..., 0], col[..., 1] * 1.08 + 12)
    col[..., 2] = np.minimum(col[..., 2], col[..., 1] * 1.18 + 18)
    semi = (k > 0.12) & (ob > 0)
    g = np.clip(G / np.maximum(ob, 0.2), 0, 255)
    neutral = np.stack([g * 0.97, g, np.minimum(g * 1.06, 255)], -1)
    col[semi] = neutral[semi]
    pur = (col[..., 0] > col[..., 1] + 6) & (col[..., 2] > col[..., 1] + 6)
    gg = col[..., 1]
    col[..., 0] = np.where(pur, np.minimum(col[..., 0], gg + 4), col[..., 0])
    col[..., 2] = np.where(pur, np.minimum(col[..., 2], gg * 1.06 + 8), col[..., 2])
    return col, ob, sh


def components(ob):
    m = (ob > 0.5).astype(np.uint8)
    m = cv2.morphologyEx(m, cv2.MORPH_OPEN, np.ones((7, 7), np.uint8))   # break thin strips that chain objects together
    return cv2.connectedComponentsWithStats(m, 8)


def shrink(col, ob, sh, rm, f, wallzone):
    """Cut each object (with its shadow) and shrink it by f; objects touching the wall zone keep their wall-side edge."""
    m = (np.maximum(ob, sh) > 0.08).astype(np.uint8) * rm.astype(np.uint8)
    m = cv2.dilate(m, np.ones((5, 5), np.uint8))
    n, lab, st, cen = cv2.connectedComponentsWithStats(m, 8)
    c2 = np.zeros_like(col); o2 = np.zeros_like(ob); s2 = np.zeros_like(sh)
    Hh, Ww = ob.shape
    for i in range(1, n):
        x, y, w, h, a = st[i]
        if a < 80: continue
        sel = (lab[y:y + h, x:x + w] == i).astype(np.float32)
        nw, nh = max(1, int(round(w * f))), max(1, int(round(h * f)))
        rs = lambda arr: cv2.resize(arr, (nw, nh), interpolation=cv2.INTER_AREA)
        pc = rs(col[y:y + h, x:x + w]); po = rs(ob[y:y + h, x:x + w] * sel); ps = rs(sh[y:y + h, x:x + w] * sel)
        # anchor: the point of the object nearest the wall zone stays put
        wz = wallzone[y:y + h, x:x + w] & (sel > 0)
        if wz.any():
            yy, xx = np.nonzero(wz); ax, ay = xx.mean() / max(1, w), yy.mean() / max(1, h)
        else:
            ax = ay = 0.5
        nx = int(round(x + ax * w - ax * nw)); ny = int(round(y + ay * h - ay * nh))
        nx, ny = min(max(nx, 0), Ww - nw), min(max(ny, 0), Hh - nh)
        reg = (slice(ny, ny + nh), slice(nx, nx + nw))
        take = po > o2[reg]
        c2[reg][take] = pc[take]; o2[reg] = np.maximum(o2[reg], po); s2[reg] = np.maximum(s2[reg], ps)
    return c2, o2, s2


regions = ONLY or [k for k in REG if os.path.exists(os.path.join(RET, f"r-{k}.png"))]
for rk in regions:
    x0, y0, x1, y1, ppf = C[rk]
    crop = np.array(Image.open(f"gpt2/crop-{rk}.png").convert("RGB"))
    hN, wN = crop.shape[:2]
    ret = np.array(Image.open(os.path.join(RET, f"r-{rk}.png")).convert("RGB").resize((wN, hN), Image.LANCZOS))
    wm, how, sc = align(crop, ret)
    al = cv2.warpAffine(ret, wm, (wN, hN), flags=cv2.INTER_LINEAR + cv2.WARP_INVERSE_MAP, borderMode=cv2.BORDER_REPLICATE).astype(np.float32)
    col, ob, sh = key(al)
    T = lambda g: g  # geometry already in ft; masks take the crop offset
    reg = region_floor(rk)
    rm = mask(reg.buffer(-0.45, join_style=2), ppf, wN, hN, x0, y0) > 0
    ob *= rm; sh *= rm
    # ChatGPT's redrawn wall strips: flat mid-grey within 1.5 ft of the region edge -> drop
    near = (mask(reg, ppf, wN, hN, x0, y0) > 0) & ~(mask(reg.buffer(-1.0, join_style=2), ppf, wN, hN, x0, y0) > 0)
    R_, G_, B_ = al[..., 0], al[..., 1], al[..., 2]
    mu = cv2.blur(G_, (7, 7)); sd = np.sqrt(np.clip(cv2.blur(G_ * G_, (7, 7)) - mu * mu, 0, None))
    greyw = (np.abs(R_ - G_) < 10) & (np.abs(B_ - G_) < 10) & (np.abs(G_ - 110) < 18) & (sd < 5) & near
    greyw = cv2.morphologyEx(greyw.astype(np.uint8), cv2.MORPH_OPEN, np.ones((3, 3), np.uint8)).astype(bool)
    greyw = cv2.dilate(greyw.astype(np.uint8), np.ones((3, 3), np.uint8)).astype(bool) & near
    ob = np.where(greyw, 0, ob); sh = np.where(greyw, 0, sh)
    # wall zone: within 2 ft of the room edge (for shrink anchoring)
    wallzone = (mask(reg, ppf, wN, hN, x0, y0) > 0) & ~(mask(reg.buffer(-2.0, join_style=2), ppf, wN, hN, x0, y0) > 0)
    f = float(os.environ.get(f"SHRINK_{rk}", "1"))
    if f < 0.999:
        col, ob, sh = shrink(col, ob, sh, rm, f, wallzone)
    # MOVE_<rk>="x,y,dx,dy;...": move the object whose box contains (x, y) ft by (dx, dy) ft
    for mv in filter(None, os.environ.get(f"MOVE_{rk}", "").split(";")):
        mx, my, dx, dy = map(float, mv.split(","))
        n_, lab_, st_, _ = components(ob)
        px_, py_ = int((mx - x0) * ppf), int((my - y0) * ppf)
        cand = np.unique(lab_[max(0, py_ - 3):py_ + 4, max(0, px_ - 3):px_ + 4]); cand = cand[cand > 0]
        i = int(cand[0]) if len(cand) else 0
        if i:
            sel = cv2.dilate((lab_ == i).astype(np.uint8), np.ones((int(ppf * 0.9) | 1,) * 2, np.uint8)).astype(bool)
            sel &= ~cv2.dilate(((lab_ > 0) & (lab_ != i)).astype(np.uint8), np.ones((5, 5), np.uint8)).astype(bool)
            Mv = np.float32([[1, 0, dx * ppf], [0, 1, dy * ppf]])
            mvd = lambda a: cv2.warpAffine((a * sel) if a.ndim == 2 else (a * sel[..., None]), Mv, (wN, hN))
            nc, no, ns = mvd(col), mvd(ob.astype(np.float32)), mvd(sh.astype(np.float32))
            ob = np.where(sel, 0, ob); sh = np.where(sel, 0, sh)
            take = no > ob
            col[take] = nc[take]; ob = np.maximum(ob, no); sh = np.maximum(sh, ns)
            ob *= rm; sh *= rm
    # door lanes: remove whole objects that reach into a lane
    lane_m = np.zeros((hN, wN), bool)
    for owner, poly in LANES:
        if poly.intersects(reg): lane_m |= mask(poly.intersection(reg.buffer(0.01)), ppf, wN, hN, x0, y0) > 0
    n, lab, st, _ = components(ob)
    kill = [] if rk in os.environ.get("LANES_SKIP", "").split(",") else [i for i in range(1, n) if (lane_m & (lab == i)).sum() > max(12, 0.03 * st[i][4]) and st[i][4] < 25 * ppf * ppf]
    if kill:
        km = cv2.dilate(np.isin(lab, kill).astype(np.uint8), np.ones((int(ppf * 0.6) | 1,) * 2, np.uint8)).astype(bool)
        keep = cv2.dilate(((lab > 0) & ~np.isin(lab, kill)).astype(np.uint8), np.ones((3, 3), np.uint8)).astype(bool)
        km &= ~keep
        ob = np.where(km, 0, ob); sh = np.where(km, 0, sh)
    if rk not in os.environ.get("LANES_SKIP", "").split(","):
        ob = np.where(lane_m, 0, ob); sh = np.where(lane_m, 0, sh)   # nothing at all stays in a lane
    # CABLE_<rk>="x1,y1,x2,y2;..." ft: draw a black cable (reconnects cables after a MOVE)
    for cb in filter(None, os.environ.get(f"CABLE_{rk}", "").split(";")):
        ax_, ay_, bx_, by_ = map(float, cb.split(","))
        p0 = (int((ax_ - x0) * ppf), int((ay_ - y0) * ppf)); p1 = (int((bx_ - x0) * ppf), int((by_ - y0) * ppf))
        lm = np.zeros((hN, wN), np.uint8); cv2.line(lm, p0, p1, 255, max(2, int(0.13 * ppf)), cv2.LINE_AA)
        a_ = lm.astype(np.float32) / 255
        col = col * (1 - a_[..., None]) + np.array([28, 28, 30], np.float32) * a_[..., None]
        ob = np.maximum(ob, a_); sh = np.maximum(sh, cv2.GaussianBlur(a_, (0, 0), 2) * 0.4)
    left = int(((ob > 0.5) & lane_m).sum())
    cover = float((ob > 0.5).sum() / max(1, rm.sum()))
    # warp onto the map: map = (crop_px / ppf + [x0, y0]) * PPF
    s = PPF / ppf
    M = np.array([[s, 0, x0 * PPF], [0, s, y0 * PPF]], np.float32)
    bx0, by0, bx1, by1 = [int(v) for v in (max(0, x0 * PPF), max(0, y0 * PPF), min(MW, x1 * PPF), min(MH, y1 * PPF))]
    M2 = M.copy(); M2[0, 2] -= bx0; M2[1, 2] -= by0
    sz = (bx1 - bx0, by1 - by0)
    wc = cv2.warpAffine(col, M2, sz, flags=cv2.INTER_CUBIC)
    wo = np.clip(cv2.warpAffine(ob.astype(np.float32), M2, sz, flags=cv2.INTER_LINEAR), 0, 1)
    ws = np.clip(cv2.warpAffine(sh.astype(np.float32), M2, sz, flags=cv2.INTER_LINEAR), 0, 1)
    sub = base[by0:by1, bx0:bx1]
    sub *= (1 - ws[..., None])
    sub[:] = sub * (1 - wo[..., None]) + wc * wo[..., None]
    Image.fromarray(np.clip(sub, 0, 255).astype(np.uint8)).resize((sz[0] // 3, sz[1] // 3)).save(f"dbg-{rk}.jpg", quality=82)
    line = f"{rk}: fit {how} {sc:.2f} [{wm[0,0]:.3f} {wm[0,1]:.3f} {wm[0,2]:.1f} / {wm[1,0]:.3f} {wm[1,1]:.3f} {wm[1,2]:.1f}] shrink {f} lane-kills {len(kill)} lane-px-left {left} cover {cover:.2f}"
    print(line); log.append(line)

Image.fromarray(np.clip(base, 0, 255).astype(np.uint8)).save("e13-final.png")
open("comp.log", "w").write("\n".join(log) + "\n")
