import { GoogleGenerativeAI } from '@google/generative-ai'
import { AIProviderAdapter, AIResponse, ProviderConfig } from './index'

export class GeminiAdapter implements AIProviderAdapter {
  async chat(prompt: string, config: ProviderConfig): Promise<AIResponse> {
    if (!config.apiKey) {
      throw new Error(`Gemini API key is missing for provider ${config.name}`)
    }

    // Gemini doesn't use standard baseUrl override easily in the official SDK,
    // but we can initialize it directly with the API key.
    const genAI = new GoogleGenerativeAI(config.apiKey)
    const model = genAI.getGenerativeModel({
      model: config.modelName || 'gemini-2.0-flash',
    })

    const result = await model.generateContent(prompt)
    const response = await result.response
    const text = response.text()

    return {
      text,
      usedProvider: config.name,
    }
  }

  async *chatStream(prompt: string, config: ProviderConfig): AsyncGenerator<string, void, unknown> {
    if (!config.apiKey) {
      throw new Error(`Gemini API key is missing for provider ${config.name}`)
    }

    const genAI = new GoogleGenerativeAI(config.apiKey)
    const model = genAI.getGenerativeModel({
      model: config.modelName || 'gemini-2.0-flash',
    })

    const result = await model.generateContentStream(prompt)
    for await (const chunk of result.stream) {
      const text = chunk.text()
      if (text) {
        yield text
      }
    }
  }
}
