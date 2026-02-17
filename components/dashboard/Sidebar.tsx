'use client'

import type { JSX } from 'react'
import { useParams, usePathname } from 'next/navigation'
import ProjectSwitcher from '@/components/dashboard/ProjectSwitcher'

interface NavItem {
  label: string
  href: (projectId: string) => string
  icon: JSX.Element
}

const NAV_ITEMS: readonly NavItem[] = [
  {
    label: 'Agent',
    href: (id) => `/dashboard/${id}/agent`,
    icon: (
      <svg
        className="h-4 w-4"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={1.5}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"
        />
      </svg>
    )
  },
  {
    label: 'Knowledge Base',
    href: (id) => `/dashboard/${id}/knowledge-base`,
    icon: (
      <svg
        className="h-4 w-4"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={1.5}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M20.25 6.375c0 2.278-3.694 4.125-8.25 4.125S3.75 8.653 3.75 6.375m16.5 0c0-2.278-3.694-4.125-8.25-4.125S3.75 4.097 3.75 6.375m16.5 0v11.25c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125V6.375m16.5 5.625c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125"
        />
      </svg>
    )
  },
  {
    label: 'Actions',
    href: (id) => `/dashboard/${id}/actions`,
    icon: (
      <svg
        className="h-4 w-4"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={1.5}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z"
        />
      </svg>
    )
  },
  {
    label: 'Stats',
    href: (id) => `/dashboard/${id}/stats`,
    icon: (
      <svg
        className="h-4 w-4"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={1.5}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z"
        />
      </svg>
    )
  },
  {
    label: 'Playground',
    href: (id) => `/dashboard/${id}/playground`,
    icon: (
      <svg
        className="h-4 w-4"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={1.5}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.348a1.125 1.125 0 010 1.971l-11.54 6.347a1.125 1.125 0 01-1.667-.985V5.653z"
        />
      </svg>
    )
  }
]

export default function Sidebar(): JSX.Element {
  const params = useParams()
  const pathname = usePathname()

  const projectId =
    typeof params?.projectId === 'string' ? params.projectId : null

  return (
    <aside
      className="w-56 flex-shrink-0 flex flex-col"
      style={{
        backgroundColor: 'var(--color-shell-100)',
        borderRight: '1px solid var(--color-shell-200)'
      }}
    >
      {/* Project switcher */}
      <div className="p-3" style={{ borderBottom: '1px solid var(--color-shell-200)' }}>
        <ProjectSwitcher />
      </div>

      {/* Navigation */}
      <nav className="p-3 flex-1">
        {projectId === null ? (
          <p className="px-3 py-2 text-xs text-gray-400">
            &larr; Select a project
          </p>
        ) : (
          <>
            <p className="px-3 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
              Navigation
            </p>
            {NAV_ITEMS.map((item) => {
              const href = item.href(projectId)
              const isActive = pathname.includes(href)
              return (
                <a
                  key={item.label}
                  href={href}
                  className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                    isActive
                      ? 'bg-indigo-50 text-indigo-700 font-medium'
                      : 'text-gray-600 hover:bg-[var(--color-shell-200)] hover:text-gray-900'
                  }`}
                >
                  {item.icon}
                  {item.label}
                </a>
              )
            })}
          </>
        )}
      </nav>
    </aside>
  )
}
