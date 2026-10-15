import { queryOne } from '@/lib/db';
import { getObjectStream } from '@/lib/storage';

export const dynamic = 'force-dynamic';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Public: streams an uploaded image from storage. The id never points at different bytes, so cache hard.
export async function GET(_req, { params }) {
  const { id } = await params;
  if (!UUID.test(id)) return new Response('Not found', { status: 404 });
  try {
    const row = await queryOne(`SELECT storage_key, mime, size, filename FROM media WHERE id = $1`, [id]);
    if (!row) return new Response('Not found', { status: 404 });
    const stream = await getObjectStream(row.storage_key);
    if (!stream) return new Response('Not found', { status: 404 });
    return new Response(stream, {
      headers: {
        'Content-Type': row.mime,
        'Content-Length': String(row.size),
        'Cache-Control': 'public, max-age=31536000, immutable',
        'X-Content-Type-Options': 'nosniff',
        'Content-Disposition': `inline; filename="${row.filename.replace(/[^\w.-]/g, '_')}"`,
      },
    });
  } catch (e) {
    console.error('media serve failed', e);
    return new Response('Server error', { status: 500 });
  }
}
