export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAuth } from '@/lib/auth';

// GET: List all categories
export async function GET() {
  try {
    await requireAuth(["admin"]);

    const categories = await prisma.category.findMany({
      include: {
        _count: { select: { products: true } },
        children: {
          select: { id: true, slug: true, nameEn: true, nameZh: true },
        },
      },
      orderBy: { nameEn: "asc" },
    });

    return NextResponse.json({ categories });
  } catch (error) {
    if (error instanceof Response) return error;
    console.error("Categories list error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST: Create category
export async function POST(request: NextRequest) {
  try {
    await requireAuth(["admin"]);
    const body = await request.json();
    const { nameEn, nameZh, nameJa, nameAr, image, parentId } = body;

    if (!nameEn?.trim()) {
      return NextResponse.json({ error: "英文名称必填" }, { status: 400 });
    }

    const slug = nameEn
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "") + "-" + Date.now().toString(36);

    const category = await prisma.category.create({
      data: {
        slug,
        nameEn: nameEn.trim(),
        nameZh: nameZh?.trim() || nameEn.trim(),
        nameJa: nameJa?.trim() || "",
        nameAr: nameAr?.trim() || "",
        image: image || null,
        parentId: parentId || null,
      },
    });

    return NextResponse.json({ category }, { status: 201 });
  } catch (error) {
    if (error instanceof Response) return error;
    console.error("Category create error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// PUT: Update category
export async function PUT(request: NextRequest) {
  try {
    await requireAuth(["admin"]);
    const body = await request.json();
    const { id, nameEn, nameZh, nameJa, nameAr, image, parentId } = body;

    if (!id) return NextResponse.json({ error: "缺少ID" }, { status: 400 });
    if (!nameEn?.trim()) return NextResponse.json({ error: "英文名称必填" }, { status: 400 });

    const category = await prisma.category.update({
      where: { id },
      data: {
        nameEn: nameEn.trim(),
        nameZh: nameZh?.trim() || nameEn.trim(),
        nameJa: nameJa?.trim() || "",
        nameAr: nameAr?.trim() || "",
        image: image || null,
        parentId: parentId || null,
      },
    });

    return NextResponse.json({ category });
  } catch (error) {
    if (error instanceof Response) return error;
    console.error("Category update error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// DELETE: Delete category
export async function DELETE(request: NextRequest) {
  try {
    await requireAuth(["admin"]);
    const id = request.nextUrl.searchParams.get("id");
    if (!id) return NextResponse.json({ error: "缺少ID" }, { status: 400 });

    // Check if category has products
    const count = await prisma.product.count({ where: { categoryId: id } });
    if (count > 0) {
      return NextResponse.json(
        { error: `该分类下有 ${count} 个产品，请先移除或迁移产品` },
        { status: 400 }
      );
    }

    // Check children
    const children = await prisma.category.count({ where: { parentId: id } });
    if (children > 0) {
      return NextResponse.json(
        { error: `该分类下有 ${children} 个子分类，请先删除子分类` },
        { status: 400 }
      );
    }

    await prisma.category.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof Response) return error;
    console.error("Category delete error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
