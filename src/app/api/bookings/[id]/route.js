import { NextResponse } from 'next/server';
import { run } from '@/lib/db';

export async function DELETE(request, { params }) {
  const { id } = await params;
  try {
    await run('DELETE FROM bookings WHERE id = ?', [id]);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao deletar reserva' }, { status: 500 });
  }
}

export async function PUT(request, { params }) {
  const { id } = await params;
  try {
    const { date, startTime, endTime, name, sector, contact, email, isConfirmed } = await request.json();
    await run(
      'UPDATE bookings SET date=?, startTime=?, endTime=?, name=?, sector=?, contact=?, email=?, isConfirmed=? WHERE id=?',
      [date, startTime, endTime, name, sector, contact, email, isConfirmed ? 1 : 0, id]
    );
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao atualizar reserva' }, { status: 500 });
  }
}
