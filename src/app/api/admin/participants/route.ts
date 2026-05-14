import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/auth';
import bcrypt from 'bcryptjs';

export async function GET() {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const admin = await prisma.user.findUnique({ where: { id: session.userId } });
    if (!admin || admin.role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

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
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const admin = await prisma.user.findUnique({ where: { id: session.userId } });
    if (!admin || admin.role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

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
