import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface DirectoryUser {
  id: string
  name: string
  nationalId: string
  phone: string | null
  email: string | null
  status: string
  role: { key: string; name: string }
  customFields: Record<string, unknown> | null
}

interface DirectoryState {
  users: DirectoryUser[]
  total: number
  loading: boolean
  search: string
  page: number
  pageSize: number
  setUsers: (users: DirectoryUser[]) => void
  setTotal: (total: number) => void
  setLoading: (loading: boolean) => void
  setSearch: (search: string) => void
  setPage: (page: number) => void
}

export const useDirectoryStore = create<DirectoryState>()(
  persist(
    (set) => ({
      users: [],
      total: 0,
      loading: true,
      search: '',
      page: 1,
      pageSize: 20,
      setUsers: (users) => set({ users }),
      setTotal: (total) => set({ total }),
      setLoading: (loading) => set({ loading }),
      setSearch: (search) => set({ search, page: 1 }),
      setPage: (page) => set({ page }),
    }),
    {
      name: 'metro-line1-directory-storage',
    },
  ),
)
