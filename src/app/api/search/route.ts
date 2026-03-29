export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const q = request.nextUrl.searchParams.get('q')?.trim();

    if (!q) {
      return NextResponse.json({ results: [] });
    }

    const products = await prisma.product.findMany({
      where: {
        published: true,
        OR: [
          { nameEn: { contains: q } },
          { nameZh: { contains: q } },
          { nameJa: { contains: q } },
          { nameAr: { contains: q } },
          { descEn: { contains: q } },
          { descZh: { contains: q } },
          { descJa: { contains: q } },
          { descAr: { contains: q } },
        ],
      },
      select: {
        id: true,
        slug: true,
        nameEn: true,
        nameZh: true,
        nameJa: true,
        nameAr: true,
        images: true,
        priceUsd: true,
        category: { select: { slug: true, nameEn: true, nameZh: true } },
      },
      take: 10,
    });

    const results = products.map((p) => ({
      id: p.id,
      slug: p.slug,
      nameEn: p.nameEn,
      nameZh: p.nameZh,
      nameJa: p.nameJa,
      nameAr: p.nameAr,
      category: p.category,
      images: p.images,
      priceUsd: p.priceUsd,
    }));

    return NextResponse.json({ results });
  } catch (error) {
    console.error('Search API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
