import Anthropic from '@anthropic-ai/sdk'
import { ClaudeAPIError } from './errors'

const MODEL = 'claude-sonnet-4-5-20250929'
const MAX_TOKENS = 1024

export interface ActionDescriptor {
  readonly name: string
  readonly description: string
}

export interface ChatMessage {
  readonly role: 'user' | 'assistant'
  readonly content: string
}

/**
 * Exported for testing. Builds the full prompt string from components.
 */
export function buildPrompt(
  systemPrompt: string,
  context: readonly string[],
  userMessage: string,
  availableActions: readonly ActionDescriptor[]
): string {
  const parts: string[] = [systemPrompt]

  if (context.length > 0) {
    parts.push('\nRelevant context from the knowledge base:\n')
    context.forEach((ctx, i) => {
      parts.push(`[${i + 1}] ${ctx}`)
    })
  }

  if (availableActions.length > 0) {
    parts.push('\nAvailable actions you can suggest:')
    availableActions.forEach(action => {
      parts.push(`- ${action.name}: ${action.description}`)
    })
    parts.push(
      '\nWhen suggesting an action, use EXACTLY this format at the end of your response:',
      'ACTION: <action_name>',
      'PARAMETERS: <json object>',
      'EXPLANATION: <one sentence explaining what will happen>'
    )
  }

  parts.push(`\nUser: ${userMessage}`)

  return parts.join('\n')
}

export class ClaudeClient {
  private _anthropic: Anthropic | null = null

  private getClient(): Anthropic {
    if (!this._anthropic) {
      this._anthropic = new Anthropic({
        apiKey: process.env.ANTHROPIC_API_KEY
      })
    }
    return this._anthropic
  }

  async chat(
    systemPrompt: string,
    context: readonly string[],
    userMessage: string,
    availableActions: readonly ActionDescriptor[],
    history: readonly ChatMessage[] = []
  ): Promise<string> {
    try {
      const prompt = buildPrompt(systemPrompt, context, userMessage, availableActions)

      const messages: Anthropic.MessageParam[] = [
        ...history.map(m => ({ role: m.role, content: m.content } as Anthropic.MessageParam)),
        { role: 'user', content: prompt }
      ]

      const response = await this.getClient().messages.create({
        model: MODEL,
        max_tokens: MAX_TOKENS,
        messages
      })

      const textBlock = response.content.find(c => c.type === 'text')
      if (!textBlock || textBlock.type !== 'text') {
        throw new ClaudeAPIError('No text content in response', 500)
      }

      return textBlock.text
    } catch (error) {
      if (error instanceof Anthropic.APIError) {
        throw new ClaudeAPIError(error.message, error.status ?? 500)
      }
      if (error instanceof ClaudeAPIError) {
        throw error
      }
      throw new ClaudeAPIError(`Chat failed: ${String(error)}`, 500)
    }
  }

  async *chatStream(
    systemPrompt: string,
    context: readonly string[],
    userMessage: string,
    availableActions: readonly ActionDescriptor[],
    history: readonly ChatMessage[] = []
  ): AsyncGenerator<string, void, unknown> {
    try {
      const prompt = buildPrompt(systemPrompt, context, userMessage, availableActions)

      const messages: Anthropic.MessageParam[] = [
        ...history.map(m => ({ role: m.role, content: m.content } as Anthropic.MessageParam)),
        { role: 'user', content: prompt }
      ]

      const stream = this.getClient().messages.stream({
        model: MODEL,
        max_tokens: MAX_TOKENS,
        messages
      })

      for await (const event of stream) {
        if (
          event.type === 'content_block_delta' &&
          event.delta.type === 'text_delta'
        ) {
          yield event.delta.text
        }
      }
    } catch (error) {
      if (error instanceof Anthropic.APIError) {
        throw new ClaudeAPIError(error.message, error.status ?? 500)
      }
      if (error instanceof ClaudeAPIError) {
        throw error
      }
      throw new ClaudeAPIError(`Stream failed: ${String(error)}`, 500)
    }
  }
}

export function createClaudeClient(): ClaudeClient {
  return new ClaudeClient()
}
