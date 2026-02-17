import { db } from './db'
import { AuthenticationError, AuthorizationError, NotFoundError } from './errors'
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

/**
 * Dashboard-safe project check.
 *
 * If an API key is present (widget request) → full key + ownership validation.
 * If no API key (dashboard request) → just verify the project exists by ID.
 *
 * TODO: replace the no-key branch with session auth once auth (NextAuth/Clerk)
 * is added to the dashboard.
 */
export async function requireProjectAccess(
  apiKey: string | null,
  projectId: string
): Promise<Project> {
  if (apiKey) {
    return validateProjectAccess(apiKey, projectId)
  }

  const project = await db.project.findUnique({ where: { id: projectId } })
  if (!project) throw new NotFoundError('Project')
  return project
}
