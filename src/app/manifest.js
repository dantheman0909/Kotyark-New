// Web app manifest (served at /manifest.webmanifest).
export default function manifest() {
  return {
    name: 'Kotyark Industries Limited',
    short_name: 'Kotyark',
    description: 'B100 biodiesel from non-edible oils. Investor relations for NSE: KOTYARK.',
    start_url: '/',
    display: 'standalone',
    theme_color: '#0D1411',
    background_color: '#0D1411',
    icons: [
      { src: '/android-chrome-192x192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/android-chrome-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
    ],
  };
}
