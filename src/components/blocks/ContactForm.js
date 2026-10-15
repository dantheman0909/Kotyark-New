'use client';

import { useState } from 'react';

// Mirrors the original contact page form (which has no backend yet: it only shows the thank-you state).
export default function ContactForm() {
  const [formData, setFormData] = useState({ name: '', email: '', phone: '', company: '', subject: '', message: '' });
  const [submitted, setSubmitted] = useState(false);
  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  if (submitted) {
    return (
      <div style={{ padding: '48px 32px', background: 'var(--color-bg-section-alt)', borderRadius: 'var(--radius-lg)', textAlign: 'center' }}>
        <h3 style={{ marginBottom: '12px' }}>Thank You!</h3>
        <p style={{ color: 'var(--color-text-secondary)' }}>
          Your message has been received. Our team will get back to you within 24 business hours.
        </p>
      </div>
    );
  }
  return (
    <form onSubmit={(e) => { e.preventDefault(); setSubmitted(true); }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
        <div className="form-group">
          <label htmlFor="cf-name">Full Name *</label>
          <input type="text" id="cf-name" name="name" value={formData.name} onChange={handleChange} placeholder="Your full name" required />
        </div>
        <div className="form-group">
          <label htmlFor="cf-email">Email Address *</label>
          <input type="email" id="cf-email" name="email" value={formData.email} onChange={handleChange} placeholder="you@company.com" required />
        </div>
      </div>
      <div className="form-group">
        <label htmlFor="cf-subject">Subject *</label>
        <input type="text" id="cf-subject" name="subject" value={formData.subject} onChange={handleChange} required />
      </div>
      <div className="form-group">
        <label htmlFor="cf-message">Message *</label>
        <textarea id="cf-message" name="message" value={formData.message} onChange={handleChange} placeholder="Tell us about your requirements..." required />
      </div>
      <button type="submit" className="btn btn-primary btn-lg" style={{ width: '100%', justifyContent: 'center' }}>Send Message →</button>
    </form>
  );
}
