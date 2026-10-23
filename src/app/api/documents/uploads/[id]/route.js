import { requireUser, errorResponse } from '@/lib/auth';
import { audit } from '@/lib/audit';
import { cancelUpload } from '@/lib/uploads';

export const dynamic = 'force-dynamic';

// DELETE /api/documents/uploads/:id  cancels the upload and removes its temp parts (409 while it is being saved).
export async function DELETE(_req, { params }) {
  try {
    const user = await requireUser('documents:write');
    const { id } = await params;
    const up = await cancelUpload(id, user);
    await audit(user, 'delete', 'document', null, `Cancelled upload of "${up.filename}"`, { upload: id, size: up.size });
    return Response.json({ ok: true });
  } catch (e) { return errorResponse(e); }
}
