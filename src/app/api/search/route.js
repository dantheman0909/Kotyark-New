import { searchSite } from '@/lib/search';

export const dynamic = 'force-dynamic';

const PAGE_SIZE = 20;

/** GET /api/search?q=&type=all|pages|documents&page=1 */
export async function GET(req) {
  const sp = new URL(req.url).searchParams;
  const q = sp.get('q') || '';
  const type = ['pages', 'documents'].includes(sp.get('type')) ? sp.get('type') : 'all';
  const page = Math.min(Math.max(parseInt(sp.get('page') || '1', 10) || 1, 1), 500);
  try {
    const res = await searchSite(q, { type, limit: PAGE_SIZE, offset: (page - 1) * PAGE_SIZE });
    return Response.json(
      { ...res, page, pageSize: PAGE_SIZE, pages: Math.max(1, Math.ceil(res.total / PAGE_SIZE)) },
      { headers: { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120' } },
    );
  } catch (e) {
    console.error('[search] failed:', e?.message);
    return Response.json({ error: 'Search is temporarily unavailable.' }, { status: 503, headers: { 'Cache-Control': 'no-store' } });
  }
}
