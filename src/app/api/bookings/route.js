import { NextResponse } from 'next/server';
import { supabase } from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';
import nodemailer from 'nodemailer';

export const dynamic = 'force-dynamic';

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
          <div style="background-color: #F8F7F3; padding: 40px 20px; font-family: 'Inter', Helvetica, Arial, sans-serif; color: #1A1A1A; line-height: 1.6;">
            <div style="max-width: 600px; margin: 0 auto; background-color: #FFFFFF; border: 1px solid #E6E4DD; padding: 40px; border-radius: 4px;">
              
              <h2 style="font-family: 'Playfair Display', Georgia, serif; font-size: 24px; color: #1A1A1A; margin-top: 0; border-bottom: 1px solid #E6E4DD; padding-bottom: 20px; font-weight: normal;">
                Confirmação de Reserva
              </h2>
              
              <p style="font-size: 16px; margin-top: 30px;">Olá <strong>${name}</strong>,</p>
              
              <p style="font-size: 16px;">Sua solicitação de reserva para a <strong>Sala 435</strong> foi registrada em nosso sistema para <strong>HOJE</strong>.</p>
              
              <table style="width: 100%; margin: 30px 0; border-collapse: collapse;">
                <tr>
                  <td style="padding: 15px; border: 1px solid #E6E4DD; background-color: #F8F7F3; font-size: 14px; color: #6B6B66; text-transform: uppercase; letter-spacing: 1px;">Data</td>
                  <td style="padding: 15px; border: 1px solid #E6E4DD; font-size: 16px; font-weight: bold;">${date}</td>
                </tr>
                <tr>
                  <td style="padding: 15px; border: 1px solid #E6E4DD; background-color: #F8F7F3; font-size: 14px; color: #6B6B66; text-transform: uppercase; letter-spacing: 1px;">Horário</td>
                  <td style="padding: 15px; border: 1px solid #E6E4DD; font-size: 16px; font-weight: bold;">${startTime} às ${endTime}</td>
                </tr>
              </table>

              <p style="font-size: 16px; margin-bottom: 25px;">Para garantir o uso do espaço, por favor, confirme sua presença clicando no botão abaixo:</p>
              
              <a href="${confirmLink}" style="display: inline-block; background-color: #2B4A3C; color: #FFFFFF; padding: 16px 32px; text-decoration: none; border-radius: 4px; font-weight: bold; font-size: 16px; text-align: center;">
                Confirmar Reserva
              </a>
              
              <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #E6E4DD;">
                <p style="font-size: 14px; color: #6B6B66;">Se você desistiu ou agendou por engano, pedimos a gentileza de cancelar para liberar o horário para outros colegas.</p>
                <a href="${cancelLink}" style="color: #B84B4B; text-decoration: none; font-size: 14px; font-weight: bold; display: inline-block; margin-top: 10px;">
                  Cancelar esta reserva
                </a>
              </div>

            </div>
            
            <div style="max-width: 600px; margin: 20px auto 0; text-align: center; color: #6B6B66; font-size: 12px;">
              <p>Este é um e-mail automático do sistema de gestão da Sala 435.<br>Por favor, não responda a este e-mail.</p>
            </div>
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
