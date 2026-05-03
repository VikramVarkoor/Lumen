import Groq from 'groq-sdk'

const client = new Groq({
  apiKey: process.env.GROQ_API_KEY || '',
})

export async function streamGemini(
  prompt: string,
  onChunk: (text: string) => void
): Promise<{ content: string; durationMs: number }> {
  const start = Date.now()
  let content = ''

  const stream = await client.chat.completions.create({
    model: 'moonshotai/kimi-k2-instruct-0905',
    max_tokens: 2048,
    stream: true,
    messages: [{ role: 'user', content: prompt }],
  })

  for await (const chunk of stream) {
    const delta = chunk.choices[0]?.delta?.content
    if (delta) {
      content += delta
      onChunk(delta)
    }
  }

  return { content, durationMs: Date.now() - start }
}