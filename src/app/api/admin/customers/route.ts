export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAuth } from '@/lib/auth';

// GET: List customers with pagination, search, filters, and stats
export async function GET(request: NextRequest) {
  try {
    await requireAuth(["sales"]);

    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") ?? "20", 10)));
    const search = searchParams.get("search")?.trim();
    const source = searchParams.get("source");
    const tag = searchParams.get("tag");
    const skip = (page - 1) * limit;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = {};

    if (search) {
      where.OR = [
        { email: { contains: search } },
        { name: { contains: search } },
        { company: { contains: search } },
      ];
    }

    if (source) {
      where.source = source;
    }

    if (tag) {
      where.tags = { contains: tag };
    }

    const [customers, total] = await Promise.all([
      prisma.customer.findMany({
        where,
        orderBy: { updatedAt: "desc" },
        skip,
        take: limit,
        include: {
          inquiries: {
            select: { id: true, createdAt: true, status: true, inquiryNumber: true },
            orderBy: { createdAt: "desc" },
          },
          followUps: {
            select: { id: true, action: true, createdAt: true },
            orderBy: { createdAt: "desc" },
            take: 1,
          },
        },
      }),
      prisma.customer.count({ where }),
    ]);

    // Stats
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [totalAll, bySource, activeCount, newThisMonth] = await Promise.all([
      prisma.customer.count(),
      prisma.customer.groupBy({ by: ["source"], _count: { id: true } }),
      prisma.customer.count({
        where: { inquiries: { some: { createdAt: { gte: thirtyDaysAgo } } } },
      }),
      prisma.customer.count({ where: { createdAt: { gte: startOfMonth } } }),
    ]);

    const sourceBreakdown: Record<string, number> = {};
    bySource.forEach((s) => {
      sourceBreakdown[s.source] = s._count.id;
    });

    return NextResponse.json({
      customers,
      total,
      page,
      totalPages: Math.ceil(total / limit),
      stats: {
        total: totalAll,
        bySource: sourceBreakdown,
        active: activeCount,
        newThisMonth,
      },
    });
  } catch (error) {
    if (error instanceof Response) return error;
    console.error("Customers list error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST: Create a new customer
export async function POST(request: NextRequest) {
  try {
    await requireAuth(["sales"]);

    const body = await request.json();
    const { email, name, company, phone, country, tags, notes } = body;

    if (!email || typeof email !== "string") {
      return NextResponse.json({ error: "邮箱为必填项" }, { status: 400 });
    }
    if (!name || typeof name !== "string") {
      return NextResponse.json({ error: "姓名为必填项" }, { status: 400 });
    }

    const normalized = email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)) {
      return NextResponse.json({ error: "邮箱格式不正确" }, { status: 400 });
    }

    const existing = await prisma.customer.findUnique({ where: { email: normalized } });
    if (existing) {
      return NextResponse.json({ error: "该邮箱已存在" }, { status: 409 });
    }

    const customer = await prisma.customer.create({
      data: {
        email: normalized,
        name: name.trim(),
        company: company?.trim() || null,
        phone: phone?.trim() || null,
        country: country?.trim() || null,
        tags: JSON.stringify(Array.isArray(tags) ? tags : []),
        source: "manual",
        notes: notes?.trim() || null,
      },
    });

    return NextResponse.json(customer, { status: 201 });
  } catch (error) {
    if (error instanceof Response) return error;
    console.error("Customer create error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// PUT: Update customer (tags, notes, etc.)
export async function PUT(request: NextRequest) {
  try {
    await requireAuth(["sales"]);

    const body = await request.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json({ error: "客户ID为必填项" }, { status: 400 });
    }

    const existing = await prisma.customer.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "客户不存在" }, { status: 404 });
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data: any = {};
    if (updates.name !== undefined) data.name = updates.name;
    if (updates.company !== undefined) data.company = updates.company;
    if (updates.phone !== undefined) data.phone = updates.phone;
    if (updates.country !== undefined) data.country = updates.country;
    if (updates.notes !== undefined) data.notes = updates.notes;
    if (updates.tags !== undefined) data.tags = JSON.stringify(Array.isArray(updates.tags) ? updates.tags : []);

    const customer = await prisma.customer.update({
      where: { id },
      data,
      include: {
        inquiries: { orderBy: { createdAt: "desc" } },
        followUps: { orderBy: { createdAt: "desc" } },
      },
    });

    return NextResponse.json(customer);
  } catch (error) {
    if (error instanceof Response) return error;
    console.error("Customer update error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// DELETE: Remove customer by ID
export async function DELETE(request: NextRequest) {
  try {
    await requireAuth(["sales"]);

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "客户ID为必填项" }, { status: 400 });
    }

    const existing = await prisma.customer.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "客户不存在" }, { status: 404 });
    }

    // Delete follow-ups first, then customer
    await prisma.customerFollowUp.deleteMany({ where: { customerId: id } });
    await prisma.customer.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof Response) return error;
    console.error("Customer delete error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
