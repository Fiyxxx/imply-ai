import type { JSX } from 'react'
import { redirect } from 'next/navigation'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

export default async function DashboardPage(): Promise<JSX.Element> {
  const projects = await db.project.findMany({
    select: {
      id: true,
      createdAt: true
    },
    orderBy: { createdAt: 'desc' }
  })

  if (projects.length > 0 && projects[0] !== undefined) {
    redirect(`/dashboard/${projects[0].id}/agent`)
  }

  return (
    <div className="flex items-start justify-center min-h-full p-8">
      <div className="max-w-md mx-auto mt-20 bg-white rounded-xl border border-gray-200 shadow-sm p-10 text-center">
        <div className="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-full bg-[var(--color-shell-200)]">
          <svg
            className="h-6 w-6 text-gray-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z"
            />
          </svg>
        </div>

        <h1 className="text-2xl font-bold text-gray-900">Welcome to Imply</h1>
        <p className="mt-3 text-sm text-gray-500 leading-relaxed">
          Add an AI copilot to your SaaS product in under an hour. Create your first project to get started.
        </p>

        <a
          href="/dashboard/new"
          className="mt-7 inline-flex items-center gap-2 rounded-lg bg-gray-900 px-5 py-2.5 text-sm font-medium text-white hover:opacity-80 transition-opacity focus:outline-none focus:ring-2 focus:ring-gray-900 focus:ring-offset-2"
        >
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
              d="M12 4.5v15m7.5-7.5h-15"
            />
          </svg>
          Create your first project
        </a>
      </div>
    </div>
  )
}
