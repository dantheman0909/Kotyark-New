import { errorResponse, requireUser } from '@/lib/auth';
import { query } from '@/lib/db';
import { assertUuid } from '../../_lib';

export const dynamic = 'force-dynamic';

// GET /api/pages/:id/revisions -> { revisions: [{ id, title, note, blockCount, createdAt, createdBy }] } newest first, max 100
export async function GET(_req, { params }) {
  try {
    await requireUser();
    const { id } = await params;
    assertUuid(id);
    const rows = await query(
      `SELECT r.id, r.title, r.note, jsonb_array_length(r.blocks) AS block_count, r.created_at, u.email AS created_by
         FROM page_revisions r LEFT JOIN users u ON u.id = r.created_by
        WHERE r.page_id = $1 ORDER BY r.id DESC LIMIT 100`, [id]);
    return Response.json({
      revisions: rows.map(r => ({ id: r.id, title: r.title, note: r.note, blockCount: r.block_count, createdAt: r.created_at, createdBy: r.created_by })),
    });
  } catch (e) { return errorResponse(e); }
}
