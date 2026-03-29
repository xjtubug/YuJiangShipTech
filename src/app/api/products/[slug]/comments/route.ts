import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET approved comments for a product
export async function GET(request: NextRequest, { params }: { params: { slug: string } }) {
  const { slug } = params;
  const product = await prisma.product.findFirst({ where: { OR: [{ id: slug }, { slug: slug }] }, select: { id: true } });
  if (!product) return NextResponse.json({ comments: [] });

  const comments = await prisma.customerComment.findMany({
    where: { productId: product.id, approved: true },
    orderBy: { createdAt: 'desc' },
  });
  return NextResponse.json({ comments });
}

// POST new comment (requires moderation)
export async function POST(request: NextRequest, { params }: { params: { slug: string } }) {
  const { slug } = params;
  const product = await prisma.product.findFirst({ where: { OR: [{ id: slug }, { slug: slug }] }, select: { id: true } });
  if (!product) return NextResponse.json({ error: 'Product not found' }, { status: 404 });

  const { name, email, company, country, content, rating, images } = await request.json();
  if (!name || !email || !content) {
    return NextResponse.json({ error: '请填写必要信息' }, { status: 400 });
  }

  await prisma.customerComment.create({
    data: {
      productId: product.id,
      name,
      email,
      company: company || null,
      country: country || null,
      content,
      rating: Math.min(5, Math.max(1, rating || 5)),
      images: JSON.stringify(images || []),
      approved: false,
    },
  });

  // Create notification for admin
  await prisma.notification.create({
    data: {
      type: 'new_comment',
      title: '新的客户留言',
      message: `${name} 对产品发表了留言，等待审核`,
      link: '/admin/products',
    },
  });

  return NextResponse.json({ success: true, message: '留言已提交，审核通过后将展示' });
}
