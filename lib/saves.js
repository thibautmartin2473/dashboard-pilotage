// Outils MCP « saves Instagram » : lecture seule de la table instagram_saves.
// `getDb` renvoie un client Supabase (admin côté serveur) : injecté pour les tests.
// Aucune écriture, aucune autre table.

import { ToolInputError } from './mcp.js';
import { formatResults, formatSave, KINDS, planSearch, rankSaves, THEMES } from './saves-rank.js';

const TABLE = 'instagram_saves';
const LIST_COLS =
  'url,caption,author,saved_at,tags,category,kind,media_type,ville,arrondissement,arrondissements,cuisine,adresse,resume,retenir,repond_a,recos,attention';
const DETAIL_COLS = `${LIST_COLS},transcript`;
const CANDIDATES = 300;

// Jamais de « liste vide » quand la requête a échoué (bug 127e2db) : l'erreur remonte. Mais le détail de
// Supabase (noms de colonnes, requête) reste dans les journaux : le client ne voit qu'un message sûr.
function dbError(error) {
  console.error(`[mcp] Supabase ${error.code ?? '?'} : ${error.message}`);
  if (error.code === '42703' || error.code === '42704') {
    return new ToolInputError('Schéma des saves obsolète : exécuter supabase/instagram_v2.sql dans Supabase (SQL Editor).');
  }
  if (error.code === 'PGRST205') return new ToolInputError('Table instagram_saves absente : exécuter supabase/instagram.sql puis instagram_v2.sql.');
  return new Error('Erreur de base de données');
}

function withFilters(q, plan) {
  if (plan.kind) q = q.eq('kind', plan.kind);
  if (plan.theme) q = q.eq('category', plan.theme);
  if (plan.since) q = q.gte('saved_at', plan.since);
  if (plan.arrParam) q = q.contains('arrondissements', [plan.arrParam]);
  return q.order('saved_at', { ascending: false, nullsFirst: false }).limit(CANDIDATES);
}

// Candidats (larges) côté base, classement côté serveur (lib/saves-rank.js), comme recall.py :
// les saves qui contiennent un mot de la requête, plus les autres saves du même arrondissement
// (classées après). Sans mot ni filtre ni lieu, rien à chercher.
export async function searchSaves(db, plan) {
  const select = () => db.from(TABLE).select(LIST_COLS);
  const queries = [];
  if (plan.tsquery) queries.push(withFilters(select().textSearch('search', plan.tsquery, { config: 'french_unaccent' }), plan));
  if (plan.wantArrs.length && !plan.arrParam) queries.push(withFilters(select().overlaps('arrondissements', plan.wantArrs), plan));
  if (!plan.tsquery && plan.hasFilters) queries.push(withFilters(select(), plan));
  if (!queries.length) throw new ToolInputError('Requête trop vague : précise un sujet, un lieu (quartier, arrondissement), une cuisine ou un filtre (kind, theme, since).');

  const rows = new Map();
  for (const { data, error } of await Promise.all(queries)) {
    if (error) throw dbError(error);
    for (const r of data) rows.set(r.url, r);
  }
  return rankSaves([...rows.values()], plan);
}

// Les notes stockent l'URL telle qu'exportée (/p/, /reel/...) : on essaie les formes courantes, en exact.
export async function getSave(db, input) {
  const s = typeof input === 'string' ? input.trim().slice(0, 300) : '';
  const code = /instagram\.com\/(?:p|reels?|tv)\/([\w-]+)/.exec(s)?.[1] ?? (/^[\w-]{5,30}$/.test(s) ? s : null);
  if (!code) throw new ToolInputError('url invalide : attendu le lien Instagram de la save (https://www.instagram.com/p/<code>/) ou son code.');
  const urls = ['p', 'reel', 'reels', 'tv'].map((k) => `https://www.instagram.com/${k}/${code}/`);
  const { data, error } = await db.from(TABLE).select(DETAIL_COLS).in('url', urls).limit(1);
  if (error) throw dbError(error);
  if (!data.length) throw new ToolInputError(`Aucune save enregistrée avec ce lien (${code}).`);
  return formatSave(data[0]);
}

