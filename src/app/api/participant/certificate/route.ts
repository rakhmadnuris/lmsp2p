import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session || session.role !== 'PARTICIPANT') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { fullName, implementationDate, regencyCity } = await request.json();
    const userId = session.userId;

    // Check if certificate data already exists
    const existingCert = await prisma.certificate.findUnique({
      where: { userId }
    });

    if (existingCert) {
      return NextResponse.json({ error: 'Certificate data has already been submitted.' }, { status: 400 });
    }

    await prisma.certificate.create({
      data: {
        userId,
        fullName,
        implementationDate,
        regencyCity
      }
    });

    // Advance stage beyond 7 to mark Stage 7 as completed
    await prisma.user.update({
      where: { id: userId },
      data: { currentStage: 8 }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to save certificate data' }, { status: 500 });
  }
}
