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
