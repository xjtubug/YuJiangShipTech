import prisma from '@/lib/prisma';
import { sendEmail } from '@/lib/email';

// Replace template variables with actual values
function replaceVariables(
  text: string,
  variables: Record<string, string>
): string {
  let result = text;
  for (const [key, value] of Object.entries(variables)) {
    result = result.replaceAll(`{{${key}}}`, value);
  }
  return result;
}

// Get an active template by type, returns null if not found
async function getTemplate(type: string) {
  return prisma.emailTemplate.findFirst({
    where: { type, active: true },
  });
}

// Log an email send attempt
async function logEmail(
  to: string,
  subject: string,
  status: string,
  campaignId?: string
) {
  try {
    await prisma.emailLog.create({
      data: { to, subject, status, campaignId: campaignId ?? null },
    });
  } catch (e) {
    console.error('Failed to log email:', e);
  }
}

/**
 * Send welcome email to a new customer after their first inquiry.
 * Non-blocking — errors are caught and logged, never thrown.
 */
export async function sendWelcomeEmail(customer: {
  email: string;
  name: string;
  company?: string | null;
}) {
  try {
    const template = await getTemplate('welcome');
    if (!template) {
      console.warn('No active welcome email template found');
      return;
    }

    const variables: Record<string, string> = {
      customerName: customer.name,
      companyName: customer.company || '',
    };

    const subject = replaceVariables(template.subject, variables);
    const body = replaceVariables(template.body, variables);

    // Create an auto campaign record
    const campaign = await prisma.emailCampaign.create({
      data: {
        name: `Auto Welcome - ${customer.email}`,
        templateId: template.id,
        subject,
        body,
        type: 'auto_welcome',
        status: 'sent',
        sentAt: new Date(),
        totalSent: 1,
        createdBy: 'system',
      },
    });

    await sendEmail(customer.email, subject, body);
    await logEmail(customer.email, subject, 'sent', campaign.id);
  } catch (error) {
    console.error('Failed to send welcome email:', error);
    await logEmail(customer.email, 'Welcome Email', 'failed').catch(() => {});
  }
}

/**
 * Send inquiry follow-up email.
 * Intended to be called ~24h after inquiry creation (via cron / scheduler).
 * For now, logs the intent and sends immediately if called.
 */
export async function sendInquiryFollowUp(inquiry: {
  email: string;
  contactName: string;
  inquiryNumber: string;
  companyName?: string;
}) {
  try {
    const template = await getTemplate('inquiry_followup');
    if (!template) {
      console.warn('No active inquiry follow-up template found');
      return;
    }

    const variables: Record<string, string> = {
      customerName: inquiry.contactName,
      companyName: inquiry.companyName || '',
      inquiryNumber: inquiry.inquiryNumber,
    };

    const subject = replaceVariables(template.subject, variables);
    const body = replaceVariables(template.body, variables);

    const campaign = await prisma.emailCampaign.create({
      data: {
        name: `Auto Follow-up - ${inquiry.inquiryNumber}`,
        templateId: template.id,
        subject,
        body,
        type: 'auto_followup',
        status: 'sent',
        sentAt: new Date(),
        totalSent: 1,
        createdBy: 'system',
      },
    });

    await sendEmail(inquiry.email, subject, body);
    await logEmail(inquiry.email, subject, 'sent', campaign.id);
  } catch (error) {
    console.error('Failed to send inquiry follow-up email:', error);
    await logEmail(inquiry.email, 'Inquiry Follow-up', 'failed').catch(() => {});
  }
}

/**
 * Batch-send holiday greeting emails to a list of customers.
 * Processes sequentially with a small delay to avoid overwhelming SMTP.
 */
export async function sendHolidayGreeting(
  customers: { email: string; name: string; company?: string | null }[]
) {
  try {
    const template = await getTemplate('holiday');
    if (!template) {
      console.warn('No active holiday template found');
      return { sent: 0, failed: 0 };
    }

    const campaign = await prisma.emailCampaign.create({
      data: {
        name: `Holiday Greeting - ${new Date().toISOString().slice(0, 10)}`,
        templateId: template.id,
        subject: template.subject,
        body: template.body,
        type: 'auto_holiday',
        status: 'sending',
        createdBy: 'system',
      },
    });

    let sent = 0;
    let failed = 0;

    for (const customer of customers) {
      try {
        const variables: Record<string, string> = {
          customerName: customer.name,
          companyName: customer.company || '',
        };
        const subject = replaceVariables(template.subject, variables);
        const body = replaceVariables(template.body, variables);

        await sendEmail(customer.email, subject, body);
        await logEmail(customer.email, subject, 'sent', campaign.id);
        sent++;
      } catch {
        await logEmail(customer.email, template.subject, 'failed', campaign.id);
        failed++;
      }
      // Small delay between sends
      await new Promise((r) => setTimeout(r, 200));
    }

    await prisma.emailCampaign.update({
      where: { id: campaign.id },
      data: { status: 'sent', sentAt: new Date(), totalSent: sent },
    });

    return { sent, failed };
  } catch (error) {
    console.error('Failed to send holiday greetings:', error);
    return { sent: 0, failed: 0 };
  }
}
