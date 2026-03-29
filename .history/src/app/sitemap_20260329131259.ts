import type { MetadataRoute } from 'next';
import prisma from '@/lib/prisma';

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || 'https://www.yujiang-shiptech.com';
const locales = ['en', 'zh', 'ja', 'ar'];

export const dynamic = 'force-dynamic';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  let products: { slug: string; updatedAt: Date }[] = [];
  let categories: { slug: string; createdAt: Date }[] = [];

  try {
    [products, categories] = await Promise.all([
      prisma.product.findMany({ select: { slug: true, updatedAt: true } }),
      prisma.category.findMany({ select: { slug: true, createdAt: true } }),
    ]);
  } catch {
    // Database may not be available during build
  }

  const staticPages = ['', '/about', '/contact', '/products', '/quote'];

  const staticEntries: MetadataRoute.Sitemap = staticPages.flatMap((page) =>
    locales.map((locale) => ({
      url: `${SITE_URL}/${locale}${page}`,
      lastModified: new Date(),
      changeFrequency: page === '' ? ('daily' as const) : ('weekly' as const),
      priority: page === '' ? 1 : 0.8,
    }))
  );

  const productEntries: MetadataRoute.Sitemap = products.flatMap((product) =>
    locales.map((locale) => ({
      url: `${SITE_URL}/${locale}/products/${product.slug}`,
      lastModified: product.updatedAt,
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    }))
  );

  const categoryEntries: MetadataRoute.Sitemap = categories.flatMap(
    (category) =>
      locales.map((locale) => ({
        url: `${SITE_URL}/${locale}/products/category/${category.slug}`,
        lastModified: category.createdAt,
        changeFrequency: 'weekly' as const,
        priority: 0.6,
      }))
  );

  return [...staticEntries, ...productEntries, ...categoryEntries];
}
