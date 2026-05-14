import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import bcrypt from 'bcryptjs';

export async function GET() {
  const participants = await prisma.user.findMany({
    where: { role: 'PARTICIPANT' },
    select: {
      id: true,
      username: true,
      province: true,
      regencyCity: true,
      gender: true,
      currentStage: true,
      stage3Unlocked: true,
      stage5Unlocked: true,
      stage6Unlocked: true,
      progress: true,
      certificate: true
    }
  });
  return NextResponse.json(participants);
}

export async function POST(request: Request) {
  try {
    const { username, password, province, regencyCity, gender } = await request.json();
    const passwordHash = await bcrypt.hash(password, 10);
    
    const user = await prisma.user.create({
      data: {
        username,
        passwordHash,
        role: 'PARTICIPANT',
        province,
        regencyCity,
        gender,
        progress: {
          create: {}
        }
      }
    });
    return NextResponse.json({ success: true, user });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create participant' }, { status: 500 });
  }
}
