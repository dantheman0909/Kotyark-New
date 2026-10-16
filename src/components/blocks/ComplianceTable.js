import ScrollReveal from '@/components/ScrollReveal';
import { SmartLink } from './shared';

export default function ComplianceTable({ props }) {
  return (
    <section className="section">
      <div className="container">
        {props.heading && <h2 style={{ marginBottom: '12px' }}>{props.heading}</h2>}
        {props.intro && <p style={{ marginBottom: '24px', color: 'var(--color-text-secondary)' }}>{props.intro}</p>}
        <ScrollReveal>
          <div className="compliance-table-wrap">
            <table className="compliance-table">
              <thead>
                <tr><th>Sr. No.</th><th>Particulars</th><th>Regulation</th><th>Link</th></tr>
              </thead>
              <tbody>
                {(props.rows || []).map((r, i) => (
                  <tr key={i}>
                    <td>{r.sr}</td>
                    <td>{r.particular}</td>
                    <td>{r.regulation}</td>
                    <td>
                      {r.href ? (
                        <SmartLink href={r.href} className="compliance-link">View</SmartLink>
                      ) : <span style={{ color: 'var(--color-text-muted)' }}>—</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}
