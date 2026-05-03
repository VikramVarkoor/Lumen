import Groq from 'groq-sdk'

const client = new Groq({
  apiKey: process.env.GROQ_API_KEY || '',
})

export async function streamOpenAI(
  prompt: string,
  onChunk: (text: string) => void
): Promise<{ content: string; durationMs: number }> {
  const start = Date.now()
  let content = ''
  let inThinkBlock = false
  let buffer = ''

  const stream = await client.chat.completions.create({
    model: 'qwen/qwen3-32b',
    max_tokens: 2048,
    stream: true,
    messages: [{ role: 'user', content: prompt }],
  })

  for await (const chunk of stream) {
    const delta = chunk.choices[0]?.delta?.content
    if (delta) {
      buffer += delta
      // Strip <think>...</think> blocks
      while (true) {
        if (inThinkBlock) {
          const end = buffer.indexOf('</think>')
          if (end === -1) { buffer = ''; break }
          buffer = buffer.slice(end + 8)
          inThinkBlock = false
        } else {
          const start2 = buffer.indexOf('<think>')
          if (start2 === -1) {
            if (buffer) { content += buffer; onChunk(buffer); buffer = '' }
            break
          }
          const before = buffer.slice(0, start2)
          if (before) { content += before; onChunk(before) }
          buffer = buffer.slice(start2 + 7)
          inThinkBlock = true
        }
      }
    }
  }

  return { content, durationMs: Date.now() - start }
}