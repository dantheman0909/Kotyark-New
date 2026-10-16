// What pop-up Custom CSS may contain. Pure constants (no postcss), so the scoper (popup-css.js), the
// admin editor's help text and the tests all read ONE list. Anything not listed here is rejected.

// Class names Popup.js renders. Selectors may only be built from these.
export const POPUP_CSS_CLASSES = [
  '.kp-dialog', '.kp-eyebrow', '.kp-heading', '.kp-body', '.kp-image', '.kp-cta', '.kp-cta--secondary',
  '.kp-actions', '.kp-content', '.kp-dismiss',
];
export const POPUP_CSS_PSEUDO_CLASSES = [':hover', ':focus', ':focus-visible', ':active', ':first-child', ':last-child'];
export const POPUP_CSS_PSEUDO_ELEMENTS = ['::before', '::after', '::placeholder'];
// Elements of the (sanitized) body HTML, reachable only inside `.kp-body`.
export const POPUP_CSS_BODY_ELEMENTS = ['a', 'p', 'strong', 'em', 'ul', 'ol', 'li', 'h2', 'h3', 'h4'];

// Only the site's own font stacks (Design tab fonts). Lower-case family names.
export const POPUP_CSS_FONT_FAMILIES = ['plus jakarta sans', 'inter', 'system-ui', 'sans-serif', 'serif'];

export const POPUP_CSS_MEDIA_FEATURES = ['width (min-/max-, px/em/rem)', 'orientation', 'prefers-reduced-motion', 'prefers-color-scheme', 'hover'];

export const POPUP_CSS_MARGIN_LIMIT = 'no negative values; at most 64px / 4rem / 4em per side';

const SIDES = ['top', 'right', 'bottom', 'left'];
const sided = (p) => [p, ...SIDES.map((s) => `${p}-${s}`)];
const BORDER = [
  ...['border', ...SIDES.map((s) => `border-${s}`)].flatMap((b) => [b, `${b}-width`, `${b}-style`, `${b}-color`]),
  'border-radius', 'border-top-left-radius', 'border-top-right-radius', 'border-bottom-left-radius', 'border-bottom-right-radius',
];

export const POPUP_CSS_PROPERTY_GROUPS = [
  { label: 'Colour and background', props: ['color', 'background', 'background-color', 'background-image', 'background-size', 'background-position', 'background-repeat', 'opacity'] },
  { label: 'Borders and outline', props: [...BORDER, 'outline', 'outline-color', 'outline-style', 'outline-width', 'outline-offset'] },
  { label: 'Shadows and filters', props: ['box-shadow', 'text-shadow', 'filter', 'backdrop-filter', '-webkit-backdrop-filter'] },
  { label: 'Text', props: ['font-family', 'font-size', 'font-weight', 'font-style', 'line-height', 'letter-spacing', 'word-spacing', 'text-align', 'text-transform', 'text-decoration', 'text-decoration-color', 'text-decoration-thickness', 'text-decoration-style', 'text-decoration-line', 'text-underline-offset'] },
  { label: 'Spacing', props: [...sided('padding'), ...sided('margin'), 'gap', 'row-gap', 'column-gap', 'max-width'] },
  { label: 'Images', props: ['object-fit', 'object-position', 'aspect-ratio'] },
  { label: 'Motion', props: ['transition', 'transition-property', 'transition-duration', 'transition-delay', 'transition-timing-function', 'animation', 'animation-name', 'animation-duration', 'animation-delay', 'animation-timing-function', 'animation-iteration-count', 'animation-direction', 'animation-fill-mode', 'animation-play-state'] },
  { label: 'Other', props: ['cursor'] },
];
export const POPUP_CSS_ALLOWED_PROPERTIES = new Set(POPUP_CSS_PROPERTY_GROUPS.flatMap((g) => g.props));

// Never allowed (documented for the editor help and asserted by the tests). `content` is allowed only on
// ::before / ::after with a plain quoted string, so it is not listed here.
export const POPUP_CSS_FORBIDDEN_PROPERTIES = [
  'position', 'inset', 'top', 'right', 'bottom', 'left', 'z-index', 'width', 'height', 'min-width', 'min-height', 'max-height',
  'transform', 'translate', 'scale', 'rotate', 'float', 'display', 'visibility', 'pointer-events', 'clip-path', 'mask',
  'overflow', 'contain', 'isolation', 'will-change', 'all', 'zoom', 'resize', 'font', 'list-style', 'border-image',
  'content-visibility', '-webkit-text-fill-color',
];
