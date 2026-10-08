"""Construit un rendu réaliste de Constellation : graphe réel du vault (liens [[...]]),
mise en page par forces (numpy), puis page HTML du Cockpit épuré avec le graphe en fond."""
import json, os, re, sys
import numpy as np

VAULT = r"C:\Users\thiba\CLAUDE.GLOBAL\Vault"
OUT = os.path.dirname(os.path.abspath(__file__))

notes = {}
for root, dirs, files in os.walk(VAULT):
    dirs[:] = [d for d in dirs if not d.startswith('.')]
    for f in files:
        if f.endswith('.md'):
            p = os.path.join(root, f)
            notes[f[:-3].lower()] = os.path.relpath(p, VAULT)
names = list(notes)
idx = {n: i for i, n in enumerate(names)}
links = set()
for n, rel in notes.items():
    try:
        txt = open(os.path.join(VAULT, rel), encoding='utf-8', errors='ignore').read()
    except OSError:
        continue
    for m in re.findall(r"\[\[([^\]|#]+)", txt):
        t = m.strip().split('/')[-1].lower()
        if t in idx and t != n:
            a, b = sorted((idx[n], idx[t]))
            links.add((a, b))
links = list(links)
N = len(names)
deg = np.zeros(N)
for a, b in links:
    deg[a] += 1; deg[b] += 1
keep = np.where(deg > 0)[0]
remap = {int(o): i for i, o in enumerate(keep)}
L = np.array([(remap[a], remap[b]) for a, b in links])
n = len(keep)
rng = np.random.default_rng(7)
pos = rng.normal(size=(n, 2))
k = 1.0 / np.sqrt(n)
t = 0.1
for it in range(400):
    d = pos[:, None, :] - pos[None, :, :]
    dist = np.sqrt((d ** 2).sum(-1)) + 1e-6
    rep = (k * k / dist ** 2)[:, :, None] * d
    disp = rep.sum(1)
    e = pos[L[:, 0]] - pos[L[:, 1]]
    el = np.sqrt((e ** 2).sum(-1))[:, None] + 1e-6
    att = e * el / k
    np.add.at(disp, L[:, 0], -att)
    np.add.at(disp, L[:, 1], att)
    disp -= pos * 0.35  # gravité vers le centre
    ln = np.sqrt((disp ** 2).sum(-1))[:, None] + 1e-9
    pos += disp / ln * np.minimum(ln, t)
    t *= 0.985
lo = np.percentile(pos, 2, axis=0); hi = np.percentile(pos, 98, axis=0); pos = np.clip((pos - lo) / (hi - lo), -0.02, 1.02)
W, H = 1440, 900
xs = 60 + pos[:, 0] * (W - 120); ys = 40 + pos[:, 1] * (H - 80)
dk = deg[keep]
groups = [notes[names[o]].split(os.sep)[0] for o in keep]
lines = ''.join(f'<line x1="{xs[a]:.0f}" y1="{ys[a]:.0f}" x2="{xs[b]:.0f}" y2="{ys[b]:.0f}"/>' for a, b in L)
dots = ''.join(f'<circle cx="{xs[i]:.0f}" cy="{ys[i]:.0f}" r="{1.6 + min(dk[i], 40) ** 0.5 * 0.9:.1f}"/>' for i in range(n))
svg = f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W} {H}" preserveAspectRatio="xMidYMid slice"><g stroke="#EEF2F8" stroke-width="0.6">{lines}</g><g fill="#F6F8FC">{dots}</g></svg>'
open(os.path.join(OUT, 'graph.svg'), 'w', encoding='utf-8').write(svg)
print(json.dumps({'notes': N, 'avec_liens': n, 'liens': len(links)}))
