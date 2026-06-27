import type { CycleShiftDetail, ShiftCodeValue } from '@/features/shifts/types'

export interface DbShift {
  id: string
  date: string
  code: ShiftCodeValue
  note: string | null
  source?: string
  userId: string
}

export interface ResolvedShiftResponse {
  date: string
  shift: CycleShiftDetail | null
  source: 'cycle' | 'roster' | 'manual'
  templateName: string
}

export interface ShiftNoteDto {
  id: string
  userId: string
  date: string
  content: string
}

export interface ShiftTaskDto {
  id: string
  userId: string
  date: string
  title: string
  time: string
  priority: 'low' | 'medium' | 'high'
  status: 'todo' | 'in_progress' | 'done'
  type: 'personal' | 'system'
  overtime?: number | null
  extraData?: Record<string, unknown> | null
}

export interface ShiftTemplateDto {
  id: string
  name: string
  type: 'rotational' | 'staff'
  length: number
  shifts: CycleShiftDetail[]
  isActive: boolean
  assignments?: Array<{
    id: string
    targetType: 'user' | 'group'
    targetId: string
    anchorDate: string
  }>
}

export interface ShiftAssignmentDto {
  id: string
  templateId: string
  targetType: 'user' | 'group'
  targetId: string
  anchorDate: string
  template?: ShiftTemplateDto
}

async function apiFetch<T>(
  url: string,
  accessToken: string,
  options?: RequestInit,
): Promise<T> {
  const res = await fetch(url, {
    ...options,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      ...(options?.headers ?? {}),
    },
  })
  const json = await res.json()
  if (!res.ok) {
    throw new Error(json.error?.message ?? json.error ?? 'خطای ارتباط با سرور')
  }
  return json.data as T
}

export const shiftsApi = {
  getShifts: (accessToken: string, startDate: string, endDate: string) =>
    apiFetch<DbShift[]>(`/api/shifts?startDate=${startDate}&endDate=${endDate}`, accessToken),

  getResolved: (accessToken: string, userId: string, startDate: string, endDate: string) =>
    apiFetch<ResolvedShiftResponse[]>(
      `/api/shifts/resolved?userId=${userId}&startDate=${startDate}&endDate=${endDate}`,
      accessToken,
    ),

  getNotes: (accessToken: string, startDate: string, endDate: string) =>
    apiFetch<ShiftNoteDto[]>(`/api/shift-notes?startDate=${startDate}&endDate=${endDate}`, accessToken),

  saveNote: (accessToken: string, date: string, content: string) =>
    apiFetch<ShiftNoteDto>('/api/shift-notes', accessToken, {
      method: 'POST',
      body: JSON.stringify({ date, content }),
    }),

  deleteNote: (accessToken: string, id: string) =>
    apiFetch<{ success: boolean }>(`/api/shift-notes?id=${id}`, accessToken, { method: 'DELETE' }),

  getTasks: (accessToken: string, startDate: string, endDate: string) =>
    apiFetch<ShiftTaskDto[]>(`/api/shift-tasks?startDate=${startDate}&endDate=${endDate}`, accessToken),

  createTask: (accessToken: string, data: Omit<ShiftTaskDto, 'id' | 'userId'>) =>
    apiFetch<ShiftTaskDto>('/api/shift-tasks', accessToken, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  updateTask: (accessToken: string, id: string, updates: Partial<ShiftTaskDto>) =>
    apiFetch<ShiftTaskDto>('/api/shift-tasks', accessToken, {
      method: 'PUT',
      body: JSON.stringify({ id, updates }),
    }),

  deleteTask: (accessToken: string, id: string) =>
    apiFetch<{ success: boolean }>(`/api/shift-tasks?id=${id}`, accessToken, { method: 'DELETE' }),

  getTemplates: (accessToken: string) =>
    apiFetch<ShiftTemplateDto[]>('/api/shift-templates', accessToken),

  createTemplate: (accessToken: string, data: Omit<ShiftTemplateDto, 'id' | 'isActive' | 'assignments'>) =>
    apiFetch<ShiftTemplateDto>('/api/shift-templates', accessToken, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  deleteTemplate: (accessToken: string, id: string) =>
    apiFetch<unknown>(`/api/shift-templates/${id}`, accessToken, { method: 'DELETE' }),

  getAssignments: (accessToken: string) =>
    apiFetch<ShiftAssignmentDto[]>('/api/shift-assignments', accessToken),

  createAssignment: (accessToken: string, data: Omit<ShiftAssignmentDto, 'id' | 'template'>) =>
    apiFetch<ShiftAssignmentDto>('/api/shift-assignments', accessToken, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  deleteAssignment: (accessToken: string, id: string) =>
    apiFetch<unknown>(`/api/shift-assignments/${id}`, accessToken, { method: 'DELETE' }),

  publishPeriod: (accessToken: string, startDate: string, endDate: string) =>
    apiFetch<{ created: number; updated: number; skipped: number }>(
      '/api/shifts/publish',
      accessToken,
      { method: 'POST', body: JSON.stringify({ startDate, endDate }) },
    ),
}
