import type { Metadata } from 'next';
import { Be_Vietnam_Pro, Cormorant_Garamond } from 'next/font/google';

import './globals.css';
import { AuthProvider } from '@/components/auth/auth-provider';

const sans = Be_Vietnam_Pro({
  variable: '--font-sans-custom',
  subsets: ['latin', 'vietnamese'],
  weight: ['400', '500', '600', '700'],
});

const heading = Cormorant_Garamond({
  variable: '--font-heading-custom',
  subsets: ['latin', 'vietnamese'],
  weight: ['500', '600', '700'],
});

export const metadata: Metadata = {
  metadataBase: new URL(
    'https://net-fashion-commerce-2026.ltdunggg.chatgpt.site',
  ),
  title: {
    default: 'NÉT — Thời trang tối giản cho người Việt',
    template: '%s | NÉT',
  },
  description:
    'Thời trang hiện đại, phom dáng phù hợp người Việt, đổi size trong 30 ngày và giao hàng toàn quốc.',
  openGraph: {
    url: 'https://net-fashion-commerce-2026.ltdunggg.chatgpt.site',
    title: 'NÉT — Mặc đúng chất, sống đúng nhịp',
    description: 'Thời trang tối giản, phom dáng phù hợp người Việt.',
    type: 'website',
    locale: 'vi_VN',
    images: [
      {
        url: '/og.png',
        width: 1200,
        height: 630,
        alt: 'NÉT — Mặc đúng chất, sống đúng nhịp',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'NÉT — Mặc đúng chất, sống đúng nhịp',
    description: 'Thời trang tối giản, phom dáng phù hợp người Việt.',
    images: ['/og.png'],
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="vi">
      <body className={`${sans.variable} ${heading.variable} antialiased`}>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
