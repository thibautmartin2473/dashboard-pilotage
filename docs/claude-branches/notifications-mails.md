# 5. Notifications issues des mails

Périmètre : `supabase/notifications.sql`, `scripts/push-notifications.mjs`. (`D\` = `docs\claude-branches\`, voir la racine du projet.)

1. L'analyse des mails est faite par Claude (la tâche planifiée `refresh-dashboard-agenda-mails`, ou une session), jamais par le site : il propose des notifications, Thibaut les accepte ou les ignore dans le panneau « Tâches » (section « À valider, depuis les mails »).
2. `node --env-file=.env.local scripts/push-notifications.mjs <fichier.json> [--dry-run]` ; format `{"notifications":[{"kind","title","detail","mail_id","mail_link","starts_at","ends_at","due_date","dedupe_key"}]}`, 30 au plus. `kind` = `event` (`starts_at` requis), `deadline` (`due_date` requis), `todo` ou `info` ; dates ISO 8601 avec fuseau, `due_date` AAAA-MM-JJ.
3. Écriture par insertion qui ignore les doublons sur `dedupe_key` (à dériver du fil et de l'objet, ex. `<mail_id>:deadline`) : une ligne existante n'est jamais modifiée, donc une notification acceptée ou ignorée ne revient pas ; rien n'est supprimé. « Supprimer » sur le site efface aussi la mémoire du doublon.
4. Jamais le contenu d'un mail : seulement `title` et `detail` courts dérivés, l'identifiant du fil (`mail_id`) et le lien (`mail_link`). Table personnelle : RLS sans policy anon, lecture et écriture côté serveur.
5. Accepter : un événement crée un événement local, une échéance ou un « à faire » crée une tâche (avec l'échéance), une info est marquée acceptée. Modifier change le titre et les dates avant d'accepter.

Un push sur `main` redéploie en production : ne jamais pousser sans accord explicite.

**Idées d'amélioration de Thibaut** : les noter dans `BACKLOG.md`, sans coder ni ouvrir de PR
à chaque idée ; une PR groupée seulement quand il y en a assez ou qu'il le demande.
