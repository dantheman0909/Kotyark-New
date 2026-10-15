// Hard-coded navigation used when the nav_items table is empty or the database is unreachable.
// Keep in step with the original site navigation so an empty CMS never changes the live site.

export const DEFAULT_HEADER_NAV = [
  { id: 'd-home', label: 'Home', href: '/' },
  { id: 'd-about', label: 'About Us', href: '/about' },
  {
    id: 'd-products',
    label: 'Products',
    href: '/products',
    children: [
      { id: 'd-biodiesel', label: 'Biodiesel', href: '/products/biodiesel' },
      { id: 'd-glycerin', label: 'Crude Glycerin', href: '/products/crude-glycerin' },
    ],
  },
  { id: 'd-investors', label: 'Investors', href: '/investors' },
  { id: 'd-contact', label: 'Contact', href: '/contact' },
];

// Footer: null means "render the original hard-coded footer link columns".
export const DEFAULT_FOOTER_NAV = null;
