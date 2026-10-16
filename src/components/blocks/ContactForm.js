'use client';

import { useEffect, useRef, useState } from 'react';
import { SUBJECTS, validateEnquiry } from '@/lib/enquiry-rules';

// Posts to POST /api/contact (same fields, validation and spam guards as the /contact page form).
export default function ContactForm() {
  const [formData, setFormData] = useState({ name: '', email: '', phone: '', company: '', subject: '', message: '' });
  const [website, setWebsite] = useState(''); // honeypot
  const [errors, setErrors] = useState({});
  const [sending, setSending] = useState(false);
  const [failed, setFailed] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const perfAt = useRef(0);
  const renderedAt = useRef(0);
  useEffect(() => { perfAt.current = performance.now(); renderedAt.current = Date.now(); }, []);
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setErrors((x) => ({ ...x, [e.target.name]: '' }));
  };

  const submit = async (e) => {
    e.preventDefault();
    if (sending) return;
    const { errors: found } = validateEnquiry(formData);
    if (Object.keys(found).length) { setErrors(found); return; }
    setSending(true); setFailed(false);
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({
          ...formData, website, renderedAt: renderedAt.current,
          elapsedMs: Math.round(performance.now() - perfAt.current), path: window.location.pathname,
        }),
      });
      if (res.status === 400) {
        const data = await res.json().catch(() => ({}));
        if (data.fields) { setErrors(data.fields); setSending(false); return; }
      }
      if (!res.ok) throw new Error(String(res.status));
      setSubmitted(true);
    } catch { setFailed(true); }
    setSending(false);
  };

  if (submitted) {
    return (
      <div style={{ padding: '48px 32px', background: 'var(--color-bg-section-alt)', borderRadius: 'var(--radius-lg)', textAlign: 'center' }} role="status">
        <h3 style={{ marginBottom: '12px' }}>Thank You!</h3>
        <p style={{ color: 'var(--color-text-secondary)' }}>
          Your message has been received. Our team will get back to you within one business day.
        </p>
      </div>
    );
  }
  const err = (k) => (errors[k] ? <span role="alert" style={{ fontSize: '13px', color: '#B3261E' }}>{errors[k]}</span> : null);
  return (
    <form onSubmit={submit} noValidate>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
        <div className="form-group">
          <label htmlFor="cf-name">Full Name *</label>
          <input type="text" id="cf-name" name="name" value={formData.name} onChange={handleChange} placeholder="Your full name" autoComplete="name" />
          {err('name')}
        </div>
        <div className="form-group">
          <label htmlFor="cf-email">Email Address *</label>
          <input type="email" id="cf-email" name="email" value={formData.email} onChange={handleChange} placeholder="you@company.com" autoComplete="email" />
          {err('email')}
        </div>
      </div>
      <div className="form-group">
        <label htmlFor="cf-subject">Subject *</label>
        <select id="cf-subject" name="subject" value={formData.subject} onChange={handleChange}>
          <option value="">Select a topic</option>
          {SUBJECTS.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        {err('subject')}
      </div>
      <div className="form-group">
        <label htmlFor="cf-message">Message *</label>
        <textarea id="cf-message" name="message" value={formData.message} onChange={handleChange} placeholder="Tell us about your requirements..." />
        {err('message')}
      </div>
      <div aria-hidden="true" style={{ position: 'absolute', left: '-10000px', width: 1, height: 1, overflow: 'hidden' }}>
        <label>Website<input type="text" name="website" tabIndex={-1} autoComplete="off" value={website} onChange={(e) => setWebsite(e.target.value)} /></label>
      </div>
      {failed && <p role="alert" style={{ color: '#B3261E', fontSize: '14px' }}>Could not send right now. Please email info@kotyark.com.</p>}
      <button type="submit" className="btn btn-primary btn-lg" style={{ width: '100%', justifyContent: 'center' }} disabled={sending}>{sending ? 'Sending…' : 'Send Message →'}</button>
    </form>
  );
}
