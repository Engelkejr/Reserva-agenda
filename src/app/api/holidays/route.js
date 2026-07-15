/**
 * Rota de API — /api/holidays
 *
 * GET /api/holidays?year=YYYY
 *   Retorna a lista combinada de feriados calculados (nacionais, estaduais,
 *   municipais e facultativos do RJ) e datas bloqueadas cadastradas no
 *   Supabase para o ano informado.
 */

import { NextResponse } from 'next/server';
import { supabase } from '@/lib/db';
import { getHolidaysForYear } from '@/lib/holidays';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const yearParam = searchParams.get('year');

    // Utiliza o ano atual como fallback
    const year = yearParam ? parseInt(yearParam, 10) : new Date().getFullYear();

    if (isNaN(year) || year < 1900 || year > 2099) {
      return NextResponse.json(
        { error: 'Ano inválido. Informe um valor entre 1900 e 2099.' },
        { status: 400 }
      );
    }

    // Feriados calculados dinamicamente
    const holidays = getHolidaysForYear(year);

    // Datas bloqueadas cadastradas no Supabase para o mesmo ano
    const startDate = `${year}-01-01`;
    const endDate = `${year}-12-31`;

    const { data: blockedDates, error } = await supabase
      .from('blocked_dates')
      .select('*')
      .gte('date', startDate)
      .lte('date', endDate);

    if (error) {
      console.error('Erro ao buscar blocked_dates (a tabela pode não existir ainda):', error);
      // Não retorna erro 500, apenas assume que não há datas bloqueadas
      // Isso impede que o calendário quebre se o usuário não rodou o SQL
    }

    // Mapear datas bloqueadas para o mesmo formato de saída
    const blockedItems = (!error && blockedDates) ? blockedDates.map((row) => ({
      date: row.date,
      name: row.name,
      type: row.type,
    })) : [];

    // Combinar feriados e datas bloqueadas, ordenados por data
    const merged = [...holidays, ...blockedItems];
    merged.sort((a, b) => a.date.localeCompare(b.date));

    return NextResponse.json(merged);
  } catch (err) {
    console.error('Erro inesperado em /api/holidays:', err);
    return NextResponse.json(
      { error: 'Erro interno do servidor.' },
      { status: 500 }
    );
  }
}
