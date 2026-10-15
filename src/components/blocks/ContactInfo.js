import ScrollReveal from '@/components/ScrollReveal';
import { SmartLink } from './shared';
import ContactForm from './ContactForm';

function Entry({ item }) {
  const value = <span style={{ whiteSpace: 'pre-line' }}>{item.value}</span>;
  return (
    <div className="contact-info-card">
      <div className="contact-info-icon">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" />
        </svg>
      </div>
      <div>
        <h4 style={{ fontSize: '16px', marginBottom: '4px' }}>{item.label}</h4>
        <p style={{ fontSize: '14px', color: 'var(--color-text-secondary)', margin: 0 }}>
          {item.href ? <SmartLink href={item.href}>{value}</SmartLink> : value}
        </p>
      </div>
    </div>
  );
}

export default function ContactInfo({ props }) {
  const entries = (props.items || []).map((item, i) => <Entry key={i} item={item} />);
  return (
    <section className="section">
      <div className="container">
        <ScrollReveal>
          {props.showForm ? (
            <div className="contact-grid">
              <div>
                <h2 style={{ marginBottom: '24px' }}>Send Us a Message</h2>
                <ContactForm />
              </div>
              <div>
                {props.heading && <h2 style={{ marginBottom: '24px' }}>{props.heading}</h2>}
                {entries}
              </div>
            </div>
          ) : (
            <div style={{ maxWidth: '720px', margin: '0 auto' }}>
              {props.heading && <h2 style={{ marginBottom: '24px' }}>{props.heading}</h2>}
              {entries}
            </div>
          )}
        </ScrollReveal>
      </div>
    </section>
  );
}
