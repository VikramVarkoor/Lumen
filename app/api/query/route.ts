import { NextRequest } from 'next/server'
import { streamClaude, judgeWithClaude, getJudgeVerdict } from '@/lib/ai/anthropic'
import { streamOpenAI } from '@/lib/ai/openai'
import { streamGemini } from '@/lib/ai/gemini'
import { computeAgreementScore } from '@/lib/utils/agreement'
import { saveQueryResult } from '@/lib/db/supabase'
import { supabase } from '@/lib/db/supabase'
import type { ModelId, ModelResponse, StreamChunk } from '@/types'
import { MODELS } from '@/types'

export const runtime = 'nodejs'
export const maxDuration = 120

const MODEL_STREAMERS: Record<ModelId, (prompt: string, onChunk: (t: string) => void) => Promise<{ content: string; durationMs: number }>> = {
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

      const agreementScore = computeAgreementScore(responses)
      send({ type: 'agreement', agreement: agreementScore })

      const validResponses = responses.filter((r) => !r.error && r.content)

      try {
        const [synthesisResult, verdictResult] = await Promise.all([
          judgeWithClaude(query, validResponses),
          validResponses.length >= 2
            ? getJudgeVerdict(
                query,
                validResponses.map(r => ({
                  modelId: r.modelId,
                  modelName: MODELS.find(m => m.id === r.modelId)?.name || r.modelId,
                  content: r.content,
                }))
              )
            : Promise.resolve(null),
        ])

        const synthesis = synthesisResult.synthesis
        for (let i = 0; i < synthesis.length; i += 15) {
          send({ type: 'synthesis_chunk', content: synthesis.slice(i, i + 15) })
          await new Promise((r) => setTimeout(r, 8))
        }

        if (verdictResult) {
          send({ type: 'verdict', verdict: verdictResult as any })
        }

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