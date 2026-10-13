# Enregistre les deux tâches planifiées Windows du Cadran, sans droits administrateur (tâches de l'utilisateur,
# exécutées quand il est connecté), fenêtre masquée :
#   "CLAUDE.GLOBAL - Avancement Cadran"  tous les jours à 20h50     (scripts\push-avancement.mjs)
#   "CLAUDE.GLOBAL - Export Supabase"    chaque dimanche à 20h40    (scripts\export-supabase.mjs)
# Rattrapage : si le PC était éteint à l'heure prévue, la tâche part dès qu'il se rallume (StartWhenAvailable).
# Idempotent : relancer le script remplace les deux tâches. Elles pointent vers le checkout PRINCIPAL (le dossier
# du repo qui contient ce script ; à lancer depuis le checkout principal, après le merge de la PR).
# Usage (PowerShell 5.1) :
#   Set-Location "C:\Users\thiba\CLAUDE.GLOBAL\Apps\dashboard-pilotage"; .\scripts\install-taches.ps1
# Pour les retirer :  Unregister-ScheduledTask -TaskName "CLAUDE.GLOBAL - Avancement Cadran" -Confirm:$false
# Journal d'exécution : %LOCALAPPDATA%\Cadran\taches.log (scripts\lancer-masque.vbs, qui n'en garde que les 500 dernières lignes).

$ErrorActionPreference = 'Stop'

$scripts = Split-Path -Parent $MyInvocation.MyCommand.Path
$repo = Split-Path -Parent $scripts
# Garde-fou : jamais depuis un worktree git (son dossier disparaît avec la branche, les tâches pointeraient dans le vide).
# Dans un worktree, `.git` est un FICHIER ; on refuse aussi les chemins de worktree connus.
if ((Test-Path -LiteralPath (Join-Path $repo '.git') -PathType Leaf) -or ($repo -match '[\\/]\.claude[\\/]worktrees[\\/]') -or ($repo -match '-wt-')) {
  throw "Lancement refusé depuis un worktree ($repo). Lancer ce script depuis le checkout principal : C:\Users\thiba\CLAUDE.GLOBAL\Apps\dashboard-pilotage"
}
$launcher = Join-Path $scripts 'lancer-masque.vbs'
if (-not (Test-Path $launcher)) { throw "Introuvable : $launcher" }
if (-not (Test-Path (Join-Path $repo '.env.local'))) { throw "Introuvable : $(Join-Path $repo '.env.local') (les clés Supabase)." }
$node = (Get-Command node -ErrorAction Stop).Source
$wscript = Join-Path $env:SystemRoot 'System32\wscript.exe'

$user = "$env:USERDOMAIN\$env:USERNAME"
$principal = New-ScheduledTaskPrincipal -UserId $user -LogonType Interactive -RunLevel Limited
# Visibles dans le Planificateur de tâches (pas -Hidden : on doit pouvoir les y voir et les relancer) ; la fenêtre
# reste masquée par le lanceur. Trois nouvelles tentatives, 10 minutes d'écart, si le script sort en erreur.
$settings = New-ScheduledTaskSettingsSet -StartWhenAvailable -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries `
  -MultipleInstances IgnoreNew -ExecutionTimeLimit (New-TimeSpan -Minutes 15) `
  -RestartCount 3 -RestartInterval (New-TimeSpan -Minutes 10)

function Register-Tache {
  param([string]$Nom, [string]$Script, $Trigger, [string]$Description)
  $arguments = '//B //Nologo "{0}" {1} "{2}"' -f $launcher, $Script, $node
  $action = New-ScheduledTaskAction -Execute $wscript -Argument $arguments -WorkingDirectory $repo
  Register-ScheduledTask -TaskName $Nom -Action $action -Trigger $Trigger -Principal $principal -Settings $settings `
    -Description $Description -Force | Out-Null
  Write-Output ("OK : {0}" -f $Nom)
}

Register-Tache -Nom 'CLAUDE.GLOBAL - Avancement Cadran' -Script 'push-avancement.mjs' `
  -Trigger (New-ScheduledTaskTrigger -Daily -At '20:50') `
  -Description "Calcule le bloc Avancement du Cadran depuis le vault et l'écrit dans Supabase (0 token)."

Register-Tache -Nom 'CLAUDE.GLOBAL - Export Supabase' -Script 'export-supabase.mjs' `
  -Trigger (New-ScheduledTaskTrigger -Weekly -DaysOfWeek Sunday -At '20:40') `
  -Description 'Exporte toutes les tables Supabase en JSON vers CLAUDE.GLOBAL\Backups\supabase (8 exports gardés), avant la sauvegarde OneDrive de 21 h.'

Write-Output "Dépôt : $repo ; Node : $node"
Write-Output 'Lancer une tâche tout de suite pour tester : Start-ScheduledTask -TaskName "CLAUDE.GLOBAL - Avancement Cadran"'
