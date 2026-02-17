'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams } from 'next/navigation'
import type { JSX } from 'react'
import type { APIResponse } from '@/types/api'

interface ProjectData {
  id: string
  name: string
  apiKey: string
}

interface DocumentItem {
  id: string
  filename: string
}

interface StatsState {
  projectName: string | null
  documentCount: number | null
  loadingProject: boolean
  loadingDocuments: boolean
  error: string | null
}

function Spinner(): JSX.Element {
  return (
    <div className="flex items-center justify-center py-12">
      <svg
        className="h-8 w-8 animate-spin text-indigo-600"
        fill="none"
        viewBox="0 0 24 24"
      >
        <circle
          className="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="4"
        />
        <path
          className="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
        />
      </svg>
    </div>
  )
}

interface StatCardProps {
  label: string
  value: string | number
  subtext: string
  loading?: boolean
}

function StatCard({ label, value, subtext, loading = false }: StatCardProps): JSX.Element {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
      {loading ? (
        <div className="flex items-center justify-center py-4">
          <svg
            className="h-5 w-5 animate-spin text-indigo-600"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
            />
          </svg>
        </div>
      ) : (
        <>
          <p className="text-3xl font-bold text-gray-900">{value}</p>
          <p className="mt-1 text-sm text-gray-500">{label}</p>
          <p className="mt-2 text-xs text-gray-400">{subtext}</p>
        </>
      )}
    </div>
  )
}

export default function StatsPage(): JSX.Element {
  const params = useParams()
  const projectId = params['projectId'] as string

  const [state, setState] = useState<StatsState>({
    projectName: null,
    documentCount: null,
    loadingProject: true,
    loadingDocuments: true,
    error: null
  })

  const fetchData = useCallback(async (): Promise<void> => {
    setState({
      projectName: null,
      documentCount: null,
      loadingProject: true,
      loadingDocuments: true,
      error: null
    })

    try {
      const [projectRes, documentsRes] = await Promise.all([
        fetch(`/api/projects/${projectId}`),
        fetch(`/api/documents?projectId=${projectId}`)
      ])

      if (!projectRes.ok) {
        const body = (await projectRes.json()) as APIResponse<ProjectData>
        throw new Error(
          body.error?.message ?? `Failed to load project (${projectRes.status})`
        )
      }

      const projectBody = (await projectRes.json()) as APIResponse<ProjectData>
      const projectName = projectBody.data?.name ?? null

      setState(prev => ({
        ...prev,
        projectName,
        loadingProject: false
      }))

      if (!documentsRes.ok) {
        // Non-fatal: show documents as unknown
        setState(prev => ({
          ...prev,
          documentCount: null,
          loadingDocuments: false
        }))
        return
      }

      const documentsBody = (await documentsRes.json()) as APIResponse<DocumentItem[]>
      const documentCount = Array.isArray(documentsBody.data)
        ? documentsBody.data.length
        : null

      setState(prev => ({
        ...prev,
        documentCount,
        loadingDocuments: false
      }))
    } catch (err) {
      setState(prev => ({
        ...prev,
        loadingProject: false,
        loadingDocuments: false,
        error: err instanceof Error ? err.message : 'An unexpected error occurred'
      }))
    }
  }, [projectId])

  useEffect(() => {
    void fetchData()
  }, [fetchData])

  const isLoading = state.loadingProject && state.loadingDocuments

  if (isLoading) {
    return <Spinner />
  }

  if (state.error !== null) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-6">
        <p className="text-sm font-medium text-red-800">Failed to load stats</p>
        <p className="mt-1 text-sm text-red-600">{state.error}</p>
        <button
          onClick={() => void fetchData()}
          className="mt-4 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
        >
          Retry
        </button>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Stats</h1>
        {state.projectName !== null && (
          <p className="mt-1 text-sm text-gray-500">{state.projectName}</p>
        )}
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <StatCard
          label="Documents"
          value={state.documentCount ?? '—'}
          subtext="Total knowledge base documents"
          loading={state.loadingDocuments}
        />
        <StatCard
          label="Conversations"
          value="—"
          subtext="Coming soon"
        />
        <StatCard
          label="Messages"
          value="—"
          subtext="Coming soon"
        />
        <StatCard
          label="Avg. Response Time"
          value="< 2s"
          subtext="target"
        />
      </div>
    </div>
  )
}
