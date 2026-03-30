import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    await requireAuth(["viewer"]);

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

    return NextResponse.json({
      recent,
      badges: {
        inquiries: unreadInquiries,
        visitors: unreadVisitors,
        comments: unreadComments,
      },
    });
  } catch (error) {
    if (error instanceof Response) return error;
    console.error('Notifications error:', error);
    return NextResponse.json({ recent: [], badges: {} });
  }
}
