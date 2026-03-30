export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    await requireAuth(["sales"]);

    const { searchParams } = request.nextUrl;
    const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') ?? '20', 10)));
    const status = searchParams.get('status');
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};
    if (status) where.status = status;

    const includeFollowUps = searchParams.get('includeFollowUps') === 'true';

    const [inquiries, total] = await Promise.all([
      prisma.inquiry.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: includeFollowUps
          ? { items: true, followUps: { orderBy: { createdAt: 'desc' } } }
          : { items: true },
      }),
      prisma.inquiry.count({ where }),
    ]);

    return NextResponse.json({
      inquiries,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    if (error instanceof Response) return error;
    console.error('Admin inquiries API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    await requireAuth(["sales"]);

    const body = await request.json();
    const { id, status } = body;

    if (!id || !status) {
      return NextResponse.json(
        { error: 'id and status are required' },
        { status: 400 }
      );
    }

    const validStatuses = ['new', 'processing', 'quoted', 'closed'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` },
        { status: 400 }
      );
    }

    const inquiry = await prisma.inquiry.update({
      where: { id },
      data: { status },
      include: { items: true },
    });

    return NextResponse.json(inquiry);
  } catch (error) {
    if (error instanceof Response) return error;
    console.error('Admin inquiry update API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
