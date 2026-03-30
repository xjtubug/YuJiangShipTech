export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAuth } from '@/lib/auth';

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
        { name: { contains: search } },
        { issuer: { contains: search } },
      ];
    }

    const [items, total] = await Promise.all([
      prisma.certificate.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.certificate.count({ where }),
    ]);

    return NextResponse.json({ items, total, page, limit, totalPages: Math.ceil(total / limit) });
  } catch (error) {
    if (error instanceof Response) return error;
    console.error("Certificate list error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireAuth(["admin"]);

    const body = await request.json();
    const { name, issuer, image, pdfUrl, validUntil } = body;

    if (!name) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    const item = await prisma.certificate.create({
      data: {
        name,
        issuer: issuer || "",
        image: image || null,
        pdfUrl: pdfUrl || null,
        validUntil: validUntil ? new Date(validUntil) : null,
      },
    });

    return NextResponse.json({ item }, { status: 201 });
  } catch (error) {
    if (error instanceof Response) return error;
    console.error("Certificate create error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    await requireAuth(["admin"]);

    const body = await request.json();
    const { id, name, issuer, image, pdfUrl, validUntil } = body;

    if (!id) {
      return NextResponse.json({ error: "ID is required" }, { status: 400 });
    }

    const item = await prisma.certificate.update({
      where: { id },
      data: {
        name: name ?? undefined,
        issuer: issuer ?? undefined,
        image: image ?? undefined,
        pdfUrl: pdfUrl ?? undefined,
        validUntil: validUntil !== undefined ? (validUntil ? new Date(validUntil) : null) : undefined,
      },
    });

    return NextResponse.json({ item });
  } catch (error) {
    if (error instanceof Response) return error;
    console.error("Certificate update error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    await requireAuth(["admin"]);

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "ID is required" }, { status: 400 });
    }

    await prisma.certificate.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof Response) return error;
    console.error("Certificate delete error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
