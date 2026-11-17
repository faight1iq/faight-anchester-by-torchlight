"""E13 Fear is the Key: dungeon layout in feet (x east, y south). Writes layout.json and e13-layout.svg."""
import json
from shapely.geometry import Polygon, LineString, box
from shapely.ops import unary_union

W, H = 195, 130
CW = 11.0  # corridor wall centrelines 11 ft apart -> ~10 ft clear
rooms = {
 "01": ("The Stair Foot", Polygon([(6,6),(30,6),(30,30),(6,30)])),
 "03": ("The Injection Ward", Polygon([(112,24),(160,16),(168,56),(120,66)])),
 "04": ("The Crooked Knot", Polygon([(58,58),(84,70),(60,84),(46,74)])),
 "05": ("Orme's Study", Polygon([(8,40),(32,34),(38,58),(14,64)])),
 "06": ("The Gas Works", Polygon([(4,96),(34,90),(38,122),(6,124)])),
 "07": ("The Specimen Vault", Polygon([(100,94),(134,89),(141,122),(104,127)])),
 "08": ("The Machine Ward", Polygon([(156,64),(192,70),(192,127),(150,127)])),
}
# corridors: polyline, rooms joined at (start, end)
halls = {
 "02": ("The Long Hall", [(28,18),(92,18),(116,40)], ("01","03")),
 "c2": ("Ward Passage", [(142,60),(135,74),(92,74),(80,69)], ("03","04")),
 "c3": ("Crooked Hall North", [(60,62),(56,38),(34,44)], ("04","05")),
 "c4": ("Crooked Hall West", [(50,74),(26,82),(18,94)], ("04","06")),
 "c5": ("Crooked Hall South", [(58,82),(66,106),(103,110)], ("04","07")),
 "c6": ("Vault Passage", [(137,108),(145,100),(154,100)], ("07","08")),
}
hallpolys = {k: LineString(p).buffer(CW/2, cap_style="flat", join_style="mitre", mitre_limit=4) for k,(n,p,_) in halls.items()}
U = unary_union([r for _,r in rooms.values()] + list(hallpolys.values()))
assert U.geom_type == "Polygon", U.geom_type
doors = []
for k,(n,p,(a,b)) in halls.items():
    for rk in (a,b):
        rb = rooms[rk][1].exterior
        seg = rb.intersection(hallpolys[k])
        if seg.is_empty: raise SystemExit(f"no mouth {k}-{rk}")
        segs = [seg] if seg.geom_type=="LineString" else list(seg.geoms)
        s = max(segs, key=lambda g: g.length)
        (x1,y1),(x2,y2) = s.coords[0], s.coords[-1]
        doors.append({"hall":k,"room":rk,"mouth":[round(x1,2),round(y1,2),round(x2,2),round(y2,2)]})
out = {"W":W,"H":H,"rooms":{k:{"name":n,"poly":list(map(list,r.exterior.coords))} for k,(n,r) in rooms.items()},
       "halls":{k:{"name":n,"line":p,"joins":j} for k,(n,p,j) in halls.items()},
       "floor":[list(map(list,U.exterior.coords))]+[list(map(list,i.coords)) for i in U.interiors],
       "doors":doors, "stairs":[{"rect":[9,8,27,14],"dir":"n"}]}
json.dump(out, open("layout.json","w"), indent=1)
# SVG
s = 6
def pts(c): return " ".join(f"{x*s:.1f},{y*s:.1f}" for x,y in c)
svg = [f'<svg xmlns="http://www.w3.org/2000/svg" width="{W*s}" height="{H*s}" viewBox="0 0 {W*s} {H*s}">',
       f'<rect width="100%" height="100%" fill="#181818"/>']
for x in range(0,W+1,5): svg.append(f'<line x1="{x*s}" y1="0" x2="{x*s}" y2="{H*s}" stroke="#262626" stroke-width="{2 if x%10==0 else 0.6}"/>')
for y in range(0,H+1,5): svg.append(f'<line x1="0" y1="{y*s}" x2="{W*s}" y2="{y*s}" stroke="#262626" stroke-width="{2 if y%10==0 else 0.6}"/>')
for ring in out["floor"]: svg.append(f'<polygon points="{pts(ring)}" fill="#d9cfbf" stroke="#3a3330" stroke-width="{s}"/>')
st = out["stairs"][0]["rect"]; svg.append(f'<rect x="{st[0]*s}" y="{st[1]*s}" width="{(st[2]-st[0])*s}" height="{(st[3]-st[1])*s}" fill="#8fd6d6" stroke="#333"/>')
for d in doors:
    x1,y1,x2,y2 = d["mouth"]; svg.append(f'<line x1="{x1*s}" y1="{y1*s}" x2="{x2*s}" y2="{y2*s}" stroke="#7a4b22" stroke-width="{s*0.8}"/>')
for k,r in out["rooms"].items():
    c = Polygon(r["poly"]).centroid; svg.append(f'<text x="{c.x*s}" y="{c.y*s}" font-family="Georgia" font-size="15" text-anchor="middle" fill="#222">{k} {r["name"].replace("&","and")}</text>')
for k,h in out["halls"].items():
    l = LineString(h["line"]).interpolate(0.5, normalized=True); svg.append(f'<text x="{l.x*s}" y="{l.y*s+5}" font-family="Georgia" font-size="12" text-anchor="middle" fill="#553">{h["name"]}</text>')
svg.append('</svg>'); open("e13-layout.svg","w").write("\n".join(svg))
print("area", round(U.area), "doors", len(doors))
