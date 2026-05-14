import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/auth';
import ExcelJS from 'exceljs';

const MATERI = [
  'Materi 1: Teknis Pencegahan Pelanggaran',
  'Materi 2: Teknis Pelaporan Dugaan Pelanggaran',
  'Materi 3: Teknis Penyelesaian Sengketa Proses',
  'Materi 4: Teknis Pengembangan Gerakan Pengawasan Partisipatif',
  'Materi 5: Teknis Penguatan Jaringan dan Pemberdayaan Komunitas',
  'Materi 6: Teknis Pengawasan Berbasis Digital',
];

export async function GET(request: Request) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Tidak diizinkan' }, { status: 401 });

    const admin = await prisma.user.findUnique({ where: { id: session.userId } });
    if (!admin || admin.role !== 'ADMIN') return NextResponse.json({ error: 'Akses ditolak' }, { status: 403 });

    const { searchParams } = new URL(request.url);
    const filterProvince = searchParams.get('province') || '';
    const filterCity = searchParams.get('city') || '';

    const where: any = { role: 'PARTICIPANT' };
    if (filterProvince) where.province = filterProvince;
    if (filterCity) where.regencyCity = filterCity;

    const peserta = await prisma.user.findMany({
      where,
      select: {
        username: true,
        province: true,
        regencyCity: true,
        gender: true,
        currentStage: true,
        progress: true,
        certificate: true
      },
      orderBy: { username: 'asc' }
    });

    const workbook = new ExcelJS.Workbook();

    // ── Sheet 1: Ringkasan ──
    const sheetRingkasan = workbook.addWorksheet('Ringkasan');
    sheetRingkasan.columns = [
      { header: 'Nama Pengguna', key: 'username', width: 22 },
      { header: 'Jenis Kelamin', key: 'gender', width: 15 },
      { header: 'Provinsi', key: 'province', width: 25 },
      { header: 'Kabupaten/Kota', key: 'regencyCity', width: 25 },
      { header: 'Tahap Saat Ini', key: 'currentStage', width: 15 },
      { header: 'Nilai Pre-Test', key: 'stage3Score', width: 15 },
      { header: 'Nilai Post-Test', key: 'stage6Score', width: 15 },
    ];
    styleHeader(sheetRingkasan);
    peserta.forEach((p: any) => {
      sheetRingkasan.addRow({
        username: p.username,
        gender: p.gender === 'male' ? 'Laki-laki' : p.gender === 'female' ? 'Perempuan' : (p.gender || '-'),
        province: p.province || '-',
        regencyCity: p.regencyCity || '-',
        currentStage: `Tahap ${p.currentStage}`,
        stage3Score: p.progress?.stage3Score ?? '-',
        stage6Score: p.progress?.stage6Score ?? '-',
      });
    });

    // ── Sheet 2: Catatan Tahap 1 ──
    const sheetTahap1 = workbook.addWorksheet('Catatan Tahap 1');
    sheetTahap1.columns = [
      { header: 'Nama Pengguna', key: 'username', width: 22 },
      { header: 'Provinsi', key: 'province', width: 22 },
      { header: 'Kabupaten/Kota', key: 'regencyCity', width: 22 },
      ...MATERI.map((m, i) => ({ header: m, key: `mat${i}`, width: 45 }))
    ];
    styleHeader(sheetTahap1);
    peserta.forEach((p: any) => {
      let catatanArr = Array(6).fill('');
      if (p.progress?.stage1Notes) {
        try {
          const parsed = JSON.parse(p.progress.stage1Notes);
          if (Array.isArray(parsed)) catatanArr = parsed;
        } catch {}
      }
      const row: any = { username: p.username, province: p.province || '-', regencyCity: p.regencyCity || '-' };
      catatanArr.forEach((n: string, i: number) => { row[`mat${i}`] = n || '-'; });
      sheetTahap1.addRow(row);
    });

    // ── Sheet 3: Catatan Tahap 2 ──
    const sheetTahap2 = workbook.addWorksheet('Catatan Tahap 2');
    sheetTahap2.columns = [
      { header: 'Nama Pengguna', key: 'username', width: 22 },
      { header: 'Provinsi', key: 'province', width: 22 },
      { header: 'Kabupaten/Kota', key: 'regencyCity', width: 22 },
      { header: 'Catatan E-Modul', key: 'notes', width: 60 },
    ];
    styleHeader(sheetTahap2);
    peserta.forEach((p: any) => {
      sheetTahap2.addRow({
        username: p.username,
        province: p.province || '-',
        regencyCity: p.regencyCity || '-',
        notes: p.progress?.stage2Notes || '-',
      });
    });

    // ── Sheet 4: Nilai Pre-Test (Tahap 3) ──
    const sheetPreTest = workbook.addWorksheet('Nilai Pre-Test');
    sheetPreTest.columns = [
      { header: 'Nama Pengguna', key: 'username', width: 22 },
      { header: 'Provinsi', key: 'province', width: 22 },
      { header: 'Kabupaten/Kota', key: 'regencyCity', width: 22 },
      { header: 'Nilai Pre-Test', key: 'score', width: 15 },
    ];
    styleHeader(sheetPreTest);
    peserta.forEach((p: any) => {
      sheetPreTest.addRow({
        username: p.username,
        province: p.province || '-',
        regencyCity: p.regencyCity || '-',
        score: p.progress?.stage3Score ?? '-',
      });
    });

    // ── Sheet 5: Rencana Tindak Lanjut (Tahap 5) ──
    const sheetRTL = workbook.addWorksheet('Rencana Tindak Lanjut');
    sheetRTL.columns = [
      { header: 'Nama Pengguna', key: 'username', width: 22 },
      { header: 'Provinsi', key: 'province', width: 22 },
      { header: 'Kabupaten/Kota', key: 'regencyCity', width: 22 },
      { header: 'Nama Program', key: 'programName', width: 35 },
      { header: 'Tanggal & Waktu', key: 'timeAndDate', width: 25 },
      { header: 'Metode Program', key: 'programMethod', width: 30 },
      { header: 'Langkah-Langkah', key: 'step', width: 55 },
    ];
    styleHeader(sheetRTL);
    peserta.forEach((p: any) => {
      let rencana: any = {};
      if (p.progress?.stage5Plan) {
        try { rencana = JSON.parse(p.progress.stage5Plan); } catch {}
      }
      sheetRTL.addRow({
        username: p.username,
        province: p.province || '-',
        regencyCity: p.regencyCity || '-',
        programName: rencana.programName || '-',
        timeAndDate: rencana.timeAndDate || '-',
        programMethod: rencana.programMethod || '-',
        step: rencana.step || '-',
      });
    });

    // ── Sheet 6: Nilai Post-Test (Tahap 6) ──
    const sheetPostTest = workbook.addWorksheet('Nilai Post-Test');
    sheetPostTest.columns = [
      { header: 'Nama Pengguna', key: 'username', width: 22 },
      { header: 'Provinsi', key: 'province', width: 22 },
      { header: 'Kabupaten/Kota', key: 'regencyCity', width: 22 },
      { header: 'Nilai Post-Test', key: 'score', width: 15 },
    ];
    styleHeader(sheetPostTest);
    peserta.forEach((p: any) => {
      sheetPostTest.addRow({
        username: p.username,
        province: p.province || '-',
        regencyCity: p.regencyCity || '-',
        score: p.progress?.stage6Score ?? '-',
      });
    });

    // ── Sheet 7: Data Sertifikat (Tahap 7) ──
    const sheetSertifikat = workbook.addWorksheet('Data Sertifikat');
    sheetSertifikat.columns = [
      { header: 'Nama Pengguna', key: 'username', width: 22 },
      { header: 'Provinsi', key: 'province', width: 22 },
      { header: 'Kabupaten/Kota', key: 'regencyCity', width: 22 },
      { header: 'Nama Lengkap', key: 'fullName', width: 35 },
      { header: 'Tanggal Implementasi', key: 'implDate', width: 25 },
      { header: 'Kota Sertifikat', key: 'certCity', width: 22 },
    ];
    styleHeader(sheetSertifikat);
    peserta.forEach((p: any) => {
      sheetSertifikat.addRow({
        username: p.username,
        province: p.province || '-',
        regencyCity: p.regencyCity || '-',
        fullName: p.certificate?.fullName || '-',
        implDate: p.certificate?.implementationDate || '-',
        certCity: p.certificate?.regencyCity || '-',
      });
    });

    const buffer = await workbook.xlsx.writeBuffer();
    const tanggal = new Date().toISOString().slice(0, 10);

    return new NextResponse(buffer as any, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="Rekap_P2P_${tanggal}.xlsx"`,
      },
    });
  } catch (error) {
    console.error('Export error:', error);
    return NextResponse.json({ error: 'Ekspor gagal' }, { status: 500 });
  }
}

function styleHeader(sheet: ExcelJS.Worksheet) {
  const headerRow = sheet.getRow(1);
  headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
  headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4F46E5' } };
  headerRow.alignment = { vertical: 'middle', horizontal: 'center' };
  headerRow.height = 25;
}
