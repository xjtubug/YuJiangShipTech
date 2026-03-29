import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request: NextRequest) {
  const expertId = request.cookies.get('expert_session')?.value;
  if (!expertId) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }
  const expert = await prisma.adminUser.findUnique({
    where: { id: expertId, role: 'expert' },
    select: { id: true, name: true, email: true, avatar: true, bio: true, title: true },
  });
  if (!expert) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }
  return NextResponse.json(expert);
}
