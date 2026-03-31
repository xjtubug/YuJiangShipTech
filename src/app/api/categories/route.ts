export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getOrSet } from "@/lib/cache";

// GET: Public list of categories with hierarchy
export async function GET() {
  try {
    const data = await getOrSet("public:categories", async () => {
      const categories = await prisma.category.findMany({
        select: {
          id: true,
          slug: true,
          nameEn: true,
          nameZh: true,
          nameJa: true,
          nameAr: true,
          parentId: true,
          children: {
            select: {
              id: true,
              slug: true,
              nameEn: true,
              nameZh: true,
              nameJa: true,
              nameAr: true,
              parentId: true,
            },
            orderBy: { nameEn: "asc" },
          },
        },
        where: { parentId: null },
        orderBy: { nameEn: "asc" },
      });

      return { categories };
    }, 120);

    return NextResponse.json(data);
  } catch (error) {
    console.error("Public categories API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
