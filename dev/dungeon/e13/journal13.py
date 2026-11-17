"""e13-content.md -> e13-journal.json (pages of HTML for the Foundry journal) and e13-handouts.json"""
import re, json, html
src = open('e13-content.md').read()
def inline(s):
    s = html.escape(s, quote=False)
    s = re.sub(r'\*\*(.+?)\*\*', r'<strong>\1</strong>', s)
    s = re.sub(r'(?<![\w*])\*(?!\s)(.+?)(?<!\s)\*(?!\w)', r'<em>\1</em>', s)
    return s
ACT = {'Fluke-Ridden Orderl': 'fluke-ridden-orderly', 'Eye Fluke Larva': 'eye-fluke-larva', 'Elder Angle Hound': 'elder-angle-hound', 'Angle Hound': 'angle-hound-e13',
       'Gedwild': 'gedwild-e13', 'Dr. Valentin Orme': 'orme-e13', 'Porcelain Doll': 'porcelain-doll', 'The Machine': 'the-machine'}
def link_actors(h, done=None):
    done = set() if done is None else done
    for name, slug in ACT.items():
        if slug in done: continue
        m = re.search(re.escape(name) + r'(?:y|ies|s)?' + (r'(?! Ward)' if name == 'The Machine' else ''), h)
        if m and '{{' not in h[max(0, m.start()-3):m.start()]:
            h = h[:m.start()] + '{{actor:%s|%s}}' % (slug, m.group(0)) + h[m.end():]; done.add(slug)
    return h
def block(md):
    out, lst = [], False
    for line in md.strip().split('\n'):
        t = line.strip()
        if not t: 
            if lst: out.append('</ul>'); lst = False
            continue
        if t.startswith('- '):
            if not lst: out.append('<ul>'); lst = True
            out.append('<li>' + inline(t[2:]) + '</li>'); continue
        if lst: out.append('</ul>'); lst = False
        if t.startswith('### '): out.append('<h3>' + inline(t[4:]) + '</h3>')
        elif t.startswith('Read-aloud:'): out.append('<blockquote><p><em>' + inline(t[11:].strip()) + '</em></p></blockquote>')
        elif re.match(r'^(How it plays|Resolution|Outcome|Rewards|Threads):', t):
            k, v = t.split(':', 1); v = v.strip(); out.append('<p><strong>' + k + '.</strong> ' + inline(v[:1].upper() + v[1:]) + '</p>')
        else: out.append('<p>' + inline(t) + '</p>')
    if lst: out.append('</ul>')
    done = set()
    out = [l if l.startswith('<blockquote') else link_actors(l, done) for l in out]
    return '\n'.join(out)
parts = re.split(r'^## ', src, flags=re.M)
pages = []
over = []
for p in parts[1:]:
    title, body = p.split('\n', 1)
    body = body.split('\n---')[0]
    if title.startswith('13.'):
        pages.append({'name': title.strip(), 'html': block(body)})
    elif title.startswith('Handout'):
        hand = {'name': 'The Patron\'s Letters', 'html': block(body)}
    elif title.startswith('Stat blocks'):
        pass
    else:
        over.append('<h2>' + inline(title.strip()) + '</h2>' + block(body))
pages.insert(0, {'name': '13.00 Overview', 'html': '\n'.join(over)})
json.dump(pages, open('e13-journal.json', 'w'), indent=0)
json.dump([hand], open('e13-handouts.json', 'w'), indent=0)
print([p['name'] for p in pages], sum(len(p['html']) for p in pages))
