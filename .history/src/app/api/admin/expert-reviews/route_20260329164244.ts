export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// GET: List expert reviews (optional productId filter)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const productId = searchParams.get("productId");

    const where = productId ? { productId } : {};

    const reviews = await prisma.expertReview.findMany({
      where,
      include: {
        expert: {
          select: { id: true, name: true, title: true, avatar: true },
        },
        product: {
          select: { id: true, nameEn: true, sku: true, slug: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ reviews, total: reviews.length });
  } catch (error) {
    console.error("Expert reviews list error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST: Create expert review
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { expertId, productId, content, rating } = body;

    if (!expertId || !productId || !content) {
      return NextResponse.json(
        { error: "expertId, productId, and content are required" },
        { status: 400 }
      );
    }

    const expert = await prisma.adminUser.findUnique({
      where: { id: expertId },
    });
    if (!expert || expert.role !== "expert") {
      return NextResponse.json(
        { error: "Expert user not found" },
        { status: 404 }
      );
    }

    const product = await prisma.product.findUnique({
      where: { id: productId },
    });
    if (!product) {
      return NextResponse.json(
        { error: "Product not found" },
        { status: 404 }
      );
    }

    const parsedRating = parseInt(String(rating));
    if (rating !== undefined && (isNaN(parsedRating) || parsedRating < 1 || parsedRating > 5)) {
      return NextResponse.json(
        { error: "Rating must be between 1 and 5" },
        { status: 400 }
      );
    }

    const review = await prisma.expertReview.create({
      data: {
        expertId,
        productId,
        content: content.trim(),
        rating: parsedRating || 5,
      },
      include: {
        expert: {
          select: { id: true, name: true, title: true, avatar: true },
        },
        product: {
          select: { id: true, nameEn: true, sku: true, slug: true },
        },
      },
    });

    return NextResponse.json(review, { status: 201 });
  } catch (error) {
    console.error("Expert review create error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
