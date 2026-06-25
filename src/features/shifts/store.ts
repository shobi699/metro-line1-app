import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface CycleShiftDetail {
  day: number
  code: 'morning' | 'evening' | 'night' | 'off' | 'office'
  label: string
  hours: number
  startTime: string
  endTime: string
}

export interface CycleTemplate {
  id: string
  name: string
  type: 'rotational' | 'staff'
  length: number
  shifts: CycleShiftDetail[]
}

export interface ShiftAssignment {
  id: string
  templateId: string
  targetType: 'user' | 'group'
  targetId: string // user ID or group name ('A', 'B', 'C', 'Staff')
  anchorDate: string // YYYY-MM-DD
}

export interface DailyNote {
  id: string
  userId: string
  date: string // YYYY-MM-DD
  content: string
}

export interface DailyTask {
  id: string
  userId: string
  date: string // YYYY-MM-DD
  title: string
  time: string // HH:MM
  priority: 'low' | 'medium' | 'high'
  status: 'todo' | 'in_progress' | 'done'
  type: 'personal' | 'system'
  overtime?: number // numeric calculation field
  kahrizakCount?: number // custom numeric field (trips to Kahrizak)
}

interface ShiftsState {
  templates: CycleTemplate[]
  assignments: ShiftAssignment[]
  notes: DailyNote[]
  tasks: DailyTask[]
  isAdminSimulated: boolean
  
  // Actions
  toggleAdminSimulation: () => void
  addTemplate: (template: Omit<CycleTemplate, 'id'>) => void
  deleteTemplate: (id: string) => void
  assignTemplate: (assignment: Omit<ShiftAssignment, 'id'>) => void
  deleteAssignment: (id: string) => void
  
  // Note CRUD
  saveNote: (userId: string, date: string, content: string) => void
  deleteNote: (id: string) => void
  
  // Task CRUD
  addTask: (task: Omit<DailyTask, 'id'>) => void
  toggleTaskStatus: (id: string) => void
  deleteTask: (id: string) => void
  updateTask: (id: string, updates: Partial<DailyTask>) => void
}

export const DEFAULT_TEMPLATES: CycleTemplate[] = [
  {
    id: 'tpl-rotational-1',
    name: 'سیکل ۶ روزه عملیاتی - تیپ ۱ (نوبتی)',
    type: 'rotational',
    length: 6,
    shifts: [
      { day: 1, code: 'morning', label: 'صبح‌کار (۹ ساعته)', hours: 9, startTime: '07:00', endTime: '16:00' },
      { day: 2, code: 'morning', label: 'صبح‌کار (۹ ساعته)', hours: 9, startTime: '07:00', endTime: '16:00' },
      { day: 3, code: 'evening', label: 'عصرکار (۹ ساعته)', hours: 9, startTime: '16:00', endTime: '01:00' },
      { day: 4, code: 'evening', label: 'عصرکار (۹ ساعته)', hours: 9, startTime: '16:00', endTime: '01:00' },
      { day: 5, code: 'off', label: 'استراحت (آف)', hours: 0, startTime: '', endTime: '' },
      { day: 6, code: 'off', label: 'استراحت (آف)', hours: 0, startTime: '', endTime: '' }
    ]
  },
  {
    id: 'tpl-rotational-2',
    name: 'سیکل ۶ روزه عملیاتی - تیپ ۲ (۱۲ ساعته)',
    type: 'rotational',
    length: 6,
    shifts: [
      { day: 1, code: 'morning', label: 'روزکار (۱۲ ساعته)', hours: 12, startTime: '07:00', endTime: '19:00' },
      { day: 2, code: 'morning', label: 'روزکار (۱۲ ساعته)', hours: 12, startTime: '07:00', endTime: '19:00' },
      { day: 3, code: 'night', label: 'شب‌کار (۱۲ ساعته)', hours: 12, startTime: '19:00', endTime: '07:00' },
      { day: 4, code: 'night', label: 'شب‌کار (۱۲ ساعته)', hours: 12, startTime: '19:00', endTime: '07:00' },
      { day: 5, code: 'off', label: 'استراحت (آف)', hours: 0, startTime: '', endTime: '' },
      { day: 6, code: 'off', label: 'استراحت (آف)', hours: 0, startTime: '', endTime: '' }
    ]
  },
  {
    id: 'tpl-staff-1',
    name: 'سیکل ۷ روزه ثابت ستادی (اداری)',
    type: 'staff',
    length: 7,
    shifts: [
      { day: 1, code: 'office', label: 'اداری (شنبه)', hours: 8.75, startTime: '07:30', endTime: '16:15' },
      { day: 2, code: 'office', label: 'اداری (یکشنبه)', hours: 8.75, startTime: '07:30', endTime: '16:15' },
      { day: 3, code: 'office', label: 'اداری (دوشنبه)', hours: 8.75, startTime: '07:30', endTime: '16:15' },
      { day: 4, code: 'office', label: 'اداری (سه‌شنبه)', hours: 8.75, startTime: '07:30', endTime: '16:15' },
      { day: 5, code: 'office', label: 'اداری (چهارشنبه)', hours: 8.75, startTime: '07:30', endTime: '16:15' },
      { day: 6, code: 'off', label: 'تعطیل (پنجشنبه)', hours: 0, startTime: '', endTime: '' },
      { day: 7, code: 'off', label: 'تعطیل (جمعه)', hours: 0, startTime: '', endTime: '' }
    ]
  }
]

