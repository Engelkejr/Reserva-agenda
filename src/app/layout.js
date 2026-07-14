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
      </body>
    </html>
  )
}