export function saveTools(getDb, now = () => new Date()) {
  return [
    {
      name: 'search_saves',
      description:
        "Cherche dans les saves Instagram de Thibaut (posts et reels qu'il a enregistrés), classées par pertinence. " +
        "À APPELER quand il demande : un bar, un resto, un café, une adresse ou une idée de sortie (« quel bar dans le Marais », « quel resto coréen dans le 11e »), " +
        "des vidéos à regarder ou des tutos pour progresser sur un sujet (« quelles vidéos pour progresser sur Claude Code ce mois-ci »), " +
        "ou ce qu'il a « sauvegardé sur Instagram » (skills, recettes, idées). " +
        "Écris le lieu et la cuisine dans `query` tels qu'il les dit (« Marais », « 11e », « coréen ») : ils sont reconnus tout seuls. " +
        "Pour des vidéos à apprendre, ajoute kind=skill et since. " +
        "Le résultat signale quand AUCUNE save ne cumule tous les critères (ex. coréen ET 11e) : dans ce cas, dis-le à Thibaut au lieu de présenter le résultat comme une bonne réponse. " +
        "Lecture seule ; renvoie thème, usage, compte, date d'enregistrement, lieu, adresse, résumé, recommandations, réserves et lien, avec une ligne « Source à citer » : cite ainsi (« d'après la vidéo de @compte enregistrée le JJ/MM/AAAA »).",
      inputSchema: {
        type: 'object',
        properties: {
          query: { type: 'string', description: "Demande ou mots-clés, avec le lieu et la cuisine (ex. « bar Marais », « resto coréen 11e », « claude code »)." },
          arrondissement: { type: 'integer', minimum: 1, maximum: 20, description: "Filtre STRICT : uniquement les saves de cet arrondissement de Paris. Si tu n'es pas sûr, mets plutôt le lieu dans `query`." },
          cuisine: { type: 'string', description: 'Ex. coréen, japonais, italien, burger, bar & cocktails, brunch & café. Sert au classement (pas un filtre strict).' },
          kind: { type: 'string', enum: KINDS, description: 'Usage : skill = à mettre en pratique (tutos, outils, recettes), connaissance = à savoir, loisir = sorties, lieux, divertissement.' },
          theme: { type: 'string', enum: THEMES, description: 'Thème exact (ex. « Restos & Bars », « IA & Tech »). Filtre strict.' },
          since: { type: 'string', description: "Enregistrées depuis : date AAAA-MM-JJ ou durée (30d = 30 jours, 2w = 2 semaines, 1m = 30 jours). « Ce mois-ci » = 1m." },
          limit: { type: 'integer', minimum: 1, maximum: 10, description: 'Nombre de résultats (5 par défaut, 10 au plus).' },
        },
        additionalProperties: false,
      },
      annotations: { title: 'Chercher dans les saves Instagram', readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
      run: async (args) => {
        const plan = planSearch(args, now());
        return formatResults(await searchSaves(getDb(), plan), plan);
      },
    },
    {
      name: 'get_save',
      description:
        "Détail complet d'UNE save Instagram de Thibaut à partir de son lien (renvoyé par search_saves) : légende, transcription du reel si elle existe, recommandations concrètes, réserves, sujets, lieu. " +
        "À appeler après search_saves quand il faut le contenu exact d'une vidéo (étapes d'un tuto, adresses d'un post « 7 adresses », recette). Lecture seule.",
      inputSchema: {
        type: 'object',
        properties: { url: { type: 'string', description: 'Lien Instagram de la save, tel que renvoyé par search_saves.' } },
        required: ['url'],
        additionalProperties: false,
      },
      annotations: { title: "Lire une save Instagram", readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
      run: async (args) => getSave(getDb(), args.url),
    },
  ];
}
