import { requireUser, errorResponse } from '@/lib/auth';
import { loadDashboard } from './stats';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    await requireUser();
    return Response.json(await loadDashboard(), { headers: { 'Cache-Control': 'no-store' } });
  } catch (e) { return errorResponse(e); }
}
