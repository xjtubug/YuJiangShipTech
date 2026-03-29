import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { sendContactNotification } from '@/lib/email';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, company, phone, subject, message } = body;

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
      },
    });

    // Try to send email notification (don't fail the request on error)
    try {
      await sendContactNotification({ name, email, company, message });
    } catch (emailError) {
      console.error('Failed to send contact notification email:', emailError);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Contact API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
