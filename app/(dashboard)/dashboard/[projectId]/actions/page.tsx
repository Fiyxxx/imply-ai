'use client'

import { useEffect, useState, useCallback, type JSX } from 'react'
import { useParams } from 'next/navigation'
import type { ActionItem, ActionDetail, APIResponse } from '@/types/api'
import ActionPanel from '@/components/dashboard/ActionPanel'
import OpenAPIImportModal from '@/components/dashboard/OpenAPIImportModal'
import { HTTP_METHOD_COLORS } from '@/lib/utils'

export default function ActionsPage(): JSX.Element {
  const params    = useParams()
  const raw       = params['projectId']
  const projectId = typeof raw === 'string' ? raw : ''

  const [actions,    setActions]    = useState<ActionItem[]>([])
  const [loading,    setLoading]    = useState(true)
  const [panelOpen,  setPanelOpen]  = useState(false)
  const [editAction, setEditAction] = useState<ActionDetail | null>(null)
  const [importOpen, setImportOpen] = useState(false)
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)
  const [togglingId,      setTogglingId]      = useState<string | null>(null)

  const fetchActions = useCallback(async (): Promise<void> => {
    try {
      const res  = await fetch(`/api/projects/${projectId}/actions`)
      const json = await res.json() as APIResponse<ActionItem[]>
      if (res.ok) setActions(json.data ?? [])
    } finally {
      setLoading(false)
    }
  }, [projectId])

  useEffect(() => { void fetchActions() }, [fetchActions])

  async function handleToggleEnabled(action: ActionItem): Promise<void> {
    setTogglingId(action.id)
    // Optimistic update
    setActions(prev => prev.map(a => a.id === action.id ? { ...a, enabled: !a.enabled } : a))
    try {
      const res = await fetch(`/api/projects/${projectId}/actions/${action.id}`, {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ enabled: !action.enabled }),
      })
      if (!res.ok) {
        // Revert on failure
        setActions(prev => prev.map(a => a.id === action.id ? { ...a, enabled: action.enabled } : a))
      }
    } catch {
      setActions(prev => prev.map(a => a.id === action.id ? { ...a, enabled: action.enabled } : a))
    } finally {
      setTogglingId(null)
    }
  }

  async function handleDelete(id: string): Promise<void> {
    try {
      const res = await fetch(`/api/projects/${projectId}/actions/${id}`, { method: 'DELETE' })
      if (res.ok) {
        setActions(prev => prev.filter(a => a.id !== id))
      }
      // If not ok, leave the row in place — server still owns it
    } finally {
      setConfirmDeleteId(null)
    }
  }

  async function handleEditClick(action: ActionItem): Promise<void> {
    try {
      const res  = await fetch(`/api/projects/${projectId}/actions/${action.id}`)
      const json = await res.json() as APIResponse<ActionDetail>
      if (res.ok && json.data) {
        setEditAction(json.data)
        setPanelOpen(true)
      }
    } catch {
      // Network error — leave panel closed; user can retry
    }
  }

  function handleNewAction(): void {
    setEditAction(null)
    setPanelOpen(true)
  }

  function handlePanelSaved(): void {
    setPanelOpen(false)
    setEditAction(null)
    void fetchActions()
  }

  function handlePanelClose(): void {
    setPanelOpen(false)
    setEditAction(null)
  }

  return (
    <div className="mx-auto max-w-2xl">
      {/* Page header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Actions</h1>
          <p className="mt-1 text-sm text-gray-500">
            Define HTTP endpoints the AI can call on behalf of users.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setImportOpen(true)}
            className="rounded-lg border px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-[var(--color-shell-200)]"
            style={{ borderColor: 'var(--color-shell-200)', backgroundColor: 'var(--color-shell-50)' }}
          >
            Import from OpenAPI
          </button>
          <button
            onClick={handleNewAction}
            className="rounded-lg bg-gray-900 px-3 py-2 text-sm font-medium text-white hover:opacity-80 transition-opacity"
          >
            New action
          </button>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-14 animate-pulse rounded-xl bg-[var(--color-shell-200)]" />
          ))}
        </div>
      ) : actions.length === 0 ? (
        <div
          className="flex flex-col items-center justify-center rounded-2xl py-16 text-center"
          style={{ backgroundColor: 'var(--color-shell-50)', border: '1px solid var(--color-shell-200)' }}
        >
          <svg className="mb-4 h-10 w-10 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
          </svg>
          <p className="text-sm font-medium text-gray-600">No actions yet</p>
          <p className="mt-1 text-xs text-gray-400">
            Create an action to let the AI take real steps in your product.
          </p>
          <button
            onClick={handleNewAction}
            className="mt-4 rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:opacity-80 transition-opacity"
          >
            Create your first action
          </button>
        </div>
      ) : (
        <div
          className="rounded-2xl overflow-hidden"
          style={{ border: '1px solid var(--color-shell-200)' }}
        >
          <table className="w-full text-sm">
            <thead>
              <tr style={{ backgroundColor: 'var(--color-shell-100)', borderBottom: '1px solid var(--color-shell-200)' }}>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">Name</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">Method</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">Endpoint</th>
                <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-gray-400">Enabled</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {actions.map((action, i) => {
                const isConfirming = confirmDeleteId === action.id
                return (
                  <tr
                    key={action.id}
                    className="transition-colors"
                    style={{
                      backgroundColor: isConfirming
                        ? '#fef2f2'
                        : i % 2 === 0 ? 'white' : 'var(--color-shell-50)',
                      borderBottom: '1px solid var(--color-shell-200)',
                    }}
                  >
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-900">{action.displayName}</p>
                      <p className="text-xs text-gray-400 font-mono">{action.name}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center rounded px-1.5 py-0.5 text-xs font-semibold font-mono ${HTTP_METHOD_COLORS[action.method] ?? ''}`}
                      >
                        {action.method}
                      </span>
                    </td>
                    <td className="px-4 py-3 max-w-[240px]">
                      <span className="text-gray-600 text-xs font-mono truncate block">
                        {action.endpoint}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => void handleToggleEnabled(action)}
                        disabled={togglingId === action.id}
                        aria-label={action.enabled ? 'Disable action' : 'Enable action'}
                        className={`inline-flex h-5 w-9 items-center rounded-full transition-colors disabled:opacity-50 ${
                          action.enabled ? 'bg-gray-900' : 'bg-gray-200'
                        }`}
                      >
                        <span
                          className={`inline-block h-4 w-4 rounded-full bg-white shadow transition-transform ${
                            action.enabled ? 'translate-x-4' : 'translate-x-0.5'
                          }`}
                        />
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        {isConfirming ? (
                          <>
                            <span className="text-xs text-red-600 mr-1">Delete?</span>
                            <button
                              onClick={() => void handleDelete(action.id)}
                              className="rounded px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-100 transition-colors"
                            >
                              Yes
                            </button>
                            <button
                              onClick={() => setConfirmDeleteId(null)}
                              className="rounded px-2 py-1 text-xs text-gray-500 hover:bg-gray-100 transition-colors"
                            >
                              No
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              onClick={() => void handleEditClick(action)}
                              className="rounded-lg p-1.5 text-gray-400 hover:bg-[var(--color-shell-200)] hover:text-gray-700 transition-colors"
                            >
                              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125" />
                              </svg>
                            </button>
                            <button
                              onClick={() => setConfirmDeleteId(action.id)}
                              className="rounded-lg p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-500 transition-colors"
                            >
                              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                              </svg>
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {panelOpen && (
        <ActionPanel
          projectId={projectId}
          action={editAction}
          onClose={handlePanelClose}
          onSaved={handlePanelSaved}
        />
      )}

      {importOpen && (
        <OpenAPIImportModal
          projectId={projectId}
          onClose={() => setImportOpen(false)}
          onDone={() => { setImportOpen(false); void fetchActions() }}
        />
      )}
    </div>
  )
}
