"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';

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

import './admin.css';

export default function Admin() {
  const [password, setPassword] = useState('');
  const [loggedIn, setLoggedIn] = useState(false);
  const [bookings, setBookings] = useState([]);
  
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editForm, setEditForm] = useState({ id: '', date: '', startTime: '', endTime: '', name: '', sector: '', contact: '', email: '', isConfirmed: false });
  const [editMessage, setEditMessage] = useState('');

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
    // Check persistent login
    const isAuth = localStorage.getItem('adminAuth');
    if (isAuth === 'true') {
      setLoggedIn(true);
    }
  }, []);

  useEffect(() => {
    if (loggedIn) {
      fetchBookings();
    }
  }, [loggedIn]);

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
        setTimeout(() => {
          setEditModalOpen(false);
        }, 1500);
      } else {
        const data = await res.json();
        setEditMessage(data.error || 'Erro ao salvar.');
      }
    } catch (err) {
      setEditMessage('Erro de rede.');
    }
  };

  const [bulkModalOpen, setBulkModalOpen] = useState(false);
  const [bulkForm, setBulkForm] = useState({ dates: '', startTime: '09:00', endTime: '10:00', name: 'Admin', sector: 'Administração', contact: 'N/A', email: 'admin@sala435.local' });
  const [bulkMessage, setBulkMessage] = useState('');

  const handleBulkSubmit = async (e) => {
    e.preventDefault();
    setBulkMessage('');
    
    // Convert comma separated dates to array, trim and validate format
    const datesArray = bulkForm.dates.split(',').map(d => d.trim()).filter(d => d.match(/^\d{4}-\d{2}-\d{2}$/));
    
    if (datesArray.length === 0) {
      setBulkMessage('Formato de datas inválido. Use AAAA-MM-DD separado por vírgula.');
      return;
    }
    if (bulkForm.startTime >= bulkForm.endTime) {
      setBulkMessage('Término deve ser maior que o início.');
      return;
    }

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
        setTimeout(() => {
          setBulkModalOpen(false);
          setBulkMessage('');
        }, 2000);
      } else {
        setBulkMessage(data.error || 'Erro ao criar em lote.');
      }
    } catch (err) {
      setBulkMessage('Erro de rede.');
    }
  };

  if (!loggedIn) {
    return (
      <div className="container flex-center" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="card text-center animate-enter" style={{ width: '100%', maxWidth: '400px' }}>
          <h2 style={{ marginBottom: '8px', fontWeight: 600 }}>Painel Admin</h2>
          <p className="text-secondary" style={{ marginBottom: '32px' }}>Acesso restrito à administração</p>
          <form onSubmit={handleLogin} className="flex-col gap-4">
            <input 
              type="password" 
              className="input-field" 
              placeholder="Senha" 
              value={password}
              onChange={e => setPassword(e.target.value)}
            />
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
        <div style={{ display: 'flex', gap: '12px' }}>
          <button className="btn btn-primary" onClick={() => setBulkModalOpen(true)}>Criar Múltiplas</button>
          <button className="btn btn-outline" style={{ borderColor: 'var(--danger)', color: 'var(--danger)' }} onClick={handleLogout}>Sair</button>
        </div>
      </header>

      {bulkModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, padding: '20px' }}>
          <div className="card animate-enter" style={{ width: '100%', maxWidth: '500px', maxHeight: '90vh', overflowY: 'auto' }}>
            <h3 style={{ marginBottom: '16px' }}>Criar Múltiplas Reservas</h3>
            <form onSubmit={handleBulkSubmit} className="flex-col gap-4">
              <div>
                <label className="label">Datas (AAAA-MM-DD separadas por vírgula)</label>
                <input type="text" className="input-field" placeholder="Ex: 2026-07-20, 2026-07-22, 2026-07-25" value={bulkForm.dates} onChange={e => setBulkForm({...bulkForm, dates: e.target.value})} required />
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
              <div>
                <label className="label">Nome</label>
                <input type="text" className="input-field" value={bulkForm.name} onChange={e => setBulkForm({...bulkForm, name: e.target.value})} required />
              </div>
              <div className="flex gap-4">
                <button type="button" className="btn btn-outline" onClick={() => setBulkModalOpen(false)} style={{ flex: 1 }}>Cancelar</button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>Criar Lote</button>
              </div>
              {bulkMessage && <p style={{ color: bulkMessage.includes('Erro') || bulkMessage.includes('conflito') ? 'var(--danger)' : 'var(--success)', marginTop: '10px', fontSize: '0.9rem', textAlign: 'center' }}>{bulkMessage}</p>}
            </form>
          </div>
        </div>
      )}

      {editModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, padding: '20px' }}>
          <div className="card animate-enter" style={{ width: '100%', maxWidth: '500px', maxHeight: '90vh', overflowY: 'auto' }}>
            <h3 style={{ marginBottom: '16px' }}>Editar Reserva</h3>
            <form onSubmit={handleEditSubmit} className="flex-col gap-4">
              <div>
                <label className="label">Data (AAAA-MM-DD)</label>
                <input type="date" className="input-field" value={editForm.date} onChange={e => setEditForm({...editForm, date: e.target.value})} required />
              </div>
              <div className="flex gap-4">
                <div style={{ flex: 1 }}>
                  <label className="label">Início</label>
                  <select className="select-field" value={editForm.startTime} onChange={e => setEditForm({...editForm, startTime: e.target.value})}>
                    {TIME_OPTIONS.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div style={{ flex: 1 }}>
                  <label className="label">Término</label>
                  <select className="select-field" value={editForm.endTime} onChange={e => setEditForm({...editForm, endTime: e.target.value})}>
                    {TIME_OPTIONS.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="label">Nome</label>
                <input type="text" className="input-field" value={editForm.name} onChange={e => setEditForm({...editForm, name: e.target.value})} required />
              </div>
              <div>
                <label className="label">E-mail</label>
                <input type="email" className="input-field" value={editForm.email} onChange={e => setEditForm({...editForm, email: e.target.value})} required />
              </div>
              <div>
                <label className="label">Setor</label>
                <input type="text" className="input-field" value={editForm.sector} onChange={e => setEditForm({...editForm, sector: e.target.value})} required />
              </div>
              <div>
                <label className="label">Status</label>
                <select className="select-field" value={editForm.isConfirmed ? '1' : '0'} onChange={e => setEditForm({...editForm, isConfirmed: e.target.value === '1'})}>
                  <option value="1">Confirmada</option>
                  <option value="0">Pendente</option>
                </select>
              </div>
              <div className="flex gap-4 mt-4">
                <button type="button" className="btn btn-outline" onClick={() => setEditModalOpen(false)} style={{ flex: 1 }}>Cancelar</button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>Salvar Edição</button>
              </div>
              {editMessage && <p style={{ color: editMessage.includes('Erro') || editMessage.includes('maior') ? 'var(--danger)' : 'var(--success)', marginTop: '10px', fontSize: '0.9rem', textAlign: 'center' }}>{editMessage}</p>}
            </form>
          </div>
        </div>
      )}
      
      <div className="card" style={{ padding: 0, border: 'none' }}>
        <div>
          <table className="responsive-table">
            <thead>
              <tr style={{ backgroundColor: '#f9f9fb', borderBottom: '2px solid var(--border-color)' }}>
                <th style={{ padding: '16px 24px', fontWeight: 600, color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Data</th>
                <th style={{ padding: '16px 24px', fontWeight: 600, color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Horário</th>
                <th style={{ padding: '16px 24px', fontWeight: 600, color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Nome</th>
                <th style={{ padding: '16px 24px', fontWeight: 600, color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Setor</th>
                <th style={{ padding: '16px 24px', fontWeight: 600, color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Status</th>
                <th style={{ padding: '16px 24px', fontWeight: 600, color: 'var(--text-secondary)', fontSize: '0.85rem', textAlign: 'right' }}>Ações</th>
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
                      {b.isConfirmed ? <span style={{ color: '#fff', background: 'var(--success)', padding: '4px 10px', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 600 }}>Confirmada</span> : <span style={{ color: '#000', background: '#fcd34d', padding: '4px 10px', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 600 }}>Pendente</span>}
                    </td>
                    <td data-label="Ações" style={{ padding: '16px 24px', textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '8px' }}>
                        <button className="btn btn-outline" style={{ padding: '6px 12px', fontSize: '0.8rem' }} onClick={() => handleConfirm(b)}>
                          {b.isConfirmed ? 'Desfazer' : 'Confirmar'}
                        </button>
                        <button className="btn btn-outline" style={{ padding: '6px 12px', fontSize: '0.8rem' }} onClick={() => startEdit(b)}>
                          Editar
                        </button>
                        <button className="btn btn-danger" style={{ padding: '6px 12px', fontSize: '0.8rem' }} onClick={() => handleDelete(b.id)}>
                          Excluir
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
