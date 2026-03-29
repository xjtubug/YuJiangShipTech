export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\u4e00-\u9fff]+/g, "-")
    .replace(/^-|-$/g, "")
    .substring(0, 100);
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "50")));
    const search = searchParams.get("search")?.trim();

    const where: Record<string, unknown> = {};
    if (search) {
      where.OR = [
        { titleEn: { contains: search } },
        { titleZh: { contains: search } },
        { clientName: { contains: search } },
        { country: { contains: search } },
      ];
    }

    const [items, total] = await Promise.all([
      prisma.caseStudy.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.caseStudy.count({ where }),
    ]);

    return NextResponse.json({ items, total, page, limit, totalPages: Math.ceil(total / limit) });
  } catch (error) {
    console.error("CaseStudy list error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { titleEn, titleZh, clientName, clientLogo, country, image, contentEn, contentZh, rating } = body;

    if (!titleEn && !titleZh) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }
    if (!clientName) {
      return NextResponse.json({ error: "Client name is required" }, { status: 400 });
    }

    const slug = generateSlug(titleEn || titleZh) + "-" + Date.now().toString(36);

    const item = await prisma.caseStudy.create({
      data: {
        slug,
        titleEn: titleEn || "",
        titleZh: titleZh || "",
        clientName: clientName || "",
        clientLogo: clientLogo || null,
        country: country || "",
        image: image || null,
        contentEn: contentEn || "",
        contentZh: contentZh || "",
        rating: rating ?? 5,
      },
    });

    return NextResponse.json({ item }, { status: 201 });
  } catch (error) {
    console.error("CaseStudy create error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, titleEn, titleZh, clientName, clientLogo, country, image, contentEn, contentZh, rating } = body;

    if (!id) {
      return NextResponse.json({ error: "ID is required" }, { status: 400 });
    }

    const item = await prisma.caseStudy.update({
      where: { id },
      data: {
        titleEn: titleEn ?? undefined,
        titleZh: titleZh ?? undefined,
        clientName: clientName ?? undefined,
        clientLogo: clientLogo ?? undefined,
        country: country ?? undefined,
        image: image ?? undefined,
        contentEn: contentEn ?? undefined,
        contentZh: contentZh ?? undefined,
        rating: rating ?? undefined,
      },
    });

    return NextResponse.json({ item });
  } catch (error) {
    console.error("CaseStudy update error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "ID is required" }, { status: 400 });
    }

    await prisma.caseStudy.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("CaseStudy delete error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
