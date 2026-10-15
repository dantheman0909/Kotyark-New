// Extract plain text from a PDF buffer for search + auto-description. Never throws.
export async function extractPdfText(buffer, maxChars = 500_000) {
  try {
    const pdfParse = (await import('pdf-parse/lib/pdf-parse.js')).default;
    const out = await pdfParse(buffer);
    return String(out.text || '').replace(/\s+/g, ' ').trim().slice(0, maxChars);
  } catch (e) {
    console.warn('PDF text extraction failed:', e.message);
    return '';
  }
}

/** First ~160 chars of extracted text, cut at a word boundary, for meta descriptions. */
export function autoDescription(text, max = 160) {
  const t = String(text || '').trim();
  if (t.length <= max) return t;
  return t.slice(0, max).replace(/\s+\S*$/, '') + '…';
}
