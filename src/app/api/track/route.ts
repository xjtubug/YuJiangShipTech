import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import geoip from 'geoip-lite';
// eslint-disable-next-line @typescript-eslint/no-require-imports
const UAParser = require('ua-parser-js');
import { calculateLeadScore, isHighValueLead } from '@/lib/lead-scoring';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { path, title, duration, productId } = body;

    const ip =
      request.headers.get('x-forwarded-for')?.split(',')[0].trim() ??
      request.headers.get('x-real-ip') ??
      '127.0.0.1';

    const geo = geoip.lookup(ip);
    const country = geo?.country ?? null;
    const region = geo?.region ?? null;
    const city = geo?.city ?? null;

    const ua = request.headers.get('user-agent') ?? '';
    const parser = new UAParser(ua);
    const browser = parser.getBrowser().name ?? null;
    const os = parser.getOS().name ?? null;
    const device = parser.getDevice().type ?? 'desktop';

    // Find or create visitor by IP
    let visitor = await prisma.visitor.findFirst({ where: { ip } });

    if (visitor) {
      visitor = await prisma.visitor.update({
        where: { id: visitor.id },
        data: {
          lastVisit: new Date(),
          visitCount: { increment: 1 },
          country: country ?? visitor.country,
          region: region ?? visitor.region,
          city: city ?? visitor.city,
          browser: browser ?? visitor.browser,
          os: os ?? visitor.os,
          device: device ?? visitor.device,
          userAgent: ua || visitor.userAgent,
        },
      });
    } else {
      visitor = await prisma.visitor.create({
        data: {
          ip,
          country,
          region,
          city,
          userAgent: ua,
          browser,
          os,
          device,
        },
      });
    }

    // Create page view record
    await prisma.pageView.create({
      data: {
        visitorId: visitor.id,
        path: path ?? '/',
        title: title ?? null,
        duration: duration ?? 0,
        productId: productId ?? null,
      },
    });

    // Update lead score
    const [pageViewCount, productViewCount, inquiryCount] = await Promise.all([
      prisma.pageView.count({ where: { visitorId: visitor.id } }),
      prisma.pageView.count({ where: { visitorId: visitor.id, productId: { not: null } } }),
      prisma.inquiry.count({ where: { visitorId: visitor.id } }),
    ]);

    const distinctProducts = await prisma.pageView.findMany({
      where: { visitorId: visitor.id, productId: { not: null } },
      select: { productId: true },
      distinct: ['productId'],
    });

    const totalDuration = await prisma.pageView.aggregate({
      where: { visitorId: visitor.id },
      _sum: { duration: true },
    });

    const score = calculateLeadScore({
      pageViews: pageViewCount,
      productViews: productViewCount,
      timeOnSiteSeconds: totalDuration._sum.duration ?? 0,
      inquirySubmitted: inquiryCount > 0,
      returnVisits: Math.max(0, visitor.visitCount - 1),
      country: visitor.country ?? undefined,
      multipleProductsViewed: distinctProducts.length > 1,
    });

    await prisma.visitor.update({
      where: { id: visitor.id },
      data: {
        leadScore: score,
        isHighValue: isHighValueLead(score),
      },
    });

    return NextResponse.json({ success: true, visitorId: visitor.id });
  } catch (error) {
    console.error('Track API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
