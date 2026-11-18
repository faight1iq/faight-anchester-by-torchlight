"""Tendrils of purple and green smoke curling out of one source (a crack, a drain, a broken tank). Seamless loops.
Particles are emitted periodically and advected through a time-periodic curl-noise field; each one draws its trail as a
thin glowing filament, so the result reads as ribbons of smoke, not a wash.
usage: python3 fx_smoke.py -> fx/abtl-e13-fx-smoke-{p,g,m}.webm (384 x 384, one tile = 12 x 12 ft)"""
import os, subprocess, math
import numpy as np, cv2

SZ, FPS, T = 384, 15, 8.0               # pixels, frames per second, loop seconds
NF = int(FPS * T)
P = 64                                  # noise grid


def periodic_field(seed):
    """Two periodic 2D noise grids blended around a circle in time, so the field at t and t+T is identical."""
    r = np.random.default_rng(seed)
    def grid():
        f = np.fft.fftfreq(P); fx, fy = np.meshgrid(f, f)
        amp = 1 / np.maximum(np.hypot(fx, fy), 1 / P) ** 2.2
        n = np.real(np.fft.ifft2(amp * np.exp(2j * np.pi * r.random((P, P)))))
        return (n / n.std()).astype(np.float32)
    g = [grid() for _ in range(3)]
    return g


def curl(g, x, y, t):
    """Curl of a stream function sampled at (x, y) in noise cells; time loops through three grids."""
    a = 2 * math.pi * t / T
    w = [(1 + math.cos(a - k * 2 * math.pi / 3)) / 3 for k in range(3)]
    def psi(px, py):
        s = 0
        for gi, wi in zip(g, w):
            s = s + wi * cv2.remap(gi, (px % P).astype(np.float32), (py % P).astype(np.float32), cv2.INTER_LINEAR, borderMode=cv2.BORDER_WRAP)[:, 0]
        return s
    e = 0.05
    xs, ys = x.reshape(-1, 1), y.reshape(-1, 1)
    dpdy = (psi(xs, ys + e) - psi(xs, ys - e)) / (2 * e)
    dpdx = (psi(xs + e, ys) - psi(xs - e, ys)) / (2 * e)
    return dpdy, -dpdx


def build(name, seed, colours, n_per_loop=160, life=6.5, drift=(0.0, -18.0), spread=9.0):
    r = np.random.default_rng(seed)
    g = periodic_field(seed)
    emit = (np.arange(n_per_loop) + r.random(n_per_loop) * 0.5) * T / n_per_loop            # emission times within one loop
    vents = np.array([[-18, 2], [0, -4], [17, 3], [6, 10], [-8, 8]], np.float32)       # several cracks, one colour each
    vi = np.arange(n_per_loop) % len(colours)
    ox = vents[vi % len(vents), 0] + r.normal(0, spread * 0.35, n_per_loop); oy = vents[vi % len(vents), 1] + r.normal(0, spread * 0.25, n_per_loop)
    col = [colours[v] for v in vi]
    src = np.array([SZ / 2, SZ * 0.72])
    steps = int(life * FPS)
    dt = 1 / FPS
    # trajectories for particles emitted at emit[i] (and, by periodicity, emit[i] + kT)
    paths = np.zeros((n_per_loop, steps, 2), np.float32)
    pos = np.stack([src[0] + ox, src[1] + oy], 1).astype(np.float32)
    for s in range(steps):
        paths[:, s] = pos
        tt = (emit + s * dt) % T
        vx = np.zeros(n_per_loop, np.float32); vy = np.zeros(n_per_loop, np.float32)
        for i in range(n_per_loop):           # field sampled per particle time
            cx, cy = curl(g, np.array([pos[i, 0] / 22]), np.array([pos[i, 1] / 22]), tt[i])
            vx[i], vy[i] = cx[0], cy[0]
        rms = np.sqrt(np.mean(vx * vx + vy * vy)) + 1e-6
        speed = (14 + 30 * min(1, s / (steps * 0.4))) / rms
        pos = pos + np.stack([vx * speed + drift[0] * (0.5 + s / steps), vy * speed + drift[1] * (0.5 + s / steps)], 1) * dt
    tmp = f"fx/_smoke{name}"; os.makedirs(tmp, exist_ok=True)
    trail = int(2.2 * FPS)
    for f in range(NF):
        t = f / FPS
        acc = np.zeros((SZ, SZ, 3), np.float32); dens = np.zeros((SZ, SZ), np.float32)
        for i in range(n_per_loop):
            for k in (-1, 0, 1):
                age = t - (emit[i] + k * T)
                s1 = int(age * FPS)
                if s1 < 1 or s1 >= steps: continue
                s0 = max(0, s1 - trail)
                pts = paths[i, s0:s1 + 1]
                fade = math.sin(math.pi * s1 / steps) ** 1.2              # fade in and out over life
                width = 1 + int(2 * s1 / steps)
                lay = np.zeros((SZ, SZ), np.float32)
                cv2.polylines(lay, [np.round(pts * 4).astype(np.int32)], False, 1.0, width * 4, cv2.LINE_AA, 2)
                lay *= fade * 0.22
                acc += lay[..., None] * np.array(col[i], np.float32); dens += lay
        glow = cv2.GaussianBlur(dens, (0, 0), 6)
        core = cv2.GaussianBlur(dens, (0, 0), 1.2)
        accb = cv2.GaussianBlur(acc, (0, 0), 3)
        a = np.clip(core * 0.55 + glow * 0.9, 0, 0.6)
        rgb = accb / np.maximum(cv2.GaussianBlur(dens, (0, 0), 3), 1e-3)[..., None]
        rgb = rgb * (0.8 + 0.35 * np.clip(core, 0, 1))[..., None]          # brighter filament cores
        ii = np.arange(SZ, dtype=np.float32); ex = np.minimum(ii, SZ - 1 - ii); edge = np.clip(np.minimum(ex[None, :], ex[:, None]) / 40, 0, 1)
        a = a * edge
        cv2.imwrite(f"{tmp}/{f:04d}.png", cv2.cvtColor(np.dstack([np.clip(rgb, 0, 255), a[..., None] * 255]).astype(np.uint8), cv2.COLOR_RGBA2BGRA))
    out = f"fx/abtl-e13-fx-smoke-{name}.webm"
    subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-framerate", str(FPS), "-i", f"{tmp}/%04d.png", "-c:v", "libvpx-vp9", "-pix_fmt", "yuva420p",
                    "-b:v", "0", "-crf", "34", "-row-mt", "1", "-auto-alt-ref", "0", out], check=True)
    print(out, os.path.getsize(out))


PURPLE, GREEN = (150, 85, 195), (105, 195, 120)
GREY, ASH, PALE = (170, 168, 172), (140, 138, 144), (200, 198, 205)
if __name__ == "__main__":
    import sys
    which = sys.argv[1:] or ["p", "g", "m"]
    # mostly grey smoke; one strand in five carries the colour accent
    if "p" in which: build("p", 21, [GREY, ASH, PURPLE, PALE, GREY])
    if "g" in which: build("g", 22, [GREY, PALE, GREEN, ASH, GREY])
    if "m" in which: build("m", 23, [GREY, PURPLE, ASH, GREEN, PALE])
