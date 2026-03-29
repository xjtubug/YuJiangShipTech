export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// GET: List follow-ups for a customer
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const customer = await prisma.customer.findUnique({ where: { id } });
    if (!customer) {
      return NextResponse.json({ error: "客户不存在" }, { status: 404 });
    }

    const followUps = await prisma.customerFollowUp.findMany({
      where: { customerId: id },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ followUps });
  } catch (error) {
    console.error("Follow-up list error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST: Add a follow-up record
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { action, content } = body;

    if (!action || !content) {
      return NextResponse.json({ error: "操作类型和内容为必填项" }, { status: 400 });
    }

    const validActions = ["call", "email", "meeting", "note", "order"];
    if (!validActions.includes(action)) {
      return NextResponse.json({ error: "无效的操作类型" }, { status: 400 });
    }

    const customer = await prisma.customer.findUnique({ where: { id } });
    if (!customer) {
      return NextResponse.json({ error: "客户不存在" }, { status: 404 });
    }

    const followUp = await prisma.customerFollowUp.create({
      data: {
        customerId: id,
        action,
        content: content.trim(),
        createdBy: "admin",
      },
    });

    // Touch customer updatedAt
    await prisma.customer.update({
      where: { id },
      data: { updatedAt: new Date() },
    });

    return NextResponse.json(followUp, { status: 201 });
  } catch (error) {
    console.error("Follow-up create error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
