import { getTranslations } from 'next-intl/server';
import prisma from '@/lib/prisma';
import HeroSection from '@/components/home/HeroSection';
import FeaturedProducts from '@/components/home/FeaturedProducts';
import AdvantagesSection from '@/components/home/AdvantagesSection';
import CaseStudySection from '@/components/home/CaseStudySection';
import CertificationsSection from '@/components/home/CertificationsSection';
import NewsSection from '@/components/home/NewsSection';
import SearchSection from '@/components/home/SearchSection';

export default async function HomePage() {
  const t = await getTranslations('common');

  const [products, news, cases, certificates] = await Promise.all([
    prisma.product.findMany({
      where: { featured: true, published: true },
      include: { category: true },
      orderBy: { createdAt: 'desc' },
      take: 8,
    }),
    prisma.news.findMany({
      where: { published: true },
      orderBy: { createdAt: 'desc' },
      take: 3,
    }),
    prisma.caseStudy.findMany({
      orderBy: { createdAt: 'desc' },
      take: 3,
    }),
    prisma.certificate.findMany({
      orderBy: { createdAt: 'desc' },
    }),
  ]);

  // Serialize dates for client components
  const serializedProducts = products.map((p) => ({
    ...p,
    createdAt: p.createdAt.toISOString(),
    updatedAt: p.updatedAt.toISOString(),
    category: {
      ...p.category,
      createdAt: p.category.createdAt.toISOString(),
    },
  }));

  const serializedNews = news.map((n) => ({
    ...n,
    createdAt: n.createdAt.toISOString(),
  }));

  const serializedCases = cases.map((c) => ({
    ...c,
    createdAt: c.createdAt.toISOString(),
  }));

  const serializedCertificates = certificates.map((c) => ({
    ...c,
    validUntil: c.validUntil?.toISOString() ?? null,
    createdAt: c.createdAt.toISOString(),
  }));

  // JSON-LD structured data for featured products
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: t('companyName'),
    description: t('tagline'),
    numberOfItems: serializedProducts.length,
    itemListElement: serializedProducts.map((p, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      item: {
        '@type': 'Product',
        name: p.nameEn,
        sku: p.sku,
        description: p.descEn,
        image: undefined,
        offers: {
          '@type': 'Offer',
          priceCurrency: 'USD',
          price: p.priceUsd,
          availability: 'https://schema.org/InStock',
        },
      },
    })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <HeroSection />
      <FeaturedProducts products={serializedProducts} />
      <SearchSection />
      <AdvantagesSection />
      <CaseStudySection cases={serializedCases} />
      <CertificationsSection certificates={serializedCertificates} />
      <NewsSection news={serializedNews} />
    </>
  );
}
