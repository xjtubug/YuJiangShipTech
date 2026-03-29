import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { generateQuotationPdf } from '@/lib/pdf';

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    const inquiry = await prisma.inquiry.findUnique({
      where: { id },
      include: {
        items: {
          include: { product: { select: { priceUsd: true } } },
        },
      },
    });

    if (!inquiry) {
      return NextResponse.json({ error: 'Inquiry not found' }, { status: 404 });
    }

    const quotationItems = inquiry.items.map((item) => {
      const unitPrice = item.product?.priceUsd ?? 0;
      return {
        productName: item.productName,
        quantity: item.quantity,
        unit: item.unit,
        unitPrice,
        total: unitPrice * item.quantity,
      };
    });

    const pdfBytes = generateQuotationPdf(
      {
        inquiryNumber: inquiry.inquiryNumber,
        date: inquiry.createdAt.toISOString().split('T')[0],
        customerName: inquiry.contactName,
        customerEmail: inquiry.email,
        customerCompany: inquiry.companyName,
      },
      quotationItems
    );

    return new NextResponse(Buffer.from(pdfBytes), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="quotation-${inquiry.inquiryNumber}.pdf"`,
      },
    });
  } catch (error) {
    console.error('PDF generation error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
