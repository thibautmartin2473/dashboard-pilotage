// Exporte TOUTES les tables de la base Supabase en JSON (une sauvegarde lisible, hors Supabase). À lancer depuis
// la racine du repo :
//
//   node --env-file=.env.local scripts/export-supabase.mjs [--dry-run] [--out=<dossier racine>]
//
// LECTURE SEULE : aucune écriture en base. Les tables sont découvertes par la description OpenAPI de PostgREST
// (clé service_role) ; chaque table est lue page par page (pagination suivie, tri par clé primaire) jusqu'à la
// dernière ligne, chaque requête avec un délai maximal de 30 s. Sortie : <racine>\AAAA-MM-JJ\<table>.json
// (+ _export.json : tables, nombres de lignes), la racine par défaut étant C:\Users\thiba\GLOBAL\Backups\supabase,
// qui part dans la sauvegarde OneDrive de 21 h.
// L'export s'écrit d'abord dans AAAA-MM-JJ.partial puis le dossier est renommé À LA FIN : un export interrompu ne
// ressemble jamais à un export complet. La rotation ne compte et ne supprime que des dossiers AAAA-MM-JJ qui
// contiennent _export.json ; les 8 derniers sont gardés. --dry-run liste les tables et leurs nombres de lignes sans
// rien écrire. 0 token.
// État : <racine>\_etat.json (succès ou échec, date), relayé par scripts/push-avancement.mjs dans l'onglet Avancement
// (« dernier export de la base : il y a N jours » ou « échec »).
// Tâche planifiée : le dimanche à 20h40 (scripts/install-taches.ps1).

import { existsSync, mkdirSync, readFileSync, readdirSync, renameSync, rmSync, writeFileSync } from 'node:fs';
import { join, resolve, sep } from 'node:path';

const ROOT_DEFAUT = 'C:/Users/thiba/GLOBAL/Backups/supabase';
const GARDER = 8; // nombre d'exports conservés
const PAGE = 1000; // lignes par requête (plafond par défaut de PostgREST)
const DELAI_MS = 30000; // délai maximal d'une requête

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
  const res = await fetch(`${base}${path}`, { headers: { ...headers, ...extra }, signal: AbortSignal.timeout(DELAI_MS) });
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
const etatPath = join(root, '_etat.json');

// État du dernier export (écrit à la fin, succès ou échec) ; `dernier_succes` survit à un échec.
function ecrireEtat(etat) {
  let precedent = null;
  try {
    precedent = JSON.parse(readFileSync(etatPath, 'utf-8'));
  } catch {
    /* pas d'état précédent */
  }
  const complet = { ...etat, tentative_le: new Date().toISOString(), dernier_succes: etat.ok ? today : (precedent?.dernier_succes ?? null) };
  mkdirSync(root, { recursive: true });
  writeFileSync(`${etatPath}.tmp`, JSON.stringify(complet, null, 1));
  renameSync(`${etatPath}.tmp`, etatPath);
}

const dir = join(root, today);
const partial = `${dir}.partial`;
const old = `${dir}.old`;

// Nettoyage au démarrage : tout dossier *.partial de la racine (restes d'exports interrompus, quelle que soit leur
// date) est supprimé ; un AAAA-MM-JJ.old (crash entre les deux renommages) est restauré si le dossier définitif
// manque, supprimé sinon. Garde-fou : jamais hors de la racine de sauvegarde.
function nettoyerRestes() {
  if (!existsSync(root)) return;
  for (const e of readdirSync(root, { withFileTypes: true })) {
    if (!e.isDirectory()) continue;
    const target = resolve(root, e.name);
    if (!target.startsWith(root + sep)) continue;
    if (e.name.endsWith('.partial')) {
      rmSync(target, { recursive: true, force: true });
    } else if (/^\d{4}-\d{2}-\d{2}\.old$/.test(e.name)) {
      const final = target.slice(0, -'.old'.length);
      if (existsSync(final)) rmSync(target, { recursive: true, force: true });
      else renameSync(target, final);
    }
  }
}

async function main() {
  const tables = await listTables();
  if (!tables.length) throw new Error('Aucune table trouvée : rien exporté.');
  if (!dry) {
    nettoyerRestes();
    mkdirSync(partial, { recursive: true });
  }
  const manifest = { date: today, genere_le: new Date().toISOString(), tables: {} };
  let total = 0;
  for (const t of tables) {
    const rows = await readAll(t);
    manifest.tables[t.name] = rows.length;
    total += rows.length;
    if (!dry) writeFileSync(join(partial, `${t.name}.json`), JSON.stringify(rows, null, 1));
    console.log(`${t.name.padEnd(24)} ${String(rows.length).padStart(6)} ligne(s)`);
  }
  if (dry) {
    console.log(`--dry-run : ${tables.length} table(s), ${total} ligne(s), rien écrit.`);
    return;
  }
  writeFileSync(join(partial, '_export.json'), JSON.stringify(manifest, null, 1));
  // Fin de l'export : le dossier prend son nom définitif. Un export du même jour est d'abord mis de côté (.old),
  // supprimé seulement après le succès du renommage, restauré s'il échoue : jamais de jour sans sauvegarde.
  const avaitAncien = existsSync(dir);
  if (avaitAncien) renameSync(dir, old);
  try {
    renameSync(partial, dir);
  } catch (err) {
    if (avaitAncien) renameSync(old, dir);
    throw err;
  }
  if (avaitAncien) rmSync(old, { recursive: true, force: true });

  // Rotation : seuls comptent (et seuls sont supprimés) les dossiers AAAA-MM-JJ DIRECTEMENT sous la racine qui
  // contiennent _export.json (un dossier sans manifeste n'est pas un export : on n'y touche pas).
  const exports_ = readdirSync(root, { withFileTypes: true })
    .filter((e) => e.isDirectory() && /^\d{4}-\d{2}-\d{2}$/.test(e.name) && existsSync(join(root, e.name, '_export.json')))
    .map((e) => e.name)
    .sort();
  const anciens = exports_.slice(0, Math.max(0, exports_.length - GARDER));
  for (const name of anciens) {
    const target = resolve(root, name);
    if (!target.startsWith(root + sep)) continue; // garde-fou : jamais hors du dossier de sauvegarde
    rmSync(target, { recursive: true, force: true });
  }
  ecrireEtat({ ok: true, date: today, tables: tables.length, lignes: total, erreur: null });
  console.log(`Export ${today} : ${tables.length} table(s), ${total} ligne(s) dans ${dir} ; ${anciens.length} ancien(s) export(s) supprimé(s) (${GARDER} gardés).`);
}

try {
  await main();
} catch (err) {
  const message = err?.name === 'TimeoutError' ? `délai de ${DELAI_MS / 1000} s dépassé` : (err?.message ?? String(err));
  console.error(`Export échoué : ${message}`);
  if (!dry) {
    rmSync(partial, { recursive: true, force: true });
    try {
      ecrireEtat({ ok: false, date: today, erreur: message.slice(0, 300) });
    } catch (e) {
      console.error(`État non écrit : ${e.message}`);
    }
  }
  process.exitCode = 1;
}
