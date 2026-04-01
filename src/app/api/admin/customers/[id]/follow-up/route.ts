import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await requireAuth(['sales']);
    const { action, content } = await request.json();

    if (!content || typeof content !== 'string' || !content.trim()) {
      return NextResponse.json({ error: '跟进内容不能为空' }, { status: 400 });
    }

    const customer = await prisma.customer.findUnique({
      where: { id: params.id },
      select: { id: true, name: true },
    });

    if (!customer) {
      return NextResponse.json({ error: '客户不存在' }, { status: 404 });
    }

    const followUp = await prisma.customerFollowUp.create({
      data: {
        customerId: customer.id,
        action:
          typeof action === 'string' &&
          ['call', 'email', 'meeting', 'note', 'order'].includes(action)
            ? action
            : 'note',
        content: content.trim(),
        createdBy: session.user.name || session.user.email,
      },
    });

    return NextResponse.json({ success: true, followUp }, { status: 201 });
  } catch (error) {
    if (error instanceof Response) return error;
    console.error('Customer follow-up create error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
