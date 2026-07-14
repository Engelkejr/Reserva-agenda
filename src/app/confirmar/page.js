import Link from 'next/link';

export default async function ConfirmarPage({ searchParams }) {
  // searchParams might be a Promise in Next.js 15, but we can treat it as object if Next.js 14, 
  // let's await it to be safe for newer Next.js versions.
  const params = await searchParams;
  const status = params?.status || 'error';

  let title = 'Erro Inesperado';
  let message = 'Não foi possível processar sua solicitação.';
  let isSuccess = false;

  if (status === 'ok') {
    title = 'Reserva Confirmada!';
    message = 'Sua sala 435 está garantida com sucesso. Obrigado!';
    isSuccess = true;
  } else if (status === 'already') {
    title = 'Já Confirmada!';
    message = 'Sua reserva já estava confirmada anteriormente.';
    isSuccess = true;
  } else if (status === 'invalid') {
    title = 'Link Inválido';
    message = 'A reserva não foi encontrada ou o link expirou.';
  }

  return (
    <div className="container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', padding: '24px' }}>
      <div className="card animate-enter" style={{ maxWidth: '500px', width: '100%', textAlign: 'center' }}>
        
        <div style={{ marginBottom: '24px' }}>
          {isSuccess ? (
            <div style={{ width: '80px', height: '80px', borderRadius: '50%', backgroundColor: '#e4fce4', color: 'var(--success)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto', fontSize: '40px' }}>
              ✓
            </div>
          ) : (
            <div style={{ width: '80px', height: '80px', borderRadius: '50%', backgroundColor: '#fce4e4', color: 'var(--danger)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto', fontSize: '40px' }}>
              ✕
            </div>
          )}
        </div>

        <h1 style={{ fontSize: '24px', fontWeight: '700', marginBottom: '16px', color: 'var(--text-primary)' }}>
          {title}
        </h1>
        
        <p className="text-secondary" style={{ marginBottom: '32px', fontSize: '16px', lineHeight: '1.5' }}>
          {message}
        </p>

        <Link href="/" className="btn btn-primary" style={{ width: '100%' }}>
          Voltar ao Início
        </Link>
      </div>
    </div>
  );
}
