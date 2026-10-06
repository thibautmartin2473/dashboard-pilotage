@AGENTS.md

# dashboard-pilotage

Outil de pilotage cross-projets de Thibaut : il suit les "feeds" de code/chat
Claude (Spircle, Stage, EDHEC AI...) et montre quelles tâches sont terminées et
lesquelles restent à faire, en un seul endroit.

Statut au 2026-09-20 : construit et déployé sur Vercel
(`dashboard-pilotage-omega.vercel.app`), données dans Supabase. Ce qui existe :

- **UI** : accueil (`/`) = synthèse du jour puis, dans l'ordre par défaut, agenda visuel (frise glissante à la main ou aux flèches, ouverte sur J à J+7),
  idées, tâches (avec les propositions issues des mails), mails, « Mes apps » (grille de carrés
  fusionnant `app_links` et projets, édition derrière un bouton « Modifier ») ; détail projet
  (`/projects/[slug]`) avec jalons éditables, boîte à idées
  (`/brain` : Zone Commande + notes). Manifest : installable sur mobile.
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
  passent par le client admin. `brain_notes` est lue côté serveur (`lib/brain.js`) ;
  `supabase/ideas.sql` retire sa lecture anon.
- **Données personnelles** : `tasks` (`supabase/tasks.sql`), `instagram_saves` et
  `suggestions` (`supabase/instagram.sql`), `calendar_events` et `mail_items`
  (`supabase/agenda.sql`), `app_links` et `dashboard_settings` (`supabase/dashboard-edit.sql`), `notifications` (`supabase/notifications.sql`) ont RLS **sans aucune policy anon** : lues
  et écrites côté serveur seulement (`lib/home-data.js`, `app/actions.js`, clé
  service_role), derrière le Basic Auth, jamais dans `/api/public/overview`.

## Idées = next steps (boucle Claude, sans modèle côté site)

1. `node --env-file=.env.local scripts/import-instagram.mjs` copie les notes du skill `instagram-memoire` dans `instagram_saves` (idempotent, `--dry-run`).
2. En session, Claude lit `instagram_saves` (récentes) et les projets, et insère dans **`brain_notes`** des lignes `{ content, project_slug, source_save_id, status: 'new' }` via `getSupabaseAdmin()` (`project_slug` = slug existant de `projects` ou `null`). La table `suggestions` n'est plus lue ni écrite : `supabase/ideas.sql` a copié ses suggestions actives dans `brain_notes` (trace dans `source_suggestion_id`).
3. L'accueil les affiche dans le panneau Idées, comme toute idée : « En faire une tâche » crée une tâche `next_session` liée à l'idée, « Traitée » la passe à `done`.
4. Aucun appel à Instagram ni à un modèle depuis le site : rien de plus à configurer.

## Agenda et notifications de l'accueil (instantané poussé par Claude)

