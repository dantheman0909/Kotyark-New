import { absoluteUrl } from '@/lib/site';
import { COMPANY } from '@/lib/seo';
import { PAGES, SUMMARY, KEY_FACTS } from '@/lib/site-content';
import { loadDisclosures, LLMS_HEADERS } from '@/lib/llms';

export const dynamic = 'force-dynamic';

// llmstxt.org format: H1, blockquote summary, details, then H2 link lists.
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
    '## Pages',
    '',
    ...PAGES.map((p) => `- [${p.name}](${absoluteUrl(p.path)}): ${p.desc}`),
    '',
  ];
  if (folders.length) {
    out.push('## Investor disclosures', '');
    for (const f of folders) out.push(`- [${f.name}](${f.url})${f.description ? `: ${f.description}` : ''}`);
    out.push('');
  }
  out.push(
    '## Optional',
    '',
    `- [Full text of all pages and the document index](${absoluteUrl('/llms-full.txt')}): complete plain-text content`,
    `- [Sitemap](${absoluteUrl('/sitemap.xml')}): every public URL`,
    ''
  );
  return new Response(out.join('\n'), { headers: LLMS_HEADERS });
}
