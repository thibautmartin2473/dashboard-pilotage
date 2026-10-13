// Exporte TOUTES les tables de la base Supabase en JSON (une sauvegarde lisible, hors Supabase). À lancer depuis
// la racine du repo :
//
//   node --env-file=.env.local scripts/export-supabase.mjs [--dry-run] [--out=<dossier racine>]
//
// LECTURE SEULE : aucune écriture en base. Les tables sont découvertes par la description OpenAPI de PostgREST
// (clé service_role) ; chaque table est lue page par page (pagination suivie, tri par clé primaire) jusqu'à la
// dernière ligne. Sortie : <racine>\AAAA-MM-JJ\<table>.json (+ _export.json : tables, nombres de lignes), la
// racine par défaut étant C:\Users\thiba\CLAUDE.GLOBAL\Backups\supabase, qui part dans la sauvegarde OneDrive de
// 21 h. Seuls les 8 derniers exports (dossiers AAAA-MM-JJ de ce dossier) sont gardés, les plus anciens sont
// supprimés. --dry-run liste les tables et leurs nombres de lignes sans rien écrire. 0 token.
// Tâche planifiée : le dimanche à 20h40 (scripts/install-taches.ps1).

import { mkdirSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { join, resolve, sep } from 'node:path';

const ROOT_DEFAUT = 'C:/Users/thiba/CLAUDE.GLOBAL/Backups/supabase';
const GARDER = 8; // nombre d'exports conservés
const PAGE = 1000; // lignes par requête (plafond par défaut de PostgREST)

const args = process.argv.slice(2);
const dry = args.includes('--dry-run');
const root = resolve(args.find((a) => a.startsWith('--out='))?.slice(6) ?? ROOT_DEFAUT);

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error('Variables NEXT_PUBLIC_SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY requises (node --env-file=.env.local ...).');
  process.exit(1);
}
const base = `${url.replace(/\/$/, '')}/rest/v1`;
const headers = { apikey: key, Authorization: `Bearer ${key}` };

async function get(path, extra = {}) {
  const res = await fetch(`${base}${path}`, { headers: { ...headers, ...extra } });
  if (!res.ok && res.status !== 206) throw new Error(`${path} : HTTP ${res.status} ${(await res.text()).slice(0, 200)}`);
  return res;
}

// Tables = chemins « /<table> » de la description OpenAPI (les fonctions « /rpc/... » sont ignorées). La clé
// primaire est lue dans la description de la colonne (« <pk/> ») ; à défaut, la première colonne.
async function listTables() {
  const spec = await (await get('/', { Accept: 'application/openapi+json' })).json();
  const tables = Object.keys(spec.paths ?? {})
    .filter((p) => p !== '/' && !p.startsWith('/rpc/'))
    .map((p) => p.slice(1))
    .sort();
  return tables.map((name) => {
    const cols = Object.entries(spec.definitions?.[name]?.properties ?? {});
    const pk = cols.filter(([, c]) => String(c.description ?? '').includes('<pk/>')).map(([n]) => n);
    return { name, order: pk.length ? pk : cols.slice(0, 1).map(([n]) => n) };
  });
}

async function readAll(table) {
  const out = [];
  const order = table.order.length ? `&order=${table.order.map((c) => `${encodeURIComponent(c)}.asc`).join(',')}` : '';
  for (let from = 0; ; from += PAGE) {
    const res = await get(`/${encodeURIComponent(table.name)}?select=*${order}`, { Range: `${from}-${from + PAGE - 1}`, 'Range-Unit': 'items' });
    const page = await res.json();
    out.push(...page);
    if (page.length < PAGE) break;
  }
  return out;
}

const today = new Intl.DateTimeFormat('sv-SE', { timeZone: 'Europe/Paris', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
const tables = await listTables();
if (!tables.length) {
  console.error('Aucune table trouvée : rien exporté.');
  process.exit(1);
}

const dir = join(root, today);
if (!dry) mkdirSync(dir, { recursive: true });
const manifest = { date: today, genere_le: new Date().toISOString(), tables: {} };
let total = 0;
for (const t of tables) {
  const rows = await readAll(t);
  manifest.tables[t.name] = rows.length;
  total += rows.length;
  if (!dry) writeFileSync(join(dir, `${t.name}.json`), JSON.stringify(rows, null, 1));
  console.log(`${t.name.padEnd(24)} ${String(rows.length).padStart(6)} ligne(s)`);
}
if (dry) {
  console.log(`--dry-run : ${tables.length} table(s), ${total} ligne(s), rien écrit.`);
  process.exit(0);
}
writeFileSync(join(dir, '_export.json'), JSON.stringify(manifest, null, 1));

// Rotation : on ne supprime que des dossiers AAAA-MM-JJ DIRECTEMENT sous la racine de sauvegarde.
const exports_ = readdirSync(root, { withFileTypes: true })
  .filter((e) => e.isDirectory() && /^\d{4}-\d{2}-\d{2}$/.test(e.name))
  .map((e) => e.name)
  .sort();
const anciens = exports_.slice(0, Math.max(0, exports_.length - GARDER));
for (const name of anciens) {
  const target = resolve(root, name);
  if (!target.startsWith(root + sep)) continue; // garde-fou : jamais hors du dossier de sauvegarde
  rmSync(target, { recursive: true, force: true });
}
console.log(`Export ${today} : ${tables.length} table(s), ${total} ligne(s) dans ${dir} ; ${anciens.length} ancien(s) export(s) supprimé(s) (${GARDER} gardés).`);
