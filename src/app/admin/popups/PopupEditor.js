'use client';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import styles from '@/components/admin/admin.module.css';
import ps from './popups.module.css';
import '@/app/admin/pages/_components/cms.css';
import FormField from '@/components/admin/FormField';
import MediaPicker from '@/components/admin/MediaPicker';
import { useToast } from '@/components/admin/Toast';
import { api } from '@/components/admin/api';
import RichTextEditor from '@/app/admin/pages/_components/RichTextEditor';
import Popup from '@/components/popups/Popup';
import { imageSrc } from '@/lib/blocks/schemas';
import {
  POPUP_CSS_CLASSES, POPUP_CSS_PSEUDO_CLASSES, POPUP_CSS_PSEUDO_ELEMENTS, POPUP_CSS_BODY_ELEMENTS, POPUP_CSS_PROPERTY_GROUPS,
  POPUP_CSS_FORBIDDEN_PROPERTIES, POPUP_CSS_MARGIN_LIMIT,
} from '@/lib/popup-css-spec';
import {
  DEFAULT_CONTENT, DEFAULT_DESIGN, DEFAULT_RULES, POPUP_ENUMS, PRESETS, isoToIstText, istTextToIso, resolveColors, seoWarnings, blockingPublishMessage,
} from '@/lib/popup-config';

