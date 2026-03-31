import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    await requireAuth(["admin"]);
  } catch (error) {
    if (error instanceof Response) return error;
    throw error;
  }

  const status = request.nextUrl.searchParams.get('status') || 'all';
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

// PATCH: Toggle approval/visibility
export async function PATCH(request: NextRequest) {
  try {
    await requireAuth(["admin"]);
  } catch (error) {
    if (error instanceof Response) return error;
    throw error;
  }

  const { id, approved } = await request.json();
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });

  const comment = await prisma.customerComment.update({
    where: { id },
    data: { approved: !!approved },
  });

  return NextResponse.json({ success: true, comment });
}

// PUT: Edit comment
export async function PUT(request: NextRequest) {
  try {
    await requireAuth(["admin"]);
  } catch (error) {
    if (error instanceof Response) return error;
    throw error;
  }

  const { id, content, rating, images, name, company, country } = await request.json();
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });

  const data: Record<string, unknown> = {};
  if (content !== undefined) data.content = content;
  if (rating !== undefined) data.rating = rating;
  if (images !== undefined) data.images = typeof images === 'string' ? images : JSON.stringify(images);
  if (name !== undefined) data.name = name;
  if (company !== undefined) data.company = company;
  if (country !== undefined) data.country = country;

  const comment = await prisma.customerComment.update({
    where: { id },
    data,
    include: { product: { select: { nameZh: true, nameEn: true, slug: true } } },
  });

  return NextResponse.json({ success: true, comment });
}

// DELETE: Delete comment
export async function DELETE(request: NextRequest) {
  try {
    await requireAuth(["admin"]);
  } catch (error) {
    if (error instanceof Response) return error;
    throw error;
  }

  const id = request.nextUrl.searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });

  await prisma.customerComment.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
