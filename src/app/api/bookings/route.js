import { NextResponse } from 'next/server';
import { supabase } from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';
import nodemailer from 'nodemailer';

export async function GET(request) {
  try {
    const { data, error } = await supabase.from('bookings').select('*').order('date', { ascending: true }).order('starttime', { ascending: true });
    if (error) throw error;
    
    const now = new Date();
    const brtString = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo', year: 'numeric', month: '2-digit', day: '2-digit' }).format(now);
    const formatter = new Intl.DateTimeFormat('en-GB', { timeZone: 'America/Sao_Paulo', hour: '2-digit', minute: '2-digit', hour12: false });
    const [brtHour, brtMinute] = formatter.format(now).split(':').map(Number);
    const currentMins = brtHour * 60 + brtMinute;

    const validBookings = (data || []).filter(b => {
      if (b.isconfirmed === 1) return true;
      if (b.date > brtString) return true;
      if (b.date === brtString) {
        const [startH, startM] = b.starttime.split(':').map(Number);
        const startMins = startH * 60 + startM;
        return currentMins < (startMins - 60);
      }
      return false;
    });

    const mapped = validBookings.map(b => ({
      ...b,
      startTime: b.starttime,
      endTime: b.endtime,
      isConfirmed: b.isconfirmed
    }));
    
    return NextResponse.json(mapped);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Erro ao buscar reservas' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const { date, startTime, endTime, name, sector, contact, email } = await request.json();

    const { data: existing, error: existError } = await supabase
      .from('bookings')
      .select('id, date, starttime, isconfirmed')
      .eq('date', date)
      .lt('starttime', endTime)
      .gt('endtime', startTime);
    
    if (existError) throw existError;
    
    if (existing && existing.length > 0) {
      const now = new Date();
      const brtString = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo', year: 'numeric', month: '2-digit', day: '2-digit' }).format(now);
      const formatter = new Intl.DateTimeFormat('en-GB', { timeZone: 'America/Sao_Paulo', hour: '2-digit', minute: '2-digit', hour12: false });
      const [brtHour, brtMinute] = formatter.format(now).split(':').map(Number);
      const currentMins = brtHour * 60 + brtMinute;

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
        return NextResponse.json({ error: 'Já existe uma reserva que conflita com este horário.' }, { status: 400 });
      }
    }

    const id = uuidv4();
    const token = uuidv4();

    const { error: insertError } = await supabase.from('bookings').insert([
      { id, date, starttime: startTime, endtime: endTime, name, sector, contact, email, token, isconfirmed: 0 }
    ]);
    if (insertError) throw insertError;

    const now = new Date();
    const brtString = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo', year: 'numeric', month: '2-digit', day: '2-digit' }).format(now);

    // Só envia e-mail se a reserva for para HOJE
    if (date === brtString) {
      const host = request.headers.get('host');
      const confirmLink = `http://${host}/api/confirm/${token}`;
      const cancelLink = `http://${host}/api/cancel/${token}`;
      
      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS,
        },
      });

      const info = await transporter.sendMail({
        from: `"Administração Sala 435" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: "Confirmação de Reserva - Sala 435",
        html: `
          <div style="font-family: sans-serif; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
            <h2 style="color: #000000;">Confirmação de Reserva</h2>
            <p>Olá <strong>${name}</strong>,</p>
            <p>Sua reserva para a Sala 435 no dia <strong>${date}</strong> das <strong>${startTime}</strong> às <strong>${endTime}</strong> foi solicitada.</p>
            <p>Para garantir a sala, por favor confirme sua reserva agora:</p>
            <a href="${confirmLink}" style="display: inline-block; background-color: #000000; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; margin-top: 10px; margin-bottom: 20px;">Confirmar Reserva</a>
            <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
            <p style="font-size: 0.9em; color: #666;">Se você desistiu ou agendou por engano, por favor cancele e libere o horário:</p>
            <a href="${cancelLink}" style="display: inline-block; background-color: #fce4e4; color: #cc0000; padding: 8px 16px; text-decoration: none; border-radius: 5px; margin-top: 5px; font-size: 0.9em;">Cancelar Reserva</a>
          </div>
        `,
      });
      console.log("Message sent for today's booking: %s", info.messageId);
    }

    return NextResponse.json({ success: true, id });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Erro: ' + (error.message || 'Falha ao processar') }, { status: 500 });
  }
}
