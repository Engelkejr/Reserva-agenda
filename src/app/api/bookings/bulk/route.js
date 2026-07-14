import { NextResponse } from 'next/server';
import { supabase } from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';

export async function POST(request) {
  try {
    const { dates, startTime, endTime, name, sector, contact, email } = await request.json();

    if (!dates || dates.length === 0) {
      return NextResponse.json({ error: 'Nenhuma data selecionada.' }, { status: 400 });
    }

    // Overlap validation for all dates
    const conflitos = [];
    
    // Using current time logic for overlaps to match single bookings
    const now = new Date();
    const brtString = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo', year: 'numeric', month: '2-digit', day: '2-digit' }).format(now);
    const formatter = new Intl.DateTimeFormat('en-GB', { timeZone: 'America/Sao_Paulo', hour: '2-digit', minute: '2-digit', hour12: false });
    const [brtHour, brtMinute] = formatter.format(now).split(':').map(Number);
    const currentMins = brtHour * 60 + brtMinute;

    for (const date of dates) {
      const { data: existing, error } = await supabase
        .from('bookings')
        .select('id, date, starttime, isconfirmed')
        .eq('date', date)
        .lt('starttime', endTime)
        .gt('endtime', startTime);

      if (error) throw error;

      if (existing && existing.length > 0) {
        const validOverlaps = existing.filter(b => {
          if (b.isconfirmed === 1) return true;
          if (b.date > brtString) return true;
          if (b.date === brtString) {
            const [startH, startM] = b.starttime.split(':').map(Number);
            const startMins = startH * 60 + startM;
            return currentMins < (startMins - 60);
          }
          return false;
        });

        if (validOverlaps.length > 0) {
          conflitos.push(date);
        }
      }
    }

    if (conflitos.length > 0) {
      return NextResponse.json({ 
        error: `Há conflitos de horário nas seguintes datas: ${conflitos.join(', ')}.` 
      }, { status: 400 });
    }

    // Bulk insert
    const insertData = dates.map(date => ({
      id: uuidv4(),
      token: uuidv4(),
      date,
      starttime: startTime,
      endtime: endTime,
      name,
      sector,
      contact,
      email,
      isconfirmed: 1 // Admin bulk creations are pre-confirmed
    }));

    const { error: insertError } = await supabase.from('bookings').insert(insertData);
    if (insertError) throw insertError;

    return NextResponse.json({ success: true, count: dates.length });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Erro interno ao criar reservas em lote.' }, { status: 500 });
  }
}
