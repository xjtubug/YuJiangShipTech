import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    await requireAuth(["admin"]);

    const { searchParams } = new URL(request.url);
    const format = searchParams.get("format") || "csv";
    const period = searchParams.get("period") || "month";
    const from = searchParams.get("from") || undefined;
    const to = searchParams.get("to") || undefined;

    const now = new Date();
    let dateFrom = new Date(now);
    const dateTo = to ? new Date(to) : now;

    if (from) {
      dateFrom = new Date(from);
    } else {
      switch (period) {
        case 'today': dateFrom.setHours(0, 0, 0, 0); break;
        case 'week': dateFrom.setDate(dateFrom.getDate() - 7); break;
        case 'month': dateFrom.setMonth(dateFrom.getMonth() - 1); break;
        case 'quarter': dateFrom.setMonth(dateFrom.getMonth() - 3); break;
        case 'year': dateFrom.setFullYear(dateFrom.getFullYear() - 1); break;
        default: dateFrom.setMonth(dateFrom.getMonth() - 1);
      }
    }

    const dateRange = { gte: dateFrom, lte: dateTo };

    // Fetch all report data
    const [visitors, products, orders, inquiries] = await Promise.all([
      prisma.visitor.findMany({
        where: { lastVisit: dateRange },
        include: {
          _count: { select: { inquiries: true, pageViews: true } },
          pageViews: { select: { duration: true } },
        },
        orderBy: { lastVisit: 'desc' },
        take: 500,
      }),
      prisma.product.findMany({
        where: { published: true },
        select: {
          nameEn: true, sku: true,
          _count: { select: { pageViews: true, inquiryItems: true } },
          pageViews: { where: { createdAt: dateRange }, select: { duration: true } },
        },
        orderBy: { pageViews: { _count: 'desc' } },
        take: 100,
      }),
      prisma.order.findMany({
        where: { createdAt: dateRange },
        select: {
          orderNumber: true, country: true, contactName: true,
          companyName: true, grandTotal: true, currency: true, status: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.inquiry.findMany({
        where: { createdAt: dateRange },
        select: {
          inquiryNumber: true, companyName: true, contactName: true,
          email: true, country: true, status: true, createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    if (format === "csv") {
      // Generate CSV with all data sections
      let csv = "=== VISITORS ===\n";
      csv += "IP,Country,Device,Visit Count,Total Duration(s),Has Inquiry,Last Visit\n";
      for (const v of visitors) {
        const duration = v.pageViews.reduce((s, pv) => s + pv.duration, 0);
        csv += `"${v.ip}","${v.country || 'Unknown'}","${v.device || 'Unknown'}",${v.visitCount},${duration},${v._count.inquiries > 0},"${v.lastVisit.toISOString()}"\n`;
      }

      csv += "\n=== PRODUCTS ===\n";
      csv += "Name,SKU,Views,Duration(s),Inquiries\n";
      for (const p of products) {
        const duration = p.pageViews.reduce((s, pv) => s + pv.duration, 0);
        csv += `"${p.nameEn}","${p.sku}",${p.pageViews.length},${duration},${p._count.inquiryItems}\n`;
      }

      csv += "\n=== ORDERS ===\n";
      csv += "Order #,Country,Customer,Company,Amount,Currency,Status,Date\n";
      for (const o of orders) {
        csv += `"${o.orderNumber}","${o.country || ''}","${o.contactName}","${o.companyName}",${o.grandTotal},"${o.currency}","${o.status}","${o.createdAt.toISOString()}"\n`;
      }

      csv += "\n=== INQUIRIES ===\n";
      csv += "Inquiry #,Company,Contact,Email,Country,Status,Date\n";
      for (const i of inquiries) {
        csv += `"${i.inquiryNumber}","${i.companyName}","${i.contactName}","${i.email}","${i.country || ''}","${i.status}","${i.createdAt.toISOString()}"\n`;
      }

      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="report-${period}-${new Date().toISOString().split('T')[0]}.csv"`,
        },
      });
    }

    // JSON format for PDF generation on client side
    return NextResponse.json({
      period: { from: dateFrom.toISOString(), to: dateTo.toISOString() },
      visitors: visitors.map(v => ({
        ip: v.ip,
        country: v.country || 'Unknown',
        device: v.device || 'Unknown',
        visitCount: v.visitCount,
        totalDuration: v.pageViews.reduce((s, pv) => s + pv.duration, 0),
        hasInquiry: v._count.inquiries > 0,
        lastVisit: v.lastVisit,
      })),
      products: products.map(p => ({
        name: p.nameEn,
        sku: p.sku,
        views: p.pageViews.length,
        duration: p.pageViews.reduce((s, pv) => s + pv.duration, 0),
        inquiries: p._count.inquiryItems,
      })),
      orders: orders.map(o => ({
        orderNumber: o.orderNumber,
        country: o.country,
        customer: o.contactName,
        company: o.companyName,
        amount: o.grandTotal,
        currency: o.currency,
        status: o.status,
        date: o.createdAt,
      })),
      inquiries: inquiries.map(i => ({
        number: i.inquiryNumber,
        company: i.companyName,
        contact: i.contactName,
        email: i.email,
        country: i.country,
        status: i.status,
        date: i.createdAt,
      })),
    });
  } catch (error) {
    if (error instanceof Response) return error;
    console.error('Report export error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
