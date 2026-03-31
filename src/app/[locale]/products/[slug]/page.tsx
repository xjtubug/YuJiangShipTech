import { Metadata } from 'next';
import dynamic from 'next/dynamic';
import { getTranslations } from 'next-intl/server';
import { notFound } from 'next/navigation';
import prisma from '@/lib/prisma';
import { getProductMetadata } from '@/lib/metadata';
import { ProductSchema, BreadcrumbSchema } from '@/components/common/StructuredData';
import Breadcrumb from '@/components/layout/Breadcrumb';
import ProductDetail from '@/components/products/ProductDetail';

const CompareDrawer = dynamic(() => import('@/components/products/CompareDrawer'), { ssr: false });
export const revalidate = 300;

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || 'https://www.yujiangshiptech.com';

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
      images: true,
      slug: true,
    },
  });

  if (!product) return { title: 'Product Not Found' };

  const nameKey = `name${locale.charAt(0).toUpperCase() + locale.slice(1)}` as keyof typeof product;
  const descKey = `desc${locale.charAt(0).toUpperCase() + locale.slice(1)}` as keyof typeof product;
  const name = (product[nameKey] as string) || product.nameEn;
  const description = (product[descKey] as string) || product.descEn;

  let firstImage: string | undefined;
  try {
    const imgs = JSON.parse(product.images);
    if (Array.isArray(imgs) && imgs.length > 0) firstImage = imgs[0];
  } catch { /* ignore */ }

  return getProductMetadata(
    { name, description, slug: product.slug, image: firstImage, price: product.priceUsd, sku: product.sku },
    locale
  );
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
      expertReviews: {
        include: {
          expert: {
            select: { id: true, name: true, avatar: true, bio: true, title: true },
          },
        },
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
    expertReviews: product.expertReviews.map((er) => ({
      ...er,
      createdAt: er.createdAt.toISOString(),
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

  let productImage: string | undefined;
  try {
    const imgs = JSON.parse(product.images);
    if (Array.isArray(imgs) && imgs.length > 0) productImage = imgs[0];
  } catch { /* ignore */ }

  // Breadcrumb
  const breadcrumbItems = [
    { label: tNav('products'), href: '/products' },
    { label: categoryName, href: `/products?category=${product.category.slug}` },
    { label: productName },
  ];

  return (
    <>
      <ProductSchema
        name={productName}
        description={(product.descEn || '').slice(0, 300)}
        sku={product.sku}
        image={productImage}
        price={product.priceUsd}
        url={`${SITE_URL}/${locale}/products/${slug}`}
        category={categoryName}
        rating={avgRating ? { value: avgRating, count: product.reviews.length } : undefined}
        reviews={product.reviews.map((r) => ({
          author: r.author,
          rating: r.rating,
          body: r.contentEn,
          date: r.createdAt.toISOString(),
        }))}
      />
      <BreadcrumbSchema
        items={[
          { name: tNav('products'), url: '/products' },
          { name: categoryName, url: `/products?category=${product.category.slug}` },
          { name: productName },
        ]}
        locale={locale}
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
