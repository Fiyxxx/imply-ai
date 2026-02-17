import OpenAI from 'openai'
import { ClaudeAPIError } from './errors'

const MODEL = 'gpt-5'
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
  private _openai: OpenAI | null = null

  private getClient(): OpenAI {
    if (!this._openai) {
      this._openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY
      })
    }
    return this._openai
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

      const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
        { role: 'system', content: systemPrompt },
        ...history.map(m => ({ role: m.role, content: m.content }) satisfies OpenAI.Chat.ChatCompletionMessageParam),
        { role: 'user', content: prompt }
      ]

      const response = await this.getClient().chat.completions.create({
        model: MODEL,
        max_tokens: MAX_TOKENS,
        messages
      })

      const content = response.choices[0]?.message?.content
      if (!content) {
        throw new ClaudeAPIError('No content in response', 500)
      }

      return content
    } catch (error) {
      if (error instanceof OpenAI.APIError) {
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

      const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
        { role: 'system', content: systemPrompt },
        ...history.map(m => ({ role: m.role, content: m.content }) satisfies OpenAI.Chat.ChatCompletionMessageParam),
        { role: 'user', content: prompt }
      ]

      const stream = await this.getClient().chat.completions.create({
        model: MODEL,
        max_tokens: MAX_TOKENS,
        messages,
        stream: true
      })

      for await (const chunk of stream) {
        const delta = chunk.choices[0]?.delta?.content
        if (delta) {
          yield delta
        }
      }
    } catch (error) {
      if (error instanceof OpenAI.APIError) {
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
