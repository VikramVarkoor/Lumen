import Groq from 'groq-sdk'

const client = new Groq({
  apiKey: process.env.GROQ_API_KEY || '',
})

export async function streamClaude(
  prompt: string,
  onChunk: (text: string) => void
): Promise<{ content: string; durationMs: number }> {
  const start = Date.now()
  let content = ''

  const stream = await client.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    max_tokens: 2048,
    stream: true,
    messages: [{ role: 'user', content: prompt }],
  })

  for await (const chunk of stream) {
    const delta = chunk.choices[0]?.delta?.content
    if (delta) { content += delta; onChunk(delta) }
  }

  return { content, durationMs: Date.now() - start }
}

export async function judgeWithClaude(
  query: string,
  responses: { modelId: string; content: string }[]
): Promise<{ synthesis: string; agreementScore: number }> {
  const prompt = `You are an expert AI synthesis engine. Multiple AI models answered the same query. Your job is to synthesize the BEST possible answer.

Query: "${query}"

Model Responses:
${responses.map((r) => `=== ${r.modelId} ===\n${r.content}`).join('\n\n')}

Rules:
- Write a synthesis that is BETTER than any individual response
- Use clear markdown formatting: ## headers, bullet points (- item), **bold** for key terms
- Structure it with a brief intro, then organized sections with bullets
- Be direct and concrete, not wishy-washy
- Highlight where models agreed AND where they diverged with different perspectives

Return ONLY a raw JSON object, no backticks, no markdown wrapper, starting with { and ending with }:
{"synthesis": "## Your Title Here\\n\\nIntro paragraph...\\n\\n## Key Points\\n- Point one\\n- Point two\\n\\n## Conclusion\\nFinal take.", "agreementScore": <0-100>}`

  const result = await client.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    max_tokens: 2048,
    messages: [{ role: 'user', content: prompt }],
  })

  const text = result.choices[0]?.message?.content || ''

  try {
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) throw new Error('No JSON')
    const parsed = JSON.parse(jsonMatch[0])
    return {
      synthesis: parsed.synthesis || '',
      agreementScore: Math.min(100, Math.max(0, parsed.agreementScore || 50)),
    }
  } catch {
    return { synthesis: text, agreementScore: 50 }
  }
}

export async function getJudgeVerdict(
  query: string,
  responses: { modelId: string; modelName: string; content: string }[]
): Promise<{
  best: string
  reasoning: string
  scores: { modelId: string; score: number; critique: string }[]
}> {
  const validIds = responses.map(r => r.modelId)

  const prompt = `You are a strict but fair AI judge. Three AI models answered the same query. Evaluate each response and pick the best one.

Query: "${query}"

Responses:
${responses.map((r) => `=== ${r.modelName} (modelId: ${r.modelId}) ===\n${r.content}`).join('\n\n')}

Score each model 1-10. Consider: accuracy, depth, clarity, and usefulness.

CRITICAL: You MUST use these exact modelId values in your response: ${validIds.join(', ')}

Return ONLY a raw JSON object, no backticks, no extra text:
{"best": "<one of the modelIds above>", "reasoning": "<2-3 sentences on why that model won>", "scores": [{"modelId": "<exact modelId>", "score": <1-10>, "critique": "<one punchy sentence>"}, {"modelId": "<exact modelId>", "score": <1-10>, "critique": "<one punchy sentence>"}, {"modelId": "<exact modelId>", "score": <1-10>, "critique": "<one punchy sentence>"}]}`

  const result = await client.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    max_tokens: 1024,
    messages: [{ role: 'user', content: prompt }],
  })

  const text = result.choices[0]?.message?.content || ''

  try {
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) throw new Error('No JSON')
    const parsed = JSON.parse(jsonMatch[0])

    // Force valid modelIds in case the judge hallucinated
    parsed.scores = (parsed.scores || []).map((s: any, i: number) => ({
      ...s,
      modelId: validIds.includes(s.modelId) ? s.modelId : validIds[i] || validIds[0],
    }))

    // Ensure all 3 models are scored
    validIds.forEach((id, i) => {
      if (!parsed.scores.find((s: any) => s.modelId === id)) {
        parsed.scores.push({ modelId: id, score: 7, critique: 'No critique available.' })
      }
    })

    if (!validIds.includes(parsed.best)) parsed.best = validIds[0]

    return parsed
  } catch {
    return {
      best: responses[0].modelId,
      reasoning: 'Could not determine verdict.',
      scores: responses.map(r => ({ modelId: r.modelId, score: 7, critique: 'No critique available.' }))
    }
  }
}