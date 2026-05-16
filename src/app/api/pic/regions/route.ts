import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { decrypt } from '@/lib/auth';
import { cookies } from 'next/headers';

// POST — PIC Provinsi atau PIC Kabkota buka/kunci akses tahap untuk peserta di wilayahnya
export async function POST(request: Request) {
  const session = (await cookies()).get('session')?.value;
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const payload = await decrypt(session);
    if (payload.role !== 'PIC_PROVINSI' && payload.role !== 'PIC_KABKOTA') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const picUser = await prisma.user.findUniqueOrThrow({ where: { id: payload.userId } });
    const { stage, value, regencyCity: targetRC } = await request.json();

    if (![3, 5, 6].includes(stage)) {
      return NextResponse.json({ error: 'Stage harus 3, 5, atau 6.' }, { status: 400 });
    }

    const stageField: Record<number, string> = {
      3: 'stage3Unlocked',
      5: 'stage5Unlocked',
      6: 'stage6Unlocked',
    };

    let whereClause: any = {
      role: 'PARTICIPANT',
      province: picUser.province!,
    };

    if (picUser.role === 'PIC_KABKOTA') {
      // PIC KabKota hanya bisa atur peserta di kab/kotanya sendiri
      whereClause.regencyCity = picUser.regencyCity;
    } else if (picUser.role === 'PIC_PROVINSI') {
      // PIC Provinsi bisa atur kab/kota tertentu (atau semua di provinsinya)
      if (targetRC) {
        whereClause.regencyCity = targetRC;
      }
    }

    await prisma.user.updateMany({
      where: whereClause,
      data: { [stageField[stage]]: value },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
