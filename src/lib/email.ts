import nodemailer from 'nodemailer';

function createTransport() {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT) || 587,
    secure: Number(process.env.SMTP_PORT) === 465,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
}

export async function sendEmail(
  to: string,
  subject: string,
  html: string
): Promise<void> {
  const transporter = createTransport();
  await transporter.sendMail({
    from: process.env.SMTP_USER,
    to,
    subject,
    html,
  });
}

interface InquiryNotification {
  customerEmail: string;
  customerName: string;
  inquiryNumber: string;
  items: { productName: string; quantity: number; unit: string }[];
}

export async function sendInquiryNotification(
  inquiry: InquiryNotification
): Promise<void> {
  const itemRows = inquiry.items
    .map(
      (item) =>
        `<tr><td>${item.productName}</td><td>${item.quantity} ${item.unit}</td></tr>`
    )
    .join('');

  const html = `
    <h2>Inquiry Confirmation - ${inquiry.inquiryNumber}</h2>
    <p>Dear ${inquiry.customerName},</p>
    <p>Thank you for your inquiry. We have received your request and will respond within 24 hours.</p>
    <table border="1" cellpadding="8" cellspacing="0">
      <thead><tr><th>Product</th><th>Quantity</th></tr></thead>
      <tbody>${itemRows}</tbody>
    </table>
    <p>Best regards,<br/>YuJiang Ship Technology</p>
  `;

  const salesHtml = `
    <h2>New Inquiry Received - ${inquiry.inquiryNumber}</h2>
    <p><strong>Customer:</strong> ${inquiry.customerName} (${inquiry.customerEmail})</p>
    <table border="1" cellpadding="8" cellspacing="0">
      <thead><tr><th>Product</th><th>Quantity</th></tr></thead>
      <tbody>${itemRows}</tbody>
    </table>
  `;

  const salesEmail = process.env.SALES_EMAIL ?? process.env.SMTP_USER ?? '';

  await Promise.all([
    sendEmail(inquiry.customerEmail, `Inquiry ${inquiry.inquiryNumber} - Confirmation`, html),
    sendEmail(salesEmail, `New Inquiry ${inquiry.inquiryNumber}`, salesHtml),
  ]);
}

interface ContactNotification {
  name: string;
  email: string;
  company?: string;
  message: string;
}

export async function sendContactNotification(
  contact: ContactNotification
): Promise<void> {
  const salesEmail = process.env.SALES_EMAIL ?? process.env.SMTP_USER ?? '';

  const html = `
    <h2>New Contact Form Submission</h2>
    <p><strong>Name:</strong> ${contact.name}</p>
    <p><strong>Email:</strong> ${contact.email}</p>
    ${contact.company ? `<p><strong>Company:</strong> ${contact.company}</p>` : ''}
    <p><strong>Message:</strong></p>
    <p>${contact.message}</p>
  `;

  await sendEmail(salesEmail, `Contact Form: ${contact.name}`, html);
}
