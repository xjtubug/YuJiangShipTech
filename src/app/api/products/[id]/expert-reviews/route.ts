import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  // id can be a product ID or slug
  const product = await prisma.product.findFirst({
    where: { OR: [{ id }, { slug: id }] },
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
