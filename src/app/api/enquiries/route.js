import { errorResponse, requireUser } from '@/lib/auth';
import { listEnquiries, PAGE_SIZE } from '@/lib/enquiries';

export const dynamic = 'force-dynamic';

// GET /api/enquiries?status=&subject=&page= -> { enquiries, total, page, pageSize }
export async function GET(req) {
  try {
    await requireUser('enquiries:read');
    const params = new URL(req.url).searchParams;
    const page = Math.max(1, parseInt(params.get('page'), 10) || 1);
    const { rows, total } = await listEnquiries(params, { page });
    return Response.json({ enquiries: rows, total, page, pageSize: PAGE_SIZE }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (e) { return errorResponse(e); }
}