export const DEFAULT_ASSIGNMENTS: ShiftAssignment[] = [
  { id: 'assign-group-a', templateId: 'tpl-rotational-2', targetType: 'group', targetId: 'A', anchorDate: '2026-06-01' },
  { id: 'assign-group-b', templateId: 'tpl-rotational-2', targetType: 'group', targetId: 'B', anchorDate: '2026-06-03' },
  { id: 'assign-group-c', templateId: 'tpl-rotational-2', targetType: 'group', targetId: 'C', anchorDate: '2026-06-05' },
  { id: 'assign-group-staff', templateId: 'tpl-staff-1', targetType: 'group', targetId: 'Staff', anchorDate: '2026-05-30' }
]

const DEFAULT_TASKS: DailyTask[] = [
  {
    id: 'seed-task-1',
    userId: 'current',
    date: '2026-06-24',
    title: 'بازدید از تجهیزات ترمز قطار ۱۰۴ در دپو',
    time: '08:30',
    priority: 'high',
    status: 'done',
    type: 'personal'
  },
  {
    id: 'seed-task-2',
    userId: 'current',
    date: '2026-06-24',
    title: 'اضافه کار پوشش شیفت عصر راهبر همکار',
    time: '16:00',
    priority: 'high',
    status: 'done',
    type: 'system',
    overtime: 4,
    kahrizakCount: 0
  },
  {
    id: 'seed-task-3',
    userId: 'current',
    date: '2026-06-24',
    title: 'اعزام قطار فوق‌العاده تخلیه بار مسافری کهریزک',
    time: '18:15',
    priority: 'medium',
    status: 'done',
    type: 'system',
    overtime: 0,
    kahrizakCount: 2
  },
  {
    id: 'seed-task-4',
    userId: 'current',
    date: '2026-06-25',
    title: 'بررسی اوراق سلامت راهبری روزانه',
    time: '07:15',
    priority: 'low',
    status: 'todo',
    type: 'personal'
  },
  // Injected data for other personnel to make analytics rich
  {
    id: 'seed-task-5',
    userId: 'user-ali',
    date: '2026-06-15',
    title: 'اضافه‌کار پوشش خط دپو',
    time: '12:00',
    priority: 'medium',
    status: 'done',
    type: 'system',
    overtime: 6,
    kahrizakCount: 1
  },
  {
    id: 'seed-task-6',
    userId: 'user-ali',
    date: '2026-06-18',
    title: 'مأموریت تخلیه کهریزک به دلیل شلوغی',
    time: '14:30',
    priority: 'high',
    status: 'done',
    type: 'system',
    overtime: 2,
    kahrizakCount: 3
  },
  {
    id: 'seed-task-7',
    userId: 'user-reza',
    date: '2026-06-10',
    title: 'اضافه‌کار فنی دپوی کهریزک',
    time: '09:00',
    priority: 'low',
    status: 'done',
    type: 'system',
    overtime: 8,
    kahrizakCount: 0
  },
  {
    id: 'seed-task-8',
    userId: 'user-reza',
    date: '2026-06-20',
    title: 'اعزام اضطراری کهریزک',
    time: '21:00',
    priority: 'high',
    status: 'done',
    type: 'system',
    overtime: 3,
    kahrizakCount: 4
  }
]

