export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    await requireAuth(["viewer"]);

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
        select: {
          id: true,
          ip: true,
          country: true,
          region: true,
          city: true,
          browser: true,
          os: true,
          device: true,
          language: true,
          referrer: true,
          utmSource: true,
          utmMedium: true,
          utmCampaign: true,
          leadScore: true,
          isHighValue: true,
          firstVisit: true,
          lastVisit: true,
          visitCount: true,
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
    if (error instanceof Response) return error;
    console.error('Admin visitors API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
