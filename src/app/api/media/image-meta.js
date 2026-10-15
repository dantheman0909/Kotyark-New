// Detect image type from magic bytes and read dimensions from the header. No dependencies.
// SVG is intentionally unsupported (script-bearing).

export const MAX_BYTES = 10 * 1024 * 1024;
export const EXT_BY_MIME = { 'image/png': 'png', 'image/jpeg': 'jpg', 'image/webp': 'webp', 'image/gif': 'gif' };

export function detectMime(b) {
  if (b.length >= 8 && b.readUInt32BE(0) === 0x89504e47 && b.readUInt32BE(4) === 0x0d0a1a0a) return 'image/png';
  if (b.length >= 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return 'image/jpeg';
  if (b.length >= 6 && (b.toString('latin1', 0, 6) === 'GIF87a' || b.toString('latin1', 0, 6) === 'GIF89a')) return 'image/gif';
  if (b.length >= 12 && b.toString('latin1', 0, 4) === 'RIFF' && b.toString('latin1', 8, 12) === 'WEBP') return 'image/webp';
  return null;
}

function jpegSize(b) {
  let i = 2;
  while (i + 9 < b.length) {
    if (b[i] !== 0xff) { i++; continue; }
    const marker = b[i + 1];
    if (marker === 0xff) { i++; continue; }
    if (marker === 0xd8 || marker === 0x01 || (marker >= 0xd0 && marker <= 0xd7)) { i += 2; continue; }
    const len = b.readUInt16BE(i + 2);
    // SOF0..SOF15 except DHT(C4), JPG(C8), DAC(CC)
    if (marker >= 0xc0 && marker <= 0xcf && ![0xc4, 0xc8, 0xcc].includes(marker)) {
      return { height: b.readUInt16BE(i + 5), width: b.readUInt16BE(i + 7) };
    }
    if (len < 2) break;
    i += 2 + len;
  }
  return null;
}

function webpSize(b) {
  const chunk = b.toString('latin1', 12, 16);
  if (chunk === 'VP8 ' && b.length >= 30) return { width: b.readUInt16LE(26) & 0x3fff, height: b.readUInt16LE(28) & 0x3fff };
  if (chunk === 'VP8L' && b.length >= 25) {
    const bits = b.readUInt32LE(21);
    return { width: (bits & 0x3fff) + 1, height: ((bits >> 14) & 0x3fff) + 1 };
  }
  if (chunk === 'VP8X' && b.length >= 30) return { width: b.readUIntLE(24, 3) + 1, height: b.readUIntLE(27, 3) + 1 };
  return null;
}

/** @returns {{width:number,height:number}|null} */
export function imageSize(b, mime) {
  try {
    let s = null;
    if (mime === 'image/png' && b.length >= 24) s = { width: b.readUInt32BE(16), height: b.readUInt32BE(20) };
    else if (mime === 'image/gif' && b.length >= 10) s = { width: b.readUInt16LE(6), height: b.readUInt16LE(8) };
    else if (mime === 'image/jpeg') s = jpegSize(b);
    else if (mime === 'image/webp') s = webpSize(b);
    return s && s.width > 0 && s.height > 0 && s.width < 100000 && s.height < 100000 ? s : null;
  } catch { return null; }
}

/** Safe storage filename: basename only, [A-Za-z0-9._-], extension forced to match the detected type. */
export function safeFilename(original, mime) {
  const base = String(original || 'image').split(/[\\/]/).pop().replace(/\.[^.]*$/, '');
  const clean = base.normalize('NFKD').replace(/[^\w.-]+/g, '-').replace(/-+/g, '-').replace(/^[-.]+|[-.]+$/g, '').slice(0, 80);
  return `${clean || 'image'}.${EXT_BY_MIME[mime]}`;
}

export const MEDIA_COLUMNS = "id, filename, alt, mime, size, width, height, created_at";
export const mediaShape = (r) => ({ ...r, url: `/media/${r.id}` });
