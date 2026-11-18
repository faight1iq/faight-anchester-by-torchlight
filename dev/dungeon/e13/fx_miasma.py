"""Animated purple-green miasma over the whole 13.01 map, masked to the floor. Seamless loop.
usage: python3 fx_miasma.py  -> fx/abtl-e13-fx-miasma.webm (1300 x 867, scaled to 7800 x 5200 in Foundry)"""
import os, subprocess
import numpy as np, cv2
from e13geo import *

S = 8                         # map px per overlay px (40 px/ft -> 6.67 px/ft)
OW, OH = (W * PPF) // S, (H * PPF) // S
FPS, SECS = 10, 24
N = FPS * SECS
rng = np.random.default_rng(1313)


def periodic_noise(size, beta):
    """Tileable fractal noise from filtered white noise (period = size)."""
    f = np.fft.fftfreq(size)
    fx, fy = np.meshgrid(f, f)
    amp = 1 / np.maximum(np.hypot(fx, fy), 1 / size) ** beta
    ph = np.exp(2j * np.pi * rng.random((size, size)))
    n = np.real(np.fft.ifft2(amp * ph))
    return (n - n.mean()) / n.std()


def stretched(size, beta, sx, sy):
    n = periodic_noise(size, beta)
    return cv2.resize(np.tile(n, (sy, sx)), (size * sx, size * sy))   # still periodic


# floor mask and density (thicker in the halls, the Knot and the Machine Ward)
ppf = PPF / S
floor = mask(FLOOR.buffer(-0.3), ppf, OW, OH).astype(np.float32) / 255
dens = np.full((OH, OW), 0.55, np.float32)
for k, v in (("02", 0.9), ("c2", 1.0), ("c3", 1.0), ("c4", 1.0), ("c5", 1.0), ("c6", 1.0), ("04", 1.2), ("08", 0.7), ("07", 0.8), ("03", 0.5), ("06", 0.6), ("05", 0.3), ("01", 0.45)):
    m = mask(part(k), ppf, OW, OH) > 0
    dens[m] = v
dens = cv2.GaussianBlur(dens, (0, 0), 12) * cv2.GaussianBlur(floor, (0, 0), 2)
halls = cv2.GaussianBlur(sum((mask(part(k), ppf, OW, OH) > 0).astype(np.float32) for k in ("02", "c2", "c3", "c4", "c5")), (0, 0), 6)

P = 512
A = periodic_noise(P, 1.6)            # purple body
B = periodic_noise(P, 1.9)            # green body
C = stretched(P, 1.4, 1, 1)           # breakup
Wsp = periodic_noise(P, 1.2)          # wisps (stretched at sample time)
purple = np.array([150, 60, 210], np.float32)
green = np.array([110, 210, 120], np.float32)
white = np.array([225, 225, 240], np.float32)

yy, xx = np.mgrid[0:OH, 0:OW].astype(np.float32)
os.makedirs("fx", exist_ok=True)
tmp = "fx/_miasma"
os.makedirs(tmp, exist_ok=True)


def sample(n, ox, oy, sc=1.0, sx=1.0):
    mx = ((xx / sx) * sc + ox) % P
    my = (yy * sc + oy) % P
    return cv2.remap(n.astype(np.float32), mx, my, cv2.INTER_LINEAR, borderMode=cv2.BORDER_WRAP)


for i in range(N):
    t = i / N                               # 0..1 over the loop; every layer moves a whole number of periods
    wx = sample(C, P * t, 0, 1.2) * 18; wy = sample(C, 0, P * t, 1.2) * 18          # domain warp
    a = cv2.remap(sample(A, P * t, 0, 2.2), (xx + wx) % OW, (yy + wy) % OH, cv2.INTER_LINEAR)
    b = cv2.remap(sample(B, -P * t, P * t, 2.6), (xx - wy) % OW, (yy + wx) % OH, cv2.INTER_LINEAR)
    w = sample(Wsp, P * 2 * t, 0, 2.0, sx=5.0)
    ridge = lambda n: np.clip(1 - np.abs(n) / 1.2, 0, 1) ** 3
    body = lambda n: np.clip(n * 0.5 + 0.2, 0, 1)
    pa = ridge(a) * 0.9 + body(a) * 0.35
    gb = ridge(b) * 0.7 * np.clip(b * 0.6 + 0.4, 0, 1)
    ww = np.clip(ridge(w) - 0.55, 0, None) * 2.2 * halls
    alpha = np.clip(0.30 * pa + 0.22 * gb + 0.30 * ww, 0, 0.5) * dens
    col = (purple * pa[..., None] + green * gb[..., None] * 1.3 + white * ww[..., None] * 1.5) / np.maximum(pa + gb * 1.3 + ww * 1.5, 1e-3)[..., None]
    rgba = np.dstack([col, alpha[..., None] * 255]).clip(0, 255).astype(np.uint8)
    cv2.imwrite(f"{tmp}/{i:04d}.png", cv2.cvtColor(rgba, cv2.COLOR_RGBA2BGRA))
subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-framerate", str(FPS), "-i", f"{tmp}/%04d.png", "-c:v", "libvpx-vp9", "-pix_fmt", "yuva420p",
                "-b:v", "0", "-crf", "42", "-row-mt", "1", "-deadline", "good", "-cpu-used", "4", "-auto-alt-ref", "0", "fx/abtl-e13-fx-miasma.webm"], check=True)
print("frames", N, "size", OW, OH, os.path.getsize("fx/abtl-e13-fx-miasma.webm"))
