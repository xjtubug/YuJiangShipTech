export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getOrSet } from '@/lib/cache';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const category = searchParams.get('category');
    const search = searchParams.get('search');
    const sort = searchParams.get('sort') ?? 'newest';
    const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') ?? '12', 10)));
    const skip = (page - 1) * limit;

    const cacheKey = `products:${category}:${search}:${sort}:${page}:${limit}`;

    const data = await getOrSet(cacheKey, async () => {
      const where: Record<string, unknown> = { published: true };

      if (category) {
        const cat = await prisma.category.findUnique({ where: { slug: category } });
        if (cat) {
          where.categoryId = cat.id;
        }
      }

      if (search) {
        where.OR = [
          { nameEn: { contains: search } },
          { nameZh: { contains: search } },
        ];
      }

      let orderBy: Record<string, string>;
      switch (sort) {
        case 'price-asc':
          orderBy = { priceUsd: 'asc' };
          break;
        case 'price-desc':
          orderBy = { priceUsd: 'desc' };
          break;
        default:
          orderBy = { createdAt: 'desc' };
      }

      const [products, total] = await Promise.all([
        prisma.product.findMany({
          where,
          select: {
            id: true,
            slug: true,
            sku: true,
            nameEn: true,
            nameZh: true,
            nameJa: true,
            nameAr: true,
            descEn: true,
            descZh: true,
            descJa: true,
            descAr: true,
            priceCny: true,
            priceUsd: true,
            moq: true,
            leadTimeDays: true,
            images: true,
            featured: true,
            published: true,
            status: true,
            categoryId: true,
            category: { select: { id: true, slug: true, nameEn: true, nameZh: true } },
            createdAt: true,
            updatedAt: true,
          },
          orderBy,
          skip,
          take: limit,
        }),
        prisma.product.count({ where }),
      ]);

      return {
        products,
        total,
        page,
        totalPages: Math.ceil(total / limit),
      };
    }, 60); // cache for 60 seconds

    return NextResponse.json(data);
  } catch (error) {
    console.error('Products API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
