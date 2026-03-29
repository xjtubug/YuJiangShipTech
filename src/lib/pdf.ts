import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

interface InquiryInfo {
  inquiryNumber: string;
  date: string;
  customerName: string;
  customerEmail: string;
  customerCompany?: string;
}

interface QuotationItem {
  productName: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  total: number;
}

export function generateQuotationPdf(
  inquiry: InquiryInfo,
  items: QuotationItem[]
): Uint8Array {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();

  // Company header
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text('YuJiang Ship Technology', pageWidth / 2, 20, { align: 'center' });

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('Marine Equipment & Ship Supplies', pageWidth / 2, 27, {
    align: 'center',
  });
  doc.text('www.yujiangshiptech.com', pageWidth / 2, 32, { align: 'center' });

  // Divider
  doc.setDrawColor(0, 102, 153);
  doc.setLineWidth(0.5);
  doc.line(14, 36, pageWidth - 14, 36);

  // Title
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('QUOTATION', pageWidth / 2, 46, { align: 'center' });

  // Inquiry info
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  const infoY = 56;
  doc.text(`Inquiry No: ${inquiry.inquiryNumber}`, 14, infoY);
  doc.text(`Date: ${inquiry.date}`, pageWidth - 14, infoY, { align: 'right' });

  doc.text(`Customer: ${inquiry.customerName}`, 14, infoY + 7);
  doc.text(`Email: ${inquiry.customerEmail}`, 14, infoY + 14);
  if (inquiry.customerCompany) {
    doc.text(`Company: ${inquiry.customerCompany}`, 14, infoY + 21);
  }

  // Product table
  const tableStartY = inquiry.customerCompany ? infoY + 30 : infoY + 23;

  const tableBody = items.map((item, idx) => [
    String(idx + 1),
    item.productName,
    String(item.quantity),
    item.unit,
    `$${item.unitPrice.toFixed(2)}`,
    `$${item.total.toFixed(2)}`,
  ]);

  const grandTotal = items.reduce((sum, item) => sum + item.total, 0);
  tableBody.push(['', '', '', '', 'Grand Total:', `$${grandTotal.toFixed(2)}`]);

  autoTable(doc, {
    startY: tableStartY,
    head: [['#', 'Product', 'Qty', 'Unit', 'Unit Price', 'Total']],
    body: tableBody,
    theme: 'grid',
    headStyles: {
      fillColor: [0, 102, 153],
      textColor: 255,
      fontStyle: 'bold',
    },
    styles: { fontSize: 9, cellPadding: 4 },
    columnStyles: {
      0: { cellWidth: 12, halign: 'center' },
      2: { halign: 'center' },
      3: { halign: 'center' },
      4: { halign: 'right' },
      5: { halign: 'right' },
    },
  });

  // Terms and conditions
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const finalY = (doc as any).lastAutoTable?.finalY ?? tableStartY + 60;
  const termsY = finalY + 14;

  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('Terms & Conditions', 14, termsY);

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  const terms = [
    '1. Prices are quoted in USD and valid for 30 days from the date of this quotation.',
    '2. Payment terms: T/T 30% deposit, 70% balance before shipment.',
    '3. Delivery time: Subject to confirmation upon order placement.',
    '4. All goods are subject to availability at the time of order confirmation.',
    '5. Warranty: Per manufacturer standard warranty terms.',
  ];

  terms.forEach((line, idx) => {
    doc.text(line, 14, termsY + 7 + idx * 5);
  });

  // Footer
  const footerY = doc.internal.pageSize.getHeight() - 12;
  doc.setFontSize(8);
  doc.setTextColor(128);
  doc.text(
    'This quotation is auto-generated. For questions, contact sales@yujiangshiptech.com',
    pageWidth / 2,
    footerY,
    { align: 'center' }
  );

  return doc.output('arraybuffer') as unknown as Uint8Array;
}
