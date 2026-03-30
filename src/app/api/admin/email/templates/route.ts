export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';

/* ------------------------------------------------------------------ */
/*  Default templates — seeded on first GET when the table is empty    */
/* ------------------------------------------------------------------ */
const DEFAULT_TEMPLATES = [
  {
    name: 'Welcome Email',
    type: 'welcome',
    subject: 'Welcome to YuJiang Ship Technology',
    body: `<!DOCTYPE html>
<html><head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#f4f7fa;font-family:Arial,Helvetica,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f7fa;padding:40px 0;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
  <tr><td style="background:linear-gradient(135deg,#0e4a86,#1a6bc4);padding:32px 40px;text-align:center;">
    <h1 style="color:#ffffff;margin:0;font-size:24px;">⚓ YuJiang Ship Technology</h1>
    <p style="color:#b8d4f0;margin:8px 0 0;font-size:14px;">Professional Marine Equipment Solutions</p>
  </td></tr>
  <tr><td style="padding:40px;">
    <h2 style="color:#1a1a1a;margin:0 0 16px;font-size:20px;">Welcome, {{customerName}}!</h2>
    <p style="color:#555;line-height:1.7;margin:0 0 16px;">Thank you for choosing YuJiang Ship Technology as your trusted marine equipment partner. We are committed to delivering high-quality products and exceptional service.</p>
    <p style="color:#555;line-height:1.7;margin:0 0 24px;">As one of China's leading marine equipment suppliers, we offer:</p>
    <table width="100%" cellpadding="12" cellspacing="0" style="margin-bottom:24px;">
      <tr><td style="background:#f0f7ff;border-radius:6px;padding:12px 16px;">
        <strong style="color:#0e4a86;">✓ Marine Valves &amp; Pumps</strong><br><span style="color:#666;font-size:13px;">IMO/CCS certified equipment</span>
      </td></tr>
      <tr><td style="height:8px;"></td></tr>
      <tr><td style="background:#f0f7ff;border-radius:6px;padding:12px 16px;">
        <strong style="color:#0e4a86;">✓ Deck Machinery</strong><br><span style="color:#666;font-size:13px;">Winches, cranes, and davits</span>
      </td></tr>
      <tr><td style="height:8px;"></td></tr>
      <tr><td style="background:#f0f7ff;border-radius:6px;padding:12px 16px;">
        <strong style="color:#0e4a86;">✓ Navigation &amp; Safety Equipment</strong><br><span style="color:#666;font-size:13px;">Complete safety solutions</span>
      </td></tr>
    </table>
    <p style="color:#555;line-height:1.7;margin:0 0 24px;">Our team of experts is ready to assist you with any requirements. Feel free to reach out anytime.</p>
    <a href="https://www.yujiangship.com/products" style="display:inline-block;background:#0e4a86;color:#ffffff;padding:12px 28px;border-radius:6px;text-decoration:none;font-weight:bold;font-size:14px;">Browse Our Products</a>
  </td></tr>
  <tr><td style="background:#f8f9fa;padding:24px 40px;border-top:1px solid #e8e8e8;">
    <p style="color:#888;font-size:12px;margin:0;line-height:1.6;">YuJiang Ship Technology Co., Ltd.<br>Email: sales@yujiangship.com | Phone: +86-XXX-XXXX-XXXX<br>© 2024 YuJiang Ship Technology. All rights reserved.</p>
  </td></tr>
</table>
</td></tr></table>
</body></html>`,
  },
  {
    name: 'Inquiry Follow-up',
    type: 'inquiry_followup',
    subject: 'Following up on your inquiry - {{inquiryNumber}}',
    body: `<!DOCTYPE html>
<html><head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#f4f7fa;font-family:Arial,Helvetica,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f7fa;padding:40px 0;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
  <tr><td style="background:linear-gradient(135deg,#0e4a86,#1a6bc4);padding:32px 40px;text-align:center;">
    <h1 style="color:#ffffff;margin:0;font-size:24px;">⚓ YuJiang Ship Technology</h1>
  </td></tr>
  <tr><td style="padding:40px;">
    <h2 style="color:#1a1a1a;margin:0 0 16px;font-size:20px;">Following Up on Your Inquiry</h2>
    <p style="color:#555;line-height:1.7;margin:0 0 16px;">Dear {{customerName}},</p>
    <p style="color:#555;line-height:1.7;margin:0 0 16px;">We wanted to follow up regarding your recent inquiry <strong style="color:#0e4a86;">{{inquiryNumber}}</strong>. Our team has reviewed your requirements and we'd like to ensure you have all the information you need.</p>
    <div style="background:#f0f7ff;border-left:4px solid #0e4a86;padding:16px 20px;margin:0 0 24px;border-radius:0 6px 6px 0;">
      <p style="color:#333;margin:0;font-size:14px;"><strong>Inquiry Reference:</strong> {{inquiryNumber}}</p>
    </div>
    <p style="color:#555;line-height:1.7;margin:0 0 16px;">If you have any additional questions or need technical specifications, our engineering team is available to assist you.</p>
    <p style="color:#555;line-height:1.7;margin:0 0 24px;">We look forward to building a long-term partnership with {{companyName}}.</p>
    <a href="mailto:sales@yujiangship.com" style="display:inline-block;background:#0e4a86;color:#ffffff;padding:12px 28px;border-radius:6px;text-decoration:none;font-weight:bold;font-size:14px;">Reply to Us</a>
  </td></tr>
  <tr><td style="background:#f8f9fa;padding:24px 40px;border-top:1px solid #e8e8e8;">
    <p style="color:#888;font-size:12px;margin:0;line-height:1.6;">YuJiang Ship Technology Co., Ltd.<br>Email: sales@yujiangship.com | Phone: +86-XXX-XXXX-XXXX</p>
  </td></tr>
</table>
</td></tr></table>
</body></html>`,
  },
  {
    name: 'Promotional Offer',
    type: 'promotion',
    subject: 'Special Offers on Marine Equipment',
    body: `<!DOCTYPE html>
<html><head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#f4f7fa;font-family:Arial,Helvetica,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f7fa;padding:40px 0;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
  <tr><td style="background:linear-gradient(135deg,#d4380d,#fa541c);padding:32px 40px;text-align:center;">
    <h1 style="color:#ffffff;margin:0;font-size:24px;">🔥 Special Offers</h1>
    <p style="color:#ffd8c2;margin:8px 0 0;font-size:16px;">Limited Time Marine Equipment Deals</p>
  </td></tr>
  <tr><td style="padding:40px;">
    <h2 style="color:#1a1a1a;margin:0 0 16px;font-size:20px;">Dear {{customerName}},</h2>
    <p style="color:#555;line-height:1.7;margin:0 0 24px;">We're excited to offer exclusive pricing on our most popular marine equipment. Take advantage of these limited-time offers:</p>
    {{productList}}
    <div style="background:#fff7e6;border:1px solid #ffd591;border-radius:8px;padding:20px;margin:24px 0;text-align:center;">
      <p style="color:#d46b08;font-size:16px;font-weight:bold;margin:0 0 8px;">⏰ Offer Valid for 30 Days</p>
      <p style="color:#874d00;font-size:13px;margin:0;">Contact us today to lock in these special prices</p>
    </div>
    <div style="text-align:center;">
      <a href="https://www.yujiangship.com/products" style="display:inline-block;background:#d4380d;color:#ffffff;padding:14px 32px;border-radius:6px;text-decoration:none;font-weight:bold;font-size:15px;">View All Offers</a>
    </div>
  </td></tr>
  <tr><td style="background:#f8f9fa;padding:24px 40px;border-top:1px solid #e8e8e8;">
    <p style="color:#888;font-size:12px;margin:0;line-height:1.6;">YuJiang Ship Technology Co., Ltd.<br>Email: sales@yujiangship.com | Phone: +86-XXX-XXXX-XXXX</p>
  </td></tr>
</table>
</td></tr></table>
</body></html>`,
  },
  {
    name: 'Holiday Greeting',
    type: 'holiday',
    subject: "Season's Greetings from YuJiang Ship Technology",
    body: `<!DOCTYPE html>
<html><head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#f4f7fa;font-family:Arial,Helvetica,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f7fa;padding:40px 0;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
  <tr><td style="background:linear-gradient(135deg,#135200,#389e0d);padding:40px;text-align:center;">
    <h1 style="color:#ffffff;margin:0;font-size:28px;">🎄 Season's Greetings</h1>
    <p style="color:#b7eb8f;margin:12px 0 0;font-size:16px;">From the YuJiang Ship Technology Family</p>
  </td></tr>
  <tr><td style="padding:40px;">
    <h2 style="color:#1a1a1a;margin:0 0 16px;font-size:20px;">Dear {{customerName}},</h2>
    <p style="color:#555;line-height:1.7;margin:0 0 16px;">As the year draws to a close, we want to extend our heartfelt gratitude for your continued partnership and trust in YuJiang Ship Technology.</p>
    <p style="color:#555;line-height:1.7;margin:0 0 24px;">This year has been one of growth and achievement for us, and we couldn't have done it without valued partners like you.</p>
    <div style="background:#f6ffed;border:1px solid #b7eb8f;border-radius:8px;padding:24px;margin:0 0 24px;text-align:center;">
      <p style="color:#135200;font-size:16px;font-weight:bold;margin:0 0 8px;">🎁 Holiday Special</p>
      <p style="color:#389e0d;font-size:14px;margin:0;">Enjoy <strong>5% off</strong> all orders placed before the end of January</p>
    </div>
    <p style="color:#555;line-height:1.7;margin:0 0 24px;">We wish you and your team a wonderful holiday season and a prosperous new year. We look forward to continuing our partnership in the coming year.</p>
    <p style="color:#555;line-height:1.7;margin:0;">Warm regards,<br><strong>The YuJiang Ship Technology Team</strong></p>
  </td></tr>
  <tr><td style="background:#f8f9fa;padding:24px 40px;border-top:1px solid #e8e8e8;">
    <p style="color:#888;font-size:12px;margin:0;line-height:1.6;">YuJiang Ship Technology Co., Ltd.<br>Email: sales@yujiangship.com | Phone: +86-XXX-XXXX-XXXX</p>
  </td></tr>
</table>
</td></tr></table>
</body></html>`,
  },
];

