// Shared renderer for the file-based social images (opengraph-image.js / twitter-image.js), 1200x630.
// Background is public/images/og-bg.jpg: hero-forest.jpg pre-blurred and tinted #127B62 (small file => small PNG).
// Design language: ink #0D1411, forest photograph tinted green, white logo, orange mono eyebrow, heavy headline.
import { ImageResponse } from 'next/og';
import { readFile } from 'node:fs/promises';
import path from 'node:path';

export const OG_SIZE = { width: 1200, height: 630 };
export const OG_CONTENT_TYPE = 'image/png';

const INK = '#0D1411';
const PAPER = '#F2EFE6';
const ORANGE = '#F28B30';

let assets; // read once per server process
async function loadAssets() {
  if (!assets) {
    const dir = path.join(process.cwd(), 'public', 'images');
    const [logo, forest] = await Promise.all([readFile(path.join(dir, 'kil-logo-white-trim.png')), readFile(path.join(dir, 'og-bg.jpg'))]);
    assets = { logo: `data:image/png;base64,${logo.toString('base64')}`, forest: `data:image/jpeg;base64,${forest.toString('base64')}` };
  }
  return assets;
}

/** @param {{eyebrow:string, headline:string, sub?:string}} o */
export async function renderOg({ eyebrow, headline, sub }) {
  const { logo, forest } = await loadAssets();
  const long = headline.length > 34;
  return new ImageResponse(
    (
      <div style={{ width: '100%', height: '100%', display: 'flex', position: 'relative', background: INK, color: PAPER, fontFamily: 'sans-serif' }}>
        <img src={forest} width={1200} height={630} alt="" style={{ position: 'absolute', top: 0, left: 0, width: 1200, height: 630, objectFit: 'cover' }} />
        {/* ink gradient so the headline stays legible */}
        <div style={{ position: 'absolute', top: 0, left: 0, width: 1200, height: 630, background: 'linear-gradient(90deg, rgba(13,20,17,0.92) 0%, rgba(13,20,17,0.6) 55%, rgba(13,20,17,0.15) 100%)' }} />
        <div style={{ position: 'absolute', left: 0, bottom: 0, width: 1200, height: 10, background: ORANGE }} />
        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', width: '100%', height: '100%', padding: '56px 72px 64px' }}>
          <img src={logo} width={188} height={118} alt="" />
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', fontFamily: 'monospace', fontSize: 26, letterSpacing: 4, textTransform: 'uppercase', color: ORANGE, marginBottom: 22 }}>{eyebrow}</div>
            <div style={{ display: 'flex', fontSize: long ? 76 : 92, fontWeight: 800, lineHeight: 1.02, letterSpacing: -3, maxWidth: 980 }}>{headline}</div>
            {sub ? <div style={{ display: 'flex', fontSize: 30, color: '#C9D4CE', marginTop: 26, maxWidth: 900 }}>{sub}</div> : null}
          </div>
        </div>
      </div>
    ),
    { ...OG_SIZE }
  );
}
