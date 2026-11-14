import re, json, markdown
src = open('e12-brew.md').read()
src = re.sub(r'<!--.*?-->', '', src, flags=re.S)
S = {"12.01":"ZkHbGi5SnQpGufR7","12.02":"OB3P8CKQ5Snk67Ce","12.03":"hNFySq2EzihkqwQx","12.04":"uMMiiU2vVOITPNYq","12.05":"dDRJG8D53QCzIwz3","12.06":"pOKbHzIU1ujkLUWy","12.07":"Cn2wVTiN8YOqMC3U","12.08":"3MBcmrTi3SPhLe5C","12.09":"A6mConZtj6FBpxLi","12.10":"RZuyar2z6WVMqojP","12.11":"CXEjxnkscV68usjA","12.12":"WiwPsgWyFg0ER5FT","12.00":"vUxHCh5yq3CIMn0a"}
A = {"Dr. Valentin Orme":"PbJ4v4VFifdXG4Di","The Thing Under the Bed":"T7WTlfznx3AeuIZu","Tranced Orderly":"M6Q31I8hZVz0Rchp","Mr. Josiah Clinker":"HhGCdvD4IUp3C59l","The Thing That Would Not Burn":"ueX8tFjmrmeLPNeD","Dr. Aldous Pemberton":"tgehoWTMZFRSGWPw","The Night Nurse":"CniduTT1hO3iooK3","Sleepwalking Patient":"RmtvMnz8ob15op4S"}
def clean(t):
    t = re.sub(r'\{\{artist.*?\n\}\}', '', t, flags=re.S)
    t = re.sub(r'\{\{pageNumber,auto\}\}|\{\{show-footer\}\}|\\page|\\column|\{\{spacer[^}]*\}\}', '', t)
    t = re.sub(r'\{\{pageheader.*?\n\}\}\n\{\{pageline.*?\n\}\}\n', '', t, flags=re.S)
    t = re.sub(r'<img[^>]*?/>', '', t, flags=re.S)
    t = re.sub(r'\{\{descriptive\n(.*?)\n\}\}', lambda m: '<blockquote>' + markdown.markdown(m.group(1).strip()) + '</blockquote>', t, flags=re.S)
    t = re.sub(r'\{\{(?:noIndent|atbl-keeper-summary|atbl-episode-summary|castMember|atbl-dialogue|classified|artist|wide)\s*\n?', '', t)
    t = re.sub(r'^\}\}\s*$', '', t, flags=re.M)
    return t
def html(t):
    h = markdown.markdown(clean(t), extensions=['tables'])
    h = h.replace('<blockquote class="readaloud">', '<blockquote>')
    return h
def link_scenes(h):
    return re.sub(r'\b(12\.(0[1-9]|1[0-2]))\b(?![^<]*</a>)', lambda m: f'@UUID[Scene.{S[m.group(1)]}]{{{m.group(1)}}}', h, count=0)
pages = []
def add(name, md, scene=None, actors=()):
    h = html(md)
    if scene: h = f'<p><strong>Scene:</strong> @UUID[Scene.{S[scene]}]{{{scene}}}</p>' + h
    for a in actors: h = h.replace(f'<strong>{a}</strong>', f'@UUID[Actor.{A[a]}]{{{a}}}', 1)
    pages.append({"name": name, "html": h})
opener, rest = src.split('### Scene 1:', 1)
rest = '### Scene 1:' + rest
ov = opener.split('{{wide\n## Hawthorne Greens')[0]
mp = '## Hawthorne Greens' + opener.split('{{wide\n## Hawthorne Greens')[1]
add('Overview', ov)
add('Hawthorne Greens (the plaque)', mp.replace('## Hawthorne Greens', ''), scene='12.01')
scenes = re.split(r'(?=^### Scene \d+:|^### Resolution|^\{\{wide\n## Cast and Horrors$)', rest, flags=re.M)
scmap = {3:'12.02',4:'12.03',5:'12.04',6:'12.05',7:'12.06',8:'12.07',9:'12.08',10:'12.09',11:'12.10',12:'12.11',13:'12.12',2:'12.01'}
for sec in scenes:
    if not sec.strip(): continue
    m = re.match(r'### Scene (\d+): (.*)', sec)
    if m:
        n = int(m.group(1)); body = sec.split('\n',1)[1]
        add(f'{n}. {m.group(2).strip()}', body, scene=scmap.get(n), actors=[x for x in A if x in body])
    elif sec.startswith('### Resolution'):
        add('Resolution', sec.split('\n',1)[1])
    elif 'Cast and Horrors' in sec:
        cast, hand = sec.split('## Player Handouts')
        cast = cast.replace('## Cast and Horrors, continued','').replace('## Cast and Horrors','')
        add('Cast and Horrors', cast, actors=list(A))
        handouts = hand
for p in pages: p['html'] = p['html'].replace('—','-')
parts = re.split(r'^#### ', handouts, flags=re.M)
handout_pages = [{"name":p.split('\n',1)[0].strip(),"html":html(p.split('\n',1)[1])} for p in parts[1:]]
json.dump({"pages":pages,"handouts":handout_pages}, open('/mnt/user-data/outputs/e12-journal.json','w'))
for p in pages: print(p['name'], len(p['html']))
print([len(h['html']) for h in handout_pages])
print(pages[7]['html'][:1500])
