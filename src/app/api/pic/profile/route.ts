import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { decrypt } from '@/lib/auth';
import { cookies } from 'next/headers';
import bcrypt from 'bcryptjs';

export async function GET() {
  const session = (await cookies()).get('session')?.value;
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    const payload = await decrypt(session);
    const user = await prisma.user.findUniqueOrThrow({
      where: { id: payload.userId },
      select: { id: true, username: true, role: true, province: true, regencyCity: true, avatar: true },
    });
    return NextResponse.json(user);
  } catch { return NextResponse.json({ error: 'Error' }, { status: 500 }); }
}

export async function PATCH(request: Request) {
  const session = (await cookies()).get('session')?.value;
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    const payload = await decrypt(session);
    const { currentPassword, newPassword, avatar } = await request.json();
    const user = await prisma.user.findUniqueOrThrow({ where: { id: payload.userId } });
    const updateData: any = {};
    if (avatar !== undefined) updateData.avatar = avatar;
    if (newPassword) {
      const ok = await bcrypt.compare(currentPassword || '', user.passwordHash);
      if (!ok) return NextResponse.json({ error: 'Password lama salah.' }, { status: 400 });
      updateData.passwordHash = await bcrypt.hash(newPassword, 10);
    }
    await prisma.user.update({ where: { id: payload.userId }, data: updateData });
    return NextResponse.json({ success: true });
  } catch { return NextResponse.json({ error: 'Error' }, { status: 500 }); }
}
