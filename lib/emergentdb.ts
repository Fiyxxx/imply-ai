import { EmergentDBError } from './errors'

export interface SearchResult {
  id: string
  score: number
  metadata: {
    documentId: string
    projectId: string
    content: string
    filename: string
    collection: string
  }
}

export interface SearchOptions {
  projectId: string
  topK?: number
  collections?: string[]
  threshold?: number
}

export class EmergentDBClient {
  private readonly baseUrl: string
  private readonly timeout: number

  constructor(config: { url?: string; timeout?: number } = {}) {
    this.baseUrl = config.url || process.env.EMERGENTDB_URL || ''
    this.timeout = config.timeout ?? 2000

    if (!this.baseUrl) {
      throw new Error('EMERGENTDB_URL is required')
    }
  }

  async search(
    embedding: number[],
    options: SearchOptions
  ): Promise<SearchResult[]> {
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), this.timeout)

      const response = await fetch(`${this.baseUrl}/search`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vector: embedding,
          k: options.topK ?? 5,
          filter: {
            projectId: options.projectId,
            collections: options.collections ?? ['all']
          }
        }),
        signal: controller.signal
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        throw new EmergentDBError(
          `Search failed: ${response.statusText}`,
          response.status
        )
      }

      const results = await response.json() as SearchResult[]

      if (options.threshold !== undefined) {
        return results.filter(r => r.score >= (options.threshold as number))
      }

      return results
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        throw new EmergentDBError('Search timeout', 408)
      }
      if (error instanceof EmergentDBError) {
        throw error
      }
      throw new EmergentDBError(`Search failed: ${String(error)}`, 500)
    }
  }

  async insert(
    id: string,
    embedding: number[],
    metadata: Record<string, unknown>
  ): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/insert`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id,
          vector: embedding,
          metadata
        })
      })

      if (!response.ok) {
        throw new EmergentDBError(
          `Insert failed: ${response.statusText}`,
          response.status
        )
      }
    } catch (error) {
      if (error instanceof EmergentDBError) {
        throw error
      }
      throw new EmergentDBError(`Insert failed: ${String(error)}`, 500)
    }
  }

  async delete(id: string): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/delete/${id}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        throw new EmergentDBError(
          `Delete failed: ${response.statusText}`,
          response.status
        )
      }
    } catch (error) {
      if (error instanceof EmergentDBError) {
        throw error
      }
      throw new EmergentDBError(`Delete failed: ${String(error)}`, 500)
    }
  }
}

// Singleton instance - lazy initialized in services that need it
export function createEmergentDBClient(): EmergentDBClient {
  return new EmergentDBClient()
}
