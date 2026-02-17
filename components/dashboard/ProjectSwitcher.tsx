'use client'

import type { JSX } from 'react'
import { useState, useEffect, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'

interface ProjectItem {
  id: string
  name: string
}

export default function ProjectSwitcher(): JSX.Element {
  const params = useParams()
  const router = useRouter()
  const projectId = typeof params?.projectId === 'string' ? params.projectId : null

  const [projects, setProjects] = useState<ProjectItem[]>([])
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [isOpen, setIsOpen] = useState<boolean>(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    async function fetchProjects(): Promise<void> {
      try {
        const response = await fetch('/api/projects')
        if (!response.ok) {
          throw new Error(`Failed to fetch projects: ${response.statusText}`)
        }
        const json = await response.json() as { data: ProjectItem[] }
        setProjects(json.data ?? [])
      } catch {
        setProjects([])
      } finally {
        setIsLoading(false)
      }
    }

    void fetchProjects()
  }, [])

  useEffect(() => {
    function handleMouseDown(event: MouseEvent): void {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleMouseDown)
    return () => {
      document.removeEventListener('mousedown', handleMouseDown)
    }
  }, [])

  const currentProject = projectId
    ? projects.find((p) => p.id === projectId) ?? null
    : null

  const buttonLabel = currentProject?.name ?? 'Select project'

  function handleToggle(): void {
    setIsOpen((prev) => !prev)
  }

  function handleProjectClick(id: string): void {
    setIsOpen(false)
    router.push(`/dashboard/${id}/agent`)
  }

  function handleNewProject(): void {
    setIsOpen(false)
    router.push('/dashboard/new')
  }

  if (isLoading) {
    return (
      <div className="h-9 w-full animate-pulse rounded-lg bg-gray-100" />
    )
  }

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={handleToggle}
        className="w-full flex items-center justify-between px-3 py-2 rounded-lg hover:bg-[var(--color-shell-200)] text-sm font-semibold text-gray-900 transition-colors"
      >
        <span className="truncate">{buttonLabel}</span>
        <svg
          className="h-4 w-4 flex-shrink-0 text-gray-500 ml-2"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.5}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M19.5 8.25l-7.5 7.5-7.5-7.5"
          />
        </svg>
      </button>

      {isOpen && (
        <div
          className="absolute top-full left-0 right-0 mt-1 rounded-lg shadow-lg z-50 py-1"
          style={{
            backgroundColor: 'var(--color-shell-50)',
            border: '1px solid var(--color-shell-200)'
          }}
        >
          {projects.length === 0 ? (
            <p className="px-3 py-2 text-sm text-gray-400">No projects found</p>
          ) : (
            projects.map((project) => {
              const isActive = project.id === projectId
              return (
                <button
                  key={project.id}
                  type="button"
                  onClick={() => handleProjectClick(project.id)}
                  className={`w-full px-3 py-2 text-sm cursor-pointer hover:bg-[var(--color-shell-100)] flex items-center justify-between transition-colors ${
                    isActive ? 'text-indigo-600 font-medium' : 'text-gray-700'
                  }`}
                >
                  <span className="truncate">{project.name}</span>
                  {isActive && (
                    <span className="h-2 w-2 rounded-full bg-indigo-600 flex-shrink-0 ml-2" />
                  )}
                </button>
              )
            })
          )}

          <div className="mt-1 pt-1" style={{ borderTop: '1px solid var(--color-shell-200)' }}>
            <button
              type="button"
              onClick={handleNewProject}
              className="w-full px-3 py-2 text-sm text-indigo-600 font-medium flex items-center gap-2 cursor-pointer hover:bg-indigo-50 transition-colors"
            >
              <svg
                className="h-4 w-4 flex-shrink-0"
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
              New project
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
