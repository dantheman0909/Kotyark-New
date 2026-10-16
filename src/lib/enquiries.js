// Shared by the enquiries admin API and screen. Server-only (uses the pool).
import { query } from './db';
import { SUBJECTS } from './enquiry-rules';

export const STATUSES = ['new', 'handled', 'spam'];
export const PAGE_SIZE = 50;

export const ENQUIRY_COLUMNS = `e.id, e.subject, e.name, e.email, e.phone, e.company, e.volume, e.message, e.status,
  e.source_path, e.created_at, e.handled_at, e.note, u.name AS handled_by_name, u.email AS handled_by_email`;

/** Parse ?status=&subject= (ignore unknown values) into a parameterized WHERE. */
export function enquiryFilter(params) {
  const where = []; const args = [];
  const status = params.get('status');
  if (STATUSES.includes(status)) { args.push(status); where.push(`e.status = $${args.length}`); }
  const subject = params.get('subject');
  if (SUBJECTS.includes(subject)) { args.push(subject); where.push(`e.subject = $${args.length}`); }
  return { sql: where.length ? `WHERE ${where.join(' AND ')}` : '', args };
}

export async function listEnquiries(params, { page = 1, limit = PAGE_SIZE } = {}) {
  const { sql, args } = enquiryFilter(params);
  const offset = (Math.max(1, page) - 1) * limit;
  const [rows, count] = await Promise.all([
    query(
      `SELECT ${ENQUIRY_COLUMNS} FROM enquiries e LEFT JOIN users u ON u.id = e.handled_by
        ${sql} ORDER BY e.created_at DESC, e.id LIMIT ${Number(limit)} OFFSET ${Number(offset)}`, args),
    query(`SELECT count(*)::int AS n FROM enquiries e ${sql}`, args),
  ]);
  return { rows, total: count[0].n };
}
