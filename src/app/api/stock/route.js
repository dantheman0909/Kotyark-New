import { getQuote, getHistory, STOCK_RANGES } from '@/lib/stock';

export const dynamic = 'force-dynamic';

// GET /api/stock?range=1Y -> { quote, history }. Public; the data is public market data.
export async function GET(req) {
  const range = new URL(req.url).searchParams.get('range') || '1Y';
  if (!Object.hasOwn(STOCK_RANGES, range)) {
    return Response.json({ error: `range must be one of ${Object.keys(STOCK_RANGES).join(', ')}` }, { status: 400 });
  }
  const [quote, history] = await Promise.all([getQuote(), getHistory(range)]);
  return Response.json({ quote, history }, {
    headers: { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300' },
  });
}
