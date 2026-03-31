export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

const PUBLIC_KEYS = [
  'company_name',
  'company_tagline',
  'company_email',
  'company_phone',
  'company_address',
  'company_logo',
  'company_lat',
  'company_lng',
  'google_maps_api_key',
];

export async function GET(request: NextRequest) {
  try {
    const keysParam = request.nextUrl.searchParams.get('keys');
    const requestedKeys = keysParam
      ? keysParam.split(',').filter((k) => PUBLIC_KEYS.includes(k.trim()))
      : PUBLIC_KEYS;

    const settings = await prisma.siteSettings.findMany({
      where: { key: { in: requestedKeys } },
    });

    const result: Record<string, string> = {};
    for (const s of settings) {
      result[s.key] = s.value;
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('Public settings API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
