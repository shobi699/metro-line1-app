import type {
  CalendarRangeResponse,
  CalendarEventEntry,
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
