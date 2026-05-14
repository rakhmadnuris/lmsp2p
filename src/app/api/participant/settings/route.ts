import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/auth';
import bcrypt from 'bcryptjs';

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { password, avatar } = await request.json();
    const userId = session.userId;

    let updateData: any = {};
    if (password) {
      updateData.passwordHash = await bcrypt.hash(password, 10);
    }
    if (avatar) {
      updateData.avatar = avatar;
    }

    await prisma.user.update({
      where: { id: userId },
      data: updateData
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 });
  }
}
