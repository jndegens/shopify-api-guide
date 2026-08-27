import type { Metadata } from 'next';
import { Inter, JetBrains_Mono, Sora } from 'next/font/google';
import './globals.css';

const inter = Inter({ variable: '--font-inter', subsets: ['latin'] });
const mono = JetBrains_Mono({ variable: '--font-mono', subsets: ['latin'] });
const sora = Sora({ variable: '--font-sora', subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Permanente Shopify API-token maken — Dropship Academy',
  description: 'Maak stap voor stap een permanente Shopify Admin API-token voor je eigen store.',
  metadataBase: new URL('https://agents.dropshipacademy.nl'),
  openGraph: {
    title: 'Permanente Shopify API-token maken — Dropship Academy',
    description: 'Kort, duidelijk en stap voor stap.',
    url: '/shopify-api',
    images: [{ url: '/shopify-api-social.png', width: 1200, height: 630, alt: 'Permanente Shopify API-token maken met Dropship Academy' }],
    locale: 'nl_NL',
    type: 'website',
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="nl"><body className={`${inter.variable} ${mono.variable} ${sora.variable}`}>{children}</body></html>;
}
