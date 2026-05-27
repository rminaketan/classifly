import './globals.css';
import type { Metadata, Viewport } from 'next';

export const metadata: Metadata = {
  title: { default: 'Classifly.in — Buy, Sell, Hire, Find Services', template: '%s · Classifly.in' },
  description:
    'India\'s next-generation marketplace. Buy and sell goods, find jobs, book trusted local services.',
  openGraph: {
    title: 'Classifly.in',
    description: 'India\'s next-generation marketplace.',
    url: 'https://classifly.in',
    siteName: 'Classifly.in',
    type: 'website',
    locale: 'en_IN',
  },
};

export const viewport: Viewport = {
  themeColor: '#1F3A5F',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Noto+Sans+Devanagari:wght@400;500;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen">{children}</body>
    </html>
  );
}
