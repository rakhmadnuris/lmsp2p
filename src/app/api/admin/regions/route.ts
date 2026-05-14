import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const admin = await prisma.user.findUnique({ where: { id: session.userId } });
    if (!admin || admin.role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const { province, regencyCity, stage, value } = await request.json();
    
    let updateData = {};
    if (stage === 3) updateData = { stage3Unlocked: value };
    if (stage === 5) updateData = { stage5Unlocked: value };
    if (stage === 6) updateData = { stage6Unlocked: value };

    const where: any = { province, role: 'PARTICIPANT' };
    if (regencyCity) where.regencyCity = regencyCity;

    await prisma.user.updateMany({
      where,
      data: updateData
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update region access' }, { status: 500 });
  }
}
