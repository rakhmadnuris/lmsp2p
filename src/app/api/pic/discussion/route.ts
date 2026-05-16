import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { decrypt } from '@/lib/auth';
import { cookies } from 'next/headers';

export async function GET(request: Request) {
  const session = (await cookies()).get('session')?.value;
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const payload = await decrypt(session);
    if (payload.role !== 'PIC_PROVINSI' && payload.role !== 'PIC_KABKOTA') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { province, regencyCity, role } = await prisma.user.findUniqueOrThrow({ where: { id: payload.userId } });

    if (role === 'PIC_PROVINSI') {
      const discussions = await prisma.discussionSession.findMany({
        where: { province: province! }
      });
      return NextResponse.json(discussions);
    } else {
      const discussion = await prisma.discussionSession.findUnique({
        where: { province_regencyCity: { province: province!, regencyCity: regencyCity! } }
      });
      return NextResponse.json(discussion ? [discussion] : []);
    }
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch discussions' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const session = (await cookies()).get('session')?.value;
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const payload = await decrypt(session);
    if (payload.role !== 'PIC_PROVINSI' && payload.role !== 'PIC_KABKOTA') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const picUser = await prisma.user.findUniqueOrThrow({ where: { id: payload.userId } });
    const { regencyCity, date, mode, zoomLink, location } = await request.json();

    if (!date) return NextResponse.json({ error: 'Date is required' }, { status: 400 });

    let targetRegencyCity = regencyCity;
    if (picUser.role === 'PIC_KABKOTA') {
      targetRegencyCity = picUser.regencyCity;
    } else {
      if (!targetRegencyCity) return NextResponse.json({ error: 'Regency/City is required for PIC Provinsi' }, { status: 400 });
    }

    const discussion = await prisma.discussionSession.upsert({
      where: {
        province_regencyCity: {
          province: picUser.province!,
          regencyCity: targetRegencyCity!
        }
      },
      update: {
        date,
        mode: mode || 'luring',
        zoomLink: mode === 'daring' ? (zoomLink || null) : null,
        location: mode === 'luring' ? (location || null) : null,
      },
      create: {
        province: picUser.province!,
        regencyCity: targetRegencyCity!,
        date,
        mode: mode || 'luring',
        zoomLink: mode === 'daring' ? (zoomLink || null) : null,
        location: mode === 'luring' ? (location || null) : null,
      }
    });

    return NextResponse.json({ success: true, discussion });
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

