'use client';
import { useEffect, useRef } from 'react';
import s from './home.module.css';

const N = { sirohi: [24.88, 72.86], anand: [22.56, 72.95], jaipur: [26.91, 75.79], delhi: [28.61, 77.21], udaipur: [24.58, 73.71], kandla: [23.03, 70.22], ahmedabad: [23.02, 72.57], mumbai: [19.08, 72.88], pune: [18.52, 73.86], surat: [21.17, 72.83], indore: [22.72, 75.86] };
const L = { jaipur: 'Jaipur', delhi: 'Delhi NCR', udaipur: 'Udaipur', kandla: 'Kandla Port', ahmedabad: 'Ahmedabad', mumbai: 'Mumbai', pune: 'Pune', surat: 'Surat', indore: 'Indore' };
const ROUTES = [['sirohi', 'jaipur'], ['sirohi', 'delhi'], ['sirohi', 'udaipur'], ['sirohi', 'kandla'], ['sirohi', 'ahmedabad'], ['anand', 'mumbai'], ['anand', 'pune'], ['anand', 'surat'], ['anand', 'indore'], ['anand', 'ahmedabad'], ['sirohi', 'anand']];

const SIROHI_CITIES = ['Jaipur', 'Delhi NCR', 'Udaipur', 'Kandla Port', 'Ahmedabad'];
const ANAND_CITIES = ['Mumbai', 'Pune', 'Surat', 'Indore', 'Ahmedabad'];

/** Port of drawNet() from the design. t is a millisecond clock. */
function drawNet(c, t, fonts) {
  const dpr = window.devicePixelRatio || 1;
  const w = c.clientWidth, h = c.clientHeight;
  if (!w || !h) return;
  if (c.width !== Math.round(w * dpr) || c.height !== Math.round(h * dpr)) { c.width = Math.round(w * dpr); c.height = Math.round(h * dpr); }
  const x = c.getContext('2d');
  x.setTransform(dpr, 0, 0, dpr, 0, 0);
  x.clearRect(0, 0, w, h);
  const lon0 = 68.6, lon1 = 78.6, lat0 = 17.6, lat1 = 29.4, pad = 56;
  const sc = Math.min((w - pad * 2) / (lon1 - lon0), (h - pad * 2 - 30) / (lat1 - lat0));
  const ox = (w - sc * (lon1 - lon0)) / 2, oy = (h - 30 - sc * (lat1 - lat0)) / 2;
  const P = (lat, lon) => [ox + (lon - lon0) * sc, oy + (lat1 - lat) * sc];
  for (let gx = 12; gx < w; gx += 20) for (let gy = 12; gy < h; gy += 20) {
    const a = 0.05 + 0.05 * Math.sin(gx * 0.018 + gy * 0.012 + t * 0.0007);
    x.fillStyle = `rgba(242,239,230,${a})`; x.fillRect(gx, gy, 1.5, 1.5);
  }
  ROUTES.forEach(([a, b], ri) => {
    const A = P(...N[a]), B = P(...N[b]);
    const mx = (A[0] + B[0]) / 2, my = (A[1] + B[1]) / 2;
    const dx = B[0] - A[0], dy = B[1] - A[1];
    const C = [mx - dy * 0.2, my + dx * 0.2];
    const q = (u) => [(1 - u) * (1 - u) * A[0] + 2 * (1 - u) * u * C[0] + u * u * B[0], (1 - u) * (1 - u) * A[1] + 2 * (1 - u) * u * C[1] + u * u * B[1]];
    const core = b === 'anand';
    x.beginPath(); x.moveTo(A[0], A[1]); x.quadraticCurveTo(C[0], C[1], B[0], B[1]);
    x.strokeStyle = core ? 'rgba(242,139,48,.45)' : 'rgba(242,239,230,.13)'; x.lineWidth = core ? 1.4 : 1; x.setLineDash(core ? [4, 5] : []); x.stroke(); x.setLineDash([]);
    for (let k = 0; k < 3; k++) {
      const u0 = ((t * 0.00011 * (1 + (ri % 3) * 0.25)) + k / 3 + ri * 0.13) % 1;
      for (let tr = 0; tr < 7; tr++) {
        const u = u0 - tr * 0.012;
        if (u < 0) continue;
        const [px, py] = q(u);
        x.fillStyle = `rgba(242,139,48,${(1 - tr / 7) * 0.9})`; x.beginPath(); x.arc(px, py, 2.2 - tr * 0.22, 0, Math.PI * 2); x.fill();
      }
    }
  });
  x.font = `500 11px ${fonts.mono}`; x.textBaseline = 'middle';
  Object.keys(L).forEach((k) => {
    const [px, py] = P(...N[k]);
    x.fillStyle = 'rgba(242,239,230,.85)'; x.beginPath(); x.arc(px, py, 3, 0, Math.PI * 2); x.fill();
    x.fillStyle = 'rgba(201,212,206,.8)'; x.fillText(L[k].toUpperCase(), px + 9, py);
  });
  [['sirohi', 'SIROHI · PLANT I'], ['anand', 'ANAND · PLANT II']].forEach(([k, lab], i) => {
    const [px, py] = P(...N[k]);
    const ph = ((t + i * 900) % 2200) / 2200;
    x.strokeStyle = `rgba(242,139,48,${0.7 * (1 - ph)})`; x.lineWidth = 1.5; x.beginPath(); x.arc(px, py, 7 + ph * 26, 0, Math.PI * 2); x.stroke();
    x.fillStyle = '#F28B30'; x.beginPath(); x.arc(px, py, 6, 0, Math.PI * 2); x.fill();
    x.font = `700 12px ${fonts.sans}`; x.fillStyle = '#F2EFE6'; x.fillText(lab, px - 14 - x.measureText(lab).width, py);
    x.font = `500 11px ${fonts.mono}`;
  });
}

