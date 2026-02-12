import './globals.css';
import LayoutShell from '@/components/LayoutShell';

export const metadata = {
  title: {
    default: 'Kotyark Industries - Leading Biodiesel Manufacturer India',
    template: '%s | Kotyark Industries',
  },
  description: "India's approved biodiesel manufacturer. 480,000 KL capacity. Carbon neutral fuel for transport & industry. BSE listed. Get a quote today.",
  keywords: ['biodiesel manufacturer India', 'biofuel', 'biodiesel', 'crude glycerin', 'renewable energy India', 'Kotyark Industries', 'B100 biodiesel', 'carbon neutral fuel'],
  authors: [{ name: 'Kotyark Industries Limited' }],
  creator: 'Kotyark Industries Limited',
  publisher: 'Kotyark Industries Limited',
  metadataBase: new URL('https://kotyark.com'),
  openGraph: {
    title: 'Kotyark Industries - Leading Biodiesel Manufacturer India',
    description: "India's approved biodiesel manufacturer with 480,000 KL capacity. Carbon neutral fuel solutions.",
    url: 'https://kotyark.com',
    siteName: 'Kotyark Industries',
    locale: 'en_IN',
    type: 'website',
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <LayoutShell>{children}</LayoutShell>
      </body>
    </html>
  );
}

