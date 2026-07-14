import { NextResponse } from 'next/server';
import { supabase } from '@/lib/db';

export async function GET(request, { params }) {
  const hostUrl = request.nextUrl.origin;

  try {
    const { token } = await params;
    
    const { data: booking, error: fetchError } = await supabase
      .from('bookings')
      .select('id, isconfirmed')
      .eq('token', token)
      .single();

    if (fetchError || !booking) {
      return NextResponse.redirect(new URL('/confirmar?status=invalid', hostUrl));
    }

    if (booking.isconfirmed) {
       return NextResponse.redirect(new URL('/confirmar?status=already', hostUrl));
    }

    await supabase.from('bookings').update({ isconfirmed: 1 }).eq('token', token);

    return NextResponse.redirect(new URL('/confirmar?status=ok', hostUrl));
  } catch (error) {
    console.error(error);
    return NextResponse.redirect(new URL('/confirmar?status=error', hostUrl));
  }
}
