import type { JSX } from 'react'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

export default async function DashboardPage(): Promise<JSX.Element> {
  const projects = await db.project.findMany({
    select: {
      id: true,
      name: true,
      createdAt: true,
      _count: {
        select: {
          documents: true,
          conversations: true,
          actions: true
        }
      }
    },
    orderBy: { createdAt: 'desc' }
  })

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Projects</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage your AI copilot integrations
          </p>
        </div>
        <a
          href="/dashboard/new"
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
        >
          New Project
        </a>
      </div>

      {projects.length === 0 ? (
        <div className="rounded-xl border-2 border-dashed border-gray-300 bg-white p-12 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-indigo-50">
            <svg
              className="h-6 w-6 text-indigo-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 4v16m8-8H4"
              />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900">No projects yet</h3>
          <p className="mt-2 text-sm text-gray-500">
            Create your first project to get started.
          </p>
          <div className="mt-6">
            <a
              href="/dashboard/new"
              className="inline-flex items-center rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
            >
              Create Project
            </a>
          </div>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => (
            <a
              key={project.id}
              href={`/dashboard/${project.id}`}
              className="block rounded-xl border border-gray-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md"
            >
              <h3 className="text-lg font-semibold text-gray-900">
                {project.name}
              </h3>
              <div className="mt-3 flex gap-4 text-sm text-gray-500">
                <span>{project._count.documents} docs</span>
                <span>{project._count.actions} actions</span>
                <span>{project._count.conversations} conversations</span>
              </div>
              <div className="mt-3 text-xs text-gray-400">
                Created {new Date(project.createdAt).toLocaleDateString()}
              </div>
            </a>
          ))}
        </div>
      )}
    </div>
  )
}
