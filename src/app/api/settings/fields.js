// Pure data (safe for client components): known site_settings keys, labels, field kinds, max lengths.
// Validation lives in ./schema.js (server only), driven by this file.
export const SETTINGS = {
  org: {
    label: 'Organisation',
    fields: {
      legalName: { label: 'Legal name', kind: 'text', max: 200 },
      cin: { label: 'CIN', kind: 'text', max: 40 },
      address: { label: 'Registered address', kind: 'text', max: 500, multiline: true },
      phone: { label: 'Phone', kind: 'text', max: 40 },
      email: { label: 'Contact email', kind: 'email' },
      investorEmail: { label: 'Investor email', kind: 'email' },
    },
  },
  social: {
    label: 'Social links',
    fields: {
      linkedin: { label: 'LinkedIn URL', kind: 'url' },
      twitter: { label: 'X / Twitter URL', kind: 'url' },
      facebook: { label: 'Facebook URL', kind: 'url' },
      youtube: { label: 'YouTube URL', kind: 'url' },
    },
  },
  seo_defaults: {
    label: 'SEO defaults',
    fields: {
      titleSuffix: { label: 'Title suffix', kind: 'text', max: 80 },
      defaultDescription: { label: 'Default description', kind: 'text', max: 320, multiline: true },
      defaultOgImage: { label: 'Default share image', kind: 'image', image: true },
    },
  },
  analytics: {
    label: 'Analytics',
    fields: {
      ga4Id: { label: 'GA4 measurement ID', kind: 'ga4' },
    },
  },
};

export const SETTING_KEYS = Object.keys(SETTINGS);
