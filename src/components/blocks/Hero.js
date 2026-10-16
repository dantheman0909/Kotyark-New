import { SmartLink, resolveImage } from './shared';

function Actions({ ctas, className, light }) {
  const list = (ctas || []).filter(c => c?.label && c?.href);
  if (!list.length) return null;
  return (
    <div className={className}>
      {list.map((c, i) => (
        <SmartLink key={i} href={c.href}
          className={`btn ${c.style === 'outline' ? (light ? 'btn-outline-light' : 'btn-secondary') : 'btn-primary'}${light ? ' btn-lg' : ''}`}>
          {c.label}
        </SmartLink>
      ))}
    </div>
  );
}

export default function Hero({ props }) {
  const img = resolveImage(props.image);
  if (props.variant === 'full') {
    return (
      <section className="hero">
        {img && <div className="hero-bg" style={{ backgroundImage: `url(${img})` }} role="img" aria-label={props.imageAlt || props.heading || ''} />}
        <div className="hero-overlay" />
        <div className="hero-content">
          {props.eyebrow && <div className="hero-badge">{props.eyebrow}</div>}
          <h1>{props.heading}</h1>
          {props.subheading && <p className="hero-subtitle">{props.subheading}</p>}
          <Actions ctas={props.ctas} className="hero-actions" light />
        </div>
      </section>
    );
  }
  const style = img
    ? { background: `linear-gradient(135deg, rgba(7,26,16,0.88) 0%, rgba(13,59,36,0.78) 100%), url(${img}) center / cover no-repeat` }
    : undefined;
  return (
    <section className="page-hero" style={style}>
      <div className="container">
        {props.eyebrow && <span className="cms-hero-eyebrow">{props.eyebrow}</span>}
        <h1>{props.heading}</h1>
        {props.subheading && <p>{props.subheading}</p>}
        <Actions ctas={props.ctas} className="hero-actions cms-hero-actions" light />
      </div>
    </section>
  );
}
