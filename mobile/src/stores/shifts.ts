import { create } from 'zustand'
import AsyncStorage from '@react-native-async-storage/async-storage'

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
  targetId: string // A, B, C, Staff, or userId
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
  status: 'todo' | 'done'
  type: 'personal' | 'system'
  overtime?: number
  kahrizakCount?: number
}

interface ShiftsState {
  templates: CycleTemplate[]
  assignments: ShiftAssignment[]
  notes: DailyNote[]
  tasks: DailyTask[]
  isLoading: boolean
  isAdminSimulated: boolean
  
  toggleAdminSimulation: () => void
  loadPersistedData: () => Promise<void>
  saveNote: (userId: string, date: string, content: string) => Promise<void>
  addTask: (task: Omit<DailyTask, 'id'>) => Promise<void>
  toggleTaskStatus: (id: string) => Promise<void>
  deleteTask: (id: string) => Promise<void>
  updateTask: (id: string, updates: Partial<DailyTask>) => Promise<void>
}

const DEFAULT_TEMPLATES: CycleTemplate[] = [
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

const DEFAULT_ASSIGNMENTS: ShiftAssignment[] = [
  { id: 'assign-group-a', templateId: 'tpl-rotational-1', targetType: 'group', targetId: 'A', anchorDate: '2026-06-01' },
  { id: 'assign-group-b', templateId: 'tpl-rotational-1', targetType: 'group', targetId: 'B', anchorDate: '2026-06-03' },
  { id: 'assign-group-c', templateId: 'tpl-rotational-1', targetType: 'group', targetId: 'C', anchorDate: '2026-06-05' },
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

export const useShiftsStore = create<ShiftsState>((set, get) => ({
  templates: DEFAULT_TEMPLATES,
  assignments: DEFAULT_ASSIGNMENTS,
  notes: DEFAULT_NOTES,
  tasks: DEFAULT_TASKS,
  isLoading: true,
  isAdminSimulated: true,

  toggleAdminSimulation() {
    const nextVal = !get().isAdminSimulated
    set({ isAdminSimulated: nextVal })
    AsyncStorage.setItem('@shifts_is_admin_simulated', String(nextVal)).catch(err => console.error(err))
  },

  async loadPersistedData() {
    try {
      const keys = ['@shifts_templates', '@shifts_assignments', '@shifts_notes', '@shifts_tasks', '@shifts_is_admin_simulated']
      const values = await AsyncStorage.multiGet(keys)
      
      const tpls = values.find(([k]) => k === '@shifts_templates')?.[1]
      const assigns = values.find(([k]) => k === '@shifts_assignments')?.[1]
      const nts = values.find(([k]) => k === '@shifts_notes')?.[1]
      const tsks = values.find(([k]) => k === '@shifts_tasks')?.[1]
      const isAdminSim = values.find(([k]) => k === '@shifts_is_admin_simulated')?.[1]

      set({
        templates: tpls ? JSON.parse(tpls) : DEFAULT_TEMPLATES,
        assignments: assigns ? JSON.parse(assigns) : DEFAULT_ASSIGNMENTS,
        notes: nts ? JSON.parse(nts) : DEFAULT_NOTES,
        tasks: tsks ? JSON.parse(tsks) : DEFAULT_TASKS,
        isAdminSimulated: isAdminSim !== null ? isAdminSim === 'true' : true,
        isLoading: false
      })
    } catch {
      set({ isLoading: false })
    }
  },

  async saveNote(userId, date, content) {
    const filtered = get().notes.filter((n) => !(n.userId === userId && n.date === date))
    let updatedNotes = [...filtered]
    
    if (content.trim()) {
      updatedNotes.push({
        id: `note-${Date.now()}`,
        userId,
        date,
        content
      })
    }
    
    set({ notes: updatedNotes })
    try {
      await AsyncStorage.setItem('@shifts_notes', JSON.stringify(updatedNotes))
    } catch (err) {
      console.error(err)
    }
  },

  async addTask(task) {
    const newTask = { ...task, id: `task-${Date.now()}` } as DailyTask
    const updatedTasks = [...get().tasks, newTask]
    
    set({ tasks: updatedTasks })
    try {
      await AsyncStorage.setItem('@shifts_tasks', JSON.stringify(updatedTasks))
    } catch (err) {
      console.error(err)
    }
  },

  async toggleTaskStatus(id) {
    const updatedTasks = get().tasks.map((t) =>
      t.id === id ? { ...t, status: (t.status === 'done' ? 'todo' : 'done') as any } : t
    )
    
    set({ tasks: updatedTasks })
    try {
      await AsyncStorage.setItem('@shifts_tasks', JSON.stringify(updatedTasks))
    } catch (err) {
      console.error(err)
    }
  },

  async deleteTask(id) {
    const updatedTasks = get().tasks.filter((t) => t.id !== id)
    
    set({ tasks: updatedTasks })
    try {
      await AsyncStorage.setItem('@shifts_tasks', JSON.stringify(updatedTasks))
    } catch (err) {
      console.error(err)
    }
  },

  async updateTask(id, updates) {
    const updatedTasks = get().tasks.map((t) => (t.id === id ? { ...t, ...updates } : t))
    set({ tasks: updatedTasks })
    try {
      await AsyncStorage.setItem('@shifts_tasks', JSON.stringify(updatedTasks))
    } catch (err) {
      console.error(err)
    }
  }
}))
