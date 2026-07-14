import Link from 'next/link';

export default function Home() {
  return (
    <div className="container" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="card text-center animate-enter" style={{ maxWidth: '500px', width: '100%', padding: '40px' }}>
        <div style={{ width: '48px', height: '48px', background: 'var(--bg-color)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px', border: '1px solid var(--border-color)' }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
        </div>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 600, marginBottom: '8px', letterSpacing: '-0.02em' }}>
          Sala 435
        </h1>
        <p className="text-secondary" style={{ marginBottom: '32px', fontSize: '0.95rem' }}>
          Sistema de agendamento de reuniões corporativas.
        </p>
        <Link href="/agendar" className="btn btn-primary" style={{ width: '100%', padding: '12px' }}>
          Marcar Reunião
        </Link>
      </div>
    </div>
  );
}
