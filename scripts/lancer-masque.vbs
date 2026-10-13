' Lance un script Node du repo SANS fenêtre (les tâches planifiées de scripts/install-taches.ps1 passent par ici :
' une action « node ... » directe ferait clignoter une console). Usage, via wscript :
'   wscript.exe //B //Nologo lancer-masque.vbs <script.mjs> <chemin de node.exe>
' Le dossier de travail est la racine du repo (dossier parent de scripts\), les clés viennent de .env.local
' (node --env-file). La sortie est ajoutée à %LOCALAPPDATA%\Cadran\taches.log.
Option Explicit
Dim sh, fso, scriptsDir, repo, nodeExe, script, logDir, logFile, cmd
Set sh = CreateObject("WScript.Shell")
Set fso = CreateObject("Scripting.FileSystemObject")

If WScript.Arguments.Count < 2 Then WScript.Quit 2
script = WScript.Arguments(0)
nodeExe = WScript.Arguments(1)

scriptsDir = fso.GetParentFolderName(WScript.ScriptFullName)
repo = fso.GetParentFolderName(scriptsDir)

logDir = sh.ExpandEnvironmentStrings("%LOCALAPPDATA%") & "\Cadran"
If Not fso.FolderExists(logDir) Then fso.CreateFolder logDir
logFile = logDir & "\taches.log"

' Rotation simple du journal : on ne garde que les 500 dernières lignes (le fichier ne grossit pas sans fin).
If fso.FileExists(logFile) Then
  Dim f, contenu, lignes, i, garde
  On Error Resume Next
  Set f = fso.OpenTextFile(logFile, 1)
  contenu = f.ReadAll
  f.Close
  lignes = Split(contenu, vbCrLf)
  If UBound(lignes) >= 500 Then
    garde = ""
    For i = UBound(lignes) - 499 To UBound(lignes)
      garde = garde & lignes(i) & vbCrLf
    Next
    Set f = fso.OpenTextFile(logFile, 2)
    f.Write garde
    f.Close
  End If
  On Error GoTo 0
End If

sh.CurrentDirectory = repo
cmd = "cmd /c ""echo === %DATE% %TIME% " & script & " >> """ & logFile & """ & """ & nodeExe & """ --env-file=.env.local scripts\" & script & " >> """ & logFile & """ 2>&1"""
' 0 = fenêtre masquée, True = attendre la fin (le code de sortie remonte au Planificateur de tâches).
WScript.Quit sh.Run(cmd, 0, True)