async function seedDefaultTemplates() {
  const count = await prisma.emailTemplate.count();
  if (count > 0) return;

  for (const t of DEFAULT_TEMPLATES) {
    await prisma.emailTemplate.create({ data: t });
  }
}

/* ------------------------------------------------------------------ */
/*  GET  — list all templates (seeds defaults on first call)           */
/* ------------------------------------------------------------------ */
export async function GET(request: NextRequest) {
  try {
    await requireAuth(['sales']);

    await seedDefaultTemplates();

    const { searchParams } = request.nextUrl;
    const type = searchParams.get('type');

    const where: Record<string, unknown> = {};
    if (type) where.type = type;

    const templates = await prisma.emailTemplate.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ templates });
  } catch (error) {
    if (error instanceof Response) return error;
    console.error('Email templates GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/* ------------------------------------------------------------------ */
/*  POST — create template                                             */
/* ------------------------------------------------------------------ */
export async function POST(request: NextRequest) {
  try {
    await requireAuth(['admin']);

    const body = await request.json();
    const { name, subject, bodyHtml, type } = body;

    if (!name || !subject || !bodyHtml || !type) {
      return NextResponse.json(
        { error: 'name, subject, bodyHtml, and type are required' },
        { status: 400 }
      );
    }

    const validTypes = ['welcome', 'inquiry_followup', 'promotion', 'holiday', 'custom'];
    if (!validTypes.includes(type)) {
      return NextResponse.json({ error: 'Invalid template type' }, { status: 400 });
    }

    const existing = await prisma.emailTemplate.findUnique({ where: { name } });
    if (existing) {
      return NextResponse.json({ error: 'Template name already exists' }, { status: 409 });
    }

    const template = await prisma.emailTemplate.create({
      data: { name, subject, body: bodyHtml, type },
    });

    return NextResponse.json(template, { status: 201 });
  } catch (error) {
    if (error instanceof Response) return error;
    console.error('Email templates POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/* ------------------------------------------------------------------ */
/*  PUT  — update template                                             */
/* ------------------------------------------------------------------ */
export async function PUT(request: NextRequest) {
  try {
    await requireAuth(['admin']);

    const body = await request.json();
    const { id, name, subject, bodyHtml, type, active } = body;

    if (!id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 });
    }

    const data: Record<string, unknown> = {};
    if (name !== undefined) data.name = name;
    if (subject !== undefined) data.subject = subject;
    if (bodyHtml !== undefined) data.body = bodyHtml;
    if (type !== undefined) data.type = type;
    if (active !== undefined) data.active = Boolean(active);

    const template = await prisma.emailTemplate.update({
      where: { id },
      data,
    });

    return NextResponse.json(template);
  } catch (error) {
    if (error instanceof Response) return error;
    console.error('Email templates PUT error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/* ------------------------------------------------------------------ */
/*  DELETE — delete template                                           */
/* ------------------------------------------------------------------ */
export async function DELETE(request: NextRequest) {
  try {
    await requireAuth(['admin']);

    const { searchParams } = request.nextUrl;
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 });
    }

    await prisma.emailTemplate.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof Response) return error;
    console.error('Email templates DELETE error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