1. Le site n'a aucun accès direct à Google (pas d'OAuth, pas d'appel réseau) : les connecteurs Agenda/Gmail n'existent que dans les sessions Claude.
2. En session, Claude lit l'agenda (aujourd'hui + 35 jours, pour les flèches de l'agenda) et les non lus, écrit un JSON `{ events, mails }` (format en tête de `scripts/push-agenda.mjs`) et lance `node --env-file=.env.local scripts/push-agenda.mjs <fichier.json> [--dry-run]`.
3. Le script upsert dans `calendar_events` et `mail_items` (RLS sans policy anon, expéditeur/sujet/date seulement) puis supprime les lignes absentes du fichier : ce sont des caches. Seuls les événements `origin = 'google'` **pas encore terminés** sont purgés (ceux créés sur le site, `origin = 'local'`, jamais ; un événement fini reste en base comme historique, depuis le 2026-10-06) ; 50 mails au plus. Chaque mail porte `source` (`gmail` ou `edhec`) et `unread`. Règle EDHEC : libellé Gmail EDHEC, ou expéditeur / destinataire en `edhec.com` ; sinon `gmail`. `colorId` Google (facultatif) va dans `calendar_events.color_id` (`supabase/agenda-links.sql`), qui pointe vers une **catégorie** éditable sur le site (nom, couleur, type `plage` ou `tache`, voir point 8) : les 3 clés par défaut `11`/`9`/`6` sont celles poussées par Google, `9` (« Autre événement ») sert de repli (colonne absente, couleur absente ou catégorie supprimée). Un conflit (`buildWeek().conflicts`, tuile « À trancher ») n'oppose que deux catégories du même type qui se chevauchent : une tâche posée sur une plage est volontaire, jamais un conflit.
4. L'accueil les affiche (`components/AgendaPanel.js`, `components/MailsPanel.js`, logique dans `lib/home.js`, testée par `scripts/check-home.mjs`) avec « Mis à jour il y a X » = max de `synced_at` : rien n'est en direct. Mails : tri strict par date décroissante, lecture seule (on les traite dans Gmail).
5. **Glisser-déposer** (vue semaine) : un bloc se glisse dans la journée ou vers un autre jour, ses poignées haut/bas l'allongent ou le raccourcissent (pas de 15 min, 15 min au moins, pointer events souris + tactile) ; le détail a des flèches ▲▼ début/fin −/+15 min. Clic simple (moins de 5 px) = détail ; « toute la journée » non déplaçable. Aperçu et mise à jour optimistes, puis Server Action `moveEvent` (`app/edit-actions.js`), calcul pur `shiftEvent`/`snapMinutes` (`lib/home.js`, testé par `scripts/check-home.mjs`).
5 bis. **Frise glissante** (demandes de Thibaut 2026-10-06) : l'agenda rend d'un seul tenant les `TIMELINE_DAYS` jours de J−35 à J+98 (`buildWeek(events, now, categories, WEEK_OFFSET_MIN, TIMELINE_DAYS)`, `lib/home.js`) dans une bande qui défile horizontalement et s'ouvre sur aujourd'hui ; une colonne = un huitième de la largeur (au moins 6,5 rem, donc moins de jours visibles sur téléphone), aimant (`scroll-snap`) sur chaque jour. On la fait glisser à la main (souris : appui sur le fond de la grille, `startPan` ; pavé tactile, doigt, Maj + molette : défilement natif) ou aux flèches « ‹ › » (un jour), « « » » (une semaine), « Aujourd'hui ». Lignes « Jour » et « Fait » : 2 éléments par case puis « +N » (une ligne de grille prend la hauteur de sa case la plus pleine sur toute la frise). Le décalage est un état local de l'onglet : la synthèse du jour, « Prochain » et « À trancher » (et le compteur de conflits du panneau) restent calculés sur J à J+7 côté serveur. Ligne « Fait » sous le bandeau : tâches terminées ce jour-là (`done_at`, `doneByDay`, chargées depuis −36 jours par `lib/home-data.js`).
6. **Renvoi vers Google** : un bloc `google` déplacé prend `calendar_events.pending_move = true` (`supabase/agenda-moves.sql`) et affiche « ↻ à renvoyer vers Google ». `push-agenda.mjs` ne l'écrase ni ne le purge tant que c'est `true`. En session, Claude lance `node --env-file=.env.local scripts/push-agenda.mjs --pending` (JSON `id, title, starts_at, ends_at`), écrit ces heures dans Google Agenda, puis `node --env-file=.env.local scripts/push-agenda.mjs --ack <id1,id2>` (remet `false`) ; la synchro suivante reprend l'événement tel que dans Google. Colonne absente : l'affichage marche, un déplacement renvoie « exécuter supabase/agenda-moves.sql ».
7. **Import Aurion** : un cours douteux (horaire ou titre perdu à l'extraction) reste « à reconfirmer » et n'entre pas dans l'agenda avant confirmation ; un événement en journée entière s'envoie en UTC (`allDay`, fin exclusive), sinon il glisse d'un jour (règle de Thibaut, 2026-09-19).
8. **Boîte Outlook.com perso** : elle refuse IMAP et l'enregistrement d'une app OAuth (AADSTS16000) ; la lire dans le navigateur intégré ou proposer un transfert vers Gmail (règle de Thibaut, 2026-09-19).

## Tout est éditable sur le site (Server Actions, pas de realtime)

1. Tout ce que l'accueil affiche se crée, se modifie et se supprime depuis le site (Server Actions de `app/edit-actions.js` et `app/actions.js`, clé service_role, derrière le Basic Auth ; suppression avec confirmation en ligne). Les briques d'interface sont toutes dans `components/ui.js` : un relooking se fait là.
2. L'agenda vient de `calendar_events` : `origin` = `google` (instantané poussé par Claude) ou `local` (créé sur le site). Les mails de `mail_items` sont un instantané en lecture seule ; le filtre Tous / Gmail / EDHEC est mémorisé dans `dashboard_settings` (clé `mail_filter`).
3. Tâches (« à faire » = tâche partout) : sections en retard / aujourd'hui / prochaine session / sans échéance, ordre par `tasks.position` (monter / descendre). Les événements du jour comptent dans « Aujourd'hui », et une tâche placée dans une plage du jour (`tasks.event_id`) aussi (`splitTasks(tasks, today, todayEventIds)`, `lib/home.js` `eventIdsOnDay` ; `moveTaskPriority` refait le même calcul pour rester cohérent).
4. Apps (`app_links`), projets et jalons (création, renommage, statut, ordre, suppression) : supprimer un projet supprime d'abord ses lignes enfants (`lib/db-ops.js`).
5. Idées : « Affecter à… » lie une idée à une tâche non faite ou à un événement à venir (`brain_notes.task_id` / `event_id`, l'un ou l'autre, `supabase/ideas.sql`) ; l'idée s'affiche sous la tâche et dans le détail de l'événement. Une idée ou une tâche écrite avec « pendant / pour / à la prochaine session X », « pendant (le|la) X » ou « pendant ma tâche X » (Zone Commande **et** formulaires simples des panneaux Idées/Tâches) se lie toute seule au prochain événement (plage) à venir dont le titre contient X — une idée sans plage correspondante retombe sur une tâche non faite ; une tâche ne se lie qu'à une plage, jamais à une autre tâche (`lib/command.js`, `extractIdeaLink`/`matchIdeaTarget`, testé par `scripts/check-command.mjs`) ; pas de cible trouvée = créée sans lien, l'aperçu (Zone Commande) le dit. **La to-do s'insère dans l'agenda** : une tâche rattachée à une plage (`tasks.event_id`, menu « Pendant… » sous la tâche, badge « À placer » si aucune plage) s'affiche dans le bloc de la plage (vue semaine, lecture seule) et dans son détail (case à cocher réelle, comme dans le panneau Tâches) ; au survol/focus d'un bloc qui a des idées liées, une infobulle les liste (`supabase/agenda-links.sql`).
6. « Organiser la page » (masquer, réafficher, réordonner les panneaux) s'enregistre dans `dashboard_settings` (clé `home_layout`). Vue globale : l'agenda reste entier en pleine largeur, les autres panneaux sont compacts en grille (hauteur max, défilement interne) avec ⤢ Étendre / ▾ Replier dans l'en-tête, mémorisés dans `home_layout.sizes` (`HomeSlot` + `Panel`, `components/ui.js`).
7. `components/AutoRefresh.js` relit le serveur au retour sur l'onglet et toutes les 60 s (`router.refresh()`), pour garder téléphone et PC synchrones ; ces tables n'ont pas de realtime. SQL à exécuter : `supabase/dashboard-edit.sql`.
8. **Catégories d'agenda** (bouton « Catégories » du panneau Agenda) : `dashboard_settings` (clé `agenda_categories`, aucune table dédiée) porte une liste `{ key, name, color, kind }`, `kind` = `plage` ou `tache` (`lib/home.js`, `resolveCategories`/`categoryOf`, Server Actions `saveCategory`/`deleteCategory`/`moveCategory` dans `app/edit-actions.js`, UI `components/CategoryEditor.js`). Les 3 catégories par défaut (clés `11`/`9`/`6`, les colorId Google) se renomment et se recolorent mais ne se suppriment pas ; supprimer une catégorie personnalisée repasse ses événements sur `9`. Le formulaire d'événement (`components/AgendaPanel.js`) choisit la catégorie dans cette liste et peut la renommer/recolorer sans quitter l'agenda (`CategoryPicker`). La couleur ne part jamais vers Google. Un bloc Google rangé dans une catégorie créée sur le site (clé `c-…`) la garde à la synchro (`scripts/push-agenda.mjs` ne l'écrase pas) ; passé sur `11`/`9`/`6`, il suit la couleur Google à la synchro suivante.

