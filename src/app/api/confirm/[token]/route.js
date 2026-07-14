import { NextResponse } from 'next/server';
import { run, query } from '@/lib/db';

export async function GET(request, { params }) {
  const { token } = await params;

  try {
    const booking = await query('SELECT id, isConfirmed FROM bookings WHERE token = ?', [token]);
    
    if (booking.length === 0) {
      return new NextResponse(
        `<html><head><title>Erro</title><style>body { font-family: sans-serif; text-align: center; padding: 50px; background-color: #fce4e4; color: #cc0000; }</style></head><body><h1>Link Inválido</h1><p>Reserva não encontrada.</p><a href="/">Voltar ao Início</a></body></html>`,
        { status: 404, headers: { 'Content-Type': 'text/html' } }
      );
    }

    if (booking[0].isConfirmed) {
       return new NextResponse(
        `<html><head><title>Já Confirmada</title><style>body { font-family: sans-serif; text-align: center; padding: 50px; background-color: #e4fce4; color: #00cc00; }</style></head><body><h1>Já Confirmada!</h1><p>Sua reserva já estava confirmada.</p><a href="/">Voltar ao Início</a></body></html>`,
        { status: 200, headers: { 'Content-Type': 'text/html' } }
      );
    }

    await run('UPDATE bookings SET isConfirmed = 1 WHERE token = ?', [token]);

    return new NextResponse(
      `<html><head><title>Reserva Confirmada</title><style>body { font-family: sans-serif; text-align: center; padding: 50px; background-color: #e4fce4; color: #00cc00; }</style></head><body><h1>Reserva Confirmada com Sucesso!</h1><p>Sua sala 435 está garantida.</p><a href="/">Voltar ao Início</a></body></html>`,
      { status: 200, headers: { 'Content-Type': 'text/html' } }
    );
  } catch (error) {
    return new NextResponse('Erro interno', { status: 500 });
  }
}
