@AGENTS.md

# dashboard-pilotage

Outil de pilotage cross-projets de Thibaut : il suit les "feeds" de code/chat
Claude (Spircle, Stage, EDHEC AI...) et montre quelles tâches sont terminées et
lesquelles restent à faire, en un seul endroit.

Statut au 2026-09-20 : construit et déployé sur Vercel
(`dashboard-pilotage-omega.vercel.app`), données dans Supabase. Ce qui existe :

- **UI** : accueil (`/`) = synthèse du jour puis, dans l'ordre par défaut, agenda visuel (J à J+7),
  idées et suggestions, actions à faire, mails, apps (tuiles `app_links`) ; détail projet
  (`/projects/[slug]`) avec jalons éditables, carte des interactions (`/map`), boîte à idées
  (`/brain`). Manifest : installable sur mobile.
- **Suivi des sessions Claude** : hook de fin de session
  (`scripts/claude-hook-session-end.mjs`, à copier dans chaque repo suivi) →
  `POST /api/hooks/session-end`. Actif dans EDHEC AI, Stage et 3 sous-projets
  Spircle ; pas encore installé sur ce repo.
- **Claude Brain** : table `brain_notes`, `GET`/`POST /api/brain-notes`,
  `PATCH /api/brain-notes/[id]` (voir `../../claude.brain/CLAUDE.md`).
- **API publique** `GET /api/public/overview` (CORS ouvert, sans secret) : statut
  agrégé des projets, jalons, dernier résumé de session. Elle ne sert plus à
  aucune page du site ; elle reste ouverte pour l'artifact « Spircle Control ».
  Depuis le 2026-09-21, le site est le seul tableau de bord (voir
  `../../CLAUDE.md`, « Une seule surface ») : ne branche pas de nouvelle vue
  dessus.
- **Rafraîchissement** : cron Vercel quotidien `/api/cron/refresh`.
- **Sécurité** : Basic Auth (`proxy.js`), sauf les routes cron, hooks, public et
  brain-notes. RLS activé sur les 6 tables (`supabase/enable_rls.sql`, exécuté
  par Thibaut le 2026-09-20) : la clé anon ne peut que lire, les écritures
  passent par le client admin. Limite : `brain_notes` reste lisible avec la clé
  anon (la page `/brain` la lit avec).
- **Données personnelles** : `tasks` (`supabase/tasks.sql`), `instagram_saves` et
  `suggestions` (`supabase/instagram.sql`), `calendar_events` et `mail_items`
  (`supabase/agenda.sql`), `app_links` et `dashboard_settings` (`supabase/dashboard-edit.sql`), `notifications` (`supabase/notifications.sql`) ont RLS **sans aucune policy anon** : lues
  et écrites côté serveur seulement (`lib/home-data.js`, `app/actions.js`, clé
  service_role), derrière le Basic Auth, jamais dans `/api/public/overview`.

## Suggestions de next steps (boucle Claude, sans modèle côté site)

1. `node --env-file=.env.local scripts/import-instagram.mjs` copie les notes du skill `instagram-memoire` dans `instagram_saves` (idempotent, `--dry-run`).
2. En session, Claude lit `instagram_saves` (récentes) et les projets, et insère dans `suggestions` des lignes `{ project_slug, text, source_save_id, status: 'new' }` via `getSupabaseAdmin()`.
3. L'accueil les affiche : « Ajouter à la prochaine session » crée une tâche `next_session`, « Ignorer » passe la suggestion à `dismissed`.
4. Aucun appel à Instagram ni à un modèle depuis le site : rien de plus à configurer.

## Agenda et notifications de l'accueil (instantané poussé par Claude)

1. Le site n'a aucun accès direct à Google (pas d'OAuth, pas d'appel réseau) : les connecteurs Agenda/Gmail n'existent que dans les sessions Claude.
2. En session, Claude lit l'agenda (aujourd'hui + 7 jours) et les non lus, écrit un JSON `{ events, mails }` (format en tête de `scripts/push-agenda.mjs`) et lance `node --env-file=.env.local scripts/push-agenda.mjs <fichier.json> [--dry-run]`.
3. Le script upsert dans `calendar_events` et `mail_items` (RLS sans policy anon, expéditeur/sujet/date seulement) puis supprime les lignes absentes du fichier : ce sont des caches. Seuls les événements `origin = 'google'` sont purgés (ceux créés sur le site, `origin = 'local'`, jamais) ; 50 mails au plus. Chaque mail porte `source` (`gmail` ou `edhec`) et `unread`. Règle EDHEC : libellé Gmail EDHEC, ou expéditeur / destinataire en `edhec.com` ; sinon `gmail`.
4. L'accueil les affiche (`components/AgendaPanel.js`, `components/MailsPanel.js`, logique dans `lib/home.js`, testée par `scripts/check-home.mjs`) avec « Mis à jour il y a X » = max de `synced_at` : rien n'est en direct. Mails : tri strict par date décroissante, lecture seule (on les traite dans Gmail).

## Tout est éditable sur le site (Server Actions, pas de realtime)

