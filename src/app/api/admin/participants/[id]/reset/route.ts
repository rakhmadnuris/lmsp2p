import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const admin = await prisma.user.findUnique({ where: { id: session.userId } });
    if (!admin || admin.role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const { id: userId } = await params;

    // Reset user stage back to 1
    await prisma.user.update({
      where: { id: userId },
      data: {
        currentStage: 1,
      }
    });

    // Delete existing progress
    await prisma.participantProgress.deleteMany({
      where: { userId }
    });

    // Delete existing certificate if any
    await prisma.certificate.deleteMany({
      where: { userId }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Reset participant error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
