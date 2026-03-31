import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { sendContactNotification } from '@/lib/email';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, company, phone, subject, message, attachmentUrl } = body;

    if (!name || !email || !message) {
      return NextResponse.json(
        { error: 'name, email, and message are required' },
        { status: 400 }
      );
    }

    await prisma.contactMessage.create({
      data: {
        name,
        email,
        company: company ?? null,
        phone: phone ?? null,
        subject: subject ?? null,
        message,
        attachmentUrl: attachmentUrl ?? null,
      },
    });

    // Send email notification non-blocking (don't await – prevents hanging)
    sendContactNotification({ name, email, company, message })
      .catch((err) => console.error('Failed to send contact notification email:', err));

    // Create admin notification
    prisma.notification.create({
      data: {
        type: 'new_contact',
        title: `新留言 - ${name}`,
        message: `${name}${company ? ` (${company})` : ''} 通过联系我们发送了消息`,
        link: '/admin/inquiries?tab=contact',
      },
    }).catch((err) => console.error('Failed to create contact notification:', err));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Contact API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
