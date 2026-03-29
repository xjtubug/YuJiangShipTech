import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

const BASE_URL = process.env.SITE_URL ?? 'https://www.yujiangshiptech.com';

export async function GET() {
  try {
    const [products, categories] = await Promise.all([
      prisma.product.findMany({
        where: { published: true },
        select: { slug: true, updatedAt: true },
      }),
      prisma.category.findMany({
        select: { slug: true, createdAt: true },
      }),
    ]);

    const staticPages = [
      { path: '/', changefreq: 'daily', priority: '1.0' },
      { path: '/products', changefreq: 'daily', priority: '0.9' },
      { path: '/about', changefreq: 'monthly', priority: '0.7' },
      { path: '/contact', changefreq: 'monthly', priority: '0.7' },
      { path: '/news', changefreq: 'weekly', priority: '0.6' },
      { path: '/cases', changefreq: 'weekly', priority: '0.6' },
    ];

    const now = new Date().toISOString().split('T')[0];

    let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`;

    // Static pages
    for (const page of staticPages) {
      xml += `
  <url>
    <loc>${BASE_URL}${page.path}</loc>
    <lastmod>${now}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>`;
    }

    // Category pages
    for (const cat of categories) {
      xml += `
  <url>
    <loc>${BASE_URL}/products?category=${cat.slug}</loc>
    <lastmod>${cat.createdAt.toISOString().split('T')[0]}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`;
    }

    // Product pages
    for (const product of products) {
      xml += `
  <url>
    <loc>${BASE_URL}/products/${product.slug}</loc>
    <lastmod>${product.updatedAt.toISOString().split('T')[0]}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`;
    }

    xml += `
</urlset>`;

    return new NextResponse(xml, {
      status: 200,
      headers: {
        'Content-Type': 'application/xml',
        'Cache-Control': 'public, max-age=3600, s-maxage=3600',
      },
    });
  } catch (error) {
    console.error('Sitemap generation error:', error);
    return new NextResponse('<error>Failed to generate sitemap</error>', {
      status: 500,
      headers: { 'Content-Type': 'application/xml' },
    });
  }
}
