import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();
    if (!email || !password) {
      return NextResponse.json({ error: '请输入邮箱和密码' }, { status: 400 });
    }

    const user = await prisma.adminUser.findUnique({ where: { email } });
    if (!user || user.password !== password || user.role !== 'expert') {
      return NextResponse.json({ error: '邮箱或密码错误' }, { status: 401 });
    }

    const response = NextResponse.json({ success: true, expert: { id: user.id, name: user.name, email: user.email } });
    response.cookies.set('expert_session', user.id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/',
    });
    return response;
  } catch (error) {
    console.error('Expert login error:', error);
    return NextResponse.json({ error: '服务器错误' }, { status: 500 });
  }
}
