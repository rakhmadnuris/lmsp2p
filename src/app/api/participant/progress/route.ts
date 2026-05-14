import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function GET() {
  try {
    const session = await getSession();
    if (!session || session.role !== 'PARTICIPANT') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const progress = await prisma.participantProgress.findUnique({
      where: { userId: session.userId }
    });
    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      select: { currentStage: true, certificate: true }
    });
    return NextResponse.json({ 
      progress, 
      currentStage: user?.currentStage || 1,
      hasCertificate: !!user?.certificate
    });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch progress' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session || session.role !== 'PARTICIPANT') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { stage, data } = await request.json();
    const userId = session.userId;

    let progressUpdate: any = {};
    
    if (stage === 1) progressUpdate = { stage1Notes: data.notes, stage1Done: true };
    if (stage === 2) progressUpdate = { stage2Notes: data.notes, stage2Done: true };
    if (stage === 3) progressUpdate = { stage3Score: data.score, stage3Done: true };
    if (stage === 4) progressUpdate = { stage4Done: true };
    if (stage === 5) progressUpdate = { stage5Plan: data.plan, stage5Done: true };
    if (stage === 6) progressUpdate = { stage6Score: data.score, stage6Done: true };

    // Pakai upsert agar tidak error kalau progress belum ada
    await prisma.participantProgress.upsert({
      where: { userId },
      update: progressUpdate,
      create: { userId, ...progressUpdate }
    });

    // Advance user stage
    const nextStage = stage < 7 ? stage + 1 : 7;
    const user = await prisma.user.update({
      where: { id: userId },
      data: { currentStage: nextStage }
    });

    let isNextStageLocked = false;
    if (nextStage === 3 && !user.stage3Unlocked) isNextStageLocked = true;
    if (nextStage === 5 && !user.stage5Unlocked) isNextStageLocked = true;
    if (nextStage === 6 && !user.stage6Unlocked) isNextStageLocked = true;

    return NextResponse.json({ success: true, nextStage, isNextStageLocked });
  } catch (error) {
    console.error('Progress update error:', error);
    return NextResponse.json({ error: 'Failed to save progress' }, { status: 500 });
  }
}
