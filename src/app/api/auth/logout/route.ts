import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function GET(request: Request) {
  const cookieStore = await cookies();
  
  // Cek role dari referer untuk redirect yang tepat
  const referer = request.headers.get('referer') || '';
  const isAdmin = referer.includes('/admin');
  
  cookieStore.delete('session');
  
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000');
  
  // Admin → halaman login admin, peserta → halaman login peserta
  const redirectUrl = isAdmin ? `${baseUrl}/admin/login` : `${baseUrl}/login`;
  
  return NextResponse.redirect(new URL(redirectUrl));
}
