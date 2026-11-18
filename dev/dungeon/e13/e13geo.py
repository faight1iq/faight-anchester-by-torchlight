"""E13 geometry shared by the crop, base and composite stages. Feet; 40 px per ft on the final map."""
import json, os
import numpy as np, cv2
from shapely.geometry import Polygon, LineString, box
from shapely.ops import unary_union

HERE = os.path.dirname(os.path.abspath(__file__))
L = json.load(open(os.path.join(HERE, "layout.json")))
W, H, PPF = L["W"], L["H"], 40
CW = 11.0
rooms = {k: Polygon(v["poly"]) for k, v in L["rooms"].items()}
halls_raw = {k: LineString(v["line"]).buffer(CW / 2, cap_style="flat", join_style="mitre", mitre_limit=4) for k, v in L["halls"].items()}
ROOMS_U = unary_union(list(rooms.values()))
halls = {k: g.difference(ROOMS_U) for k, g in halls_raw.items()}
FLOOR = Polygon(L["floor"][0])                       # wall centre lines = Foundry walls
STAIR = box(*L["stairs"][0]["rect"])


def part(k):
    return rooms.get(k) or halls[k]


# region: parts, clip box (ft) or None, floor texture, short description key
REG = {
    "r01": (["01"], None, "brick"),
    "h02a": (["02"], (20, 0, 80, 40), "flag"),
    "h02b": (["02"], (80, 0, 130, 60), "flag"),
    "r03": (["03"], None, "tile"),
    "r04": (["04"], None, "flag"),
    "c2a": (["c2"], (110, 40, 160, 90), "flag"),
    "c2b": (["c2"], (60, 40, 110, 90), "flag"),
    "c3": (["c3"], None, "flag"),
    "c4": (["c4"], None, "flag"),
    "c5": (["c5"], None, "flag"),
    "r05": (["05"], None, "wood"),
    "r06": (["06"], None, "concrete"),
    "r07": (["07", "c6"], None, "vault"),
    "r08": (["08"], None, "tile"),
}


def region_floor(rk):
    parts, clip, _ = REG[rk]
    g = unary_union([part(p) for p in parts]).intersection(FLOOR)
    if clip: g = g.intersection(box(*clip))
    if rk == "r01": g = g.difference(STAIR)
    return g


def mask(geom, ppf, w, h, ox=0, oy=0):
    m = np.zeros((h, w), np.uint8)
    gs = [geom] if geom.geom_type == "Polygon" else [g for g in getattr(geom, "geoms", []) if g.geom_type == "Polygon"]
    for g in gs:
        if g.is_empty: continue
        cv2.fillPoly(m, [np.round((np.array(g.exterior.coords) - [ox, oy]) * ppf).astype(np.int32)], 255)
        for i in g.interiors:
            cv2.fillPoly(m, [np.round((np.array(i.coords) - [ox, oy]) * ppf).astype(np.int32)], 0)
    return m


def doors():
    """One door per mouth, centred; 5 ft (Machine Ward 8 ft double). [p, q, kind, room, hall] in ft."""
    out = []
    for d in L["doors"]:
        x1, y1, x2, y2 = d["mouth"]; a, b = np.array([x1, y1]), np.array([x2, y2])
        m = (a + b) / 2; u = (b - a) / np.linalg.norm(b - a)
        half = 4.0 if d["room"] == "08" else 2.5
        out.append((m - u * half, m + u * half, "double" if d["room"] == "08" else "door", d["room"], d["hall"]))
    return out


def lanes(depth_room=10.0, depth_hall=5.0, margin=0.5):
    """Door lanes: rectangles straight out of each door, into the room (10 ft) and into the hall (5 ft)."""
    out = []
    for p, q, kind, room, hall in doors():
        m = (p + q) / 2; u = (q - p) / np.linalg.norm(q - p); n = np.array([-u[1], u[0]])
        if not rooms[room].contains(__import__("shapely").geometry.Point(*(m + n * 1.5))): n = -n
        w = np.linalg.norm(q - p) / 2 + margin
        for side, dep in ((n, depth_room), (-n, depth_hall)):
            out.append((room if side is n else hall, Polygon([m - u * w, m + u * w, m + u * w + side * dep, m - u * w + side * dep])))
    return out
