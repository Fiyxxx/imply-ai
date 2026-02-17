'use client'

import { useCallback, useEffect, useState, type JSX } from 'react'
import { useParams } from 'next/navigation'
import DocumentUploadForm from '@/components/dashboard/DocumentUploadForm'

interface DocumentItem {
  id: string
  filename: string
  collection: string | null
  enabled: boolean
  status: 'processing' | 'indexed' | 'failed'
  errorMessage: string | null
  createdAt: string
}

interface APIResponse {
  data?: DocumentItem[]
  error?: {
    message: string
    code: string
  }
}

const STATUS_STYLES: Record<DocumentItem['status'], string> = {
  indexed: 'bg-green-100 text-green-800',
  processing: 'bg-yellow-100 text-yellow-800',
  failed: 'bg-red-100 text-red-800',
}

export default function DocumentsPage(): JSX.Element {
  const params = useParams()
  const projectId = typeof params['projectId'] === 'string' ? params['projectId'] : ''

  const [documents, setDocuments] = useState<DocumentItem[]>([])
  const [loading, setLoading] = useState(true)
  const [fetchError, setFetchError] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const fetchDocuments = useCallback(async (): Promise<void> => {
    if (!projectId) return

    setLoading(true)
    setFetchError(null)

    try {
      const res = await fetch(`/api/documents?projectId=${encodeURIComponent(projectId)}`)

      if (!res.ok) {
        const body = (await res.json()) as APIResponse
        setFetchError(body.error?.message ?? `Failed to load documents (${res.status})`)
        return
      }

      const body = (await res.json()) as APIResponse
      setDocuments(body.data ?? [])
    } catch (err) {
      setFetchError(
        err instanceof Error ? err.message : 'An unexpected error occurred'
      )
    } finally {
      setLoading(false)
    }
  }, [projectId])

  useEffect(() => {
    void fetchDocuments()
  }, [fetchDocuments])

  async function handleDelete(documentId: string): Promise<void> {
    setDeletingId(documentId)

    try {
      const res = await fetch(`/api/documents/${encodeURIComponent(documentId)}`, {
        method: 'DELETE',
      })

      if (!res.ok) {
        const body = (await res.json()) as { error?: { message?: string } }
        console.error('Delete failed:', body.error?.message)
        return
      }

      await fetchDocuments()
    } catch (err) {
      console.error('Delete error:', err)
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div>
      {/* Page header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Documents</h1>
        <p className="mt-1 text-sm text-gray-500">
          Upload and manage the knowledge base for this project
        </p>
      </div>

      {/* Upload form */}
      <div className="mb-8">
        <DocumentUploadForm
          projectId={projectId}
          onUploadComplete={() => void fetchDocuments()}
        />
      </div>

      {/* Document list */}
      <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-100 px-6 py-4">
          <h2 className="text-lg font-semibold text-gray-900">
            Knowledge Base
          </h2>
        </div>

        {loading ? (
          <div className="flex items-center justify-center px-6 py-16">
            <svg
              className="h-6 w-6 animate-spin text-gray-600"
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
            <span className="ml-3 text-sm text-gray-500">Loading documents...</span>
          </div>
        ) : fetchError !== null ? (
          <div className="px-6 py-12 text-center">
            <p className="text-sm text-red-600">{fetchError}</p>
            <button
              type="button"
              onClick={() => void fetchDocuments()}
              className="mt-4 text-sm font-medium text-gray-700 hover:text-gray-900 underline"
            >
              Try again
            </button>
          </div>
        ) : documents.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[var(--color-shell-200)]">
              <svg
                className="h-6 w-6 text-gray-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
            </div>
            <h3 className="text-base font-semibold text-gray-900">
              No documents yet
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              Upload a document above to start building the knowledge base.
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-gray-100">
            {documents.map((doc) => (
              <li
                key={doc.id}
                className="flex items-start justify-between gap-4 px-6 py-4 hover:bg-gray-50"
              >
                <div className="flex min-w-0 flex-1 items-start gap-4">
                  {/* File icon */}
                  <div className="mt-0.5 shrink-0">
                    <svg
                      className="h-5 w-5 text-gray-400"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    </svg>
                  </div>

                  {/* Doc info */}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-gray-900">
                      {doc.filename}
                    </p>
                    <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
                      {doc.collection !== null && doc.collection !== '' && (
                        <span className="text-xs text-gray-500">
                          {doc.collection}
                        </span>
                      )}
                      <span className="text-xs text-gray-400">
                        {new Date(doc.createdAt).toLocaleDateString(undefined, {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                        })}
                      </span>
                      {doc.status === 'failed' && doc.errorMessage !== null && (
                        <span
                          className="max-w-xs truncate text-xs text-red-600"
                          title={doc.errorMessage}
                        >
                          {doc.errorMessage}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right side: status badge + delete */}
                <div className="flex shrink-0 items-center gap-3">
                  <span
                    className={[
                      'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize',
                      STATUS_STYLES[doc.status],
                    ].join(' ')}
                  >
                    {doc.status}
                  </span>

                  <button
                    type="button"
                    onClick={() => void handleDelete(doc.id)}
                    disabled={deletingId === doc.id}
                    className="rounded p-1 text-gray-400 hover:bg-red-50 hover:text-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-1 disabled:opacity-50"
                    aria-label={`Delete ${doc.filename}`}
                  >
                    {deletingId === doc.id ? (
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
                    ) : (
                      <svg
                        className="h-4 w-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                        />
                      </svg>
                    )}
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
