import type { Metadata, Viewport } from 'next';
import { EB_Garamond, Nunito_Sans } from 'next/font/google';
import './globals.css';

const garamond = EB_Garamond({
  variable: '--font-garamond',
  subsets: ['latin'],
  weight: ['400', '700'],
  style: ['normal', 'italic'],
});

// Stand-in for Wix's licensed "Avenir LT 35 Light", used only in form fields and buttons.
const sans = Nunito_Sans({
  variable: '--font-sans',
  subsets: ['latin'],
  weight: ['300', '400'],
});

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.austinunion.org';

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: 'HOME | Austin Union', template: '%s | Austin Union' },
  description: 'The Austin Union Society — a student-run debate society at the University of Austin. Truth through debate.',
  openGraph: { siteName: 'Austin Union', type: 'website' },
  twitter: { card: 'summary_large_image', site: '@austin_union' },
};

export const viewport: Viewport = {
  themeColor: '#7f1f20',
};

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html lang="en" className={`${garamond.variable} ${sans.variable}`}>
      <body>{children}</body>
    </html>
  );
}
