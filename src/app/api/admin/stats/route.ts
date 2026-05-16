import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { decrypt } from '@/lib/auth';
import { cookies } from 'next/headers';

async function requireAdmin() {
  const session = (await cookies()).get('session')?.value;
  if (!session) return null;
  try {
    const payload = await decrypt(session);
    if (payload.role !== 'ADMIN') return null;
    return payload;
  } catch { return null; }
}

export async function GET() {
  if (!await requireAdmin()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // Ambil semua peserta
  const participants = await prisma.user.findMany({
    where: { role: 'PARTICIPANT' },
    select: {
      id: true,
      province: true,
      regencyCity: true,
      currentStage: true,
      progress: { select: { stage3Score: true, stage6Score: true, stage3Done: true, stage6Done: true } },
      certificate: { select: { id: true } },
    },
  });

  // Ambil semua PIC
  const pics = await prisma.user.findMany({
    where: { role: { in: ['PIC_PROVINSI', 'PIC_KABKOTA'] } },
    select: { province: true, regencyCity: true, role: true },
  });

  // Ambil semua sesi diskusi
  const discussions = await prisma.discussionSession.findMany({
    select: { province: true, regencyCity: true, date: true },
  });

  // Group peserta by province
  const provinceMap: Record<string, {
    totalPeserta: number;
    selesai: number;
    avgPre: number | null;
    avgPost: number | null;
    kabkotas: Record<string, {
      totalPeserta: number;
      selesai: number;
      avgPre: number | null;
      avgPost: number | null;
      hasPicKabkota: boolean;
      discussionDate: string | null;
    }>;
    hasPicProvinsi: boolean;
  }> = {};

  participants.forEach(p => {
    const prov = p.province || 'Tidak Diketahui';
    const kk = p.regencyCity || 'Tidak Diketahui';

    if (!provinceMap[prov]) {
      provinceMap[prov] = { totalPeserta: 0, selesai: 0, avgPre: null, avgPost: null, kabkotas: {}, hasPicProvinsi: false };
    }
    provinceMap[prov].totalPeserta++;
    if (p.certificate) provinceMap[prov].selesai++;

    if (!provinceMap[prov].kabkotas[kk]) {
      provinceMap[prov].kabkotas[kk] = { totalPeserta: 0, selesai: 0, avgPre: null, avgPost: null, hasPicKabkota: false, discussionDate: null };
    }
    provinceMap[prov].kabkotas[kk].totalPeserta++;
    if (p.certificate) provinceMap[prov].kabkotas[kk].selesai++;
  });

  // Hitung rata-rata nilai per provinsi & kab/kota
  Object.keys(provinceMap).forEach(prov => {
    const provParticipants = participants.filter(p => (p.province || 'Tidak Diketahui') === prov);
    const preScores = provParticipants.filter(p => p.progress?.stage3Score != null).map(p => p.progress!.stage3Score!);
    const postScores = provParticipants.filter(p => p.progress?.stage6Score != null).map(p => p.progress!.stage6Score!);
    provinceMap[prov].avgPre = preScores.length > 0 ? +(preScores.reduce((a, b) => a + b, 0) / preScores.length).toFixed(1) : null;
    provinceMap[prov].avgPost = postScores.length > 0 ? +(postScores.reduce((a, b) => a + b, 0) / postScores.length).toFixed(1) : null;

    Object.keys(provinceMap[prov].kabkotas).forEach(kk => {
      const kkParticipants = provParticipants.filter(p => (p.regencyCity || 'Tidak Diketahui') === kk);
      const kkPre = kkParticipants.filter(p => p.progress?.stage3Score != null).map(p => p.progress!.stage3Score!);
      const kkPost = kkParticipants.filter(p => p.progress?.stage6Score != null).map(p => p.progress!.stage6Score!);
      provinceMap[prov].kabkotas[kk].avgPre = kkPre.length > 0 ? +(kkPre.reduce((a, b) => a + b, 0) / kkPre.length).toFixed(1) : null;
      provinceMap[prov].kabkotas[kk].avgPost = kkPost.length > 0 ? +(kkPost.reduce((a, b) => a + b, 0) / kkPost.length).toFixed(1) : null;
    });
  });

  // Tandai mana yang sudah ada PIC
  pics.forEach(pic => {
    const prov = pic.province || 'Tidak Diketahui';
    if (!provinceMap[prov]) return;
    if (pic.role === 'PIC_PROVINSI') {
      provinceMap[prov].hasPicProvinsi = true;
    } else if (pic.role === 'PIC_KABKOTA') {
      const kk = pic.regencyCity || 'Tidak Diketahui';
      if (provinceMap[prov].kabkotas[kk]) {
        provinceMap[prov].kabkotas[kk].hasPicKabkota = true;
      }
    }
  });

  // Tandai jadwal diskusi
  discussions.forEach(d => {
    const prov = d.province;
    const kk = d.regencyCity;
    if (provinceMap[prov]?.kabkotas[kk]) {
      provinceMap[prov].kabkotas[kk].discussionDate = d.date;
    }
  });

  // Build output array
  const result = Object.entries(provinceMap)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([province, data]) => ({
      province,
      hasPicProvinsi: data.hasPicProvinsi,
      totalPeserta: data.totalPeserta,
      selesai: data.selesai,
      avgPre: data.avgPre,
      avgPost: data.avgPost,
      kabkotas: Object.entries(data.kabkotas)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([kk, kkData]) => ({
          regencyCity: kk,
          ...kkData,
        })),
    }));

  // Summary total
  const totalProvinsi = result.length;
  const totalKabkota = result.reduce((acc, p) => acc + p.kabkotas.length, 0);
  const totalPeserta = participants.length;
  const totalSelesai = participants.filter(p => p.certificate).length;
  const totalPicProvinsi = pics.filter(p => p.role === 'PIC_PROVINSI').length;
  const totalPicKabkota = pics.filter(p => p.role === 'PIC_KABKOTA').length;

  return NextResponse.json({
    summary: { totalProvinsi, totalKabkota, totalPeserta, totalSelesai, totalPicProvinsi, totalPicKabkota },
    provinces: result,
  });
}
