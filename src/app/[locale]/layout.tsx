import type { Metadata } from 'next';
import localFont from 'next/font/local';
import dynamic from 'next/dynamic';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { notFound } from 'next/navigation';

import { routing } from '@/i18n/routing';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { OrganizationSchema, WebSiteSchema } from '@/components/common/StructuredData';
import prisma from '@/lib/prisma';
import '../globals.css';

// Lazy-load client-only widgets to reduce initial bundle size
const SmartChatWidget = dynamic(() => import('@/components/common/SmartChatWidget'), { ssr: false });
const SocialFloat = dynamic(() => import('@/components/common/SocialFloat'), { ssr: false });
const CookieConsent = dynamic(() => import('@/components/common/CookieConsent'), { ssr: false });
const TrackingScripts = dynamic(() => import('@/components/common/TrackingScripts'), { ssr: false });
const VisitorTracker = dynamic(() => import('@/components/common/VisitorTracker'), { ssr: false });
const Toaster = dynamic(() => import('react-hot-toast').then((mod) => mod.Toaster), { ssr: false });
const RouteProgress = dynamic(() => import('@/components/common/RouteProgress'), { ssr: false });

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
        <RouteProgress />
        <OrganizationSchema />
        <WebSiteSchema locale={locale} />
        <Header initialLogoUrl={logoUrl} />
        <main className="min-h-screen">{children}</main>
        <Footer />
        <SmartChatWidget />
        <SocialFloat />
        <CookieConsent />
        <TrackingScripts />
        <VisitorTracker />
        <Toaster position="top-right" toastOptions={{ duration: 5000 }} />
      </NextIntlClientProvider>
    </div>
  );
}
