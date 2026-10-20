"""Watabou glade / forest SVG -> masks for an outdoor map (open ground, trees, water).

usage: python3 glade.py <map.svg> <out_dir> [ft_per_hex=10]
Writes <out_dir>/ground.png, trees.png, water.png (white = present), walk.png (ground minus trees),
preview.png and glade.json {width, height, px_per_svg, ft_per_hex, entrance?}.

Watabou glade maps are drawn on a hex grid: hex circumradius 20 SVG units (34.64 across the flats).
Scale: 140 px per 5 ft (the Foundry grid used by every map in these modules), so one hex of
`ft_per_hex` feet is 28 * ft_per_hex px across the flats.
Layers are told apart by their fill:
  ground  fill #9CB285 (one polygon: everything inside the forest edge)
  water   fill #6BA6B2 (shallows) and #3D7899 (deep)
  trees   fill url(#gradN) crowns, plus their #9699AE shadow blobs
"""
import sys, os, re, json
import numpy as np
import cairosvg
from PIL import Image

GROUND, WATER = ("#9CB285",), ("#6BA6B2", "#3D7899")
HEX_FLATS = 34.641  # SVG units across the flats


def layer_svg(src, keep):
    """Copy of the SVG with every shape black except those `keep(attrs)` says to paint white."""
    out = []
    pos = 0
    for m in re.finditer(r'<path d="([^"]*)"([^>]*?)/?>', src):
        out.append(src[pos:m.start()])
        d, attrs = m.group(1), m.group(2)
        if keep(attrs):
            sw = re.search(r'stroke-width="([^"]*)"', attrs)
            stroke = f' stroke="#FFFFFF" stroke-width="{sw.group(1)}"' if sw and 'stroke="' in attrs and 'stroke="#5B6A5A"' not in attrs else ''
            out.append(f'<path d="{d}" fill="#FFFFFF"{stroke}/>')
        pos = m.end()
    out.append(src[pos:])
    s = "".join(out)
    s = re.sub(r'<rect ([^>]*)fill="[^"]*"', r'<rect \1fill="#000000"', s, count=1)   # background
    s = re.sub(r'<text[^>]*>.*?</text>', '', s, flags=re.S)                           # title
    return s


def render(svg_text, width):
    png = cairosvg.svg2png(bytestring=svg_text.encode(), output_width=width)
    from io import BytesIO
    return (np.array(Image.open(BytesIO(png)).convert("L")) > 127)


def main(svg_path, out_dir, ft_per_hex=10.0):
    src = open(svg_path, encoding="utf-8").read()
    w_svg = float(re.search(r'<svg[^>]*width="([\d.]+)"', src).group(1))
    px_per_svg = 28 * ft_per_hex / HEX_FLATS
    W = int(round(w_svg * px_per_svg))
    os.makedirs(out_dir, exist_ok=True)
    fill = lambda a, cols: any(f'fill="{c}"' in a for c in cols)
    ground = render(layer_svg(src, lambda a: fill(a, GROUND)), W)
    water = render(layer_svg(src, lambda a: fill(a, WATER)), W)
    trees = render(layer_svg(src, lambda a: 'url(#grad' in a or 'fill="#9699AE"' in a), W)
    walk = ground & ~trees
    for n, m in (("ground", ground), ("water", water), ("trees", trees), ("walk", walk)):
        Image.fromarray((m * 255).astype(np.uint8)).save(os.path.join(out_dir, f"{n}.png"))
    prev = np.zeros(ground.shape + (3,), np.uint8)
    prev[ground] = (150, 180, 120); prev[trees & ground] = (40, 70, 50); prev[water] = (60, 120, 160)
    Image.fromarray(prev).resize((ground.shape[1] // 8, ground.shape[0] // 8)).save(os.path.join(out_dir, "preview.png"))
    info = {"width": ground.shape[1], "height": ground.shape[0], "px_per_svg": px_per_svg, "ft_per_hex": ft_per_hex,
            "open_ground_pct": round(100 * walk.mean(), 1), "water_pct": round(100 * water.mean(), 1)}
    json.dump(info, open(os.path.join(out_dir, "glade.json"), "w"), indent=1)
    return info


if __name__ == "__main__":
    print(main(sys.argv[1], sys.argv[2], float(sys.argv[3]) if len(sys.argv) > 3 else 10.0))
