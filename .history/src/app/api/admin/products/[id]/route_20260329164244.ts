export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// GET: Get single product
export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        category: true,
        expertReviews: {
          include: { expert: { select: { id: true, name: true, title: true, avatar: true } } },
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    return NextResponse.json(product);
  } catch (error) {
    console.error("Product get error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PUT: Update product (all fields)
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await request.json();

    const existing = await prisma.product.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    const {
      nameEn, nameZh, nameJa, nameAr,
      descEn, descZh, descJa, descAr,
      sku, priceUsd, moq, leadTimeDays,
      categoryId, images, specsJson,
      videoUrl, pdfUrl, featured, published, status,
    } = body;

    if (sku && sku !== existing.sku) {
      const skuConflict = await prisma.product.findUnique({ where: { sku } });
      if (skuConflict) {
        return NextResponse.json(
          { error: `SKU '${sku}' already exists` },
          { status: 409 }
        );
      }
    }

    if (categoryId) {
      const category = await prisma.category.findUnique({ where: { id: categoryId } });
      if (!category) {
        return NextResponse.json(
          { error: "Category not found" },
          { status: 404 }
        );
      }
    }

    const data: Record<string, unknown> = {};
    if (nameEn !== undefined) data.nameEn = nameEn.trim();
    if (nameZh !== undefined) data.nameZh = nameZh.trim();
    if (nameJa !== undefined) data.nameJa = nameJa.trim();
    if (nameAr !== undefined) data.nameAr = nameAr.trim();
    if (descEn !== undefined) data.descEn = descEn.trim();
    if (descZh !== undefined) data.descZh = descZh.trim();
    if (descJa !== undefined) data.descJa = descJa.trim();
    if (descAr !== undefined) data.descAr = descAr.trim();
    if (sku !== undefined) data.sku = sku.trim();
    if (priceUsd !== undefined) data.priceUsd = parseFloat(priceUsd) || 0;
    if (moq !== undefined) data.moq = parseInt(moq) || 1;
    if (leadTimeDays !== undefined) data.leadTimeDays = parseInt(leadTimeDays) || 30;
    if (categoryId !== undefined) data.categoryId = categoryId;
    if (images !== undefined) data.images = typeof images === "string" ? images : JSON.stringify(images);
    if (specsJson !== undefined) data.specsJson = typeof specsJson === "string" ? specsJson : JSON.stringify(specsJson);
    if (videoUrl !== undefined) data.videoUrl = videoUrl || null;
    if (pdfUrl !== undefined) data.pdfUrl = pdfUrl || null;
    if (featured !== undefined) data.featured = Boolean(featured);
    if (published !== undefined) data.published = Boolean(published);
    if (status !== undefined) data.status = status;

    const product = await prisma.product.update({
      where: { id },
      data,
      include: { category: { select: { id: true, nameEn: true, slug: true } } },
    });

    return NextResponse.json(product);
  } catch (error) {
    console.error("Product update error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE: Delete product
export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    const existing = await prisma.product.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    await prisma.product.delete({ where: { id } });

    return NextResponse.json({ success: true, message: "Product deleted" });
  } catch (error) {
    console.error("Product delete error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PATCH: Quick actions (toggle published, toggle featured, change status)
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await request.json();
    const { action, value } = body;

    const existing = await prisma.product.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    let data: Record<string, unknown> = {};

    switch (action) {
      case "togglePublished":
        data.published = !existing.published;
        break;
      case "toggleFeatured":
        data.featured = !existing.featured;
        break;
      case "setStatus":
        if (!["draft", "published", "archived"].includes(value)) {
          return NextResponse.json(
            { error: "Invalid status. Must be draft, published, or archived" },
            { status: 400 }
          );
        }
        data.status = value;
        if (value === "published") data.published = true;
        if (value === "archived") data.published = false;
        break;
      default:
        return NextResponse.json(
          { error: "Invalid action. Use togglePublished, toggleFeatured, or setStatus" },
          { status: 400 }
        );
    }

    const product = await prisma.product.update({
      where: { id },
      data,
    });

    return NextResponse.json(product);
  } catch (error) {
    console.error("Product patch error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
