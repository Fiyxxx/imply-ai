import { z } from 'zod'

export const ChatRequestSchema = z.object({
  projectId: z.string().uuid(),
  message: z.string().min(1).max(2000),
  conversationId: z.string().uuid().optional()
})

export const DocumentUploadSchema = z.object({
  projectId: z.string().uuid(),
  collection: z.string().min(1).default('default'),
  metadata: z.record(z.string(), z.unknown()).optional()
})

export const ActionExecuteSchema = z.object({
  actionId: z.string().uuid(),
  parameters: z.record(z.string(), z.unknown()),
  conversationId: z.string().uuid()
})

export type ChatRequest = z.infer<typeof ChatRequestSchema>
export type ActionExecuteRequest = z.infer<typeof ActionExecuteSchema>

export const ActionParameterSchema = z.object({
  name:        z.string().min(1).max(64),
  type:        z.enum(['string', 'number', 'boolean']),
  description: z.string().min(1).max(200),
  required:    z.boolean(),
})

export const CreateActionSchema = z.object({
  name:                 z.string().regex(/^[a-z][a-z0-9_]*$/, {
    message: 'Name must start with a lowercase letter and contain only lowercase letters, numbers, and underscores'
  }).max(64),
  displayName:          z.string().min(1).max(100),
  description:          z.string().min(1).max(500),
  method:               z.enum(['GET', 'POST', 'PUT', 'PATCH', 'DELETE']),
  endpoint:             z.string().url(),
  headers:              z.record(z.string(), z.string()).default({}),
  parameters:           z.array(ActionParameterSchema).default([]),
  requiresConfirmation: z.boolean().default(false),
  enabled:              z.boolean().default(true),
})

export const UpdateActionSchema = CreateActionSchema.partial()

export const OpenAPIImportSchema = z.object({
  url:  z.string().url().optional(),
  spec: z.string().min(1).optional(),
}).refine(data => data.url !== undefined || data.spec !== undefined, {
  message: 'Either url or spec must be provided'
})

export type CreateActionRequest = z.infer<typeof CreateActionSchema>
export type UpdateActionRequest = z.infer<typeof UpdateActionSchema>
export type OpenAPIImportRequest = z.infer<typeof OpenAPIImportSchema>
