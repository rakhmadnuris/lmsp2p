import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { decrypt } from '@/lib/auth';

export async function GET(request: Request) {
  const cookieStore = await cookies();
  const session = cookieStore.get('session')?.value;

  let role = '';
  if (session) {
    try {
      const payload = await decrypt(session);
      role = payload.role as string;
    } catch {}
  }

  cookieStore.delete('session');

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000');

  // Admin → halaman login admin
  // PIC → beranda lmsp2p (/)
  // Peserta → halaman login peserta
  let redirectUrl: string;
  if (role === 'ADMIN') {
    redirectUrl = `${baseUrl}/admin/login`;
  } else if (role === 'PIC_PROVINSI' || role === 'PIC_KABKOTA') {
    redirectUrl = `${baseUrl}/`;
  } else {
    redirectUrl = `${baseUrl}/login`;
  }

  return NextResponse.redirect(new URL(redirectUrl));
}
