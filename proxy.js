import { NextResponse } from 'next/server';

// Accès personnel uniquement (voir spec §1) : si DASHBOARD_USER/DASHBOARD_PASS
// ne sont pas définis, le site reste ouvert (utile en dev local) — en
// production, toujours définir ces deux variables sur Vercel.
export function proxy(request) {
  const user = process.env.DASHBOARD_USER;
  const pass = process.env.DASHBOARD_PASS;

  if (!user || !pass) {
    return NextResponse.next();
  }

  const authHeader = request.headers.get('authorization');

  if (authHeader?.startsWith('Basic ')) {
    const decoded = atob(authHeader.slice('Basic '.length));
    const separatorIndex = decoded.indexOf(':');
    const suppliedUser = decoded.slice(0, separatorIndex);
    const suppliedPass = decoded.slice(separatorIndex + 1);
    if (suppliedUser === user && suppliedPass === pass) {
      return NextResponse.next();
    }
  }

  return new NextResponse('Authentication required', {
    status: 401,
    headers: { 'WWW-Authenticate': 'Basic realm="dashboard-pilotage"' },
  });
}

export const config = {
  // api/public et api/brain-notes (POST) sont appelés cross-origin depuis des
  // Artifacts Claude publics (Tour de Contrôle, Spircle Control), qui ne
  // peuvent pas fournir de Basic Auth — doivent rester exclus, sinon le
  // fetch() de l'artifact reçoit un 401 (bug constaté le 2026-09-17).
  matcher: ['/((?!api/cron|api/hooks|api/public|api/brain-notes|_next/static|_next/image|favicon.ico).*)'],
};
