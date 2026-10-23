import { loadActivePopups } from '@/lib/popups';

export const dynamic = 'force-dynamic';

// GET /api/popups/active -> { popups: [public payload] }. Public: the same data the site already embeds in its pages.
// The client uses it after navigating away from the page the server rendered; it applies path/device rules itself.
export async function GET() {
  return Response.json({ popups: await loadActivePopups() }, { headers: { 'Cache-Control': 'public, max-age=30' } });
}
