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

    // Font sizes
    const NAMA_FONT = 60;
    const JAB_FONT = 48;
    const LOC_FONT = 24;

    // PDF coordinates from BOTTOM-LEFT
    // Assuming cert_bg.png is 2000x1414
    // Positioning based on visual template layout
    
    // Nama: center-top area (adjust Y based on your template)
    const nameY = height - 650;
    const nameWidth = font.widthOfTextAtSize(nameText, NAMA_FONT);
    const nameX = (width - nameWidth) / 2;

    // Jabatan: below name
    const roleY = height - 780;
    const roleWidth = font.widthOfTextAtSize(roleText, JAB_FONT);
    const roleX = (width - roleWidth) / 2;

    // Lokasi & Tanggal: bottom area
    const locY = height - 1100;
    const locWidth = font.widthOfTextAtSize(locationText, LOC_FONT);
    const locX = (width - locWidth) / 2;

    // Color: #FFC000 = rgb(255, 192, 0)
    const goldColor = rgb(1, 0.75, 0);
    const darkColor = rgb(0.1, 0.1, 0.1);

    // Draw name
    page.drawText(nameText, {
      x: nameX,
      y: nameY,
      size: NAMA_FONT,
      font: font,
      color: goldColor,
    });

    // Draw role
    page.drawText(roleText, {
      x: roleX,
      y: roleY,
      size: JAB_FONT,
      font: font,
      color: goldColor,
    });

    // Draw location
    page.drawText(locationText, {
      x: locX,
      y: locY,
      size: LOC_FONT,
      font: font,
      color: darkColor,
    });

    const pdfBytes = await pdfDoc.save();

    const safeName = cert.fullName
      .replace(/[^a-zA-Z0-9 \u00C0-\u024F]/g, '')
      .trim()
      .replace(/\s+/g, '_');
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
