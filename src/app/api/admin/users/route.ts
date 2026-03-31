import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import bcrypt from 'bcryptjs';

export async function GET() {
  try {
    await requireAuth(['admin']);

    const users = await prisma.adminUser.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        avatar: true,
        title: true,
        bio: true,
        active: true,
        lastLoginAt: true,
        createdAt: true,
        _count: { select: { expertReviews: true } },
      },
      orderBy: { createdAt: 'asc' },
    });

    return NextResponse.json({ users });
  } catch (error) {
    if (error instanceof Response) return error;
    console.error('Users GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireAuth(['admin']);

    const body = await request.json();
    const { email, password, name, role, title, bio, avatar } = body;

    if (!email || !password || !name || !role) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const validRoles = ['admin', 'expert'];
    if (!validRoles.includes(role)) {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
    }

    const existing = await prisma.adminUser.findUnique({
      where: { email },
    });
    if (existing) {
      return NextResponse.json({ error: 'Email already exists' }, { status: 409 });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await prisma.adminUser.create({
      data: {
        email,
        password: hashedPassword,
        name,
        role,
        title: title || null,
        bio: bio || null,
        avatar: avatar || null,
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        title: true,
        active: true,
        createdAt: true,
      },
    });

    return NextResponse.json({ user }, { status: 201 });
  } catch (error) {
    if (error instanceof Response) return error;
    console.error('Users POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await requireAuth();

    const body = await request.json();
    const { id, name, role, active, password, avatar, title } = body;

    if (!id) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 });
    }

    const isSelfUpdate = session.user.id === id;
    const isSuperAdmin = session.user.role === 'super_admin';

    // Non-super_admins can only update their own name/avatar
    if (!isSuperAdmin && !isSelfUpdate) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const data: Record<string, unknown> = {};

    if (isSuperAdmin) {
      if (role !== undefined) {
        const validRoles = ['super_admin', 'admin', 'sales', 'logistics', 'viewer', 'expert'];
        if (!validRoles.includes(role)) {
          return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
        }
        data.role = role;
      }
      if (active !== undefined) data.active = active;
      if (title !== undefined) data.title = title;
    }

    // Both super_admin and self can update these
    if (name !== undefined) data.name = name;
    if (avatar !== undefined) data.avatar = avatar;

    if (password) {
      if (!isSuperAdmin && !isSelfUpdate) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
      data.password = await bcrypt.hash(password, 12);
    }

    const user = await prisma.adminUser.update({
      where: { id },
      data,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        avatar: true,
        title: true,
        active: true,
        lastLoginAt: true,
        createdAt: true,
      },
    });

    return NextResponse.json({ user });
  } catch (error) {
    if (error instanceof Response) return error;
    console.error('Users PUT error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await requireAuth(['super_admin']);

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 });
    }

    // Prevent self-deactivation
    if (session.user.id === id) {
      return NextResponse.json(
        { error: 'Cannot deactivate yourself' },
        { status: 400 }
      );
    }

    await prisma.adminUser.update({
      where: { id },
      data: { active: false },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof Response) return error;
    console.error('Users DELETE error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
