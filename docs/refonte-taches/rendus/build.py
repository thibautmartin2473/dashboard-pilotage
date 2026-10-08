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
# Mise en page façon Obsidian (même principe que d3-force) : répulsion entre notes,
# ressorts sur les liens, rappel doux vers le centre, puis recadrage plein écran.
ang = np.arange(n) * np.pi * (3 - np.sqrt(5))
rad = 10 * np.sqrt(0.5 + np.arange(n))
pos = np.stack([rad * np.cos(ang), rad * np.sin(ang)], 1)
vel = np.zeros_like(pos)
dk0 = np.maximum(deg[keep], 1)
cnt = np.bincount(L.ravel(), minlength=n)
lstr = 1 / np.minimum(cnt[L[:, 0]], cnt[L[:, 1]])
bias = cnt[L[:, 0]] / (cnt[L[:, 0]] + cnt[L[:, 1]])
alpha = 1.0
for it in range(520):
    d = pos[None, :, :] - pos[:, None, :]
    l2 = np.maximum((d ** 2).sum(-1), 1.0)
    np.fill_diagonal(l2, np.inf)
    vel += (d * (-30.0 * max(alpha, 0.05) / l2)[:, :, None]).sum(1)
    e = pos[L[:, 1]] + vel[L[:, 1]] - pos[L[:, 0]] - vel[L[:, 0]]
    el = np.sqrt((e ** 2).sum(-1)) + 1e-6
    f = ((el - 18.0) / el * alpha * lstr)[:, None] * e
    np.add.at(vel, L[:, 1], -f * bias[:, None])
    np.add.at(vel, L[:, 0], f * (1 - bias)[:, None])
    vel += -pos * 0.012
    vel *= 0.6
    pos += vel
    alpha *= 0.99
pos -= pos.mean(0)
W, H = 1440, 900
# Recadrage : le nuage rond est étiré doucement pour remplir la page (marges 4 %), centré.
lo = np.percentile(pos, 1, axis=0); hi = np.percentile(pos, 99, axis=0)
u = (pos - (lo + hi) / 2) / ((hi - lo) / 2)
xs = W / 2 + u[:, 0] * W * 0.46; ys = H / 2 + u[:, 1] * H * 0.44
dk = deg[keep]
groups = [notes[names[o]].split(os.sep)[0] for o in keep]
lines = ''.join(f'<line x1="{xs[a]:.0f}" y1="{ys[a]:.0f}" x2="{xs[b]:.0f}" y2="{ys[b]:.0f}"/>' for a, b in L)
def col(rel):
    parts = rel.split(os.sep)
    top = parts[0]; sub = parts[1] if len(parts) > 1 else ''
    if top.startswith('02'):
        return {'Finance': '#7A1E2C', 'Design': '#A0714A', 'Perso': '#6E7B45'}.get(sub, '#2E557D')
    if top.startswith('01'):
        return '#3B6A9A'
    if top.startswith('03'):
        return '#4E5C78'
    return '#5A6478'
dots = ''.join(f'<circle cx="{xs[i]:.0f}" cy="{ys[i]:.0f}" r="{2.2 + min(dk[i], 60) ** 0.5 * 0.9:.1f}" fill="{col(notes[names[keep[i]]])}"/>' for i in range(n))
svg = f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W} {H}" preserveAspectRatio="xMidYMid slice"><g stroke="#4E5C78" stroke-width="0.7" stroke-opacity="0.45">{lines}</g><g>{dots}</g></svg>'
open(os.path.join(OUT, 'graph.svg'), 'w', encoding='utf-8').write(svg)
print(json.dumps({'notes': N, 'avec_liens': n, 'liens': len(links)}))
