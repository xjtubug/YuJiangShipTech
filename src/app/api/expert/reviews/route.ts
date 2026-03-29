import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request: NextRequest) {
  const expertId = request.cookies.get('expert_session')?.value;
  if (!expertId) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

  const reviews = await prisma.expertReview.findMany({
    where: { expertId },
    include: { product: { select: { nameZh: true, nameEn: true, sku: true } } },
    orderBy: { createdAt: 'desc' },
  });
  return NextResponse.json({ reviews });
}

export async function POST(request: NextRequest) {
  const expertId = request.cookies.get('expert_session')?.value;
  if (!expertId) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

  const { productId, content, rating, images, videoUrl } = await request.json();
  if (!productId || !content || !rating) {
    return NextResponse.json({ error: '请填写完整评价信息' }, { status: 400 });
  }

  const review = await prisma.expertReview.create({
    data: {
      productId,
      expertId,
      content,
      rating: Math.min(5, Math.max(1, rating)),
      images: JSON.stringify(images || []),
      videoUrl: videoUrl || null,
    },
  });
  return NextResponse.json({ success: true, review });
}
