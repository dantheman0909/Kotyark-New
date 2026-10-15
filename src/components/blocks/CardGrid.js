import ScrollReveal from '@/components/ScrollReveal';
import { SmartLink, resolveImage } from './shared';

function Card({ item }) {
  const img = resolveImage(item.image);
  const body = (
    <>
      {img && <img className="cms-card-image" src={img} alt={item.title || ''} loading="lazy" />}
      {item.icon && !img && <div className="feature-icon" aria-hidden="true" style={{ fontSize: '26px' }}>{item.icon}</div>}
      <h4>{item.title}</h4>
      {item.body && <p>{item.body}</p>}
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
        {(props.heading || props.intro) && (
          <ScrollReveal>
            <div className="section-header">
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
