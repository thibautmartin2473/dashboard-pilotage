// Vérification du connecteur MCP des saves Instagram, sans réseau ni Supabase :
//   node scripts/check-mcp.mjs
// Une base factice (fixtures ci-dessous, filtres rejoués en JS) remplace Supabase.
// Ne prouve PAS : les vraies requêtes SQL (supabase/instagram_v2.sql), le vrai claude.ai.
import assert from 'node:assert/strict';
import { handleMcpRequest, isAuthorized, ToolInputError } from '../lib/mcp.js';
import { saveTools, searchSaves } from '../lib/saves.js';
import { norm, planSearch } from '../lib/saves-rank.js';

const NOW = new Date('2026-09-21T12:00:00Z');
const SECRET = 'test-secret-0123456789-abcdefghij';
const save = (code, o) => ({
  url: `https://www.instagram.com/p/${code}/`, caption: '', author: 'compte', saved_at: '2026-03-01', tags: [],
  category: 'Humour & Memes', kind: 'loisir', ville: null, arrondissement: null, arrondissements: [],
  cuisine: null, adresse: null, resume: null, retenir: null, transcript: null, media_type: 'reel',
  repond_a: null, recos: [], attention: null, ...o,
});
const ROWS = [
  save('BAR1', { author: 'parisbars', category: 'Restos & Bars', cuisine: 'bar & cocktails', ville: 'Paris', arrondissement: 3, arrondissements: [3],
    saved_at: '2026-03-01', resume: 'Bar à cocktails caché dans le Marais.', adresse: '12 rue Vieille du Temple', caption: 'Speakeasy dans le Marais' }),
  save('SAND', { author: 'foodie', category: 'Restos & Bars', ville: 'Paris', arrondissement: 3, arrondissements: [3],
    saved_at: '2026-05-01', resume: 'Le meilleur sandwich du Marais.', caption: 'Sandwich du Marais, on adore' }),
  save('KOR11', { author: 'seoulparis', category: 'Restos & Bars', cuisine: 'coréen', ville: 'Paris', arrondissement: 11, arrondissements: [11],
    saved_at: '2026-04-01', resume: 'Restaurant coréen à Oberkampf.', caption: 'Bibimbap et kimchi, Paris 11e' }),
  save('KOR5', { author: 'seoulparis', category: 'Restos & Bars', cuisine: 'coréen', ville: 'Paris', arrondissement: 5, arrondissements: [5],
    saved_at: '2026-04-02', resume: 'Barbecue coréen dans le Quartier latin.', caption: 'Korean BBQ Paris 5e' }),
  save('ITA11', { author: 'pastaparis', category: 'Restos & Bars', cuisine: 'italien', ville: 'Paris', arrondissement: 11, arrondissements: [11],
    saved_at: '2026-04-03', resume: 'Trattoria du 11e.', caption: 'Pasta fraîche Paris 11e' }),
  save('CC1', { author: 'devclaude', category: 'IA & Tech', kind: 'skill', tags: ['claude-code'], saved_at: '2026-09-10',
    resume: '5 astuces pour progresser sur Claude Code.', retenir: 'Écris un CLAUDE.md court.', caption: 'Claude Code tips', transcript: 'Bienvenue, Claude Code est un outil...' }),
  save('TAB', { author: 'yannisflowlabs', category: 'Cuisine & Recettes', kind: 'skill', saved_at: '2026-08-30',
    resume: 'Trois adresses à Lisbonne.', repond_a: 'Où manger un pastel de nata à Lisbonne ?',
    recos: ['Manteigaria : pastel de nata tiède au comptoir', 'Zé da Mouraria : morue pour deux'], attention: 'Prix relevés en 2024, à revérifier.' }),
  save('CC0', { author: 'devclaude', category: 'IA & Tech', kind: 'skill', tags: ['claude-code'], saved_at: '2025-01-05', resume: 'Vieux tuto Claude Code.', caption: 'Claude Code' }),
  save('MEME', { author: 'rigolo', caption: 'Un meme drôle', saved_at: '2026-09-15' }),
];
const HAS_TEXT = (r) => norm([r.author, r.category, r.kind, r.tags.join(' '), r.cuisine, r.adresse, r.resume, r.retenir, r.caption, r.transcript, r.repond_a, r.recos.join(' '), r.attention].join(' '));

