import ScrollReveal from '@/components/ScrollReveal';
import JsonLd from '@/components/JsonLd';
import { sanitizeRichText, htmlToText } from '@/lib/sanitize';
import { faqJsonLd } from '@/lib/seo';

export default function Faq({ props }) {
  const items = (props.items || []).filter(i => i?.question);
  return (
    <section className="section">
      <div className="container">
        {props.heading && (
          <ScrollReveal>
            <div className="section-header"><h2>{props.heading}</h2></div>
          </ScrollReveal>
        )}
        <ScrollReveal>
          <div className="cms-faq">
            {items.map((q, i) => (
              <details key={i}>
                <summary>{q.question}</summary>
                <div className="cms-faq-answer cms-rich" dangerouslySetInnerHTML={{ __html: sanitizeRichText(q.answer) }} />
              </details>
            ))}
          </div>
        </ScrollReveal>
        {items.length > 0 && (
          <JsonLd data={faqJsonLd(items.map(q => ({ question: q.question, answerText: htmlToText(q.answer) })))} />
        )}
      </div>
    </section>
  );
}
