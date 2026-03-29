import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { generateInquiryNumber } from '@/lib/utils';
import { sendInquiryNotification } from '@/lib/email';

interface InquiryItemInput {
  productId?: string;
  productName: string;
  quantity: number;
  unit: string;
  specs?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      companyName,
      contactName,
      email,
      phone,
      country,
      message,
      techRequirements,
      items,
      source,
      utmSource,
      utmMedium,
      utmCampaign,
    } = body;

    if (!companyName || !contactName || !email) {
      return NextResponse.json(
        { error: 'companyName, contactName, and email are required' },
        { status: 400 }
      );
    }

    const inquiryNumber = generateInquiryNumber();

    const visitorId = request.cookies.get('visitorId')?.value ?? undefined;

    const inquiry = await prisma.inquiry.create({
      data: {
        inquiryNumber,
        companyName,
        contactName,
        email,
        phone: phone ?? null,
        country: country ?? null,
        message: message ?? null,
        techRequirements: techRequirements ?? null,
        source: source ?? null,
        utmSource: utmSource ?? null,
        utmMedium: utmMedium ?? null,
        utmCampaign: utmCampaign ?? null,
        visitorId: visitorId ?? null,
        items: {
          create: (items as InquiryItemInput[] | undefined)?.map((item) => ({
            productId: item.productId ?? null,
            productName: item.productName,
            quantity: item.quantity ?? 1,
            unit: item.unit ?? 'pcs',
            specs: item.specs ?? null,
          })) ?? [],
        },
      },
      include: { items: true },
    });

    // Auto-create or link customer
    try {
      const customer = await prisma.customer.upsert({
        where: { email },
        update: {
          name: contactName,
          company: companyName,
          phone: phone ?? undefined,
          country: country ?? undefined,
        },
        create: {
          email,
          name: contactName,
          company: companyName,
          phone: phone ?? null,
          country: country ?? null,
          source: 'inquiry',
        },
      });

      // Link customer to inquiry
      await prisma.inquiry.update({
        where: { id: inquiry.id },
        data: { customerId: customer.id },
      });
    } catch (e) {
      console.error('Failed to upsert customer:', e);
    }

    // Create notification
    try {
      await prisma.notification.create({
        data: {
          type: 'new_inquiry',
          title: `新询价 ${inquiryNumber}`,
          message: `${contactName} (${companyName}) 提交了新的询价`,
          link: `/admin/inquiries`,
        },
      });
    } catch (e) {
      console.error('Failed to create notification:', e);
    }

    // Try to send email notifications (don't fail the request on error)
    try {
      await sendInquiryNotification({
        customerEmail: email,
        customerName: contactName,
        inquiryNumber,
        items: inquiry.items.map((item) => ({
          productName: item.productName,
          quantity: item.quantity,
          unit: item.unit,
        })),
      });
    } catch (emailError) {
      console.error('Failed to send inquiry notification email:', emailError);
    }

    return NextResponse.json({ success: true, inquiryNumber });
  } catch (error) {
    console.error('Inquiry API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
