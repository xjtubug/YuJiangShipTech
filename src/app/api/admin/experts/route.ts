export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAuth } from '@/lib/auth';

// GET: List all expert users
export async function GET() {
  try {
    await requireAuth(["admin"]);

    const experts = await prisma.adminUser.findMany({
      where: { role: "expert" },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        avatar: true,
        bio: true,
        title: true,
        createdAt: true,
        _count: { select: { expertReviews: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ experts });
  } catch (error) {
    if (error instanceof Response) return error;
    console.error("Experts list error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST: Create new expert user
export async function POST(request: NextRequest) {
  try {
    await requireAuth(["admin"]);

    const body = await request.json();
    const { email, password, name, bio, title, avatar } = body;

    if (!email || !password || !name) {
      return NextResponse.json(
        { error: "email, password, and name are required" },
        { status: 400 }
      );
    }

    const normalized = email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)) {
      return NextResponse.json(
        { error: "Invalid email format" },
        { status: 400 }
      );
    }

    const existing = await prisma.adminUser.findUnique({
      where: { email: normalized },
    });
    if (existing) {
      return NextResponse.json(
        { error: "Email already registered" },
        { status: 409 }
      );
    }

    const expert = await prisma.adminUser.create({
      data: {
        email: normalized,
        password,
        name: name.trim(),
        role: "expert",
        bio: bio?.trim() || null,
        title: title?.trim() || null,
        avatar: avatar || null,
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        avatar: true,
        bio: true,
        title: true,
        createdAt: true,
      },
    });

    return NextResponse.json(expert, { status: 201 });
  } catch (error) {
    if (error instanceof Response) return error;
    console.error("Expert create error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
