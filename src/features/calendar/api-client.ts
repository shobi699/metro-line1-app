import type {
  CalendarRangeResponse,
  CalendarEventEntry,
  CalendarInsights,
  PersonalEventInput,
} from './types'

async function apiFetch<T>(
  url: string,
  accessToken: string,
  options?: RequestInit,
): Promise<T> {
  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
      ...options?.headers,
    },
  })
  const json = await res.json()
  if (!res.ok) {
    const message =
      typeof json?.error === 'string' ? json.error : json?.error?.message ?? 'خطای ناشناخته'
    throw new Error(message)
  }
  return json.data as T
}

export const calendarApi = {
  getRange(accessToken: string, from: string, to: string, layers?: string[]) {
    const params = new URLSearchParams({ from, to })
    if (layers?.length) params.set('layers', layers.join(','))
    return apiFetch<CalendarRangeResponse>(`/api/calendar?${params}`, accessToken)
  },

  createEvent(accessToken: string, input: PersonalEventInput) {
    return apiFetch<CalendarEventEntry>('/api/calendar/events', accessToken, {
      method: 'POST',
      body: JSON.stringify(input),
    })
  },

  updateEvent(accessToken: string, id: string, input: Partial<PersonalEventInput> & { isDone?: boolean }) {
    return apiFetch<CalendarEventEntry>(`/api/calendar/events/${id}`, accessToken, {
      method: 'PATCH',
      body: JSON.stringify(input),
    })
  },

  deleteEvent(accessToken: string, id: string) {
    return apiFetch<{ success: boolean }>(`/api/calendar/events/${id}`, accessToken, {
      method: 'DELETE',
    })
  },

  toggleDone(accessToken: string, id: string, isDone: boolean) {
    return apiFetch<CalendarEventEntry>(`/api/calendar/events/${id}/done`, accessToken, {
      method: 'POST',
      body: JSON.stringify({ isDone }),
    })
  },

  getInsights(accessToken: string, jYear: number, jMonth: number) {
    return apiFetch<CalendarInsights>(
      `/api/calendar/insights?year=${jYear}&month=${jMonth}`,
      accessToken,
    )
  },

  getIcsToken(accessToken: string) {
    return apiFetch<{ token: string }>('/api/calendar/ics/rotate', accessToken)
  },

  rotateIcsToken(accessToken: string) {
    return apiFetch<{ token: string }>('/api/calendar/ics/rotate', accessToken, {
      method: 'POST',
    })
  },

  async downloadMonthExcel(accessToken: string, jYear: number, jMonth: number): Promise<Blob> {
    const res = await fetch(`/api/calendar/export?year=${jYear}&month=${jMonth}&format=xlsx`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    })
    if (!res.ok) throw new Error('خروجی اکسل آماده نشد')
    return res.blob()
  },

  markOrgEventSeen(accessToken: string, eventId: string) {
    return apiFetch<{ id: string }>(`/api/calendar/org-events/${eventId}/seen`, accessToken, {
      method: 'POST',
    })
  },

  getPreferences(accessToken: string) {
    return apiFetch<{ layers: Record<string, { on: boolean }>; defaultView: string }>(
      '/api/calendar/preferences',
      accessToken,
    )
  },

  updatePreferences(
    accessToken: string,
    input: { layers?: Record<string, { on: boolean }>; defaultView?: string },
  ) {
    return apiFetch<{ layers: Record<string, { on: boolean }> }>(
      '/api/calendar/preferences',
      accessToken,
      { method: 'PATCH', body: JSON.stringify(input) },
    )
  },
}
