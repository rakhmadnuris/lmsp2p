import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { decrypt } from '@/lib/auth';
import { cookies } from 'next/headers';
import bcrypt from 'bcryptjs';

// GET — list PIC KabKota di provinsi PIC Provinsi
export async function GET() {
  const session = (await cookies()).get('session')?.value;
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const payload = await decrypt(session);
    if (payload.role !== 'PIC_PROVINSI') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const picUser = await prisma.user.findUniqueOrThrow({ where: { id: payload.userId } });

    const kabkotaPics = await prisma.user.findMany({
      where: { role: 'PIC_KABKOTA', province: picUser.province! },
      select: { id: true, username: true, regencyCity: true, createdAt: true },
      orderBy: { regencyCity: 'asc' },
    });

    return NextResponse.json(kabkotaPics);
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// POST — PIC Provinsi tambah PIC KabKota di provinsinya
export async function POST(request: Request) {
  const session = (await cookies()).get('session')?.value;
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const payload = await decrypt(session);
    if (payload.role !== 'PIC_PROVINSI') {
      return NextResponse.json({ error: 'Hanya PIC Provinsi yang bisa menambah PIC Kabupaten/Kota.' }, { status: 403 });
    }

    const picUser = await prisma.user.findUniqueOrThrow({ where: { id: payload.userId } });
    const { username, password, regencyCity } = await request.json();

    if (!username || !password || !regencyCity) {
      return NextResponse.json({ error: 'username, password, dan regencyCity wajib diisi.' }, { status: 400 });
    }

    const existing = await prisma.user.findUnique({ where: { username } });
    if (existing) {
      return NextResponse.json({ error: 'Username sudah digunakan.' }, { status: 400 });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const newPic = await prisma.user.create({
      data: {
        username,
        passwordHash,
        role: 'PIC_KABKOTA',
        province: picUser.province!,
        regencyCity,
      },
      select: { id: true, username: true, regencyCity: true },
    });

    return NextResponse.json({ success: true, user: newPic });
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// DELETE — PIC Provinsi hapus PIC KabKota di provinsinya
export async function DELETE(request: Request) {
  const session = (await cookies()).get('session')?.value;
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const payload = await decrypt(session);
    if (payload.role !== 'PIC_PROVINSI') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const picUser = await prisma.user.findUniqueOrThrow({ where: { id: payload.userId } });
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'id wajib.' }, { status: 400 });

    // Pastikan hanya hapus PIC KabKota di provinsi yang sama
    const target = await prisma.user.findUnique({ where: { id } });
    if (!target || target.role !== 'PIC_KABKOTA' || target.province !== picUser.province) {
      return NextResponse.json({ error: 'Tidak ditemukan atau tidak berwenang.' }, { status: 403 });
    }

    await prisma.user.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
