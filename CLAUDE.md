@AGENTS.md

# dashboard-pilotage

Outil de pilotage cross-projets de Thibaut : il suit les "feeds" de code/chat
Claude (Spircle, Stage, EDHEC AI...) et montre quelles tâches sont terminées et
lesquelles restent à faire, en un seul endroit.

Statut au 2026-09-20 : construit et déployé sur Vercel
(`dashboard-pilotage-omega.vercel.app`), données dans Supabase. Ce qui existe :

- **UI** : accueil (`/`) = synthèse du jour, panneaux tâches / agenda / non lus / idées / suggestions et
  grille d'apps (une app externe par projet dans `lib/apps.js`, sinon
  `/projects/[slug]`) ; détail projet avec jalons éditables, carte des
  interactions (`/map`), boîte à idées (`/brain`). Manifest : installable sur mobile.
- **Suivi des sessions Claude** : hook de fin de session
  (`scripts/claude-hook-session-end.mjs`, à copier dans chaque repo suivi) →
  `POST /api/hooks/session-end`. Actif dans EDHEC AI, Stage et 3 sous-projets
  Spircle ; pas encore installé sur ce repo.
- **Claude Brain** : table `brain_notes`, `GET`/`POST /api/brain-notes`,
  `PATCH /api/brain-notes/[id]` (voir `../../claude.brain/CLAUDE.md`).
- **API publique** `GET /api/public/overview` (CORS ouvert). Un artifact ne
  pouvant pas l'appeler (règle de la plateforme), Claude en copie l'instantané dans
  la base de l'artifact Tour de Contrôle au wrap-up (`../../Tools/artifact-sync/`).
- **Rafraîchissement** : cron Vercel quotidien `/api/cron/refresh`.
- **Connecteur MCP des saves Instagram** : `/api/mcp/<MCP_SECRET>` (voir la section
  dédiée plus bas), lecture seule, pour interroger les saves depuis n'importe quelle
  surface Claude (téléphone compris).
- **Sécurité** : Basic Auth (`proxy.js`), sauf les routes cron, hooks, public,
  brain-notes et mcp (celle-ci exige son propre secret `MCP_SECRET`, échec fermé). RLS activé sur les 6 tables (`supabase/enable_rls.sql`, exécuté
  par Thibaut le 2026-09-20) : la clé anon ne peut que lire, les écritures
  passent par le client admin. Limite : `brain_notes` reste lisible avec la clé
  anon (la page `/brain` la lit avec).
- **Données personnelles** : `tasks` (`supabase/tasks.sql`), `instagram_saves` et
  `suggestions` (`supabase/instagram.sql`, colonnes et recherche : `instagram_v2.sql`), `calendar_events` et `mail_items`
  (`supabase/agenda.sql`) ont RLS **sans aucune policy anon** : lues
  et écrites côté serveur seulement (`lib/home-data.js`, `app/actions.js`, clé
  service_role), derrière le Basic Auth, jamais dans `/api/public/overview`.

## Suggestions de next steps (boucle Claude, sans modèle côté site)

1. `node --env-file=.env.local scripts/import-instagram.mjs` copie les notes du skill `instagram-memoire` dans `instagram_saves` (idempotent, `--dry-run`).
2. En session, Claude lit `instagram_saves` (récentes) et les projets, et insère dans `suggestions` des lignes `{ project_slug, text, source_save_id, status: 'new' }` via `getSupabaseAdmin()`.
3. L'accueil les affiche : « Ajouter à la prochaine session » crée une tâche `next_session`, « Ignorer » passe la suggestion à `dismissed`.
4. Aucun appel à Instagram ni à un modèle depuis le site : rien de plus à configurer.

## Connecteur MCP des saves Instagram (lecture seule, toutes surfaces Claude)

