import { describe, it, expect, vi, beforeEach } from 'vitest'
import { getSettingValue, __resetSettingsInitForTests } from './service'
import { prisma } from '@/server/db'

vi.mock('@/server/db', () => ({
  prisma: {
    setting: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
  },
}))

describe('settings service', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Reset process-level promise guard if it exists
    try {
      __resetSettingsInitForTests()
    } catch {
      // not added yet in step 1, safe to ignore
    }
  })

  it('returns the parsed value when the setting exists and is enabled', async () => {
    vi.mocked(prisma.setting.findUnique).mockResolvedValue({
      key: 'test.key',
      value: JSON.stringify(123),
      isEnabled: true,
      defaultValue: JSON.stringify(100),
    } as any)

    const val = await getSettingValue('test.key', 100)
    expect(val).toBe(123)
  })

  it('returns the fallback when the setting is missing', async () => {
    vi.mocked(prisma.setting.findUnique).mockResolvedValue(null)

    const val = await getSettingValue('test.key', 100)
    expect(val).toBe(100)
  })

  it('returns the fallback when isEnabled is false', async () => {
    vi.mocked(prisma.setting.findUnique).mockResolvedValue({
      key: 'test.key',
      value: JSON.stringify(123),
      isEnabled: false,
      defaultValue: JSON.stringify(100),
    } as any)

    const val = await getSettingValue('test.key', 100)
    expect(val).toBe(100)
  })

  it('returns the fallback when prisma.setting.findUnique throws', async () => {
    vi.mocked(prisma.setting.findUnique).mockRejectedValue(new Error('DB connection lost'))

    const val = await getSettingValue('test.key', 100)
    expect(val).toBe(100)
  })

  it('caches the ensureDefaultSettingsExist promise and does not repeat it', async () => {
    vi.mocked(prisma.setting.findUnique).mockResolvedValue({
      key: 'test.key',
      value: JSON.stringify(123),
      isEnabled: true,
      defaultValue: JSON.stringify(100),
    } as any)

    await getSettingValue('test.key', 100)
    const callsFirst = vi.mocked(prisma.setting.findUnique).mock.calls.length

    await getSettingValue('test.key', 100)
    const callsSecond = vi.mocked(prisma.setting.findUnique).mock.calls.length

    expect(callsSecond - callsFirst).toBe(1)
  })

  it('forces rerun when __resetSettingsInitForTests is called', async () => {
    vi.mocked(prisma.setting.findUnique).mockResolvedValue({
      key: 'test.key',
      value: JSON.stringify(123),
      isEnabled: true,
      defaultValue: JSON.stringify(100),
    } as any)

    await getSettingValue('test.key', 100)
    const callsFirst = vi.mocked(prisma.setting.findUnique).mock.calls.length

    __resetSettingsInitForTests()

    await getSettingValue('test.key', 100)
    const callsSecond = vi.mocked(prisma.setting.findUnique).mock.calls.length

    // Since it was reset, it should run the whole ensureDefaultSettingsExist check again.
    // So the number of calls will be much larger than 1.
    expect(callsSecond - callsFirst).toBeGreaterThan(1)
  })
})
