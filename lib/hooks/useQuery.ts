'use client'

import { useState, useCallback, useRef } from 'react'
import { useAuth } from './useAuth'
import type { ModelId, AgreementScore, StreamChunk } from '@/types'

export interface ModelState {
  content: string
  isStreaming: boolean
  durationMs?: number
  error?: string
}

export interface QueryState {
  isLoading: boolean
  modelStates: Record<ModelId, ModelState>
  synthesis: string
  isSynthesizing: boolean
  agreementScore: AgreementScore | null
  queryId: string | null
  error: string | null
}

const initialModelState = (): ModelState => ({
  content: '',
  isStreaming: false,
})

export function useQuery() {
  const { session } = useAuth()
  const [state, setState] = useState<QueryState>({
    isLoading: false,
    modelStates: {} as Record<ModelId, ModelState>,
    synthesis: '',
    isSynthesizing: false,
    agreementScore: null,
    queryId: null,
    error: null,
  })

  const abortRef = useRef<AbortController | null>(null)

  const runQuery = useCallback(
    async (query: string, selectedModels: ModelId[]) => {
      if (abortRef.current) abortRef.current.abort()
      abortRef.current = new AbortController()

      // Init state
      const initModelStates = {} as Record<ModelId, ModelState>
      selectedModels.forEach((m) => {
        initModelStates[m] = { ...initialModelState(), isStreaming: true }
      })

      setState({
        isLoading: true,
        modelStates: initModelStates,
        synthesis: '',
        isSynthesizing: false,
        agreementScore: null,
        queryId: null,
        error: null,
      })

      try {
        const headers: Record<string, string> = {
          'Content-Type': 'application/json',
        }
        if (session?.access_token) {
          headers['Authorization'] = `Bearer ${session.access_token}`
        }

        const res = await fetch('/api/query', {
          method: 'POST',
          headers,
          body: JSON.stringify({ query, selectedModels }),
          signal: abortRef.current.signal,
        })

        if (!res.ok || !res.body) throw new Error('Stream failed')

        const reader = res.body.getReader()
        const decoder = new TextDecoder()
        let buffer = ''

        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          buffer += decoder.decode(value, { stream: true })
          const lines = buffer.split('\n\n')
          buffer = lines.pop() ?? ''

          for (const line of lines) {
            if (!line.startsWith('data: ')) continue
            try {
              const chunk: StreamChunk = JSON.parse(line.slice(6))
              handleChunk(chunk)
            } catch {}
          }
        }

        setState((s) => ({ ...s, isLoading: false, isSynthesizing: false }))
      } catch (err) {
        if ((err as Error).name === 'AbortError') return
        setState((s) => ({
          ...s,
          isLoading: false,
          error: (err as Error).message,
        }))
      }
    },
    [session]
  )

  function handleChunk(chunk: StreamChunk) {
    switch (chunk.type) {
      case 'response_chunk':
        if (!chunk.modelId) break
        setState((s) => ({
          ...s,
          modelStates: {
            ...s.modelStates,
            [chunk.modelId!]: {
              ...s.modelStates[chunk.modelId!],
              content: (s.modelStates[chunk.modelId!]?.content ?? '') + (chunk.content ?? ''),
              isStreaming: true,
            },
          },
        }))
        break

      case 'error':
        if (!chunk.modelId) break
        setState((s) => ({
          ...s,
          modelStates: {
            ...s.modelStates,
            [chunk.modelId!]: {
              ...s.modelStates[chunk.modelId!],
              isStreaming: false,
              error: chunk.content,
            },
          },
        }))
        break

      case 'agreement':
        // Mark all models done streaming
        setState((s) => {
          const updated = { ...s.modelStates }
          Object.keys(updated).forEach((k) => {
            updated[k as ModelId] = { ...updated[k as ModelId], isStreaming: false }
          })
          return {
            ...s,
            modelStates: updated,
            agreementScore: chunk.agreement ?? null,
            isSynthesizing: true,
          }
        })
        break

      case 'synthesis_chunk':
        setState((s) => ({
          ...s,
          synthesis: s.synthesis + (chunk.content ?? ''),
          isSynthesizing: true,
        }))
        break

      case 'done':
        setState((s) => ({
          ...s,
          isLoading: false,
          isSynthesizing: false,
          queryId: chunk.queryId ?? null,
        }))
        break
    }
  }

  const reset = useCallback(() => {
    setState({
      isLoading: false,
      modelStates: {} as Record<ModelId, ModelState>,
      synthesis: '',
      isSynthesizing: false,
      agreementScore: null,
      queryId: null,
      error: null,
    })
  }, [])

  return { ...state, runQuery, reset }
}
