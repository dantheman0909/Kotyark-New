// Block contract: the single definition that drives the admin editor forms,
// server-side validation, the public renderer, and the content migration.
// A page's `blocks` column is an array of { id, type, props }.
//
// Field kinds: text | textarea | richtext | url | image | select | boolean | number
//              | folder (document_folders.id) | tags (array of short strings)
//              | list (repeating group with `fields`)
// `required` fields must be non-empty. richtext is sanitized server-side.

export const BLOCKS = {
  hero: {
    label: 'Hero',
    fields: {
      eyebrow:    { kind: 'text', label: 'Eyebrow' },
      heading:    { kind: 'text', label: 'Heading', required: true },
      subheading: { kind: 'textarea', label: 'Subheading' },
      image:      { kind: 'image', label: 'Background image' },
      imageAlt:   { kind: 'text', label: 'Image alt text' },
      variant:    { kind: 'select', label: 'Style', options: ['full', 'page'], default: 'page' }, // full = home hero, page = .page-hero
      ctas:       { kind: 'list', label: 'Buttons', max: 2, fields: {
        label: { kind: 'text', label: 'Label', required: true },
        href:  { kind: 'url', label: 'Link', required: true },
        style: { kind: 'select', label: 'Style', options: ['primary', 'outline'], default: 'primary' },
      } },
    },
  },
  rich_text: {
    label: 'Rich text',
    fields: {
      eyebrow: { kind: 'text', label: 'Eyebrow' },
      heading: { kind: 'text', label: 'Heading' },
      html:    { kind: 'richtext', label: 'Body', required: true },
      width:   { kind: 'select', label: 'Width', options: ['normal', 'narrow', 'wide'], default: 'normal' },
    },
  },
  image_text: {
    label: 'Image + text',
    fields: {
      eyebrow:       { kind: 'text', label: 'Eyebrow' },
      heading:       { kind: 'text', label: 'Heading' },
      html:          { kind: 'richtext', label: 'Body', required: true },
      image:         { kind: 'image', label: 'Image', required: true },
      imageAlt:      { kind: 'text', label: 'Image alt text', required: true },
      imagePosition: { kind: 'select', label: 'Image side', options: ['left', 'right'], default: 'right' },
      cta:           { kind: 'list', label: 'Button', max: 1, fields: {
        label: { kind: 'text', label: 'Label', required: true },
        href:  { kind: 'url', label: 'Link', required: true },
      } },
    },
  },
  stats: {
    label: 'Stats',
    fields: {
      eyebrow: { kind: 'text', label: 'Eyebrow' },
      heading: { kind: 'text', label: 'Heading' },
      items:   { kind: 'list', label: 'Stats', min: 1, max: 8, fields: {
        value: { kind: 'text', label: 'Value', required: true },   // '480,000 KL'
        label: { kind: 'text', label: 'Label', required: true },
      } },
    },
  },
  card_grid: {
    label: 'Card grid',
    fields: {
      eyebrow:  { kind: 'text', label: 'Eyebrow' },
      heading:  { kind: 'text', label: 'Heading' },
      intro:    { kind: 'textarea', label: 'Intro' },
      columns:  { kind: 'select', label: 'Columns', options: ['2', '3', '4'], default: '3' },
      items:    { kind: 'list', label: 'Cards', min: 1, max: 12, fields: {
        title: { kind: 'text', label: 'Title', required: true },
        body:  { kind: 'textarea', label: 'Body' },
        role:      { kind: 'text', label: 'Subtitle / role' },
        image:     { kind: 'image', label: 'Image' },
        imageAlt:  { kind: 'text', label: 'Image alt text' },
        icon:      { kind: 'text', label: 'Icon (emoji or short text)' },
        tags:      { kind: 'tags', label: 'Tags' },
        href:      { kind: 'url', label: 'Link' },
        linkLabel: { kind: 'text', label: 'Link label' },
      } },
    },
  },
  cta_banner: {
    label: 'Call to action',
    fields: {
      heading: { kind: 'text', label: 'Heading', required: true },
      body:    { kind: 'textarea', label: 'Body' },
      label:   { kind: 'text', label: 'Button label', required: true },
      href:    { kind: 'url', label: 'Button link', required: true },
      secondaryLabel: { kind: 'text', label: 'Second button label' },
      secondaryHref:  { kind: 'url', label: 'Second button link' },
    },
  },
  faq: {
    label: 'FAQ',
    fields: {
      heading: { kind: 'text', label: 'Heading', default: 'Frequently asked questions' },
      items:   { kind: 'list', label: 'Questions', min: 1, fields: {
        question: { kind: 'text', label: 'Question', required: true },
        answer:   { kind: 'richtext', label: 'Answer', required: true },
      } },
    },
  },
  document_list: {
    label: 'Document list',
    fields: {
      heading:  { kind: 'text', label: 'Heading' },
      folderId: { kind: 'folder', label: 'Folder', required: true },
      groupBy:  { kind: 'select', label: 'Group by', options: ['folder-default', 'none', 'fy', 'year'], default: 'folder-default' },
      limit:    { kind: 'number', label: 'Max documents (0 = all)', default: 0 },
    },
  },
  compliance_table: {
    label: 'Compliance table',
    fields: {
      heading: { kind: 'text', label: 'Heading' },
      intro:   { kind: 'textarea', label: 'Intro' },
      rows:    { kind: 'list', label: 'Rows', min: 1, fields: {
        sr:         { kind: 'text', label: 'Sr. No.', required: true },
        particular: { kind: 'text', label: 'Particulars', required: true },
        regulation: { kind: 'text', label: 'Regulation' },
        href:       { kind: 'url', label: 'Link (blank = NA)' },
      } },
    },
  },
  contact_info: {
    label: 'Contact info',
    fields: {
      heading: { kind: 'text', label: 'Heading' },
      items:   { kind: 'list', label: 'Entries', min: 1, fields: {
        label: { kind: 'text', label: 'Label', required: true },  // 'Registered Office'
        value: { kind: 'textarea', label: 'Value', required: true },
        href:  { kind: 'url', label: 'Link (tel:, mailto:, maps)' },
      } },
      showForm: { kind: 'boolean', label: 'Show enquiry form', default: false },
    },
  },
  embed: {
    label: 'Embed (video / map)',
    fields: {
      title: { kind: 'text', label: 'Accessible title', required: true },
      url:   { kind: 'url', label: 'Embed URL (YouTube, Vimeo, Google Maps)', required: true },
      ratio: { kind: 'select', label: 'Aspect ratio', options: ['16:9', '4:3', '1:1'], default: '16:9' },
    },
  },
};

