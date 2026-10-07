// Nettoie les « Oublié hier ? » (dedupe_key « recap: ») restées à traiter. À lancer depuis la racine du repo :
//
//   node --env-file=.env.local scripts/cleanup-notifications.mjs            (= --dry-run, n'écrit rien)
//   node --env-file=.env.local scripts/cleanup-notifications.mjs --apply
//
// Parmi les notifications « recap: » encore `new` :
// - celles dont la due_date est passée depuis plus de 3 jours : passées en `dismissed` ;
// - les doublons d'une même tâche (même uuid de tâche, ou même titre sans « Oublié hier ? » à défaut) : on garde la plus récente,
//   les autres passent en `dismissed`.
// Rien n'est supprimé, aucune tâche n'est touchée : « dismissed » garde la dedupe_key, donc la routine
// ne les recrée pas. Sans option, le script ne fait que lister (dry-run) ; --apply écrit.
// La logique de choix est dans lib/notifications.js (planCleanup), vérifiée par scripts/check-notifications.mjs.

import { createClient } from '@supabase/supabase-js';
import { planCleanup } from '../lib/notifications.js';
import { todayParis } from '../lib/home.js';

const args = process.argv.slice(2);
const apply = args.includes('--apply');
const unknown = args.filter((a) => a !== '--apply' && a !== '--dry-run');
if (unknown.length || (apply && args.includes('--dry-run'))) {
  console.error('Usage : node --env-file=.env.local scripts/cleanup-notifications.mjs [--dry-run | --apply]');
  process.exit(1);
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error('NEXT_PUBLIC_SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY requis (--env-file=.env.local).');
  process.exit(1);
}
const db = createClient(url, key, { auth: { persistSession: false } });

function check(error) {
  if (error) {
    console.error(`Erreur Supabase : ${error.message}`);
    process.exit(1);
  }
}

// Lecture paginée explicite (l'API plafonne à 1000 lignes par requête) : range par 1000 jusqu'à épuisement,
// dans un ordre stable pour qu'aucune ligne ne saute ni ne se répète d'une page à l'autre.
const PAGE = 1000;
const data = [];
for (let from = 0; ; from += PAGE) {
  const { data: page, error } = await db
    .from('notifications')
    .select('id, title, due_date, status, dedupe_key, created_at')
    .eq('status', 'new')
    .like('dedupe_key', 'recap:%')
    .order('created_at', { ascending: true })
    .order('id', { ascending: true })
    .range(from, from + PAGE - 1);
  check(error);
  data.push(...page);
  if (page.length < PAGE) break;
}

const today = todayParis();
const plan = planCleanup(data, today);
const REASONS = { perimee: 'échéance passée depuis plus de 3 jours', doublon: 'doublon (une plus récente existe)' };
const count = (reason) => plan.filter((p) => p.reason === reason).length;

console.log(`${apply ? 'APPLY' : 'DRY-RUN'} au ${today} : ${data.length} « recap: » à traiter, ${plan.length} à passer en dismissed.`);
console.log(`  - ${count('perimee')} périmées, ${count('doublon')} doublons ; ${data.length - plan.length} conservées.`);
const byId = new Map(data.map((n) => [n.id, n]));
for (const p of plan) console.log(`  ${p.id.slice(0, 8)}  ${byId.get(p.id).due_date ?? 'sans date'}  ${REASONS[p.reason]}  ${p.title}`);

if (!apply) {
  console.log('Rien écrit (dry-run). Relancer avec --apply pour appliquer.');
} else if (plan.length) {
  const ids = plan.map((p) => p.id);
  let done = 0;
  for (let i = 0; i < ids.length; i += 100) {
    const res = await db.from('notifications').update({ status: 'dismissed' }).in('id', ids.slice(i, i + 100)).eq('status', 'new').select('id');
    check(res.error);
    done += res.data.length;
  }
  console.log(`${done} notification(s) passée(s) en dismissed.`);
}
