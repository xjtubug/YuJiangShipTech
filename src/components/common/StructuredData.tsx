import React from 'react';
import { getDirectMinioUrl } from '@/lib/image-utils';

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || 'https://www.yujiangshiptech.com';

// ─── Schema Types ───────────────────────────────────────────

interface BreadcrumbItem {
  name: string;
  url?: string;
}

interface ProductSchemaProps {
  name: string;
  description: string;
  sku: string;
  image?: string;
  price: number;
  currency?: string;
  brand?: string;
  category?: string;
  url: string;
  rating?: { value: number; count: number };
  reviews?: {
    author: string;
    rating: number;
    body: string;
    date: string;
  }[];
}

interface FAQItem {
  question: string;
  answer: string;
}

// ─── Helper ─────────────────────────────────────────────────

function JsonLd({ data }: { data: Record<string, unknown> }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

// ─── Organization ───────────────────────────────────────────

export function OrganizationSchema() {
  const data = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'YuJiang ShipTechnology',
    url: SITE_URL,
    logo: `${SITE_URL}/logo.png`,
    description:
      'Leading B2B supplier of marine equipment, ship spare parts, and vessel supplies.',
    contactPoint: {
      '@type': 'ContactPoint',
      telephone: '+86-574-8600-0000',
      contactType: 'sales',
      email: 'sales@yujiangshiptech.com',
      availableLanguage: ['English', 'Chinese', 'Japanese', 'Arabic'],
    },
    address: {
      '@type': 'PostalAddress',
      addressLocality: 'Ningbo',
      addressRegion: 'Zhejiang',
      addressCountry: 'CN',
    },
    sameAs: [
      'https://www.linkedin.com/company/yujiang-shiptech',
      'https://www.youtube.com/@yujiang-shiptech',
    ],
  };

  return <JsonLd data={data} />;
}

// ─── WebSite with SearchAction ──────────────────────────────

export function WebSiteSchema({ locale = 'en' }: { locale?: string }) {
  const data = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'YuJiang ShipTechnology',
    url: `${SITE_URL}/${locale}`,
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${SITE_URL}/${locale}/products?search={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  };

  return <JsonLd data={data} />;
}

// ─── Product ────────────────────────────────────────────────

export function ProductSchema(props: ProductSchemaProps) {
  const data: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: props.name,
    description: props.description,
    sku: props.sku,
    url: props.url,
    brand: {
      '@type': 'Brand',
      name: props.brand ?? 'YuJiang ShipTechnology',
    },
    offers: {
      '@type': 'Offer',
      priceCurrency: props.currency ?? 'USD',
      price: props.price,
      availability: 'https://schema.org/InStock',
      seller: {
        '@type': 'Organization',
        name: 'YuJiang ShipTechnology',
      },
    },
  };

  if (props.image) {
    data.image = getDirectMinioUrl(props.image);
  }

  if (props.category) {
    data.category = props.category;
  }

  if (props.rating && props.rating.count > 0) {
    data.aggregateRating = {
      '@type': 'AggregateRating',
      ratingValue: props.rating.value.toFixed(1),
      reviewCount: props.rating.count,
    };
  }

  if (props.reviews && props.reviews.length > 0) {
    data.review = props.reviews.map((r) => ({
      '@type': 'Review',
      author: { '@type': 'Person', name: r.author },
      reviewRating: { '@type': 'Rating', ratingValue: r.rating },
      reviewBody: r.body,
      datePublished: r.date,
    }));
  }

  return <JsonLd data={data} />;
}

// ─── Breadcrumb ─────────────────────────────────────────────

export function BreadcrumbSchema({
  items,
  locale = 'en',
}: {
  items: BreadcrumbItem[];
  locale?: string;
}) {
  const data = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Home',
        item: `${SITE_URL}/${locale}`,
      },
      ...items.map((item, index) => ({
        '@type': 'ListItem',
        position: index + 2,
        name: item.name,
        ...(item.url ? { item: `${SITE_URL}/${locale}${item.url}` } : {}),
      })),
    ],
  };

  return <JsonLd data={data} />;
}

// ─── FAQ ────────────────────────────────────────────────────

export function FAQSchema({ items }: { items: FAQItem[] }) {
  if (!items.length) return null;

  const data = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: items.map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.answer,
      },
    })),
  };

  return <JsonLd data={data} />;
}
