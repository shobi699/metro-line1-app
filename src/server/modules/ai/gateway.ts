import { prisma } from '@/server/db'
import { getAdapter, ProviderConfig, AIResponse } from './adapters'

export interface RouteOptions {
  preferredModel?: string
  imageUrl?: string
}

export class AIGateway {
  /**
   * Routes the prompt to the best available AI provider based on priority and health.
   * Includes fallback and circuit breaker logic.
   */
  static async routeRequest(prompt: string, options?: RouteOptions | string): Promise<AIResponse> {
    const preferredModel = typeof options === 'string' ? options : options?.preferredModel
    let providers: ProviderConfig[] = []
    if (preferredModel) {
      providers = await prisma.aiProvider.findMany({
        where: {
          isActive: true,
          OR: [
            { name: { contains: preferredModel } },
            { modelName: { contains: preferredModel } },
            { providerType: preferredModel }
          ]
        },
        orderBy: { priority: 'asc' },
      })
    }
    
    // Fetch all active providers as a fallback
    const allProviders = await prisma.aiProvider.findMany({
      where: { isActive: true },
      orderBy: { priority: 'asc' },
    })

    // Merge them, keeping preferred ones at the front and avoiding duplicates
    for (const p of allProviders) {
      if (!providers.some(existing => existing.id === p.id)) {
        providers.push(p)
      }
    }

    if (providers.length === 0) {
      throw new Error('هیچ سرویس‌دهنده هوش مصنوعی فعالی یافت نشد.')
    }

    for (const provider of providers) {
      // Circuit Breaker Check
      if (provider.consecutiveFailures >= 3 && provider.lastFailureAt) {
        const minutesSinceFailure = (Date.now() - provider.lastFailureAt.getTime()) / 60000
        if (minutesSinceFailure < 5) {
          console.log(`[AI Gateway] Skipping provider ${provider.name} (Circuit open)`)
          continue
        }
      }

      try {
        const adapter = await getAdapter(provider)
        
        const reqOptions = typeof options === 'string' ? undefined : options

        // Timeout wrapper
        const response = await this.withTimeout(
          adapter.chat(prompt, provider, reqOptions),
          provider.timeoutMs
        )

        // On success, reset failures if it had any
        if (provider.consecutiveFailures > 0) {
          await prisma.aiProvider.update({
            where: { id: provider.id },
            data: {
              consecutiveFailures: 0,
              healthStatus: 'healthy',
            },
          })
        }

        return response
      } catch (err: any) {
        console.error(`[AI Gateway] Provider ${provider.name} failed:`, err.message)
        
        // Increment failure count
        await prisma.aiProvider.update({
          where: { id: provider.id },
          data: {
            consecutiveFailures: { increment: 1 },
            lastFailureAt: new Date(),
            healthStatus: provider.consecutiveFailures >= 2 ? 'down' : 'degraded',
          },
        })
        
        // Try the next provider in the loop
        continue
      }
    }

    throw new Error('ارتباط با تمامی سرویس‌دهنده‌های هوش مصنوعی قطع می‌باشد. لطفاً دقایقی دیگر تلاش کنید.')
  }

  /**
   * Streams the response from the best available AI provider.
   */
  static async *routeRequestStream(prompt: string, options?: RouteOptions | string): AsyncGenerator<{ token: string; provider: string }, void, unknown> {
    const preferredModel = typeof options === 'string' ? options : options?.preferredModel
    let providers: ProviderConfig[] = []
    if (preferredModel) {
      providers = await prisma.aiProvider.findMany({
        where: {
          isActive: true,
          OR: [
            { name: { contains: preferredModel } },
            { modelName: { contains: preferredModel } },
            { providerType: preferredModel }
          ]
        },
        orderBy: { priority: 'asc' },
      })
    }
    
    // Fetch all active providers as a fallback
    const allProviders = await prisma.aiProvider.findMany({
      where: { isActive: true },
      orderBy: { priority: 'asc' },
    })

    // Merge them, keeping preferred ones at the front and avoiding duplicates
    for (const p of allProviders) {
      if (!providers.some(existing => existing.id === p.id)) {
        providers.push(p)
      }
    }

    if (providers.length === 0) {
      throw new Error('هیچ سرویس‌دهنده هوش مصنوعی فعالی یافت نشد.')
    }

    for (const provider of providers) {
      // Circuit Breaker Check
      if (provider.consecutiveFailures >= 3 && provider.lastFailureAt) {
        const minutesSinceFailure = (Date.now() - provider.lastFailureAt.getTime()) / 60000
        if (minutesSinceFailure < 5) {
          console.log(`[AI Gateway] Skipping provider ${provider.name} (Circuit open)`)
          continue
        }
      }

      try {
        const adapter = await getAdapter(provider)
        const reqOptions = typeof options === 'string' ? undefined : options

        if (adapter.chatStream) {
          const stream = adapter.chatStream(prompt, provider, reqOptions)
          for await (const chunk of stream) {
            yield { token: chunk, provider: provider.name }
          }
        } else {
          // Fallback to non-streaming chat
          const response = await this.withTimeout(
            adapter.chat(prompt, provider, reqOptions),
            provider.timeoutMs
          )
          yield { token: response.text, provider: provider.name }
        }

        // On success, reset failures if it had any
        if (provider.consecutiveFailures > 0) {
          await prisma.aiProvider.update({
            where: { id: provider.id },
            data: {
              consecutiveFailures: 0,
              healthStatus: 'healthy',
            },
          })
        }

        return
      } catch (err: any) {
        console.error(`[AI Gateway] Provider ${provider.name} failed:`, err.message)
        
        await prisma.aiProvider.update({
          where: { id: provider.id },
          data: {
            consecutiveFailures: { increment: 1 },
            lastFailureAt: new Date(),
            healthStatus: provider.consecutiveFailures >= 2 ? 'down' : 'degraded',
          },
        })
        
        continue
      }
    }

    throw new Error('ارتباط با تمامی سرویس‌دهنده‌های هوش مصنوعی قطع می‌باشد. لطفاً دقایقی دیگر تلاش کنید.')
  }

  private static withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        reject(new Error(`Timeout of ${ms}ms exceeded`))
      }, ms)

      promise
        .then((value) => {
          clearTimeout(timer)
          resolve(value)
        })
        .catch((err) => {
          clearTimeout(timer)
          reject(err)
        })
    })
  }
}
