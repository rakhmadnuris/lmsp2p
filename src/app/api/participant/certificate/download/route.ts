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

// Escape XML special characters for SVG text
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
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const cert = await prisma.certificate.findUnique({
      where: { userId: session.userId },
      include: { user: true }
    });

    if (!cert) {
      return NextResponse.json({ error: 'Certificate not found. Please complete Stage 7 first.' }, { status: 404 });
    }

    const formattedDate = formatDateIndonesian(cert.implementationDate);
    const regencyCity = cert.regencyCity || cert.user.regencyCity || '';

    // ── Canvas dimensions (extracted PNG from DOCX template) ─────────────────
    const PNG_W = 2000;
    const PNG_H = 1414;

    // ── Calculated positions from DOCX XML (EMU → pixels at 241 DPI) ─────────
    // Page: 11909 x 8395 twips landscape; PNG: 2000 x 1414 px; DPI: ~241
    // Font: 50 half-pts = 25pt → 84px; 20 half-pts = 10pt → 33px
    //
    // NAMA PESERTA: box V offset 1003935 EMU ≈ 266px from paragraph (margin top=243px)
    //   → Y = 243 + 266 + 55 (box center) + 65 (visual adjustment) = 629
    // JABATAN: box V offset 1758315 EMU ≈ 466px from paragraph
    //   → Y = 243 + 466 + 55 + 30 = 794
    // REGENCY/DATE: box V offset 2797810 EMU ≈ 742px from paragraph
    //   → Y = 243 + 742 + 62 = 1047

    const NAMA_Y  = 629;  // name sits just above the underline
    const JAB_Y   = 794;  // PESERTA sits below "SEBAGAI :"
    const LOC_Y   = 1047; // location/date at bottom

    const NAMA_FONT = 84;  // 25pt at 241 DPI
    const JAB_FONT  = 84;  // 25pt at 241 DPI
    const LOC_FONT  = 33;  // 10pt at 241 DPI

    const CENTER_X     = 1000; // horizontal center of the page
    const NAMA_CENTER_X = 1052; // slight offset from DOCX H anchor (-354330 EMU)

    const nameText     = escapeXml(cert.fullName);
    const roleText     = 'PESERTA';
    const locationText = escapeXml(`${regencyCity}, ${formattedDate}`);

    // ── Build SVG text overlay ────────────────────────────────────────────────
    const svgOverlay = `<svg width="${PNG_W}" height="${PNG_H}" xmlns="http://www.w3.org/2000/svg">
  <!-- Full Name: gold bold, centered on name line -->
  <text
    x="${NAMA_CENTER_X}" y="${NAMA_Y}"
    font-size="${NAMA_FONT}"
    fill="#FFC000"
    text-anchor="middle"
    font-weight="bold"
    font-family="Arial, Helvetica, sans-serif"
  >${nameText}</text>

  <!-- Role: PESERTA, gold bold, centered -->
  <text
    x="${CENTER_X}" y="${JAB_Y}"
    font-size="${JAB_FONT}"
    fill="#FFC000"
    text-anchor="middle"
    font-weight="bold"
    font-family="Arial, Helvetica, sans-serif"
  >${roleText}</text>

  <!-- Location & Date: dark, normal weight, centered -->
  <text
    x="${CENTER_X}" y="${LOC_Y}"
    font-size="${LOC_FONT}"
    fill="#1a1a1a"
    text-anchor="middle"
    font-weight="bold"
    font-family="Arial, Helvetica, sans-serif"
  >${locationText}</text>
</svg>`;

    // ── Composite text onto background PNG and output as JPEG ─────────────────
    const bgPath = path.join(process.cwd(), 'public', 'cert_bg.png');
    const svgBuf = Buffer.from(svgOverlay);

    const jpgBuffer = await sharp(bgPath)
      .composite([{ input: svgBuf, top: 0, left: 0 }])
      .jpeg({ quality: 95, mozjpeg: false })
      .toBuffer();

    const safeName = cert.fullName.replace(/[^a-zA-Z0-9 ]/g, '').replace(/\s+/g, '_');
    const filename = `Sertifikat_${safeName}.jpg`;

    return new NextResponse(jpgBuffer as unknown as BodyInit, {
      headers: {
        'Content-Type': 'image/jpeg',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error('Certificate JPG error:', error);
    return NextResponse.json({ error: 'Failed to generate certificate' }, { status: 500 });
  }
}
