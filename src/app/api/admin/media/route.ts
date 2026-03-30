export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { removeObjectFromMinio } from "@/lib/minio";

// GET: List media files with filtering, search, pagination
export async function GET(request: NextRequest) {
  try {
    await requireAuth(["admin", "sales"]);

    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "24")));
    const category = searchParams.get("category") || "";
    const mimeType = searchParams.get("mimeType") || "";
    const search = searchParams.get("search") || "";

    const where: Record<string, unknown> = {};

    if (category && category !== "all") {
      where.category = category;
    }

    if (mimeType) {
      where.mimeType = { contains: mimeType };
    }

    if (search) {
      where.OR = [
        { originalName: { contains: search } },
        { filename: { contains: search } },
        { alt: { contains: search } },
      ];
    }

    const [items, total] = await Promise.all([
      prisma.mediaFile.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.mediaFile.count({ where }),
    ]);

    // Aggregate stats
    const stats = await prisma.mediaFile.aggregate({
      _count: true,
      _sum: { size: true },
    });

    const imageCount = await prisma.mediaFile.count({
      where: { mimeType: { startsWith: "image/" } },
    });
    const videoCount = await prisma.mediaFile.count({
      where: { mimeType: { startsWith: "video/" } },
    });

    return NextResponse.json({
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      stats: {
        totalFiles: stats._count,
        totalSize: stats._sum.size || 0,
        imageCount,
        videoCount,
      },
    });
  } catch (error) {
    if (error instanceof Response) return error;
    console.error("Media list error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// DELETE: Remove a media file by id
export async function DELETE(request: NextRequest) {
  try {
    await requireAuth(["admin"]);

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    const ids = searchParams.get("ids"); // comma-separated for bulk delete

    const idsToDelete: string[] = [];

    if (ids) {
      idsToDelete.push(...ids.split(",").map((s) => s.trim()).filter(Boolean));
    } else if (id) {
      idsToDelete.push(id);
    } else {
      return NextResponse.json({ error: "Missing id or ids parameter" }, { status: 400 });
    }

    const files = await prisma.mediaFile.findMany({
      where: { id: { in: idsToDelete } },
    });

    if (files.length === 0) {
      return NextResponse.json({ error: "Files not found" }, { status: 404 });
    }

    for (const file of files) {
      try {
        await removeObjectFromMinio(file.url);
      } catch {
        // Object may already be deleted
      }

      try {
        const ext = file.url.lastIndexOf(".");
        if (ext !== -1) {
          await removeObjectFromMinio(`${file.url.substring(0, ext)}_optimized.webp`);
        }
      } catch {
        // Optimized version may not exist
      }
    }

    // Delete from database
    await prisma.mediaFile.deleteMany({
      where: { id: { in: idsToDelete } },
    });

    return NextResponse.json({ deleted: files.length });
  } catch (error) {
    if (error instanceof Response) return error;
    console.error("Media delete error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// PATCH: Update category for one or more files
export async function PATCH(request: NextRequest) {
  try {
    await requireAuth(["admin"]);

    const body = await request.json();
    const { ids, category } = body as { ids: string[]; category: string };

    if (!ids?.length || !category) {
      return NextResponse.json({ error: "Missing ids or category" }, { status: 400 });
    }

    await prisma.mediaFile.updateMany({
      where: { id: { in: ids } },
      data: { category },
    });

    return NextResponse.json({ updated: ids.length });
  } catch (error) {
    if (error instanceof Response) return error;
    console.error("Media patch error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
