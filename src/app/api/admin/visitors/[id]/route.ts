import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    const visitor = await prisma.visitor.findUnique({
      where: { id },
      include: {
        pageViews: {
          orderBy: { createdAt: 'desc' },
          include: {
            product: {
              select: { id: true, slug: true, nameEn: true, nameZh: true, images: true },
            },
          },
        },
        inquiries: {
          orderBy: { createdAt: 'desc' },
          include: { items: true },
        },
      },
    });

    if (!visitor) {
      return NextResponse.json({ error: 'Visitor not found' }, { status: 404 });
    }

    return NextResponse.json(visitor);
  } catch (error) {
    console.error('Admin visitor detail API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
