import { prisma } from '@/server/db'

/**
 * Generate a unique 6-digit numeric pairing code.
 */
async function generateUniquePairCode(): Promise<string> {
  let attempts = 0
  while (attempts < 10) {
    const code = Math.floor(100000 + Math.random() * 900000).toString()
    const existing = await prisma.signageScreen.findUnique({ where: { pairCode: code } })
    if (!existing) return code
    attempts++
  }
  return Math.floor(100000 + Math.random() * 900000).toString()
}

export async function createSignageScreen(name: string, location?: string | null) {
  const pairCode = await generateUniquePairCode()
  return prisma.signageScreen.create({
    data: {
      name,
      location,
      pairCode,
      isOnline: false,
    },
  })
}

export async function updateSignageScreen(id: string, data: { name?: string; location?: string | null; playlistId?: string | null }) {
  return prisma.signageScreen.update({
    where: { id },
    data,
  })
}

export async function deleteSignageScreen(id: string) {
  return prisma.signageScreen.delete({
    where: { id },
  })
}

export async function listSignageScreens() {
  // Update online status in-memory for old seen screens
  const screens = await prisma.signageScreen.findMany({
    orderBy: { name: 'asc' },
  })

  // Screens with lastSeenAt older than 60s are considered offline
  const now = new Date()
  const threshold = new Date(now.getTime() - 60 * 1000)

  const updatedScreens = await Promise.all(
    screens.map(async (s) => {
      if (s.isOnline && s.lastSeenAt && s.lastSeenAt < threshold) {
        return prisma.signageScreen.update({
          where: { id: s.id },
          data: { isOnline: false },
        })
      }
      return s
    })
  )

  return updatedScreens
}

export async function pairSignageScreen(pairCode: string, name: string, location?: string | null) {
  const screen = await prisma.signageScreen.findUnique({
    where: { pairCode },
  })

  if (!screen) {
    throw new Error('کد جفت‌سازی نامعتبر است')
  }

  return prisma.signageScreen.update({
    where: { id: screen.id },
    data: {
      name,
      location: location ?? screen.location,
      isOnline: true,
      lastSeenAt: new Date(),
    },
  })
}

export async function pingSignageScreen(id: string) {
  return prisma.signageScreen.update({
    where: { id },
    data: {
      isOnline: true,
      lastSeenAt: new Date(),
    },
  })
}

// ─────────────────────────────────────────────────────────────────────────────
// Playlists
// ─────────────────────────────────────────────────────────────────────────────

export async function createSignagePlaylist(name: string, items: any[]) {
  return prisma.signagePlaylist.create({
    data: {
      name,
      items: items as any,
      isActive: true,
    },
  })
}

export async function updateSignagePlaylist(id: string, data: { name?: string; items?: any[]; isActive?: boolean }) {
  return prisma.signagePlaylist.update({
    where: { id },
    data: {
      ...(data.name !== undefined ? { name: data.name } : {}),
      ...(data.items !== undefined ? { items: data.items as any } : {}),
      ...(data.isActive !== undefined ? { isActive: data.isActive } : {}),
    },
  })
}

export async function deleteSignagePlaylist(id: string) {
  return prisma.signagePlaylist.delete({
    where: { id },
  })
}

export async function listSignagePlaylists() {
  return prisma.signagePlaylist.findMany({
    orderBy: { name: 'asc' },
  })
}

/**
 * Fetch a screen's active playlist and resolve its items dynamically (e.g. fetching Post details).
 */
export async function getSignageScreenPlaylist(screenId: string) {
  const screen = await prisma.signageScreen.findUnique({
    where: { id: screenId },
  })

  if (!screen || !screen.playlistId) {
    return { playlistName: 'پیش‌فرض', items: [] }
  }

  const playlist = await prisma.signagePlaylist.findUnique({
    where: { id: screen.playlistId },
  })

  if (!playlist || !playlist.isActive) {
    return { playlistName: 'پیش‌فرض', items: [] }
  }

  const resolvedItems: any[] = []
  const rawItems = playlist.items as any[]

  for (const item of rawItems) {
    // item format: { type: "post" | "roster_today" | "clock" | "weather" | "custom_html", refId?: string, seconds: number, customHtml?: string }
    if (item.type === 'post' && item.refId) {
      const post = await prisma.post.findUnique({
        where: { id: item.refId },
        select: { id: true, title: true, body: true, coverUrl: true, kind: true },
      })
      if (post) {
        resolvedItems.push({
          ...item,
          title: post.title,
          body: post.body,
          coverUrl: post.coverUrl,
          kind: post.kind,
        })
      }
    } else if (item.type === 'roster_today') {
      const now = new Date()
      const year = now.getFullYear()
      const month = String(now.getMonth() + 1).padStart(2, '0')
      const day = String(now.getDate()).padStart(2, '0')
      const targetDateStr = `${year}-${month}-${day}`
      const startOfDay = new Date(`${targetDateStr}T00:00:00.000Z`)
      const endOfDay = new Date(`${targetDateStr}T23:59:59.999Z`)

      const rosterDay = await prisma.rosterDay.findFirst({
        where: {
          gregorianDate: {
            gte: startOfDay,
            lte: endOfDay,
          },
        },
        include: {
          versions: {
            where: { status: 'PUBLISHED' },
            orderBy: { versionNo: 'desc' },
            take: 1,
            include: {
              trips: {
                include: {
                  assignments: {
                    include: {
                      matchedUser: { select: { name: true } },
                    },
                  },
                },
              },
            },
          },
        },
      })

      const publishedVersion = rosterDay?.versions[0]
      const trips = publishedVersion?.trips.map((trip) => ({
        id: trip.id,
        trainNumber: trip.trainNumber,
        direction: trip.direction === 'UP' ? 'رفت' : 'برگشت',
        originStation: trip.originStation,
        destinationStation: trip.destinationStation,
        departureTime: trip.departureTime,
        arrivalTime: trip.arrivalTime,
        drivers: trip.assignments.map((a) => a.matchedUser?.name || a.rawName || 'نامشخص').join(' / '),
      })) || []

      trips.sort((a, b) => (a.departureTime || '').localeCompare(b.departureTime || ''))

      resolvedItems.push({
        ...item,
        rosterTitle: rosterDay?.title || 'برنامه سیر و حرکت امروز',
        jalaliDate: rosterDay?.jalaliDate || '',
        trips: trips.slice(0, 15),
      })
    } else {
      resolvedItems.push(item)
    }
  }

  return {
    playlistName: playlist.name,
    items: resolvedItems,
  }
}
