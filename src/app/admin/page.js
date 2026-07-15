"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import './admin.css';

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

export default function Admin() {
  const [password, setPassword] = useState('');
  const [loggedIn, setLoggedIn] = useState(false);
  const [bookings, setBookings] = useState([]);
  const [holidays, setHolidays] = useState([]);
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [activeTab, setActiveTab] = useState('reservas'); // 'reservas' ou 'feriados'
  
  // Modals state
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editForm, setEditForm] = useState({ id: '', date: '', startTime: '', endTime: '', name: '', sector: '', contact: '', email: '', isConfirmed: false });
  const [editMessage, setEditMessage] = useState('');

  const [bulkModalOpen, setBulkModalOpen] = useState(false);
  const [bulkForm, setBulkForm] = useState({ dates: '', startTime: '09:00', endTime: '10:00', name: 'Admin', sector: 'Administração', contact: 'N/A', email: 'admin@sala435.local' });
  const [bulkMessage, setBulkMessage] = useState('');

  const [singleModalOpen, setSingleModalOpen] = useState(false);
  const [singleForm, setSingleForm] = useState({ date: '', startTime: '09:00', endTime: '10:00', name: '', sector: '', contact: '', email: '' });
  const [singleMessage, setSingleMessage] = useState('');

  const [holidayModalOpen, setHolidayModalOpen] = useState(false);
  const [holidayForm, setHolidayForm] = useState({ date: '', name: '', type: 'facultativo' });
  const [holidayMessage, setHolidayMessage] = useState('');

  const fetchBookings = async () => {
    try {
      const res = await fetch('/api/bookings');
      const data = await res.json();
      const newData = Array.isArray(data) ? data : [];
      setBookings(prev => JSON.stringify(prev) === JSON.stringify(newData) ? prev : newData);
    } catch (error) {
      console.error(error);
      setBookings([]);
    }
  };

  const fetchHolidays = async () => {
    try {
      const res = await fetch(`/api/holidays?year=${currentYear}`);
      const data = await res.json();
      const newData = Array.isArray(data) ? data : [];
      setHolidays(prev => JSON.stringify(prev) === JSON.stringify(newData) ? prev : newData);
    } catch (error) {
      console.error(error);
      setHolidays([]);
    }
  };

  useEffect(() => {
    const isAuth = localStorage.getItem('adminAuth');
    if (isAuth === 'true') {
      setLoggedIn(true);
    }
  }, []);

  useEffect(() => {
    if (loggedIn) {
      if (activeTab === 'reservas') fetchBookings();
      if (activeTab === 'feriados') fetchHolidays();
      
      // Sincronização em tempo real (Polling a cada 15s)
      const interval = setInterval(() => {
        if (activeTab === 'reservas') fetchBookings();
        if (activeTab === 'feriados') fetchHolidays();
      }, 15000);
      
      return () => clearInterval(interval);
    }
  }, [loggedIn, activeTab, currentYear]);

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password })
      });
      if (res.ok) {
        localStorage.setItem('adminAuth', 'true');
        setLoggedIn(true);
      } else {
        alert('Senha incorreta!');
      }
    } catch (err) {
      alert('Erro de conexão.');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('adminAuth');
    setLoggedIn(false);
  };

  // --- RESERVAS HANDLERS ---
  const handleDelete = async (id) => {
    if (confirm('Tem certeza que deseja apagar esta reserva?')) {
      await fetch(`/api/bookings/${id}`, { method: 'DELETE' });
      fetchBookings();
    }
  };

  const handleConfirm = async (booking) => {
    await fetch(`/api/bookings/${booking.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...booking, isConfirmed: !booking.isConfirmed })
    });
    fetchBookings();
  };

  const startEdit = (booking) => {
    setEditForm({ ...booking, isConfirmed: booking.isConfirmed === 1 || booking.isConfirmed === true });
    setEditMessage('');
    setEditModalOpen(true);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setEditMessage('');
    if (editForm.startTime >= editForm.endTime) {
      setEditMessage('Término deve ser maior que o início.');
      return;
    }
    
    try {
      const res = await fetch(`/api/bookings/${editForm.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm)
      });
      if (res.ok) {
        setEditMessage('Salvo com sucesso!');
        fetchBookings();
        setTimeout(() => setEditModalOpen(false), 1500);
      } else {
        const data = await res.json();
        setEditMessage(data.error || 'Erro ao salvar.');
      }
    } catch (err) {
      setEditMessage('Erro de rede.');
    }
  };

  const handleBulkSubmit = async (e) => {
    e.preventDefault();
    setBulkMessage('');
    const datesArray = bulkForm.dates.split(',').map(d => d.trim()).filter(d => d.match(/^\d{4}-\d{2}-\d{2}$/));
    
    if (datesArray.length === 0) return setBulkMessage('Formato inválido. Use AAAA-MM-DD separado por vírgula.');
    if (bulkForm.startTime >= bulkForm.endTime) return setBulkMessage('Término deve ser maior que o início.');

    try {
      const res = await fetch('/api/bookings/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...bulkForm, dates: datesArray })
      });
      const data = await res.json();
      if (res.ok) {
        setBulkMessage(`Sucesso! ${data.count} reservas criadas.`);
        fetchBookings();
        setTimeout(() => { setBulkModalOpen(false); setBulkMessage(''); }, 2000);
      } else {
        setBulkMessage(data.error || 'Erro ao criar em lote.');
      }
    } catch (err) {
      setBulkMessage('Erro de rede.');
    }
  };

  const handleSingleSubmit = async (e) => {
    e.preventDefault();
    setSingleMessage('');
    if (singleForm.startTime >= singleForm.endTime) return setSingleMessage('Término deve ser maior que o início.');

    try {
      const res = await fetch('/api/bookings/bulk', { // Reusing bulk for auto-confirmed creation
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...singleForm, dates: [singleForm.date] })
      });
      const data = await res.json();
      if (res.ok) {
        setSingleMessage('Reserva criada com sucesso!');
        fetchBookings();
        setSingleForm({ date: '', startTime: '09:00', endTime: '10:00', name: '', sector: '', contact: '', email: '' });
        setTimeout(() => { setSingleModalOpen(false); setSingleMessage(''); }, 2000);
      } else {
        setSingleMessage(data.error || 'Erro ao criar reserva.');
      }
    } catch (err) {
      setSingleMessage('Erro de rede.');
    }
  };

  // --- FERIADOS HANDLERS ---
  const handleHolidaySubmit = async (e) => {
    e.preventDefault();
    setHolidayMessage('');
    try {
      const res = await fetch('/api/blocked-dates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(holidayForm)
      });
      const data = await res.json();
      if (res.ok) {
        setHolidayMessage('Data bloqueada adicionada com sucesso!');
        fetchHolidays();
        setTimeout(() => { setHolidayModalOpen(false); setHolidayMessage(''); }, 1500);
      } else {
        setHolidayMessage(data.error || 'Erro ao adicionar.');
      }
    } catch (err) {
      setHolidayMessage('Erro de rede.');
    }
  };

  const handleDisableHoliday = async (date, name) => {
    if (confirm(`Deseja realmente desativar o feriado "${name}"? Ele deixará de bloquear o calendário.`)) {
      await fetch('/api/blocked-dates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date, name, type: 'ignorado' })
      });
      fetchHolidays();
    }
  };

  const handleDeleteHoliday = async (id) => {
    if (confirm('Deseja remover este bloqueio de data?')) {
      await fetch(`/api/blocked-dates/${id}`, { method: 'DELETE' });
      fetchHolidays();
    }
  };

  if (!loggedIn) {
    return (
      <div className="container flex-center" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="card text-center animate-enter" style={{ width: '100%', maxWidth: '400px' }}>
          <h2 style={{ marginBottom: '8px', fontWeight: 600 }}>Painel Admin</h2>
          <p className="text-secondary" style={{ marginBottom: '32px' }}>Acesso restrito à administração</p>
          <form onSubmit={handleLogin} className="flex-col gap-4">
            <input type="password" className="input-field" placeholder="Senha" value={password} onChange={e => setPassword(e.target.value)} />
            <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '14px' }}>Entrar no Painel</button>
          </form>
          <Link href="/" className="text-secondary mt-4" style={{ display: 'inline-block', fontSize: '0.9rem', marginTop: '24px' }}>← Voltar para o site</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container" style={{ padding: '60px 20px' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' }}>
        <div>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 700, letterSpacing: '-0.02em' }}>Administração</h2>
          <Link href="/" className="text-secondary" style={{ fontSize: '0.95rem', fontWeight: 500 }}>← Ir para o site</Link>
        </div>
        <div>
          <button className="btn btn-outline" style={{ borderColor: 'var(--danger)', color: 'var(--danger)' }} onClick={handleLogout}>Sair</button>
        </div>
      </header>

      {/* Tabs */}
      <div className="admin-tabs">
        <button className={`admin-tab ${activeTab === 'reservas' ? 'active' : ''}`} onClick={() => setActiveTab('reservas')}>
          Gestão de Reservas
        </button>
        <button className={`admin-tab ${activeTab === 'feriados' ? 'active' : ''}`} onClick={() => setActiveTab('feriados')}>
          Feriados & Bloqueios
        </button>
      </div>

      {activeTab === 'reservas' && (
        <div className="animate-enter">
          <div style={{ display: 'flex', gap: '12px', marginBottom: '24px' }}>
            <button className="btn btn-primary" onClick={() => setSingleModalOpen(true)}>+ Nova Reserva</button>
            <button className="btn btn-outline" onClick={() => setBulkModalOpen(true)}>Criar Lote Múltiplo</button>
          </div>
          <div className="card" style={{ padding: 0, border: 'none' }}>
            <table className="responsive-table">
              <thead>
                <tr style={{ backgroundColor: '#f9f9fb', borderBottom: '2px solid var(--border-color)' }}>
                  <th>Data</th>
                  <th>Horário</th>
                  <th>Nome</th>
                  <th>Setor</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Ações</th>
                </tr>
              </thead>
              <tbody>
                {bookings.length === 0 ? (
                  <tr><td colSpan="6" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>Nenhuma reserva encontrada.</td></tr>
                ) : (
                  bookings.map(b => (
                    <tr key={b.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                      <td data-label="Data" style={{ padding: '16px 24px', fontWeight: 500 }}>{b.date.split('-').reverse().join('/')}</td>
                      <td data-label="Horário" style={{ padding: '16px 24px' }}>
                        <span style={{ fontWeight: 600 }}>{b.startTime} - {b.endTime}</span>
                      </td>
                      <td data-label="Nome" style={{ padding: '16px 24px' }}>
                        <div style={{ fontWeight: 500 }}>{b.name}</div>
                        <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{b.email}</div>
                      </td>
                      <td data-label="Setor" style={{ padding: '16px 24px' }}>{b.sector}</td>
                      <td data-label="Status" style={{ padding: '16px 24px' }}>
                        {b.isConfirmed ? <span className="badge success">Confirmada</span> : <span className="badge warning">Pendente</span>}
                      </td>
                      <td data-label="Ações" style={{ padding: '16px 24px', textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: '8px', flexWrap: 'nowrap', justifyContent: 'flex-end', whiteSpace: 'nowrap' }}>
                          <button className="btn btn-outline" style={{ padding: '6px 12px', fontSize: '0.8rem' }} onClick={() => handleConfirm(b)}>
                            {b.isConfirmed ? 'Desfazer' : 'Confirmar'}
                          </button>
                          <button className="btn btn-outline" style={{ padding: '6px 12px', fontSize: '0.8rem' }} onClick={() => startEdit(b)}>Editar</button>
                          <button className="btn btn-danger" style={{ padding: '6px 12px', fontSize: '0.8rem' }} onClick={() => handleDelete(b.id)}>Excluir</button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'feriados' && (
        <div className="animate-enter">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <button className="btn btn-outline" style={{ padding: '6px 12px' }} onClick={() => setCurrentYear(y => y - 1)}>&lt;</button>
              <h3 style={{ margin: 0, minWidth: '80px', textAlign: 'center' }}>{currentYear}</h3>
              <button className="btn btn-outline" style={{ padding: '6px 12px' }} onClick={() => setCurrentYear(y => y + 1)}>&gt;</button>
            </div>
            <button className="btn btn-primary" onClick={() => {
              setHolidayForm({ date: '', name: '', type: 'facultativo' });
              setHolidayModalOpen(true);
            }}>+ Adicionar Ponto Facultativo</button>
          </div>

          <div className="card" style={{ padding: 0, border: 'none' }}>
            <table className="responsive-table">
              <thead>
                <tr style={{ backgroundColor: '#f9f9fb', borderBottom: '2px solid var(--border-color)' }}>
                  <th>Data</th>
                  <th>Nome do Feriado / Recesso</th>
                  <th>Tipo</th>
                  <th style={{ textAlign: 'right' }}>Ações</th>
                </tr>
              </thead>
              <tbody>
                {holidays.length === 0 ? (
                  <tr><td colSpan="4" style={{ padding: '40px', textAlign: 'center' }}>Nenhuma data encontrada.</td></tr>
                ) : (
                  holidays.map((h, i) => (
                    <tr key={h.id || `h-${i}`} style={{ borderBottom: '1px solid var(--border-color)', opacity: h.type === 'ignorado' ? 0.6 : 1 }}>
                      <td data-label="Data" style={{ padding: '16px 24px', fontWeight: 500 }}>{h.date.split('-').reverse().join('/')}</td>
                      <td data-label="Nome" style={{ padding: '16px 24px', fontWeight: 500, textDecoration: h.type === 'ignorado' ? 'line-through' : 'none' }}>{h.name}</td>
                      <td data-label="Tipo" style={{ padding: '16px 24px' }}>
                        <span className={`holiday-badge ${h.type}`}>{h.type === 'ignorado' ? 'Desativado' : h.type}</span>
                      </td>
                      <td data-label="Ações" style={{ padding: '16px 24px', textAlign: 'right' }}>
                        {h.id ? (
                          h.type === 'ignorado' ? (
                            <button className="btn btn-outline" style={{ padding: '6px 12px', fontSize: '0.8rem' }} onClick={() => handleDeleteHoliday(h.id)}>Restaurar</button>
                          ) : (
                            <button className="btn btn-danger" style={{ padding: '6px 12px', fontSize: '0.8rem' }} onClick={() => handleDeleteHoliday(h.id)}>Excluir</button>
                          )
                        ) : (
                          <div style={{ display: 'inline-flex', gap: '8px', flexWrap: 'nowrap', alignItems: 'center' }}>
                            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Fixo</span>
                            <button className="btn btn-outline" style={{ padding: '6px 12px', fontSize: '0.8rem' }} onClick={() => handleDisableHoliday(h.date, h.name)}>Desativar</button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* --- MODALS --- */}
      
      {/* Modal: Single Booking */}
      {singleModalOpen && (
        <div className="modal-overlay">
          <div className="card animate-enter modal-content">
            <h3 style={{ marginBottom: '16px' }}>Criar Reserva (Admin)</h3>
            <p className="text-secondary" style={{ fontSize: '0.85rem', marginBottom: '16px' }}>Reservas criadas por aqui já nascem confirmadas.</p>
            <form onSubmit={handleSingleSubmit} className="flex-col gap-4">
              <div>
                <label className="label">Data (AAAA-MM-DD)</label>
                <input type="date" className="input-field" value={singleForm.date} onChange={e => setSingleForm({...singleForm, date: e.target.value})} required />
              </div>
              <div className="flex gap-4">
                <div style={{ flex: 1 }}>
                  <label className="label">Início</label>
                  <select className="select-field" value={singleForm.startTime} onChange={e => setSingleForm({...singleForm, startTime: e.target.value})}>
                    {TIME_OPTIONS.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div style={{ flex: 1 }}>
                  <label className="label">Término</label>
                  <select className="select-field" value={singleForm.endTime} onChange={e => setSingleForm({...singleForm, endTime: e.target.value})}>
                    {TIME_OPTIONS.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
              </div>
              <div><label className="label">Nome</label><input type="text" className="input-field" value={singleForm.name} onChange={e => setSingleForm({...singleForm, name: e.target.value})} required /></div>
              <div><label className="label">E-mail</label><input type="email" className="input-field" value={singleForm.email} onChange={e => setSingleForm({...singleForm, email: e.target.value})} required /></div>
              <div className="flex gap-4">
                <div style={{ flex: 1 }}><label className="label">Setor</label><input type="text" className="input-field" value={singleForm.sector} onChange={e => setSingleForm({...singleForm, sector: e.target.value})} required /></div>
                <div style={{ flex: 1 }}><label className="label">Telefone</label><input type="tel" className="input-field" value={singleForm.contact} onChange={e => setSingleForm({...singleForm, contact: e.target.value})} required /></div>
              </div>
              <div className="flex gap-4 mt-4">
                <button type="button" className="btn btn-outline" onClick={() => setSingleModalOpen(false)} style={{ flex: 1 }}>Cancelar</button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>Salvar Reserva</button>
              </div>
              {singleMessage && <p className={`message ${singleMessage.includes('Erro') ? 'error' : 'success'}`}>{singleMessage}</p>}
            </form>
          </div>
        </div>
      )}

      {/* Modal: Bulk Booking */}
      {bulkModalOpen && (
        <div className="modal-overlay">
          <div className="card animate-enter modal-content">
            <h3 style={{ marginBottom: '16px' }}>Criar Múltiplas Reservas</h3>
            <form onSubmit={handleBulkSubmit} className="flex-col gap-4">
              <div>
                <label className="label">Datas (AAAA-MM-DD separadas por vírgula)</label>
                <input type="text" className="input-field" placeholder="Ex: 2026-07-20, 2026-07-22" value={bulkForm.dates} onChange={e => setBulkForm({...bulkForm, dates: e.target.value})} required />
              </div>
              <div className="flex gap-4">
                <div style={{ flex: 1 }}>
                  <label className="label">Início</label>
                  <select className="select-field" value={bulkForm.startTime} onChange={e => setBulkForm({...bulkForm, startTime: e.target.value})}>
                    {TIME_OPTIONS.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div style={{ flex: 1 }}>
                  <label className="label">Término</label>
                  <select className="select-field" value={bulkForm.endTime} onChange={e => setBulkForm({...bulkForm, endTime: e.target.value})}>
                    {TIME_OPTIONS.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
              </div>
              <div><label className="label">Nome</label><input type="text" className="input-field" value={bulkForm.name} onChange={e => setBulkForm({...bulkForm, name: e.target.value})} required /></div>
              <div className="flex gap-4 mt-4">
                <button type="button" className="btn btn-outline" onClick={() => setBulkModalOpen(false)} style={{ flex: 1 }}>Cancelar</button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>Criar Lote</button>
              </div>
              {bulkMessage && <p className={`message ${bulkMessage.includes('Erro') || bulkMessage.includes('conflito') ? 'error' : 'success'}`}>{bulkMessage}</p>}
            </form>
          </div>
        </div>
      )}

      {/* Modal: Edit Booking */}
      {editModalOpen && (
        <div className="modal-overlay">
          <div className="card animate-enter modal-content">
            <h3 style={{ marginBottom: '16px' }}>Editar Reserva</h3>
            <form onSubmit={handleEditSubmit} className="flex-col gap-4">
              <div><label className="label">Data (AAAA-MM-DD)</label><input type="date" className="input-field" value={editForm.date} onChange={e => setEditForm({...editForm, date: e.target.value})} required /></div>
              <div className="flex gap-4">
                <div style={{ flex: 1 }}><label className="label">Início</label><select className="select-field" value={editForm.startTime} onChange={e => setEditForm({...editForm, startTime: e.target.value})}>{TIME_OPTIONS.map(t => <option key={t} value={t}>{t}</option>)}</select></div>
                <div style={{ flex: 1 }}><label className="label">Término</label><select className="select-field" value={editForm.endTime} onChange={e => setEditForm({...editForm, endTime: e.target.value})}>{TIME_OPTIONS.map(t => <option key={t} value={t}>{t}</option>)}</select></div>
              </div>
              <div><label className="label">Nome</label><input type="text" className="input-field" value={editForm.name} onChange={e => setEditForm({...editForm, name: e.target.value})} required /></div>
              <div><label className="label">Status</label>
                <select className="select-field" value={editForm.isConfirmed ? '1' : '0'} onChange={e => setEditForm({...editForm, isConfirmed: e.target.value === '1'})}>
                  <option value="1">Confirmada</option>
                  <option value="0">Pendente</option>
                </select>
              </div>
              <div className="flex gap-4 mt-4">
                <button type="button" className="btn btn-outline" onClick={() => setEditModalOpen(false)} style={{ flex: 1 }}>Cancelar</button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>Salvar</button>
              </div>
              {editMessage && <p className={`message ${editMessage.includes('Erro') ? 'error' : 'success'}`}>{editMessage}</p>}
            </form>
          </div>
        </div>
      )}

      {/* Modal: Add Holiday/Blocked Date */}
      {holidayModalOpen && (
        <div className="modal-overlay">
          <div className="card animate-enter modal-content">
            <h3 style={{ marginBottom: '16px' }}>Bloquear Nova Data</h3>
            <form onSubmit={handleHolidaySubmit} className="flex-col gap-4">
              <div>
                <label className="label">Data (AAAA-MM-DD)</label>
                <input type="date" className="input-field" value={holidayForm.date} onChange={e => setHolidayForm({...holidayForm, date: e.target.value})} required />
              </div>
              <div>
                <label className="label">Motivo / Nome</label>
                <input type="text" className="input-field" placeholder="Ex: Dedetização da sala, Recesso..." value={holidayForm.name} onChange={e => setHolidayForm({...holidayForm, name: e.target.value})} required />
              </div>
              <div>
                <label className="label">Tipo de Bloqueio</label>
                <select className="select-field" value={holidayForm.type} onChange={e => setHolidayForm({...holidayForm, type: e.target.value})}>
                  <option value="facultativo">Ponto Facultativo</option>
                  <option value="recesso">Recesso</option>
                  <option value="outro">Outro (Bloqueio Total)</option>
                </select>
              </div>
              <div className="flex gap-4 mt-4">
                <button type="button" className="btn btn-outline" onClick={() => setHolidayModalOpen(false)} style={{ flex: 1 }}>Cancelar</button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>Bloquear Data</button>
              </div>
              {holidayMessage && <p className={`message ${holidayMessage.includes('Erro') ? 'error' : 'success'}`}>{holidayMessage}</p>}
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
