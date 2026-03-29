import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request: NextRequest, { params }: { params: { slug: string } }) {
  const { slug } = params;
  // slug can be a product ID or slug
  const product = await prisma.product.findFirst({
    where: { OR: [{ id: slug }, { slug: slug }] },
    select: { id: true },
  });
  if (!product) return NextResponse.json({ reviews: [] });

  const reviews = await prisma.expertReview.findMany({
    where: { productId: product.id },
    include: {
      expert: { select: { name: true, title: true, avatar: true } },
    },
    orderBy: { createdAt: 'desc' },
  });
  return NextResponse.json({ reviews });
}
