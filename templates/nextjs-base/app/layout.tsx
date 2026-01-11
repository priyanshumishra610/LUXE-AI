import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Next.js Base',
  description: 'Base template for LUXE AI generated sites',
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
