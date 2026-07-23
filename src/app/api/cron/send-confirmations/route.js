import { NextResponse } from 'next/server';
import { supabase } from '@/lib/db';
import nodemailer from 'nodemailer';

export async function GET(request) {
  // Verificação de segurança nativa da Vercel para Cron Jobs
  const authHeader = request.headers.get('authorization');
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  try {
    const now = new Date();
    
    const { data: holidaysData } = await supabase.from('holidays').select('*');
    const holidays = Array.isArray(holidaysData) ? holidaysData.filter(h => h.type !== 'ignorado') : [];

    const isWeekend = (d) => d.getDay() === 0 || d.getDay() === 6;
    const isHoliday = (d) => {
      const ymd = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo', year: 'numeric', month: '2-digit', day: '2-digit' }).format(d);
      return holidays.some(h => h.date === ymd);
    };

    // Calcula o PRÓXIMO dia útil
    let nextBusinessDay = new Date(now.getTime());
    do {
      nextBusinessDay.setDate(nextBusinessDay.getDate() + 1);
    } while (isWeekend(nextBusinessDay) || isHoliday(nextBusinessDay));

    const nextBusinessDayStr = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo', year: 'numeric', month: '2-digit', day: '2-digit' }).format(nextBusinessDay);

    const { data: bookings, error: fetchError } = await supabase
      .from('bookings')
      .select('*')
      .eq('date', nextBusinessDayStr)
      .eq('isconfirmed', 0);

    if (fetchError) throw fetchError;

    if (!bookings || bookings.length === 0) {
      return NextResponse.json({ message: 'Nenhuma reserva pendente para o próximo dia útil.' });
    }

    const host = request.headers.get('host') || 'reserva-agenda.vercel.app';
    
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    let emailsSent = 0;

    for (const b of bookings) {
      const confirmLink = `https://${host}/api/confirm/${b.token}`;
      const cancelLink = `https://${host}/api/cancel/${b.token}`;
      
      try {
        await transporter.sendMail({
          from: `"Administração Sala 435" <${process.env.EMAIL_USER}>`,
          to: b.email,
          subject: `Lembrete: Confirmação de Reserva para ${b.date.split('-').reverse().join('/')} - Sala 435`,
          html: `
            <div style="background-color: #F8F7F3; padding: 40px 20px; font-family: 'Inter', Helvetica, Arial, sans-serif; color: #1A1A1A; line-height: 1.6;">
              <div style="max-width: 600px; margin: 0 auto; background-color: #FFFFFF; border: 1px solid #E6E4DD; padding: 40px; border-radius: 4px;">
                
                <h2 style="font-family: 'Playfair Display', Georgia, serif; font-size: 24px; color: #1A1A1A; margin-top: 0; border-bottom: 1px solid #E6E4DD; padding-bottom: 20px; font-weight: normal;">
                  Você tem uma reunião amanhã!
                </h2>
                
                <p style="font-size: 16px; margin-top: 30px;">Olá <strong>${b.name}</strong>,</p>
                
                <p style="font-size: 16px;">Lembrando que sua reserva para a <strong>Sala 435</strong> está agendada para <strong>${b.date.split('-').reverse().join('/')}</strong>.</p>
                
                <table style="width: 100%; margin: 30px 0; border-collapse: collapse;">
                  <tr>
                    <td style="padding: 15px; border: 1px solid #E6E4DD; background-color: #F8F7F3; font-size: 14px; color: #6B6B66; text-transform: uppercase; letter-spacing: 1px;">Data</td>
                    <td style="padding: 15px; border: 1px solid #E6E4DD; font-size: 16px; font-weight: bold;">${b.date}</td>
                  </tr>
                  <tr>
                    <td style="padding: 15px; border: 1px solid #E6E4DD; background-color: #F8F7F3; font-size: 14px; color: #6B6B66; text-transform: uppercase; letter-spacing: 1px;">Horário</td>
                    <td style="padding: 15px; border: 1px solid #E6E4DD; font-size: 16px; font-weight: bold;">${b.starttime} às ${b.endtime}</td>
                  </tr>
                </table>

                <div style="background-color: #F4EBEB; border-left: 4px solid #B84B4B; padding: 15px 20px; margin-bottom: 25px;">
                  <p style="color: #8A3333; margin: 0; font-size: 14px; font-weight: bold;">
                    ATENÇÃO: Você tem até 15 minutos antes do início da reunião para confirmar. Caso contrário, a sala será liberada automaticamente.
                  </p>
                </div>

                <a href="${confirmLink}" style="display: inline-block; background-color: #2B4A3C; color: #FFFFFF; padding: 16px 32px; text-decoration: none; border-radius: 4px; font-weight: bold; font-size: 16px; text-align: center;">
                  Confirmar Presença
                </a>
                
                <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #E6E4DD;">
                  <p style="font-size: 14px; color: #6B6B66;">Se você desistiu da reunião, pedimos a gentileza de cancelar para liberar o horário para outros colegas.</p>
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
        emailsSent++;
      } catch (err) {
        console.error('Failed to send email to', b.email, err);
      }
    }

    return NextResponse.json({ success: true, count: emailsSent });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Erro no cron job' }, { status: 500 });
  }
}