// Base factice : mêmes méthodes de lecture que postgrest-js ; AUCUNE méthode d'écriture (un insert lèverait TypeError).
function fakeDb({ fail } = {}) {
  const calls = [];
  const db = {
    calls,
    from(table) {
      calls.push(table);
      let rows = ROWS;
      const q = {
        select: () => q,
        textSearch(col, tsquery, opts) {
          assert.equal(col, 'search');
          assert.equal(opts.config, 'french_unaccent');
          const words = tsquery.split(' | ').map((w) => w.replace(/:\*$/, ''));
          assert.ok(words.every((w) => /^[a-z0-9]+$/.test(w)), 'tsquery : mots simples uniquement');
          rows = rows.filter((r) => words.some((w) => new RegExp(`\\b${w}`).test(HAS_TEXT(r))));
          return q;
        },
        eq: (col, v) => ((rows = rows.filter((r) => r[col] === v)), q),
        gte: (col, v) => ((rows = rows.filter((r) => r[col] && r[col] >= v)), q),
        contains: (col, v) => ((rows = rows.filter((r) => v.every((x) => r[col].includes(x)))), q),
        overlaps: (col, v) => ((rows = rows.filter((r) => v.some((x) => r[col].includes(x)))), q),
        in: (col, v) => ((rows = rows.filter((r) => v.includes(r[col]))), q),
        order: () => q,
        limit: (n) => ((rows = rows.slice(0, n)), q),
        then: (resolve) => resolve(fail ? { data: null, error: fail } : { data: rows, error: null }),
      };
      return q;
    },
  };
  return db;
}

const run = async (args) => {
  const plan = planSearch(args, NOW);
  return { plan, ...(await searchSaves(fakeDb(), plan)) };
};
const codes = (r) => r.hits.map((h) => h.url.split('/')[4]);

// --- Lecture de la requête ---------------------------------------------------------------
let p = planSearch({ query: 'quel bar faire dans le Marais' }, NOW);
assert.deepEqual(p.wantArrs, [3, 4]); // Marais = 3e ET 4e
assert.equal(p.wantCuisine, 'bar & cocktails'); // « bar » = cuisine bar & cocktails
assert.ok(p.words.includes('bar') && p.words.includes('marais') && !p.words.includes('quel') && !p.words.includes('faire'));
assert.equal(p.placeIntent, true);
p = planSearch({ query: 'resto coréen dans le 11ème' }, NOW);
assert.deepEqual([p.wantArrs, p.wantCuisine], [[11], 'coréen']);
assert.ok(p.words.includes('kimchi') && p.words.includes('resto') && !p.words.includes('11eme')); // synonymes de cuisine
assert.deepEqual(planSearch({ query: 'haut marais' }, NOW).wantArrs, [3]);
assert.equal(planSearch({ query: 'sushi', cuisine: 'Korean' }, NOW).wantCuisine, 'coréen');
assert.equal(planSearch({ query: 'x', since: '1m' }, NOW).since, '2026-08-22');
assert.equal(planSearch({ query: 'x', since: '2026-01-31' }, NOW).since, '2026-01-31');
assert.equal(planSearch({ query: 'x', limit: 99 }, NOW).limit, 10);
assert.equal(planSearch({ query: 'x' }, NOW).limit, 5);
assert.equal(planSearch({ query: 'x', theme: 'restos & bars' }, NOW).theme, 'Restos & Bars');
for (const bad of [{ query: 'x', arrondissement: 25 }, { query: 'x', kind: 'foo' }, { query: 'x', since: 'hier' }, { query: 'x', theme: 'nope' }, { query: 42 }]) {
  assert.throws(() => planSearch(bad, NOW), ToolInputError, JSON.stringify(bad));
}

