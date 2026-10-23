import { absoluteUrl } from '@/lib/site';
import { COMPANY } from '@/lib/seo';
import { PAGES, SUMMARY, KEY_FACTS, marketingText } from '@/lib/site-content';
import { loadDisclosures, LLMS_HEADERS } from '@/lib/llms';

export const dynamic = 'force-dynamic';

// Size: titles, dates and URLs only. Extracted PDF text is deliberately omitted (104+ filings would add
// hundreds of KB of boilerplate that drowns the page copy); each document URL below carries it.
export async function GET() {
  const folders = await loadDisclosures();
  const out = [
    `# ${COMPANY.legalName}`,
    '',
    `> ${SUMMARY}`,
    '',
    'Key facts:',
    ...KEY_FACTS.map((f) => `- ${f}`),
    '',
    'Page URLs:',
    ...PAGES.map((p) => `- ${p.name}: ${absoluteUrl(p.path)}`),
    '',
    marketingText(),
    '',
    '## Investor disclosures',
    '',
  ];
  if (!folders.length) out.push(`The document index is temporarily unavailable. See ${absoluteUrl('/investors')}.`, '');
  for (const f of folders) {
    out.push(`### ${f.name}`, `${f.url}`);
    if (f.description) out.push(f.description);
    out.push('');
    if (!f.docs.length) out.push('- No documents published.');
    for (const d of f.docs) out.push(`- ${d.title}${d.date ? ` (${d.date})` : ''} – ${d.url}`);
    out.push('');
  }
  if (folders.truncatedNote) out.push(folders.truncatedNote, '');
  return new Response(out.join('\n'), { headers: LLMS_HEADERS });
}
