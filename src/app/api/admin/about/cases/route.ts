export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\u4e00-\u9fff]+/g, "-")
    .replace(/^-|-$/g, "")
    .substring(0, 100);
}

// GET: List case studies with pagination and search
export async function GET(request: NextRequest) {
  try {
    await requireAuth(["admin"]);

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

    return NextResponse.json({
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    if (error instanceof Response) return error;
    console.error("CaseStudy list error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST: Create a new case study
export async function POST(request: NextRequest) {
  try {
    await requireAuth(["admin"]);

    const body = await request.json();
    const {
      titleEn, titleZh, clientName, clientLogo, country,
      image, images, videoUrl, latitude, longitude,
      locationName, contentEn, contentZh, rating,
    } = body;

    if (!titleEn && !titleZh) {
      return NextResponse.json(
        { error: "Title is required" },
        { status: 400 }
      );
    }
    if (!clientName) {
      return NextResponse.json(
        { error: "Client name is required" },
        { status: 400 }
      );
    }

    const slug =
      generateSlug(titleEn || titleZh) + "-" + Date.now().toString(36);

    const item = await prisma.caseStudy.create({
      data: {
        slug,
        titleEn: (titleEn || "").trim(),
        titleZh: (titleZh || "").trim(),
        clientName: (clientName || "").trim(),
        clientLogo: clientLogo || null,
        country: (country || "").trim(),
        image: image || null,
        images: typeof images === "string" ? images : JSON.stringify(images || []),
        videoUrl: videoUrl || null,
        latitude: latitude ? parseFloat(latitude) : null,
        longitude: longitude ? parseFloat(longitude) : null,
        locationName: locationName || null,
        contentEn: (contentEn || "").trim(),
        contentZh: (contentZh || "").trim(),
        rating: parseInt(rating) || 5,
      },
    });

    return NextResponse.json({ item }, { status: 201 });
  } catch (error) {
    if (error instanceof Response) return error;
    console.error("CaseStudy create error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PUT: Update a case study by id
export async function PUT(request: NextRequest) {
  try {
    await requireAuth(["admin"]);

    const body = await request.json();
    const {
      id, titleEn, titleZh, clientName, clientLogo, country,
      image, images, videoUrl, latitude, longitude,
      locationName, contentEn, contentZh, rating,
    } = body;

    if (!id) {
      return NextResponse.json(
        { error: "ID is required" },
        { status: 400 }
      );
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
        images: images !== undefined
          ? typeof images === "string"
            ? images
            : JSON.stringify(images)
          : undefined,
        videoUrl: videoUrl ?? undefined,
        latitude: latitude !== undefined ? (latitude ? parseFloat(latitude) : null) : undefined,
        longitude: longitude !== undefined ? (longitude ? parseFloat(longitude) : null) : undefined,
        locationName: locationName ?? undefined,
        contentEn: contentEn ?? undefined,
        contentZh: contentZh ?? undefined,
        rating: rating !== undefined ? (parseInt(rating) || 5) : undefined,
      },
    });

    return NextResponse.json({ item });
  } catch (error) {
    if (error instanceof Response) return error;
    console.error("CaseStudy update error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE: Delete a case study by query param ?id=xxx
export async function DELETE(request: NextRequest) {
  try {
    await requireAuth(["admin"]);

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "ID is required" },
        { status: 400 }
      );
    }

    await prisma.caseStudy.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof Response) return error;
    console.error("CaseStudy delete error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
