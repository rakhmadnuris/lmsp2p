import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/auth';
import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

const MONTH_NAMES = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

function formatDateIndonesian(dateStr: string): string {
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return dateStr;
    const day = date.getDate();
    const month = MONTH_NAMES[date.getMonth()];
    const year = date.getFullYear();
    return `${day} ${month} ${year}`;
  } catch {
    return dateStr;
  }
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export async function GET() {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Tidak diizinkan' }, { status: 401 });

    const cert = await prisma.certificate.findUnique({
      where: { userId: session.userId },
      include: { user: true }
    });

    if (!cert) {
      return NextResponse.json({ error: 'Sertifikat tidak ditemukan. Selesaikan Tahap 7 terlebih dahulu.' }, { status: 404 });
    }

    const formattedDate = formatDateIndonesian(cert.implementationDate);
    const regencyCity = cert.regencyCity || cert.user.regencyCity || '';

    const PNG_W = 2000;
    const PNG_H = 1414;

    const NAMA_Y  = 629;
    const JAB_Y   = 794;
    const LOC_Y   = 1047;

    const NAMA_FONT = 84;
    const JAB_FONT  = 84;
    const LOC_FONT  = 33;

    const CENTER_X      = 1000;
    const NAMA_CENTER_X = 1052;

    const nameText     = escapeXml(cert.fullName);
    const roleText     = 'PESERTA';
    const locationText = escapeXml(`${regencyCity}, ${formattedDate}`);

    const svgOverlay = `<svg width="${PNG_W}" height="${PNG_H}" xmlns="http://www.w3.org/2000/svg">
  <!-- Nama Lengkap -->
  <text
    x="${NAMA_CENTER_X}" y="${NAMA_Y}"
    font-size="${NAMA_FONT}"
    fill="#FFC000"
    text-anchor="middle"
    font-weight="bold"
    font-family="Arial, Helvetica, sans-serif"
  >${nameText}</text>

  <!-- Jabatan: PESERTA -->
  <text
    x="${CENTER_X}" y="${JAB_Y}"
    font-size="${JAB_FONT}"
    fill="#FFC000"
    text-anchor="middle"
    font-weight="bold"
    font-family="Arial, Helvetica, sans-serif"
  >${roleText}</text>

  <!-- Lokasi & Tanggal -->
  <text
    x="${CENTER_X}" y="${LOC_Y}"
    font-size="${LOC_FONT}"
    fill="#1a1a1a"
    text-anchor="middle"
    font-weight="bold"
    font-family="Arial, Helvetica, sans-serif"
  >${locationText}</text>
</svg>`;

    const bgPath = path.join(process.cwd(), 'public', 'cert_bg.png');

    if (!fs.existsSync(bgPath)) {
      return NextResponse.json({ error: 'Template sertifikat tidak ditemukan.' }, { status: 500 });
    }

    const svgBuf = Buffer.from(svgOverlay);

    const jpgBuffer = await sharp(bgPath)
      .composite([{ input: svgBuf, top: 0, left: 0 }])
      .jpeg({ quality: 95 })
      .toBuffer();

    // Nama file sesuai nama peserta
    const safeName = cert.fullName
      .replace(/[^a-zA-Z0-9 \u00C0-\u024F]/g, '')
      .trim()
      .replace(/\s+/g, '_');
    const filename = `Sertifikat_P2P_${safeName}.jpg`;

    return new NextResponse(jpgBuffer as unknown as BodyInit, {
      headers: {
        'Content-Type': 'image/jpeg',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error('Certificate error:', error);
    return NextResponse.json({ error: 'Gagal membuat sertifikat' }, { status: 500 });
  }
}
