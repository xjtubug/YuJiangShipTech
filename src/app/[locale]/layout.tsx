import type { Metadata } from 'next';
import localFont from 'next/font/local';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { notFound } from 'next/navigation';

import { routing } from '@/i18n/routing';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import WhatsAppFloat from '@/components/common/WhatsAppFloat';
import CookieConsent from '@/components/common/CookieConsent';
import SocialFloat from '@/components/common/SocialFloat';
import TrackingScripts from '@/components/common/TrackingScripts';
import VisitorTracker from '@/components/common/VisitorTracker';
import { OrganizationSchema, WebSiteSchema } from '@/components/common/StructuredData';
import { Toaster } from 'react-hot-toast';
import prisma from '@/lib/prisma';
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

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || 'https://www.yujiangshiptech.com';

export const metadata: Metadata = {
  title: {
    template: '%s | YuJiang ShipTechnology',
    default: 'YuJiang ShipTechnology – Marine Equipment & Ship Supplies',
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
  metadataBase: new URL(SITE_URL),
  alternates: {
    canonical: SITE_URL,
    languages: {
      en: `${SITE_URL}/en`,
      zh: `${SITE_URL}/zh`,
      ja: `${SITE_URL}/ja`,
      ar: `${SITE_URL}/ar`,
      'x-default': `${SITE_URL}/en`,
    },
  },
  openGraph: {
    type: 'website',
    siteName: 'YuJiang ShipTechnology',
    locale: 'en_US',
    images: [
      {
        url: `${SITE_URL}/og-default.png`,
        width: 1200,
        height: 630,
        alt: 'YuJiang ShipTechnology – Marine Equipment',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'YuJiang ShipTechnology – Marine Equipment & Ship Supplies',
    description:
      'Leading B2B supplier of marine equipment, ship spare parts, and vessel supplies.',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
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
  const logoSetting = await prisma.siteSettings.findUnique({
    where: { key: 'company_logo' },
    select: { value: true },
  });
  const logoUrl = logoSetting?.value || null;

  return (
    <div
      lang={locale}
      dir={isRtl ? 'rtl' : 'ltr'}
      className={`${geistSans.variable} ${geistMono.variable} antialiased`}
    >
      <NextIntlClientProvider messages={messages}>
        <OrganizationSchema />
        <WebSiteSchema locale={locale} />
        <Header initialLogoUrl={logoUrl} />
        <main className="min-h-screen">{children}</main>
        <Footer />
        <WhatsAppFloat />
        <SocialFloat />
        <CookieConsent />
        <TrackingScripts />
        <VisitorTracker />
        <Toaster position="top-right" toastOptions={{ duration: 5000 }} />
      </NextIntlClientProvider>
    </div>
  );
}
