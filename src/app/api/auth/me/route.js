import { requireUser, can, PERMISSIONS, errorResponse } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const user = await requireUser();
    return Response.json({
      user: { id: user.id, email: user.email, name: user.name, role: user.role },
      permissions: Object.keys(PERMISSIONS).filter((c) => can(user, c)),
    }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (e) { return errorResponse(e); }
}
