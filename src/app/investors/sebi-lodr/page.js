import InvestorSubPageLayout from '@/components/InvestorSubPageLayout';

export const metadata = {
  title: 'Disclosure Under Reg. 46 of SEBI (LODR)',
  description: 'Particulars as per SEBI (Listing Obligations and Disclosure Requirements) Regulations, 2015 — Regulation 46(2) website disclosures for Kotyark Industries Limited.',
};

export default function SebiLodrPage() {
  const disclosures = [
    { sr: 'A', particular: 'Details of Business', regulation: 'Reg. 46(2)(a)', status: 'Yes', link: '/about', linkText: 'View' },
    { sr: 'B', particular: 'Terms and Conditions of Appointment of Independent Directors', regulation: 'Reg. 46(2)(b)', status: 'Yes', link: '/investors/company-policies', linkText: 'View' },
    { sr: 'C', particular: 'Composition of Various Committees of Board of Directors', regulation: 'Reg. 46(2)(c)', status: 'Yes', link: '/investors/company-policies', linkText: 'View' },
    { sr: 'D', particular: 'Code of Conduct for Board of Directors and Senior Management Personnel', regulation: 'Reg. 46(2)(d)', status: 'Yes', link: '/investors/company-policies', linkText: 'View' },
    { sr: 'E', particular: 'Details of Establishment of Vigil Mechanism / Whistle Blower Policy', regulation: 'Reg. 46(2)(e)', status: 'Yes', link: '/investors/company-policies', linkText: 'View' },
    { sr: 'F', particular: 'Criteria of Making Payments to Non-Executive Directors', regulation: 'Reg. 46(2)(f)', status: 'Yes', link: '/investors/company-policies', linkText: 'View' },
    { sr: 'G', particular: 'Policy on Dealing with Related Party Transactions', regulation: 'Reg. 46(2)(g)', status: 'Yes', link: '/investors/company-policies', linkText: 'View' },
    { sr: 'H', particular: 'Policy for Determining "Material" Subsidiaries', regulation: 'Reg. 46(2)(h)', status: 'Yes', link: '/investors/company-policies', linkText: 'View' },
    { sr: 'I', particular: 'Details of Familiarization Programmes Imparted to Independent Directors', regulation: 'Reg. 46(2)(i)', status: 'Yes', link: '/investors/company-policies', linkText: 'View' },
    { sr: 'J', particular: 'Email Address for Grievance Redressal and Other Relevant Details', regulation: 'Reg. 46(2)(j)', status: 'Yes', link: '/contact', linkText: 'View' },
    { sr: 'K', particular: 'Contact Information of Designated Officials for Investor Grievances', regulation: 'Reg. 46(2)(k)', status: 'Yes', link: '/contact', linkText: 'View' },
    { sr: 'L(i)', particular: 'Notice of Board Meeting for Discussing Financial Results', regulation: 'Reg. 46(2)(l)(i)', status: 'Yes', link: '/investors/board-meetings', linkText: 'View' },
    { sr: 'L(ii)', particular: 'Financial Results (Upon Conclusion of Board Meeting)', regulation: 'Reg. 46(2)(l)(ii)', status: 'Yes', link: '/investors/board-meetings', linkText: 'View' },
    { sr: 'L(iii)', particular: 'Complete Copy of Annual Report (Balance Sheet, P&L, Directors\' Report, Corporate Governance Report)', regulation: 'Reg. 46(2)(l)(iii)', status: 'Yes', link: '/investors/annual-general-meeting', linkText: 'View' },
    { sr: 'L(iv)', particular: 'Audited Financial Statements of Each Subsidiary', regulation: 'Reg. 46(2)(l)(iv)', status: 'Yes', link: '/investors/audited-financial-statements', linkText: 'View' },
    { sr: 'M', particular: 'Shareholding Pattern', regulation: 'Reg. 46(2)(m)', status: 'Yes', link: '/investors/misc-sebi-disclosure', linkText: 'View' },
    { sr: 'N', particular: 'Details of Agreements with Media Companies and/or their Associates', regulation: 'Reg. 46(2)(n)', status: 'NA', link: null, linkText: '' },
    { sr: 'O', particular: 'Schedule of Analysts or Institutional Investors Meet and Presentations', regulation: 'Reg. 46(2)(o)', status: 'NA', link: null, linkText: '' },
    { sr: 'P', particular: 'Audio/Video Recordings and Transcripts of Post-Earnings/Quarterly Calls', regulation: 'Reg. 46(2)(p)', status: 'NA', link: null, linkText: '' },
    { sr: 'Q', particular: 'New Name and Old Name of the Listed Entity (if changed in last 1 year)', regulation: 'Reg. 46(2)(q)', status: 'NA', link: null, linkText: '' },
    { sr: 'R', particular: 'All Credit Ratings Obtained for Outstanding Instruments', regulation: 'Reg. 46(2)(r)', status: 'Yes', link: '/investors/misc-sebi-disclosure', linkText: 'View' },
    { sr: 'S', particular: 'Advertisements Published in Newspapers as per Regulation 47(1)', regulation: 'Reg. 46(2)(s)', status: 'Yes', link: '/investors/misc-sebi-disclosure', linkText: 'View' },
    { sr: 'T', particular: 'Secretarial Compliance Report', regulation: 'Reg. 46(2)(t)', status: 'Yes', link: '/investors/misc-sebi-disclosure', linkText: 'View' },
    { sr: 'U', particular: 'Policy for Determination of Materiality of Events or Information', regulation: 'Reg. 46(2)(u)', status: 'Yes', link: '/investors/company-policies', linkText: 'View' },
    { sr: 'V', particular: 'Contact Details of Key Managerial Personnel Authorized for Determining Materiality', regulation: 'Reg. 46(2)(v)', status: 'Yes', link: '/contact', linkText: 'View' },
    { sr: 'W', particular: 'Disclosures under Sub-regulation (8) of Regulation 30', regulation: 'Reg. 46(2)(w)', status: 'Yes', link: '/investors/misc-sebi-disclosure', linkText: 'View' },
    { sr: 'X', particular: 'Statements of Deviation(s) or Variation(s) as specified in Regulation 32', regulation: 'Reg. 46(2)(x)', status: 'NA', link: null, linkText: '' },
    { sr: 'Y', particular: 'Dividend Distribution Policy', regulation: 'Reg. 46(2)(y)', status: 'Yes', link: '/investors/company-policies', linkText: 'View' },
    { sr: 'Z', particular: 'Annual Return as provided under Section 92 of Companies Act, 2013', regulation: 'Reg. 46(2)(z)', status: 'Yes', link: '/investors/annual-general-meeting', linkText: 'View' },
    { sr: 'ZA', particular: 'Employee Benefit Scheme Documents (Excluding Commercial Secrets)', regulation: 'Reg. 46(2)(za)', status: 'NA', link: null, linkText: '' },
  ];

  return (
    <InvestorSubPageLayout title="Disclosure Under Reg. 46 of SEBI (LODR)">
      <p style={{ marginBottom: '24px', color: 'var(--color-text-secondary)' }}>
        Particulars as per SEBI (Listing Obligations and Disclosure Requirements) Regulations, 2015 — Regulation 46(2) for website disclosures by Kotyark Industries Limited.
      </p>
      <div className="compliance-table-wrap">
        <table className="compliance-table">
          <thead>
            <tr>
              <th>Sr. No.</th>
              <th>Particulars</th>
              <th>Regulation</th>
              <th>Link</th>
            </tr>
          </thead>
          <tbody>
            {disclosures.map((d, i) => (
              <tr key={i}>
                <td>{d.sr}</td>
                <td>{d.particular}</td>
                <td>{d.regulation}</td>
                <td>
                  {d.link ? (
                    <a href={d.link} className="compliance-link">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '4px', verticalAlign: '-2px' }}>
                        <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/>
                      </svg>
                      View
                    </a>
                  ) : <span style={{ color: 'var(--color-text-muted)' }}>—</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </InvestorSubPageLayout>
  );
}
