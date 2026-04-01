import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import { sendEmail } from '@/lib/email';

export const dynamic = "force-dynamic";

function getDateRange(period: string, from?: string, to?: string) {
  const now = new Date();
  let dateFrom = new Date(now);
  const dateTo = to ? new Date(to) : now;

  if (from) {
    dateFrom = new Date(from);
  } else {
    switch (period) {
      case 'today':
        dateFrom.setHours(0, 0, 0, 0);
        break;
      case 'week':
        dateFrom.setDate(dateFrom.getDate() - 7);
        break;
      case 'month':
        dateFrom.setMonth(dateFrom.getMonth() - 1);
        break;
      case 'quarter':
        dateFrom.setMonth(dateFrom.getMonth() - 3);
        break;
      case 'year':
        dateFrom.setFullYear(dateFrom.getFullYear() - 1);
        break;
      default:
        dateFrom.setMonth(dateFrom.getMonth() - 1);
    }
  }

  return { gte: dateFrom, lte: dateTo };
}

export async function GET(request: NextRequest) {
  try {
    await requireAuth(["admin"]);

    const { searchParams } = new URL(request.url);
    const tab = searchParams.get("tab") || "visitors";
    const period = searchParams.get("period") || "month";
    const from = searchParams.get("from") || undefined;
    const to = searchParams.get("to") || undefined;
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limit = Math.min(100, parseInt(searchParams.get("limit") || "20"));

    const dateRange = getDateRange(period, from, to);

    if (tab === "visitors") {
      const [visitors, total] = await Promise.all([
        prisma.visitor.findMany({
          where: { lastVisit: dateRange },
          include: {
            _count: { select: { inquiries: true, pageViews: true } },
            pageViews: {
              select: { duration: true, path: true },
              orderBy: { createdAt: 'desc' },
              take: 5,
            },
          },
          orderBy: { lastVisit: 'desc' },
          skip: (page - 1) * limit,
          take: limit,
        }),
        prisma.visitor.count({ where: { lastVisit: dateRange } }),
      ]);

      const items = visitors.map(v => ({
        id: v.id,
        ip: v.ip,
        country: v.country || 'Unknown',
        device: v.device || 'Unknown',
        browser: v.browser,
        os: v.os,
        referrer: v.referrer || 'Direct',
        visitCount: v.visitCount,
        totalDuration: v.pageViews.reduce((s, pv) => s + pv.duration, 0),
        hasInquiry: v._count.inquiries > 0,
        hasSocialRedirect: v.referrer ? /facebook|twitter|linkedin|instagram|youtube/i.test(v.referrer) : false,
        lastVisit: v.lastVisit,
        firstVisit: v.firstVisit,
      }));

      return NextResponse.json({ items, total, page, limit, totalPages: Math.ceil(total / limit) });
    }

    if (tab === "products") {
      const products = await prisma.product.findMany({
        where: { published: true },
        select: {
          id: true, nameEn: true, nameZh: true, sku: true,
          _count: {
            select: {
              pageViews: true,
              inquiryItems: true,
            },
          },
          pageViews: {
            where: { createdAt: dateRange },
            select: { duration: true },
          },
          inquiryItems: {
            where: { createdAt: dateRange },
          },
        },
        orderBy: { pageViews: { _count: 'desc' } },
        skip: (page - 1) * limit,
        take: limit,
      });

      const total = await prisma.product.count({ where: { published: true } });

      const items = products.map(p => ({
        id: p.id,
        nameEn: p.nameEn,
        nameZh: p.nameZh,
        sku: p.sku,
        totalViews: p.pageViews.length,
        totalDuration: p.pageViews.reduce((s, pv) => s + pv.duration, 0),
        inquiryCount: p.inquiryItems.length,
        shareCount: 0,
      }));

      return NextResponse.json({ items, total, page, limit, totalPages: Math.ceil(total / limit) });
    }

    if (tab === "orders") {
      const [orders, total] = await Promise.all([
        prisma.order.findMany({
          where: { createdAt: dateRange },
          select: {
            id: true, orderNumber: true, country: true,
            contactName: true, companyName: true,
            grandTotal: true, currency: true, status: true,
            createdAt: true,
            items: { select: { productName: true, quantity: true, total: true } },
          },
          orderBy: { createdAt: 'desc' },
          skip: (page - 1) * limit,
          take: limit,
        }),
        prisma.order.count({ where: { createdAt: dateRange } }),
      ]);

      return NextResponse.json({ items: orders, total, page, limit, totalPages: Math.ceil(total / limit) });
    }

    if (tab === "charts") {
      const [
        inquiryProducts,
        inquiryCountries,
        dailyInquiries,
        totalVisitors,
        totalInquiries,
        totalOrders,
      ] = await Promise.all([
        prisma.inquiryItem.groupBy({
          by: ['productName'],
          where: { createdAt: dateRange },
          _count: { id: true },
          orderBy: { _count: { id: 'desc' } },
          take: 10,
        }),
        prisma.inquiry.groupBy({
          by: ['country'],
          where: { createdAt: dateRange },
          _count: { id: true },
          orderBy: { _count: { id: 'desc' } },
          take: 10,
        }),
        prisma.inquiry.groupBy({
          by: ['createdAt'],
          where: { createdAt: dateRange },
          _count: { id: true },
          orderBy: { createdAt: 'asc' },
        }),
        prisma.visitor.count({ where: { lastVisit: dateRange } }),
        prisma.inquiry.count({ where: { createdAt: dateRange } }),
        prisma.order.count({ where: { createdAt: dateRange } }),
      ]);

      // Aggregate daily inquiries by date
      const dailyMap = new Map<string, number>();
      for (const d of dailyInquiries) {
        const key = new Date(d.createdAt).toISOString().split('T')[0];
        dailyMap.set(key, (dailyMap.get(key) || 0) + d._count.id);
      }
      const trend = Array.from(dailyMap.entries()).map(([date, count]) => ({ date, count }));

      return NextResponse.json({
        hotProducts: inquiryProducts.map(p => ({ name: p.productName, count: p._count.id })),
        countryDistribution: inquiryCountries.map(c => ({ country: c.country || 'Unknown', count: c._count.id })),
        inquiryTrend: trend,
        summary: { totalVisitors, totalInquiries, totalOrders },
      });
    }

    if (tab === "schedule") {
      const schedules = await prisma.reportSchedule.findMany({
        orderBy: { createdAt: 'desc' },
      });
      return NextResponse.json({ schedules });
    }

    return NextResponse.json({ error: "Invalid tab" }, { status: 400 });
  } catch (error) {
    if (error instanceof Response) return error;
    console.error('Admin reports GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireAuth(["admin"]);

    const body = await request.json();
    const { action } = body;

    // Handle report schedule management
    if (action === 'save-schedule') {
      const { schedules } = body;
      if (!Array.isArray(schedules)) {
        return NextResponse.json({ error: 'schedules must be an array' }, { status: 400 });
      }

      // Delete all existing schedules and recreate
      await prisma.reportSchedule.deleteMany({});
      for (const s of schedules) {
        await prisma.reportSchedule.create({
          data: {
            enabled: s.enabled ?? false,
            frequency: s.frequency,
            email: s.email,
          },
        });
      }
      return NextResponse.json({ success: true });
    }

    // Default: generate report
    const { type, email, period, from, to } = body;

    if (!type || !['daily', 'weekly', 'monthly', 'quarterly', 'yearly'].includes(type)) {
      return NextResponse.json(
        { error: 'type must be daily, weekly, monthly, quarterly, or yearly' },
        { status: 400 }
      );
    }

    const dateRange = getDateRange(period || type, from, to);

    const [
      totalVisitors,
      newVisitors,
      totalInquiries,
      inquiriesByStatus,
      topProductViews,
      visitorsByCountry,
      allScores,
      totalOrders,
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
      prisma.order.count({ where: { createdAt: dateRange } }),
    ]);

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

    const scoreDistribution = { cold: 0, warm: 0, hot: 0, veryHot: 0 };
    for (const v of allScores) {
      if (v.leadScore >= 81) scoreDistribution.veryHot++;
      else if (v.leadScore >= 51) scoreDistribution.hot++;
      else if (v.leadScore >= 21) scoreDistribution.warm++;
      else scoreDistribution.cold++;
    }

    const reportData = {
      type,
      period: { from: dateRange.gte.toISOString(), to: dateRange.lte.toISOString() },
      totalVisitors,
      newVisitors,
      totalInquiries,
      totalOrders,
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

    const report = await prisma.report.create({
      data: {
        type,
        dateFrom: dateRange.gte,
        dateTo: dateRange.lte instanceof Date ? dateRange.lte : new Date(),
        dataJson: JSON.stringify(reportData),
        emailSent: false,
        sentTo: email ?? null,
      },
    });

    if (email) {
      try {
        const html = `
          <h2>${type.charAt(0).toUpperCase() + type.slice(1)} Report</h2>
          <p><strong>Period:</strong> ${dateRange.gte.toISOString().split('T')[0]} — ${(dateRange.lte instanceof Date ? dateRange.lte : new Date()).toISOString().split('T')[0]}</p>
          <table border="1" cellpadding="8" cellspacing="0">
            <tr><td>Total Visitors</td><td>${totalVisitors}</td></tr>
            <tr><td>New Visitors</td><td>${newVisitors}</td></tr>
            <tr><td>Total Inquiries</td><td>${totalInquiries}</td></tr>
            <tr><td>Total Orders</td><td>${totalOrders}</td></tr>
            <tr><td>Hot Leads</td><td>${scoreDistribution.hot + scoreDistribution.veryHot}</td></tr>
          </table>
          <h3>Top Products</h3>
          <ol>${topProducts.map((p) => `<li>${p.name} (${p.views} views)</li>`).join('')}</ol>
        `;

        await sendEmail(email, `YuJiang ${type} Report – ${new Date().toISOString().split('T')[0]}`, html);
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
