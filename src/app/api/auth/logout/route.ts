import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const redirectUrl = searchParams.get('redirect') || '/';
  
  (await cookies()).delete('session');
  return NextResponse.redirect(new URL(redirectUrl, process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'));
}
