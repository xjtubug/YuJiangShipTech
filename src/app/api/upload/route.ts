export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

const MAX_SIZE_DEFAULT = 10 * 1024 * 1024; // 10MB
const MAX_SIZE_VIDEO = 50 * 1024 * 1024; // 50MB for video files

const VIDEO_EXTENSIONS = new Set(["mp4", "webm"]);

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

    const uploadsDir = path.join(process.cwd(), "public", "uploads");
    await mkdir(uploadsDir, { recursive: true });

    // Generate unique filename
    const timestamp = Date.now();
    const randomSuffix = Math.random().toString(36).substring(2, 8);
    const safeName = file.name
      .replace(/[^a-zA-Z0-9._-]/g, "_")
      .substring(0, 100);
    const filename = `${timestamp}-${randomSuffix}-${safeName}`;

    const buffer = Buffer.from(await file.arrayBuffer());
    const filePath = path.join(uploadsDir, filename);
    await writeFile(filePath, buffer);

    const fileUrl = `/uploads/${filename}`;

    return NextResponse.json(
      {
        url: fileUrl,
        filename,
        originalName: file.name,
        size: file.size,
        type: file.type,
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