/** Footprint canvas: animates only while on screen; one static frame under reduced motion. */
export default function NetworkMap() {
  const ref = useRef(null);
  useEffect(() => {
    const c = ref.current;
    if (!c) return undefined;
    const cs = getComputedStyle(c);
    const fonts = {
      mono: (cs.getPropertyValue('--kd-mono') || '').trim() || "'JetBrains Mono', monospace",
      sans: (cs.getPropertyValue('--kd-font') || '').trim() || "'Archivo', sans-serif",
    };
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    let visible = false;
    let raf = 0;
    const frame = (t) => {
      try { drawNet(c, reduce ? 4000 : t, fonts); } catch { /* canvas unavailable */ }
      if (!reduce && visible) raf = requestAnimationFrame(frame);
    };
    const start = () => { if (!raf) raf = requestAnimationFrame((t) => { raf = 0; frame(t); }); };
    const io = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting;
      if (visible) { if (reduce) frame(0); else start(); } else if (raf) { cancelAnimationFrame(raf); raf = 0; }
    }, { threshold: 0 });
    io.observe(c);
    let ro;
    if (reduce) {
      ro = new ResizeObserver(() => { try { drawNet(c, 4000, fonts); } catch { /* ignore */ } });
      ro.observe(c);
      document.fonts?.ready?.then(() => { try { drawNet(c, 4000, fonts); } catch { /* ignore */ } });
    }
    return () => { io.disconnect(); ro?.disconnect(); if (raf) cancelAnimationFrame(raf); };
  }, []);

  return (
    <div className={s.mapPanel} data-reveal="1">
      <canvas
        ref={ref}
        className={s.canvas}
        role="img"
        aria-label="Map of western India. Plant I at Sirohi, Rajasthan and Plant II at Anand, Gujarat, with illustrative distribution routes to nearby cities."
      />
      <div className={s.mapLegend} aria-hidden="true">
        <span className={s.mapKey}><span className={s.mapDot} />Plant</span>
        <span>Illustrative distribution reach</span>
      </div>
      <div className="kd-sr">
        <p>Illustrative distribution reach from our two plants.</p>
        <ul>
          <li>Plant I, Sirohi, Rajasthan: {SIROHI_CITIES.join(', ')}, and Plant II at Anand.</li>
          <li>Plant II, Anand, Gujarat: {ANAND_CITIES.join(', ')}.</li>
        </ul>
      </div>
    </div>
  );
}
