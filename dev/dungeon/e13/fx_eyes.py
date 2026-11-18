"""Eyes that open in the plaster, look around, blink and close. Seamless loops, VP9 with alpha.
usage: python3 fx_eyes.py  -> fx/abtl-e13-fx-eye-{a,b,c}.webm (256 x 160)"""
import os, subprocess, math
import numpy as np, cv2

W_, H_ = 256, 160
FPS = 15
rng = np.random.default_rng(7)
yy, xx = np.mgrid[0:H_, 0:W_].astype(np.float32)
cx, cy = W_ / 2, H_ / 2
EW, EH = 92, 46                       # half width, half height of the fully open almond


def fnoise(seed, sig=(2, 6, 14)):
    r = np.random.default_rng(seed); n = np.zeros((H_, W_), np.float32)
    for k, sg in enumerate(sig): n += cv2.GaussianBlur(r.normal(0, 1, (H_, W_)).astype(np.float32), (0, 0), sg) * (sg ** 0.8)
    return (n - n.mean()) / n.std()


SKN = fnoise(11); SKN2 = fnoise(12, (1, 3))


def smooth(x): x = np.clip(x, 0, 1); return x * x * (3 - 2 * x)


def almond(open_):
    """Signed mask of the eye opening: lens shape between two arcs; open_ 0..1."""
    u = (xx - cx) / EW
    h = EH * max(open_, 0.0) * np.clip(1 - u * u, 0, None) ** 0.75
    return np.clip((h - np.abs(yy - cy)) / 1.5, 0, 1), h


def make_static(seed, iris_rgb):
    r = np.random.default_rng(seed)
    # sclera: warm off-white, darker and redder toward the corners, with veins
    d = np.hypot((xx - cx) / EW, (yy - cy) / EH)
    scl = np.dstack([215 - 45 * d, 190 - 80 * d, 160 - 80 * d]).astype(np.float32) + fnoise(seed + 50, (1, 4))[..., None] * 6
    veins = np.zeros((H_, W_), np.float32)
    for _ in range(26):
        ang = r.uniform(0, 2 * math.pi); x, y = cx + math.cos(ang) * EW * 0.95, cy + math.sin(ang) * EH * 0.9
        pts = [(x, y)]
        for _ in range(12):
            ang += r.normal(0, 0.45); x += (cx - x) * 0.07 + math.cos(ang) * 4; y += (cy - y) * 0.07 + math.sin(ang) * 3
            pts.append((x, y))
        cv2.polylines(veins, [np.int32(pts)], False, float(r.uniform(0.4, 1)), 1, cv2.LINE_AA)
    veins = cv2.GaussianBlur(veins, (0, 0), 0.6)
    scl = scl * (1 - 0.55 * veins[..., None]) + np.array([150, 20, 25], np.float32) * 0.55 * veins[..., None]
    # iris texture in polar coordinates (radius 1 = iris edge)
    n = 512
    ang = np.linspace(0, 2 * math.pi, n, endpoint=False)
    stri = cv2.GaussianBlur(r.random((1, n)).astype(np.float32), (0, 0), 1.5)[0]
    iris = {"rgb": np.array(iris_rgb, np.float32), "stri": stri}
    return scl, iris


