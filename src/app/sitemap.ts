import type { MetadataRoute } from 'next';
import prisma from '@/lib/prisma';

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || 'https://www.yujiangshiptech.com';
const locales = ['en', 'zh', 'ja', 'ar'] as const;

export const dynamic = 'force-dynamic';

function alternatesForPath(path: string) {
  const languages: Record<string, string> = {};
  for (const loc of locales) {
    languages[loc] = `${SITE_URL}/${loc}${path}`;
  }
  languages['x-default'] = `${SITE_URL}/en${path}`;
  return { languages };
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  let products: { slug: string; updatedAt: Date }[] = [];
  let categories: { slug: string; createdAt: Date }[] = [];
  let news: { slug: string; createdAt: Date }[] = [];
  let cases: { slug: string; createdAt: Date }[] = [];

  try {
    [products, categories, news, cases] = await Promise.all([
      prisma.product.findMany({
        where: { published: true },
        select: { slug: true, updatedAt: true },
      }),
      prisma.category.findMany({ select: { slug: true, createdAt: true } }),
      prisma.news.findMany({
        where: { published: true },
        select: { slug: true, createdAt: true },
      }),
      prisma.caseStudy.findMany({ select: { slug: true, createdAt: true } }),
    ]);
  } catch {
    // Database may not be available during build
  }

  // ── Static pages ──────────────────────────────────────────
  const staticPages: {
    path: string;
    changeFrequency: MetadataRoute.Sitemap[number]['changeFrequency'];
    priority: number;
  }[] = [
    { path: '', changeFrequency: 'daily', priority: 1.0 },
    { path: '/products', changeFrequency: 'daily', priority: 0.9 },
    { path: '/about', changeFrequency: 'monthly', priority: 0.7 },
    { path: '/contact', changeFrequency: 'monthly', priority: 0.7 },
    { path: '/quote', changeFrequency: 'monthly', priority: 0.8 },
    { path: '/news', changeFrequency: 'daily', priority: 0.8 },
    { path: '/cases', changeFrequency: 'weekly', priority: 0.7 },
    { path: '/certificates', changeFrequency: 'monthly', priority: 0.5 },
  ];

  const staticEntries: MetadataRoute.Sitemap = staticPages.flatMap((page) =>
    locales.map((locale) => ({
      url: `${SITE_URL}/${locale}${page.path}`,
      lastModified: new Date(),
      changeFrequency: page.changeFrequency,
      priority: page.priority,
      alternates: alternatesForPath(page.path),
    }))
  );

  // ── Product detail pages ──────────────────────────────────
  const productEntries: MetadataRoute.Sitemap = products.flatMap((product) =>
    locales.map((locale) => ({
      url: `${SITE_URL}/${locale}/products/${product.slug}`,
      lastModified: product.updatedAt,
      changeFrequency: 'weekly' as const,
      priority: 0.7,
      alternates: alternatesForPath(`/products/${product.slug}`),
    }))
  );

  // ── Category pages ────────────────────────────────────────
  const categoryEntries: MetadataRoute.Sitemap = categories.flatMap(
    (category) =>
      locales.map((locale) => ({
        url: `${SITE_URL}/${locale}/products/category/${category.slug}`,
        lastModified: category.createdAt,
        changeFrequency: 'weekly' as const,
        priority: 0.6,
        alternates: alternatesForPath(`/products/category/${category.slug}`),
      }))
  );

  // ── News articles ─────────────────────────────────────────
  const newsEntries: MetadataRoute.Sitemap = news.flatMap((article) =>
    locales.map((locale) => ({
      url: `${SITE_URL}/${locale}/news/${article.slug}`,
      lastModified: article.createdAt,
      changeFrequency: 'monthly' as const,
      priority: 0.6,
      alternates: alternatesForPath(`/news/${article.slug}`),
    }))
  );

  // ── Case studies ──────────────────────────────────────────
  const caseEntries: MetadataRoute.Sitemap = cases.flatMap((cs) =>
    locales.map((locale) => ({
      url: `${SITE_URL}/${locale}/cases/${cs.slug}`,
      lastModified: cs.createdAt,
      changeFrequency: 'monthly' as const,
      priority: 0.6,
      alternates: alternatesForPath(`/cases/${cs.slug}`),
    }))
  );

  return [
    ...staticEntries,
    ...productEntries,
    ...categoryEntries,
    ...newsEntries,
    ...caseEntries,
  ];
}