// --- Classement --------------------------------------------------------------------------
// Un bar du Marais passe avant un sandwich du Marais (pourtant plus récent).
let r = await run({ query: 'quel bar faire dans le Marais' });
assert.equal(codes(r)[0], 'BAR1');
assert.ok(codes(r).indexOf('SAND') > 0);
assert.deepEqual(r.hits[0].why, ['Paris 3e', 'bar & cocktails']);
assert.equal(r.weak, false);

// « coréen dans le 11e » : la save qui cumule les deux d'abord.
r = await run({ query: 'quel resto coréen dans le 11e' });
assert.equal(codes(r)[0], 'KOR11');
assert.deepEqual(r.hits[0].why, ['Paris 11e', 'coréen']);
assert.equal(r.weak, false);
assert.deepEqual(codes(r).slice(1, 3).sort(), ['ITA11', 'KOR5']); // un seul critère chacune, après
assert.ok(r.hits.slice(3).every((h) => h.why.length === 0)); // puis ce qui n'en remplit aucun

// Rien ne cumule : avertissement explicite, jamais une « bonne réponse » déguisée.
r = await run({ query: 'resto thaï dans le 20e' });
assert.equal(r.weak, true); // « resto » ressort du texte, mais aucune ne remplit thaï ni 20e
assert.ok(r.hits.length > 0 && r.hits.every((h) => h.why.length === 0));
r = await run({ query: 'resto coréen dans le 3e' });
assert.equal(r.weak, true);
assert.match(await saveTools(() => fakeDb(), () => NOW)[0].run({ query: 'resto coréen dans le 3e' }), /ATTENTION : aucune save ne cumule tous les critères/);
assert.doesNotMatch(await saveTools(() => fakeDb(), () => NOW)[0].run({ query: 'resto coréen dans le 11e' }), /ATTENTION/);

// Vidéos à apprendre : filtre usage + date d'enregistrement.
r = await run({ query: 'quelles vidéos pour progresser sur Claude Code ce mois-ci', kind: 'skill', since: '1m' });
assert.deepEqual(codes(r), ['CC1']);
r = await run({ query: 'claude code', kind: 'skill' });
assert.deepEqual(codes(r), ['CC1', 'CC0']); // le plus pertinent d'abord

