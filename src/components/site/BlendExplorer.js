'use client';
import { useState } from 'react';
import s from './platform.module.css';

/** Blend explorer widget: range 5-100 step 5. ghg = round(blend * 0.86); engine note from the design. */
export default function BlendExplorer() {
  const [blend, setBlend] = useState(20);
  const ghg = Math.round(blend * 0.86);
  const ok = blend <= 20;
  return (
    <div className={s.blendGrid}>
      <div>
        <div className={s.blendBig} aria-hidden="true">B{blend}</div>
        <input
          className={s.range}
          type="range" min="5" max="100" step="5"
          value={blend}
          onChange={(e) => setBlend(+e.target.value)}
          aria-label="Biodiesel blend percentage"
          aria-valuetext={`B${blend}`}
        />
        <div className={s.rangeTicks} aria-hidden="true"><span>B5</span><span>B20</span><span>B50</span><span>B100</span></div>
      </div>
      <div className={s.blendSide} aria-live="polite">
        <div>
          <div className={s.mix}>
            <div className={s.mixFill} style={{ width: `${blend}%` }} />
            <div className={s.mixRest} />
          </div>
          <div className={s.mixLabels}><span>Biodiesel {blend}%</span><span>Petroleum diesel {100 - blend}%</span></div>
        </div>
        <div className={s.statPair}>
          <div className={s.statBox}>
            <div className={s.statBoxLabel}>Est. GHG reduction</div>
            <div className={s.statBoxNum}>{ghg}%</div>
          </div>
          <div className={s.statBox}>
            <div className={s.statBoxLabel}>Engine</div>
            <div className={s.statBoxEngine} style={{ color: ok ? '#5FD1A6' : '#F28B30' }}>{ok ? 'No engine modification needed' : 'Confirm with engine OEM'}</div>
          </div>
        </div>
        <div className={s.blendNote}>Indicative linear estimate from the 86% B100 reduction vs. petroleum diesel. Not a certified figure.</div>
      </div>
    </div>
  );
}
