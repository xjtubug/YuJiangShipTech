export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';

/* ------------------------------------------------------------------ */
/*  GET  — list campaigns with stats, filtering by status/type         */
/* ------------------------------------------------------------------ */
export async function GET(request: NextRequest) {
  try {
    const session = await requireAuth(['sales']);

    const { searchParams } = request.nextUrl;
    const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') ?? '20', 10)));
    const status = searchParams.get('status');
    const type = searchParams.get('type');

    const where: Record<string, unknown> = {};
    if (status) where.status = status;
    if (type) where.type = type;

    const [campaigns, total, stats] = await Promise.all([
      prisma.emailCampaign.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.emailCampaign.count({ where }),
      // Aggregate stats
      prisma.emailCampaign.aggregate({
        _sum: { totalSent: true, totalOpened: true, totalClicked: true },
      }),
    ]);

    void session; // used for auth only

    return NextResponse.json({
      campaigns,
      total,
      page,
      totalPages: Math.ceil(total / limit),
      stats: {
        totalSent: stats._sum.totalSent ?? 0,
        totalOpened: stats._sum.totalOpened ?? 0,
        totalClicked: stats._sum.totalClicked ?? 0,
      },
    });
  } catch (error) {
    if (error instanceof Response) return error;
    console.error('Email campaigns GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/* ------------------------------------------------------------------ */
/*  POST — create campaign (from template or custom)                   */
/* ------------------------------------------------------------------ */
export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth(['sales']);

    const body = await request.json();
    const { name, templateId, subject, bodyHtml, type, targetTags, scheduledAt } = body;

    if (!name || !subject || !bodyHtml) {
      return NextResponse.json(
        { error: 'name, subject, and bodyHtml are required' },
        { status: 400 }
      );
    }

    const validTypes = ['manual', 'auto_welcome', 'auto_followup', 'auto_holiday'];
    if (type && !validTypes.includes(type)) {
      return NextResponse.json({ error: 'Invalid campaign type' }, { status: 400 });
    }

    const campaign = await prisma.emailCampaign.create({
      data: {
        name,
        templateId: templateId || null,
        subject,
        body: bodyHtml,
        type: type || 'manual',
        status: scheduledAt ? 'scheduled' : 'draft',
        scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
        targetTags: JSON.stringify(targetTags || []),
        createdBy: session.user?.name || session.user?.email || 'admin',
      },
    });

    return NextResponse.json(campaign, { status: 201 });
  } catch (error) {
    if (error instanceof Response) return error;
    console.error('Email campaigns POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/* ------------------------------------------------------------------ */
/*  PUT  — update draft campaign                                       */
/* ------------------------------------------------------------------ */
export async function PUT(request: NextRequest) {
  try {
    await requireAuth(['sales']);

    const body = await request.json();
    const { id, name, subject, bodyHtml, type, targetTags, scheduledAt } = body;

    if (!id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 });
    }

    const existing = await prisma.emailCampaign.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
    }
    if (existing.status !== 'draft' && existing.status !== 'scheduled') {
      return NextResponse.json(
        { error: 'Only draft or scheduled campaigns can be updated' },
        { status: 400 }
      );
    }

    const data: Record<string, unknown> = {};
    if (name !== undefined) data.name = name;
    if (subject !== undefined) data.subject = subject;
    if (bodyHtml !== undefined) data.body = bodyHtml;
    if (type !== undefined) data.type = type;
    if (targetTags !== undefined) data.targetTags = JSON.stringify(targetTags);
    if (scheduledAt !== undefined) {
      data.scheduledAt = scheduledAt ? new Date(scheduledAt) : null;
      data.status = scheduledAt ? 'scheduled' : 'draft';
    }

    const campaign = await prisma.emailCampaign.update({ where: { id }, data });
    return NextResponse.json(campaign);
  } catch (error) {
    if (error instanceof Response) return error;
    console.error('Email campaigns PUT error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/* ------------------------------------------------------------------ */
/*  DELETE — delete draft campaign                                     */
/* ------------------------------------------------------------------ */
export async function DELETE(request: NextRequest) {
  try {
    await requireAuth(['admin']);

    const { searchParams } = request.nextUrl;
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 });
    }

    const existing = await prisma.emailCampaign.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
    }
    if (existing.status !== 'draft') {
      return NextResponse.json(
        { error: 'Only draft campaigns can be deleted' },
        { status: 400 }
      );
    }

    await prisma.emailCampaign.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof Response) return error;
    console.error('Email campaigns DELETE error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
