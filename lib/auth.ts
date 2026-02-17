import { db } from './db'
import { AuthenticationError, AuthorizationError } from './errors'
import type { Project } from '@prisma/client'

export async function authenticateRequest(
  apiKey: string | null
): Promise<Project> {
  if (!apiKey) {
    throw new AuthenticationError('Missing X-Imply-Project-Key header')
  }

  const project = await db.project.findUnique({
    where: { apiKey }
  })

  if (!project) {
    throw new AuthenticationError('Invalid API key')
  }

  return project
}

export async function validateProjectAccess(
  apiKey: string | null,
  projectId: string
): Promise<Project> {
  const project = await authenticateRequest(apiKey)

  if (project.id !== projectId) {
    throw new AuthorizationError('API key does not have access to this project')
  }

  return project
}
