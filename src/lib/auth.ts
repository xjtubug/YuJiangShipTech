import { getServerSession as nextAuthGetServerSession } from 'next-auth';
import type { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import prisma from '@/lib/prisma';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      email: string;
      name: string;
      role: string;
      avatar?: string | null;
    };
  }

  interface User {
    id: string;
    email: string;
    name: string;
    role: string;
    avatar?: string | null;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string;
    email: string;
    name: string;
    role: string;
    avatar?: string | null;
  }
}

const ROLE_HIERARCHY: Record<string, number> = {
  super_admin: 100,
  admin: 80,
  sales: 60,
  logistics: 40,
  viewer: 20,
  expert: 10,
};

export function hasRole(userRole: string, requiredRole: string): boolean {
  return (ROLE_HIERARCHY[userRole] ?? 0) >= (ROLE_HIERARCHY[requiredRole] ?? 0);
}

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const user = await prisma.adminUser.findUnique({
          where: { email: credentials.email },
        });

        if (!user || !user.active) {
          return null;
        }

        const isValid = await bcrypt.compare(credentials.password, user.password);
        if (!isValid) {
          return null;
        }

        // Update lastLoginAt
        await prisma.adminUser.update({
          where: { id: user.id },
          data: { lastLoginAt: new Date() },
        });

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          avatar: user.avatar,
        };
      },
    }),
  ],
  session: {
    strategy: 'jwt',
    maxAge: 24 * 60 * 60, // 24 hours
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.email = user.email!;
        token.name = user.name!;
        token.role = user.role;
        token.avatar = user.avatar;
      }
      return token;
    },
    async session({ session, token }) {
      session.user = {
        id: token.id,
        email: token.email,
        name: token.name,
        role: token.role,
        avatar: token.avatar,
      };
      return session;
    },
  },
  pages: {
    signIn: '/en/admin/login',
  },
  secret: process.env.NEXTAUTH_SECRET,
};

export async function getServerSession() {
  return nextAuthGetServerSession(authOptions);
}

/**
 * Require authentication for API routes.
 * Optionally check for specific roles.
 * Returns the session or throws a Response.
 */
export async function requireAuth(requiredRoles?: string[]) {
  const session = await getServerSession();

  if (!session?.user) {
    throw new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  if (requiredRoles && requiredRoles.length > 0) {
    const userHasAccess = requiredRoles.some((role) => hasRole(session.user.role, role));
    if (!userHasAccess) {
      throw new Response(JSON.stringify({ error: 'Forbidden' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  }

  return session;
}
