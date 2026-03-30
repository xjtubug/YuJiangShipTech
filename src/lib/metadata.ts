import type { Metadata } from 'next';
import { getDirectMinioUrl } from './image-utils';

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || 'https://www.yujiangshiptech.com';
const locales = ['en', 'zh', 'ja', 'ar'] as const;
type Locale = (typeof locales)[number];

// ─── Locale Helpers ─────────────────────────────────────────

const ogLocaleMap: Record<Locale, string> = {
  en: 'en_US',
  zh: 'zh_CN',
  ja: 'ja_JP',
  ar: 'ar_SA',
};

function buildAlternates(path: string, locale: string) {
  const canonical = `${SITE_URL}/${locale}${path}`;
  const languages: Record<string, string> = {};
  for (const loc of locales) {
    languages[loc] = `${SITE_URL}/${loc}${path}`;
  }
  languages['x-default'] = `${SITE_URL}/en${path}`;
  return { canonical, languages };
}

// ─── Product Metadata ───────────────────────────────────────

interface ProductMeta {
  name: string;
  description: string;
  slug: string;
  image?: string;
  price?: number;
  sku?: string;
}

export function getProductMetadata(
  product: ProductMeta,
  locale: string
): Metadata {
  const path = `/products/${product.slug}`;
  const title = product.name;
  const description = product.description.slice(0, 160);
  const imageUrl = product.image ? getDirectMinioUrl(product.image) : `${SITE_URL}/og-default.png`;

  return {
    title,
    description,
    alternates: buildAlternates(path, locale),
    openGraph: {
      title,
      description,
      url: `${SITE_URL}/${locale}${path}`,
      siteName: 'YuJiang ShipTechnology',
      locale: ogLocaleMap[locale as Locale] ?? 'en_US',
      type: 'website',
      images: [
        {
          url: imageUrl,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [imageUrl],
    },
  };
}

// ─── Static Page Metadata ───────────────────────────────────

interface PageMeta {
  title: string;
  description: string;
  path: string;
  image?: string;
}

export function getPageMetadata(page: PageMeta, locale: string): Metadata {
  const imageUrl = page.image ? getDirectMinioUrl(page.image) : `${SITE_URL}/og-default.png`;

  return {
    title: page.title,
    description: page.description,
    alternates: buildAlternates(page.path, locale),
    openGraph: {
      title: page.title,
      description: page.description,
      url: `${SITE_URL}/${locale}${page.path}`,
      siteName: 'YuJiang ShipTechnology',
      locale: ogLocaleMap[locale as Locale] ?? 'en_US',
      type: 'website',
      images: [
        {
          url: imageUrl,
          width: 1200,
          height: 630,
          alt: page.title,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: page.title,
      description: page.description,
      images: [imageUrl],
    },
  };
}

// ─── News Article Metadata ──────────────────────────────────

interface NewsMeta {
  title: string;
  description: string;
  slug: string;
  image?: string;
  publishedAt: string;
}

export function getNewsMetadata(article: NewsMeta, locale: string): Metadata {
  const path = `/news/${article.slug}`;
  const imageUrl = article.image ? getDirectMinioUrl(article.image) : `${SITE_URL}/og-default.png`;

  return {
    title: article.title,
    description: article.description.slice(0, 160),
    alternates: buildAlternates(path, locale),
    openGraph: {
      title: article.title,
      description: article.description.slice(0, 160),
      url: `${SITE_URL}/${locale}${path}`,
      siteName: 'YuJiang ShipTechnology',
      locale: ogLocaleMap[locale as Locale] ?? 'en_US',
      type: 'article',
      publishedTime: article.publishedAt,
      images: [
        {
          url: imageUrl,
          width: 1200,
          height: 630,
          alt: article.title,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: article.title,
      description: article.description.slice(0, 160),
      images: [imageUrl],
    },
  };
}
