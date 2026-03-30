export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import sharp from "sharp";
import prisma from "@/lib/prisma";
import { uploadBufferToMinio } from "@/lib/minio";

const MAX_SIZE_DEFAULT = 10 * 1024 * 1024; // 10MB
const MAX_SIZE_VIDEO = 50 * 1024 * 1024; // 50MB for video files

const VIDEO_EXTENSIONS = new Set(["mp4", "webm"]);
const OPTIMIZABLE_EXTENSIONS = new Set(["jpg", "jpeg", "png", "webp"]);

const ALLOWED_EXTENSIONS = new Set([
  "pdf", "doc", "docx", "xls", "xlsx", "jpg", "jpeg", "png", "svg", "webp", "gif", "zip",
  "mp4", "webm",
]);

function getExtension(filename: string): string {
  return filename.split(".").pop()?.toLowerCase() || "";
}

// POST: Upload file
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const category = (formData.get("category") as string) || "general";

    if (!file) {
      return NextResponse.json(
        { error: "No file provided. Use form field 'file'" },
        { status: 400 }
      );
    }

    const ext = getExtension(file.name);
    if (!ALLOWED_EXTENSIONS.has(ext)) {
      return NextResponse.json(
        {
          error: `File type '.${ext}' not allowed. Accepted: ${Array.from(ALLOWED_EXTENSIONS).join(", ")}`,
        },
        { status: 400 }
      );
    }

    const maxSize = VIDEO_EXTENSIONS.has(ext) ? MAX_SIZE_VIDEO : MAX_SIZE_DEFAULT;
    const maxLabel = VIDEO_EXTENSIONS.has(ext) ? "50MB" : "10MB";
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: `File too large. Maximum size is ${maxLabel}` },
        { status: 400 }
      );
    }

    // Generate unique filename
    const timestamp = Date.now();
    const randomSuffix = Math.random().toString(36).substring(2, 8);
    const safeName = file.name
      .replace(/[^a-zA-Z0-9._-]/g, "_")
      .substring(0, 100);
    const filename = `${timestamp}-${randomSuffix}-${safeName}`;
    const objectName = `uploads/${filename}`;

    const buffer = Buffer.from(await file.arrayBuffer());
    const fileUrl = await uploadBufferToMinio(objectName, buffer, {
      "Content-Type": file.type || "application/octet-stream",
      "Cache-Control": "public, max-age=31536000, immutable",
    });

    // Image optimization & dimension detection (non-blocking)
    let width: number | undefined;
    let height: number | undefined;
    let optimizedUrl: string | undefined;

    if (OPTIMIZABLE_EXTENSIONS.has(ext)) {
      try {
        const metadata = await sharp(buffer).metadata();
        width = metadata.width;
        height = metadata.height;

        // Create optimized WebP version (max 1920px wide, quality 85)
        const optimizedName = `${timestamp}-${randomSuffix}-${safeName.replace(/\.[^.]+$/, '')}_optimized.webp`;
        const optimizedObjectName = `uploads/${optimizedName}`;
        const optimizedBuffer = await sharp(buffer)
          .resize({ width: 1920, withoutEnlargement: true })
          .webp({ quality: 85 })
          .toBuffer();

        optimizedUrl = await uploadBufferToMinio(optimizedObjectName, optimizedBuffer, {
          "Content-Type": "image/webp",
          "Cache-Control": "public, max-age=31536000, immutable",
        });
      } catch (e) {
        console.warn("Image optimization failed (non-critical):", e);
      }
    }

    // Save MediaFile record in database (non-blocking)
    try {
      await prisma.mediaFile.create({
        data: {
          filename,
          originalName: file.name,
          url: fileUrl,
          mimeType: file.type,
          size: file.size,
          width: width ?? null,
          height: height ?? null,
          category,
          createdBy: "admin",
        },
      });
    } catch (e) {
      console.warn("Failed to create MediaFile record (non-critical):", e);
    }

    return NextResponse.json(
      {
        url: fileUrl,
        filename,
        originalName: file.name,
        size: file.size,
        type: file.type,
        width,
        height,
        optimizedUrl,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
