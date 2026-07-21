import { AIProviderAdapter, AIResponse, ProviderConfig } from './index'

export class OpenAICompatibleAdapter implements AIProviderAdapter {
  async chat(prompt: string, config: ProviderConfig): Promise<AIResponse> {
    if (!config.baseUrl) {
      throw new Error(`Base URL is missing for provider ${config.name}`)
    }

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    }

    if (config.apiKey) {
      headers['Authorization'] = `Bearer ${config.apiKey}`
    }

    if (config.extraHeaders) {
      try {
        const extra = JSON.parse(config.extraHeaders)
        Object.assign(headers, extra)
      } catch (e) {
        console.error('Failed to parse extra headers for provider', config.name)
      }
    }

    const body = {
      model: config.modelName || 'default',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
    }

    const res = await fetch(`${config.baseUrl}/chat/completions`, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    })

    if (!res.ok) {
      const errText = await res.text()
      throw new Error(`OpenAI API error (${res.status}): ${errText}`)
    }

    const data = await res.json()
    const text = data.choices?.[0]?.message?.content || ''

    return {
      text,
      usedProvider: config.name,
    }
  }

  async *chatStream(prompt: string, config: ProviderConfig): AsyncGenerator<string, void, unknown> {
    if (!config.baseUrl) {
      throw new Error(`Base URL is missing for provider ${config.name}`)
    }

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    }

    if (config.apiKey) {
      headers['Authorization'] = `Bearer ${config.apiKey}`
    }

    if (config.extraHeaders) {
      try {
        const extra = JSON.parse(config.extraHeaders)
        Object.assign(headers, extra)
      } catch (e) {
        console.error('Failed to parse extra headers for provider', config.name)
      }
    }

    const body = {
      model: config.modelName || 'default',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
      stream: true,
    }

    const res = await fetch(`${config.baseUrl}/chat/completions`, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    })

    if (!res.ok) {
      const errText = await res.text()
      throw new Error(`OpenAI API error (${res.status}): ${errText}`)
    }

    const reader = res.body?.getReader()
    if (!reader) return
    const decoder = new TextDecoder()
    let buffer = ''

    try {
      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() || ''

        for (const line of lines) {
          const cleanLine = line.trim()
          if (!cleanLine) continue
          if (cleanLine === 'data: [DONE]') break
          if (cleanLine.startsWith('data: ')) {
            try {
              const data = JSON.parse(cleanLine.substring(6))
              const text = data.choices?.[0]?.delta?.content || ''
              if (text) yield text
            } catch (e) {}
          }
        }
      }
    } finally {
      reader.releaseLock()
    }
  }
}
