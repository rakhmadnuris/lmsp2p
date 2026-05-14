import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { encrypt } from '@/lib/auth';
import { cookies } from 'next/headers';
import bcrypt from 'bcryptjs';

export async function POST(request: Request) {
  try {
    const { username, password } = await request.json();

    if (!username || !password) {
      return NextResponse.json({ error: 'Username and password required' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { username }
    });

    if (!user) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    // Set session cookie
    const session = await encrypt({
      userId: user.id,
      username: user.username,
      role: user.role,
      province: user.province,
      regencyCity: user.regencyCity
    });

    (await cookies()).set('session', session, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 // 1 day
    });

    const redirectUrl = user.role === 'ADMIN' ? '/admin/dashboard' : '/dashboard';
    
    return NextResponse.json({ success: true, role: user.role, redirectUrl });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
