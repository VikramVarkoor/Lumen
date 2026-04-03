export type ModelId = 
  | 'claude-sonnet-4-20250514'
  | 'gpt-4o'
  | 'gemini-2.0-flash'

export type ModelProvider = 'anthropic' | 'openai' | 'google'

export interface ModelConfig {
  id: ModelId
  provider: ModelProvider
  name: string
  color: string
  accentColor: string
}

export const MODELS: ModelConfig[] = [
  {
    id: 'claude-sonnet-4-20250514',
    provider: 'anthropic',
    name: 'Llama 3.3 70B',
    color: '#D4956A',
    accentColor: '#F5C49A',
  },
  {
    id: 'gpt-4o',
    provider: 'openai',
    name: 'Qwen 3 32B',
    color: '#74AA9C',
    accentColor: '#A8D5CC',
  },
  {
    id: 'gemini-2.0-flash',
    provider: 'google',
    name: 'Kimi K2',
    color: '#7B9FE0',
    accentColor: '#B0C9F5',
  },
]

export interface ModelResponse {
  modelId: ModelId
  content: string
  durationMs: number
  tokenCount?: number
  error?: string
}

export interface AgreementScore {
  score: number
  label: 'low' | 'medium' | 'high'
  breakdown: {
    modelA: ModelId
    modelB: ModelId
    similarity: number
  }[]
}

export interface JudgeVerdict {
  best: ModelId
  reasoning: string
  scores: {
    modelId: ModelId
    score: number
    critique: string
  }[]
}

export interface QueryResult {
  id: string
  query: string
  selectedModels: ModelId[]
  responses: ModelResponse[]
  synthesis: string
  agreementScore: AgreementScore
  verdict?: JudgeVerdict
  createdAt: string
  userId?: string
}

export interface StreamChunk {
  type: 'response_chunk' | 'synthesis_chunk' | 'agreement' | 'verdict' | 'error' | 'done'
  modelId?: ModelId
  content?: string
  agreement?: AgreementScore
  verdict?: JudgeVerdict
  queryId?: string
}

export interface SelectedModels {
  [key: string]: boolean
}