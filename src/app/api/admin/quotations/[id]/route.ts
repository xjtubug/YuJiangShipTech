export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

// GET: Single quotation with items
export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireAuth(["viewer"]);

    const quotation = await prisma.quotation.findUnique({
      where: { id: params.id },
      include: {
        items: { orderBy: { sortOrder: "asc" } },
        customer: { select: { id: true, name: true, company: true, email: true } },
        inquiry: {
          select: {
            id: true,
            inquiryNumber: true,
            items: true,
          },
        },
      },
    });

    if (!quotation) {
      return NextResponse.json({ error: "Quotation not found" }, { status: 404 });
    }

    return NextResponse.json(quotation);
  } catch (error) {
    if (error instanceof Response) return error;
    console.error("Quotation detail error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// PUT: Update quotation
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireAuth(["sales"]);

    const existing = await prisma.quotation.findUnique({
      where: { id: params.id },
      select: { id: true, status: true },
    });

    if (!existing) {
      return NextResponse.json({ error: "Quotation not found" }, { status: 404 });
    }

    // Only draft quotations can be fully edited
    if (existing.status !== "draft") {
      return NextResponse.json(
        { error: "Only draft quotations can be edited" },
        { status: 400 }
      );
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
      validDays,
      paymentTerms,
      deliveryTerms,
      notes,
      attachments,
      items,
    } = body;

    // Build update data
    const updateData: Record<string, unknown> = {};
    if (contactName !== undefined) updateData.contactName = contactName.trim();
    if (companyName !== undefined) updateData.companyName = companyName.trim();
    if (email !== undefined) updateData.email = email.trim();
    if (phone !== undefined) updateData.phone = phone || null;
    if (country !== undefined) updateData.country = country || null;
    if (currency !== undefined) updateData.currency = currency;
    if (validDays !== undefined) updateData.validDays = Number(validDays) || 30;
    if (paymentTerms !== undefined) updateData.paymentTerms = paymentTerms;
    if (deliveryTerms !== undefined) updateData.deliveryTerms = deliveryTerms || null;
    if (notes !== undefined) updateData.notes = notes || null;
    if (attachments !== undefined) updateData.attachments = JSON.stringify(attachments);

    // If items are provided, recalculate totals
    if (items && Array.isArray(items)) {
      // Delete existing items and recreate
      await prisma.quotationItem.deleteMany({ where: { quotationId: params.id } });

      const processedItems = items.map((item: Record<string, unknown>, idx: number) => ({
        quotationId: params.id,
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

      await prisma.quotationItem.createMany({ data: processedItems });

      const subtotal = processedItems.reduce((sum: number, it: { total: number }) => sum + it.total, 0);
      const discountVal = Number(discount ?? body.discount) || 0;
      const taxVal = Number(tax ?? body.tax) || 0;
      const shippingVal = Number(shippingCost ?? body.shippingCost) || 0;

      updateData.subtotal = subtotal;
      updateData.discount = discountVal;
      updateData.tax = taxVal;
      updateData.shippingCost = shippingVal;
      updateData.grandTotal = subtotal - discountVal + taxVal + shippingVal;
    } else {
      // Update only financial fields if provided
      if (discount !== undefined) updateData.discount = Number(discount) || 0;
      if (tax !== undefined) updateData.tax = Number(tax) || 0;
      if (shippingCost !== undefined) updateData.shippingCost = Number(shippingCost) || 0;
    }

    const quotation = await prisma.quotation.update({
      where: { id: params.id },
      data: updateData,
      include: {
        items: { orderBy: { sortOrder: "asc" } },
        customer: { select: { id: true, name: true, company: true } },
        inquiry: { select: { id: true, inquiryNumber: true } },
      },
    });

    return NextResponse.json(quotation);
  } catch (error) {
    if (error instanceof Response) return error;
    console.error("Quotation update error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// DELETE: Delete draft quotations only
export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireAuth(["sales"]);

    const existing = await prisma.quotation.findUnique({
      where: { id: params.id },
      select: { id: true, status: true },
    });

    if (!existing) {
      return NextResponse.json({ error: "Quotation not found" }, { status: 404 });
    }

    if (existing.status !== "draft") {
      return NextResponse.json(
        { error: "Only draft quotations can be deleted" },
        { status: 400 }
      );
    }

    await prisma.quotation.delete({ where: { id: params.id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof Response) return error;
    console.error("Quotation delete error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
