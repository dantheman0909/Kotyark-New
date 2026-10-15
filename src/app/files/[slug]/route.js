// Stable public file URLs: /files/<document-slug>.<ext>. Streams from storage (never /public).
import { getDocumentBySlug, extForMime } from '@/lib/documents';
import { getObjectStream } from '@/lib/storage';
import { getCurrentUser, can } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(_req, { params }) {
  try {
    const { slug: raw } = await params;
    const slug = String(raw).replace(/\.[A-Za-z0-9]{2,5}$/, '');

    let doc = await getDocumentBySlug(slug, { publishedOnly: true });
    let isDraftPreview = false;
    if (!doc) {
      // Editors may open unpublished files (admin preview); everyone else gets 404.
      const user = await getCurrentUser();
      if (user && can(user, 'documents:write')) {
        doc = await getDocumentBySlug(slug, { publishedOnly: false });
        isDraftPreview = Boolean(doc);
      }
    }
    if (!doc) return new Response('Not found', { status: 404 });

    if (doc.storage_key) {
      const stream = await getObjectStream(doc.storage_key);
      if (!stream) return new Response('Not found', { status: 404 });
      return new Response(stream, {
        status: 200,
        headers: {
          'Content-Type': doc.mime,
          'Content-Disposition': `inline; filename="${doc.slug}.${extForMime(doc.mime)}"`,
          'Cache-Control': isDraftPreview ? 'private, no-store' : 'public, max-age=3600',
          'X-Content-Type-Options': 'nosniff',
        },
      });
    }
    if (doc.external_url) {
      return new Response(null, { status: 302, headers: { Location: doc.external_url, 'Cache-Control': isDraftPreview ? 'private, no-store' : 'public, max-age=300' } });
    }
    return new Response('Not found', { status: 404 });
  } catch (e) {
    console.error('files route error:', e);
    return new Response('Internal server error', { status: 500 });
  }
}
