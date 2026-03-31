export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireAuth(["viewer"]);

    const body = await request.json();
    const { action } = body;

    if (!action) {
      return NextResponse.json({ error: "action is required" }, { status: 400 });
    }

    const quotation = await prisma.quotation.findUnique({
      where: { id: params.id },
      select: { id: true, status: true },
    });

    if (!quotation) {
      return NextResponse.json({ error: "Quotation not found" }, { status: 404 });
    }

    // Simplified workflow: draft → sent → accepted/rejected/expired
    const actionMap: Record<string, { from: string; to: string }> = {
      send: { from: "draft", to: "sent" },
      accept: { from: "sent", to: "accepted" },
      reject: { from: "sent", to: "rejected" },
    };

    const transition = actionMap[action];
    if (!transition) {
      return NextResponse.json(
        { error: `Invalid action: ${action}` },
        { status: 400 }
      );
    }

    if (quotation.status !== transition.from) {
      return NextResponse.json(
        {
          error: `Cannot ${action} quotation with status "${quotation.status}". Expected status: "${transition.from}"`,
        },
        { status: 400 }
      );
    }

    // Build update data
    const updateData: Record<string, unknown> = {
      status: transition.to,
    };

    if (action === "send") {
      updateData.sentAt = new Date();
    }

    const updated = await prisma.quotation.update({
      where: { id: params.id },
      data: updateData,
      include: {
        items: { orderBy: { sortOrder: "asc" } },
        customer: { select: { id: true, name: true, company: true } },
        inquiry: { select: { id: true, inquiryNumber: true } },
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    if (error instanceof Response) return error;
    console.error("Quotation action error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
