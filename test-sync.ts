import { syncPersianHolidays } from './src/server/modules/calendar/admin-sync-service'

async function main() {
  try {
    const res = await syncPersianHolidays('test-actor', 1400)
    console.log(res)
  } catch (err: any) {
    console.error('Error:', err.message)
    console.error(err.stack)
  }
}
main()
