export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

// GET: Single order with items & full status history
export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireAuth(["viewer"]);

    const order = await prisma.order.findUnique({
      where: { id: params.id },
      include: {
        items: { orderBy: { sortOrder: "asc" } },
        statusHistory: { orderBy: { createdAt: "asc" } },
        customer: { select: { id: true, name: true, company: true, email: true } },
        quotation: {
          select: {
            id: true,
            quotationNumber: true,
            items: true,
          },
        },
      },
    });

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    return NextResponse.json(order);
  } catch (error) {
    if (error instanceof Response) return error;
    console.error("Order detail error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// PUT: Update order fields, status change with history
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await requireAuth(["logistics"]);

    const existing = await prisma.order.findUnique({
      where: { id: params.id },
      select: { id: true, status: true },
    });

    if (!existing) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    const body = await request.json();
    const {
      contactName,
      companyName,
      email,
      phone,
      country,
      currency,
      discount,
      tax,
      shippingCost,
      paymentTerms,
      deliveryTerms,
      shippingMethod,
      trackingNumber,
      trackingUrl,
      shippingAddress,
      notes,
      status,
      statusNote,
      items,
    } = body;

    const updateData: Record<string, unknown> = {};

    // Basic fields
    if (contactName !== undefined) updateData.contactName = contactName.trim();
    if (companyName !== undefined) updateData.companyName = companyName.trim();
    if (email !== undefined) updateData.email = email.trim();
    if (phone !== undefined) updateData.phone = phone || null;
    if (country !== undefined) updateData.country = country || null;
    if (currency !== undefined) updateData.currency = currency;
    if (paymentTerms !== undefined) updateData.paymentTerms = paymentTerms || null;
    if (deliveryTerms !== undefined) updateData.deliveryTerms = deliveryTerms || null;
    if (notes !== undefined) updateData.notes = notes || null;
    if (shippingAddress !== undefined) updateData.shippingAddress = shippingAddress || null;

    // Shipping fields
    if (shippingMethod !== undefined) updateData.shippingMethod = shippingMethod || null;
    if (trackingNumber !== undefined) updateData.trackingNumber = trackingNumber || null;
    if (trackingUrl !== undefined) updateData.trackingUrl = trackingUrl || null;

    // Auto-generate tracking URL if tracking number + method provided
    if (trackingNumber && shippingMethod && trackingUrl === undefined) {
      const urlMap: Record<string, string> = {
        dhl: `https://www.dhl.com/en/express/tracking.html?AWB=${trackingNumber}`,
        fedex: `https://www.fedex.com/fedextrack/?trknbr=${trackingNumber}`,
      };
      if (urlMap[shippingMethod]) {
        updateData.trackingUrl = urlMap[shippingMethod];
      }
    }

    // Financial fields
    if (discount !== undefined) updateData.discount = Number(discount) || 0;
    if (tax !== undefined) updateData.tax = Number(tax) || 0;
    if (shippingCost !== undefined) updateData.shippingCost = Number(shippingCost) || 0;

    // Items update
    if (items && Array.isArray(items)) {
      await prisma.orderItem.deleteMany({ where: { orderId: params.id } });

      const processedItems = items.map((item: Record<string, unknown>, idx: number) => ({
        orderId: params.id,
        productId: (item.productId as string) || null,
        productName: item.productName as string,
        description: (item.description as string) || null,
        sku: (item.sku as string) || null,
        quantity: Number(item.quantity) || 1,
        unit: (item.unit as string) || "pcs",
        unitPrice: Number(item.unitPrice) || 0,
        total: (Number(item.quantity) || 1) * (Number(item.unitPrice) || 0),
        sortOrder: idx,
      }));

      await prisma.orderItem.createMany({ data: processedItems });

      const subtotal = processedItems.reduce((sum: number, it: { total: number }) => sum + it.total, 0);
      updateData.subtotal = subtotal;
      const d = Number(discount ?? body.discount) || 0;
      const t = Number(tax ?? body.tax) || 0;
      const s = Number(shippingCost ?? body.shippingCost) || 0;
      updateData.discount = d;
      updateData.tax = t;
      updateData.shippingCost = s;
      updateData.grandTotal = subtotal - d + t + s;
    }

    // Status change with history
    if (status && status !== existing.status) {
      const validStatuses = [
        "confirmed", "in_production", "quality_check", "ready_to_ship",
        "shipped", "in_transit", "delivered", "completed", "cancelled",
      ];

      if (!validStatuses.includes(status)) {
        return NextResponse.json({ error: `Invalid status: ${status}` }, { status: 400 });
      }

      updateData.status = status;

      await prisma.orderStatusHistory.create({
        data: {
          orderId: params.id,
          fromStatus: existing.status,
          toStatus: status,
          note: statusNote || null,
          createdBy: session.user.name || session.user.email,
        },
      });
    }

    const order = await prisma.order.update({
      where: { id: params.id },
      data: updateData,
      include: {
        items: { orderBy: { sortOrder: "asc" } },
        statusHistory: { orderBy: { createdAt: "desc" } },
        customer: { select: { id: true, name: true, company: true } },
        quotation: { select: { id: true, quotationNumber: true } },
      },
    });

    return NextResponse.json(order);
  } catch (error) {
    if (error instanceof Response) return error;
    console.error("Order update error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
