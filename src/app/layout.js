import './globals.css'

export const metadata = {
  title: 'Reserva de Sala - 435',
  description: 'Sistema de agendamento da sala de reuniões 435',
}

export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR">
      <body>
        <main className="main-content">
          {children}
        </main>
        <footer className="site-footer">
          <div className="footer-content">
            <span className="footer-text">Desenvolvido por</span>
            <a
              href="https://engelkesystems.vercel.app"
              target="_blank"
              rel="noopener noreferrer"
              className="footer-link"
            >
              <span className="footer-name">João Rafael</span>
              <svg className="footer-arrow" width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M3.5 2.5H9.5V8.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M9.5 2.5L2.5 9.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </a>
          </div>
        </footer>
      </body>
    </html>
  )
}
