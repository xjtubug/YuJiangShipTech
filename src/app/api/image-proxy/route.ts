import { NextRequest, NextResponse } from 'next/server';

const MINIO_INTERNAL_URL =
  process.env.MINIO_PUBLIC_URL || 'http://localhost:9000';
const MINIO_BUCKET = process.env.MINIO_BUCKET || 'yujiangshiptech';

export const dynamic = 'force-dynamic';

/**
 * Proxy MinIO images through Next.js to avoid browser CORS issues
 * and provide reliable image serving with caching.
 *
 * Usage: /api/image-proxy?path=uploads/filename.jpg
 */
export async function GET(request: NextRequest) {
  const path = request.nextUrl.searchParams.get('path');

  if (!path) {
    return new NextResponse('Missing path parameter', { status: 400 });
  }

  const sanitized = path.replace(/^\/+/, '').replace(/\.\./g, '');
  const minioUrl = `${MINIO_INTERNAL_URL}/${MINIO_BUCKET}/${sanitized}`;

  try {
    const res = await fetch(minioUrl, { cache: 'no-store' });

    if (!res.ok) {
      return new NextResponse(null, { status: res.status });
    }

    const buffer = await res.arrayBuffer();
    const contentType = res.headers.get('content-type') || 'application/octet-stream';

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=86400, stale-while-revalidate=604800',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch {
    return new NextResponse(null, { status: 502 });
  }
}
