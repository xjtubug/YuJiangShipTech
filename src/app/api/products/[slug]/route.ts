import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const { slug } = params;

    const product = await prisma.product.findFirst({
      where: { OR: [{ id: slug }, { slug: slug }] },
      include: {
        category: true,
        reviews: {
          where: { approved: true },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    // Increment view count if visitorId cookie exists
    const visitorId = request.cookies.get('visitorId')?.value;
    if (visitorId) {
      const visitor = await prisma.visitor.findUnique({ where: { id: visitorId } });
      if (visitor) {
        await prisma.pageView.create({
          data: {
            visitorId: visitor.id,
            productId: product.id,
            path: `/products/${product.slug}`,
            title: product.nameEn,
          },
        });
      }
    }

    return NextResponse.json(product);
  } catch (error) {
    console.error('Product detail API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
