import { describe, it, expect } from 'vitest'
import { toCsv } from './csv'

describe('toCsv exporter helper', () => {
  it('correctly generates CSV with UTF-8 BOM prefix', () => {
    const columns = [
      { key: 'name', label: 'نام' },
      { key: 'role', label: 'نقش' },
    ]
    const rows = [
      { name: 'علی علوی', role: 'راهبر' },
      { name: 'سارا کریمی', role: 'سرپرست' },
    ]

    const result = toCsv(rows, columns)
    
    // Check for UTF-8 BOM
    expect(result.startsWith('\uFEFF')).toBe(true)

    // Check headers
    expect(result).toContain('"نام","نقش"')

    // Check row data
    expect(result).toContain('"علی علوی","راهبر"')
    expect(result).toContain('"سارا کریمی","سرپرست"')
  })

  it('escapes internal quotes in headers and cells', () => {
    const columns = [
      { key: 'title', label: 'عنوان "پیام"' },
    ]
    const rows = [
      { title: 'درب "A" خراب است' },
    ]

    const result = toCsv(rows, columns)
    expect(result).toContain('"عنوان ""پیام"""')
    expect(result).toContain('"درب ""A"" خراب است"')
  })

  it('mitigates CSV injection by prefixing formula triggers with single quote', () => {
    const columns = [
      { key: 'payload', label: 'دیتا' },
    ]
    const rows = [
      { payload: '=SUM(A1:A5)' },
      { payload: '+989123456789' },
      { payload: '-150' },
      { payload: '@admin' },
      { payload: 'normal text' },
    ]

    const result = toCsv(rows, columns)
    expect(result).toContain('"' + "'=SUM(A1:A5)" + '"')
    expect(result).toContain('"' + "'+989123456789" + '"')
    expect(result).toContain('"' + "'-150" + '"')
    expect(result).toContain('"' + "'@admin" + '"')
    expect(result).toContain('"normal text"')
  })
})
