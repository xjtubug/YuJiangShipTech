import { getTranslations } from 'next-intl/server';
import type { Metadata } from 'next';
import dynamic from 'next/dynamic';
import prisma from '@/lib/prisma';
import Breadcrumb from '@/components/layout/Breadcrumb';

const QuoteForm = dynamic(() => import('@/components/quote/QuoteForm'), {
  loading: () => <div className="animate-pulse bg-slate-100 rounded-2xl h-[500px]" />,
});
const InquiryCartSidebar = dynamic(() => import('@/components/quote/InquiryCartSidebar'), {
  ssr: false,
  loading: () => <div className="animate-pulse bg-slate-100 rounded-2xl h-64" />,
});

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('inquiry');
  return {
    title: t('title'),
    description: t('subtitle'),
    openGraph: {
      title: t('title'),
      description: t('subtitle'),
    },
  };
}

export default async function QuotePage() {
  const t = await getTranslations('inquiry');
  const navT = await getTranslations('nav');

  const [products, categories] = await Promise.all([
    prisma.product.findMany({
      where: { published: true },
      select: {
        id: true,
        nameEn: true,
        nameZh: true,
        nameJa: true,
        nameAr: true,
        sku: true,
        categoryId: true,
      },
      orderBy: { nameEn: 'asc' },
    }),
    prisma.category.findMany({
      select: {
        id: true,
        slug: true,
        nameEn: true,
        nameZh: true,
        nameJa: true,
        nameAr: true,
        parentId: true,
        children: {
          select: {
            id: true,
            slug: true,
            nameEn: true,
            nameZh: true,
            nameJa: true,
            nameAr: true,
            parentId: true,
          },
          orderBy: { nameEn: 'asc' },
        },
      },
      where: { parentId: null },
      orderBy: { nameEn: 'asc' },
    }),
  ]);

  const serializedProducts = products.map((p) => ({
    id: p.id,
    nameEn: p.nameEn,
    nameZh: p.nameZh,
    nameJa: p.nameJa,
    nameAr: p.nameAr,
    sku: p.sku,
    categoryId: p.categoryId,
  }));

  const serializedCategories = categories.map((c) => ({
    id: c.id,
    slug: c.slug,
    nameEn: c.nameEn,
    nameZh: c.nameZh,
    nameJa: c.nameJa,
    nameAr: c.nameAr,
    parentId: c.parentId,
    children: c.children.map((ch) => ({
      id: ch.id,
      slug: ch.slug,
      nameEn: ch.nameEn,
      nameZh: ch.nameZh,
      nameJa: ch.nameJa,
      nameAr: ch.nameAr,
      parentId: ch.parentId,
    })),
  }));

  return (
    <>
      {/* Hero Banner */}
      <section className="relative bg-gradient-to-br from-primary-900 via-primary-800 to-secondary-900 py-20 md:py-28">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(14,165,233,0.2),transparent_60%)]" />
        <div className="container-wide relative z-10">
          <Breadcrumb items={[{ label: navT('quote') }]} />
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white tracking-tight mt-4">
            {t('title')}
          </h1>
          <p className="mt-4 text-lg md:text-xl text-slate-300 max-w-2xl">
            {t('subtitle')}
          </p>
        </div>
      </section>

      <section className="section-padding bg-white">
        <div className="container-wide">
          <div className="grid lg:grid-cols-3 gap-10">
            {/* Main Quote Form */}
            <div className="lg:col-span-2">
              <QuoteForm products={serializedProducts} categories={serializedCategories} />
            </div>
            {/* Inquiry Cart Sidebar */}
            <div className="lg:col-span-1">
              <InquiryCartSidebar />
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
