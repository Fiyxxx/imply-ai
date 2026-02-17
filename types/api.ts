export type APIResponse<T> =
  | { data: T; error?: never }
  | { data?: never; error: { message: string; code: string; metadata?: Record<string, unknown> } }

export interface DocumentSource {
  documentId: string
  filename: string
  content: string
  score: number
}

export interface ActionSuggestion {
  actionId: string
  name: string
  parameters: Record<string, unknown>
  explanation: string
  requiresConfirmation: boolean
}

export interface ChatResponse {
  messageId: string
  conversationId: string
  content: string
  sources: DocumentSource[]
  action?: ActionSuggestion
}
