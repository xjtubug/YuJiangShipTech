export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const VALID_TRANSITIONS: Record<string, { to: string; roles: string[] }[]> = {
  draft: [{ to: "pending_approval", roles: ["sales"] }],
  pending_approval: [
    { to: "approved", roles: ["admin"] },
    { to: "draft", roles: ["admin"] }, // reject_approval → back to draft
  ],
  approved: [{ to: "sent", roles: ["sales"] }],
  sent: [
    { to: "accepted", roles: ["sales"] },
    { to: "rejected", roles: ["sales"] },
  ],
};

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await requireAuth(["viewer"]);

    const body = await request.json();
    const { action, notes } = body;

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

    // Map action to target status and required roles
    const actionMap: Record<string, { from: string; to: string; roles: string[] }> = {
      submit_for_approval: { from: "draft", to: "pending_approval", roles: ["sales"] },
      approve: { from: "pending_approval", to: "approved", roles: ["admin"] },
      reject_approval: { from: "pending_approval", to: "draft", roles: ["admin"] },
      send: { from: "approved", to: "sent", roles: ["sales"] },
      accept: { from: "sent", to: "accepted", roles: ["sales"] },
      reject: { from: "sent", to: "rejected", roles: ["sales"] },
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

    // Check role permissions for this action
    await requireAuth(transition.roles);

    // Build update data
    const updateData: Record<string, unknown> = {
      status: transition.to,
    };

    if (action === "approve") {
      updateData.approvedBy = session.user.name || session.user.email;
      updateData.approvedAt = new Date();
    }

    if (action === "send") {
      updateData.sentAt = new Date();
    }

    if (action === "reject_approval" && notes) {
      updateData.notes = notes;
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
