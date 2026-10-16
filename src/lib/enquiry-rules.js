// Contact-form rules shared by the public form, the CMS ContactForm block and POST /api/contact.
// Pure (no server imports) so client components can use it. Messages are the design's, verbatim.

export const SUBJECTS = ['Bulk biodiesel supply', 'Crude glycerin', 'Partnership / distribution', 'Investor relations', 'Media', 'Other'];
export const VOLUME_SUBJECTS = ['Bulk biodiesel supply', 'Crude glycerin'];

// Rejects characters that could smuggle mailto: parameters or extra recipients (? & , ; < > " ( ) [ ] \ :) and whitespace.
const EMAIL_RE = /^[^\s@?&,;<>"()[\]\\:]+@[^\s@?&,;<>"()[\]\\:]+\.[^\s@?&,;<>"()[\]\\:]{2,}$/;
const PHONE_RE = /^[+\d][\d\s-]{7,}$/;
// eslint-disable-next-line no-control-regex
const CONTROL_RE = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g;

/** Strip control characters (keeping tab/newline in the message) and trim. */
export function clean(v, { multiline = false } = {}) {
  let s = typeof v === 'string' ? v : '';
  s = s.replace(CONTROL_RE, '');
  if (!multiline) s = s.replace(/[\t\r\n]+/g, ' ');
  return s.trim();
}

/** -> { values, errors }. errors is {} when valid. */
export function validateEnquiry(input) {
  const src = input && typeof input === 'object' ? input : {};
  const values = {
    subject: clean(src.subject),
    name: clean(src.name),
    email: clean(src.email),
    phone: clean(src.phone),
    company: clean(src.company),
    volume: clean(src.volume),
    message: clean(src.message, { multiline: true }),
  };
  const errors = {};
  if (!SUBJECTS.includes(values.subject)) errors.subject = 'Choose a topic.';
  if (values.name.length < 2) errors.name = 'Enter your name.';
  else if (values.name.length > 120) errors.name = 'Name is too long (120 characters max).';
  if (!EMAIL_RE.test(values.email) || values.email.length > 254) errors.email = 'Enter a valid email address.';
  if (values.phone && (!PHONE_RE.test(values.phone) || values.phone.length > 32)) errors.phone = 'Enter a valid phone number.';
  if (values.company.length > 160) errors.company = 'Company name is too long (160 characters max).';
  if (values.volume.length > 40) errors.volume = 'Volume is too long (40 characters max).';
  if (values.message.length < 10) errors.message = 'Add a few more details (10+ characters).';
  else if (values.message.length > 5000) errors.message = 'Message is too long (5000 characters max).';
  return { values, errors };
}
