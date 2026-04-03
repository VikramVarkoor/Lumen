import type { ModelId, AgreementScore, ModelResponse } from '@/types'

// Simple cosine-similarity-style text comparison using word overlap
function computeSimilarity(textA: string, textB: string): number {
  const normalize = (t: string) =>
    t
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .split(/\s+/)
      .filter(Boolean)

  const wordsA = new Set(normalize(textA))
  const wordsB = new Set(normalize(textB))

  if (wordsA.size === 0 || wordsB.size === 0) return 0

  const intersection = [...wordsA].filter((w) => wordsB.has(w)).length
  const union = new Set([...wordsA, ...wordsB]).size

  return Math.round((intersection / union) * 100)
}

export function computeAgreementScore(
  responses: ModelResponse[]
): AgreementScore {
  const validResponses = responses.filter((r) => !r.error && r.content)

  if (validResponses.length < 2) {
    return {
      score: 0,
      label: 'low',
      breakdown: [],
    }
  }

  const breakdown: AgreementScore['breakdown'] = []
  let totalSimilarity = 0
  let pairCount = 0

  for (let i = 0; i < validResponses.length; i++) {
    for (let j = i + 1; j < validResponses.length; j++) {
      const similarity = computeSimilarity(
        validResponses[i].content,
        validResponses[j].content
      )
      breakdown.push({
        modelA: validResponses[i].modelId,
        modelB: validResponses[j].modelId,
        similarity,
      })
      totalSimilarity += similarity
      pairCount++
    }
  }

  const score = pairCount > 0 ? Math.round(totalSimilarity / pairCount) : 0

  return {
    score,
    label: score >= 60 ? 'high' : score >= 35 ? 'medium' : 'low',
    breakdown,
  }
}
