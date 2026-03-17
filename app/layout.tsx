import type { Metadata } from 'next'
import Link from 'next/link'
import type { ReactNode } from 'react'
import { bootstrapApp } from '@/lib/bootstrap'
import './globals.css'

bootstrapApp()

export const metadata: Metadata = {
  title: 'S Vote',
  description: 'Voting application',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode
}>) {
  const currentYear = new Date().getFullYear()

  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-50 text-slate-900">
        <div className="mx-auto flex min-h-screen max-w-7xl flex-col">
          <header className="border-b border-slate-200 bg-white px-4 py-3 sm:px-6">
            <Link href="/" className="text-lg font-semibold text-blue-700 hover:text-blue-800">
              S Vote
            </Link>
          </header>

          <main className="flex-1">{children}</main>

          <footer className="border-t border-slate-200 bg-white px-4 py-3 text-sm text-slate-600 sm:px-6">
            © {currentYear} S Vote
          </footer>
        </div>
      </body>
    </html>
  )
}
