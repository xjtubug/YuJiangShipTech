export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// GET: Get customer detail with inquiries and follow-ups
export async function GET(
  _request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const { slug } = params;
    const id = slug;

    const customer = await prisma.customer.findUnique({
      where: { id },
      include: {
        inquiries: {
          orderBy: { createdAt: "desc" },
          include: { items: true },
        },
        followUps: {
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!customer) {
      return NextResponse.json({ error: "客户不存在" }, { status: 404 });
    }

    return NextResponse.json(customer);
  } catch (error) {
    console.error("Customer detail error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// PUT: Update customer
export async function PUT(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const { slug } = params;
    const id = slug;
    const updates = await request.json();

    const existing = await prisma.customer.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "客户不存在" }, { status: 404 });
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data: any = {};
    if (updates.name !== undefined) data.name = updates.name;
    if (updates.email !== undefined) data.email = updates.email;
    if (updates.company !== undefined) data.company = updates.company;
    if (updates.phone !== undefined) data.phone = updates.phone;
    if (updates.country !== undefined) data.country = updates.country;
    if (updates.notes !== undefined) data.notes = updates.notes;
    if (updates.tags !== undefined) {
      data.tags = JSON.stringify(Array.isArray(updates.tags) ? updates.tags : []);
    }

    const customer = await prisma.customer.update({
      where: { id },
      data,
      include: {
        inquiries: {
          orderBy: { createdAt: "desc" },
          include: { items: true },
        },
        followUps: {
          orderBy: { createdAt: "desc" },
        },
      },
    });

    return NextResponse.json(customer);
  } catch (error) {
    console.error("Customer update error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// DELETE: Delete customer and related follow-ups
export async function DELETE(
  _request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const { slug } = params;
    const id = slug;

    const existing = await prisma.customer.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "客户不存在" }, { status: 404 });
    }

    await prisma.customerFollowUp.deleteMany({ where: { customerId: id } });
    await prisma.customer.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Customer delete error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
