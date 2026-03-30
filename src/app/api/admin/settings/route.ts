export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const key = request.nextUrl.searchParams.get('key');
    if (key) {
      const setting = await prisma.siteSettings.findUnique({ where: { key } });
      return NextResponse.json({ key, value: setting?.value ?? null });
    }

    await requireAuth(["admin"]);

    const settings = await prisma.siteSettings.findMany({
      orderBy: { key: 'asc' },
    });
    return NextResponse.json({ settings });
  } catch (error) {
    if (error instanceof Response) return error;
    console.error('Settings API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    await requireAuth(["admin"]);

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
    if (error instanceof Response) return error;
    console.error('Settings API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