## Comment ajouter du contenu sans code

1. **Boutons** : chaque panneau de l'accueil a son formulaire (ajouter une tâche, un événement, une idée, une app, un projet, un jalon) et des boutons ✎ modifier, ↑ ↓ ordre, ✕ supprimer (confirmation en ligne).
2. **Zone Commande** (en haut de l'accueil, et sur `/brain` depuis le 2026-09-22 : même composant `CommandBox`, mêmes phrases) : écrire une phrase, « Interpréter », vérifier l'aperçu (chaque ligne se retire avec ✕), « Confirmer ». Rien n'est écrit avant la confirmation. L'interprétation est locale, déterministe (`lib/command.js`, testée par `scripts/check-command.mjs`) : ni modèle, ni clé, ni réseau.
3. Formulations comprises : **événement** « ajoute (moi) une session de travail Claude de 14 à 16h mercredi et vendredi » (plage `de 9h30 à 11h`, `de 23h à 1h` finit le lendemain, `à 14h` = 1 h, `à 14h pendant 2h` ; plusieurs jours `lundi, mardi et jeudi`, `demain`, `après-demain`, `aujourd'hui`, `lundi prochain`, `le 24 septembre`, `le 24/09` ; sans jour : la prochaine fois qu'il est cette heure) ; **tâche** « tâche : appeler la banque pour vendredi », « à faire : … », « rappelle-moi de … » (échéance facultative : `pour vendredi`, `demain`, `le 25`) ; **idée** « idée : … ». Un jour de semaine = sa prochaine occurrence (aujourd'hui si l'heure n'est pas passée), « prochain » = la semaine suivante. Le reste : « Je n'ai pas compris » avec trois exemples.
4. Les événements créés ainsi sont locaux (`origin = 'local'`) : visibles sur le tableau de bord, pas dans Google Agenda.

## Notifications issues des mails (`supabase/notifications.sql`)

1. L'analyse des mails est faite par Claude (la tâche planifiée `refresh-dashboard-agenda-mails`, ou une session), jamais par le site : il propose des notifications, Thibaut les accepte ou les ignore dans le panneau « Tâches » (section « À valider, depuis les mails »).
2. `node --env-file=.env.local scripts/push-notifications.mjs <fichier.json> [--dry-run]` ; format `{"notifications":[{"kind","title","detail","mail_id","mail_link","starts_at","ends_at","due_date","dedupe_key"}]}`, 30 au plus. `kind` = `event` (`starts_at` requis), `deadline` (`due_date` requis), `todo` ou `info` ; dates ISO 8601 avec fuseau, `due_date` AAAA-MM-JJ.
3. Écriture par insertion qui ignore les doublons sur `dedupe_key` (à dériver du fil et de l'objet, ex. `<mail_id>:deadline`) : une ligne existante n'est jamais modifiée, donc une notification acceptée ou ignorée ne revient pas ; rien n'est supprimé. « Supprimer » sur le site efface aussi la mémoire du doublon.
4. Jamais le contenu d'un mail : seulement `title` et `detail` courts dérivés, l'identifiant du fil (`mail_id`) et le lien (`mail_link`). Table personnelle : RLS sans policy anon, lecture et écriture côté serveur.
5. Accepter : un événement crée un événement local, une échéance ou un « à faire » crée une tâche (avec l'échéance), une info est marquée acceptée. Modifier change le titre et les dates avant d'accepter.

Un push sur `main` redéploie en production : ne jamais pousser sans accord explicite.

**Idées d'amélioration de Thibaut** : les noter dans `BACKLOG.md`, sans coder ni ouvrir de PR
à chaque idée ; une PR groupée seulement quand il y en a assez ou qu'il le demande.

Contexte ajouté lors de la mise en place de l'architecture CLAUDE.GLOBAL —
historique complet dans `../../ARCHITECTURE.md`.

## Contexte détaillé (vault Obsidian)

Note de reprise (état réel du projet, décisions, points « À vérifier ») :
`C:\Users\thiba\CLAUDE.GLOBAL\Vault\01 Projets\dashboard-pilotage\dashboard-pilotage.md` — à lire
avant de fouiller le dossier. Le vault résume ; `../../ARCHITECTURE.md` et le code font foi.
