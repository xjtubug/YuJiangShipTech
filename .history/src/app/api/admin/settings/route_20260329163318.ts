export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const settings = await prisma.siteSettings.findMany({
      orderBy: { key: 'asc' },
    });
    return NextResponse.json({ settings });
  } catch (error) {
    console.error('Settings API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { settings } = body as { settings: Array<{ key: string; value: string }> };

    if (!settings || !Array.isArray(settings)) {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
    }

    for (const s of settings) {
      await prisma.siteSettings.upsert({
        where: { key: s.key },
        update: { value: s.value },
        create: { key: s.key, value: s.value },
      });
    }

    const updated = await prisma.siteSettings.findMany({ orderBy: { key: 'asc' } });
    return NextResponse.json({ settings: updated });
  } catch (error) {
    console.error('Settings API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
