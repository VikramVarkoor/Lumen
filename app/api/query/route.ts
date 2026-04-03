import { NextRequest } from 'next/server'
import { streamClaude } from '@/lib/ai/anthropic'
import { streamOpenAI } from '@/lib/ai/openai'
import { streamGemini } from '@/lib/ai/gemini'
import { judgeWithClaude } from '@/lib/ai/anthropic'
import { computeAgreementScore } from '@/lib/utils/agreement'
import { saveQueryResult } from '@/lib/db/supabase'
import { supabase } from '@/lib/db/supabase'
import type { ModelId, ModelResponse, StreamChunk } from '@/types'

export const runtime = 'nodejs'
export const maxDuration = 120

const MODEL_STREAMERS: Record<
  ModelId,
  (prompt: string, onChunk: (t: string) => void) => Promise<{ content: string; durationMs: number }>
> = {
  'claude-sonnet-4-20250514': streamClaude,
  'gpt-4o': streamOpenAI,
  'gemini-2.0-flash': streamGemini,
}

function encodeChunk(chunk: StreamChunk): Uint8Array {
  return new TextEncoder().encode(`data: ${JSON.stringify(chunk)}\n\n`)
}

export async function POST(req: NextRequest) {
  const { query, selectedModels } = await req.json() as {
    query: string
    selectedModels: ModelId[]
  }

  if (!query?.trim() || !selectedModels?.length) {
    return new Response(JSON.stringify({ error: 'Invalid request' }), { status: 400 })
  }

  // Get user from auth header
  const authHeader = req.headers.get('authorization')
  let userId: string | undefined
  if (authHeader) {
    const token = authHeader.replace('Bearer ', '')
    const { data } = await supabase.auth.getUser(token)
    userId = data.user?.id
  }

  const stream = new ReadableStream({
    async start(controller) {
      const send = (chunk: StreamChunk) => {
        try { controller.enqueue(encodeChunk(chunk)) } catch {}
      }

      const responses: ModelResponse[] = []

      // Stream all selected models IN PARALLEL
      await Promise.all(
        selectedModels.map(async (modelId) => {
          try {
            let content = ''
            const { durationMs } = await MODEL_STREAMERS[modelId](
              query,
              (text) => {
                content += text
                send({ type: 'response_chunk', modelId, content: text })
              }
            )
            responses.push({ modelId, content, durationMs })
          } catch (err) {
            const error = err instanceof Error ? err.message : 'Unknown error'
            responses.push({ modelId, content: '', durationMs: 0, error })
            send({ type: 'error', modelId, content: error })
          }
        })
      )

      // Compute agreement score from raw text similarity
      const agreementScore = computeAgreementScore(responses)
      send({ type: 'agreement', agreement: agreementScore })

      // Judge model synthesizes the best answer
      try {
        const validResponses = responses.filter((r) => !r.error && r.content)
        let synthesis = ''

        if (validResponses.length === 1) {
          // Only one model responded — stream that directly as synthesis
          synthesis = validResponses[0].content
          for (let i = 0; i < synthesis.length; i += 20) {
            send({ type: 'synthesis_chunk', content: synthesis.slice(i, i + 20) })
          }
        } else if (validResponses.length > 1) {
          // Real synthesis with judge model
          let fullSynthesis = ''
          const result = await judgeWithClaude(query, validResponses)

          // Stream synthesis token by token
          for (let i = 0; i < result.synthesis.length; i += 15) {
            const chunk = result.synthesis.slice(i, i + 15)
            fullSynthesis += chunk
            send({ type: 'synthesis_chunk', content: chunk })
            await new Promise((r) => setTimeout(r, 8))
          }
          synthesis = result.synthesis
        }

        // Save to Supabase
        const queryId = await saveQueryResult({
          query,
          selectedModels,
          responses,
          synthesis,
          agreementScore,
          userId,
        })

        send({ type: 'done', queryId: queryId ?? undefined })
      } catch (err) {
        console.error('Judge error:', err)
        send({ type: 'done' })
      }

      controller.close()
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  })
}
