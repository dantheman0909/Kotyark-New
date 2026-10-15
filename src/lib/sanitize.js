// Server-side HTML sanitization for rich text. Apply before storing AND before rendering.
import sanitizeHtml from 'sanitize-html';

const OPTIONS = {
  allowedTags: ['p', 'br', 'h2', 'h3', 'h4', 'strong', 'b', 'em', 'i', 'u', 's', 'a', 'ul', 'ol', 'li',
    'blockquote', 'hr', 'code', 'pre', 'table', 'thead', 'tbody', 'tr', 'th', 'td', 'span'],
  allowedAttributes: { a: ['href', 'target', 'rel', 'title'], th: ['colspan', 'rowspan'], td: ['colspan', 'rowspan'] },
  allowedSchemes: ['http', 'https', 'mailto', 'tel'],
  allowProtocolRelative: false,
  transformTags: {
    a: (tagName, attribs) => {
      // '/\evil.com' is read as protocol-relative by browsers: drop any href with a backslash or '//' prefix.
      if (/\\/.test(attribs.href || '') || /^\s*\/\//.test(attribs.href || '')) { const { href, ...rest } = attribs; attribs = rest; }
      const external = /^https?:\/\//i.test(attribs.href || '');
      return { tagName, attribs: external ? { ...attribs, target: '_blank', rel: 'noopener noreferrer' } : attribs };
    },
  },
};

export function sanitizeRichText(html) {
  return sanitizeHtml(String(html || ''), OPTIONS);
}

export function htmlToText(html) {
  return sanitizeHtml(String(html || ''), { allowedTags: [], allowedAttributes: {} })
    .replace(/\s+/g, ' ').trim();
}

// Only these hosts may be embedded by the `embed` block.
export const EMBED_HOSTS = ['www.youtube.com', 'youtube.com', 'www.youtube-nocookie.com', 'player.vimeo.com',
  'www.google.com', 'maps.google.com'];

export function isAllowedEmbed(url) {
  try { const u = new URL(url); return u.protocol === 'https:' && EMBED_HOSTS.includes(u.hostname); }
  catch { return false; }
}
