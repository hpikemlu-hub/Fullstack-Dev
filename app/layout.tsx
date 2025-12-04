import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Workload Management System',
  description: 'Sistem manajemen beban kerja Kementerian Luar Negeri',
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