'use client'

import { useEffect, useRef, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import type { JSX } from 'react'

interface RetrievalConfig {
  topK: number
  minScore: number
}

interface ProjectSettings {
  id: string
  name: string
  systemPrompt: string
  customInstructions: string | null
  retrievalConfig: RetrievalConfig
  apiKey: string
}

interface FormState {
  name: string
  systemPrompt: string
  topK: number
  minScore: number
}

type LoadState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'ready'; project: ProjectSettings }

type SaveState =
  | { status: 'idle' }
  | { status: 'saving' }
  | { status: 'success' }
  | { status: 'error'; message: string }

export default function ProjectSettingsPage(): JSX.Element {
  const params = useParams()
  const router = useRouter()
  const projectId = params['projectId'] as string

  const [loadState, setLoadState] = useState<LoadState>({ status: 'loading' })
  const [saveState, setSaveState] = useState<SaveState>({ status: 'idle' })
  const [deleteConfirm, setDeleteConfirm] = useState<boolean>(false)
  const [isDeleting, setIsDeleting] = useState<boolean>(false)
  const [form, setForm] = useState<FormState>({
    name: '',
    systemPrompt: '',
    topK: 5,
    minScore: 0.7
  })

  const successTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    let cancelled = false

    async function fetchProject(): Promise<void> {
      try {
        const res = await fetch(`/api/projects/${projectId}`)
        if (!res.ok) {
          const body = (await res.json()) as { error?: { message?: string } }
          throw new Error(body.error?.message ?? `Request failed with status ${res.status}`)
        }
        const body = (await res.json()) as { data: ProjectSettings }
        if (!cancelled) {
          const project = body.data
          setLoadState({ status: 'ready', project })
          setForm({
            name: project.name,
            systemPrompt: project.systemPrompt,
            topK: project.retrievalConfig.topK,
            minScore: project.retrievalConfig.minScore
          })
        }
      } catch (err) {
        if (!cancelled) {
          setLoadState({
            status: 'error',
            message: err instanceof Error ? err.message : 'Failed to load project'
          })
        }
      }
    }

    void fetchProject()

    return () => {
      cancelled = true
    }
  }, [projectId])

  useEffect(() => {
    return () => {
      if (successTimerRef.current !== null) {
        clearTimeout(successTimerRef.current)
      }
    }
  }, [])

  function handleFieldChange(
    field: keyof FormState,
    value: string | number
  ): void {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  async function handleSave(e: React.FormEvent<HTMLFormElement>): Promise<void> {
    e.preventDefault()

    if (successTimerRef.current !== null) {
      clearTimeout(successTimerRef.current)
    }

    setSaveState({ status: 'saving' })

    try {
      const res = await fetch(`/api/projects/${projectId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          systemPrompt: form.systemPrompt,
          retrievalConfig: {
            topK: form.topK,
            minScore: form.minScore
          }
        })
      })

      if (!res.ok) {
        const body = (await res.json()) as { error?: { message?: string } }
        throw new Error(body.error?.message ?? `Save failed with status ${res.status}`)
      }

      setSaveState({ status: 'success' })
      successTimerRef.current = setTimeout(() => {
        setSaveState({ status: 'idle' })
      }, 2000)
    } catch (err) {
      setSaveState({
        status: 'error',
        message: err instanceof Error ? err.message : 'Failed to save settings'
      })
    }
  }

  async function handleDelete(): Promise<void> {
    if (!deleteConfirm) {
      setDeleteConfirm(true)
      return
    }

    setIsDeleting(true)

    try {
      const res = await fetch(`/api/projects/${projectId}`, {
        method: 'DELETE'
      })

      if (!res.ok) {
        const body = (await res.json()) as { error?: { message?: string } }
        throw new Error(body.error?.message ?? `Delete failed with status ${res.status}`)
      }

      router.push('/dashboard')
    } catch (err) {
      setIsDeleting(false)
      setDeleteConfirm(false)
      setSaveState({
        status: 'error',
        message: err instanceof Error ? err.message : 'Failed to delete project'
      })
    }
  }

  if (loadState.status === 'loading') {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="flex items-center gap-3 text-gray-500">
          <svg
            className="h-5 w-5 animate-spin"
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
          <span className="text-sm">Loading project settings...</span>
        </div>
      </div>
    )
  }

  if (loadState.status === 'error') {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-6">
        <h2 className="text-sm font-semibold text-red-800">Failed to load settings</h2>
        <p className="mt-1 text-sm text-red-600">{loadState.message}</p>
        <button
          onClick={() => setLoadState({ status: 'loading' })}
          className="mt-4 rounded-lg border border-red-300 bg-white px-3 py-1.5 text-sm font-medium text-red-700 hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
        >
          Retry
        </button>
      </div>
    )
  }

  const project = loadState.project

  return (
    <div className="mx-auto max-w-2xl">
      {/* Page header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <a href="/dashboard" className="hover:text-gray-700">
            Projects
          </a>
          <span>/</span>
          <a
            href={`/dashboard/${project.id}`}
            className="hover:text-gray-700"
          >
            {project.name}
          </a>
          <span>/</span>
          <span className="text-gray-900">Settings</span>
        </div>
        <h1 className="mt-2 text-3xl font-bold text-gray-900">Project Settings</h1>
        <p className="mt-1 text-sm text-gray-500">
          Configure your AI copilot behavior and retrieval parameters.
        </p>
      </div>

      {/* Save success / error banner */}
      {saveState.status === 'success' && (
        <div className="mb-6 flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 px-4 py-3">
          <svg
            className="h-4 w-4 flex-shrink-0 text-green-600"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
          <span className="text-sm font-medium text-green-800">Settings saved</span>
        </div>
      )}
      {saveState.status === 'error' && (
        <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3">
          <span className="text-sm font-medium text-red-800">{saveState.message}</span>
        </div>
      )}

      <form onSubmit={(e) => void handleSave(e)} noValidate>
        {/* General section */}
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="border-b border-gray-200 px-6 py-4">
            <h2 className="text-base font-semibold text-gray-900">General</h2>
            <p className="mt-0.5 text-sm text-gray-500">Basic project information.</p>
          </div>
          <div className="space-y-5 px-6 py-5">
            {/* Project Name */}
            <div>
              <label
                htmlFor="project-name"
                className="mb-1.5 block text-sm font-medium text-gray-700"
              >
                Project Name <span className="text-red-500">*</span>
              </label>
              <input
                id="project-name"
                type="text"
                required
                maxLength={100}
                value={form.name}
                onChange={(e) => handleFieldChange('name', e.target.value)}
                placeholder="My SaaS Copilot"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 shadow-sm transition focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {/* API Key (read-only) */}
            <div>
              <label
                htmlFor="api-key"
                className="mb-1.5 block text-sm font-medium text-gray-700"
              >
                API Key
              </label>
              <div className="flex items-center gap-2">
                <input
                  id="api-key"
                  type="text"
                  readOnly
                  value={project.apiKey}
                  className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 font-mono text-xs text-gray-600 shadow-sm focus:outline-none"
                />
              </div>
              <p className="mt-1 text-xs text-gray-400">
                Use this key in the widget script tag to authenticate requests.
              </p>
            </div>
          </div>
        </div>

        {/* AI Configuration section */}
        <div className="mt-6 rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="border-b border-gray-200 px-6 py-4">
            <h2 className="text-base font-semibold text-gray-900">AI Configuration</h2>
            <p className="mt-0.5 text-sm text-gray-500">
              Define the persona and instructions your AI copilot follows.
            </p>
          </div>
          <div className="space-y-5 px-6 py-5">
            {/* System Prompt */}
            <div>
              <label
                htmlFor="system-prompt"
                className="mb-1.5 block text-sm font-medium text-gray-700"
              >
                System Prompt
              </label>
              <textarea
                id="system-prompt"
                rows={8}
                value={form.systemPrompt}
                onChange={(e) => handleFieldChange('systemPrompt', e.target.value)}
                placeholder="You are a helpful AI assistant for Acme Inc. You help users navigate our product, answer questions about our features, and resolve common issues. Always be concise, friendly, and professional."
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 shadow-sm transition focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <p className="mt-1 text-xs text-gray-400">
                The system prompt shapes your AI copilot's personality, tone, and behavior.
              </p>
            </div>
          </div>
        </div>

        {/* Retrieval Settings section */}
        <div className="mt-6 rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="border-b border-gray-200 px-6 py-4">
            <h2 className="text-base font-semibold text-gray-900">Retrieval Settings</h2>
            <p className="mt-0.5 text-sm text-gray-500">
              Control how many document chunks are retrieved and how relevant they must be.
            </p>
          </div>
          <div className="grid gap-5 px-6 py-5 sm:grid-cols-2">
            {/* Top K */}
            <div>
              <label
                htmlFor="top-k"
                className="mb-1.5 block text-sm font-medium text-gray-700"
              >
                Top K Results
              </label>
              <input
                id="top-k"
                type="number"
                min={1}
                max={20}
                step={1}
                value={form.topK}
                onChange={(e) =>
                  handleFieldChange('topK', parseInt(e.target.value, 10) || 1)
                }
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 shadow-sm transition focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <p className="mt-1 text-xs text-gray-400">
                Number of document chunks retrieved per query (1–20).
              </p>
            </div>

            {/* Min Score */}
            <div>
              <label
                htmlFor="min-score"
                className="mb-1.5 block text-sm font-medium text-gray-700"
              >
                Minimum Relevance Score
              </label>
              <input
                id="min-score"
                type="number"
                min={0}
                max={1}
                step={0.1}
                value={form.minScore}
                onChange={(e) =>
                  handleFieldChange('minScore', parseFloat(e.target.value) || 0)
                }
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 shadow-sm transition focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <p className="mt-1 text-xs text-gray-400">
                Chunks with a similarity score below this threshold are excluded (0–1).
              </p>
            </div>
          </div>
        </div>

        {/* Save button */}
        <div className="mt-6 flex justify-end">
          <button
            type="submit"
            disabled={saveState.status === 'saving'}
            className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saveState.status === 'saving' && (
              <svg
                className="h-4 w-4 animate-spin"
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
            )}
            {saveState.status === 'saving' ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      </form>

      {/* Danger Zone */}
      <div className="mt-10 rounded-xl border border-red-200 bg-white shadow-sm">
        <div className="border-b border-red-200 px-6 py-4">
          <h2 className="text-base font-semibold text-red-700">Danger Zone</h2>
          <p className="mt-0.5 text-sm text-gray-500">
            Irreversible actions. Please proceed with caution.
          </p>
        </div>
        <div className="flex items-center justify-between gap-4 px-6 py-5">
          <div>
            <p className="text-sm font-medium text-gray-900">Delete this project</p>
            <p className="mt-0.5 text-sm text-gray-500">
              Permanently remove this project, all its documents, actions, and conversation history.
            </p>
          </div>
          <button
            type="button"
            onClick={() => void handleDelete()}
            disabled={isDeleting}
            className="flex-shrink-0 rounded-lg border border-red-500 bg-white px-4 py-2 text-sm font-medium text-red-600 transition hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isDeleting
              ? 'Deleting...'
              : deleteConfirm
              ? 'Click again to confirm deletion'
              : 'Delete Project'}
          </button>
        </div>
      </div>
    </div>
  )
}
