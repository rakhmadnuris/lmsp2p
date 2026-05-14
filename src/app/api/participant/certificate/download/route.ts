import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/auth';
import fs from 'fs';
import path from 'path';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';

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

    const nameText = cert.fullName;
    const roleText = 'PESERTA';
    const locationText = `${regencyCity}, ${formattedDate}`;

    const bgPath = path.join(process.cwd(), 'public', 'cert_bg.png');
    if (!fs.existsSync(bgPath)) {
      return NextResponse.json({ error: 'Template sertifikat (cert_bg.png) tidak ditemukan di folder public.' }, { status: 500 });
    }

    const bgImageBytes = fs.readFileSync(bgPath);

    // Create PDF
    const pdfDoc = await PDFDocument.create();
    const image = await pdfDoc.embedPng(bgImageBytes);
    
    // Create page with same dimensions as image
    const { width, height } = image.scale(1);
    const page = pdfDoc.addPage([width, height]);
    page.drawImage(image, { x: 0, y: 0, width, height });

    // Embed font
    const font = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    const NAMA_FONT = 84;
    const JAB_FONT = 84;
    const LOC_FONT = 33;

    // PDF coordinates are from BOTTOM-LEFT
    // Original SVG Y coords were from TOP-LEFT. 
    // Y_pdf = height - Y_svg
    const NAMA_Y_PDF = height - 629;
    const JAB_Y_PDF = height - 794;
    const LOC_Y_PDF = height - 1047;

    // Calculate text widths for centering
    const nameWidth = font.widthOfTextAtSize(nameText, NAMA_FONT);
    const roleWidth = font.widthOfTextAtSize(roleText, JAB_FONT);
    const locWidth = font.widthOfTextAtSize(locationText, LOC_FONT);

    // Color: #FFC000 = rgb(255/255, 192/255, 0)
    const goldColor = rgb(1, 192/255, 0);
    const blackColor = rgb(26/255, 26/255, 26/255);

    page.drawText(nameText, {
      x: 1052 - (nameWidth / 2),
      y: NAMA_Y_PDF,
      size: NAMA_FONT,
      font: font,
      color: goldColor,
    });

    page.drawText(roleText, {
      x: 1000 - (roleWidth / 2),
      y: JAB_Y_PDF,
      size: JAB_FONT,
      font: font,
      color: goldColor,
    });

    page.drawText(locationText, {
      x: 1000 - (locWidth / 2),
      y: LOC_Y_PDF,
      size: LOC_FONT,
      font: font,
      color: blackColor,
    });

    const pdfBytes = await pdfDoc.save();

    const safeName = cert.fullName.replace(/[^a-zA-Z0-9 ]/g, '').trim().replace(/\s+/g, '_');
    const filename = `Sertifikat_P2P_${safeName}.pdf`;

    return new NextResponse(pdfBytes as unknown as BodyInit, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error('Certificate error:', error);
    return NextResponse.json({ error: 'Gagal membuat sertifikat' }, { status: 500 });
  }
}
