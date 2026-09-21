import { getSupabaseAdmin } from '@/lib/supabase-admin';
import { handleMcpRequest } from '@/lib/mcp';
import { saveTools } from '@/lib/saves';

// Serveur MCP distant (connecteur personnalisé claude.ai, tous appareils) : saves
// Instagram en lecture seule. Hors Basic Auth (proxy.js) mais protégé par
// MCP_SECRET : /api/mcp/<secret> ou `Authorization: Bearer <secret>`. Toute la
// logique (auth, protocole, limites) est dans lib/mcp.js, testée par scripts/check-mcp.mjs.
const tools = saveTools(getSupabaseAdmin);

async function handle(request, { params }) {
  const { secret } = await params;
  return handleMcpRequest(request, { segments: secret, secret: process.env.MCP_SECRET, tools });
}

export { handle as POST, handle as GET, handle as DELETE };
