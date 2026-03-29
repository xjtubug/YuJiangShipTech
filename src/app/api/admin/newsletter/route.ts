export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// POST: Subscribe email
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, name } = body;

    if (!email || typeof email !== "string") {
      return NextResponse.json(
        { error: "Email is required" },
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

    const existing = await prisma.newsletterSubscriber.findUnique({
      where: { email: normalized },
    });

    if (existing) {
      if (!existing.active) {
        const reactivated = await prisma.newsletterSubscriber.update({
          where: { email: normalized },
          data: { active: true },
        });
        return NextResponse.json(reactivated);
      }
      return NextResponse.json(
        { error: "Email already subscribed" },
        { status: 409 }
      );
    }

    const subscriber = await prisma.newsletterSubscriber.create({
      data: {
        email: normalized,
        name: name?.trim() || null,
        source: "footer",
        active: true,
      },
    });

    return NextResponse.json(subscriber, { status: 201 });
  } catch (error) {
    console.error("Newsletter subscribe error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// GET: List all subscribers (admin)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const activeOnly = searchParams.get("active");

    const where = activeOnly === "true" ? { active: true } : {};

    const subscribers = await prisma.newsletterSubscriber.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ subscribers, total: subscribers.length });
  } catch (error) {
    console.error("Newsletter list error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
