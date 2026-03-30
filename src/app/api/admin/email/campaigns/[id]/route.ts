export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import { sendEmail } from '@/lib/email';

/* ------------------------------------------------------------------ */
/*  GET  — campaign detail with send stats                             */
/* ------------------------------------------------------------------ */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAuth(['sales']);
    const { id } = await params;

    const campaign = await prisma.emailCampaign.findUnique({ where: { id } });
    if (!campaign) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
    }

    const logs = await prisma.emailLog.findMany({
      where: { campaignId: id },
      orderBy: { sentAt: 'desc' },
      take: 200,
    });

    const statusCounts = logs.reduce(
      (acc, log) => {
        acc[log.status] = (acc[log.status] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    return NextResponse.json({ campaign, logs, statusCounts });
  } catch (error) {
    if (error instanceof Response) return error;
    console.error('Campaign detail GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/* ------------------------------------------------------------------ */
/*  POST — execute campaign action (send / schedule / cancel)          */
/* ------------------------------------------------------------------ */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAuth(['sales']);
    const { id } = await params;
    const body = await request.json();
    const { action, scheduledAt } = body;

    const campaign = await prisma.emailCampaign.findUnique({ where: { id } });
    if (!campaign) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
    }

    /* ---------- SCHEDULE ---------- */
    if (action === 'schedule') {
      if (!scheduledAt) {
        return NextResponse.json({ error: 'scheduledAt is required' }, { status: 400 });
      }
      const updated = await prisma.emailCampaign.update({
        where: { id },
        data: { status: 'scheduled', scheduledAt: new Date(scheduledAt) },
      });
      return NextResponse.json(updated);
    }

    /* ---------- CANCEL ---------- */
    if (action === 'cancel') {
      if (campaign.status !== 'scheduled') {
        return NextResponse.json(
          { error: 'Only scheduled campaigns can be cancelled' },
          { status: 400 }
        );
      }
      const updated = await prisma.emailCampaign.update({
        where: { id },
        data: { status: 'cancelled', scheduledAt: null },
      });
      return NextResponse.json(updated);
    }

    /* ---------- SEND ---------- */
    if (action === 'send') {
      if (campaign.status !== 'draft' && campaign.status !== 'scheduled') {
        return NextResponse.json(
          { error: 'Only draft or scheduled campaigns can be sent' },
          { status: 400 }
        );
      }

      // Mark as sending
      await prisma.emailCampaign.update({
        where: { id },
        data: { status: 'sending' },
      });

      // Resolve recipients
      let targetTags: string[] = [];
      try {
        targetTags = JSON.parse(campaign.targetTags as string);
      } catch {
        targetTags = [];
      }

      let recipients: { email: string; name: string }[];

      if (targetTags.includes('__newsletter__')) {
        // Newsletter subscribers
        const subscribers = await prisma.newsletterSubscriber.findMany({
          where: { active: true },
          select: { email: true },
        });
        recipients = subscribers.map((s) => ({ email: s.email, name: '' }));
      } else if (targetTags.length > 0) {
        // Customers matching any of the target tags
        const allCustomers = await prisma.customer.findMany({
          select: { email: true, name: true, tags: true },
        });
        recipients = allCustomers.filter((c) => {
          try {
            const customerTags: string[] = JSON.parse(c.tags as string);
            return targetTags.some((t) => customerTags.includes(t));
          } catch {
            return false;
          }
        });
      } else {
        // All customers
        recipients = await prisma.customer.findMany({
          select: { email: true, name: true },
        });
      }

      // Send emails sequentially with delays
      let sentCount = 0;

      // Fire-and-forget: process in background
      const sendAll = async () => {
        for (const recipient of recipients) {
          try {
            const personalizedBody = campaign.body
              .replaceAll('{{customerName}}', recipient.name || 'Valued Customer')
              .replaceAll('{{companyName}}', '');

            await sendEmail(recipient.email, campaign.subject, personalizedBody);

            await prisma.emailLog.create({
              data: {
                campaignId: id,
                to: recipient.email,
                subject: campaign.subject,
                status: 'sent',
              },
            });
            sentCount++;
          } catch (err) {
            console.error(`Failed to send to ${recipient.email}:`, err);
            await prisma.emailLog.create({
              data: {
                campaignId: id,
                to: recipient.email,
                subject: campaign.subject,
                status: 'failed',
              },
            });
          }
          // Small delay between sends
          await new Promise((r) => setTimeout(r, 200));
        }

        // Update campaign as sent
        await prisma.emailCampaign.update({
          where: { id },
          data: {
            status: 'sent',
            sentAt: new Date(),
            totalSent: sentCount,
          },
        });
      };

      // Start sending in background (non-blocking)
      sendAll().catch((err) =>
        console.error('Campaign send background error:', err)
      );

      return NextResponse.json({
        message: 'Campaign sending started',
        recipientCount: recipients.length,
      });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    if (error instanceof Response) return error;
    console.error('Campaign action POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
