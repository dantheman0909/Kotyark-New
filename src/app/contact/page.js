'use client';

import { useState } from 'react';
import ScrollReveal from '@/components/ScrollReveal';

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: '', email: '', phone: '', company: '', subject: '', message: '',
  });
  const [submitted, setSubmitted] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // In production, this would submit to an API
    setSubmitted(true);
  };

  return (
    <>
      <section className="page-hero">
        <div className="container">
          <h1>Contact Us</h1>
          <p>Get in touch for biodiesel supply, partnerships, investor queries, or any other enquiries.</p>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <ScrollReveal>
            <div className="contact-grid">
              {/* Form */}
              <div>
                <h2 style={{ marginBottom: '8px' }}>Send Us a Message</h2>
                <p style={{ color: 'var(--color-text-secondary)', marginBottom: '32px' }}>
                  Fill out the form below and our team will respond within 24 business hours.
                </p>

                {submitted ? (
                  <div style={{ padding: '48px 32px', background: 'var(--color-bg-section-alt)', borderRadius: 'var(--radius-lg)', textAlign: 'center' }}>
                    <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'rgba(22, 163, 74, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
                      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#16A34A" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    </div>
                    <h3 style={{ marginBottom: '12px' }}>Thank You!</h3>
                    <p style={{ color: 'var(--color-text-secondary)' }}>
                      Your message has been received. Our team will get back to you within 24 business hours.
                    </p>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} id="contact-form">
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                      <div className="form-group">
                        <label htmlFor="name">Full Name *</label>
                        <input type="text" id="name" name="name" value={formData.name} onChange={handleChange} placeholder="Your full name" required />
                      </div>
                      <div className="form-group">
                        <label htmlFor="email">Email Address *</label>
                        <input type="email" id="email" name="email" value={formData.email} onChange={handleChange} placeholder="you@company.com" required />
                      </div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                      <div className="form-group">
                        <label htmlFor="phone">Phone Number</label>
                        <input type="tel" id="phone" name="phone" value={formData.phone} onChange={handleChange} placeholder="+91 XXXXX XXXXX" />
                      </div>
                      <div className="form-group">
                        <label htmlFor="company">Company Name</label>
                        <input type="text" id="company" name="company" value={formData.company} onChange={handleChange} placeholder="Your company" />
                      </div>
                    </div>
                    <div className="form-group">
                      <label htmlFor="subject">Subject *</label>
                      <select id="subject" name="subject" value={formData.subject} onChange={handleChange} required>
                        <option value="">Select a topic</option>
                        <option value="biodiesel-supply">Biodiesel Supply Enquiry</option>
                        <option value="glycerin-supply">Crude Glycerin Enquiry</option>
                        <option value="partnership">Partnership / Distribution</option>
                        <option value="investor">Investor Relations</option>
                        <option value="careers">Careers</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label htmlFor="message">Message *</label>
                      <textarea id="message" name="message" value={formData.message} onChange={handleChange} placeholder="Tell us about your requirements..." required />
                    </div>
                    <button type="submit" className="btn btn-primary btn-lg" style={{ width: '100%', justifyContent: 'center' }}>
                      Send Message →
                    </button>
                  </form>
                )}
              </div>

              {/* Contact Info */}
              <div>
                <h2 style={{ marginBottom: '24px' }}>Our Offices</h2>

                <div className="contact-info-card">
                  <div className="contact-info-icon">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" />
                    </svg>
                  </div>
                  <div>
                    <h4 style={{ fontSize: '16px', marginBottom: '4px' }}>Head Office — Rajasthan</h4>
                    <p style={{ fontSize: '14px', color: 'var(--color-text-secondary)', margin: 0 }}>
                      F-20, RICCO Industrial Area, Swaroopganj,<br />
                      Sirohi District, Rajasthan 307026, India
                    </p>
                  </div>
                </div>

                <div className="contact-info-card">
                  <div className="contact-info-icon">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" />
                    </svg>
                  </div>
                  <div>
                    <h4 style={{ fontSize: '16px', marginBottom: '4px' }}>Gujarat Plant</h4>
                    <p style={{ fontSize: '14px', color: 'var(--color-text-secondary)', margin: 0 }}>
                      Anand, Gujarat, India
                    </p>
                  </div>
                </div>

                <div className="contact-info-card">
                  <div className="contact-info-icon">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <rect width="20" height="16" x="2" y="4" rx="2" /><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                    </svg>
                  </div>
                  <div>
                    <h4 style={{ fontSize: '16px', marginBottom: '4px' }}>Email</h4>
                    <p style={{ fontSize: '14px', color: 'var(--color-text-secondary)', margin: 0 }}>
                      info@kotyark.com
                    </p>
                  </div>
                </div>

                <div style={{ marginTop: '32px', padding: '24px', background: 'var(--color-bg-section-alt)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border)' }}>
                  <h4 style={{ marginBottom: '12px' }}>Company Details</h4>
                  <div style={{ fontSize: '14px', color: 'var(--color-text-secondary)', lineHeight: 1.8 }}>
                    <p style={{ margin: '0 0 4px 0' }}><strong>Company:</strong> Kotyark Industries Limited</p>
                    <p style={{ margin: '0 0 4px 0' }}><strong>CIN:</strong> L15149RJ2023PLC091598</p>
                    <p style={{ margin: '0 0 4px 0' }}><strong>Listed On:</strong> BSE (Bombay Stock Exchange)</p>
                    <p style={{ margin: 0 }}><strong>Sector:</strong> Biodiesel &amp; Biofuels</p>
                  </div>
                </div>

                <div style={{ marginTop: '24px', padding: '24px', background: 'linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-light) 100%)', borderRadius: 'var(--radius-lg)', color: 'white' }}>
                  <h4 style={{ color: 'white', marginBottom: '8px' }}>Approved Manufacturer</h4>
                  <p style={{ fontSize: '14px', color: 'rgba(240,255,244,0.8)', margin: 0 }}>
                    Approved by Bio-Fuel Authority under the Rural Development Department
                    and Panchayati Raj, Government of Rajasthan.
                  </p>
                </div>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </section>
    </>
  );
}
