import { getCurrentUser, destroySession, errorResponse } from '@/lib/auth';
import { audit } from '@/lib/audit';

export async function POST() {
  try {
    const user = await getCurrentUser();
    await destroySession();
    if (user) await audit(user, 'logout', 'session', null, `${user.email} signed out`);
    return Response.json({ ok: true });
  } catch (e) { return errorResponse(e); }
}
