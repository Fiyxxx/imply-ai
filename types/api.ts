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

export interface ActionParameter {
  name:        string
  type:        'string' | 'number' | 'boolean'
  description: string
  required:    boolean
}

export interface ActionItem {
  id:                   string
  name:                 string
  displayName:          string
  description:          string
  method:               'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
  endpoint:             string
  parameters:           ActionParameter[]
  requiresConfirmation: boolean
  enabled:              boolean
  createdAt:            string
}

export interface ActionDetail extends ActionItem {
  headers: Record<string, string>
}

export interface CandidateAction {
  name:        string
  displayName: string
  description: string
  method:      'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
  endpoint:    string
  parameters:  ActionParameter[]
}