export const BLOCK_TYPES = Object.keys(BLOCKS);

/** Default props for a new block of `type`. */
export function defaultProps(type) {
  const def = BLOCKS[type];
  if (!def) throw new Error(`Unknown block type: ${type}`);
  const out = {};
  for (const [k, f] of Object.entries(def.fields)) {
    out[k] = f.kind === 'list' || f.kind === 'tags' ? [] : f.default ?? (f.kind === 'boolean' ? false : f.kind === 'number' ? 0 : '');
  }
  return out;
}

/**
 * Validate one block. Returns an array of error strings (empty = valid).
 * Does NOT sanitize; callers sanitize richtext fields with sanitizeRichText().
 */
export function validateBlock(block) {
  const errs = [];
  const def = BLOCKS[block?.type];
  if (!def) return [`Unknown block type: ${block?.type}`];
  const check = (fields, props, where) => {
    for (const [k, f] of Object.entries(fields)) {
      const v = props?.[k];
      if (f.kind === 'list') {
        const arr = Array.isArray(v) ? v : [];
        if (f.min && arr.length < f.min) errs.push(`${where}${f.label}: at least ${f.min} required`);
        if (f.max && arr.length > f.max) errs.push(`${where}${f.label}: at most ${f.max} allowed`);
        arr.forEach((item, i) => check(f.fields, item, `${where}${f.label} #${i + 1} › `));
      } else if (f.kind === 'tags') {
        if (v != null && (!Array.isArray(v) || v.some(t => typeof t !== 'string'))) errs.push(`${where}${f.label}: must be a list of text`);
        else if (f.required && !(v || []).length) errs.push(`${where}${f.label} is required`);
      } else if (f.required && (v === undefined || v === null || String(v).trim() === '')) {
        errs.push(`${where}${f.label} is required`);
      } else if (f.kind === 'select' && v && !f.options.includes(String(v))) {
        errs.push(`${where}${f.label}: invalid option`);
      }
    }
  };
  check(def.fields, block.props, `${def.label} › `);
  if (block.type === 'cta_banner' && !!block.props?.secondaryLabel !== !!block.props?.secondaryHref) {
    errs.push(`${def.label} › Second button needs both a label and a link`);
  }
  return errs;
}

/** Walk every richtext field in a block, returning a new block with fn applied to each. */
export function mapRichText(block, fn) {
  const def = BLOCKS[block.type];
  if (!def) return block;
  const walk = (fields, props) => {
    const out = { ...props };
    for (const [k, f] of Object.entries(fields)) {
      if (f.kind === 'richtext' && typeof out[k] === 'string') out[k] = fn(out[k]);
      if (f.kind === 'list' && Array.isArray(out[k])) out[k] = out[k].map(item => walk(f.fields, item));
    }
    return out;
  };
  return { ...block, props: walk(def.fields, block.props || {}) };
}

/** Flatten a block list to plain text for search_text. htmlToText from src/lib/sanitize.js. */
export function blocksToText(blocks, htmlToText) {
  const parts = [];
  const walk = (fields, props) => {
    for (const [k, f] of Object.entries(fields)) {
      const v = props?.[k];
      if (f.kind === 'list' && Array.isArray(v)) v.forEach(item => walk(f.fields, item));
      else if (f.kind === 'richtext') parts.push(htmlToText(v));
      else if (f.kind === 'tags' && Array.isArray(v)) parts.push(v.join(' '));
      else if (['text', 'textarea'].includes(f.kind) && v) parts.push(String(v));
    }
  };
  for (const b of blocks || []) if (BLOCKS[b.type]) walk(BLOCKS[b.type].fields, b.props);
  return parts.join(' ').replace(/\s+/g, ' ').trim();
}

/** Image field values are media ids (uuid) or absolute/root-relative URLs (e.g. '/images/hero-forest.jpg'). */
export function imageSrc(value) {
  if (!value) return null;
  return /^[0-9a-f-]{36}$/i.test(value) ? `/media/${value}` : value;
}
