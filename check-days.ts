import { gregorianToJalali, jalaliToGregorian } from './mobile/src/shared/jalali'

const d1 = jalaliToGregorian(1405, 4, 11)
const d2 = jalaliToGregorian(1405, 4, 12)

console.log("1405/04/11 Greg:", d1.toDateString(), "Weekday (0=Sun):", d1.getDay())
console.log("1405/04/12 Greg:", d2.toDateString(), "Weekday (0=Sun):", d2.getDay())
