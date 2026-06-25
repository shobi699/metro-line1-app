'use client'

import { LiveManualFeed } from '@/components/shared/live-manual-feed'
import { AiChatInterface } from '@/components/shared/ai-chat-interface'

export default function AIAssistantPage() {
  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      {/* Live Manual Feed (1/3 on desktop) */}
      <div className="hidden md:flex md:w-1/3">
        <LiveManualFeed />
      </div>

      {/* AI Chat Interface (2/3 on desktop, full on mobile) */}
      <AiChatInterface />
    </div>
  )
}
