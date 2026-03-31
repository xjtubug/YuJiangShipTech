import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    await requireAuth(["admin"]);

    const recent = await prisma.notification.findMany({
      orderBy: { createdAt: 'desc' },
      take: 20,
    });

    const unreadInquiries = await prisma.notification.count({
      where: { read: false, type: 'new_inquiry' },
    });
    const unreadVisitors = await prisma.notification.count({
      where: { read: false, type: 'new_visitor' },
    });
    const unreadComments = await prisma.notification.count({
      where: { read: false, type: 'new_comment' },
    });
    const unreadContact = await prisma.notification.count({
      where: { read: false, type: 'new_contact' },
    });

    return NextResponse.json({
      recent,
      badges: {
        inquiries: unreadInquiries + unreadContact,
        visitors: unreadVisitors,
        comments: unreadComments,
        contact: unreadContact,
      },
    });
  } catch (error) {
    if (error instanceof Response) return error;
    console.error('Notifications error:', error);
    return NextResponse.json({ recent: [], badges: {} });
  }
}

// PATCH: Mark a single notification as read
export async function PATCH(request: NextRequest) {
  try {
    await requireAuth(["admin"]);
    const { id } = await request.json();
    if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });

    await prisma.notification.update({
      where: { id },
      data: { read: true },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof Response) return error;
    console.error('Notification mark-read error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
