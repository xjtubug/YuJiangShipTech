import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';

export async function POST() {
  try {
    await requireAuth(["viewer"]);

    await prisma.notification.updateMany({
      where: { read: false },
      data: { read: true },
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof Response) return error;
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
