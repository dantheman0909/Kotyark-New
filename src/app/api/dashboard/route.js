import { requireUser, can, errorResponse } from '@/lib/auth';
import { loadDashboard } from './stats';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const user = await requireUser();
    return Response.json(await loadDashboard({ includeAudit: can(user, 'audit:read') }), { headers: { 'Cache-Control': 'no-store' } });
  } catch (e) { return errorResponse(e); }
}
