export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .substring(0, 100);
}

interface BatchProductInput {
  nameEn: string;
  nameZh?: string;
  nameJa?: string;
  nameAr?: string;
  descEn?: string;
  descZh?: string;
  descJa?: string;
  descAr?: string;
  sku: string;
  priceUsd?: number;
  moq?: number;
  leadTimeDays?: number;
  categoryId: string;
  images?: string | string[];
  specsJson?: string | Record<string, unknown>;
  videoUrl?: string;
  pdfUrl?: string;
  featured?: boolean;
  published?: boolean;
  status?: string;
}

interface BatchError {
  index: number;
  sku?: string;
  error: string;
}

// POST: Batch upload products
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { products } = body;

    if (!Array.isArray(products) || products.length === 0) {
      return NextResponse.json(
        { error: "Request body must contain a non-empty 'products' array" },
        { status: 400 }
      );
    }

    if (products.length > 500) {
      return NextResponse.json(
        { error: "Maximum 500 products per batch" },
        { status: 400 }
      );
    }

    const errors: BatchError[] = [];
    let createdCount = 0;

    for (let i = 0; i < products.length; i++) {
      const item: BatchProductInput = products[i];

      if (!item.nameEn || !item.sku || !item.categoryId) {
        errors.push({
          index: i,
          sku: item.sku,
          error: "nameEn, sku, and categoryId are required",
        });
        continue;
      }

      try {
        const existingSku = await prisma.product.findUnique({
          where: { sku: item.sku },
        });
        if (existingSku) {
          errors.push({ index: i, sku: item.sku, error: "SKU already exists" });
          continue;
        }

        const category = await prisma.category.findUnique({
          where: { id: item.categoryId },
        });
        if (!category) {
          errors.push({
            index: i,
            sku: item.sku,
            error: `Category '${item.categoryId}' not found`,
          });
          continue;
        }

        let slug = generateSlug(item.nameEn);
        const existingSlug = await prisma.product.findUnique({ where: { slug } });
        if (existingSlug) {
          slug = `${slug}-${Date.now()}-${i}`;
        }

        await prisma.product.create({
          data: {
            slug,
            nameEn: item.nameEn.trim(),
            nameZh: (item.nameZh || "").trim(),
            nameJa: (item.nameJa || "").trim(),
            nameAr: (item.nameAr || "").trim(),
            descEn: (item.descEn || "").trim(),
            descZh: (item.descZh || "").trim(),
            descJa: (item.descJa || "").trim(),
            descAr: (item.descAr || "").trim(),
            sku: item.sku.trim(),
            priceUsd: parseFloat(String(item.priceUsd)) || 0,
            moq: parseInt(String(item.moq)) || 1,
            leadTimeDays: parseInt(String(item.leadTimeDays)) || 30,
            categoryId: item.categoryId,
            images:
              typeof item.images === "string"
                ? item.images
                : JSON.stringify(item.images || []),
            specsJson:
              typeof item.specsJson === "string"
                ? item.specsJson
                : JSON.stringify(item.specsJson || {}),
            videoUrl: item.videoUrl || null,
            pdfUrl: item.pdfUrl || null,
            featured: Boolean(item.featured),
            published: item.published !== false,
            status: item.status || "published",
          },
        });

        createdCount++;
      } catch (err) {
        const message = err instanceof Error ? err.message : "Unknown error";
        errors.push({ index: i, sku: item.sku, error: message });
      }
    }

    return NextResponse.json({
      createdCount,
      totalSubmitted: products.length,
      errors,
    }, { status: createdCount > 0 ? 201 : 400 });
  } catch (error) {
    console.error("Batch upload error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
