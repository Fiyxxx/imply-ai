'use client'

import { useState, type JSX } from 'react'
import type { CandidateAction, APIResponse } from '@/types/api'
import { HTTP_METHOD_COLORS } from '@/lib/utils'

type Step = 'source' | 'select' | 'importing'

interface ImportResult {
  candidate: CandidateAction
  status:    'pending' | 'success' | 'error'
  error?:    string
}

interface OpenAPIImportModalProps {
  projectId: string
  onClose:   () => void
  onDone:    () => void
}

export default function OpenAPIImportModal({
  projectId,
  onClose,
  onDone,
}: OpenAPIImportModalProps): JSX.Element {
  const [step,       setStep]       = useState<Step>('source')
  const [url,        setUrl]        = useState('')
  const [specText,   setSpecText]   = useState('')
  const [loading,    setLoading]    = useState(false)
  const [fetchError, setFetchError] = useState<string | null>(null)
  const [candidates, setCandidates] = useState<CandidateAction[]>([])
  const [selected,   setSelected]   = useState<Set<number>>(new Set())
  const [results,    setResults]    = useState<ImportResult[]>([])

  async function handlePreview(): Promise<void> {
    setLoading(true)
    setFetchError(null)
    try {
      const payload = url.trim() ? { url: url.trim() } : { spec: specText.trim() }
      const res  = await fetch('/api/openapi-import', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(payload),
      })
      const json = await res.json() as APIResponse<CandidateAction[]>
      if (!res.ok) {
        setFetchError(json.error?.message ?? 'Failed to parse spec')
        return
      }
      const list = json.data ?? []
      if (list.length === 0) {
        setFetchError('No endpoints found in this spec.')
        return
      }
      setCandidates(list)
      setSelected(new Set(list.map((_, i) => i)))
      setStep('select')
    } catch {
      setFetchError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  async function handleImport(): Promise<void> {
    const toImport = candidates.filter((_, i) => selected.has(i))
    const initialResults: ImportResult[] = toImport.map(c => ({
      candidate: c,
      status:    'pending',
    }))
    setResults(initialResults)
    setStep('importing')

    for (let i = 0; i < toImport.length; i++) {
      const candidate = toImport[i]
      if (candidate === undefined) continue
      try {
        const res  = await fetch(`/api/projects/${projectId}/actions`, {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify(candidate),
        })
        const json = await res.json() as { error?: { message: string } }
        setResults(prev =>
          prev.map((r, idx) =>
            idx === i
              ? {
                  ...r,
                  status: res.ok ? 'success' : 'error',
                  error:  res.ok ? undefined : (json.error?.message ?? 'Failed'),
                }
              : r
          )
        )
      } catch {
        setResults(prev =>
          prev.map((r, idx) =>
            idx === i ? { ...r, status: 'error', error: 'Network error' } : r
          )
        )
      }
    }
  }

  function toggleAll(checked: boolean): void {
    setSelected(checked ? new Set(candidates.map((_, i) => i)) : new Set<number>())
  }

  const inputClass =
    'w-full rounded-lg border border-[var(--color-shell-200)] bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500'

  const isImportDone = results.length > 0 && results.every(r => r.status !== 'pending')

  return (
    <>
      {/* Backdrop — not closeable while importing */}
      <div
        className="fixed inset-0 z-40 bg-black/30"
        onClick={step !== 'importing'
          ? (e) => { if (e.target === e.currentTarget) onClose() }
          : undefined}
      />

      {/* Modal */}
      <div
        className="fixed left-1/2 top-1/2 z-50 w-full max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-2xl shadow-xl"
        style={{
          backgroundColor: 'var(--color-shell-50)',
          border:          '1px solid var(--color-shell-200)',
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-6 py-4"
          style={{ borderBottom: '1px solid var(--color-shell-200)' }}
        >
          <h2 className="text-base font-semibold text-gray-900">
            Import from OpenAPI
          </h2>
          {step !== 'importing' && (
            <button
              onClick={onClose}
              className="rounded-lg p-1.5 text-gray-400 hover:bg-[var(--color-shell-200)] transition-colors"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        {/* Step 1 — Source */}
        {step === 'source' && (
          <div className="px-6 py-5 space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Spec URL
              </label>
              <input
                className={inputClass}
                value={url}
                onChange={e => setUrl(e.target.value)}
                placeholder="https://api.yourapp.com/openapi.json"
              />
            </div>

            <div className="flex items-center gap-3">
              <hr className="flex-1" style={{ borderColor: 'var(--color-shell-200)' }} />
              <span className="text-xs text-gray-400">or paste JSON</span>
              <hr className="flex-1" style={{ borderColor: 'var(--color-shell-200)' }} />
            </div>

            <textarea
              className={`${inputClass} resize-none font-mono text-xs`}
              rows={6}
              value={specText}
              onChange={e => setSpecText(e.target.value)}
              placeholder={'{\n  "openapi": "3.0.0",\n  ...\n}'}
            />

            {fetchError !== null && (
              <p className="text-sm text-red-500">{fetchError}</p>
            )}

            <div className="flex justify-end">
              <button
                onClick={() => void handlePreview()}
                disabled={loading || (!url.trim() && !specText.trim())}
                className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:opacity-80 disabled:opacity-40 transition-opacity"
              >
                {loading ? 'Parsing…' : 'Preview endpoints'}
              </button>
            </div>
          </div>
        )}

        {/* Step 2 — Select */}
        {step === 'select' && (
          <div className="px-6 py-5 space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-600">
                {candidates.length} endpoint{candidates.length !== 1 ? 's' : ''} detected
              </p>
              <label className="flex items-center gap-2 text-xs text-gray-600 cursor-pointer">
                <input
                  type="checkbox"
                  checked={selected.size === candidates.length}
                  onChange={e => toggleAll(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300 text-indigo-600"
                />
                Select all
              </label>
            </div>

            <div className="max-h-72 overflow-y-auto space-y-1 -mx-2 px-2">
              {candidates.map((c, i) => (
                <label
                  key={c.name}
                  className="flex items-center gap-3 rounded-lg px-3 py-2 cursor-pointer hover:bg-[var(--color-shell-100)] transition-colors"
                >
                  <input
                    type="checkbox"
                    checked={selected.has(i)}
                    onChange={e => {
                      const next = new Set(selected)
                      e.target.checked ? next.add(i) : next.delete(i)
                      setSelected(next)
                    }}
                    className="h-4 w-4 rounded border-gray-300 text-indigo-600 flex-shrink-0"
                  />
                  <span
                    className={`text-xs font-mono font-semibold px-1.5 py-0.5 rounded flex-shrink-0 ${HTTP_METHOD_COLORS[c.method] ?? ''}`}
                  >
                    {c.method}
                  </span>
                  <span className="text-sm text-gray-800 truncate flex-1">
                    {c.displayName}
                  </span>
                  <span className="text-xs text-gray-400 truncate max-w-[160px]">
                    {(() => { try { return new URL(c.endpoint).pathname } catch { return c.endpoint } })()}
                  </span>
                </label>
              ))}
            </div>

            <div className="flex justify-end">
              <button
                onClick={() => void handleImport()}
                disabled={selected.size === 0}
                className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:opacity-80 disabled:opacity-40 transition-opacity"
              >
                Import {selected.size} action{selected.size !== 1 ? 's' : ''}
              </button>
            </div>
          </div>
        )}

        {/* Step 3 — Importing */}
        {step === 'importing' && (
          <div className="px-6 py-5 space-y-3">
            <div className="max-h-72 overflow-y-auto space-y-1">
              {results.map((r) => (
                <div key={r.candidate.name} className="flex items-center gap-3 rounded-lg px-3 py-2">
                  {r.status === 'pending' && (
                    <svg className="h-4 w-4 animate-spin text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                  )}
                  {r.status === 'success' && (
                    <svg className="h-4 w-4 text-emerald-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                    </svg>
                  )}
                  {r.status === 'error' && (
                    <svg className="h-4 w-4 text-red-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  )}
                  <span className="text-sm text-gray-800 truncate flex-1">
                    {r.candidate.displayName}
                  </span>
                  {r.error !== undefined && (
                    <span className="text-xs text-red-500 truncate max-w-[180px]">
                      {r.error}
                    </span>
                  )}
                </div>
              ))}
            </div>

            {isImportDone && (
              <div className="flex justify-end pt-2">
                <button
                  onClick={onDone}
                  className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:opacity-80 transition-opacity"
                >
                  Done
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  )
}
