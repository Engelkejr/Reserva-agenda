"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import './agendar.css';

const generateTimeOptions = () => {
  const options = [];
  for (let h = 8; h <= 19; h++) {
    options.push(`${h.toString().padStart(2, '0')}:00`);
    if (h !== 19) {
      options.push(`${h.toString().padStart(2, '0')}:30`);
    }
  }
  return options;
};

const TIME_OPTIONS = generateTimeOptions();

export default function Agendar() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);
  
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('10:00');
  const [formData, setFormData] = useState({ name: '', sector: '', contact: '', email: '' });
  
  const [bookings, setBookings] = useState([]);
  const [holidays, setHolidays] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  // Busca feriados para o ano atual do calendário
  const fetchHolidays = async (year) => {
    try {
      const res = await fetch(`/api/holidays?year=${year}`);
      const data = await res.json();
      // Filtra os feriados desativados para não bloquearem o calendário
      setHolidays(Array.isArray(data) ? data.filter(h => h.type !== 'ignorado') : []);
    } catch (error) {
      console.error('Erro ao buscar feriados:', error);
      setHolidays([]);
    }
  };

  const fetchBookings = async () => {
    try {
      const res = await fetch('/api/bookings');
      const data = await res.json();
      setBookings(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error(error);
      setBookings([]);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  // Recarrega feriados quando o ano do calendário muda
  useEffect(() => {
    fetchHolidays(currentDate.getFullYear());
  }, [currentDate.getFullYear()]);

  const getDaysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (year, month) => new Date(year, month, 1).getDay();

  const handlePrevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  const handleNextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));

  const isWeekend = (year, month, day) => {
    const date = new Date(year, month, day);
    return date.getDay() === 0 || date.getDay() === 6;
  };

  const formatYMD = (year, month, day) => {
    return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  };

  // Retorna o objeto de feriado se a data for feriado, ou null
  const getHolidayInfo = (ymd) => holidays.find(h => h.date === ymd) || null;

  const isPast = (ymd) => {
    const todayStr = new Date().toISOString().split('T')[0];
    return ymd < todayStr;
  };

  const renderCalendar = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const daysInMonth = getDaysInMonth(year, month);
    const firstDay = getFirstDayOfMonth(year, month);

    const cells = [];
    const days = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

    // Header
    days.forEach(d => cells.push(<div key={`h-${d}`} className="calendar-day-name">{d}</div>));

    // Empty slots before first day
    for (let i = 0; i < firstDay; i++) {
      cells.push(<div key={`empty-${i}`} className="calendar-cell disabled"></div>);
    }

    // Days
    for (let d = 1; d <= daysInMonth; d++) {
      const ymd = formatYMD(year, month, d);
      const weekend = isWeekend(year, month, d);
      const holidayInfo = getHolidayInfo(ymd);
      const past = isPast(ymd);
      const disabled = weekend || !!holidayInfo || past;
      
      // Determinar se é feriado oficial ou ponto facultativo
      const isFacultativo = holidayInfo && (holidayInfo.type === 'facultativo' || holidayInfo.type === 'recesso' || holidayInfo.type === 'outro');
      
      let classes = "calendar-cell";
      if (disabled) classes += " disabled";
      if (holidayInfo && !isFacultativo) classes += " holiday";
      if (isFacultativo) classes += " facultativo";
      if (selectedDate === ymd) classes += " selected";

      const cell = (
        <div 
          key={d} 
          className={classes} 
          onClick={() => {
            if (!disabled) {
              setSelectedDate(ymd);
              setMessage('');
            }
          }}
        >
          {d}
        </div>
      );

      // Envolve com tooltip se for feriado
      if (holidayInfo) {
        cells.push(
          <div key={`wrapper-${d}`} className="calendar-cell-wrapper">
            {cell}
            <div className="holiday-tooltip">
              {holidayInfo.name}
              <span className={`holiday-type-badge ${holidayInfo.type}`}>
                {holidayInfo.type}
              </span>
            </div>
          </div>
        );
      } else {
        cells.push(cell);
      }
    }

    return (
      <div className="card animate-enter">
        <div className="calendar-header">
          <button onClick={handlePrevMonth} className="btn btn-outline" style={{ padding: '6px 12px' }}>&lt;</button>
          <span style={{ fontWeight: 600 }}>
            {currentDate.toLocaleString('pt-BR', { month: 'long', year: 'numeric' }).toUpperCase()}
          </span>
          <button onClick={handleNextMonth} className="btn btn-outline" style={{ padding: '6px 12px' }}>&gt;</button>
        </div>
        <div className="calendar-grid">
          {cells}
        </div>
        <div className="calendar-legend">
          <div className="legend-item">
            <span className="legend-dot holiday"></span>
            Feriado
          </div>
          <div className="legend-item">
            <span className="legend-dot facultativo"></span>
            Ponto Facultativo
          </div>
        </div>
      </div>
    );
  };

  const submitBooking = async (e) => {
    e.preventDefault();
    if (startTime >= endTime) {
      setMessage('O horário de término deve ser posterior ao horário de início.');
      return;
    }

    setLoading(true);
    setMessage('');
    try {
      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, date: selectedDate, startTime, endTime }),
      });
      const data = await res.json();
      if (res.ok) {
        setMessage('Reserva efetuada! Um e-mail de confirmação foi enviado.');
        setFormData({ name: '', sector: '', contact: '', email: '' });
        fetchBookings();
      } else {
        setMessage(data.error || 'Erro ao reservar.');
      }
    } catch (error) {
      setMessage('Erro de conexão.');
    } finally {
      setLoading(false);
    }
  };

  const dayBookings = bookings.filter(b => b.date === selectedDate);

  return (
    <div className="container" style={{ padding: '40px 20px' }}>
      <Link href="/" className="text-secondary mb-4" style={{ display: 'inline-block', fontWeight: 500 }}>← Voltar</Link>
      <h2 style={{ fontSize: '1.5rem', marginBottom: '32px' }}>Agendar Reunião</h2>

      <div className="calendar-container">
        <div className="calendar-section">
          <p className="label">1. Selecione a data</p>
          {renderCalendar()}
        </div>

        {selectedDate && (
          <div className="time-section animate-enter">
            <p className="label">2. Escolha o horário e confirme</p>
            
            <div className="card" style={{ marginBottom: '24px' }}>
              <h4 style={{ marginBottom: '16px', fontSize: '1.1rem' }}>Reuniões já agendadas neste dia:</h4>
              {dayBookings.length === 0 ? (
                <p className="text-secondary" style={{ fontSize: '0.9rem' }}>Nenhuma reunião agendada. A sala está livre!</p>
              ) : (
                dayBookings.map(b => (
                  <div key={b.id} className="booking-item">
                    <strong>{b.startTime} - {b.endTime}</strong><br/>
                    <span className="text-secondary">{b.name} ({b.sector})</span>
                  </div>
                ))
              )}
            </div>

            <div className="card">
              <form onSubmit={submitBooking} className="flex-col gap-4">
                <div className="flex gap-4">
                  <div style={{ flex: 1 }}>
                    <label className="label">Início</label>
                    <select className="select-field" value={startTime} onChange={e => setStartTime(e.target.value)}>
                      {TIME_OPTIONS.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                  <div style={{ flex: 1 }}>
                    <label className="label">Término</label>
                    <select className="select-field" value={endTime} onChange={e => setEndTime(e.target.value)}>
                      {TIME_OPTIONS.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="label">Nome Completo</label>
                  <input type="text" className="input-field" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                </div>
                <div>
                  <label className="label">Setor</label>
                  <input type="text" className="input-field" required value={formData.sector} onChange={e => setFormData({...formData, sector: e.target.value})} />
                </div>
                <div className="flex gap-4">
                  <div style={{ flex: 1 }}>
                    <label className="label">Contato (Telefone)</label>
                    <input type="tel" className="input-field" required value={formData.contact} onChange={e => setFormData({...formData, contact: e.target.value})} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label className="label">E-mail corporativo</label>
                    <input type="email" className="input-field" required value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
                  </div>
                </div>

                {message && (
                  <div style={{ padding: '12px', borderRadius: 'var(--radius)', background: message.includes('Erro') || message.includes('conflita') || message.includes('término') ? 'var(--holiday-bg)' : '#ecfdf5', color: message.includes('Erro') || message.includes('conflita') || message.includes('término') ? 'var(--danger)' : 'var(--success)', fontSize: '0.9rem' }}>
                    {message}
                  </div>
                )}

                <button type="submit" className="btn btn-primary" style={{ marginTop: '8px' }} disabled={loading}>
                  {loading ? 'Processando...' : 'Confirmar Reserva'}
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