const TABS = [['content', 'Content'], ['design', 'Design'], ['css', 'Custom CSS'], ['rules', 'Display rules']];
const LABELS = {
  layout: { modal: 'Modal (centred)', 'slide-in': 'Slide-in (corner card)', 'top-bar': 'Top bar', 'bottom-bar': 'Bottom bar', fullscreen: 'Full screen' },
  preset: { brand: 'Brand green', light: 'Light', dark: 'Dark', amber: 'Amber' },
  width: { sm: 'Small', md: 'Medium', lg: 'Large' },
  animation: { fade: 'Fade', slide: 'Slide', zoom: 'Zoom', none: 'None' },
  font: { brand: 'Brand', system: 'System', serif: 'Serif' },
  imagePosition: { top: 'Top', left: 'Left', right: 'Right', background: 'Background' },
  trigger: { load: 'On page load', delay: 'After a delay', scroll: 'After scrolling', 'exit-intent': 'Exit intent (desktop only)' },
  devices: { all: 'All devices', desktop: 'Desktop only', mobile: 'Mobile only' },
  frequency: { 'every-visit': 'Every page load', session: 'Once per session', days: 'Once every N days', once: 'Once ever (per browser)' },
  position: { 'bottom-right': 'Bottom right', 'bottom-left': 'Bottom left' },
};
const safeHref = (h) => /^\/(?![\/\\])[^\s\\]*$/.test(h) || /^https:\/\/[^\s\\]+$/i.test(h);
const fullHex = (h) => (/^#[0-9a-f]{3}$/i.test(h) ? '#' + h.slice(1).split('').map((c) => c + c).join('') : h);

function Select({ label, value, onChange, options, labels, hint }) {
  return (
    <FormField as="select" label={label} value={value} onChange={(e) => onChange(e.target.value)} hint={hint}>
      {options.map((o) => <option key={o} value={o}>{labels?.[o] || o}</option>)}
    </FormField>
  );
}

function ColorField({ label, value, fallback, onChange }) {
  const [text, setText] = useState(value);
  useEffect(() => setText(value), [value]);
  const bad = text !== '' && !/^#(?:[0-9a-f]{3}|[0-9a-f]{6})$/i.test(text);
  return (
    <div className={styles.field}>
      <label className={styles.label}>{label}</label>
      <div className={ps.colorRow}>
        <input type="color" aria-label={`${label} picker`} value={fullHex(/^#[0-9a-f]{3,6}$/i.test(value) ? value : fallback)}
          onChange={(e) => onChange(e.target.value)} />
        <input className={styles.input} type="text" aria-label={`${label} hex`} placeholder={`${fallback} (preset)`} value={text} maxLength={7}
          onChange={(e) => { setText(e.target.value); if (e.target.value === '' || /^#(?:[0-9a-f]{3}|[0-9a-f]{6})$/i.test(e.target.value)) onChange(e.target.value); }} />
        {value && <button type="button" className={`${styles.btn} ${styles.btnGhost} ${styles.btnSm}`} onClick={() => onChange('')}>Reset</button>}
      </div>
      {bad && <span className={styles.fieldError}>Use a hex colour like #0d3b24</span>}
    </div>
  );
}

const blankForm = () => ({
  name: 'Untitled pop-up', priority: 0, content: { ...DEFAULT_CONTENT, primaryCta: { ...DEFAULT_CONTENT.primaryCta }, secondaryCta: { ...DEFAULT_CONTENT.secondaryCta } },
  design: { ...DEFAULT_DESIGN }, customCss: '',
  rules: { ...DEFAULT_RULES }, includeText: '', excludeText: '', startText: '', endText: '',
});

function fromServer(p) {
  return {
    name: p.name, priority: p.priority, content: p.content, design: p.design, customCss: p.customCss,
    rules: p.rules, includeText: p.rules.includePaths.join('\n'), excludeText: p.rules.excludePaths.join('\n'),
    startText: isoToIstText(p.rules.startAt), endText: isoToIstText(p.rules.endAt),
  };
}

function toPayload(f) {
  const { includeText, excludeText, startText, endText, rules, ...rest } = f;
  const lines = (t) => t.split(/\r?\n/).map((s) => s.trim()).filter(Boolean);
  return {
    ...rest,
    priority: Number(f.priority),
    rules: { ...rules, includePaths: lines(includeText), excludePaths: lines(excludeText), startAt: startText.trim() ? istTextToIso(startText) : null, endAt: endText.trim() ? istTextToIso(endText) : null },
  };
}

export default function PopupEditor({ id }) {
  const isNew = id === 'new';
  const router = useRouter();
  const toast = useToast();
  const [form, setForm] = useState(isNew ? blankForm : null);
  const [saved, setSaved] = useState(() => (isNew ? JSON.stringify(blankForm()) : ''));
  const [meta, setMeta] = useState({ status: 'draft', id: isNew ? null : id });
  const [loadKey, setLoadKey] = useState(0);
  const [tab, setTab] = useState('content');
  const [viewport, setViewport] = useState('desktop');
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');
  const [cssWarnings, setCssWarnings] = useState([]);
  const [preview, setPreview] = useState({ css: '', bodyHtml: '', fatal: false });
  const [previewId] = useState(() => (isNew ? crypto.randomUUID() : id));
  const popupId = meta.id || previewId;

  useEffect(() => {
    if (isNew) return;
    api(`/api/popups/${id}`).then(({ popup }) => {
      const f = fromServer(popup);
      setForm(f); setSaved(JSON.stringify(f)); setMeta({ status: popup.status, id: popup.id });
      setPreview({ css: popup.scopedCss, bodyHtml: popup.content.bodyHtml, fatal: false });
      setLoadKey((k) => k + 1);
    }).catch((e) => setError(e.message));
  }, [id, isNew]);

  const dirty = !!form && JSON.stringify(form) !== saved;

  // Unsaved-changes guard: tab close/reload, and in-app link clicks (sidebar, back link).
  useEffect(() => {
    if (!dirty) return undefined;
    const beforeUnload = (e) => { e.preventDefault(); e.returnValue = ''; };
    const onClick = (e) => {
      const a = e.target.closest?.('a[href]');
      if (!a || a.target === '_blank' || e.defaultPrevented || e.metaKey || e.ctrlKey) return;
      const url = new URL(a.href, window.location.href);
      if (url.origin !== window.location.origin || url.pathname === window.location.pathname) return;
      if (!window.confirm('You have unsaved changes that will be lost. Leave this page?')) { e.preventDefault(); e.stopPropagation(); }
    };
    window.addEventListener('beforeunload', beforeUnload);
    document.addEventListener('click', onClick, true);
    return () => { window.removeEventListener('beforeunload', beforeUnload); document.removeEventListener('click', onClick, true); };
  }, [dirty]);

  const set = (path, value) => setForm((f) => {
    const next = { ...f };
    if (path.length === 1) next[path[0]] = value;
    else next[path[0]] = { ...f[path[0]], [path[1]]: value };
    return next;
  });
  const setCta = (which, key, value) => setForm((f) => ({ ...f, content: { ...f.content, [which]: { ...f.content[which], [key]: value } } }));

  // Debounced server round-trip: the preview shows exactly the scoped CSS and sanitized body the server would store.
  const bodyRaw = form?.content.bodyHtml;
  const cssRaw = form?.customCss;
  const first = useRef(true);
  useEffect(() => {
    if (!form) return undefined;
    if (first.current) { first.current = false; if (!isNew) return undefined; }
    const t = setTimeout(() => {
      api('/api/popups/preview-css', { method: 'POST', body: { popupId, css: cssRaw, bodyHtml: bodyRaw } })
        .then((r) => { setPreview({ css: r.css, bodyHtml: r.bodyHtml, fatal: r.fatal }); setCssWarnings(r.warnings); })
        .catch(() => {});
    }, 500);
    return () => clearTimeout(t);
  }, [bodyRaw, cssRaw, popupId, isNew, !!form]); // eslint-disable-line react-hooks/exhaustive-deps

  const errors = useMemo(() => {
    if (!form) return [];
    const out = [];
    const c = form.content;
    if (!form.name.trim()) out.push('Name is required.');
    if (c.imageId && !c.imageAlt.trim()) out.push('Alt text is required when an image is set (Content tab).');
    for (const [k, l] of [['primaryCta', 'Primary button'], ['secondaryCta', 'Secondary button']]) {
      const { label, href } = c[k];
      if ((label || href) && !label.trim()) out.push(`${l} needs a label.`);
      if ((label || href) && !safeHref(href.trim())) out.push(`${l} link must start with / or https://.`);
    }
    for (const [t, l] of [[form.startText, 'Start'], [form.endText, 'End']]) {
      if (t.trim() && !istTextToIso(t)) out.push(`${l} must look like 2026-11-01 09:30.`);
    }
    if (form.startText.trim() && form.endText.trim() && istTextToIso(form.startText) && istTextToIso(form.endText) && istTextToIso(form.endText) <= istTextToIso(form.startText)) out.push('End must be after start.');
    if (!/^\d+$/.test(String(form.priority))) out.push('Priority must be a whole number.');
    if (preview.fatal) out.push('Custom CSS was rejected (see the Custom CSS tab).');
    return out;
  }, [form, preview.fatal]);

  const save = useCallback(async () => {
    if (!form || errors.length) return null;
    setBusy('save'); setError('');
    try {
      const payload = toPayload(form);
      const res = isNew
        ? await api('/api/popups', { method: 'POST', body: payload })
        : await api(`/api/popups/${meta.id}`, { method: 'PUT', body: payload });
      const f = fromServer(res.popup);
      setForm(f); setSaved(JSON.stringify(f)); setMeta({ status: res.popup.status, id: res.popup.id });
      setPreview({ css: res.popup.scopedCss, bodyHtml: res.popup.content.bodyHtml, fatal: false });
      setCssWarnings((res.warnings || []).filter((w) => !seoWarnings(f.design, f.rules).includes(w)));
      toast(res.popup.status === 'published' ? 'Saved (live)' : 'Draft saved');
      if (isNew) router.replace(`/admin/popups/${res.popup.id}`);
      return res.popup;
    } catch (e) { setError(e.message); toast(e.message, 'error'); return null; } finally { setBusy(''); }
  }, [form, errors, isNew, meta.id, router, toast]);

  const publish = async () => {
    const p = dirty || isNew ? await save() : { id: meta.id };
    if (!p) return;
    setBusy('publish');
    try {
      await api(`/api/popups/${p.id}/publish`, { method: 'POST' });
      setMeta({ status: 'published', id: p.id });
      toast('Published');
    } catch (e) { setError(e.message); toast(e.message, 'error'); } finally { setBusy(''); }
  };
  const unpublish = async () => {
    setBusy('unpublish');
    try { await api(`/api/popups/${meta.id}/unpublish`, { method: 'POST' }); setMeta((m) => ({ ...m, status: 'draft' })); toast('Unpublished'); }
    catch (e) { setError(e.message); toast(e.message, 'error'); } finally { setBusy(''); }
  };

  if (!form) return error ? <div className={styles.alert} role="alert">{error}</div> : <p className={styles.empty}>Loading…</p>;

  const c = form.content, d = form.design, r = form.rules;
  const colors = resolveColors({ preset: d.preset });
  const seo = seoWarnings(d, r);
  const publishBlock = blockingPublishMessage(d, r);
  const published = meta.status === 'published';
  const modalish = d.layout === 'modal' || d.layout === 'fullscreen';
  const previewPopup = {
    id: popupId,
    content: { ...c, bodyHtml: preview.bodyHtml, imageSrc: imageSrc(c.imageId) },
    design: d,
    css: preview.css,
  };

  return (
    <>
      <div className={ps.headRow}>
        <div>
          <Link href="/admin/popups" className={styles.muted}>&larr; All pop-ups</Link>
          <div>
            <input className={ps.titleInput} aria-label="Pop-up name" value={form.name} maxLength={120} onChange={(e) => set(['name'], e.target.value)} />
            <span className={`${styles.badge} ${published ? '' : styles.badgeOff}`}>{published ? 'Published' : 'Draft'}</span>
            {dirty && <span className={`${styles.badge} ${styles.badgeWarn}`} style={{ marginLeft: 6 }}>Unsaved</span>}
          </div>
        </div>
        <div className={styles.actions}>
          <button type="button" className={`${styles.btn} ${styles.btnGhost}`} onClick={save} disabled={!!busy || !dirty || errors.length > 0}>{busy === 'save' ? 'Saving…' : published ? 'Save changes (live)' : 'Save draft'}</button>
          {published && <button type="button" className={`${styles.btn} ${styles.btnGhost}`} onClick={unpublish} disabled={!!busy}>Unpublish</button>}
          {!published && (
            <button type="button" className={styles.btn} onClick={publish} disabled={!!busy || errors.length > 0 || !!publishBlock} title={publishBlock || undefined}>
              {busy === 'publish' ? 'Publishing…' : 'Publish'}
            </button>
          )}
        </div>
      </div>

      {error && <div className={styles.alert} role="alert">{error}</div>}
      {errors.length > 0 && <div className={styles.alert} role="alert"><ul style={{ margin: 0, paddingLeft: 18 }}>{errors.map((e) => <li key={e}>{e}</li>)}</ul></div>}
      {publishBlock && !published && <div className={styles.alert} role="alert"><strong>Cannot publish.</strong> {publishBlock}</div>}
      {seo.length > 0 && <div className={ps.notice} role="status"><strong>Search-ranking warning.</strong><ul>{seo.map((w) => <li key={w}>{w}</li>)}</ul></div>}
      {published && dirty && <div className={ps.notice}>This pop-up is live. &ldquo;Save changes (live)&rdquo; updates what visitors see immediately.</div>}

      <div className={ps.split}>
        <div>
          <div className={ps.tabs} role="tablist">
            {TABS.map(([k, l]) => (
              <button key={k} type="button" role="tab" aria-selected={tab === k} className={`${ps.tab} ${tab === k ? ps.tabOn : ''}`} onClick={() => setTab(k)}>{l}</button>
            ))}
          </div>
          <div className={ps.panel} role="tabpanel">
            {tab === 'content' && (
              <>
                <FormField label="Eyebrow" hint="Small label above the heading, e.g. NEW or INVESTOR UPDATE." maxLength={60} value={c.eyebrow} onChange={(e) => set(['content', 'eyebrow'], e.target.value)} />
                <FormField label="Heading" maxLength={140} value={c.heading} onChange={(e) => set(['content', 'heading'], e.target.value)} />
                <div className={styles.field}>
                  <label className={styles.label}>Body</label>
                  <div className="cmsa" style={{ padding: 0, margin: 0, maxWidth: 'none' }}>
                    <RichTextEditor key={loadKey} value={c.bodyHtml} onChange={(html) => set(['content', 'bodyHtml'], html)} />
                  </div>
                </div>
                <div className={styles.field}>
                  <label className={styles.label}>Image</label>
                  <MediaPicker value={c.imageId} onChange={(v) => setForm((f) => ({ ...f, content: { ...f.content, imageId: v, imageAlt: v ? f.content.imageAlt : '' } }))} />
                </div>
                {c.imageId && (
                  <div className={styles.formRow}>
                    <FormField label="Image alt text (required)" hint="Describe the image for screen readers." maxLength={200} value={c.imageAlt}
                      error={!c.imageAlt.trim() ? 'Alt text is required when an image is set.' : ''} onChange={(e) => set(['content', 'imageAlt'], e.target.value)} />
                    <Select label="Image position" value={c.imagePosition} options={POPUP_ENUMS.imagePosition} labels={LABELS.imagePosition} onChange={(v) => set(['content', 'imagePosition'], v)} />
                  </div>
                )}
                <p className={ps.sub}>Buttons</p>
                <div className={styles.formRow}>
                  <FormField label="Primary button label" maxLength={40} value={c.primaryCta.label} onChange={(e) => setCta('primaryCta', 'label', e.target.value)} />
                  <FormField label="Primary button link" placeholder="/contact or https://..." value={c.primaryCta.href} onChange={(e) => setCta('primaryCta', 'href', e.target.value)} />
                  <FormField label="Secondary button label" maxLength={40} value={c.secondaryCta.label} onChange={(e) => setCta('secondaryCta', 'label', e.target.value)} />
                  <FormField label="Secondary button link" placeholder="/investors or https://..." value={c.secondaryCta.href} onChange={(e) => setCta('secondaryCta', 'href', e.target.value)} />
                </div>
                <FormField label="Dismiss link text" hint="Leave empty to show only the close (X) button." maxLength={40} value={c.dismissLabel} onChange={(e) => set(['content', 'dismissLabel'], e.target.value)} />
              </>
            )}

            {tab === 'design' && (
              <>
                <div className={styles.formRow}>
                  <Select label="Preset" value={d.preset} options={POPUP_ENUMS.preset} labels={LABELS.preset} onChange={(v) => set(['design', 'preset'], v)} />
                  <Select label="Layout" value={d.layout} options={POPUP_ENUMS.layout} labels={LABELS.layout} onChange={(v) => set(['design', 'layout'], v)} />
                  {d.layout === 'slide-in' && <Select label="Slide-in position" value={d.position} options={POPUP_ENUMS.position} labels={LABELS.position} onChange={(v) => set(['design', 'position'], v)} />}
                  <Select label="Width" value={d.width} options={POPUP_ENUMS.width} labels={LABELS.width} onChange={(v) => set(['design', 'width'], v)} hint="Applies to modals and slide-ins." />
                  <FormField label="Corner radius (px)" type="number" min={0} max={40} value={d.radius} onChange={(e) => set(['design', 'radius'], e.target.value === '' ? '' : Number(e.target.value))} />
                  <Select label="Button style" value={d.buttonStyle} options={POPUP_ENUMS.buttonStyle} labels={{ solid: 'Solid', outline: 'Outline' }} onChange={(v) => set(['design', 'buttonStyle'], v)} />
                  <Select label="Animation" value={d.animation} options={POPUP_ENUMS.animation} labels={LABELS.animation} onChange={(v) => set(['design', 'animation'], v)} hint="Turned off automatically for visitors who prefer reduced motion." />
                </div>
                <p className={ps.sub}>Colours (override the preset)</p>
                <div className={styles.formRow}>
                  <ColorField label="Background" value={d.background} fallback={PRESETS[d.preset].background} onChange={(v) => set(['design', 'background'], v)} />
                  <ColorField label="Text" value={d.text} fallback={PRESETS[d.preset].text} onChange={(v) => set(['design', 'text'], v)} />
                  <ColorField label="Accent (buttons, eyebrow)" value={d.accent} fallback={PRESETS[d.preset].accent} onChange={(v) => set(['design', 'accent'], v)} />
                </div>
                {modalish && (
                  <div className={styles.field}>
                    <label className={styles.label} htmlFor="kp-overlay">Overlay darkness: {d.overlayOpacity}%</label>
                    <div className={ps.range}><input id="kp-overlay" type="range" min={0} max={90} step={5} value={d.overlayOpacity} onChange={(e) => set(['design', 'overlayOpacity'], Number(e.target.value))} /></div>
                  </div>
                )}
                <div className={styles.formRow}>
                  <Select label="Heading font" value={d.fontHeading} options={POPUP_ENUMS.font} labels={LABELS.font} onChange={(v) => set(['design', 'fontHeading'], v)} hint="Brand = Plus Jakarta Sans." />
                  <Select label="Body font" value={d.fontBody} options={POPUP_ENUMS.font} labels={LABELS.font} onChange={(v) => set(['design', 'fontBody'], v)} hint="Brand = Inter." />
                </div>
                <p className={styles.hint}>Preset &ldquo;{LABELS.preset[d.preset]}&rdquo; uses background {colors.background}, text {colors.text}, accent {colors.accent}.</p>
              </>
            )}

            {tab === 'css' && (
              <>
                <p className={styles.hint} style={{ marginBottom: 8 }}>Classes you can style (every rule is automatically limited to this pop-up):</p>
                <div className={ps.classList}>{POPUP_CSS_CLASSES.map((k) => <code key={k}>{k}</code>)}</div>
                <p className={styles.hint} style={{ margin: '8px 0' }}>
                  States: {POPUP_CSS_PSEUDO_CLASSES.join(' ')} &middot; Pseudo-elements: {POPUP_CSS_PSEUDO_ELEMENTS.join(' ')} &middot;
                  Inside <code>.kp-body</code> you can also style: {POPUP_CSS_BODY_ELEMENTS.join(' ')} (e.g. <code>.kp-body a:hover</code>).
                  Combine selectors only with a space or <code>&gt;</code>. Wrap phone styles in <code>@media (max-width: 600px)</code>.
                </p>
                <ul className={styles.hint} style={{ margin: '0 0 8px', paddingLeft: 18 }}>
                  {POPUP_CSS_PROPERTY_GROUPS.map((g) => <li key={g.label}><strong>{g.label}:</strong> {g.props.filter((p) => !/^(border-|outline-|margin-|padding-|text-decoration-|animation-|transition-)/.test(p) || /^(border-radius|outline-offset|text-decoration-thickness)$/.test(p)).join(', ')}{g.label === 'Spacing' ? ` (margins: ${POPUP_CSS_MARGIN_LIMIT}; max-width up to 100%)` : ''}</li>)}
                  <li><strong>Fonts:</strong> only Plus Jakarta Sans, Inter, system-ui, sans-serif, serif. <strong>Images:</strong> <code>url(/media/&lt;image id&gt;)</code> in background only.</li>
                  <li><strong>Never allowed:</strong> {POPUP_CSS_FORBIDDEN_PROPERTIES.slice(0, 22).join(', ')}, custom properties (--x), other at-rules (@import, @font-face&hellip;). Pop-up placement and size come from the Design tab.</li>
                </ul>
                {[...cssWarnings, ...(preview.fatal ? ['Custom CSS was rejected: see the message above.'] : [])].length > 0 && (
                  <div className={ps.notice} role="status"><strong>Notes from the server</strong>
                    <ul>{cssWarnings.map((w) => <li key={w}>{w}</li>)}</ul></div>
                )}
                <FormField as="textarea" className={ps.code} label="Custom CSS" spellCheck={false} value={form.customCss}
                  onChange={(e) => set(['customCss'], e.target.value)}
                  hint="Max 10 KB. Only the classes, states and properties listed above are applied; anything else is removed and explained under the editor." />
                <pre className={styles.diff} aria-label="Scoped CSS that will be used">{preview.css || '/* nothing yet */'}</pre>
              </>
            )}

            {tab === 'rules' && (
              <>
                <div className={styles.formRow}>
                  <Select label="Trigger" value={r.trigger} options={POPUP_ENUMS.trigger} labels={LABELS.trigger} onChange={(v) => set(['rules', 'trigger'], v)} />
                  {r.trigger === 'delay' && <FormField label="Delay (seconds)" type="number" min={0} max={120} value={r.delaySeconds} onChange={(e) => set(['rules', 'delaySeconds'], e.target.value === '' ? '' : Number(e.target.value))} />}
                  {r.trigger === 'scroll' && <FormField label="Scroll depth (%)" type="number" min={5} max={100} value={r.scrollPercent} onChange={(e) => set(['rules', 'scrollPercent'], e.target.value === '' ? '' : Number(e.target.value))} />}
                  <Select label="Devices" value={r.devices} options={POPUP_ENUMS.devices} labels={LABELS.devices} onChange={(v) => set(['rules', 'devices'], v)} hint="Mobile = screens up to 767 px wide." />
                  <Select label="Frequency" value={r.frequency} options={POPUP_ENUMS.frequency} labels={LABELS.frequency} onChange={(v) => set(['rules', 'frequency'], v)} />
                  {r.frequency === 'days' && <FormField label="Days between showings" type="number" min={1} max={365} value={r.frequencyDays} onChange={(e) => set(['rules', 'frequencyDays'], e.target.value === '' ? '' : Number(e.target.value))} />}
                </div>
                <div className={styles.formRow}>
                  <FormField as="textarea" label="Show on pages" rows={4} placeholder={'(empty = every page)\n/\n/products/*'} value={form.includeText} onChange={(e) => set(['includeText'], e.target.value)}
                    hint="One path per line. * matches anything: /products/* covers every product page. / is the home page only." />
                  <FormField as="textarea" label="Never show on pages" rows={4} placeholder={'/contact\n/investors/*'} value={form.excludeText} onChange={(e) => set(['excludeText'], e.target.value)}
                    hint="Wins over “Show on pages”. Pop-ups never appear in /admin, /login or previews." />
                </div>
                <div className={styles.formRow}>
                  <FormField label="Start (India time)" type="text" placeholder="2026-11-01 09:30" value={form.startText} onChange={(e) => set(['startText'], e.target.value)}
                    error={form.startText.trim() && !istTextToIso(form.startText) ? 'Use YYYY-MM-DD HH:mm' : ''} hint="Format YYYY-MM-DD HH:mm. Empty = live as soon as published." />
                  <FormField label="End (India time)" type="text" placeholder="2026-11-30 23:59" value={form.endText} onChange={(e) => set(['endText'], e.target.value)}
                    error={form.endText.trim() && !istTextToIso(form.endText) ? 'Use YYYY-MM-DD HH:mm' : ''} hint="Empty = no end date." />
                </div>
                <FormField label="Priority" type="number" min={0} max={1000} value={form.priority} onChange={(e) => set(['priority'], e.target.value)}
                  hint="When several pop-ups match a page, only the highest priority is shown." />
              </>
            )}
          </div>
        </div>

        <div className={ps.previewCol}>
          <div className={ps.previewBar}>
            <strong>Live preview</strong>
            <div className={ps.toggle} role="group" aria-label="Preview size">
              <button type="button" aria-pressed={viewport === 'desktop'} onClick={() => setViewport('desktop')}>Desktop</button>
              <button type="button" aria-pressed={viewport === 'mobile'} onClick={() => setViewport('mobile')}>Mobile</button>
            </div>
          </div>
          <div className={ps.frameWrap}>
            <div className={`${ps.frame} ${viewport === 'mobile' ? ps.frameMobile : ''}`} data-testid="popup-preview">
              <div className={ps.fakePage} aria-hidden="true">
                <div className={ps.fakeNav} /><div className={ps.fakeHero} />
                {[90, 100, 70, 95, 60].map((w, i) => <div key={i} className={ps.fakeLine} style={{ width: `${w}%` }} />)}
              </div>
              <Popup key={`${d.layout}-${viewport}-${d.animation}`} popup={previewPopup} viewport={viewport} preview />
            </div>
          </div>
          <p className={styles.hint} style={{ marginTop: 8 }}>Preview only. Triggers, schedule and frequency apply on the live site.</p>
        </div>
      </div>
    </>
  );
}
