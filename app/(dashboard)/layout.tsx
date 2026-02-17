import type { ReactNode, JSX } from 'react'
import Sidebar from '@/components/dashboard/Sidebar'

export default function DashboardLayout({
  children,
}: {
  children: ReactNode
}): JSX.Element {
  return (
    <div className="flex h-screen flex-col overflow-hidden" style={{ backgroundColor: 'var(--color-shell-100)' }}>
      {/* Full-width top header */}
      <header
        className="flex h-14 flex-shrink-0 items-center px-6"
        style={{
          backgroundColor: 'var(--color-shell-100)',
          borderBottom: '1px solid var(--color-shell-200)'
        }}
      >
        <span
          className="text-2xl text-gray-900"
          style={{ fontFamily: 'var(--font-instrument-serif)' }}
        >
          Imply
        </span>
      </header>

      {/* Sidebar + main content */}
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <main className="flex-1 overflow-y-auto p-8">
          {children}
        </main>
      </div>
    </div>
  )
}
