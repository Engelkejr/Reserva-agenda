import { NextResponse } from 'next/server';

import { cookies } from 'next/headers';

export async function POST(request) {
  try {
    const { password } = await request.json();
    const envPassword = process.env.ADMIN_PASSWORD || 'admin123';
    const correctPassword = envPassword?.trim();
    const inputPassword = password?.trim();
    
    if (correctPassword && inputPassword === correctPassword) {
      const cookieStore = await cookies();
      cookieStore.set('adminAuth', 'authenticated', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        path: '/',
        maxAge: 60 * 60 * 24 * 7 // 7 days
      });
      return NextResponse.json({ success: true });
    }
    
    return NextResponse.json({ success: false }, { status: 401 });
  } catch (error) {
    return NextResponse.json({ error: error.message || 'Erro de servidor', stack: error.stack }, { status: 500 });
  }
}
