import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session || session.role !== 'PARTICIPANT') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { stage, data } = await request.json();
    const userId = session.userId;

    let progressUpdate = {};
    
    // Stringify array to fit into the single stage1Notes DB field
    if (stage === 1 && data.notesArray) {
      progressUpdate = { stage1Notes: JSON.stringify(data.notesArray) };
    }
    if (stage === 2 && data.notes) {
      progressUpdate = { stage2Notes: data.notes };
    }
    if (stage === 5 && data.plan) {
      progressUpdate = { stage5Plan: JSON.stringify(data.plan) }; // JSON stringify the 4 inputs
    }
    
    await prisma.participantProgress.upsert({
      where: { userId },
      update: progressUpdate,
      create: {
        userId,
        ...progressUpdate
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to auto-save progress' }, { status: 500 });
  }
}
