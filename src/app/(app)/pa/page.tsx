'use client'

import { TopAppBar } from '@/components/shared/top-app-bar'
import { StationMapSelector } from '@/components/shared/station-map-selector'
import { BroadcastHistory } from '@/components/shared/broadcast-history'
import { LiveMicControl } from '@/components/shared/live-mic-control'
import { AnnouncementLibrary } from '@/components/shared/announcement-library'

export default function PAPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <TopAppBar
        title="سیستم PA"
        subtitle="اعلان عمومی"
        showHealth
      />

      <main className="flex-1 overflow-y-auto p-4 pt-16 md:p-6">
        {/* Bento Grid: 7-col map + 5-col controls */}
        <div className="grid min-h-[600px] grid-cols-1 gap-4 md:grid-cols-12">
          {/* Left Column: Station Selector & Broadcast History (7 cols) */}
          <div className="flex flex-col gap-4 md:col-span-7">
            <StationMapSelector />
            <BroadcastHistory />
          </div>

          {/* Right Column: Controls (5 cols) */}
          <div className="flex flex-col gap-4 md:col-span-5">
            <LiveMicControl />
            <AnnouncementLibrary />
          </div>
        </div>
      </main>
    </div>
  )
}
