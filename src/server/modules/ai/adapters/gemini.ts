import { GoogleGenerativeAI, Part } from '@google/generative-ai'
import { AIProviderAdapter, AIResponse, ProviderConfig } from './index'
import { RouteOptions } from '../gateway'

export class GeminiAdapter implements AIProviderAdapter {
  async chat(prompt: string, config: ProviderConfig, options?: RouteOptions): Promise<AIResponse> {
    if (!config.apiKey) {
      throw new Error(`Gemini API key is missing for provider ${config.name}`)
    }

    const genAI = new GoogleGenerativeAI(config.apiKey)
    const model = genAI.getGenerativeModel({
      model: config.modelName || 'gemini-2.0-flash',
    })

    const parts: (string | Part)[] = [prompt]
    
    if (options?.imageUrl && options.imageUrl.startsWith('data:image')) {
      const mimeType = options.imageUrl.split(';')[0].split(':')[1]
      const base64Data = options.imageUrl.split(',')[1]
      parts.push({
        inlineData: {
          data: base64Data,
          mimeType
        }
      })
    }

    const result = await model.generateContent(parts)
    const response = await result.response
    const text = response.text()

    return {
      text,
      usedProvider: config.name,
    }
  }

  async *chatStream(prompt: string, config: ProviderConfig, options?: RouteOptions): AsyncGenerator<string, void, unknown> {
    if (!config.apiKey) {
      throw new Error(`Gemini API key is missing for provider ${config.name}`)
    }

    const genAI = new GoogleGenerativeAI(config.apiKey)
    const model = genAI.getGenerativeModel({
      model: config.modelName || 'gemini-2.0-flash',
    })

    const parts: (string | Part)[] = [prompt]
    
    if (options?.imageUrl && options.imageUrl.startsWith('data:image')) {
      const mimeType = options.imageUrl.split(';')[0].split(':')[1]
      const base64Data = options.imageUrl.split(',')[1]
      parts.push({
        inlineData: {
          data: base64Data,
          mimeType
        }
      })
    }

    const result = await model.generateContentStream(parts)
    for await (const chunk of result.stream) {
      const text = chunk.text()
      if (text) {
        yield text
      }
    }
  }
}
