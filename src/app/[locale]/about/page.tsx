import { getTranslations } from 'next-intl/server';
import type { Metadata } from 'next';
import prisma from '@/lib/prisma';
import Breadcrumb from '@/components/layout/Breadcrumb';
import CompanyIntro from '@/components/about/CompanyIntro';
import FactorySection from '@/components/about/FactorySection';
import TeamSection from '@/components/about/TeamSection';
import CertificatesSection from '@/components/about/CertificatesSection';

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

  const certificates = await prisma.certificate.findMany({
    orderBy: { createdAt: 'desc' },
  });

  const serializedCertificates = certificates.map((c) => ({
    ...c,
    validUntil: c.validUntil?.toISOString() ?? null,
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
      <TeamSection />
      <CertificatesSection certificates={serializedCertificates} />
    </>
  );
}
