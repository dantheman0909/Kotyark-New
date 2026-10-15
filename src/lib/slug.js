// URL-safe slugs. Shared by pages, folders, documents.
export function slugify(input, maxLen = 80) {
  return String(input || '')
    .normalize('NFKD').replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, maxLen)
    .replace(/-+$/g, '') || 'untitled';
}

/**
 * Make `base` unique using exists(candidate) => Promise<boolean>.
 * Appends -2, -3, ... as needed.
 */
export async function uniqueSlug(base, exists) {
  let s = slugify(base);
  if (!(await exists(s))) return s;
  for (let i = 2; i < 1000; i++) {
    const c = `${s}-${i}`;
    if (!(await exists(c))) return c;
  }
  throw new Error('Could not allocate a unique slug');
}
