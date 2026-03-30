export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

const NAVY = [0, 102, 153] as const;
const LIGHT_GRAY = [245, 245, 245] as const;

function formatCurrency(amount: number, currency: string): string {
  const symbols: Record<string, string> = {
    USD: "$",
    EUR: "€",
    CNY: "¥",
    JPY: "¥",
    GBP: "£",
  };
  const sym = symbols[currency] ?? currency + " ";
  return `${sym}${amount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireAuth(["viewer"]);

    const quotation = await prisma.quotation.findUnique({
      where: { id: params.id },
      include: {
        items: { orderBy: { sortOrder: "asc" } },
      },
    });

    if (!quotation) {
      return NextResponse.json({ error: "Quotation not found" }, { status: 404 });
    }

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 14;
    const rightEdge = pageWidth - margin;

    // ─── Company Header ──────────────────────────────────────
    // Navy blue header bar
    doc.setFillColor(...NAVY);
    doc.rect(0, 0, pageWidth, 38, "F");

    // Company name
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(18);
    doc.setFont("helvetica", "bold");
    doc.text("YuJiang Ship Technology Co., Ltd.", margin, 16);

    // Company details line
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.text("Marine Equipment & Ship Supplies | ISO 9001:2015 Certified", margin, 23);
    doc.text("Zhoushan, Zhejiang, China | www.yujiangshiptech.com", margin, 28);
    doc.text("Tel: +86-580-8050000 | Email: sales@yujiangshiptech.com", margin, 33);

    // QUOTATION title
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22);
    doc.setFont("helvetica", "bold");
    doc.text("QUOTATION", rightEdge, 22, { align: "right" });

    // ─── Quotation Info Block ────────────────────────────────
    let y = 48;
    doc.setTextColor(0, 0, 0);

    // Two-column info layout
    // Left: Quotation details
    doc.setFillColor(...LIGHT_GRAY);
    doc.rect(margin, y - 4, (pageWidth - margin * 3) / 2, 32, "F");

    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...NAVY);
    doc.text("Quotation Details", margin + 4, y + 2);

    doc.setFont("helvetica", "normal");
    doc.setTextColor(60, 60, 60);
    doc.setFontSize(8);
    doc.text(`Quotation No:  ${quotation.quotationNumber}`, margin + 4, y + 9);
    doc.text(`Date:  ${new Date(quotation.createdAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}`, margin + 4, y + 15);
    doc.text(`Currency:  ${quotation.currency}`, margin + 4, y + 21);
    doc.text(`Valid For:  ${quotation.validDays} days`, margin + 4, y + 27);

    // Right: Customer info
    const rightX = margin + (pageWidth - margin * 3) / 2 + margin;
    doc.setFillColor(...LIGHT_GRAY);
    doc.rect(rightX, y - 4, (pageWidth - margin * 3) / 2, 32, "F");

    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...NAVY);
    doc.text("Customer Information", rightX + 4, y + 2);

    doc.setFont("helvetica", "normal");
    doc.setTextColor(60, 60, 60);
    doc.setFontSize(8);
    doc.text(`Company:  ${quotation.companyName}`, rightX + 4, y + 9);
    doc.text(`Contact:  ${quotation.contactName}`, rightX + 4, y + 15);
    doc.text(`Email:  ${quotation.email}`, rightX + 4, y + 21);
    const extraInfo = [quotation.phone, quotation.country].filter(Boolean).join(" | ");
    if (extraInfo) doc.text(extraInfo, rightX + 4, y + 27);

    // ─── Items Table ─────────────────────────────────────────
    y += 40;

    const tableBody = quotation.items.map((item, idx) => [
      String(idx + 1),
      item.productName,
      item.sku || "—",
      String(item.quantity),
      item.unit,
      formatCurrency(item.unitPrice, quotation.currency),
      formatCurrency(item.total, quotation.currency),
    ]);

    autoTable(doc, {
      startY: y,
      head: [["#", "Product Name", "SKU", "Qty", "Unit", "Unit Price", "Total"]],
      body: tableBody,
      theme: "grid",
      headStyles: {
        fillColor: [...NAVY],
        textColor: 255,
        fontStyle: "bold",
        fontSize: 8,
        cellPadding: 4,
      },
      styles: {
        fontSize: 8,
        cellPadding: 3,
        lineColor: [200, 200, 200],
        lineWidth: 0.25,
      },
      alternateRowStyles: {
        fillColor: [250, 250, 250],
      },
      columnStyles: {
        0: { cellWidth: 10, halign: "center" },
        1: { cellWidth: 55 },
        2: { cellWidth: 25, halign: "center" },
        3: { cellWidth: 15, halign: "center" },
        4: { cellWidth: 15, halign: "center" },
        5: { cellWidth: 28, halign: "right" },
        6: { cellWidth: 28, halign: "right" },
      },
      margin: { left: margin, right: margin },
    });

    // ─── Totals Section ──────────────────────────────────────
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let currentY = ((doc as any).lastAutoTable?.finalY ?? y + 40) + 6;

    const totalsX = rightEdge - 80;
    const totalsValueX = rightEdge;

    const drawTotalLine = (label: string, value: string, bold = false) => {
      doc.setFontSize(9);
      doc.setFont("helvetica", bold ? "bold" : "normal");
      doc.setTextColor(bold ? 0 : 80, bold ? 0 : 80, bold ? 0 : 80);
      doc.text(label, totalsX, currentY);
      doc.text(value, totalsValueX, currentY, { align: "right" });
      currentY += 6;
    };

    drawTotalLine("Subtotal:", formatCurrency(quotation.subtotal, quotation.currency));
    if (quotation.discount > 0) {
      drawTotalLine("Discount:", `- ${formatCurrency(quotation.discount, quotation.currency)}`);
    }
    if (quotation.tax > 0) {
      drawTotalLine("Tax:", formatCurrency(quotation.tax, quotation.currency));
    }
    if (quotation.shippingCost > 0) {
      drawTotalLine("Shipping:", formatCurrency(quotation.shippingCost, quotation.currency));
    }

    // Grand total with highlight
    doc.setFillColor(...NAVY);
    doc.rect(totalsX - 4, currentY - 4, rightEdge - totalsX + 8, 9, "F");
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(255, 255, 255);
    doc.text("GRAND TOTAL:", totalsX, currentY + 2);
    doc.text(formatCurrency(quotation.grandTotal, quotation.currency), totalsValueX, currentY + 2, { align: "right" });
    currentY += 16;

    // ─── Payment Terms ───────────────────────────────────────
    if (quotation.paymentTerms) {
      doc.setFontSize(10);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(...NAVY);
      doc.text("Payment Terms", margin, currentY);
      currentY += 6;
      doc.setFontSize(8);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(60, 60, 60);
      doc.text(quotation.paymentTerms, margin, currentY);
      currentY += 8;
    }

    // ─── Delivery Terms ──────────────────────────────────────
    if (quotation.deliveryTerms) {
      doc.setFontSize(10);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(...NAVY);
      doc.text("Delivery Terms", margin, currentY);
      currentY += 6;
      doc.setFontSize(8);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(60, 60, 60);
      doc.text(quotation.deliveryTerms, margin, currentY);
      currentY += 8;
    }

    // ─── Notes ───────────────────────────────────────────────
    if (quotation.notes) {
      doc.setFontSize(10);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(...NAVY);
      doc.text("Notes", margin, currentY);
      currentY += 6;
      doc.setFontSize(8);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(60, 60, 60);
      const noteLines = doc.splitTextToSize(quotation.notes, pageWidth - margin * 2);
      doc.text(noteLines, margin, currentY);
      currentY += noteLines.length * 4 + 6;
    }

    // ─── Validity Notice ─────────────────────────────────────
    const validUntil = new Date(quotation.createdAt);
    validUntil.setDate(validUntil.getDate() + quotation.validDays);

    doc.setFillColor(255, 248, 230);
    doc.rect(margin, currentY - 2, pageWidth - margin * 2, 10, "F");
    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(180, 120, 0);
    doc.text(
      `This quotation is valid for ${quotation.validDays} days (until ${validUntil.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })})`,
      margin + 4,
      currentY + 4
    );
    currentY += 16;

    // ─── Terms & Conditions ──────────────────────────────────
    // Check if we need a new page
    if (currentY > pageHeight - 60) {
      doc.addPage();
      currentY = 20;
    }

    doc.setDrawColor(...NAVY);
    doc.setLineWidth(0.5);
    doc.line(margin, currentY - 2, rightEdge, currentY - 2);

    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...NAVY);
    doc.text("Terms & Conditions", margin, currentY + 4);
    currentY += 10;

    doc.setFontSize(7.5);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(80, 80, 80);

    const terms = [
      "1. Prices quoted are in " + quotation.currency + " and are valid for " + quotation.validDays + " days from the date of this quotation.",
      "2. Payment terms as stated above. Orders will be processed upon receipt of the deposit payment.",
      "3. Delivery time is subject to confirmation upon order placement and may vary based on stock availability.",
      "4. All goods are subject to our standard quality inspection before shipment. Certificates of conformity provided where applicable.",
      "5. Warranty: Per manufacturer standard warranty terms. Defective goods must be reported within 30 days of receipt.",
      "6. This quotation is confidential and intended solely for the addressee. Reproduction or distribution without prior consent is prohibited.",
    ];

    terms.forEach((line) => {
      doc.text(line, margin, currentY, { maxWidth: pageWidth - margin * 2 });
      currentY += 5;
    });

    // ─── Footer ──────────────────────────────────────────────
    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.25);
    doc.line(margin, pageHeight - 16, rightEdge, pageHeight - 16);

    doc.setFontSize(7);
    doc.setTextColor(150, 150, 150);
    doc.text(
      "YuJiang Ship Technology Co., Ltd. | Tel: +86-580-8050000 | Email: sales@yujiangshiptech.com | www.yujiangshiptech.com",
      pageWidth / 2,
      pageHeight - 10,
      { align: "center" }
    );

    // Generate PDF buffer
    const pdfBuffer = Buffer.from(doc.output("arraybuffer"));

    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${quotation.quotationNumber}.pdf"`,
        "Content-Length": String(pdfBuffer.length),
      },
    });
  } catch (error) {
    if (error instanceof Response) return error;
    console.error("Quotation PDF error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
