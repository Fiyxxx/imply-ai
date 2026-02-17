/**
 * End-to-end pipeline test
 * Tests: DB connection → embeddings → GPT-5 chat → pgvector search
 *
 * Run: npx tsx scripts/test-pipeline.ts
 */

// Load env BEFORE any other imports (dynamic imports used below)
import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

const GREEN = '\x1b[32m✓\x1b[0m'
const RED = '\x1b[31m✗\x1b[0m'
const YELLOW = '\x1b[33m⚠\x1b[0m'
const BOLD = '\x1b[1m'
const RESET = '\x1b[0m'

function pass(label: string, detail?: string) {
  console.log(`${GREEN} ${label}${detail ? ` — ${detail}` : ''}`)
}
function fail(label: string, error: unknown) {
  console.log(`${RED} ${label} — ${error instanceof Error ? error.message : String(error)}`)
}
function warn(label: string, detail: string) {
  console.log(`${YELLOW} ${label} — ${detail}`)
}

async function testDatabase(): Promise<string | null> {
  const { db } = await import('../lib/db')
  try {
    const project = await db.project.create({
      data: { name: 'E2E Test Project', apiKey: `test-${Date.now()}` }
    })
    pass('Database (Neon)', `Created project: ${project.id}`)
    return project.id
  } catch (error) {
    fail('Database (Neon)', error)
    return null
  }
}

async function testEmbeddings(): Promise<number[] | null> {
  const { generateEmbedding } = await import('../lib/embeddings')
  try {
    const embedding = await generateEmbedding('How do I reset my password?')
    pass('OpenAI Embeddings', `Vector length: ${embedding.length}`)
    return embedding
  } catch (error) {
    fail('OpenAI Embeddings', error)
    return null
  }
}

async function testGPT5Chat(): Promise<boolean> {
  const { createClaudeClient } = await import('../lib/claude')
  try {
    const client = createClaudeClient()
    const response = await client.chat(
      'You are a helpful assistant for a SaaS product.',
      ['Users can reset passwords via Settings → Security → Reset Password'],
      'How do I reset my password?',
      []
    )
    const preview = response.slice(0, 100).replace(/\n/g, ' ')
    pass('GPT-5 Chat', `"${preview}..."`)
    return true
  } catch (error) {
    fail('GPT-5 Chat', error)
    return false
  }
}

async function testPgvector(embedding: number[]): Promise<boolean> {
  const { db } = await import('../lib/db')
  try {
    const vectorLiteral = `[${embedding.join(',')}]`
    // Test that pgvector extension and operators are available
    await db.$queryRaw`SELECT ${vectorLiteral}::vector <=> ${vectorLiteral}::vector AS distance`
    pass('pgvector', 'Cosine similarity operator available')
    return true
  } catch (error) {
    fail('pgvector', error)
    return false
  }
}

async function cleanup(projectId: string) {
  const { db } = await import('../lib/db')
  try {
    await db.project.delete({ where: { id: projectId } })
    await db.$disconnect()
  } catch { /* ignore */ }
}

async function main() {
  console.log(`\n${BOLD}Imply Pipeline E2E Test${RESET}\n`)

  const projectId = await testDatabase()
  const embedding = await testEmbeddings()
  await testGPT5Chat()
  if (embedding) await testPgvector(embedding)

  console.log('')
  if (projectId) await cleanup(projectId)
}

main().catch(console.error)
