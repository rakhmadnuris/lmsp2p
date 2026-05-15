import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { decrypt } from '@/lib/auth';
import { cookies } from 'next/headers';
import bcrypt from 'bcryptjs';

export async function GET(request: Request) {
  const session = (await cookies()).get('session')?.value;
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const payload = await decrypt(session);
    if (payload.role !== 'PIC_PROVINSI' && payload.role !== 'PIC_KABKOTA') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const picUser = await prisma.user.findUniqueOrThrow({ where: { id: payload.userId } });
    const { province, regencyCity, role } = picUser;

    let users;
    if (role === 'PIC_PROVINSI') {
      // PIC Provinsi hanya bisa lihat peserta di provinsinya
      users = await prisma.user.findMany({
        where: { province: province!, role: 'PARTICIPANT' },
        include: { progress: true, certificate: true },
        orderBy: [{ regencyCity: 'asc' }, { username: 'asc' }]
      });
    } else {
      // PIC KabKota hanya bisa lihat peserta di kab/kotanya
      users = await prisma.user.findMany({
        where: { province: province!, regencyCity: regencyCity!, role: 'PARTICIPANT' },
        include: { progress: true, certificate: true },
        orderBy: { username: 'asc' }
      });
    }

    return NextResponse.json(users);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const session = (await cookies()).get('session')?.value;
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const payload = await decrypt(session);
    if (payload.role !== 'PIC_KABKOTA') {
      return NextResponse.json({ error: 'Forbidden. Only PIC KabKota can add participants.' }, { status: 403 });
    }

    const picUser = await prisma.user.findUniqueOrThrow({ where: { id: payload.userId } });

    const currentCount = await prisma.user.count({
      where: {
        province: picUser.province!,
        regencyCity: picUser.regencyCity!,
        role: 'PARTICIPANT'
      }
    });

    if (currentCount >= 40) {
      return NextResponse.json({ error: 'Batas maksimal 40 peserta telah tercapai.' }, { status: 400 });
    }

    const { username, password } = await request.json();

    if (!username || !password) {
      return NextResponse.json({ error: 'Username dan password wajib diisi.' }, { status: 400 });
    }

    const existingUser = await prisma.user.findUnique({ where: { username } });
    if (existingUser) {
      return NextResponse.json({ error: 'Username sudah digunakan.' }, { status: 400 });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const newUser = await prisma.user.create({
      data: {
        username,
        passwordHash,
        role: 'PARTICIPANT',
        province: picUser.province,
        regencyCity: picUser.regencyCity,
        progress: { create: {} }
      }
    });

    return NextResponse.json({ success: true, user: { id: newUser.id, username: newUser.username } });
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
