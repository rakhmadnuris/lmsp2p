import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { decrypt } from '@/lib/auth';
import { cookies } from 'next/headers';
import bcrypt from 'bcryptjs';

async function requireAdmin() {
  const session = (await cookies()).get('session')?.value;
  if (!session) return null;
  try {
    const payload = await decrypt(session);
    if (payload.role !== 'ADMIN') return null;
    return payload;
  } catch { return null; }
}

// GET — list semua PIC
export async function GET() {
  if (!await requireAdmin()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const pics = await prisma.user.findMany({
    where: { role: { in: ['PIC_PROVINSI', 'PIC_KABKOTA'] } },
    select: { id: true, username: true, role: true, province: true, regencyCity: true, createdAt: true },
    orderBy: [{ role: 'asc' }, { province: 'asc' }, { regencyCity: 'asc' }],
  });

  return NextResponse.json(pics);
}

// POST — tambah PIC Provinsi baru
export async function POST(request: Request) {
  if (!await requireAdmin()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { username, password, role, province, regencyCity } = await request.json();

  if (!username || !password || !role || !province) {
    return NextResponse.json({ error: 'username, password, role, dan province wajib diisi.' }, { status: 400 });
  }

  if (role !== 'PIC_PROVINSI' && role !== 'PIC_KABKOTA') {
    return NextResponse.json({ error: 'Role harus PIC_PROVINSI atau PIC_KABKOTA.' }, { status: 400 });
  }

  if (role === 'PIC_KABKOTA' && !regencyCity) {
    return NextResponse.json({ error: 'regencyCity wajib diisi untuk PIC Kabupaten/Kota.' }, { status: 400 });
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
      role,
      province,
      regencyCity: role === 'PIC_KABKOTA' ? regencyCity : null,
    },
    select: { id: true, username: true, role: true, province: true, regencyCity: true },
  });

  return NextResponse.json({ success: true, user: newPic });
}

// DELETE — hapus PIC
export async function DELETE(request: Request) {
  if (!await requireAdmin()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'id wajib.' }, { status: 400 });

  await prisma.user.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
