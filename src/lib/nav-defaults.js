// Hard-coded navigation used when the nav_items table is empty or the database is unreachable.
// Order and labels follow the 2026 redesign (Home, Products, Investors, About, Contact).

export const DEFAULT_HEADER_NAV = [
  { id: 'd-home', label: 'Home', href: '/' },
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
  { id: 'd-about', label: 'About', href: '/about' },
  { id: 'd-contact', label: 'Contact', href: '/contact' },
];

// Footer: null means "render the original hard-coded footer link columns".
export const DEFAULT_FOOTER_NAV = null;
