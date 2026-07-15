/**
 * Rota de API — /api/blocked-dates/[id]
 *
 * DELETE /api/blocked-dates/:id → Remove uma data bloqueada pelo ID.
 *
 * Segue o padrão do Next.js 16 para parâmetros dinâmicos de rota,
 * onde context.params é uma Promise que deve ser awaited.
 */

import { NextResponse } from 'next/server';
import { supabase } from '@/lib/db';

export async function DELETE(request, context) {
  try {
    const { id } = await context.params;

    if (!id) {
      return NextResponse.json(
        { error: 'O parâmetro "id" é obrigatório.' },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from('blocked_dates')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Erro ao deletar blocked_date:', error);
      return NextResponse.json(
        { error: 'Erro ao remover data bloqueada.' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, message: 'Data bloqueada removida com sucesso.' });
  } catch (err) {
    console.error('Erro inesperado em DELETE /api/blocked-dates/[id]:', err);
    return NextResponse.json(
      { error: 'Erro interno do servidor.' },
      { status: 500 }
    );
  }
}
