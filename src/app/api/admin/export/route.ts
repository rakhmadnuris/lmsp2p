import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/auth';
import ExcelJS from 'exceljs';

const MATERIALS = [
  'Material 1: Teknis Pencegahan Pelanggaran',
  'Material 2: Teknis Pelaporan Dugaan Pelanggaran',
  'Material 3: Teknis Penyelesaian Sengketa Proses',
  'Material 4: Teknis Pengembangan Gerakan Pengawasan Partisipatif',
  'Material 5: Teknis Penguatan Jaringan dan Pemberdayaan Komunitas',
  'Material 6: Teknis Pengawasan Berbasis Digital',
];

export async function GET(request: Request) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const admin = await prisma.user.findUnique({ where: { id: session.userId } });
    if (!admin || admin.role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const { searchParams } = new URL(request.url);
    const filterProvince = searchParams.get('province') || '';
    const filterCity = searchParams.get('city') || '';

    const where: any = { role: 'PARTICIPANT' };
    if (filterProvince) where.province = filterProvince;
    if (filterCity) where.regencyCity = filterCity;

    const participants = await prisma.user.findMany({
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

    // --- Sheet 1: Summary ---
    const summarySheet = workbook.addWorksheet('Summary');
    summarySheet.columns = [
      { header: 'Username', key: 'username', width: 20 },
      { header: 'Gender', key: 'gender', width: 10 },
      { header: 'Province', key: 'province', width: 25 },
      { header: 'Regency/City', key: 'regencyCity', width: 25 },
      { header: 'Current Stage', key: 'currentStage', width: 15 },
      { header: 'Pre-Test Score', key: 'stage3Score', width: 15 },
      { header: 'Post-Test Score', key: 'stage6Score', width: 15 },
    ];
    styleHeader(summarySheet);
    participants.forEach((p: any) => {
      summarySheet.addRow({
        username: p.username,
        gender: p.gender || '-',
        province: p.province || '-',
        regencyCity: p.regencyCity || '-',
        currentStage: p.currentStage,
        stage3Score: p.progress?.stage3Score ?? '-',
        stage6Score: p.progress?.stage6Score ?? '-',
      });
    });

    // --- Sheet 2: Stage 1 Notes (separate columns per material) ---
    const s1Sheet = workbook.addWorksheet('Stage 1 Notes');
    s1Sheet.columns = [
      { header: 'Username', key: 'username', width: 20 },
      { header: 'Province', key: 'province', width: 22 },
      { header: 'Regency/City', key: 'regencyCity', width: 22 },
      ...MATERIALS.map((m, i) => ({ header: m, key: `mat${i}`, width: 40 }))
    ];
    styleHeader(s1Sheet);
    participants.forEach((p: any) => {
      let notesArr = Array(6).fill('');
      if (p.progress?.stage1Notes) {
        try {
          const parsed = JSON.parse(p.progress.stage1Notes);
          if (Array.isArray(parsed)) notesArr = parsed;
        } catch {}
      }
      const row: any = { username: p.username, province: p.province || '-', regencyCity: p.regencyCity || '-' };
      notesArr.forEach((n: string, i: number) => { row[`mat${i}`] = n || '-'; });
      s1Sheet.addRow(row);
    });

    // --- Sheet 3: Stage 2 Notes ---
    const s2Sheet = workbook.addWorksheet('Stage 2 Notes');
    s2Sheet.columns = [
      { header: 'Username', key: 'username', width: 20 },
      { header: 'Province', key: 'province', width: 22 },
      { header: 'Regency/City', key: 'regencyCity', width: 22 },
      { header: 'Stage 2 Notes', key: 'notes', width: 60 },
    ];
    styleHeader(s2Sheet);
    participants.forEach((p: any) => {
      s2Sheet.addRow({
        username: p.username,
        province: p.province || '-',
        regencyCity: p.regencyCity || '-',
        notes: p.progress?.stage2Notes || '-',
      });
    });

    // --- Sheet 4: Stage 3 Scores ---
    const s3Sheet = workbook.addWorksheet('Stage 3 Pre-Test');
    s3Sheet.columns = [
      { header: 'Username', key: 'username', width: 20 },
      { header: 'Province', key: 'province', width: 22 },
      { header: 'Regency/City', key: 'regencyCity', width: 22 },
      { header: 'Pre-Test Score', key: 'score', width: 15 },
    ];
    styleHeader(s3Sheet);
    participants.forEach((p: any) => {
      s3Sheet.addRow({
        username: p.username,
        province: p.province || '-',
        regencyCity: p.regencyCity || '-',
        score: p.progress?.stage3Score ?? '-',
      });
    });

    // --- Sheet 5: Stage 5 Follow-Up (separate columns) ---
    const s5Sheet = workbook.addWorksheet('Stage 5 Follow-Up');
    s5Sheet.columns = [
      { header: 'Username', key: 'username', width: 20 },
      { header: 'Province', key: 'province', width: 22 },
      { header: 'Regency/City', key: 'regencyCity', width: 22 },
      { header: 'Program Name', key: 'programName', width: 35 },
      { header: 'Time & Date', key: 'timeAndDate', width: 25 },
      { header: 'Program Method', key: 'programMethod', width: 30 },
      { header: 'Step', key: 'step', width: 50 },
    ];
    styleHeader(s5Sheet);
    participants.forEach((p: any) => {
      let plan: any = {};
      if (p.progress?.stage5Plan) {
        try { plan = JSON.parse(p.progress.stage5Plan); } catch {}
      }
      s5Sheet.addRow({
        username: p.username,
        province: p.province || '-',
        regencyCity: p.regencyCity || '-',
        programName: plan.programName || '-',
        timeAndDate: plan.timeAndDate || '-',
        programMethod: plan.programMethod || '-',
        step: plan.step || '-',
      });
    });

    // --- Sheet 6: Stage 6 Scores ---
    const s6Sheet = workbook.addWorksheet('Stage 6 Post-Test');
    s6Sheet.columns = [
      { header: 'Username', key: 'username', width: 20 },
      { header: 'Province', key: 'province', width: 22 },
      { header: 'Regency/City', key: 'regencyCity', width: 22 },
      { header: 'Post-Test Score', key: 'score', width: 15 },
    ];
    styleHeader(s6Sheet);
    participants.forEach((p: any) => {
      s6Sheet.addRow({
        username: p.username,
        province: p.province || '-',
        regencyCity: p.regencyCity || '-',
        score: p.progress?.stage6Score ?? '-',
      });
    });

    // --- Sheet 7: Stage 7 Certificate ---
    const s7Sheet = workbook.addWorksheet('Stage 7 Certificate');
    s7Sheet.columns = [
      { header: 'Username', key: 'username', width: 20 },
      { header: 'Province', key: 'province', width: 22 },
      { header: 'Regency/City', key: 'regencyCity', width: 22 },
      { header: 'Full Name', key: 'fullName', width: 30 },
      { header: 'Implementation Date', key: 'implDate', width: 25 },
      { header: 'Certificate City', key: 'certCity', width: 22 },
    ];
    styleHeader(s7Sheet);
    participants.forEach((p: any) => {
      s7Sheet.addRow({
        username: p.username,
        province: p.province || '-',
        regencyCity: p.regencyCity || '-',
        fullName: p.certificate?.fullName || '-',
        implDate: p.certificate?.implementationDate || '-',
        certCity: p.certificate?.regencyCity || '-',
      });
    });

    const buffer = await workbook.xlsx.writeBuffer();

    return new NextResponse(buffer as any, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="PSE_Recap_${new Date().toISOString().slice(0, 10)}.xlsx"`,
      },
    });
  } catch (error) {
    console.error('Export error:', error);
    return NextResponse.json({ error: 'Export failed' }, { status: 500 });
  }
}

function styleHeader(sheet: ExcelJS.Worksheet) {
  const headerRow = sheet.getRow(1);
  headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
  headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4F46E5' } };
  headerRow.alignment = { vertical: 'middle', horizontal: 'center' };
  headerRow.height = 25;
}