1. Tout ce que l'accueil affiche se crée, se modifie et se supprime depuis le site (Server Actions de `app/edit-actions.js` et `app/actions.js`, clé service_role, derrière le Basic Auth ; suppression avec confirmation en ligne). Les briques d'interface sont toutes dans `components/ui.js` : un relooking se fait là.
2. L'agenda vient de `calendar_events` : `origin` = `google` (instantané poussé par Claude) ou `local` (créé sur le site). Les mails de `mail_items` sont un instantané en lecture seule ; le filtre Tous / Gmail / EDHEC est mémorisé dans `dashboard_settings` (clé `mail_filter`).
3. Tâches : sections en retard / aujourd'hui / prochaine session / sans échéance, ordre par `tasks.position` (monter / descendre). Les événements du jour comptent dans « Aujourd'hui ».
4. Apps (`app_links`), projets et jalons (création, renommage, statut, ordre, suppression) : supprimer un projet supprime d'abord ses lignes enfants (`lib/db-ops.js`).
5. « Organiser la page » (masquer, réafficher, réordonner les panneaux) s'enregistre dans `dashboard_settings` (clé `home_layout`).
6. `components/AutoRefresh.js` relit le serveur au retour sur l'onglet et toutes les 60 s (`router.refresh()`), pour garder téléphone et PC synchrones ; ces tables n'ont pas de realtime. SQL à exécuter : `supabase/dashboard-edit.sql`.

## Comment ajouter du contenu sans code

1. **Boutons** : chaque panneau de l'accueil a son formulaire (ajouter une tâche, un événement, une idée, une app, un projet, un jalon) et des boutons ✎ modifier, ↑ ↓ ordre, ✕ supprimer (confirmation en ligne).
2. **Zone Commande** (en haut de l'accueil) : écrire une phrase, « Interpréter », vérifier l'aperçu (chaque ligne se retire avec ✕), « Confirmer ». Rien n'est écrit avant la confirmation. L'interprétation est locale, déterministe (`lib/command.js`, testée par `scripts/check-command.mjs`) : ni modèle, ni clé, ni réseau.
3. Formulations comprises : **événement** « ajoute (moi) une session de travail Claude de 14 à 16h mercredi et vendredi » (plage `de 9h30 à 11h`, `de 23h à 1h` finit le lendemain, `à 14h` = 1 h, `à 14h pendant 2h` ; plusieurs jours `lundi, mardi et jeudi`, `demain`, `après-demain`, `aujourd'hui`, `lundi prochain`, `le 24 septembre`, `le 24/09` ; sans jour : la prochaine fois qu'il est cette heure) ; **tâche** « tâche : appeler la banque pour vendredi », « à faire : … », « rappelle-moi de … » (échéance facultative : `pour vendredi`, `demain`, `le 25`) ; **idée** « idée : … ». Un jour de semaine = sa prochaine occurrence (aujourd'hui si l'heure n'est pas passée), « prochain » = la semaine suivante. Le reste : « Je n'ai pas compris » avec trois exemples.
4. Les événements créés ainsi sont locaux (`origin = 'local'`) : visibles sur le tableau de bord, pas dans Google Agenda.

## Notifications issues des mails (`supabase/notifications.sql`)

1. L'analyse des mails est faite par Claude (la tâche planifiée `refresh-dashboard-agenda-mails`, ou une session), jamais par le site : il propose des notifications, Thibaut les accepte ou les ignore dans « Actions à faire ».
2. `node --env-file=.env.local scripts/push-notifications.mjs <fichier.json> [--dry-run]` ; format `{"notifications":[{"kind","title","detail","mail_id","mail_link","starts_at","ends_at","due_date","dedupe_key"}]}`, 30 au plus. `kind` = `event` (`starts_at` requis), `deadline` (`due_date` requis), `todo` ou `info` ; dates ISO 8601 avec fuseau, `due_date` AAAA-MM-JJ.
3. Écriture par insertion qui ignore les doublons sur `dedupe_key` (à dériver du fil et de l'objet, ex. `<mail_id>:deadline`) : une ligne existante n'est jamais modifiée, donc une notification acceptée ou ignorée ne revient pas ; rien n'est supprimé. « Supprimer » sur le site efface aussi la mémoire du doublon.
4. Jamais le contenu d'un mail : seulement `title` et `detail` courts dérivés, l'identifiant du fil (`mail_id`) et le lien (`mail_link`). Table personnelle : RLS sans policy anon, lecture et écriture côté serveur.
5. Accepter : un événement crée un événement local, une échéance ou un « à faire » crée une tâche (avec l'échéance), une info est marquée acceptée. Modifier change le titre et les dates avant d'accepter.

Un push sur `main` redéploie en production : ne jamais pousser sans accord explicite.

Contexte ajouté lors de la mise en place de l'architecture CLAUDE.GLOBAL —
historique complet dans `../../ARCHITECTURE.md`.

## Contexte détaillé (vault Obsidian)

Note de reprise (état réel du projet, décisions, points « À vérifier ») :
`C:\Users\thiba\CLAUDE.GLOBAL\Vault\01 Projets\dashboard-pilotage\dashboard-pilotage.md` — à lire
avant de fouiller le dossier. Le vault résume ; `../../ARCHITECTURE.md` et le code font foi.
