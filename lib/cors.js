// En-têtes CORS pour les routes appelées depuis un Artifact Claude (autre
// origine que le dashboard) : Tour de Contrôle et Spircle Control.
export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};
