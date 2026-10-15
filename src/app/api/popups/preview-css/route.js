import { errorResponse, httpError, requireUser } from '@/lib/auth';
import { sanitizeRichText } from '@/lib/sanitize';
import { scopePopupCss } from '@/lib/popup-css';
import { UUID_RE } from '@/lib/popups';

export const dynamic = 'force-dynamic';

// POST /api/popups/preview-css { popupId, css, bodyHtml? } -> { css, warnings, fatal, bodyHtml }
// The editor's live preview renders exactly what the server would store: scoped CSS and sanitized body.
export async function POST(req) {
  try {
    await requireUser('popups:write');
    const body = await req.json().catch(() => null);
    const popupId = String(body?.popupId || '');
    if (!UUID_RE.test(popupId)) throw httpError(400, 'Invalid pop-up id');
    const r = scopePopupCss(String(body?.css ?? ''), popupId);
    return Response.json({ css: r.css, warnings: r.warnings, fatal: r.fatal, bodyHtml: sanitizeRichText(String(body?.bodyHtml ?? '')) });
  } catch (e) { return errorResponse(e); }
}
