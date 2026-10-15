import ScrollReveal from '@/components/ScrollReveal';
import { SmartLink } from './shared';

export default function CtaBanner({ props }) {
  return (
    <section className="section">
      <div className="container">
        <ScrollReveal>
          <div className="cta-section">
            <h2>{props.heading}</h2>
            {props.body && <p>{props.body}</p>}
            <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap', position: 'relative', zIndex: 1 }}>
              <SmartLink href={props.href} className="btn btn-primary btn-lg">{props.label}</SmartLink>
            </div>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}
