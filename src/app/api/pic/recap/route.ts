import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { decrypt } from '@/lib/auth';
import { cookies } from 'next/headers';
import ExcelJS from 'exceljs';

function styleHeader(worksheet: ExcelJS.Worksheet) {
  const headerRow = worksheet.getRow(1);
  headerRow.eachCell((cell) => {
    cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E3A5F' } };
    cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
    cell.border = {
      top: { style: 'thin' }, left: { style: 'thin' },
      bottom: { style: 'thin' }, right: { style: 'thin' }
    };
  });
  headerRow.height = 28;
}

export async function GET(request: Request) {
  const session = (await cookies()).get('session')?.value;
  if (!session) return NextResponse.redirect(new URL('/login', request.url));

  try {
    const payload = await decrypt(session);
    if (payload.role !== 'PIC_PROVINSI' && payload.role !== 'PIC_KABKOTA') {
      return new Response('Forbidden', { status: 403 });
    }

    const picUser = await prisma.user.findUniqueOrThrow({ where: { id: payload.userId } });
    const { province, regencyCity, role } = picUser;

    const { searchParams } = new URL(request.url);
    const targetRegency = searchParams.get('regencyCity');

    // Build where clause berdasarkan role
    let whereClause: any = { province, role: 'PARTICIPANT' };

    if (role === 'PIC_KABKOTA') {
      // PIC KabKota hanya bisa unduh rekap kabupatennya sendiri
      whereClause.regencyCity = regencyCity;
    } else if (role === 'PIC_PROVINSI' && targetRegency) {
      // PIC Provinsi bisa filter per kab/kota, tapi HANYA dalam provinsinya
      whereClause.regencyCity = targetRegency;
    }
    // Jika PIC_PROVINSI tanpa filter, ambil semua kab/kota di provinsinya

    const users = await prisma.user.findMany({
      where: whereClause,
      include: { progress: true, certificate: true },
      orderBy: [{ regencyCity: 'asc' }, { username: 'asc' }]
    });

    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'LMSP2P System';
    workbook.created = new Date();

    // ── SHEET 1: Ringkasan ──
    const sheetRingkasan = workbook.addWorksheet('Ringkasan');
    sheetRingkasan.columns = [
      { header: 'No', key: 'no', width: 6 },
      { header: 'Username', key: 'username', width: 22 },
      { header: 'Kabupaten/Kota', key: 'regencyCity', width: 22 },
      { header: 'Tahap Saat Ini', key: 'currentStage', width: 15 },
      { header: 'Nilai Pre-Test', key: 'stage3', width: 15 },
      { header: 'Nilai Post-Test', key: 'stage6', width: 15 },
      { header: 'Sertifikat', key: 'certificate', width: 12 },
    ];
    styleHeader(sheetRingkasan);

    users.forEach((u, i) => {
      const row = sheetRingkasan.addRow({
        no: i + 1,
        username: u.username,
        regencyCity: u.regencyCity || '-',
        currentStage: `Tahap ${u.currentStage}`,
        stage3: u.progress?.stage3Score !== null && u.progress?.stage3Score !== undefined ? u.progress.stage3Score : '-',
        stage6: u.progress?.stage6Score !== null && u.progress?.stage6Score !== undefined ? u.progress.stage6Score : '-',
        certificate: u.certificate ? '✓ Selesai' : 'Belum',
      });
      row.getCell('certificate').font = { color: { argb: u.certificate ? 'FF00AA44' : 'FFAAAAAA' } };
    });

    // ── SHEET 2: Detail Progres & Jawaban ──
    const sheetDetail = workbook.addWorksheet('Detail Progres & Jawaban');
    sheetDetail.columns = [
      { header: 'No', key: 'no', width: 6 },
      { header: 'Username', key: 'username', width: 22 },
      { header: 'Kabupaten/Kota', key: 'regencyCity', width: 22 },
      { header: 'Tahap Saat Ini', key: 'currentStage', width: 15 },
      // Stage 1
      { header: 'Catatan Tahap 1', key: 'stage1Notes', width: 40 },
      { header: 'Tahap 1 Selesai', key: 'stage1Done', width: 14 },
      // Stage 2
      { header: 'Refleksi Tahap 2', key: 'stage2Notes', width: 40 },
      { header: 'Tahap 2 Selesai', key: 'stage2Done', width: 14 },
      // Stage 3
      { header: 'Nilai Pre-Test', key: 'stage3Score', width: 14 },
      { header: 'Pre-Test Selesai', key: 'stage3Done', width: 15 },
      // Stage 4
      { header: 'Diskusi Selesai', key: 'stage4Done', width: 14 },
      // Stage 5
      { header: 'RTL / Rencana Tindak Lanjut', key: 'stage5Plan', width: 50 },
      { header: 'Tahap 5 Selesai', key: 'stage5Done', width: 14 },
      // Stage 6
      { header: 'Nilai Post-Test', key: 'stage6Score', width: 15 },
      { header: 'Post-Test Selesai', key: 'stage6Done', width: 16 },
      // Certificate
      { header: 'Sertifikat', key: 'certificate', width: 12 },
    ];
    styleHeader(sheetDetail);

    users.forEach((u, i) => {
      sheetDetail.addRow({
        no: i + 1,
        username: u.username,
        regencyCity: u.regencyCity || '-',
        currentStage: `Tahap ${u.currentStage}`,
        stage1Notes: u.progress?.stage1Notes || '-',
        stage1Done: u.progress?.stage1Done ? 'Ya' : 'Belum',
        stage2Notes: u.progress?.stage2Notes || '-',
        stage2Done: u.progress?.stage2Done ? 'Ya' : 'Belum',
        stage3Score: u.progress?.stage3Score !== null && u.progress?.stage3Score !== undefined ? u.progress.stage3Score : '-',
        stage3Done: u.progress?.stage3Done ? 'Ya' : 'Belum',
        stage4Done: u.progress?.stage4Done ? 'Ya' : 'Belum',
        stage5Plan: u.progress?.stage5Plan || '-',
        stage5Done: u.progress?.stage5Done ? 'Ya' : 'Belum',
        stage6Score: u.progress?.stage6Score !== null && u.progress?.stage6Score !== undefined ? u.progress.stage6Score : '-',
        stage6Done: u.progress?.stage6Done ? 'Ya' : 'Belum',
        certificate: u.certificate ? 'Selesai' : 'Belum',
      });
    });

    // ── SHEET 3: Statistik per Kabupaten/Kota (hanya untuk PIC Provinsi) ──
    if (role === 'PIC_PROVINSI' && !targetRegency) {
      const sheetStats = workbook.addWorksheet('Statistik per Kab-Kota');
      sheetStats.columns = [
        { header: 'No', key: 'no', width: 6 },
        { header: 'Kabupaten/Kota', key: 'regencyCity', width: 25 },
        { header: 'Total Peserta', key: 'total', width: 14 },
        { header: 'Selesai (Sertifikat)', key: 'completed', width: 20 },
        { header: '% Selesai', key: 'pct', width: 12 },
        { header: 'Rata-rata Pre-Test', key: 'avgPre', width: 18 },
        { header: 'Rata-rata Post-Test', key: 'avgPost', width: 20 },
      ];
      styleHeader(sheetStats);

      // Group by regencyCity
      const grouped: Record<string, typeof users> = {};
      users.forEach(u => {
        const rc = u.regencyCity || 'Tidak Diketahui';
        if (!grouped[rc]) grouped[rc] = [];
        grouped[rc].push(u);
      });

      Object.entries(grouped).sort(([a], [b]) => a.localeCompare(b)).forEach(([rc, group], i) => {
        const total = group.length;
        const completed = group.filter(u => u.certificate).length;
        const preScores = group.filter(u => u.progress?.stage3Score !== null && u.progress?.stage3Score !== undefined).map(u => u.progress!.stage3Score!);
        const postScores = group.filter(u => u.progress?.stage6Score !== null && u.progress?.stage6Score !== undefined).map(u => u.progress!.stage6Score!);
        const avgPre = preScores.length > 0 ? (preScores.reduce((a, b) => a + b, 0) / preScores.length).toFixed(1) : '-';
        const avgPost = postScores.length > 0 ? (postScores.reduce((a, b) => a + b, 0) / postScores.length).toFixed(1) : '-';

        sheetStats.addRow({
          no: i + 1,
          regencyCity: rc,
          total,
          completed,
          pct: total > 0 ? `${((completed / total) * 100).toFixed(0)}%` : '0%',
          avgPre,
          avgPost,
        });
      });
    }

    const buffer = await workbook.xlsx.writeBuffer();

    let fileName: string;
    if (role === 'PIC_PROVINSI' && !targetRegency) {
      fileName = `Rekapitulasi_Provinsi_${province}.xlsx`;
    } else {
      const target = role === 'PIC_KABKOTA' ? regencyCity : targetRegency;
      fileName = `Rekapitulasi_${target}.xlsx`;
    }

    return new Response(buffer, {
      headers: {
        'Content-Disposition': `attachment; filename="${encodeURIComponent(fileName)}"`,
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      },
    });

  } catch (error) {
    console.error('Recap export error:', error);
    return new Response('Failed to generate report', { status: 500 });
  }
}
