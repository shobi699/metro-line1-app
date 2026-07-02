import { prisma } from '@/server/db'
import { getAdapter, ProviderConfig, AIResponse } from './adapters'

export class AIGateway {
  /**
   * Routes the prompt to the best available AI provider based on priority and health.
   * Includes fallback and circuit breaker logic.
   */
  static async routeRequest(prompt: string): Promise<AIResponse> {
    // Get all active providers sorted by priority
    const providers = await prisma.aiProvider.findMany({
      where: { isActive: true },
      orderBy: { priority: 'asc' },
    })

    if (providers.length === 0) {
      throw new Error('No active AI providers available')
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
        
        // Timeout wrapper
        const response = await this.withTimeout(
          adapter.chat(prompt, provider),
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

    throw new Error('All AI providers failed to respond')
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
