import { NextResponse } from 'next/server';
import { supabase } from '@/lib/db';

export async function GET(request, { params }) {
  try {
    const { token } = await params;
    
    const { data: booking, error: fetchError } = await supabase
      .from('bookings')
      .select('id, isConfirmed')
      .eq('token', token)
      .single();

    if (fetchError || !booking) {
      return new NextResponse(
        `<html><head><title>Erro</title><style>body { font-family: sans-serif; text-align: center; padding: 50px; background-color: #fce4e4; color: #cc0000; }</style></head><body><h1>Link Inválido</h1><p>Reserva não encontrada.</p><a href="/">Voltar ao Início</a></body></html>`,
        { status: 404, headers: { 'Content-Type': 'text/html' } }
      );
    }

    if (booking.isConfirmed) {
       return new NextResponse(
        `<html><head><title>Já Confirmada</title><style>body { font-family: sans-serif; text-align: center; padding: 50px; background-color: #e4fce4; color: #00cc00; }</style></head><body><h1>Já Confirmada!</h1><p>Sua reserva já estava confirmada.</p><a href="/">Voltar ao Início</a></body></html>`,
        { status: 200, headers: { 'Content-Type': 'text/html' } }
      );
    }

    await supabase.from('bookings').update({ isConfirmed: 1 }).eq('token', token);

    return new NextResponse(
      `<html><head><title>Reserva Confirmada</title><style>body { font-family: sans-serif; text-align: center; padding: 50px; background-color: #e4fce4; color: #00cc00; }</style></head><body><h1>Reserva Confirmada com Sucesso!</h1><p>Sua sala 435 está garantida.</p><a href="/">Voltar ao Início</a></body></html>`,
      { status: 200, headers: { 'Content-Type': 'text/html' } }
    );
  } catch (error) {
    return new NextResponse('Erro interno', { status: 500 });
  }
}
