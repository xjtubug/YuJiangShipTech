import { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { notFound } from 'next/navigation';
import prisma from '@/lib/prisma';
import Breadcrumb from '@/components/layout/Breadcrumb';
import ProductDetail from '@/components/products/ProductDetail';
import CompareDrawer from '@/components/products/CompareDrawer';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  const product = await prisma.product.findUnique({
    where: { slug },
    select: {
      nameEn: true,
      nameZh: true,
      nameJa: true,
      nameAr: true,
      descEn: true,
      descZh: true,
      descJa: true,
      descAr: true,
      priceUsd: true,
      sku: true,
    },
  });

  if (!product) return { title: 'Product Not Found' };

  const nameKey = `name${locale.charAt(0).toUpperCase() + locale.slice(1)}` as keyof typeof product;
  const descKey = `desc${locale.charAt(0).toUpperCase() + locale.slice(1)}` as keyof typeof product;
  const name = (product[nameKey] as string) || product.nameEn;
  const description = (product[descKey] as string) || product.descEn;

  return {
    title: name,
    description: description.slice(0, 160),
    openGraph: {
      title: name,
      description: description.slice(0, 160),
      type: 'website',
    },
  };
}

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  const tNav = await getTranslations('nav');

  const product = await prisma.product.findUnique({
    where: { slug },
    include: {
      category: true,
      reviews: {
        where: { approved: true },
        orderBy: { createdAt: 'desc' },
      },
    },
  });

  if (!product || !product.published) {
    notFound();
  }

  // Fetch related products from same category
  const relatedProducts = await prisma.product.findMany({
    where: {
      categoryId: product.categoryId,
      published: true,
      id: { not: product.id },
    },
    include: { category: true },
    take: 4,
    orderBy: { createdAt: 'desc' },
  });

  // Localize names for breadcrumb
  const nameKey = `name${locale.charAt(0).toUpperCase() + locale.slice(1)}` as keyof typeof product;
  const catNameKey = `name${locale.charAt(0).toUpperCase() + locale.slice(1)}` as keyof typeof product.category;
  const productName = (product[nameKey] as string) || product.nameEn;
  const categoryName = (product.category[catNameKey] as string) || product.category.nameEn;

  // Serialize dates
  const serializedProduct = {
    ...product,
    createdAt: product.createdAt.toISOString(),
    updatedAt: product.updatedAt.toISOString(),
    category: {
      ...product.category,
      createdAt: product.category.createdAt.toISOString(),
    },
    reviews: product.reviews.map((r) => ({
      ...r,
      createdAt: r.createdAt.toISOString(),
    })),
  };

  const serializedRelated = relatedProducts.map((p) => ({
    ...p,
    createdAt: p.createdAt.toISOString(),
    updatedAt: p.updatedAt.toISOString(),
    category: {
      ...p.category,
      createdAt: p.category.createdAt.toISOString(),
    },
  }));

  // JSON-LD Product structured data
  const avgRating =
    product.reviews.length > 0
      ? product.reviews.reduce((s, r) => s + r.rating, 0) / product.reviews.length
      : undefined;

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.nameEn,
    description: product.descEn,
    sku: product.sku,
    brand: {
      '@type': 'Brand',
      name: 'YuJiang ShipTechnology',
    },
    offers: {
      '@type': 'Offer',
      priceCurrency: 'USD',
      price: product.priceUsd,
      availability: 'https://schema.org/InStock',
      seller: {
        '@type': 'Organization',
        name: 'YuJiang ShipTechnology',
      },
    },
    ...(avgRating
      ? {
          aggregateRating: {
            '@type': 'AggregateRating',
            ratingValue: avgRating.toFixed(1),
            reviewCount: product.reviews.length,
          },
        }
      : {}),
    ...(product.reviews.length > 0
      ? {
          review: product.reviews.map((r) => ({
            '@type': 'Review',
            author: { '@type': 'Person', name: r.author },
            reviewRating: {
              '@type': 'Rating',
              ratingValue: r.rating,
            },
            reviewBody: r.contentEn,
            datePublished: r.createdAt.toISOString(),
          })),
        }
      : {}),
  };

  // Breadcrumb
  const breadcrumbItems = [
    { label: tNav('products'), href: '/products' },
    { label: categoryName, href: `/products?category=${product.category.slug}` },
    { label: productName },
  ];

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="bg-gradient-to-b from-primary-50 to-white">
        <div className="container-wide">
          <Breadcrumb items={breadcrumbItems} />
        </div>
      </div>

      <div className="container-wide section-padding">
        <ProductDetail
          product={serializedProduct}
          relatedProducts={serializedRelated}
          locale={locale}
        />
      </div>

      <CompareDrawer locale={locale} />
    </>
  );
}
