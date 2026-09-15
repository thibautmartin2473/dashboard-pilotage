// Données de départ pour les 3 projets, utilisées par scripts/seed.mjs (écriture
// réelle dans Supabase) et par lib/mock-data.js (mode démo sans Supabase configuré).
// Jalons proposés à partir d'un audit rapide de chaque dépôt — à ajuster depuis le site.

export const PROJECTS = [
  {
    slug: 'edhec-ai',
    name: 'EDHEC AI',
    repo_path_local: 'C:\\Users\\thiba\\OneDrive\\Desktop\\EDHEC AI',
    repos: [{ kind: 'github', ref: 'thibautmartin2473/edhec-ai', label: 'edhec-ai' }],
    milestones: [
      { label: 'Backend Flask + SQLite (schema, connexion, blueprints)', status: 'done' },
      { label: 'Upload PDF → génération de cartes (API Anthropic, streaming)', status: 'done' },
      { label: 'Moteur de révision SM-2 à 3 niveaux + mode hors-ligne', status: 'done' },
      { label: 'Tableau de bord (KPI globaux + détail matière/chapitre)', status: 'done' },
      { label: 'CRUD manuel des cartes + édition live', status: 'done' },
      { label: 'PWA (service worker + manifest, usage iPhone hors-ligne)', status: 'in_progress' },
      { label: 'Packaging distribution portable (launchers, dossier distribution/)', status: 'in_progress' },
      { label: 'Accès distant stable via Tailscale', status: 'todo' },
    ],
  },
  {
    slug: 'stage',
    name: 'STAGE',
    repo_path_local: 'C:\\Users\\thiba\\Internship-tracker',
    repos: [
      { kind: 'github', ref: 'thibautmartin2473/Internship-tracker', label: 'Internship-tracker' },
    ],
    milestones: [
      { label: 'Base Next.js + Prisma + auth', status: 'done' },
      { label: 'Scan et import des candidatures', status: 'in_progress' },
      { label: 'Pipeline de suivi des candidatures', status: 'in_progress' },
      { label: 'Catégorisation IA des offres/candidatures', status: 'in_progress' },
      { label: 'Automatisations email (relances, alertes)', status: 'todo' },
      { label: "Exploration / recherche d'offres", status: 'todo' },
      { label: 'Profil utilisateur + réglages', status: 'done' },
      { label: 'Déploiement Vercel', status: 'todo' },
    ],
  },
  {
    slug: 'spircle',
    name: 'Spircle',
    repo_path_local: 'C:\\Users\\thiba\\OneDrive\\Desktop\\Spircle\\spircle',
    repos: [
      { kind: 'vercel', ref: 'prj_nHk86VR041gCbXW9J8VcBUIEThup', label: 'spircle (app mobile)' },
      { kind: 'vercel', ref: 'prj_gC2UWuiirrDYDg07HYR1oZPMjoF9', label: 'spircle-admin' },
      { kind: 'vercel', ref: 'prj_GqUC46iCaCsOs1e0vS4OrzxSoCzS', label: 'spircle-owner' },
      { kind: 'vercel', ref: 'prj_i7mahHxmOukWHwfNSaCJs1m9QL2y', label: 'spircle-portal' },
      { kind: 'github', ref: 'thibautmartin2473/spircle', label: 'spircle' },
      { kind: 'github', ref: 'thibautmartin2473/spircle-admin', label: 'spircle-admin' },
      { kind: 'github', ref: 'thibautmartin2473/spircle-manager', label: 'spircle-manager' },
      { kind: 'github', ref: 'thibautmartin2473/spircle-portal', label: 'spircle-portal' },
    ],
    milestones: [
      { label: 'App mobile Expo — recherche de bars, carte, géolocalisation', status: 'done' },
      { label: 'Auth Supabase partagée (app + admin + owner)', status: 'done' },
      { label: 'Espace admin (gestion des bars, notifications)', status: 'in_progress' },
      { label: 'Espace propriétaire de bar (spircle-owner)', status: 'in_progress' },
      { label: 'Portail public (spircle-portal)', status: 'todo' },
      { label: 'Dépôts poussés sur GitHub', status: 'done' },
      { label: 'Déploiements Vercel liés (4 apps)', status: 'done' },
    ],
  },
];
