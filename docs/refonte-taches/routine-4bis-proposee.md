# Étape 4 bis de la routine : rédaction proposée (2026-10-06)

Fichier visé : `C:\Users\thiba\.claude\scheduled-tasks\refresh-dashboard-agenda-mails\SKILL.md`
(non modifié : à appliquer par Thibaut après validation).

## Pourquoi

Diagnostic : 95 notifications « Oublié hier ? » fabriquées en 2 semaines, 0 acceptée, la même tâche
qui revient chaque jour (clé de dédoublonnage par date), « Accepter » qui crée un doublon de tâche.
La routine tourne une seule fois par jour, à 12h : « 12h ou 19h » et « passage de 19h » n'ont plus de sens.

Changements :

1. **Une seule notification par jour** : un bilan, `kind: "info"`, titre « Bilan d'hier : N blocs, M tâches ».
   Fini les N cartes. (Un bilan `info` ne crée rien à l'acceptation, et son `dedupe_key` ne commence pas
   par `recap:`, donc « Ignorer » ne coche aucune tâche par erreur.)
2. **Dédoublonnage sur la tâche, pas sur la date** : une tâche déjà rappelée dans une notification encore
   `new` n'est pas rappelée. Une tâche ne revient donc qu'une fois traitée (acceptée ou ignorée) puis oubliée à nouveau.
3. **Retrait de « 12h ou 19h »** (étape 2 bis) et de « même au passage de 19h » (étape 4 bis) : seule la tâche de 12h existe.

## Texte proposé (remplace l'étape 4 bis en entier)

```
4 bis. TÂCHES DE LA VEILLE (« tu n'en as pas oublié une ? ») : fais la liste de ce qui était prévu hier (Europe/Paris), de deux sources, en lecture seule :
   - Google Agenda : les événements d'hier (00h00-23h59) de couleur orange (`colorId` "6", blocs de tâches). Pour chacun, garde le titre, l'heure et, si sa description contient « Tâches : … », chaque tâche numérotée ou à puce comme une ligne à part (texte court, sans recopier les détails). Ignore les cours EDHEC (11) et les autres événements (9).
   - Dashboard : les tâches non faites échues hier, via l'API REST Supabase, depuis le dossier du projet : `node --env-file=.env.local -e "fetch(process.env.NEXT_PUBLIC_SUPABASE_URL+'/rest/v1/tasks?select=id,title,due_date&done_at=is.null&due_date=eq.<AAAA-MM-JJ d'hier>',{headers:{apikey:process.env.SUPABASE_SERVICE_ROLE_KEY,Authorization:'Bearer '+process.env.SUPABASE_SERVICE_ROLE_KEY}}).then(r=>r.json()).then(d=>console.log(JSON.stringify(d)))"`. Une tâche du dashboard déjà présente dans la liste Google (même intitulé) n'apparaît qu'une fois.
   DÉDOUBLONNAGE SUR LA TÂCHE : lis les notifications encore à traiter, avec la même commande adaptée : `rest/v1/notifications?select=title,detail&status=eq.new&or=(dedupe_key.like.bilan:*,dedupe_key.like.recap:*)`. Retire de la liste toute tâche déjà rappelée par une de ces notifications : son intitulé (casse et accents ignorés) figure dans le `detail` d'un bilan encore `new`, ou c'est le titre d'un ancien « Oublié hier ? » encore `new`. Une tâche déjà rappelée et pas encore traitée n'est jamais rappelée une deuxième fois.
   Ne propose PAS de nouveau créneau et ne crée qu'UNE notification. Écris avec l'outil Write un fichier JSON dans le scratchpad au format de `scripts/push-notifications.mjs`, avec une seule entrée : `kind: "info"`, `title` = « Bilan d'hier : N blocs, M tâches » (N = nombre de blocs orange d'hier, M = nombre de tâches restantes après dédoublonnage), `detail` = les M tâches séparées par « ; », intitulé court, 500 caractères au plus (au-delà : les premières, puis « … et K autres »), `dedupe_key` = `bilan:<AAAA-MM-JJ d'hier>`, sans `due_date`. Si M vaut 0 (rien d'hier ou tout déjà rappelé) : n'écris aucune notification et saute l'étape. Lance `node --env-file=.env.local scripts/push-notifications.mjs <fichier> --dry-run`, puis sans `--dry-run` (laisse le fichier dans le scratchpad). Erreur : applique la règle de l'étape 4.
```

## Texte proposé pour l'étape 5, ligne « Hier : rien d'oublié ? » (conséquence)

```
   - **Hier : rien d'oublié ?** : les M tâches du bilan de l'étape 4 bis, chacune avec son bloc d'hier, puis une ligne « Bilan posé dans le panneau Tâches du dashboard ; recase à la demande dans une session ». Chaque ligne a un bouton « Recaser ↗ » (`sendPrompt("Recase « <tâche> » (prévue hier) dans le prochain bloc qui correspond")`). Rien à rappeler : « Aucune tâche oubliée hier ».
```

## Étape 2 bis : retrait de « 12h ou 19h »

Avant : `... reçues depuis la synchro précédente (12h ou 19h) avec ...`
Après : `... reçues depuis la synchro précédente (la veille à 12h) avec ...`

## Diff avant / après (clair)

| Point | Avant | Après |
|---|---|---|
| Nombre de notifications par jour | une par tâche d'un bloc orange d'hier ou échue hier (jusqu'à 30) | une seule, de bilan |
| Type | `deadline`, titre « Oublié hier ? <tâche> » | `info`, titre « Bilan d'hier : N blocs, M tâches » |
| Détail | « Prévu hier dans <bloc> (<heure>). Accepter = recasée le <jour> ... ; Ignorer = c'était fait. » | la liste des M tâches, séparées par « ; » (500 caractères au plus) |
| `due_date` | jour proposé pour le recasage | aucune |
| `dedupe_key` | `recap:<date d'hier>:<id>:<n>` : change chaque jour, donc la tâche revient chaque jour | `bilan:<date d'hier>` : un bilan par jour ; la tâche, elle, est dédoublonnée en amont |
| Rappel d'une tâche déjà rappelée et encore `new` | oui, chaque jour | non |
| Proposition de créneau | oui (prochain bloc orange correspondant) | non : le recasage se fait à la demande en session |
| « Accepter » | crée une nouvelle tâche (doublon de la tâche d'origine) | ne crée rien (bilan `info`) |
| « Ignorer » | écarte la carte, ne coche rien | écarte la carte (bilan) ; aucune tâche cochée |
| Mention « 12h ou 19h » | présente (étape 2 bis) et « passage de 19h » (étape 4 bis) | retirée : une seule synchro, à 12h |
| Étape 5, carte | liste + « Accepter = recaser, Ignorer = c'était fait » | liste des M tâches + bilan posé, recasage à la demande |

## Compatibilité avec le site (branche feat/taches-socle)

- Les anciennes notifications `recap:` restent gérées par le panneau (regroupées par tâche).
- Le bilan `info` s'affiche comme n'importe quelle notification `info`.
- Pas de changement de schéma SQL.
