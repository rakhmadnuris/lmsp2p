import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { decrypt } from '@/lib/auth';
import { cookies } from 'next/headers';
import ExcelJS from 'exceljs';

export async function GET(request: Request) {
  const session = (await cookies()).get('session')?.value;
  if (!session) return NextResponse.redirect(new URL('/login', request.url));

  try {
    const payload = await decrypt(session);
    if (payload.role !== 'PIC_PROVINSI' && payload.role !== 'PIC_KABKOTA') {
      return new Response('Forbidden', { status: 403 });
    }

    const { province, regencyCity, role } = await prisma.user.findUniqueOrThrow({ where: { id: payload.userId } });

    const { searchParams } = new URL(request.url);
    const targetRegency = searchParams.get('regencyCity');

    let whereClause: any = { province, role: 'PARTICIPANT' };
    
    if (role === 'PIC_KABKOTA') {
      whereClause.regencyCity = regencyCity;
    } else if (targetRegency) {
      whereClause.regencyCity = targetRegency;
    }

    const users = await prisma.user.findMany({
      where: whereClause,
      include: { progress: true, certificate: true },
      orderBy: { username: 'asc' }
    });

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Rekapitulasi');

    worksheet.columns = [
      { header: 'No', key: 'no', width: 5 },
      { header: 'Username', key: 'username', width: 20 },
      { header: 'Kabupaten/Kota', key: 'regencyCity', width: 20 },
      { header: 'Tahap Saat Ini', key: 'currentStage', width: 15 },
      { header: 'Catatan Tahap 1', key: 'stage1', width: 30 },
      { header: 'Refleksi Tahap 2', key: 'stage2', width: 30 },
      { header: 'Nilai Pre-Test', key: 'stage3', width: 15 },
      { header: 'Diskusi Tahap 4', key: 'stage4', width: 15 },
      { header: 'RTL Tahap 5', key: 'stage5', width: 30 },
      { header: 'Nilai Post-Test', key: 'stage6', width: 15 },
      { header: 'Sertifikat', key: 'certificate', width: 15 }
    ];

    users.forEach((user, index) => {
      worksheet.addRow({
        no: index + 1,
        username: user.username,
        regencyCity: user.regencyCity || '-',
        currentStage: user.currentStage,
        stage1: user.progress?.stage1Notes || '-',
        stage2: user.progress?.stage2Notes || '-',
        stage3: user.progress?.stage3Score !== null ? user.progress?.stage3Score : '-',
        stage4: user.progress?.stage4Done ? 'Selesai' : 'Belum',
        stage5: user.progress?.stage5Plan || '-',
        stage6: user.progress?.stage6Score !== null ? user.progress?.stage6Score : '-',
        certificate: user.certificate ? 'Selesai' : 'Belum'
      });
    });

    const buffer = await workbook.xlsx.writeBuffer();

    const fileName = role === 'PIC_PROVINSI' && !targetRegency 
      ? `Rekapitulasi_Provinsi_${province}.xlsx` 
      : `Rekapitulasi_${targetRegency || regencyCity}.xlsx`;

    return new Response(buffer, {
      headers: {
        'Content-Disposition': `attachment; filename="${fileName}"`,
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      },
    });

  } catch (error) {
    return new Response('Failed to generate report', { status: 500 });
  }
}
