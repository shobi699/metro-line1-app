import * as XLSX from 'xlsx'

const data = [
  {
    'تاریخ جلالی': '1405-01-01',
    'عنوان': 'عید نوروز',
    'نوع': 'official',
    'تعطیل': 'TRUE',
    'تکرار': 'TRUE',
    'قمری': 'FALSE'
  },
  {
    'تاریخ جلالی': '1405-01-13',
    'عنوان': 'روز طبیعت',
    'نوع': 'official',
    'تعطیل': 'TRUE',
    'تکرار': 'TRUE',
    'قمری': 'FALSE'
  },
  {
    'تاریخ جلالی': '1405-04-16',
    'عنوان': 'تاسوعای حسینی',
    'نوع': 'religious',
    'تعطیل': 'TRUE',
    'تکرار': 'FALSE',
    'قمری': 'TRUE'
  }
]

const ws = XLSX.utils.json_to_sheet(data)
const wb = XLSX.utils.book_new()
XLSX.utils.book_append_sheet(wb, ws, 'Holidays')

const outputPath = 'public/holiday-template.xlsx'
XLSX.writeFile(wb, outputPath)
console.log('Template created at:', outputPath)
