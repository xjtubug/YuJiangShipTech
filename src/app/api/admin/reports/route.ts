import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import { sendEmail } from '@/lib/email';

export async function POST(request: NextRequest) {
  try {
    await requireAuth(["admin"]);

    const body = await request.json();
    const { type, email } = body;

    if (!type || !['daily', 'weekly', 'monthly'].includes(type)) {
      return NextResponse.json(
        { error: 'type must be daily, weekly, or monthly' },
        { status: 400 }
      );
    }

    const now = new Date();
    const dateFrom = new Date(now);

    switch (type) {
      case 'daily':
        dateFrom.setDate(dateFrom.getDate() - 1);
        break;
      case 'weekly':
        dateFrom.setDate(dateFrom.getDate() - 7);
        break;
      case 'monthly':
        dateFrom.setMonth(dateFrom.getMonth() - 1);
        break;
    }

    const dateRange = { gte: dateFrom, lte: now };

    // Aggregate data
    const [
      totalVisitors,
      newVisitors,
      totalInquiries,
      inquiriesByStatus,
      topProductViews,
      visitorsByCountry,
      allScores,
    ] = await Promise.all([
      prisma.visitor.count({ where: { lastVisit: dateRange } }),
      prisma.visitor.count({ where: { firstVisit: dateRange } }),
      prisma.inquiry.count({ where: { createdAt: dateRange } }),
      prisma.inquiry.groupBy({
        by: ['status'],
        where: { createdAt: dateRange },
        _count: { id: true },
      }),
      prisma.pageView.groupBy({
        by: ['productId'],
        where: { createdAt: dateRange, productId: { not: null } },
        _count: { id: true },
        orderBy: { _count: { id: 'desc' } },
        take: 10,
      }),
      prisma.visitor.groupBy({
        by: ['country'],
        where: { lastVisit: dateRange },
        _count: { id: true },
        orderBy: { _count: { id: 'desc' } },
        take: 10,
      }),
      prisma.visitor.findMany({
        where: { lastVisit: dateRange },
        select: { leadScore: true },
      }),
    ]);

    // Resolve product names for top views
    const topProductIds = topProductViews
      .map((pv) => pv.productId)
      .filter((id): id is string => id !== null);

    const topProductsData = topProductIds.length > 0
      ? await prisma.product.findMany({
          where: { id: { in: topProductIds } },
          select: { id: true, nameEn: true },
        })
      : [];

    const topProducts = topProductViews.map((pv) => {
      const product = topProductsData.find((p) => p.id === pv.productId);
      return { productId: pv.productId, name: product?.nameEn ?? 'Unknown', views: pv._count.id };
    });

    // Lead score distribution
    const scoreDistribution = { cold: 0, warm: 0, hot: 0, veryHot: 0 };
    for (const v of allScores) {
      if (v.leadScore >= 81) scoreDistribution.veryHot++;
      else if (v.leadScore >= 51) scoreDistribution.hot++;
      else if (v.leadScore >= 21) scoreDistribution.warm++;
      else scoreDistribution.cold++;
    }

    const reportData = {
      type,
      period: { from: dateFrom.toISOString(), to: now.toISOString() },
      totalVisitors,
      newVisitors,
      totalInquiries,
      inquiriesByStatus: Object.fromEntries(
        inquiriesByStatus.map((s) => [s.status, s._count.id])
      ),
      topProducts,
      topCountries: visitorsByCountry.map((v) => ({
        country: v.country ?? 'Unknown',
        count: v._count.id,
      })),
      leadScoreDistribution: scoreDistribution,
    };

    // Save report to database
    const report = await prisma.report.create({
      data: {
        type,
        dateFrom,
        dateTo: now,
        dataJson: JSON.stringify(reportData),
        emailSent: false,
        sentTo: email ?? null,
      },
    });

    // Try to send report via email if requested
    if (email) {
      try {
        const html = `
          <h2>${type.charAt(0).toUpperCase() + type.slice(1)} Report</h2>
          <p><strong>Period:</strong> ${dateFrom.toISOString().split('T')[0]} — ${now.toISOString().split('T')[0]}</p>
          <table border="1" cellpadding="8" cellspacing="0">
            <tr><td>Total Visitors</td><td>${totalVisitors}</td></tr>
            <tr><td>New Visitors</td><td>${newVisitors}</td></tr>
            <tr><td>Total Inquiries</td><td>${totalInquiries}</td></tr>
            <tr><td>Hot Leads</td><td>${scoreDistribution.hot + scoreDistribution.veryHot}</td></tr>
          </table>
          <h3>Top Products</h3>
          <ol>${topProducts.map((p) => `<li>${p.name} (${p.views} views)</li>`).join('')}</ol>
        `;

        await sendEmail(email, `YuJiang ${type} Report – ${now.toISOString().split('T')[0]}`, html);
        await prisma.report.update({ where: { id: report.id }, data: { emailSent: true } });
      } catch (emailError) {
        console.error('Failed to send report email:', emailError);
      }
    }

    return NextResponse.json({ success: true, report: reportData });
  } catch (error) {
    if (error instanceof Response) return error;
    console.error('Admin reports API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
