import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const status = request.nextUrl.searchParams.get('status') || 'pending';
  const page = parseInt(request.nextUrl.searchParams.get('page') || '1');
  const limit = 20;

  const where = status === 'pending' ? { approved: false } : status === 'approved' ? { approved: true } : {};

  const [comments, total] = await Promise.all([
    prisma.customerComment.findMany({
      where,
      include: { product: { select: { nameZh: true, nameEn: true, slug: true } } },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.customerComment.count({ where }),
  ]);

  return NextResponse.json({ comments, total, totalPages: Math.ceil(total / limit) });
}

// Approve or reject comment
export async function PATCH(request: NextRequest) {
  const { id, approved } = await request.json();
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });

  if (approved === false) {
    await prisma.customerComment.delete({ where: { id } });
    return NextResponse.json({ success: true, action: 'deleted' });
  }

  await prisma.customerComment.update({ where: { id }, data: { approved: true } });
  return NextResponse.json({ success: true, action: 'approved' });
}
