export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') ?? '20', 10)));
    const country = searchParams.get('country');
    const minScore = searchParams.get('minScore');
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};
    if (country) where.country = country;
    if (minScore) where.leadScore = { gte: parseInt(minScore, 10) };

    const [visitors, total] = await Promise.all([
      prisma.visitor.findMany({
        where,
        orderBy: { lastVisit: 'desc' },
        skip,
        take: limit,
        include: {
          _count: {
            select: {
              pageViews: true,
              inquiries: true,
            },
          },
        },
      }),
      prisma.visitor.count({ where }),
    ]);

    return NextResponse.json({
      visitors,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error('Admin visitors API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
