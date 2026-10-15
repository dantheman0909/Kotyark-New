'use client';
import ImageField from './ImageField';
import RichTextEditor from './RichTextEditor';

/** Default value for a field definition (mirrors defaultProps() in src/lib/blocks/schemas.js, for list items). */
export function fieldDefault(f) {
  if (f.kind === 'list') return [];
  return f.default ?? (f.kind === 'boolean' ? false : f.kind === 'number' ? 0 : '');
}
export const itemDefaults = (fields) => Object.fromEntries(Object.entries(fields).map(([k, f]) => [k, fieldDefault(f)]));

export const uid = () => (typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(16).slice(2)}`);

/** Give every list item a client-only stable key (__k) so reordering keeps each item's editor state. The server strips it. */
export function withKeys(fields, props) {
  const out = { ...props };
  for (const [k, f] of Object.entries(fields)) {
    if (f.kind === 'list') out[k] = (Array.isArray(out[k]) ? out[k] : []).map((item) => ({ ...withKeys(f.fields, item), __k: item.__k || uid() }));
  }
  return out;
}

function Label({ htmlFor, field }) {
  return (
    <label className="cmsa-label" htmlFor={htmlFor}>
      {field.label}{field.required && <span className="req"> *</span>}
    </label>
  );
}

function ListField({ field, value, onChange, folders, idPrefix, editorKey }) {
  const items = Array.isArray(value) ? value : [];
  const canAdd = !field.max || items.length < field.max;
  const set = (next) => onChange(next);
  const move = (i, d) => {
    const j = i + d;
    if (j < 0 || j >= items.length) return;
    const next = [...items];
    [next[i], next[j]] = [next[j], next[i]];
    set(next);
  };
  return (
    <div>
      {items.map((item, i) => (
        <div className="cmsa-list-item" key={item.__k || i}>
          <div className="cmsa-list-item-head">
            <span>{field.label} #{i + 1}</span>
            <span className="cmsa-actions">
              <button type="button" className="cmsa-btn sm icon" onClick={() => move(i, -1)} disabled={i === 0} aria-label="Move up">↑</button>
              <button type="button" className="cmsa-btn sm icon" onClick={() => move(i, 1)} disabled={i === items.length - 1} aria-label="Move down">↓</button>
              <button type="button" className="cmsa-btn sm danger" onClick={() => set(items.filter((_, k) => k !== i))}
                disabled={!!field.min && items.length <= field.min}>Remove</button>
            </span>
          </div>
          {Object.entries(field.fields).map(([k, sub]) => (
            <FieldInput key={k} field={sub} folders={folders} idPrefix={`${idPrefix}-${i}`} fieldKey={k} editorKey={`${editorKey}-${item.__k || i}`}
              value={item[k]} onChange={(v) => set(items.map((it, idx) => (idx === i ? { ...it, [k]: v } : it)))} />
          ))}
        </div>
      ))}
      <button type="button" className="cmsa-btn sm" disabled={!canAdd}
        onClick={() => set([...items, { ...itemDefaults(field.fields), __k: uid() }])}>+ Add {field.label.toLowerCase().replace(/s$/, '')}</button>
      <div className="cmsa-hint">
        {field.min ? `At least ${field.min}. ` : ''}{field.max ? `At most ${field.max}. ` : ''}
      </div>
    </div>
  );
}

/** One form control driven by a BLOCKS field definition. */
export default function FieldInput({ field, value, onChange, folders = [], idPrefix = 'f', fieldKey = '', editorKey = '' }) {
  const id = `${idPrefix}-${fieldKey || field.label}`.replace(/\s+/g, '-');
  let control;
  switch (field.kind) {
    case 'textarea':
      control = <textarea id={id} value={value ?? ''} onChange={(e) => onChange(e.target.value)} />;
      break;
    case 'select':
      control = (
        <select id={id} value={value ?? ''} onChange={(e) => onChange(e.target.value)}>
          {field.options.map((o) => <option key={o} value={o}>{o}</option>)}
        </select>
      );
      break;
    case 'boolean':
      return (
        <div className="cmsa-field">
          <label className="cmsa-check"><input type="checkbox" checked={!!value} onChange={(e) => onChange(e.target.checked)} /> {field.label}</label>
        </div>
      );
    case 'number':
      control = <input id={id} type="number" value={value ?? 0} onChange={(e) => onChange(e.target.value === '' ? 0 : Number(e.target.value))} />;
      break;
    case 'folder':
      control = (
        <select id={id} value={value ?? ''} onChange={(e) => onChange(e.target.value)}>
          <option value="">Select a folder…</option>
          {folders.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}
          {value && !folders.some((f) => String(f.id) === String(value)) && <option value={value}>{value} (unknown)</option>}
        </select>
      );
      break;
    case 'image':
      control = <ImageField id={id} value={value} onChange={onChange} />;
      break;
    case 'richtext':
      control = <RichTextEditor key={editorKey} value={value} onChange={onChange} />;
      break;
    case 'list':
      control = <ListField field={field} value={value} onChange={onChange} folders={folders} idPrefix={id} editorKey={editorKey} />;
      break;
    case 'url':
      control = <input id={id} type="text" inputMode="url" value={value ?? ''} onChange={(e) => onChange(e.target.value)} placeholder="/page, https://…, mailto:, tel:" />;
      break;
    default:
      control = <input id={id} type="text" value={value ?? ''} onChange={(e) => onChange(e.target.value)} />;
  }
  return (
    <div className="cmsa-field">
      <Label htmlFor={id} field={field} />
      {control}
    </div>
  );
}
