'use client'

import { useRef, useState, type JSX } from 'react'

interface DocumentUploadFormProps {
  projectId: string
  onUploadComplete: () => void
}

type UploadState =
  | { type: 'idle' }
  | { type: 'file_selected'; file: File }
  | { type: 'uploading'; file: File }
  | { type: 'success' }
  | { type: 'error'; message: string }

export default function DocumentUploadForm({
  projectId,
  onUploadComplete,
}: DocumentUploadFormProps): JSX.Element {
  const [state, setState] = useState<UploadState>({ type: 'idle' })
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  function handleFileChange(file: File | null): void {
    if (!file) return
    setState({ type: 'file_selected', file })
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>): void {
    const file = e.target.files?.[0] ?? null
    handleFileChange(file)
  }

  function handleDragOver(e: React.DragEvent<HTMLDivElement>): void {
    e.preventDefault()
    setIsDragging(true)
  }

  function handleDragLeave(e: React.DragEvent<HTMLDivElement>): void {
    e.preventDefault()
    setIsDragging(false)
  }

  function handleDrop(e: React.DragEvent<HTMLDivElement>): void {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files[0] ?? null
    handleFileChange(file)
  }

  function handleZoneClick(): void {
    fileInputRef.current?.click()
  }

  function handleReset(): void {
    setState({ type: 'idle' })
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  async function handleUpload(): Promise<void> {
    if (state.type !== 'file_selected') return

    const { file } = state
    setState({ type: 'uploading', file })

    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('projectId', projectId)

      const res = await fetch('/api/documents', {
        method: 'POST',
        body: formData,
      })

      if (!res.ok) {
        const body = (await res.json()) as {
          error?: { message?: string }
        }
        const message =
          body.error?.message ?? `Upload failed (${res.status})`
        setState({ type: 'error', message })
        return
      }

      setState({ type: 'success' })

      setTimeout(() => {
        setState({ type: 'idle' })
        if (fileInputRef.current) {
          fileInputRef.current.value = ''
        }
        onUploadComplete()
      }, 1500)
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'An unexpected error occurred'
      setState({ type: 'error', message })
    }
  }

  const selectedFile =
    state.type === 'file_selected' || state.type === 'uploading'
      ? state.file
      : null

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
      <h2 className="mb-4 text-lg font-semibold text-gray-900">
        Upload Document
      </h2>

      {/* Drop zone */}
      <div
        role="button"
        tabIndex={0}
        onClick={handleZoneClick}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') handleZoneClick()
        }}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={[
          'flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed px-6 py-10 text-center transition-colors',
          isDragging
            ? 'border-indigo-500 bg-indigo-50'
            : 'border-gray-300 hover:border-indigo-400 hover:bg-gray-50',
        ].join(' ')}
      >
        <svg
          className="mb-3 h-10 w-10 text-gray-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.5}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5"
          />
        </svg>
        <p className="text-sm font-medium text-gray-700">
          Click to upload or drag and drop
        </p>
        <p className="mt-1 text-xs text-gray-500">
          PDF, Markdown, HTML, TXT up to 10MB
        </p>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.md,.markdown,.html,.htm,.txt"
        className="hidden"
        onChange={handleInputChange}
      />

      {/* Selected file + upload button */}
      {selectedFile !== null && (
        <div className="mt-4 flex items-center justify-between rounded-lg bg-gray-50 px-4 py-3">
          <div className="flex min-w-0 items-center gap-3">
            <svg
              className="h-5 w-5 shrink-0 text-indigo-500"
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
            <span className="truncate text-sm text-gray-700">
              {selectedFile.name}
            </span>
          </div>

          <div className="ml-4 flex shrink-0 items-center gap-2">
            {state.type === 'uploading' ? (
              <span className="flex items-center gap-2 text-sm text-indigo-600">
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
                Uploading...
              </span>
            ) : (
              <>
                <button
                  type="button"
                  onClick={handleReset}
                  className="rounded px-2 py-1 text-xs text-gray-500 hover:text-gray-700"
                >
                  Remove
                </button>
                <button
                  type="button"
                  onClick={() => void handleUpload()}
                  className="rounded-lg bg-indigo-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                >
                  Upload
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* Success message */}
      {state.type === 'success' && (
        <div className="mt-4 flex items-center gap-2 rounded-lg bg-green-50 px-4 py-3 text-sm text-green-700">
          <svg
            className="h-4 w-4 shrink-0"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M5 13l4 4L19 7"
            />
          </svg>
          Uploaded successfully
        </div>
      )}

      {/* Error message */}
      {state.type === 'error' && (
        <div className="mt-4 flex items-center justify-between rounded-lg bg-red-50 px-4 py-3">
          <div className="flex items-center gap-2 text-sm text-red-700">
            <svg
              className="h-4 w-4 shrink-0"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 9v2m0 4h.01M12 3a9 9 0 100 18A9 9 0 0012 3z"
              />
            </svg>
            {state.message}
          </div>
          <button
            type="button"
            onClick={handleReset}
            className="ml-4 shrink-0 text-xs text-red-500 underline hover:text-red-700"
          >
            Dismiss
          </button>
        </div>
      )}
    </div>
  )
}
