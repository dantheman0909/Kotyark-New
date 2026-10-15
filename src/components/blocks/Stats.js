import ScrollReveal from '@/components/ScrollReveal';

export default function Stats({ props }) {
  const items = props.items || [];
  const cols = Math.min(Math.max(items.length, 1), 4);
  return (
    <section className="section section-alt">
      <div className="container">
        {(props.heading || props.eyebrow) && (
          <ScrollReveal>
            <div className="section-header">
              {props.eyebrow && <span className="section-tag">{props.eyebrow}</span>}
              {props.heading && <h2>{props.heading}</h2>}
            </div>
          </ScrollReveal>
        )}
        <ScrollReveal>
          <div className="stats-grid" style={cols < 4 ? { gridTemplateColumns: `repeat(${cols}, 1fr)` } : undefined}>
            {items.map((s, i) => (
              <div className="stat-card" key={i}>
                <div className="stat-number">{s.value}</div>
                <div className="stat-label">{s.label}</div>
              </div>
            ))}
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}
