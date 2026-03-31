export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

// GET: Return all AboutContent sections + all TeamMembers
export async function GET() {
  try {
    await requireAuth(["admin"]);

    const [sections, teamMembers] = await Promise.all([
      prisma.aboutContent.findMany({ orderBy: { sortOrder: "asc" } }),
      prisma.teamMember.findMany({ orderBy: { sortOrder: "asc" } }),
    ]);

    return NextResponse.json({ sections, teamMembers });
  } catch (error) {
    if (error instanceof Response) return error;
    console.error("About GET error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PUT: Upsert AboutContent sections and TeamMembers
export async function PUT(request: NextRequest) {
  try {
    await requireAuth(["admin"]);

    const body = await request.json();
    const { sections, teamMembers } = body as {
      sections?: Array<{
        section: string;
        titleEn?: string;
        titleZh?: string;
        contentEn?: string;
        contentZh?: string;
        images?: string;
        videoUrl?: string | null;
        pdfUrl?: string | null;
        extraJson?: string;
        sortOrder?: number;
      }>;
      teamMembers?: Array<{
        id?: string;
        nameEn: string;
        nameZh: string;
        titleEn?: string;
        titleZh?: string;
        avatar?: string | null;
        bio?: string | null;
        sortOrder?: number;
      }>;
    };

    // Upsert sections
    if (sections && Array.isArray(sections)) {
      for (const s of sections) {
        if (!s.section) continue;
        await prisma.aboutContent.upsert({
          where: { section: s.section },
          update: {
            titleEn: s.titleEn ?? "",
            titleZh: s.titleZh ?? "",
            contentEn: s.contentEn ?? "",
            contentZh: s.contentZh ?? "",
            images: s.images ?? "[]",
            videoUrl: s.videoUrl ?? null,
            pdfUrl: s.pdfUrl ?? null,
            extraJson: s.extraJson ?? "{}",
            sortOrder: s.sortOrder ?? 0,
          },
          create: {
            section: s.section,
            titleEn: s.titleEn ?? "",
            titleZh: s.titleZh ?? "",
            contentEn: s.contentEn ?? "",
            contentZh: s.contentZh ?? "",
            images: s.images ?? "[]",
            videoUrl: s.videoUrl ?? null,
            pdfUrl: s.pdfUrl ?? null,
            extraJson: s.extraJson ?? "{}",
            sortOrder: s.sortOrder ?? 0,
          },
        });
      }
    }

    // Upsert team members
    if (teamMembers && Array.isArray(teamMembers)) {
      for (const m of teamMembers) {
        if (!m.nameEn && !m.nameZh) continue;
        if (m.id) {
          await prisma.teamMember.update({
            where: { id: m.id },
            data: {
              nameEn: m.nameEn,
              nameZh: m.nameZh,
              titleEn: m.titleEn ?? "",
              titleZh: m.titleZh ?? "",
              avatar: m.avatar ?? null,
              bio: m.bio ?? null,
              sortOrder: m.sortOrder ?? 0,
            },
          });
        } else {
          await prisma.teamMember.create({
            data: {
              nameEn: m.nameEn,
              nameZh: m.nameZh,
              titleEn: m.titleEn ?? "",
              titleZh: m.titleZh ?? "",
              avatar: m.avatar ?? null,
              bio: m.bio ?? null,
              sortOrder: m.sortOrder ?? 0,
            },
          });
        }
      }
    }

    // Return updated data
    const [updatedSections, updatedMembers] = await Promise.all([
      prisma.aboutContent.findMany({ orderBy: { sortOrder: "asc" } }),
      prisma.teamMember.findMany({ orderBy: { sortOrder: "asc" } }),
    ]);

    return NextResponse.json({
      sections: updatedSections,
      teamMembers: updatedMembers,
    });
  } catch (error) {
    if (error instanceof Response) return error;
    console.error("About PUT error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE: Delete a TeamMember by memberId query param
export async function DELETE(request: NextRequest) {
  try {
    await requireAuth(["admin"]);

    const { searchParams } = new URL(request.url);
    const memberId = searchParams.get("memberId");

    if (!memberId) {
      return NextResponse.json(
        { error: "memberId is required" },
        { status: 400 }
      );
    }

    await prisma.teamMember.delete({ where: { id: memberId } });
    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof Response) return error;
    console.error("About DELETE error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
