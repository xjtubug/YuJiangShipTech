import type { MetadataRoute } from 'next';

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || 'https://www.yujiangshiptech.com';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: ['/', '/api/sitemap'],
        disallow: ['/admin', '/api', '/_next'],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