1. Les notes Obsidian restent la source de vérité ; `scripts/import-instagram.mjs` en copie les champs utiles (thème, usage, lieu, résumé, « à retenir », `repond_a`, `recos`, `attention`, transcription) dans `instagram_saves` (`supabase/instagram_v2.sql` : colonnes, `search` tsvector français sans accents rempli par déclencheur, index GIN).
2. `app/api/mcp/[[...secret]]/route.js` (adaptateur) + `lib/mcp.js` (protocole MCP « Streamable HTTP », JSON-RPC en POST, auth, limites) + `lib/saves.js` (requêtes) + `lib/saves-rank.js` (classement). Outils : `search_saves` et `get_save`, annotés `readOnlyHint`. Aucune écriture, aucune autre table. Chaque save renvoyée porte `Répond à`, `Recommandations`, `Attention` (quand la note les a) et une ligne `Source à citer : d'après la vidéo de @compte enregistrée le JJ/MM/AAAA (lien)` ; ces champs sont aussi cherchés.
3. Classement = port de `Vault/.instagram-saves-engine/recall.py` : critères structurés remplis (arrondissement, cuisine) > thème « lieu » > pertinence texte > récence ; « Marais » = 3e et 4e ; « bar » = cuisine « bar & cocktails » ; avertissement explicite quand aucune save ne cumule tous les critères. Si une règle change côté Python (cuisine, quartier), la recopier dans `lib/saves-rank.js`.
4. Sécurité : `api/mcp` est exclu du Basic Auth de `proxy.js` (claude.ai ne sait pas s'y authentifier), mais toute requête exige `MCP_SECRET` (≥ 24 caractères) dans le chemin ou en `Authorization: Bearer`, comparé à temps constant ; variable absente ou trop courte = 401 partout. Limite connue : le chemin figure dans les journaux de requêtes de Vercel (le code ne le journalise jamais) ; en cas de fuite, changer `MCP_SECRET` et redéclarer le connecteur. Le texte des saves est du contenu tiers : les sorties le rappellent au modèle.
5. Test : `node scripts/check-mcp.mjs` (base factice, sans réseau). Mise en service par Thibaut : exécuter `instagram_v2.sql`, définir `MCP_SECRET` sur Vercel, fusionner la PR, relancer l'import, puis ajouter le connecteur dans claude.ai (Paramètres > Connecteurs > Ajouter un connecteur personnalisé) avec l'URL `https://dashboard-pilotage-omega.vercel.app/api/mcp/<MCP_SECRET>`.

## Agenda et notifications de l'accueil (instantané poussé par Claude)

1. Le site n'a aucun accès direct à Google (pas d'OAuth, pas d'appel réseau) : les connecteurs Agenda/Gmail n'existent que dans les sessions Claude.
2. En session, Claude lit l'agenda (aujourd'hui + 7 jours) et les non lus, écrit un JSON `{ events, mails }` (format en tête de `scripts/push-agenda.mjs`) et lance `node --env-file=.env.local scripts/push-agenda.mjs <fichier.json> [--dry-run]`.
3. Le script upsert dans `calendar_events` et `mail_items` (`supabase/agenda.sql`, RLS sans policy anon, expéditeur/sujet/date seulement) puis supprime les lignes absentes du fichier : ce sont des caches.
4. L'accueil les affiche (`components/HomeAgenda.js`, logique dans `lib/home.js`, testée par `scripts/check-home.mjs`) avec « Mis à jour il y a X » = max de `synced_at` : rien n'est en direct.

Un push sur `main` redéploie en production : ne jamais pousser sans accord explicite.

Contexte ajouté lors de la mise en place de l'architecture CLAUDE.GLOBAL —
historique complet dans `../../ARCHITECTURE.md`.

## Contexte détaillé (vault Obsidian)

Note de reprise (état réel du projet, décisions, points « À vérifier ») :
`C:\Users\thiba\CLAUDE.GLOBAL\Vault\01 Projets\dashboard-pilotage\dashboard-pilotage.md` — à lire
avant de fouiller le dossier. Le vault résume ; `../../ARCHITECTURE.md` et le code font foi.