// Nouveaux champs : trouvés par la recherche (recommandations, question), renvoyés avec la formule à citer.
r = await run({ query: 'pastel nata' });
assert.deepEqual(codes(r), ['TAB']); // seuls « recos » et « repond_a » contiennent ces mots
const tab = await saveTools(() => fakeDb(), () => NOW)[0].run({ query: 'pastel nata' });
assert.match(tab, /Répond à : Où manger un pastel de nata à Lisbonne \?/);
assert.match(tab, /Recommandations \(2\/2\) :\n\s+- Manteigaria/);
assert.match(tab, /Attention : Prix relevés en 2024/);
assert.match(tab, /Source à citer : d'après la vidéo de @yannisflowlabs enregistrée le 30\/08\/2026 \(https:\/\/www\.instagram\.com\/p\/TAB\/\)/);
assert.equal(codes(await run({ query: 'revérifier prix' }))[0], 'TAB'); // « attention » est cherché aussi

// Filtre strict d'arrondissement ; requête sans résultat ; requête trop vague ; échec de base.
assert.deepEqual(codes(await run({ query: 'manger', arrondissement: 11 })).sort(), ['ITA11', 'KOR11']);
assert.match(await saveTools(() => fakeDb(), () => NOW)[0].run({ query: 'xyzzy' }), /^Aucune save trouvée/);
await assert.rejects(saveTools(() => fakeDb(), () => NOW)[0].run({ query: '' }), /trop vague/);
await assert.rejects(searchSaves(fakeDb({ fail: { code: '42703', message: 'column x does not exist' } }), planSearch({ query: 'bar' }, NOW)), /instagram_v2\.sql/);
await assert.rejects(searchSaves(fakeDb({ fail: { code: 'XX000', message: 'boom' } }), planSearch({ query: 'bar' }, NOW)), /Supabase : boom/);

// --- Authentification (échec fermé) --------------------------------------------------------
const req = (body, { path, bearer, method = 'POST', headers = {} } = {}) => {
  const segments = path === undefined ? undefined : path.split('/');
  const init = { method, headers: { 'content-type': 'application/json', ...(bearer ? { authorization: `Bearer ${bearer}` } : {}), ...headers } };
  if (method === 'POST') init.body = typeof body === 'string' ? body : JSON.stringify(body);
  return [new Request('http://localhost/api/mcp', init), segments];
};
const tools = saveTools(() => fakeDb(), () => NOW);
const call = async (body, auth, ...rest) => {
  const secret = rest.length ? rest[0] : SECRET; // call(x, a, undefined) = variable non définie
  const [request, segments] = req(body, auth);
  return handleMcpRequest(request, { segments, secret, tools });
};
const rpc = (method, params, id = 1) => ({ jsonrpc: '2.0', id, method, params });
const logged = [];
const realError = console.error;
console.error = (...a) => logged.push(a.join(' '));

const ping = rpc('ping');
assert.equal((await call(ping, {})).status, 401); // sans secret
assert.equal((await call(ping, { path: 'mauvais-secret-mauvais-secret' })).status, 401);
assert.equal((await call(ping, { bearer: 'mauvais' })).status, 401);
assert.equal((await call(ping, { path: `${SECRET}/extra` })).status, 401); // un seul segment accepté
assert.equal((await call(ping, { path: SECRET }, undefined)).status, 401); // variable non définie
assert.equal((await call(ping, { path: '' }, '')).status, 401); // variable vide : '' ne doit pas « matcher »
assert.equal((await call(ping, { path: 'court' }, 'court')).status, 401); // secret trop court
assert.equal((await call(ping, { path: SECRET })).status, 200);
assert.equal((await call(ping, { bearer: SECRET })).status, 200);
assert.equal((await call(ping, { path: SECRET })).headers.get('cache-control'), 'no-store');
const denied = await call(ping, {});
assert.equal(denied.headers.get('www-authenticate'), 'Bearer');
assert.deepEqual(await denied.json(), { error: 'unauthorized' });
assert.equal(isAuthorized(new Request('http://x', { headers: { authorization: `bearer ${SECRET}` } }), undefined, SECRET), true);

// GET/DELETE : refusés sans secret (401), 405 avec ; jamais de flux SSE.
for (const method of ['GET', 'DELETE']) {
  const [request, segments] = req(null, { path: SECRET, method });
  assert.equal((await handleMcpRequest(request, { segments, secret: SECRET, tools })).status, 405);
  const [bare] = req(null, { method });
  assert.equal((await handleMcpRequest(bare, { segments: undefined, secret: SECRET, tools })).status, 401);
}

// --- Protocole ------------------------------------------------------------------------------
const auth = { path: SECRET };
const j = async (body) => (await call(body, auth)).json();
let out = await j(rpc('initialize', { protocolVersion: '2025-03-26', capabilities: {}, clientInfo: { name: 't', version: '1' } }));
assert.equal(out.result.protocolVersion, '2025-03-26');
assert.deepEqual(Object.keys(out.result.capabilities), ['tools']);
assert.ok(out.result.serverInfo.name);
assert.equal((await j(rpc('initialize', { protocolVersion: '1999-01-01' }))).result.protocolVersion, '2025-06-18');
const note = await call({ jsonrpc: '2.0', method: 'notifications/initialized' }, auth);
assert.equal(note.status, 202);
assert.equal(await note.text(), '');
assert.deepEqual((await j(rpc('ping'))).result, {});
out = await j(rpc('tools/list'));
assert.deepEqual(out.result.tools.map((t) => t.name), ['search_saves', 'get_save']);
for (const t of out.result.tools) {
  assert.equal(t.annotations.readOnlyHint, true);
  assert.equal(t.inputSchema.type, 'object');
  assert.ok(t.description.length > 100 && !('run' in t));
}
assert.deepEqual(out.result.tools[1].inputSchema.required, ['url']);
assert.ok(out.result.tools[0].description.includes('bar') && out.result.tools[0].description.includes('vidéos'));
assert.ok(out.result.tools[0].inputSchema.properties.limit.maximum === 10);

out = await j(rpc('tools/call', { name: 'search_saves', arguments: { query: 'bar Marais' } }));
assert.equal(out.result.isError, undefined);
assert.match(out.result.content[0].text, /^\d+ résultat\(s\)/);
assert.match(out.result.content[0].text, /instagram\.com\/p\/BAR1\//);
out = await j(rpc('tools/call', { name: 'search_saves', arguments: { query: 'x', arrondissement: 99 } }));
assert.equal(out.result.isError, true);
assert.match(out.result.content[0].text, /arrondissement invalide/);
out = await j(rpc('tools/call', { name: 'get_save', arguments: { url: 'https://www.instagram.com/reel/CC1/' } }));
assert.match(out.result.content[0].text, /Transcription :\nBienvenue/);
assert.match(out.result.content[0].text, /Source à citer : d'après la vidéo de @devclaude enregistrée le 10\/09\/2026/);
out = await j(rpc('tools/call', { name: 'get_save', arguments: { url: 'https://www.instagram.com/p/TAB/' } }));
assert.match(out.result.content[0].text, /Répond à : .*\nRecommandations \(2\/2\) :\n- Manteigaria.*\n- Zé da Mouraria.*\nAttention : Prix/);
out = await j(rpc('tools/call', { name: 'get_save', arguments: { url: 'https://www.instagram.com/p/INCONNU12/' } }));
assert.equal(out.result.isError, true);
out = await j(rpc('tools/call', { name: 'get_save', arguments: { url: 'https://example.com/x' } }));
assert.equal(out.result.isError, true);
assert.equal((await j(rpc('tools/call', { name: 'delete_everything', arguments: {} }))).error.code, -32602);
assert.equal((await j(rpc('tools/call', { name: 'get_save', arguments: [] }))).error.code, -32602);
assert.equal((await j(rpc('resources/list'))).error.code, -32601);
assert.equal((await j({ hello: 'world' })).error.code, -32600);
assert.equal((await call('{pas du json', auth)).status, 400);
assert.equal((await call('x'.repeat(20 * 1024), auth)).status, 413);
const batch = await (await call([rpc('ping', undefined, 1), rpc('tools/list', undefined, 2), { jsonrpc: '2.0', method: 'notifications/initialized' }], auth)).json();
assert.deepEqual(batch.map((m) => m.id), [1, 2]);
assert.equal((await call([], auth)).status, 400);

// Un échec de base est remonté au modèle, pas avalé en « aucun résultat ».
const broken = saveTools(() => fakeDb({ fail: { code: '42703', message: 'x' } }), () => NOW);
const [failReq, failSeg] = req(rpc('tools/call', { name: 'search_saves', arguments: { query: 'bar' } }), auth);
out = await (await handleMcpRequest(failReq, { segments: failSeg, secret: SECRET, tools: broken })).json();
assert.equal(out.result.isError, true);
assert.match(out.result.content[0].text, /Erreur serveur : Schéma des saves obsolète/);

// Lecture seule : seule la table instagram_saves a été touchée (et aucune méthode d'écriture n'existe sur la base factice).
const spy = fakeDb();
await saveTools(() => spy, () => NOW)[0].run({ query: 'bar Marais' });
await saveTools(() => spy, () => NOW)[1].run({ url: 'INCONNU12' }).catch(() => {});
assert.ok(spy.calls.length >= 2 && spy.calls.every((t) => t === 'instagram_saves'));
assert.equal(typeof spy.from('instagram_saves').insert, 'undefined');

// Le secret n'apparaît ni dans les journaux ni dans une réponse d'erreur.
console.error = realError;
assert.ok(logged.length > 0 && logged.every((l) => !l.includes(SECRET)), 'journaux sans secret');
assert.ok(!JSON.stringify(out).includes(SECRET));

console.log('check-mcp : ok');
