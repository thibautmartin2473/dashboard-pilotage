# Studio des vitrines : contrat commun

Demande de Thibaut (2026-10-06) : « charte graphique, navigation, organisation sont des catégories
différentes, il doit y avoir plusieurs propositions pour chaque catégorie ». Le Studio
(`/demo/studio`) les combine librement : 4 chartes x 4 navigations x 4 organisations, clair ou
sombre. Un panneau « Composer » en bas à droite permet de basculer ; l'URL garde le choix
(`?charte=papier&mode=dark&nav=rail&org=journal`).

## Fichiers et propriétaires (un agent n'écrit QUE dans ses fichiers)

| Axe | Fichiers | Propriétaire |
|---|---|---|
| Cadre | `app/demo/studio/page.js`, `components/demo/studio/Studio.js`, `registry.js`, `loadStudioData.js` | Claude principal (ne pas modifier) |
| Charte | `app/demo/studio/chartes.css`, `app/demo/studio/layout.js` (polices), `components/demo/studio/chartes-meta.js`, `components/demo/studio/sections/*` (kit et vues communes) | agent chartes |
| Navigation | `components/demo/studio/nav/*` (`Rail.js`, `Onglets.js`, `Palette.js`, `Fil.js`, `meta.js`) | agent navigation |
| Organisation | `components/demo/studio/org/<id>/*` (`Home.js`, `meta.js`, tout fichier utile) | un agent par organisation |

## Jetons de charte (variables CSS posées sur `.studio[data-charte=...][data-mode=...]`)

`--bg --surface --surface-2 --border --border-strong --text --text-muted --text-faint
--accent --accent-soft --accent-contrast --danger --warning --success
--cat-cours --cat-tache --cat-autre --radius --radius-sm --shadow
--font-display --font-body --font-mono`

Navigation et organisations n'utilisent QUE ces jetons pour couleurs, rayons, ombres et polices
(Tailwind en valeurs arbitraires : `bg-[var(--surface)]`, `text-[var(--text-muted)]`,
`rounded-[var(--radius)]`, `[font-family:var(--font-display)]`). Interdit : les classes de couleur
Tailwind (`zinc-*`, `blue-*`, `bg-white`...) et le variant `dark:` (il est toujours actif dans ce
projet, voir `app/globals.css`). Mise en page, espacements et tailles de texte : Tailwind normal.

## Interfaces

- Navigation : `export default function NavX({ sections, current, onNavigate, orgName, renderSection, children })`.
  `sections` = `[{ id, label }]` (registre), `children` = la vue courante, `renderSection(id)` rend
  n'importe quelle section (pour une navigation qui les empile toutes).
- Organisation : `export default function OrgXHome({ data, log, onNavigate })` (accueil).
  `meta.js` exporte `META = { name, description, sections? }` ; `sections` peut remplacer une vue
  commune (`{ taches: MaVue }`).
- Vue de section commune : `({ data, log, onNavigate })`, exportée dans `SECTION_VIEWS`.
- `data` (lecture seule, objets simples) : `nowIso, today (AAAA-MM-JJ Paris), tasks (ouvertes),
  done (faites depuis J-36), ideas, events (calendar_events depuis J-36), mails, apps,
  notifications (new), categories, projects, errors`. Les fonctions pures de `lib/home.js`
  (buildWeek, splitTasks, timeParis, eventIdsOnDay, latestMails, describeWhen...) s'importent côté
  client.
- `log("tasks : marquer fait \"Case Coach n°1\"")` : chaque geste qui écrirait pour de vrai.
  Aucune écriture réelle : pas d'import de `app/*actions.js`, pas de `'use server'`.

## Les modules (démos de fonction déjà construites)

`/demo/aujourdhui`, `/demo/tri`, `/demo/bilan`, `/demo/echeances` : leur logique pure est dans
`components/demo/*Logic.js` (TodayLogic, TriageLogic, ReviewLogic, DeadlinesLogic) et peut être
réutilisée. Chaque organisation montre où ces modules vivent chez elle.
