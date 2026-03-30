export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

export async function GET() {
  try {
    await requireAuth(["viewer"]);

    const now = new Date();
    const twelveMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 11, 1);

    // Run all queries in parallel
    const [
      totalInquiries,
      quotedInquiries,
      totalQuotations,
      acceptedQuotations,
      totalOrders,
      completedOrders,
      cancelledOrders,
      orders,
      ordersByStatus,
      topCustomers,
    ] = await Promise.all([
      // Total inquiries
      prisma.inquiry.count(),
      // Inquiries that have quotations
      prisma.inquiry.count({ where: { quotations: { some: {} } } }),
      // Total quotations
      prisma.quotation.count(),
      // Accepted quotations
      prisma.quotation.count({ where: { status: "accepted" } }),
      // Total orders
      prisma.order.count(),
      // Completed orders
      prisma.order.count({ where: { status: { in: ["delivered", "completed"] } } }),
      // Cancelled orders
      prisma.order.count({ where: { status: "cancelled" } }),
      // Orders for revenue calculation (last 12 months)
      prisma.order.findMany({
        where: {
          createdAt: { gte: twelveMonthsAgo },
          status: { not: "cancelled" },
        },
        select: { grandTotal: true, createdAt: true },
      }),
      // Orders by status distribution
      prisma.order.groupBy({
        by: ["status"],
        _count: { id: true },
      }),
      // Top customers by order value
      prisma.order.groupBy({
        by: ["companyName", "email"],
        where: { status: { not: "cancelled" } },
        _sum: { grandTotal: true },
        _count: { id: true },
        orderBy: { _sum: { grandTotal: "desc" } },
        take: 10,
      }),
    ]);

    // Inquiry → Quotation conversion rate
    const inquiryToQuotationRate = totalInquiries > 0
      ? Math.round((quotedInquiries / totalInquiries) * 100 * 10) / 10
      : 0;

    // Quotation → Order conversion rate
    const quotationToOrderRate = totalQuotations > 0
      ? Math.round((acceptedQuotations / totalQuotations) * 100 * 10) / 10
      : 0;

    // Order completion rate
    const activeOrders = totalOrders - cancelledOrders;
    const orderCompletionRate = activeOrders > 0
      ? Math.round((completedOrders / activeOrders) * 100 * 10) / 10
      : 0;

    // Revenue by month
    const revenueByMonth: { month: string; revenue: number; count: number }[] = [];
    for (let i = 11; i >= 0; i--) {
      const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthKey = `${monthDate.getFullYear()}-${String(monthDate.getMonth() + 1).padStart(2, "0")}`;
      revenueByMonth.push({ month: monthKey, revenue: 0, count: 0 });
    }

    for (const order of orders) {
      const d = new Date(order.createdAt);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      const entry = revenueByMonth.find((r) => r.month === key);
      if (entry) {
        entry.revenue += order.grandTotal;
        entry.count += 1;
      }
    }

    // Average order value
    const totalRevenue = orders.reduce((sum, o) => sum + o.grandTotal, 0);
    const averageOrderValue = orders.length > 0
      ? Math.round((totalRevenue / orders.length) * 100) / 100
      : 0;

    // Status distribution
    const statusDistribution = ordersByStatus.map((s) => ({
      status: s.status,
      count: s._count.id,
    }));

    // Top customers
    const topCustomersList = topCustomers.map((c) => ({
      companyName: c.companyName,
      email: c.email,
      totalValue: c._sum.grandTotal || 0,
      orderCount: c._count.id,
    }));

    return NextResponse.json({
      conversionRates: {
        inquiryToQuotation: inquiryToQuotationRate,
        quotationToOrder: quotationToOrderRate,
        orderCompletion: orderCompletionRate,
      },
      totals: {
        inquiries: totalInquiries,
        quotations: totalQuotations,
        orders: totalOrders,
        completedOrders,
        cancelledOrders,
      },
      revenueByMonth,
      averageOrderValue,
      totalRevenue,
      statusDistribution,
      topCustomers: topCustomersList,
    });
  } catch (error) {
    if (error instanceof Response) return error;
    console.error("Analytics error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
