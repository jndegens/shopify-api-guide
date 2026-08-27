import type { Metadata } from 'next';
import { Inter, JetBrains_Mono } from 'next/font/google';
import './globals.css';

const inter = Inter({ variable: '--font-inter', subsets: ['latin'] });
const mono = JetBrains_Mono({ variable: '--font-mono', subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Shopify koppelen aan AI — Dropship Academy',
  description: 'Een veilige, visuele stap-voor-stap handleiding om Shopify met een AI-tool te verbinden.',
  metadataBase: new URL('https://agents.dropshipacademy.nl'),
  openGraph: {
    title: 'Shopify koppelen aan AI — Dropship Academy',
    description: 'Veilig. Stap voor stap.',
    url: '/shopify-api',
    images: [{ url: '/shopify-api-social.png', width: 1200, height: 630, alt: 'Shopify koppelen aan AI — veilig en stap voor stap' }],
    locale: 'nl_NL',
    type: 'website',
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="nl"><body className={`${inter.variable} ${mono.variable}`}>{children}</body></html>;
}
