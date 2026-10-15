import ScrollReveal from '@/components/ScrollReveal';
import { sanitizeRichText } from '@/lib/sanitize';
import { SmartLink, resolveImage } from './shared';

export default function ImageText({ props }) {
  const img = resolveImage(props.image);
  const cta = (props.cta || [])[0];
  // .split-reverse flips the columns (image first); default has text first, image second.
  return (
    <section className="section">
      <div className="container">
        <ScrollReveal>
          <div className={`split${props.imagePosition === 'left' ? ' split-reverse' : ''}`}>
            <div style={props.imagePosition === 'left' ? { direction: 'ltr' } : undefined}>
              {props.heading && <h2 style={{ marginBottom: '16px' }}>{props.heading}</h2>}
              <div className="cms-rich" dangerouslySetInnerHTML={{ __html: sanitizeRichText(props.html) }} />
              {cta?.label && cta?.href && (
                <SmartLink href={cta.href} className="btn btn-secondary" style={{ marginTop: '20px' }}>{cta.label}</SmartLink>
              )}
            </div>
            {img && (
              <div className="split-image" style={{ direction: 'ltr' }}>
                <img src={img} alt={props.imageAlt || ''} loading="lazy" style={{ width: '100%', height: 'auto' }} />
              </div>
            )}
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}
