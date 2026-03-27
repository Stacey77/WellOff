import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'WellOff — AI Real Estate Ops',
  description: 'The most powerful AI-driven real estate operations platform. Powered by TON, ARIA, DEVX, TERRA, CAPITA, and NOVA.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark">
      <body className="animated-bg min-h-screen">
        {children}
      </body>
    </html>
  )
}