def frame(scl, iris, open_, look, pupil):
    m, h = almond(open_)
    ir = EH * 0.86
    ix, iy = cx + look[0] * EW * 0.35, cy + look[1] * EH * 0.25
    rr = np.hypot(xx - ix, yy - iy) / ir
    th = (np.arctan2(yy - iy, xx - ix) % (2 * math.pi)) / (2 * math.pi) * len(iris["stri"])
    st = iris["stri"][th.astype(int) % len(iris["stri"])]
    base = iris["rgb"] * (0.45 + 0.55 * st[..., None] + 0.08 * SKN2[..., None]) * (1.0 - 0.45 * rr[..., None])
    base = base * (1 - 0.6 * smooth((rr - 0.82) / 0.18))[..., None]          # dark limbal ring
    gold = np.array([210, 170, 70], np.float32) * smooth(1 - np.abs(rr - pupil - 0.08) / 0.12)[..., None] * 0.35
    eye = np.where((rr < 1)[..., None], base + gold, scl)
    eye = np.where((rr < pupil)[..., None], np.array([8, 6, 8], np.float32), eye)
    hl = smooth(1 - np.hypot(xx - ix + ir * 0.35, yy - iy + ir * 0.35) / (ir * 0.18))   # wet highlight
    eye = eye + 140 * hl[..., None]
    # shade under the upper lid
    top = cy - h
    eye = eye * (0.35 + 0.65 * smooth((yy - top) / (EH * 0.6)))[..., None] * (0.75 + 0.25 * smooth((cy + h - yy) / (EH * 0.3)))[..., None]
    # lids and skin: fleshy purple-red, wrinkled, fading out into the wall
    d = np.hypot((xx - cx) / (EW * 1.35), (yy - cy) / (EH * 1.9))
    fold = smooth(1 - np.abs(np.abs(yy - cy) - (h + 7 + 4 * SKN2 * 0.5)) / 2.5) * (np.abs((xx - cx) / (EW * 1.1)) < 1)
    skin = np.array([105, 50, 62], np.float32) * (0.8 + 0.12 * SKN[..., None] + 0.08 * SKN2[..., None]) * (1.05 - 0.45 * d[..., None])
    skin = skin * (1 - 0.35 * fold[..., None])
    rim = smooth(1 - np.abs(np.abs(yy - cy) - h) / 3.0) * (np.abs((xx - cx) / EW) < 1)
    skin = skin * (1 - 0.6 * rim[..., None])
    a_skin = smooth((1 - d + 0.12 * SKN) / 0.5) * 0.9
    slit = smooth(1 - np.abs(yy - cy) / 2.2) * smooth((1 - np.abs((xx - cx) / EW)) / 0.2) * (1 - m)   # closed seam
    skin = skin * (1 - 0.7 * slit[..., None])
    tear = smooth(1 - np.abs(np.abs(yy - cy) - h) / 1.6) * (np.abs((xx - cx) / EW) < 0.97) * (open_ > 0.05)
    skin = skin + np.array([90, 20, 25], np.float32) * tear[..., None] * 0.6
    rgb = skin * (1 - m[..., None]) + eye * m[..., None]
    a = np.maximum(a_skin * (0.35 + 0.65 * min(1, open_ * 3 + 0.0)), m)
    return np.dstack([np.clip(rgb, 0, 255), np.clip(a, 0, 1)[..., None] * 255]).astype(np.uint8)


def timeline(seconds, seed):
    """Open amount, look direction and pupil size per frame for one loop."""
    r = np.random.default_rng(seed)
    n = int(seconds * FPS)
    t = np.arange(n) / FPS
    closed = seconds * r.uniform(0.35, 0.45)
    o = np.zeros(n); look = np.zeros((n, 2)); pup = np.full(n, 0.38)
    t_open, t_close = closed, seconds - 0.9
    o = smooth((t - t_open) / 0.5) * smooth((t_close + 0.9 - t) / 0.9)
    # a blink in the middle of the open time
    tb = (t_open + t_close) / 2 + r.uniform(-0.5, 0.5)
    o = o * (1 - 0.95 * np.exp(-((t - tb) / 0.09) ** 2))
    # glances: hold, then dart to a new point
    keys = [(t_open, (r.uniform(-1, 1), r.uniform(-0.6, 0.6)))]
    tt = t_open
    while tt < t_close:
        tt += r.uniform(0.7, 1.6); keys.append((tt, (r.uniform(-1, 1), r.uniform(-0.7, 0.7))))
    for i, ti in enumerate(t):
        k = max(j for j in range(len(keys)) if keys[j][0] <= max(ti, keys[0][0]))
        p0 = keys[k][1]; p1 = keys[min(k + 1, len(keys) - 1)][1]
        f = smooth((ti - keys[k][0]) / 0.12) if k + 1 < len(keys) and ti >= keys[k][0] else 0
        prev = keys[k - 1][1] if k > 0 else p0
        look[i] = np.array(prev) + (np.array(p0) - np.array(prev)) * f if k > 0 else p0
    pup = 0.30 + 0.12 * np.exp(-((t - t_open) / 0.6) ** 2)      # dilates as it opens
    return o, look, pup


os.makedirs("fx", exist_ok=True)
for name, secs, seed, iris_rgb in (("a", 11, 1, (95, 140, 85)), ("b", 14, 2, (120, 150, 110)), ("c", 17, 3, (110, 95, 70))):
    scl, iris = make_static(seed, iris_rgb)
    o, look, pup = timeline(secs, seed)
    tmp = f"fx/_eye{name}"
    os.makedirs(tmp, exist_ok=True)
    for i in range(len(o)):
        cv2.imwrite(f"{tmp}/{i:04d}.png", cv2.cvtColor(frame(scl, iris, o[i], look[i], pup[i]), cv2.COLOR_RGBA2BGRA))
    out = f"fx/abtl-e13-fx-eye-{name}.webm"
    subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-framerate", str(FPS), "-i", f"{tmp}/%04d.png", "-c:v", "libvpx-vp9", "-pix_fmt", "yuva420p",
                    "-b:v", "0", "-crf", "30", "-row-mt", "1", "-auto-alt-ref", "0", out], check=True)
    print(out, len(o), os.path.getsize(out))
