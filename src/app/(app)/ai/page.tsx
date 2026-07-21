'use client'

import { LiveManualFeed } from '@/components/shared/live-manual-feed'
import { AiChatInterface } from '@/components/shared/ai-chat-interface'

export default function AIAssistantPage() {
  return (
    <div className="flex h-screen w-full flex-col md:flex-row overflow-hidden bg-background">
      {/* Live Manual Feed (30% on desktop) */}
      <div className="hidden md:flex md:w-[30%] h-full shrink-0 border-e border-border">
        <LiveManualFeed />
      </div>

      {/* AI Chat Interface (70% on desktop, full on mobile) */}
      <div className="flex-1 h-full min-w-0">
        <AiChatInterface />
      </div>
    </div>
  )
}
