import type { Metadata } from 'next';
import localFont from 'next/font/local';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { notFound } from 'next/navigation';

import { routing } from '@/i18n/routing';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import SearchOverlay from '@/components/layout/SearchOverlay';
import WhatsAppFloat from '@/components/common/WhatsAppFloat';
import CookieConsent from '@/components/common/CookieConsent';
import SocialFloat from '@/components/common/SocialFloat';
import TrackingScripts from '@/components/common/TrackingScripts';
import VisitorTracker from '@/components/common/VisitorTracker';
import { Toaster } from 'react-hot-toast';
import '../globals.css';

const geistSans = localFont({
  src: '../fonts/GeistVF.woff',
  variable: '--font-geist-sans',
  weight: '100 900',
});

const geistMono = localFont({
  src: '../fonts/GeistMonoVF.woff',
  variable: '--font-geist-mono',
  weight: '100 900',
});

export const metadata: Metadata = {
  title: {
    template: '%s | YuJiang Ship Technology',
    default: 'YuJiang Ship Technology – Marine Equipment & Ship Supplies',
  },
  description:
    'Leading B2B supplier of marine equipment, ship spare parts, and vessel supplies. Serving shipyards, fleet operators, and maritime companies worldwide.',
  keywords: [
    'marine equipment',
    'ship supplies',
    'vessel spare parts',
    'maritime B2B',
    'ship chandler',
    'deck machinery',
    'marine safety equipment',
  ],
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL || 'https://www.yujiang-shiptech.com'
  ),
  openGraph: {
    type: 'website',
    siteName: 'YuJiang Ship Technology',
    locale: 'en_US',
  },
  robots: {
    index: true,
    follow: true,
  },
};

const organizationJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'YuJiang Ship Technology',
  url: process.env.NEXT_PUBLIC_SITE_URL || 'https://www.yujiang-shiptech.com',
  logo: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://www.yujiang-shiptech.com'}/logo.png`,
  description:
    'Leading B2B supplier of marine equipment, ship spare parts, and vessel supplies.',
  contactPoint: {
    '@type': 'ContactPoint',
    telephone: '+86-574-8600-0000',
    contactType: 'sales',
    email: 'sales@yujiang-shiptech.com',
    availableLanguage: ['English', 'Chinese', 'Japanese', 'Arabic'],
  },
  address: {
    '@type': 'PostalAddress',
    addressLocality: 'Ningbo',
    addressRegion: 'Zhejiang',
    addressCountry: 'CN',
  },
  sameAs: [
    'https://www.linkedin.com/company/yujiang-shiptech',
    'https://www.youtube.com/@yujiang-shiptech',
  ],
};

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  if (!routing.locales.includes(locale as (typeof routing.locales)[number])) {
    notFound();
  }

  const messages = await getMessages();
  const isRtl = locale === 'ar';

  return (
    <html lang={locale} dir={isRtl ? 'rtl' : 'ltr'}>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(organizationJsonLd),
          }}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <NextIntlClientProvider messages={messages}>
          <Header />
          <SearchOverlay />
          <main className="min-h-screen">{children}</main>
          <Footer />
          <WhatsAppFloat />
          <SocialFloat />
          <CookieConsent />
          <TrackingScripts />
          <VisitorTracker />
          <Toaster position="top-right" toastOptions={{ duration: 5000 }} />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
