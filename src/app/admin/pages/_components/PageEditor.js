'use client';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import './cms.css';
import { BLOCKS } from '@/lib/blocks/schemas';
import { beforeUnloadGuard, formatDate, useApi } from './api';
import { withKeys } from './FieldInput';
import BlockEditor from './BlockEditor';
import SeoPanel from './SeoPanel';
import RevisionsDrawer from './RevisionsDrawer';

const slugPreview = (s) => String(s || '').normalize('NFKD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/&/g, ' and ')
  .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

function decorate(blocks) {
  return (blocks || []).map((b) => ({ ...b, props: BLOCKS[b.type] ? withKeys(BLOCKS[b.type].fields, b.props || {}) : b.props }));
}

function descendantsOf(pages, id) {
  const out = new Set([id]);
  let grew = true;
  while (grew) {
    grew = false;
    for (const p of pages) if (p.parentId && out.has(p.parentId) && !out.has(p.id)) { out.add(p.id); grew = true; }
  }
  return out;
}

export default function PageEditor({ id }) {
  const api = useApi();
  const [loaded, setLoaded] = useState(false);
  const [loadError, setLoadError] = useState('');
  const [page, setPage] = useState(null);
  const [siteUrl, setSiteUrl] = useState('');
  const [pages, setPages] = useState([]);
  const [folders, setFolders] = useState([]);
  const [form, setForm] = useState({ title: '', slug: '', parentId: '', showInNav: false, navOrder: 0 });
  const [blocks, setBlocks] = useState([]);
  const [seo, setSeo] = useState({});
  const [saved, setSaved] = useState('');
  const [busy, setBusy] = useState('');
  const [msg, setMsg] = useState(null);
  const [errorsById, setErrorsById] = useState({});
  const [showRevs, setShowRevs] = useState(false);
  const [editorVersion, setEditorVersion] = useState(0);

  const snapshot = useMemo(() => JSON.stringify({ form, blocks, seo }), [form, blocks, seo]);
  const dirty = loaded && snapshot !== saved;
  const isHome = page?.path === '/';

  const applyPage = useCallback((p) => {
    const nextForm = { title: p.title, slug: p.slug, parentId: p.parentId || '', showInNav: p.showInNav, navOrder: p.navOrder };
    const nextBlocks = decorate(p.blocks);
    const nextSeo = p.seo || {};
    setPage(p);
    setForm(nextForm);
    setBlocks(nextBlocks);
    setSeo(nextSeo);
    setSaved(JSON.stringify({ form: nextForm, blocks: nextBlocks, seo: nextSeo }));
    setErrorsById({});
  }, []);

  const load = useCallback(async () => {
    try {
      const [pd, list, fd] = await Promise.all([
        api(`/api/pages/${id}`),
        api('/api/pages'),
        api('/api/folders').catch(() => null),
      ]);
      setSiteUrl(pd.siteUrl || '');
      setPages(list.pages || []);
      const fl = Array.isArray(fd) ? fd : fd?.folders || fd?.items || [];
      setFolders(fl.map((f) => ({ id: f.id, name: f.name || f.title || f.slug || f.id })));
      applyPage(pd.page);
      setEditorVersion((v) => v + 1);
      setLoaded(true);
    } catch (e) {
      setLoadError(e.status === 404 ? 'This page does not exist (it may have been deleted).' : e.message);
    }
  }, [api, id, applyPage]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => beforeUnloadGuard(dirty), [dirty]);

  const refreshMeta = useCallback(async () => {
    const [pd, list] = await Promise.all([api(`/api/pages/${id}`), api('/api/pages')]);
    setPage(pd.page);
    setPages(list.pages || []);
  }, [api, id]);

  const save = useCallback(async () => {
    setBusy('save');
    setMsg(null);
    setErrorsById({});
    try {
      const body = { title: form.title, showInNav: form.showInNav, navOrder: Number(form.navOrder) || 0, blocks, seo };
      if (!isHome) { body.slug = form.slug; body.parentId = form.parentId || null; }
      const d = await api(`/api/pages/${id}`, { method: 'PUT', body });
      const nextForm = { ...form, slug: d.page.slug, parentId: d.page.parentId || '' };
      setForm(nextForm);
      setSaved(JSON.stringify({ form: nextForm, blocks, seo }));
      await refreshMeta();
      setMsg({ type: 'ok', text: d.redirectsCreated ? `Draft saved. ${d.redirectsCreated} redirect(s) created from the old URL(s).` : 'Draft saved.' });
      return true;
    } catch (e) {
      if (e.status === 400 && Array.isArray(e.body?.errors)) {
        const map = {};
        for (const er of e.body.errors) map[er.blockId] = er.messages;
        setErrorsById(map);
        setMsg({ type: 'error', text: e.body.error, list: e.body.errors.flatMap((er) => er.messages) });
      } else if (e.status !== 401) {
        setMsg({ type: 'error', text: e.message });
      }
      return false;
    } finally { setBusy(''); }
  }, [api, id, form, blocks, seo, isHome, refreshMeta]);

  const saveRef = useRef(save);
  saveRef.current = save;
  useEffect(() => {
    const onKey = (e) => { if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') { e.preventDefault(); saveRef.current(); } };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const preview = async () => {
    const w = window.open('', '_blank'); // opened synchronously so popup blockers allow it
    if (dirty && !(await save())) { w?.close(); return; }
    const url = `/preview/${page.previewToken}`;
    if (w) w.location.href = url; else window.open(url, '_blank');
  };

  const publish = async () => {
    if (dirty && !(await save())) return;
    if (!window.confirm(`Publish "${form.title}"? It will be visible at ${page.path} immediately.`)) return;
    setBusy('publish');
    try {
      await api(`/api/pages/${id}/publish`, { method: 'POST' });
      await refreshMeta();
      setMsg({ type: 'ok', text: 'Published.' });
    } catch (e) {
      if (e.status === 400 && Array.isArray(e.body?.errors)) {
        const map = {};
        for (const er of e.body.errors) map[er.blockId] = er.messages;
        setErrorsById(map);
      }
      if (e.status !== 401) setMsg({ type: 'error', text: e.message, list: e.body?.errors?.flatMap((er) => er.messages) });
    } finally { setBusy(''); }
  };

  const unpublish = async () => {
    if (!window.confirm('Unpublish this page? Its public URL will stop working.')) return;
    setBusy('unpublish');
    try {
      await api(`/api/pages/${id}/unpublish`, { method: 'POST' });
      await refreshMeta();
      setMsg({ type: 'ok', text: 'Unpublished. The page is a draft again.' });
    } catch (e) { if (e.status !== 401) setMsg({ type: 'error', text: e.message }); }
    finally { setBusy(''); }
  };

  const restore = async (rev) => {
    const warn = dirty ? 'You have unsaved changes that will be lost. ' : '';
    if (!window.confirm(`${warn}Restore the revision from ${formatDate(rev.createdAt)} into your draft?`)) return;
    setBusy('restore');
    try {
      const d = await api(`/api/pages/${id}/revisions/${rev.id}/restore`, { method: 'POST' });
      applyPage(d.page);
      setEditorVersion((v) => v + 1);
      await refreshMeta();
      setShowRevs(false);
      setMsg({ type: 'ok', text: 'Revision restored into the draft. Publish to make it live.' });
    } catch (e) { if (e.status !== 401) setMsg({ type: 'error', text: e.message }); }
    finally { setBusy(''); }
  };

  const parentOptions = useMemo(() => {
    const banned = descendantsOf(pages, id);
    return pages.filter((p) => !banned.has(p.id));
  }, [pages, id]);

  if (loadError) return <div className="cmsa"><div className="cmsa-alert error">{loadError}</div><Link className="cmsa-btn" href="/admin/pages">Back to pages</Link></div>;
  if (!loaded) return <div className="cmsa"><p>Loading…</p></div>;

  const parent = pages.find((p) => p.id === form.parentId);
  const effectiveSlug = slugPreview(form.slug);
  const previewPath = isHome ? '/' : `${!parent || parent.path === '/' ? '' : parent.path}/${effectiveSlug}`;
  const pathChanges = !isHome && page.status === 'published' && previewPath !== page.path;
  const published = page.status === 'published';
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const descFallback = blocks.map((b) => b.props?.subheading || b.props?.intro || '').find(Boolean) || '';

  return (
    <div className="cmsa">
      <div className="cmsa-sticky">
        <div className="cmsa-head" style={{ marginBottom: 0 }}>
          <div>
            <Link href="/admin/pages" style={{ fontSize: 12 }}>← All pages</Link>
            <h1 style={{ marginTop: 2 }}>
              {form.title || 'Untitled'}{' '}
              <span className={`cmsa-badge ${published ? 'published' : 'draft'}`}>{page.status}</span>{' '}
              {published && page.hasUnpublishedChanges && <span className="cmsa-badge changes">Unpublished changes</span>}
              {dirty && <span className="cmsa-badge draft" style={{ marginLeft: 6 }}>Unsaved</span>}
            </h1>
          </div>
          <div className="cmsa-actions">
            <button type="button" className="cmsa-btn" onClick={() => setShowRevs(true)}>History</button>
            <button type="button" className="cmsa-btn" onClick={preview} disabled={!!busy}>Preview</button>
            <button type="button" className="cmsa-btn" onClick={save} disabled={!!busy || !dirty}>{busy === 'save' ? 'Saving…' : 'Save draft'}</button>
            {published && <button type="button" className="cmsa-btn danger" onClick={unpublish} disabled={!!busy}>Unpublish</button>}
            <button type="button" className="cmsa-btn primary" onClick={publish} disabled={!!busy || (published && !dirty && !page.hasUnpublishedChanges)}>
              {busy === 'publish' ? 'Publishing…' : published ? 'Publish changes' : 'Publish'}
            </button>
          </div>
        </div>
      </div>

      {msg && (
        <div className={`cmsa-alert ${msg.type}`} role="status">
          {msg.text}
          {msg.list && msg.list.length > 0 && <ul>{msg.list.map((m, i) => <li key={i}>{m}</li>)}</ul>}
        </div>
      )}

      <div className="cmsa-card">
        <h2>Page details</h2>
        <div className="cmsa-row" style={{ marginTop: 12 }}>
          <div className="cmsa-field">
            <label className="cmsa-label" htmlFor="pg-title">Title <span className="req">*</span></label>
            <input id="pg-title" type="text" value={form.title} onChange={(e) => set('title', e.target.value)} />
          </div>
          <div className="cmsa-field">
            <label className="cmsa-label" htmlFor="pg-slug">Slug</label>
            <input id="pg-slug" type="text" value={form.slug} disabled={isHome} onChange={(e) => set('slug', e.target.value)} />
            <div className="cmsa-hint">URL: <code>{siteUrl}{previewPath}</code></div>
            {pathChanges && <div className="cmsa-hint over">The URL changes: a permanent redirect from {page.path} is created on save.</div>}
          </div>
        </div>
        <div className="cmsa-row">
          <div className="cmsa-field">
            <label className="cmsa-label" htmlFor="pg-parent">Parent page</label>
            <select id="pg-parent" value={form.parentId} disabled={isHome} onChange={(e) => set('parentId', e.target.value)}>
              <option value="">(none, top level)</option>
              {parentOptions.map((p) => <option key={p.id} value={p.id}>{p.title} ({p.path})</option>)}
            </select>
          </div>
          <div className="cmsa-field">
            <label className="cmsa-label" htmlFor="pg-order">Sort order</label>
            <input id="pg-order" type="number" value={form.navOrder} onChange={(e) => set('navOrder', e.target.value === '' ? 0 : Number(e.target.value))} />
          </div>
        </div>
        <label className="cmsa-check"><input type="checkbox" checked={form.showInNav} onChange={(e) => set('showInNav', e.target.checked)} /> Show in navigation</label>
        <div className="cmsa-hint" style={{ marginTop: 6 }}>
          {published && page.publishedAt ? `Published ${formatDate(page.publishedAt)}. ` : ''}Last saved {formatDate(page.updatedAt)}.
          Menus are arranged under <Link href="/admin/navigation">Navigation</Link>.
        </div>
      </div>

      <div className="cmsa-card">
        <h2 style={{ marginBottom: 12 }}>Content blocks</h2>
        <BlockEditor blocks={blocks} setBlocks={setBlocks} errorsById={errorsById} folders={folders} editorVersion={editorVersion} />
      </div>

      <SeoPanel seo={seo} setSeo={setSeo} title={form.title} path={previewPath} siteUrl={siteUrl} descriptionFallback={descFallback} />

      {showRevs && <RevisionsDrawer pageId={id} busy={!!busy} onClose={() => setShowRevs(false)} onRestore={restore} />}
    </div>
  );
}
