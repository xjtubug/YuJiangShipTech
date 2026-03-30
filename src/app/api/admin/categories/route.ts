export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
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
