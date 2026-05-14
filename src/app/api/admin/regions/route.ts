import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function POST(request: Request) {
  try {
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
