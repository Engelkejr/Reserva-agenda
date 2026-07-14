import { NextResponse } from 'next/server';
import { supabase } from '@/lib/db';

export async function GET(request, { params }) {
  const hostUrl = request.nextUrl.origin;

  try {
    const { token } = await params;
    
    const { data: booking, error: fetchError } = await supabase
      .from('bookings')
      .select('id')
      .eq('token', token)
      .single();

    if (fetchError || !booking) {
      return NextResponse.redirect(new URL('/cancelar?status=invalid', hostUrl));
    }

    await supabase.from('bookings').delete().eq('token', token);

    return NextResponse.redirect(new URL('/cancelar?status=ok', hostUrl));
  } catch (error) {
    console.error(error);
    return NextResponse.redirect(new URL('/cancelar?status=error', hostUrl));
  }
}
