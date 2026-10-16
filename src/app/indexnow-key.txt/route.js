import { getIndexNowKey } from '@/lib/indexnow';

export const dynamic = 'force-dynamic';

// IndexNow key verification file. Its body must equal INDEXNOW_KEY exactly.
export async function GET() {
  const key = getIndexNowKey();
  if (!key) return new Response('Not found', { status: 404 });
  return new Response(key, { headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'public, max-age=3600' } });
}
