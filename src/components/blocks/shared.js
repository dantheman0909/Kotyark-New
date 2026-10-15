import Link from 'next/link';
import { safeHref } from '@/lib/pages';
import { imageSrc } from '@/lib/blocks/schemas';

/** Internal links use next/link; everything else is a plain anchor. Unsafe schemes render as '#'. */
export function SmartLink({ href, children, ...rest }) {
  const h = safeHref(href);
  if (!h) return <span className={rest.className}>{children}</span>;
  if (h.startsWith('/') || h.startsWith('#')) return <Link href={h} {...rest}>{children}</Link>;
  const external = /^https?:\/\//i.test(h);
  return <a href={h} {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})} {...rest}>{children}</a>;
}

/** Resolved, safe image URL (media id -> /media/<id>) or null. */
export function resolveImage(value) {
  const src = imageSrc(value);
  if (!src) return null;
  return /^(\/(?![\/\\])|https:\/\/)/i.test(src) && !src.includes("\\") ? src : null;
}

export function SectionTag({ children }) {
  return (
    <span className="section-tag" style={{ display: 'inline-block', fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: 600, fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--color-accent)', marginBottom: '12px' }}>
      {children}
    </span>
  );
}
