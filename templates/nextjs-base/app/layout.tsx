import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'LUXE AI',
  description: 'Premium site generation',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
