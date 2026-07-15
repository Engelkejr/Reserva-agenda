import { NextResponse } from 'next/server';
import { supabase } from '@/lib/db';

import { cookies } from 'next/headers';

export async function DELETE(request, { params }) {
  try {
    const cookieStore = await cookies();
    const auth = cookieStore.get('adminAuth')?.value;
    if (auth !== 'authenticated') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    const { error } = await supabase.from('bookings').delete().eq('id', id);
    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao deletar' }, { status: 500 });
  }
}

export async function PUT(request, { params }) {
  try {
    const cookieStore = await cookies();
    const auth = cookieStore.get('adminAuth')?.value;
    if (auth !== 'authenticated') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    const { date, startTime, endTime, name, sector, contact, email, isConfirmed } = await request.json();
    const { error } = await supabase.from('bookings').update({ 
      date, starttime: startTime, endtime: endTime, name, sector, contact, email, isconfirmed: isConfirmed ? 1 : 0 
    }).eq('id', id);
    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao atualizar' }, { status: 500 });
  }
}