const DEFAULT_NOTES: DailyNote[] = [
  {
    id: 'seed-note-1',
    userId: 'current',
    date: '2026-06-24',
    content: 'امروز تست ترمز قطار جدید با موفقیت انجام شد. اضافه‌کار جهت پوشش تا ساعت ۸ شب هماهنگ شده است.'
  }
]

export const useShiftsStore = create<ShiftsState>()(
  persist(
    (set) => ({
      templates: DEFAULT_TEMPLATES,
      assignments: DEFAULT_ASSIGNMENTS,
      notes: DEFAULT_NOTES,
      tasks: DEFAULT_TASKS,
      isAdminSimulated: true, // Default to true so they can test both seamlessly

      toggleAdminSimulation: () => set((state) => ({ isAdminSimulated: !state.isAdminSimulated })),

      addTemplate: (template) =>
        set((state) => ({
          templates: [
            ...state.templates,
            { ...template, id: `tpl-${Date.now()}` }
          ]
        })),

      deleteTemplate: (id) =>
        set((state) => ({
          templates: state.templates.filter((t) => t.id !== id),
          // Clean up assignments using this template
          assignments: state.assignments.filter((a) => a.templateId !== id)
        })),

      assignTemplate: (assignment) =>
        set((state) => {
          // Remove existing assignments for same target
          const filtered = state.assignments.filter(
            (a) => !(a.targetType === assignment.targetType && a.targetId === assignment.targetId)
          )
          return {
            assignments: [
              ...filtered,
              { ...assignment, id: `assign-${Date.now()}` }
            ]
          }
        }),

      deleteAssignment: (id) =>
        set((state) => ({
          assignments: state.assignments.filter((a) => a.id !== id)
        })),

      saveNote: (userId, date, content) =>
        set((state) => {
          const filtered = state.notes.filter((n) => !(n.userId === userId && n.date === date))
          if (!content.trim()) {
            return { notes: filtered }
          }
          return {
            notes: [
              ...filtered,
              { id: `note-${Date.now()}`, userId, date, content }
            ]
          }
        }),

      deleteNote: (id) =>
        set((state) => ({
          notes: state.notes.filter((n) => n.id !== id)
        })),

      addTask: (task) =>
        set((state) => ({
          tasks: [
            ...state.tasks,
            { ...task, id: `task-${Date.now()}` }
          ]
        })),

      toggleTaskStatus: (id) =>
        set((state) => ({
          tasks: state.tasks.map((t) =>
            t.id === id
              ? { ...t, status: t.status === 'done' ? 'todo' : 'done' }
              : t
          )
        })),

      deleteTask: (id) =>
        set((state) => ({
          tasks: state.tasks.filter((t) => t.id !== id)
        })),

      updateTask: (id, updates) =>
        set((state) => ({
          tasks: state.tasks.map((t) => (t.id === id ? { ...t, ...updates } : t))
        }))
    }),
    {
      name: 'metro-line1-shifts-storage'
    }
  )
)
