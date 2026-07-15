/**
 * Rota de API — /api/blocked-dates
 *
 * GET  /api/blocked-dates       → Lista todas as datas bloqueadas cadastradas.
 * POST /api/blocked-dates       → Cria uma nova data bloqueada.
 *   Body: { date: 'YYYY-MM-DD', name: string, type: 'facultativo'|'recesso'|'outro' }
 */

import { NextResponse } from 'next/server';
import { supabase } from '@/lib/db';

// ============================================================================
// GET — Listar datas bloqueadas
// ============================================================================

export async function GET() {
  try {
    const { data, error } = await supabase
      .from('blocked_dates')
      .select('*')
      .order('date', { ascending: true });

    if (error) {
      console.error('Erro ao buscar blocked_dates:', error);
      return NextResponse.json(
        { error: 'Erro ao buscar datas bloqueadas.' },
        { status: 500 }
      );
    }

    return NextResponse.json(data);
  } catch (err) {
    console.error('Erro inesperado em GET /api/blocked-dates:', err);
    return NextResponse.json(
      { error: 'Erro interno do servidor.' },
      { status: 500 }
    );
  }
}

// ============================================================================
// POST — Criar data bloqueada
// ============================================================================

/** Tipos permitidos para datas bloqueadas */
const ALLOWED_TYPES = ['facultativo', 'recesso', 'outro'];

export async function POST(request) {
  try {
    const body = await request.json();
    const { date, name, type } = body;

    // Validação dos campos obrigatórios
    if (!date || !name || !type) {
      return NextResponse.json(
        { error: 'Os campos "date", "name" e "type" são obrigatórios.' },
        { status: 400 }
      );
    }

    // Validação do formato da data (YYYY-MM-DD)
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return NextResponse.json(
        { error: 'O campo "date" deve estar no formato YYYY-MM-DD.' },
        { status: 400 }
      );
    }

    // Validação do tipo
    if (!ALLOWED_TYPES.includes(type)) {
      return NextResponse.json(
        { error: `O campo "type" deve ser um dos seguintes: ${ALLOWED_TYPES.join(', ')}.` },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from('blocked_dates')
      .insert({ date, name, type })
      .select()
      .single();

    if (error) {
      console.error('Erro ao inserir blocked_date:', error);
      return NextResponse.json(
        { error: 'Erro ao criar data bloqueada.' },
        { status: 500 }
      );
    }

    return NextResponse.json(data, { status: 201 });
  } catch (err) {
    console.error('Erro inesperado em POST /api/blocked-dates:', err);
    return NextResponse.json(
      { error: 'Erro interno do servidor.' },
      { status: 500 }
    );
  }
}
