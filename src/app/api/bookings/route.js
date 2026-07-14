import { NextResponse } from 'next/server';
import { query, run } from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';
import nodemailer from 'nodemailer';

export async function GET(request) {
  try {
    const bookings = await query('SELECT * FROM bookings ORDER BY date ASC, startTime ASC');
    return NextResponse.json(bookings);
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao buscar reservas' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const { date, startTime, endTime, name, sector, contact, email } = await request.json();

    // Check overlapping bookings
    // A booking overlaps if (new_start < exist_end) AND (new_end > exist_start)
    const existing = await query('SELECT id FROM bookings WHERE date = ? AND startTime < ? AND endTime > ?', [date, endTime, startTime]);
    
    if (existing.length > 0) {
      return NextResponse.json({ error: 'Já existe uma reserva que conflita com este horário.' }, { status: 400 });
    }

    const id = uuidv4();
    const token = uuidv4();

    await run(
      'INSERT INTO bookings (id, date, startTime, endTime, name, sector, contact, email, token) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [id, date, startTime, endTime, name, sector, contact, email, token]
    );

    // Setup nodemailer to use Gmail
    const host = request.headers.get('host');
    const confirmLink = `http://${host}/api/confirm/${token}`;
    
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
      text: `Olá ${name},\n\nSua reserva para o dia ${date} das ${startTime} às ${endTime} foi registrada.\nPor favor, clique no link abaixo para confirmar sua reserva:\n${confirmLink}`,
      html: `
        <div style="font-family: sans-serif; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
          <h2 style="color: #000000;">Confirmação de Reserva</h2>
          <p>Olá <strong>${name}</strong>,</p>
          <p>Sua reserva para a Sala 435 no dia <strong>${date}</strong> das <strong>${startTime}</strong> às <strong>${endTime}</strong> foi registrada.</p>
          <p>Para garantir a sala, por favor confirme sua reserva clicando no botão abaixo:</p>
          <a href="${confirmLink}" style="display: inline-block; background-color: #000000; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; margin-top: 10px;">Confirmar Reserva</a>
          <br><br>
          <p>Se você não fez essa reserva, ignore este email.</p>
        </div>
      `,
    });

    console.log("Message sent to Gmail: %s", info.messageId);

    return NextResponse.json({ success: true, id });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Erro: ' + (error.message || 'Falha ao processar') }, { status: 500 });
  }
}
