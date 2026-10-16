import { errorResponse, requireUser } from '@/lib/auth';
import { audit } from '@/lib/audit';
import { query } from '@/lib/db';
import { enquiryFilter, ENQUIRY_COLUMNS } from '@/lib/enquiries';

export const dynamic = 'force-dynamic';
const MAX_ROWS = 10000;

// Quote every value; a leading = + - @ (or tab/CR) is prefixed with ' so spreadsheets never run it as a formula.
function cell(v) {
  let s = v == null ? '' : v instanceof Date ? v.toISOString() : String(v);
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  return `"${s.replace(/"/g, '""')}"`;
}

// GET /api/enquiries/export?status=&subject= -> text/csv
export async function GET(req) {
  try {
    const user = await requireUser('enquiries:read');
    const sp = new URL(req.url).searchParams;
    const { sql, args } = enquiryFilter(sp);
    const rows = await query(
      `SELECT ${ENQUIRY_COLUMNS} FROM enquiries e LEFT JOIN users u ON u.id = e.handled_by
        ${sql} ORDER BY e.created_at DESC, e.id LIMIT ${MAX_ROWS}`, args);
    // The export is a bulk copy of personal data: leave a trace of who took it and with which filter.
    await audit(user, 'export', 'enquiry', null, `Exported ${rows.length} enquiries as CSV (status=${sp.get('status') || 'any'}, subject=${sp.get('subject') || 'any'})`,
      { filter: { status: sp.get('status') || null, subject: sp.get('subject') || null }, rows: rows.length });
    const head = ['Received (UTC)', 'Status', 'Subject', 'Name', 'Email', 'Phone', 'Company', 'Monthly volume (KL)', 'Message', 'Note', 'Handled by', 'Handled at (UTC)', 'Source page'];
    const lines = [head.map(cell).join(',')];
    for (const r of rows) {
      lines.push([r.created_at, r.status, r.subject, r.name, r.email, r.phone, r.company, r.volume, r.message, r.note,
        r.handled_by_name || r.handled_by_email, r.handled_at, r.source_path].map(cell).join(','));
    }
    return new Response('﻿' + lines.join('\r\n') + '\r\n', {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="enquiries-${new Date().toISOString().slice(0, 10)}.csv"`,
        'Cache-Control': 'no-store',
      },
    });
  } catch (e) { return errorResponse(e); }
}
