'use client'

import { useState, useEffect, useCallback, type JSX } from 'react'
import type { ActionDetail, ActionParameter } from '@/types/api'

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
type ParamType = 'string' | 'number' | 'boolean'

interface KVRow { key: string; value: string }
interface ParamRow { name: string; type: ParamType; description: string; required: boolean }

interface ActionPanelProps {
  projectId:   string
  action:      ActionDetail | null // null = create mode
  onClose:     () => void
  onSaved:     () => void
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^[^a-z]+/, '')
    .slice(0, 64)
    .replace(/_+$/, '')
}

export default function ActionPanel({ projectId, action, onClose, onSaved }: ActionPanelProps): JSX.Element {
  const isEdit = action !== null

  const [displayName,          setDisplayName]          = useState(action?.displayName ?? '')
  const [name,                 setName]                 = useState(action?.name ?? '')
  const [nameManuallyEdited,   setNameManuallyEdited]   = useState(isEdit)
  const [description,          setDescription]          = useState(action?.description ?? '')
  const [method,               setMethod]               = useState<HttpMethod>(action?.method ?? 'POST')
  const [endpoint,             setEndpoint]             = useState(action?.endpoint ?? '')
  const [headers,              setHeaders]              = useState<KVRow[]>(
    Object.entries(action?.headers ?? {}).map(([key, value]) => ({ key, value }))
  )
  const [parameters,           setParameters]           = useState<ParamRow[]>(
    (action?.parameters ?? []).map(p => ({ name: p.name, type: p.type as ParamType, description: p.description, required: p.required }))
  )
  const [requiresConfirmation, setRequiresConfirmation] = useState(action?.requiresConfirmation ?? false)
  const [enabled,              setEnabled]              = useState(action?.enabled ?? true)
  const [saving,               setSaving]               = useState(false)
  const [error,                setError]                = useState<string | null>(null)

  // Auto-slug display name into internal name (only when not manually edited)
  useEffect(() => {
    if (!nameManuallyEdited) {
      setName(slugify(displayName))
    }
  }, [displayName, nameManuallyEdited])

  const handleSave = useCallback(async (): Promise<void> => {
    setSaving(true)
    setError(null)

    const headersRecord: Record<string, string> = {}
    for (const row of headers) {
      if (row.key.trim()) headersRecord[row.key.trim()] = row.value
    }

    const params: ActionParameter[] = parameters
      .filter(p => p.name.trim())
      .map(p => ({
        name:        p.name.trim(),
        type:        p.type,
        description: p.description.trim() || p.name.trim(),
        required:    p.required,
      }))

    const payload = {
      name, displayName, description, method, endpoint,
      headers: headersRecord, parameters: params,
      requiresConfirmation, enabled
    }

    const url = isEdit
      ? `/api/projects/${projectId}/actions/${action.id}`
      : `/api/projects/${projectId}/actions`

    try {
      const res = await fetch(url, {
        method:  isEdit ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(payload),
      })
      const json = await res.json() as { error?: { message: string } }
      if (!res.ok) {
        setError(json.error?.message ?? 'Save failed')
        return
      }
      onSaved()
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setSaving(false)
    }
  }, [action, displayName, name, description, method, endpoint, headers, parameters, requiresConfirmation, enabled, isEdit, projectId, onSaved])

  function addHeader(): void { setHeaders(prev => [...prev, { key: '', value: '' }]) }
  function removeHeader(i: number): void { setHeaders(prev => prev.filter((_, idx) => idx !== i)) }
  function updateHeader(i: number, field: 'key' | 'value', val: string): void {
    setHeaders(prev => prev.map((row, idx) => idx === i ? { ...row, [field]: val } : row))
  }

  function addParam(): void {
    setParameters(prev => [...prev, { name: '', type: 'string', description: '', required: false }])
  }
  function removeParam(i: number): void { setParameters(prev => prev.filter((_, idx) => idx !== i)) }
  function updateParam<K extends keyof ParamRow>(i: number, field: K, val: ParamRow[K]): void {
    setParameters(prev => prev.map((row, idx) => idx === i ? { ...row, [field]: val } : row))
  }

  const inputClass = 'w-full rounded-lg border border-[var(--color-shell-200)] bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500'
  const labelClass = 'block text-xs font-medium text-gray-600 mb-1'

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-40 bg-black/20" onClick={onClose} />

      {/* Panel */}
      <div
        className="fixed inset-y-0 right-0 z-50 flex w-[560px] flex-col shadow-xl"
        style={{ backgroundColor: 'var(--color-shell-50)', borderLeft: '1px solid var(--color-shell-200)' }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-6 py-4"
          style={{ borderBottom: '1px solid var(--color-shell-200)' }}
        >
          <h2 className="text-base font-semibold text-gray-900">
            {isEdit ? 'Edit action' : 'New action'}
          </h2>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-gray-400 hover:bg-[var(--color-shell-200)] hover:text-gray-600 transition-colors"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">

          {/* 1. Basic info */}
          <section>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-4">
              Basic info
            </h3>
            <div className="space-y-3">
              <div>
                <label className={labelClass}>Display name</label>
                <input
                  className={inputClass}
                  value={displayName}
                  onChange={e => setDisplayName(e.target.value)}
                  placeholder="Create Support Ticket"
                />
              </div>
              <div>
                <label className={labelClass}>
                  Internal name{' '}
                  <span className="text-gray-400 font-normal">(used by AI)</span>
                </label>
                <input
                  className={inputClass}
                  value={name}
                  onChange={e => { setName(e.target.value); setNameManuallyEdited(true) }}
                  placeholder="create_support_ticket"
                />
              </div>
              <div>
                <label className={labelClass}>
                  Description{' '}
                  <span className="text-gray-400 font-normal">(tell the AI when to use this)</span>
                </label>
                <textarea
                  className={`${inputClass} resize-none`}
                  rows={3}
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="Creates a support ticket when the user reports a problem or requests help."
                />
              </div>
            </div>
          </section>

          <hr style={{ borderColor: 'var(--color-shell-200)' }} />

          {/* 2. HTTP config */}
          <section>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-4">
              HTTP config
            </h3>
            <div className="space-y-3">
              <div>
                <label className={labelClass}>Method</label>
                <select
                  className={inputClass}
                  value={method}
                  onChange={e => setMethod(e.target.value as HttpMethod)}
                >
                  {(['GET', 'POST', 'PUT', 'PATCH', 'DELETE'] as const).map(m => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelClass}>Endpoint URL</label>
                <input
                  className={inputClass}
                  value={endpoint}
                  onChange={e => setEndpoint(e.target.value)}
                  placeholder="https://api.yourapp.com/tickets"
                />
              </div>
            </div>
          </section>

          <hr style={{ borderColor: 'var(--color-shell-200)' }} />

          {/* 3. Headers */}
          <section>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-4">
              Headers
            </h3>
            <div className="space-y-2">
              {headers.map((row, i) => (
                <div key={i} className="flex gap-2 items-center">
                  <input
                    className={`${inputClass} flex-1`}
                    value={row.key}
                    onChange={e => updateHeader(i, 'key', e.target.value)}
                    placeholder="Authorization"
                  />
                  <input
                    className={`${inputClass} flex-1`}
                    value={row.value}
                    onChange={e => updateHeader(i, 'value', e.target.value)}
                    placeholder="Bearer sk-..."
                  />
                  <button
                    onClick={() => removeHeader(i)}
                    className="flex-shrink-0 text-gray-400 hover:text-red-500 transition-colors"
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ))}
              <button
                onClick={addHeader}
                className="text-xs font-medium text-indigo-600 hover:text-indigo-800 transition-colors"
              >
                + Add header
              </button>
            </div>
          </section>

          <hr style={{ borderColor: 'var(--color-shell-200)' }} />

          {/* 4. Parameters */}
          <section>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-4">
              Parameters
            </h3>
            <div className="space-y-2">
              {parameters.length > 0 && (
                <div className="grid grid-cols-[1fr_100px_1fr_auto_auto] gap-2 mb-1">
                  <span className="text-xs text-gray-400">Name</span>
                  <span className="text-xs text-gray-400">Type</span>
                  <span className="text-xs text-gray-400">Description</span>
                  <span className="text-xs text-gray-400">Req.</span>
                  <span />
                </div>
              )}
              {parameters.map((row, i) => (
                <div key={i} className="grid grid-cols-[1fr_100px_1fr_auto_auto] gap-2 items-center">
                  <input
                    className={inputClass}
                    value={row.name}
                    onChange={e => updateParam(i, 'name', e.target.value)}
                    placeholder="ticket_title"
                  />
                  <select
                    className={inputClass}
                    value={row.type}
                    onChange={e => updateParam(i, 'type', e.target.value as ParamType)}
                  >
                    <option value="string">string</option>
                    <option value="number">number</option>
                    <option value="boolean">boolean</option>
                  </select>
                  <input
                    className={inputClass}
                    value={row.description}
                    onChange={e => updateParam(i, 'description', e.target.value)}
                    placeholder="Short description"
                  />
                  <input
                    type="checkbox"
                    checked={row.required}
                    onChange={e => updateParam(i, 'required', e.target.checked)}
                    className="h-4 w-4 rounded border-gray-300 text-indigo-600"
                  />
                  <button
                    onClick={() => removeParam(i)}
                    className="text-gray-400 hover:text-red-500 transition-colors"
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ))}
              <button
                onClick={addParam}
                className="text-xs font-medium text-indigo-600 hover:text-indigo-800 transition-colors"
              >
                + Add parameter
              </button>
            </div>
          </section>

          <hr style={{ borderColor: 'var(--color-shell-200)' }} />

          {/* 5. Behaviour */}
          <section>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-4">
              Behaviour
            </h3>
            <div className="space-y-3">
              {(
                [
                  {
                    label:    'Require confirmation before executing',
                    sublabel: 'AI will ask the user to confirm before running this action',
                    checked:  requiresConfirmation,
                    onChange: setRequiresConfirmation,
                  },
                  {
                    label:    'Enabled',
                    sublabel: 'Disabled actions are not available to the AI',
                    checked:  enabled,
                    onChange: setEnabled,
                  },
                ] as const
              ).map(({ label, sublabel, checked, onChange }) => (
                <label key={label} className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={e => onChange(e.target.checked)}
                    className="mt-0.5 h-4 w-4 rounded border-gray-300 text-indigo-600"
                  />
                  <div>
                    <p className="text-sm font-medium text-gray-800">{label}</p>
                    <p className="text-xs text-gray-500">{sublabel}</p>
                  </div>
                </label>
              ))}
            </div>
          </section>
        </div>

        {/* Footer */}
        <div
          className="flex items-center justify-between px-6 py-4"
          style={{ borderTop: '1px solid var(--color-shell-200)' }}
        >
          {error !== null
            ? <p className="text-sm text-red-500 truncate max-w-[300px]">{error}</p>
            : <span />
          }
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="rounded-lg px-4 py-2 text-sm text-gray-600 hover:bg-[var(--color-shell-200)] transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={() => void handleSave()}
              disabled={saving || !displayName.trim() || !name.trim() || !endpoint.trim()}
              className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-80 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {saving ? 'Saving\u2026' : 'Save'}
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
