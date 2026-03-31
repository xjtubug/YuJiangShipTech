export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

async function generateQuotationNumber(): Promise<string> {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  const prefix = `QT-${y}${m}${d}-`;

  const latest = await prisma.quotation.findFirst({
    where: { quotationNumber: { startsWith: prefix } },
    orderBy: { quotationNumber: "desc" },
    select: { quotationNumber: true },
  });

  let seq = 1;
  if (latest) {
    const lastSeq = parseInt(latest.quotationNumber.slice(-4), 10);
    if (!isNaN(lastSeq)) seq = lastSeq + 1;
  }

  return `${prefix}${String(seq).padStart(4, "0")}`;
}

// GET: List quotations with filtering, pagination
export async function GET(request: NextRequest) {
  try {
    await requireAuth(["viewer"]);

    const { searchParams } = request.nextUrl;
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") ?? "20", 10)));
    const status = searchParams.get("status");
    const search = searchParams.get("search")?.trim();
    const dateFrom = searchParams.get("dateFrom");
    const dateTo = searchParams.get("dateTo");
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};
    if (status) where.status = status;

    if (search) {
      where.OR = [
        { quotationNumber: { contains: search } },
        { companyName: { contains: search } },
        { contactName: { contains: search } },
        { email: { contains: search } },
      ];
    }

    if (dateFrom || dateTo) {
      where.createdAt = {};
      if (dateFrom) (where.createdAt as Record<string, unknown>).gte = new Date(dateFrom);
      if (dateTo) {
        const end = new Date(dateTo);
        end.setHours(23, 59, 59, 999);
        (where.createdAt as Record<string, unknown>).lte = end;
      }
    }

    const [quotations, total] = await Promise.all([
      prisma.quotation.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
        include: {
          items: { orderBy: { sortOrder: "asc" } },
          customer: { select: { id: true, name: true, company: true } },
          inquiry: { select: { id: true, inquiryNumber: true } },
        },
      }),
      prisma.quotation.count({ where }),
    ]);

    return NextResponse.json({
      quotations,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    if (error instanceof Response) return error;
    console.error("Quotations list error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST: Create quotation
export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth(["sales"]);

    const body = await request.json();
    const {
      inquiryId,
      customerId,
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

    if (!contactName || !companyName || !email) {
      return NextResponse.json(
        { error: "contactName, companyName, and email are required" },
        { status: 400 }
      );
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: "At least one item is required" },
        { status: 400 }
      );
    }

    const quotationNumber = await generateQuotationNumber();

    // Calculate totals
    const processedItems = items.map((item: Record<string, unknown>, idx: number) => ({
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

    const subtotal = processedItems.reduce((sum: number, it: { total: number }) => sum + it.total, 0);
    const discountVal = Number(discount) || 0;
    const taxVal = Number(tax) || 0;
    const shippingVal = Number(shippingCost) || 0;
    const grandTotal = subtotal - discountVal + taxVal + shippingVal;

    const quotation = await prisma.quotation.create({
      data: {
        quotationNumber,
        inquiryId: inquiryId || null,
        customerId: customerId || null,
        contactName: contactName.trim(),
        companyName: companyName.trim(),
        email: email.trim(),
        phone: phone || null,
        country: country || null,
        currency: currency || "USD",
        subtotal,
        discount: discountVal,
        tax: taxVal,
        shippingCost: shippingVal,
        grandTotal,
        validDays: Number(validDays) || 30,
        paymentTerms: paymentTerms || "T/T 30% deposit, 70% before shipment",
        deliveryTerms: deliveryTerms || null,
        notes: notes || null,
        attachments: attachments ? JSON.stringify(attachments) : "[]",
        status: "draft",
        createdBy: session.user.name || session.user.email,
        items: {
          create: processedItems,
        },
      },
      include: {
        items: { orderBy: { sortOrder: "asc" } },
        customer: { select: { id: true, name: true, company: true } },
        inquiry: { select: { id: true, inquiryNumber: true } },
      },
    });

    // If created from inquiry, update inquiry status to "quoted"
    if (inquiryId) {
      await prisma.inquiry.update({
        where: { id: inquiryId },
        data: { status: "quoted" },
      }).catch(() => {});
    }

    return NextResponse.json(quotation, { status: 201 });
  } catch (error) {
    if (error instanceof Response) return error;
    console.error("Quotation create error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
