'use client';
import ImageField from './ImageField';

const Counter = ({ n, max }) => <div className={`cmsa-hint${n > max ? ' over' : ''}`}>{n}/{max} characters{n > max ? ' (may be truncated in search results)' : ''}</div>;

export default function SeoPanel({ seo, setSeo, title, path, siteUrl, descriptionFallback }) {
  const set = (k, v) => setSeo({ ...seo, [k]: v });
  const shownTitle = seo.metaTitle || title || 'Untitled';
  const shownDesc = seo.metaDescription || descriptionFallback || 'No description set: search engines will pick text from the page.';
  const host = (siteUrl || '').replace(/^https?:\/\//, '');
  const crumbs = [host, ...String(path || '/').split('/').filter(Boolean)].join(' › ');
  return (
    <div className="cmsa-card">
      <h2>Search appearance (SEO)</h2>
      <div className="cmsa-field" style={{ marginTop: 12 }}>
        <label className="cmsa-label" htmlFor="seo-title">Meta title</label>
        <input id="seo-title" type="text" value={seo.metaTitle || ''} placeholder={title} onChange={(e) => set('metaTitle', e.target.value)} />
        <Counter n={(seo.metaTitle || '').length} max={60} />
      </div>
      <div className="cmsa-field">
        <label className="cmsa-label" htmlFor="seo-desc">Meta description</label>
        <textarea id="seo-desc" value={seo.metaDescription || ''} onChange={(e) => set('metaDescription', e.target.value)} />
        <Counter n={(seo.metaDescription || '').length} max={160} />
      </div>
      <div className="cmsa-row">
        <div className="cmsa-field">
          <label className="cmsa-label" htmlFor="seo-og">Social share image (Open Graph)</label>
          <ImageField id="seo-og" value={seo.ogImageId || ''} onChange={(v) => set('ogImageId', v)} />
          <div className="cmsa-hint">Blank: the first hero image is used.</div>
        </div>
        <div className="cmsa-field">
          <label className="cmsa-label" htmlFor="seo-canon">Canonical URL (optional)</label>
          <input id="seo-canon" type="text" value={seo.canonical || ''} onChange={(e) => set('canonical', e.target.value)} placeholder="https://… (blank = this page)" />
        </div>
      </div>
      <div className="cmsa-field">
        <label className="cmsa-check"><input type="checkbox" checked={!!seo.noindex} onChange={(e) => set('noindex', e.target.checked)} /> Hide from search engines (noindex)</label>
      </div>
      <h3 style={{ margin: '4px 0 8px' }}>Google preview</h3>
      <div className="cmsa-serp" aria-label="Search result preview">
        <div className="u">{crumbs}</div>
        <div className="t">{shownTitle.length > 60 ? `${shownTitle.slice(0, 57)}…` : shownTitle}</div>
        <div className="d">{shownDesc.length > 160 ? `${shownDesc.slice(0, 157)}…` : shownDesc}</div>
      </div>
    </div>
  );
}
