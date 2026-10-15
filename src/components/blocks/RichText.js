import ScrollReveal from '@/components/ScrollReveal';
import { sanitizeRichText } from '@/lib/sanitize';

export default function RichText({ props }) {
  const container = props.width === 'narrow' ? 'container-narrow' : props.width === 'wide' ? 'container-wide' : 'container';
  return (
    <section className="section">
      <div className={container}>
        <ScrollReveal>
          {props.heading && <h2 style={{ marginBottom: '20px' }}>{props.heading}</h2>}
          <div className="cms-rich" dangerouslySetInnerHTML={{ __html: sanitizeRichText(props.html) }} />
        </ScrollReveal>
      </div>
    </section>
  );
}
