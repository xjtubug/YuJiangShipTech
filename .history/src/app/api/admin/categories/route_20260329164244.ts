export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// GET: List all categories
export async function GET() {
  try {
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
    console.error("Categories list error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
