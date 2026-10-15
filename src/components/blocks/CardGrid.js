import ScrollReveal from '@/components/ScrollReveal';
import { SmartLink, resolveImage } from './shared';

function Card({ item }) {
  const img = resolveImage(item.image);
  const tags = (item.tags || []).filter(Boolean);
  const body = (
    <>
      {img && <img className="cms-card-image" src={img} alt={item.imageAlt || item.title || ''} loading="lazy" />}
      {item.icon && !img && <div className="feature-icon" aria-hidden="true" style={{ fontSize: '26px' }}>{item.icon}</div>}
      <h4>{item.title}</h4>
      {item.role && <p style={{ fontSize: '14px', fontWeight: 600, color: 'var(--color-accent)', marginBottom: '8px' }}>{item.role}</p>}
      {item.body && <p>{item.body}</p>}
      {tags.length > 0 && (
        <ul style={{ listStyle: 'none', padding: 0, margin: '16px 0 0 0', display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
          {tags.map((tag, i) => (
            <li key={i} style={{ fontSize: '12px', fontWeight: 600, padding: '4px 12px', background: 'var(--color-bg-section-alt)', borderRadius: 'var(--radius-full)', color: 'var(--color-primary)' }}>{tag}</li>
          ))}
        </ul>
      )}
      {item.href && item.linkLabel && <span className="product-card-link" style={{ marginTop: '16px' }}>{item.linkLabel} →</span>}
    </>
  );
  return (
    <div className="feature-card">
      {item.href ? <SmartLink href={item.href} className="cms-card-link">{body}</SmartLink> : body}
    </div>
  );
}

export default function CardGrid({ props }) {
  const cols = ['2', '3', '4'].includes(String(props.columns)) ? String(props.columns) : '3';
  return (
    <section className="section">
      <div className="container">
        {(props.heading || props.intro || props.eyebrow) && (
          <ScrollReveal>
            <div className="section-header">
              {props.eyebrow && <span className="section-tag">{props.eyebrow}</span>}
              {props.heading && <h2>{props.heading}</h2>}
              {props.intro && <p>{props.intro}</p>}
            </div>
          </ScrollReveal>
        )}
        <ScrollReveal>
          <div className={`features-grid cms-cols-${cols}`}>
            {(props.items || []).map((item, i) => <Card key={i} item={item} />)}
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}
