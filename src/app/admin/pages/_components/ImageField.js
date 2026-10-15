'use client';
import { imageSrc } from '@/lib/blocks/schemas';

// Minimal image input: a media id (uuid) or a URL/path. Same props as the shared MediaPicker
// (value, onChange(idOrUrl)) so it can be swapped for src/components/admin/MediaPicker.js later:
//   import MediaPicker from '@/components/admin/MediaPicker';  ->  <MediaPicker value={value} onChange={onChange} />
export default function ImageField({ value, onChange, id, placeholder = 'Media id, /images/... path or https:// URL' }) {
  const src = imageSrc(value);
  const previewable = src && /^(\/(?!\/)|https:\/\/)/.test(src);
  return (
    <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
      {previewable && (
        <img src={src} alt="" style={{ width: 64, height: 64, objectFit: 'cover', borderRadius: 8, border: '1px solid #d9e2dc', flexShrink: 0 }} />
      )}
      <div style={{ flex: 1, minWidth: 0 }}>
        <input id={id} type="text" value={value || ''} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} />
        {value && <button type="button" className="cmsa-btn sm" style={{ marginTop: 6 }} onClick={() => onChange('')}>Clear</button>}
      </div>
    </div>
  );
}
