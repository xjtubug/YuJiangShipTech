import { NextRequest, NextResponse } from 'next/server';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import prisma from '@/lib/prisma';

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const inquiry = await prisma.inquiry.findUnique({
      where: { id: params.id },
      include: {
        items: {
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!inquiry) {
      return NextResponse.json({ error: 'Inquiry not found' }, { status: 404 });
    }

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    doc.text('Inquiry Summary', pageWidth / 2, 18, { align: 'center' });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text(`Inquiry No: ${inquiry.inquiryNumber}`, 14, 32);
    doc.text(`Date: ${new Date(inquiry.createdAt).toLocaleDateString('en-US')}`, pageWidth - 14, 32, {
      align: 'right',
    });
    doc.text(`Company: ${inquiry.companyName}`, 14, 40);
    doc.text(`Contact: ${inquiry.contactName}`, 14, 46);
    doc.text(`Email: ${inquiry.email}`, 14, 52);
    if (inquiry.phone) doc.text(`Phone: ${inquiry.phone}`, 14, 58);
    if (inquiry.country) doc.text(`Country: ${inquiry.country}`, 14, 64);
    if (inquiry.message) {
      const lines = doc.splitTextToSize(`Message: ${inquiry.message}`, pageWidth - 28);
      doc.text(lines, 14, 72);
    }

    autoTable(doc, {
      startY: inquiry.message ? 88 : 72,
      head: [['#', 'Product', 'Qty', 'Unit', 'Specs']],
      body: inquiry.items.map((item, index) => [
        String(index + 1),
        item.productName,
        String(item.quantity),
        item.unit,
        item.specs || '—',
      ]),
      theme: 'grid',
      headStyles: { fillColor: [0, 102, 153], textColor: 255 },
      styles: { fontSize: 9, cellPadding: 3 },
    });

    const pdfBuffer = Buffer.from(doc.output('arraybuffer'));

    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${inquiry.inquiryNumber}.pdf"`,
        'Content-Length': String(pdfBuffer.length),
      },
    });
  } catch (error) {
    console.error('Inquiry PDF error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
