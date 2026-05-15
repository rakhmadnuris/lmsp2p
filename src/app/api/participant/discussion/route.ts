import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { decrypt } from '@/lib/auth';
import { cookies } from 'next/headers';

export async function GET(request: Request) {
  const session = (await cookies()).get('session')?.value;
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const payload = await decrypt(session);
    if (payload.role !== 'PARTICIPANT') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: { province: true, regencyCity: true }
    });

    if (!user?.province || !user?.regencyCity) {
      return NextResponse.json({ date: null });
    }

    const discussion = await prisma.discussionSession.findUnique({
      where: {
        province_regencyCity: { province: user.province, regencyCity: user.regencyCity }
      }
    });

    return NextResponse.json({ date: discussion?.date || null });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch discussion' }, { status: 500 });
  }
}
