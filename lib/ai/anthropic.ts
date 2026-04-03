import Groq from 'groq-sdk'

const client = new Groq({
  apiKey: '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',
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