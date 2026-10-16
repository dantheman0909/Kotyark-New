'use client';

import { useEffect, useRef, useState } from 'react';
import { SUBJECTS, VOLUME_SUBJECTS, validateEnquiry } from '@/lib/enquiry-rules';
import styles from './Contact.module.css';

const EMPTY = { name: '', email: '', phone: '', company: '', volume: '', message: '' };
const SEND_ERROR = 'Could not send right now. Please email info@kotyark.com.';

/** The contact form (client island). Server page renders everything around it. */
export default function ContactForm({ initialSubject = '' }) {
  const [subject, setSubject] = useState(SUBJECTS.includes(initialSubject) ? initialSubject : '');
  const [form, setForm] = useState(EMPTY);
  const [website, setWebsite] = useState(''); // honeypot
  const [err, setErr] = useState({});
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState('');
  const [sent, setSent] = useState(false);
  const [sentNote, setSentNote] = useState('');
  const [firstName, setFirstName] = useState('');
  const renderedAt = useRef({ at: 0, perf: 0 });
  const stamp = () => { renderedAt.current = { at: Date.now(), perf: performance.now() }; };
  useEffect(stamp, []);

  const onField = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
    setErr((x) => ({ ...x, [name]: '' }));
  };

  const submit = async (e) => {
    e.preventDefault();
    if (sending) return;
    const { errors } = validateEnquiry({ subject, ...form });
    if (Object.keys(errors).length) { setErr(errors); return; }
    setSending(true); setSendError('');
    const email = form.email.trim();
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({
          subject, ...form, website,
          renderedAt: renderedAt.current.at,
          elapsedMs: Math.round(performance.now() - renderedAt.current.perf),
          path: window.location.pathname,
        }),
      });
      if (res.status === 400) {
        const data = await res.json().catch(() => ({}));
        if (data.fields) { setErr(data.fields); setSending(false); return; }
      }
      if (!res.ok) throw new Error(String(res.status));
      setFirstName(form.name.trim().split(' ')[0]);
      setSentNote(`Your message reached our team. We will reply to ${email} within one business day.`);
      setSent(true);
    } catch {
      setSendError(SEND_ERROR);
    }
    setSending(false);
  };

  const reset = () => { setSent(false); setForm(EMPTY); setSubject(''); setErr({}); setSendError(''); stamp(); };

  if (sent) {
    return (
      <div className={styles.sent} role="status">
        <div className={styles.sentEyebrow}>Message ready</div>
        <h2 className={styles.sentTitle}>Thank you, {firstName}.</h2>
        <p className={styles.sentNote}>{sentNote}</p>
        <button type="button" className={styles.again} onClick={reset}>Send another message</button>
      </div>
    );
  }

  const text = (name, label, props = {}) => (
    <label className={styles.field}>
      <span className={styles.label}>{label}</span>
      <input name={name} type="text" value={form[name]} onChange={onField} className={styles.input}
        aria-invalid={err[name] ? 'true' : undefined} aria-describedby={err[name] ? `err-${name}` : undefined} {...props} />
      {name === 'company' || name === 'volume'
        ? <span className={styles.spacer} />
        : <span className={styles.err} id={`err-${name}`} role="alert">{err[name]}</span>}
    </label>
  );

  return (
    <form onSubmit={submit} noValidate className={styles.form}>
      <fieldset className={styles.group}>
        <legend className={`${styles.label}`} style={{ marginBottom: 12 }}>What is this about?</legend>
        <div className={styles.chips}>
          {SUBJECTS.map((k) => (
            <button key={k} type="button" className={styles.chip} aria-pressed={subject === k}
              onClick={() => { setSubject(k); setErr((x) => ({ ...x, subject: '' })); }}>{k}</button>
          ))}
        </div>
        <span className={styles.err} role="alert">{err.subject}</span>
      </fieldset>
      <div className={styles.fields}>
        {text('name', 'Full name *', { placeholder: 'Your name', autoComplete: 'name' })}
        {text('email', 'Email *', { type: 'email', placeholder: 'you@company.com', autoComplete: 'email' })}
        {text('phone', 'Phone', { type: 'tel', placeholder: '+91 98XXX XXXXX', autoComplete: 'tel' })}
        {text('company', 'Company', { placeholder: 'Company name', autoComplete: 'organization' })}
      </div>
      {VOLUME_SUBJECTS.includes(subject) && text('volume', 'Monthly volume (KL)', { placeholder: 'e.g. 200', inputMode: 'decimal' })}
      <label className={styles.field}>
        <span className={styles.label}>Message *</span>
        <textarea name="message" rows={5} value={form.message} onChange={onField} placeholder="Tell us what you need"
          className={`${styles.input} ${styles.textarea}`} aria-invalid={err.message ? 'true' : undefined} aria-describedby={err.message ? 'err-message' : undefined} />
        <span className={styles.err} id="err-message" role="alert">{err.message}</span>
      </label>
      <div className={styles.hp} aria-hidden="true">
        <label>Website<input type="text" name="website" tabIndex={-1} autoComplete="off" value={website} onChange={(e) => setWebsite(e.target.value)} /></label>
      </div>
      <div className={styles.actions}>
        <button type="submit" className={styles.send} disabled={sending}>{sending ? 'Sending…' : 'Send message →'}</button>
        <span className={styles.reply}>We reply within one business day.</span>
      </div>
      <span className={styles.sendError} role="alert">{sendError}</span>
    </form>
  );
}
