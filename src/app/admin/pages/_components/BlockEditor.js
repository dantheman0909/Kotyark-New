'use client';
import { useEffect, useState } from 'react';
import { BLOCKS, BLOCK_TYPES, defaultProps } from '@/lib/blocks/schemas';
import FieldInput, { uid, withKeys } from './FieldInput';

function summary(block) {
  const p = block.props || {};
  return p.heading || p.title || p.eyebrow || p.question || (Array.isArray(p.items) && p.items[0] && (p.items[0].title || p.items[0].label || p.items[0].question)) || '';
}

function BlockCard({ block, index, count, open, onToggle, onChange, onMove, onDuplicate, onRemove, errors, folders, editorVersion }) {
  const def = BLOCKS[block.type];
  const hasError = errors && errors.length > 0;
  return (
    <div className={`cmsa-block${hasError ? ' has-error' : ''}`} id={`block-${block.id}`}>
      <div className="cmsa-block-head" onClick={onToggle} role="button" tabIndex={0} aria-expanded={open}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onToggle(); } }}>
        <span aria-hidden="true">{open ? '▾' : '▸'}</span>
        <span className="type">{index + 1}. {def ? def.label : `Unknown (${block.type})`}</span>
        <span className="sum">{summary(block)}</span>
        {hasError && <span className="cmsa-badge draft">{errors.length} issue{errors.length > 1 ? 's' : ''}</span>}
        <span className="cmsa-actions" onClick={(e) => e.stopPropagation()}>
          <button type="button" className="cmsa-btn sm icon" onClick={() => onMove(-1)} disabled={index === 0} aria-label="Move block up">↑</button>
          <button type="button" className="cmsa-btn sm icon" onClick={() => onMove(1)} disabled={index === count - 1} aria-label="Move block down">↓</button>
          <button type="button" className="cmsa-btn sm" onClick={onDuplicate}>Duplicate</button>
          <button type="button" className="cmsa-btn sm danger" onClick={onRemove}>Delete</button>
        </span>
      </div>
      {open && (
        <div className="cmsa-block-body">
          {hasError && (
            <div className="cmsa-alert error"><strong>Fix before saving:</strong>
              <ul>{errors.map((m, i) => <li key={i}>{m}</li>)}</ul>
            </div>
          )}
          {!def && <div className="cmsa-alert error">This block type is not supported and will not be shown. Delete it.</div>}
          {def && Object.entries(def.fields).map(([k, f]) => (
            <FieldInput key={k} field={f} fieldKey={k} idPrefix={`b-${block.id}`} folders={folders}
              editorKey={`${block.id}-${editorVersion}-${k}`}
              value={block.props?.[k]} onChange={(v) => onChange({ ...block, props: { ...block.props, [k]: v } })} />
          ))}
        </div>
      )}
    </div>
  );
}

/** Ordered list of blocks with add / reorder / duplicate / delete and per-block forms. */
export default function BlockEditor({ blocks, setBlocks, errorsById, folders, editorVersion }) {
  const [openIds, setOpenIds] = useState(() => new Set());
  // Open every block the server reported problems for.
  useEffect(() => {
    const ids = Object.keys(errorsById || {});
    if (ids.length) setOpenIds((s) => new Set([...s, ...ids]));
  }, [errorsById]);
  const toggle = (id) => setOpenIds((s) => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });

  const add = (type) => {
    const block = { id: uid(), type, props: withKeys(BLOCKS[type].fields, defaultProps(type)) };
    setBlocks([...blocks, block]);
    setOpenIds((s) => new Set(s).add(block.id));
    setTimeout(() => document.getElementById(`block-${block.id}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 50);
  };
  const move = (i, d) => {
    const j = i + d;
    if (j < 0 || j >= blocks.length) return;
    const next = [...blocks];
    [next[i], next[j]] = [next[j], next[i]];
    setBlocks(next);
  };
  const duplicate = (i) => {
    const copy = { ...structuredClone(blocks[i]), id: uid() };
    copy.props = withKeys(BLOCKS[copy.type]?.fields || {}, stripKeys(copy.props));
    const next = [...blocks];
    next.splice(i + 1, 0, copy);
    setBlocks(next);
    setOpenIds((s) => new Set(s).add(copy.id));
  };
  const remove = (i) => {
    if (!window.confirm('Delete this block?')) return;
    setBlocks(blocks.filter((_, k) => k !== i));
  };

  return (
    <div>
      {blocks.length === 0 && <p className="cmsa-hint" style={{ marginBottom: 12 }}>No blocks yet. Add one below.</p>}
      {blocks.map((b, i) => (
        <BlockCard key={b.id} block={b} index={i} count={blocks.length} open={openIds.has(b.id)} folders={folders}
          editorVersion={editorVersion} errors={errorsById[b.id]}
          onToggle={() => toggle(b.id)} onMove={(d) => move(i, d)} onDuplicate={() => duplicate(i)} onRemove={() => remove(i)}
          onChange={(nb) => setBlocks(blocks.map((x, k) => (k === i ? nb : x)))} />
      ))}
      <div className="cmsa-card" style={{ marginTop: 16, marginBottom: 0 }}>
        <h3 style={{ marginBottom: 8 }}>Add a block</h3>
        <div className="cmsa-palette">
          {BLOCK_TYPES.map((t) => (
            <button key={t} type="button" className="cmsa-btn sm" onClick={() => add(t)}>+ {BLOCKS[t].label}</button>
          ))}
        </div>
      </div>
    </div>
  );
}

function stripKeys(v) {
  if (Array.isArray(v)) return v.map(stripKeys);
  if (v && typeof v === 'object') return Object.fromEntries(Object.entries(v).filter(([k]) => k !== '__k').map(([k, x]) => [k, stripKeys(x)]));
  return v;
}
