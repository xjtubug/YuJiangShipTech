export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// GET: List products with pagination, search, category filter
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "20")));
    const search = searchParams.get("search")?.trim();
    const categoryId = searchParams.get("categoryId");
    const status = searchParams.get("status");
    const featured = searchParams.get("featured");

    const where: Record<string, unknown> = {};

    if (search) {
      where.OR = [
        { nameEn: { contains: search } },
        { nameZh: { contains: search } },
        { sku: { contains: search } },
      ];
    }

    if (categoryId) {
      where.categoryId = categoryId;
    }

    if (status) {
      where.status = status;
    }

    if (featured === "true") {
      where.featured = true;
    }

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        include: { category: { select: { id: true, nameEn: true, slug: true } } },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.product.count({ where }),
    ]);

    return NextResponse.json({
      products,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error("Products list error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .substring(0, 100);
}

// POST: Create new product
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const {
      nameEn, nameZh, nameJa, nameAr,
      descEn, descZh, descJa, descAr,
      sku, priceUsd, moq, leadTimeDays,
      categoryId, images, specsJson,
      videoUrl, pdfUrl, featured, published, status,
    } = body;

    if (!nameEn || !sku || !categoryId) {
      return NextResponse.json(
        { error: "nameEn, sku, and categoryId are required" },
        { status: 400 }
      );
    }

    const existingSku = await prisma.product.findUnique({ where: { sku } });
    if (existingSku) {
      return NextResponse.json(
        { error: `SKU '${sku}' already exists` },
        { status: 409 }
      );
    }

    const category = await prisma.category.findUnique({ where: { id: categoryId } });
    if (!category) {
      return NextResponse.json(
        { error: "Category not found" },
        { status: 404 }
      );
    }

    let slug = generateSlug(nameEn);
    const existingSlug = await prisma.product.findUnique({ where: { slug } });
    if (existingSlug) {
      slug = `${slug}-${Date.now()}`;
    }

    const product = await prisma.product.create({
      data: {
        slug,
        nameEn: nameEn.trim(),
        nameZh: (nameZh || "").trim(),
        nameJa: (nameJa || "").trim(),
        nameAr: (nameAr || "").trim(),
        descEn: (descEn || "").trim(),
        descZh: (descZh || "").trim(),
        descJa: (descJa || "").trim(),
        descAr: (descAr || "").trim(),
        sku: sku.trim(),
        priceUsd: parseFloat(priceUsd) || 0,
        moq: parseInt(moq) || 1,
        leadTimeDays: parseInt(leadTimeDays) || 30,
        categoryId,
        images: typeof images === "string" ? images : JSON.stringify(images || []),
        specsJson: typeof specsJson === "string" ? specsJson : JSON.stringify(specsJson || {}),
        videoUrl: videoUrl || null,
        pdfUrl: pdfUrl || null,
        featured: Boolean(featured),
        published: published !== false,
        status: status || "published",
      },
      include: { category: { select: { id: true, nameEn: true, slug: true } } },
    });

    return NextResponse.json(product, { status: 201 });
  } catch (error) {
    console.error("Product create error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
