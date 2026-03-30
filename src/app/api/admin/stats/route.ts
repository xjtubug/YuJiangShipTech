export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import { getOrSet } from '@/lib/cache';

export async function GET() {
  try {
    await requireAuth(["viewer"]);

    const data = await getOrSet('admin:stats', async () => {
      // Core counts
      const [totalVisitors, totalInquiries, totalProducts, highValueLeads] =
        await Promise.all([
          prisma.visitor.count(),
          prisma.inquiry.count(),
          prisma.product.count({ where: { published: true } }),
          prisma.visitor.count({ where: { isHighValue: true } }),
        ]);

      // Recent inquiries – only select fields needed for the dashboard
      const recentInquiries = await prisma.inquiry.findMany({
        orderBy: { createdAt: 'desc' },
        take: 10,
        select: {
          id: true,
          inquiryNumber: true,
          companyName: true,
          contactName: true,
          email: true,
          country: true,
          status: true,
          createdAt: true,
          items: {
            select: {
              id: true,
              productName: true,
              quantity: true,
              unit: true,
            },
          },
        },
      });

      // Top products by page view count
      const productViews = await prisma.pageView.groupBy({
        by: ['productId'],
        where: { productId: { not: null } },
        _count: { id: true },
        orderBy: { _count: { id: 'desc' } },
        take: 10,
      });

      const topProductIds = productViews
        .map((pv) => pv.productId)
        .filter((id): id is string => id !== null);

      const topProductsData = topProductIds.length > 0
        ? await prisma.product.findMany({
            where: { id: { in: topProductIds } },
            select: { id: true, slug: true, nameEn: true, nameZh: true, images: true, priceUsd: true },
          })
        : [];

      const topProducts = productViews.map((pv) => {
        const product = topProductsData.find((p) => p.id === pv.productId);
        return { ...product, viewCount: pv._count.id };
      });

      // Visitors by country
      const visitorsByCountry = await prisma.visitor.groupBy({
        by: ['country'],
        _count: { id: true },
        orderBy: { _count: { id: 'desc' } },
      });

      // Daily stats for last 30 days
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const [dailyVisitors, dailyInquiries] = await Promise.all([
        prisma.visitor.findMany({
          where: { firstVisit: { gte: thirtyDaysAgo } },
          select: { firstVisit: true },
        }),
        prisma.inquiry.findMany({
          where: { createdAt: { gte: thirtyDaysAgo } },
          select: { createdAt: true },
        }),
      ]);

      // Aggregate by date
      const dailyStats: Record<string, { visitors: number; inquiries: number }> = {};
      for (let d = 0; d < 30; d++) {
        const date = new Date();
        date.setDate(date.getDate() - d);
        const key = date.toISOString().split('T')[0];
        dailyStats[key] = { visitors: 0, inquiries: 0 };
      }

      for (const v of dailyVisitors) {
        const key = v.firstVisit.toISOString().split('T')[0];
        if (dailyStats[key]) dailyStats[key].visitors++;
      }

      for (const inq of dailyInquiries) {
        const key = inq.createdAt.toISOString().split('T')[0];
        if (dailyStats[key]) dailyStats[key].inquiries++;
      }

      const chartData = Object.entries(dailyStats)
        .map(([date, counts]) => ({ date, ...counts }))
        .sort((a, b) => a.date.localeCompare(b.date));

      return {
        totalVisitors,
        totalInquiries,
        totalProducts,
        highValueLeads,
        recentInquiries,
        topProducts,
        visitorsByCountry: visitorsByCountry.map((v) => ({
          country: v.country ?? 'Unknown',
          count: v._count.id,
        })),
        chartData,
      };
    }, 30); // cache for 30 seconds

    return NextResponse.json(data);
  } catch (error) {
    if (error instanceof Response) return error;
    console.error('Admin stats API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
