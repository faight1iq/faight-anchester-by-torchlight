"""Crops for ChatGPT: magenta = this region's floor, grey band = walls, brown bar = door, dark = everything else.
Writes crop-<rk>.png and crops2.json {rk: [x0, y0, x1, y1, ppf]} (ft)."""
import json, sys
import numpy as np, cv2
from PIL import Image
from shapely.geometry import box
from e13geo import *

out = {}
for rk in REG:
    g = region_floor(rk)
    x0, y0, x1, y1 = g.bounds
    x0 -= 3; y0 -= 3; x1 += 3; y1 += 3
    bw, bh = x1 - x0, y1 - y0
    gw, gh = (1536, 1024) if bw / bh > 1.25 else ((1024, 1536) if bh / bw > 1.25 else (1024, 1024))
    ppf = min(gw / bw, gh / bh)
    bw2, bh2 = gw / ppf, gh / ppf; x0 -= (bw2 - bw) / 2; y0 -= (bh2 - bh) / 2
    img = np.zeros((gh, gw, 3), np.uint8); img[:] = (22, 22, 22)
    other = mask(FLOOR, ppf, gw, gh, x0, y0)
    img[other > 0] = (40, 40, 40)
    fm = mask(g, ppf, gw, gh, x0, y0)
    img[fm > 0] = (255, 0, 255)
    ring = np.round((np.array(FLOOR.exterior.coords) - [x0, y0]) * ppf).astype(np.int32)
    cv2.polylines(img, [ring], True, (110, 110, 110), max(3, int(round(1.0 * ppf))), cv2.LINE_AA)
    for p, q, kind, room, hall in doors():
        a = tuple(np.round((p - [x0, y0]) * ppf).astype(int)); b = tuple(np.round((q - [x0, y0]) * ppf).astype(int))
        cv2.line(img, a, b, (120, 72, 36), max(3, int(round(0.6 * ppf))), cv2.LINE_AA)
    Image.fromarray(img).save(f"gpt2/crop-{rk}.png")
    out[rk] = [x0, y0, x0 + bw2, y0 + bh2, ppf]
    print(rk, gw, gh, round(ppf, 1), "px/ft", round(g.area), "sq ft")
json.dump(out, open("crops2.json", "w"))
