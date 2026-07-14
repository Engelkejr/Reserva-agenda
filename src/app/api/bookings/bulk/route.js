import { NextResponse } from 'next/server';
import { query, run } from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';

export async function POST(request) {
  try {
    const { dates, startTime, endTime, name, sector, contact, email } = await request.json();

    if (!dates || dates.length === 0) {
      return NextResponse.json({ error: 'Nenhuma data selecionada.' }, { status: 400 });
    }

    // Validação de conflitos para todas as datas
    const conflitos = [];
    for (const date of dates) {
      const existing = await query('SELECT id FROM bookings WHERE date = ? AND startTime < ? AND endTime > ?', [date, endTime, startTime]);
      if (existing.length > 0) {
        conflitos.push(date);
      }
    }

    if (conflitos.length > 0) {
      return NextResponse.json({ 
        error: `Há conflitos de horário nas seguintes datas: ${conflitos.join(', ')}.` 
      }, { status: 400 });
    }

    // Inserção em lote
    const insertPromises = dates.map(date => {
      const id = uuidv4();
      const token = uuidv4();
      return run(
        'INSERT INTO bookings (id, date, startTime, endTime, name, sector, contact, email, token, isConfirmed) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1)',
        [id, date, startTime, endTime, name, sector, contact, email, token]
      );
    });

    await Promise.all(insertPromises);

    return NextResponse.json({ success: true, count: dates.length });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Erro interno ao criar reservas em lote.' }, { status: 500 });
  }
}
