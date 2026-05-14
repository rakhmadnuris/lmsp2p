import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function GET() {
  (await cookies()).delete('session');
  return NextResponse.redirect(new URL('/', process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'));
}
