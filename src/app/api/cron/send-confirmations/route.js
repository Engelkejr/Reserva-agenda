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
    const brtString = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo', year: 'numeric', month: '2-digit', day: '2-digit' }).format(now);

    const { data: bookings, error: fetchError } = await supabase
      .from('bookings')
      .select('*')
      .eq('date', brtString)
      .eq('isconfirmed', 0);

    if (fetchError) throw fetchError;

    if (!bookings || bookings.length === 0) {
      return NextResponse.json({ message: 'Nenhuma reserva pendente para hoje.' });
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
          subject: "Lembrete: Confirmação de Reserva HOJE - Sala 435",
          html: `
            <div style="font-family: sans-serif; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
              <h2 style="color: #000000;">Sua reunião é hoje!</h2>
              <p>Olá <strong>${b.name}</strong>,</p>
              <p>Lembrando que sua reserva para a Sala 435 é <strong>HOJE (${b.date})</strong> das <strong>${b.starttime}</strong> às <strong>${b.endtime}</strong>.</p>
              <p style="color: #d70015; font-weight: bold;">ATENÇÃO: Você tem até 1 hora antes do início da reunião para confirmar. Caso contrário, a sala será liberada automaticamente.</p>
              <a href="${confirmLink}" style="display: inline-block; background-color: #000000; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; margin-top: 10px; margin-bottom: 20px;">Confirmar Presença</a>
              <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
              <p style="font-size: 0.9em; color: #666;">Se você desistiu da reunião, por favor cancele para liberar o horário para outros:</p>
              <a href="${cancelLink}" style="display: inline-block; background-color: #fce4e4; color: #cc0000; padding: 8px 16px; text-decoration: none; border-radius: 5px; margin-top: 5px; font-size: 0.9em;">Cancelar Reserva</a>
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
