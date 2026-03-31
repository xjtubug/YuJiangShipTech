export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

// GET: List contact messages with pagination
export async function GET(request: NextRequest) {
  try {
    await requireAuth(["viewer"]);

    const { searchParams } = request.nextUrl;
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") ?? "20", 10)));
    const skip = (page - 1) * limit;

    const [contacts, total, unreadCount] = await Promise.all([
      prisma.contactMessage.findMany({
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.contactMessage.count(),
      prisma.contactMessage.count({ where: { read: false } }),
    ]);

    return NextResponse.json({
      contacts,
      total,
      page,
      totalPages: Math.ceil(total / limit),
      unreadCount,
    });
  } catch (error) {
    if (error instanceof Response) return error;
    console.error("Contact messages list error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// PATCH: Mark contact message as read
export async function PATCH(request: NextRequest) {
  try {
    await requireAuth(["viewer"]);

    const body = await request.json();
    const { id, read } = body;

    if (!id) {
      return NextResponse.json({ error: "id is required" }, { status: 400 });
    }

    const updated = await prisma.contactMessage.update({
      where: { id },
      data: { read: read ?? true },
    });

    // Mark related notifications as read
    await prisma.notification.updateMany({
      where: { type: "new_contact", read: false },
      data: { read: true },
    }).catch(() => {});

    return NextResponse.json(updated);
  } catch (error) {
    if (error instanceof Response) return error;
    console.error("Contact message update error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
