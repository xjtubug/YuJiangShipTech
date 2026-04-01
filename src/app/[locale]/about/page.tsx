import { getTranslations } from 'next-intl/server';
import type { Metadata } from 'next';
import dynamic from 'next/dynamic';
import prisma from '@/lib/prisma';
import Breadcrumb from '@/components/layout/Breadcrumb';

const loadingBlock = (bg = 'bg-white') => ({
  loading: () => <div className={`section-padding ${bg}`}><div className="container-wide h-48 animate-pulse bg-slate-100 rounded-2xl" /></div>,
});

const CompanyIntro = dynamic(() => import('@/components/about/CompanyIntro'), { ssr: false, ...loadingBlock() });
const FactorySection = dynamic(() => import('@/components/about/FactorySection'), { ssr: false, ...loadingBlock('bg-slate-50') });
const TeamSection = dynamic(() => import('@/components/about/TeamSection'), { ssr: false, ...loadingBlock() });
const CertificatesSection = dynamic(() => import('@/components/about/CertificatesSection'), { ssr: false, ...loadingBlock('bg-slate-50') });
const LocationMapSection = dynamic(() => import('@/components/about/LocationMapSection'), { ssr: false, ...loadingBlock() });
const CaseStudySection = dynamic(() => import('@/components/home/CaseStudySection'), { ssr: false, ...loadingBlock() });

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('about');
  return {
    title: t('title'),
    description: t('companyDesc'),
    openGraph: {
      title: t('title'),
      description: t('subtitle'),
    },
  };
}

export default async function AboutPage() {
  const t = await getTranslations('about');
  const navT = await getTranslations('nav');

  const [certificates, cases] = await Promise.all([
    prisma.certificate.findMany({
      orderBy: { createdAt: 'desc' },
    }),
    prisma.caseStudy.findMany({
      orderBy: { createdAt: 'desc' },
    }),
  ]);

  const serializedCertificates = certificates.map((c) => ({
    ...c,
    validUntil: c.validUntil?.toISOString() ?? null,
    createdAt: c.createdAt.toISOString(),
  }));

  const serializedCases = cases.map((c) => ({
    ...c,
    createdAt: c.createdAt.toISOString(),
  }));

  return (
    <>
      {/* Hero Banner */}
      <section className="relative bg-gradient-to-br from-primary-900 via-primary-800 to-secondary-900 py-20 md:py-28">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(14,165,233,0.2),transparent_60%)]" />
        <div className="container-wide relative z-10">
          <Breadcrumb items={[{ label: navT('about') }]} />
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white tracking-tight mt-4">
            {t('title')}
          </h1>
          <p className="mt-4 text-lg md:text-xl text-slate-300 max-w-2xl">
            {t('subtitle')}
          </p>
        </div>
      </section>

      <CompanyIntro />
      <FactorySection />
      <LocationMapSection />
      <TeamSection />
      <CaseStudySection cases={serializedCases} />
      <CertificatesSection certificates={serializedCertificates} />
    </>
  );
}
