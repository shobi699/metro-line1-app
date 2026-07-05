import { AiProvider } from '@/generated/prisma/client'

export type ProviderConfig = AiProvider

export interface AIResponse {
  text: string
  usedProvider: string
  confidence?: number
}

export interface AIProviderAdapter {
  chat(prompt: string, config: ProviderConfig): Promise<AIResponse>
}

// Registry to lazily load adapters
const adapters: Record<string, () => Promise<new () => AIProviderAdapter>> = {
  gemini: async () => (await import('./gemini')).GeminiAdapter,
  openai_compatible: async () => (await import('./openai-compatible')).OpenAICompatibleAdapter,
}

export async function getAdapter(config: ProviderConfig): Promise<AIProviderAdapter> {
  const format = config.requestFormat || 'openai_compatible'
  const loadAdapter = adapters[format]
  
  if (!loadAdapter) {
    // Default to OpenAI compatible if format is unknown but provider is custom
    const loadDefault = adapters['openai_compatible']
    const AdapterClass = await loadDefault()
    return new AdapterClass()
  }

  const AdapterClass = await loadAdapter()
  return new AdapterClass()
}
