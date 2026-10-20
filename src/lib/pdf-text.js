// Extract plain text from a PDF buffer for search + auto-description. Never throws.
// pdf.js holds a whole parsed document in the heap, so extractions run one at a time process-wide: concurrent
// uploads queue instead of multiplying the peak. At most MAX_PAGES pages are read (the result says when it truncated).
// (pdf-parse destroys its pdf.js document itself when it finishes; it is not reachable from here if parsing throws.)
// Admission: at most 1 running + MAX_WAITING queued; a caller that wants to be sure of a slot BEFORE it allocates a
// large buffer calls reserveExtraction(), which throws a 503 when the queue is full.
export const MAX_PAGES = 150;
export const MAX_WAITING = 3;
let tail = Promise.resolve();
let pending = 0; // running + waiting + reserved

export function runExclusive(fn) {
  const run = tail.then(fn, fn);
  tail = run.then(() => {}, () => {});
  return run;
}

/** Reserve a slot in the extraction queue. Pass the ticket to extractPdfTextInfo, or call release() if unused. */
export function reserveExtraction() {
  if (pending >= 1 + MAX_WAITING) {
    throw Object.assign(new Error('Server busy indexing other PDFs; try Retry save in a moment'), { status: 503, expose: true });
  }
  pending++;
  let done = false;
  return { release() { if (!done) { done = true; pending--; } } };
}

/** { text, truncated }. Never throws. `ticket` (from reserveExtraction) is released when the work finishes. */
export function extractPdfTextInfo(buffer, { maxChars = 500_000, ticket = null } = {}) {
  const t = ticket || reserveExtractionUnbounded();
  return runExclusive(async () => {
    try {
      const pdfParse = (await import('pdf-parse/lib/pdf-parse.js')).default;
      const out = await pdfParse(buffer, { max: MAX_PAGES });
      return { text: String(out.text || '').replace(/\s+/g, ' ').trim().slice(0, maxChars), truncated: out.numpages > MAX_PAGES };
    } catch (e) {
      console.warn('PDF text extraction failed:', e.message);
      return { text: '', truncated: false };
    } finally { t.release(); }
  });
}

function reserveExtractionUnbounded() {
  pending++;
  let done = false;
  return { release() { if (!done) { done = true; pending--; } } };
}

/** Text only (scripts and other callers that do not need the truncation flag). */
export async function extractPdfText(buffer, maxChars = 500_000) {
  return (await extractPdfTextInfo(buffer, { maxChars })).text;
}

/** First ~160 chars of extracted text, cut at a word boundary, for meta descriptions. */
export function autoDescription(text, max = 160) {
  const t = String(text || '').trim();
  if (t.length <= max) return t;
  return t.slice(0, max).replace(/\s+\S*$/, '') + '…';
}
