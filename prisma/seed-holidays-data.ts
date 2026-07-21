/**
 * Seed تعطیلات رسمی و مناسبت‌های شمسی و قمری خط ۱ مترو (از ۱۴۰۵ به بعد).
 * ویرایش، ویراستاری و پالایش‌شده بر اساس داده‌های استاندارد تقویم ایران.
 */

export interface HolidaySeedItem {
  jalaliDate: string
  title: string
  kind: 'official' | 'religious' | 'occasion'
  isOffDay: boolean
  recurring?: boolean
  hijriBased?: boolean
}

export const SYSTEM_DEFAULT_HOLIDAYS: HolidaySeedItem[] = [
  {
    "jalaliDate": "1405-01-01",
    "title": "جشن نوروز/جشن سال نو",
    "kind": "official",
    "isOffDay": true,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1405-01-01",
    "title": "عید سعید فطر (۱ شوال)",
    "kind": "religious",
    "isOffDay": true,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1405-01-01",
    "title": "روز جهانی نوروز",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1405-01-02",
    "title": "عید نوروز",
    "kind": "official",
    "isOffDay": true,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1405-01-02",
    "title": "تعطیل به مناسبت عید سعید فطر (۲ شوال)",
    "kind": "religious",
    "isOffDay": true,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1405-01-03",
    "title": "عید نوروز",
    "kind": "official",
    "isOffDay": true,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1405-01-03",
    "title": "روز جهانی هواشناسی",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1405-01-04",
    "title": "عید نوروز",
    "kind": "official",
    "isOffDay": true,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1405-01-06",
    "title": "روز امید، روز شادباش نویسی",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1405-01-06",
    "title": "زادروز اَشو زرتشت، اَبَراِنسان بزرگ تاریخ",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1405-01-07",
    "title": "روز جهانی تئاتر",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1405-01-10",
    "title": "جشن آبانگاه",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1405-01-12",
    "title": "روز جمهوری اسلامی",
    "kind": "official",
    "isOffDay": true,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1405-01-13",
    "title": "جشن سیزده به در",
    "kind": "official",
    "isOffDay": true,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1405-01-17",
    "title": "سروش روز،جشن سروشگان",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1405-01-18",
    "title": "روز جهانی بهداشت",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1405-01-19",
    "title": "فروردین روز،جشن فروردینگان",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1405-01-23",
    "title": "روز دندانپزشک",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1405-01-25",
    "title": "روز بزرگداشت عطار نیشابوری",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1405-01-25",
    "title": "شهادت امام جعفر صادق (ع) (۲۵ شوال)",
    "kind": "religious",
    "isOffDay": true,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1405-01-29",
    "title": "روز ارتش جمهوری اسلامی ایران",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1405-01-30",
    "title": "ولادت حضرت معصومه (س)، روز دختران (۱ ذوالقعده)",
    "kind": "religious",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1405-01-30",
    "title": "روز علوم آزمایشگاهی، زاد روز حکیم سید اسماعیل جرجانی",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1405-02-01",
    "title": "روز بزرگداشت سعدی",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1405-02-02",
    "title": "جشن گیاه آوری؛ روز زمین",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1405-02-03",
    "title": "روز بزرگداشت شیخ بهایی؛ روز ملی کارآفرینی؛ روز معماری",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1405-02-06",
    "title": "فاجعه‌ی انفجارِ بندر عباس [ 1404 خورشیدی]",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1405-02-07",
    "title": "روز جهانی طراحی و گرافیک",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1405-02-09",
    "title": "ولادت امام رضا (ع) (۱۱ ذوالقعده)",
    "kind": "religious",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1405-02-09",
    "title": "روز ملی روانشناس و مشاور",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1405-02-10",
    "title": "جشن چهلم نوروز؛ روز ملی خلیج فارس",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1405-02-11",
    "title": "روز جهانی کارگر",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1405-02-12",
    "title": "روز معلم",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1405-02-15",
    "title": "جشن میانه بهار/جشن بهاربد؛ روز شیراز",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1405-02-15",
    "title": "روز جهانی ماما",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1405-02-15",
    "title": "Shiraz",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": true,
    "hijriBased": false
  },
  {
    "jalaliDate": "1405-02-18",
    "title": "روز جهانی صلیب سرخ و هلال احمر",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1405-02-22",
    "title": "زادروز مریم میرزاخانی ریاضیدان ایرانی، روز جهانی زن در ریاضیات",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1405-02-22",
    "title": "روز جهانی پرستار",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1405-02-25",
    "title": "روز بزرگداشت فردوسی",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1405-02-27",
    "title": "روز ارتباطات و روابط عمومی",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1405-02-27",
    "title": "شهادت امام محمد تقی (ع) (۳۰ ذوالقعده)",
    "kind": "religious",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1405-02-28",
    "title": "روز بزرگداشت حکیم عمر خیام",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1405-02-28",
    "title": "روز جهانی موزه و میراث فرهنگی",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1405-03-01",
    "title": "روز بهره وری و بهینه سازی مصرف",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1405-03-01",
    "title": "روز بزرگداشت ملاصدرا",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1405-03-02",
    "title": "فروریختن ساختمان متروپل در آبادان",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1405-03-03",
    "title": "فتح خرمشهر در عملیات بیت المقدس و روز مقاومت، ایثار و پیروزی",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1405-03-03",
    "title": "شهادت امام محمد باقر (ع) (۷ ذوالحجه)",
    "kind": "religious",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1405-03-04",
    "title": "روز دزفول، روز مقاومت و پایداری",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1405-03-05",
    "title": "روز عرفه (۹ ذوالحجه)",
    "kind": "religious",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1405-03-06",
    "title": "خرداد روز،جشن خردادگان",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1405-03-06",
    "title": "عید سعید قربان (۱۰ ذوالحجه)",
    "kind": "religious",
    "isOffDay": true,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1405-03-10",
    "title": "روز جهانی بدون دخانیات",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1405-03-11",
    "title": "ولادت امام علی النقی (ع) (۱۵ ذوالحجه)",
    "kind": "religious",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1405-03-14",
    "title": "رحلت حضرت امام خمینی",
    "kind": "official",
    "isOffDay": true,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1405-03-14",
    "title": "عید سعید غدیر خم (۱۸ ذوالحجه)",
    "kind": "religious",
    "isOffDay": true,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1405-03-15",
    "title": "قیام 15 خرداد",
    "kind": "official",
    "isOffDay": true,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1405-03-15",
    "title": "روز جهانی محیط زیست",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1405-03-16",
    "title": "ولادت امام موسی کاظم (ع) (۲۰ ذوالحجه)",
    "kind": "religious",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1405-03-20",
    "title": "روز جهانی صنایع دستی",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1405-03-22",
    "title": "روز جهانی مبارزه با کار کودکان",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1405-03-24",
    "title": "روز جهانی اهدای خون",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1405-03-25",
    "title": "روز ملی گل وگیاه",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1405-03-26",
    "title": "روز جهانی پدر",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1405-03-27",
    "title": "روز جهانی بیابان زدایی",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1405-03-31",
    "title": "سالروز زلزله رودبار و منجیل [1369خورشیدی]",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1405-04-01",
    "title": "جشن آب پاشونک، جشن آغاز تابستان",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1405-04-03",
    "title": "تاسوعای حسینی (۹ محرم)",
    "kind": "religious",
    "isOffDay": true,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1405-04-04",
    "title": "عاشورای حسینی (۱۰ محرم)",
    "kind": "religious",
    "isOffDay": true,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1405-04-05",
    "title": "روز جهانی مبارزه با مواد مخدر",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1405-04-06",
    "title": "شهادت امام زین العابدین (ع) (۱۲ محرم)",
    "kind": "religious",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1405-04-07",
    "title": "انفجار دفتر حزب جمهوری اسلامی؛ روز قوه قضاییه",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1405-04-08",
    "title": "روز مبارزه با سلاح های شیمیایی و میکروبی",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1405-04-10",
    "title": "روز صنعت و معدن",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1405-04-10",
    "title": "زادروز بابک خرمدین، سپه‌سالار دلاور ایران",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1405-04-10",
    "title": "روز بزرگداشت صائب تبریزی",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1405-04-12",
    "title": "شلیک به پرواز 655 ایران ایر توسط ناو وینسنس [ 1367 خورشیدی ]",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1405-04-14",
    "title": "روز قلم",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1405-04-15",
    "title": "جشن خام خواری",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1405-04-25",
    "title": "روز بهزیستی و تامین اجتماعی",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1405-04-27",
    "title": "اعلام پذیرش قطعنامه 598 شورای امنیت از سوی ایران [ 1367 خورشیدی ]",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1405-05-07",
    "title": "اَمرداداَمرداد روز،جشن اَمردادگان",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1405-05-08",
    "title": "اَمردادروز بزرگداشت شیخ شهاب الدین سهروردی",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1405-05-10",
    "title": "اَمردادجشن چله تابستان",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1405-05-10",
    "title": "اَمردادآغاز هفته جهانی شیردهی",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1405-05-13",
    "title": "اَمرداداربعین حسینی (۲۰ صفر)",
    "kind": "religious",
    "isOffDay": true,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1405-05-14",
    "title": "اَمردادسالروز صدور فرمان مشروطیت",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1405-05-17",
    "title": "اَمردادروز خبرنگار",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1405-05-21",
    "title": "اَمردادرحلت رسول اکرم؛شهادت امام حسن مجتبی (ع) (۲۸ صفر)",
    "kind": "religious",
    "isOffDay": true,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1405-05-22",
    "title": "اَمردادشهادت امام رضا (ع) (۳۰ صفر)",
    "kind": "religious",
    "isOffDay": true,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1405-05-22",
    "title": "اَمردادروز جهانی چپ دست ها",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1405-05-23",
    "title": "اَمردادهجرت پیامبر اکرم از مکه به مدینه (۱ ربیع الاول)",
    "kind": "religious",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1405-05-28",
    "title": "اَمردادسالروز وقایع پس از برکناری محمد مصدق‌السلطنه",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1405-05-28",
    "title": "اَمردادسالروز فاجعه آتش زدن سینما رکس آبادان",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1405-05-28",
    "title": "اَمردادروز جهانی عکاسی",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1405-05-30",
    "title": "اَمردادشهادت امام حسن عسکری (ع) (۸ ربیع الاول)",
    "kind": "religious",
    "isOffDay": true,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1405-06-01",
    "title": "روز بزرگداشت ابوعلی سینا و روز پزشک",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1405-06-02",
    "title": "آغاز هفته دولت",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1405-06-03",
    "title": "میلاد رسول اکرم به روایت اهل سنت (۱۲ ربیع الاول)",
    "kind": "religious",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1405-06-04",
    "title": "زادروز کوروش بزرگ",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1405-06-04",
    "title": "شهریور روز،جشن شهریورگان",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1405-06-05",
    "title": "روز بزرگداشت محمدبن زکریای رازی و روز داروساز",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1405-06-08",
    "title": "میلاد رسول اکرم و امام جعفر صادق (ع) (۱۷ ربیع الاول)",
    "kind": "religious",
    "isOffDay": true,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1405-06-11",
    "title": "روز ملی صنعت چاپ",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1405-06-13",
    "title": "روز بزرگداشت ابوریحان بیرونی",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1405-06-19",
    "title": "روز جهانی پیشگیری از خودکشی",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1405-06-20",
    "title": "حمله به برج‌های دوقلوی مرکز تجارت جهانی",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1405-06-21",
    "title": "روز سینما",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1405-06-27",
    "title": "روز شعر و ادب پارسی و روز بزرگداشت استاد شهریار",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1405-06-29",
    "title": "ولادت امام حسن عسکری (ع) (۸ ربیع الثانی)",
    "kind": "religious",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1405-06-30",
    "title": "روز جهانی صلح",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1405-06-31",
    "title": "آغاز هفته دفاع مقدس",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1405-06-31",
    "title": "وفات حضرت معصومه (س) (۱۰ ربیع الثانی)",
    "kind": "religious",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1405-07-01",
    "title": "آغاز حمله مغول به ایران در پاییز 598 خورشیدی",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1405-07-04",
    "title": "روز گرامیداشت سربازان وطن",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1405-07-05",
    "title": "روز جهانی جهانگردی",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1405-07-07",
    "title": "روز آتش نشانی و ایمنی",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1405-07-07",
    "title": "روز بزرگداشت شمس تبریزی",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1405-07-08",
    "title": "روز بزرگداشت مولوی",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1405-07-08",
    "title": "روز جهانی ناشنوایان",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1405-07-08",
    "title": "روز جهانی ترجمه و مترجم",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1405-07-09",
    "title": "روز جهانی سالمندان",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1405-07-10",
    "title": "مهر روز،جشن مهرگان",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1405-07-12",
    "title": "آغاز هفته جهانی فضا",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1405-07-13",
    "title": "روز جهانی معلم",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1405-07-14",
    "title": "روز دامپزشکی",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1405-07-16",
    "title": "روز ملی کودک",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1405-07-17",
    "title": "روز جهانی پست",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1405-07-18",
    "title": "روز جهانی مبارزه با حکم اعدام",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1405-07-19",
    "title": "روز جهانی دختر",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1405-07-20",
    "title": "روز بزرگداشت حافظ",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1405-07-21",
    "title": "روز پیروزی کاوه و فریدون بر ضحاک",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1405-07-22",
    "title": "روز جهانی استاندارد",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1405-07-23",
    "title": "روز جهانی عصای سفید",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1405-07-24",
    "title": "ولادت حضرت زینب (س) و روز پرستار و بهورز (۵ جمادی الاول)",
    "kind": "religious",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1405-07-24",
    "title": "روز جهانی غذا",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1405-07-25",
    "title": "روز جهانی ریشه کنی فقر",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1405-07-26",
    "title": "روز تربیت بدنی و ورزش",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1405-07-28",
    "title": "زادروز ستارخان ملقب به سردار ملی و از سرداران جنبش مشروطه ایران",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1405-07-29",
    "title": "روز ملی کوهنورد",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1405-08-01",
    "title": "روز آمار و برنامه ریزی",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1405-08-01",
    "title": "روز بزرگداشت ابوالفضل بیهقی، تاریخ‌نگار و نویسنده ایرانی",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1405-08-07",
    "title": "سالروز ورود کوروش بزرگ به بابل در سال 539 پیش از میلاد",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1405-08-08",
    "title": "روز ملی محیط بان",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1405-08-10",
    "title": "آبان روز، جشن آبانگان",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1405-08-14",
    "title": "روز ملّی مازندران",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1405-08-15",
    "title": "جشن میانه پاییز",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1405-08-18",
    "title": "روز ملی کیفیت",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1405-08-22",
    "title": "شهادت حضرت فاطمه زهرا (س) (۳ جمادی الثانیه)",
    "kind": "religious",
    "isOffDay": true,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1405-08-23",
    "title": "روز جهانی دیابت",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1405-08-24",
    "title": "روز کتاب و کتابخوانی",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1405-08-26",
    "title": "روز جهانی دانش آموز",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1405-08-28",
    "title": "روز جهانی آقایان",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1405-08-29",
    "title": "روز جهانی کودک",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1405-09-01",
    "title": "آذر جشن",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1405-09-04",
    "title": "روز جهانی مبارزه با خشونت علیه زنان",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1405-09-05",
    "title": "روز بسیج مستضعفان",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1405-09-07",
    "title": "سالروز عملیات مروارید و روز نیروی دریایی ارتش",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1405-09-09",
    "title": "جشن آذرگان ،آذر روز",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1405-09-09",
    "title": "ولادت حضرت فاطمه زهرا (س) و روز مادر (۲۰ جمادی الثانیه)",
    "kind": "religious",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1405-09-10",
    "title": "روز جهانی ایدز",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1405-09-12",
    "title": "روز جهانی معلولان (کم‌توانان)",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1405-09-13",
    "title": "روز صنعت بیمه",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1405-09-15",
    "title": "روز حسابدار",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1405-09-19",
    "title": "روز جهانی حقوق بشر",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1405-09-20",
    "title": "ولادت امام محمد باقر (ع) (۱ رجب)",
    "kind": "religious",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1405-09-20",
    "title": "روز جهانی کوهستان",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1405-09-22",
    "title": "شهادت امام علی النقی (ع) (۳ رجب)",
    "kind": "religious",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1405-09-25",
    "title": "روز پژوهش و فناوری",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1405-09-29",
    "title": "ولادت امام محمد تقی (ع) (۱۰ رجب)",
    "kind": "religious",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1405-09-30",
    "title": "جشن شب یلدا، شب چلّه",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1405-10-01",
    "title": "روز میلاد خورشید؛ جشن خرم روز، نخستین جشن دیگان",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1405-10-02",
    "title": "ولادت امام علی (ع) و روز پدر (۱۳ رجب)",
    "kind": "religious",
    "isOffDay": true,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1405-10-03",
    "title": "سالروز عملیات کربلای 4 [1365 خورشیدی]",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1405-10-04",
    "title": "وفات حضرت زینب (س) (۱۵ رجب)",
    "kind": "religious",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1405-10-04",
    "title": "جشن کریسمس",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1405-10-04",
    "title": "روز بزرگداشت دوستی",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1405-10-05",
    "title": "زمین لرزه ی بم [1382 خورشیدی]",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1405-10-05",
    "title": "سالروز شهادت اَشو زرتشت، اَبَراِنسان بزرگ تاریخ",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1405-10-08",
    "title": "دی به آذر روز، دومین جشن دیگان",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1405-10-09",
    "title": "اعدام میهن‌پرستان آذری در تبریز توسط قوای اشغالگر روس [1290 خورشیدی]",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1405-10-11",
    "title": "جشن آغاز سال نو میلادی",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1405-10-12",
    "title": "روز حافظ",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1405-10-13",
    "title": "شهادت سردار حاج قاسم سلیمانی [1398 خورشیدی]",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1405-10-14",
    "title": "شهادت امام موسی کاظم (ع) (۲۵ رجب)",
    "kind": "religious",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1405-10-15",
    "title": "دی به مهر روز، سومین جشن دیگان",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1405-10-16",
    "title": "مبعث رسول اکرم (ص) (۲۷ رجب)",
    "kind": "religious",
    "isOffDay": true,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1405-10-16",
    "title": "غرق شدن کشتی سانچی [1396 خورشیدی]",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1405-10-18",
    "title": "شلیک به پرواز 752 هواپیمایی اوکراین [1398 خورشیدی]",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1405-10-19",
    "title": "درگذشت اکبر هاشمی رفسنجانی [1395 خورشیدی]",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1405-10-20",
    "title": "قتل امیرکبیر به دستور ناصرالدین شاه قاجار [1230 خورشیدی]",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1405-10-22",
    "title": "ولادت سالار شهیدان، امام حسین (ع) و روز پاسدار (۳ شعبان)",
    "kind": "religious",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1405-10-23",
    "title": "دی به دین روز، چهارمین جشن دیگان",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1405-10-23",
    "title": "ولادت حضرت ابوالفضل العباس (ع) و روز جانباز (۴ شعبان)",
    "kind": "religious",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1405-10-24",
    "title": "ولادت امام زین العابدین (ع) (۵ شعبان)",
    "kind": "religious",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1405-10-30",
    "title": "ولادت حضرت علی اکبر (ع) و روز جوان (۱۱ شعبان)",
    "kind": "religious",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1405-10-30",
    "title": "آتش‌سوزی و فروریختن ساختمان پلاسکو [1395 خورشیدی]",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1405-11-01",
    "title": "زادروز فردوسی",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1405-11-02",
    "title": "بهمن روز، جشن بهمنگان",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1405-11-04",
    "title": "ولادت حضرت قائم عجل الله تعالی فرجه و جشن نیمه شعبان (۱۵ شعبان)",
    "kind": "religious",
    "isOffDay": true,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1405-11-06",
    "title": "بزرگداشت صفی‌الدین اُرمَوی و روز موسیقی ایرانی",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1405-11-10",
    "title": "جشن سده، گرامیداشتِ کشف آتش به دستِ هوشنگ شاه",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1405-11-12",
    "title": "بازگشت امام خمینی (ره) به ایران",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1405-11-15",
    "title": "جشن میانه زمستان",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1405-11-19",
    "title": "روز نیروی هوایی",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1405-11-22",
    "title": "پیروزی انقلاب اسلامی",
    "kind": "official",
    "isOffDay": true,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1405-11-25",
    "title": "جشن ولنتاین",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1405-11-29",
    "title": "جشن سپندارمذگان و روز عشق",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1405-11-29",
    "title": "فاجعه انفجار قطار نیشابور [1382 خورشیدی]",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1405-12-03",
    "title": "ولادت امام حسن مجتبی (ع) (۱۵ رمضان)",
    "kind": "religious",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1405-12-05",
    "title": "روز بزرگداشت خواجه نصیر الدین طوسی و روز مهندس",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1405-12-06",
    "title": "شب قدر (۱۸ رمضان)",
    "kind": "religious",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1405-12-07",
    "title": "ضربت خوردن حضرت علی (ع) (۱۹ رمضان)",
    "kind": "religious",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1405-12-07",
    "title": "سالروز استقلال کانون وکلای دادگستری و روز وکیل مدافع",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1405-12-09",
    "title": "شهادت حضرت علی (ع) (۲۱ رمضان)",
    "kind": "religious",
    "isOffDay": true,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1405-12-10",
    "title": "شب قدر (۲۲ رمضان)",
    "kind": "religious",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1405-12-15",
    "title": "روز درختکاری",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1405-12-17",
    "title": "روز جهانی زنان",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1405-12-19",
    "title": "عید سعید فطر (۱ شوال)",
    "kind": "religious",
    "isOffDay": true,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1405-12-20",
    "title": "تعطیل به مناسبت عید سعید فطر (۲ شوال)",
    "kind": "religious",
    "isOffDay": true,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1405-12-23",
    "title": "روز جهانی عدد پی π",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1405-12-25",
    "title": "پایان سرایش شاهنامه",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1405-12-25",
    "title": "روز بزرگداشت اختر چرخ ادب، پروین اعتصامی",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1405-12-29",
    "title": "روز ملی شدن صنعت نفت ایران",
    "kind": "official",
    "isOffDay": true,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1405-12-29",
    "title": "روز جهانی شادی",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1406-01-01",
    "title": "جشن نوروز/جشن سال نو",
    "kind": "official",
    "isOffDay": true,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1406-01-01",
    "title": "روز جهانی نوروز",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1406-01-02",
    "title": "عید نوروز",
    "kind": "official",
    "isOffDay": true,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1406-01-03",
    "title": "عید نوروز",
    "kind": "official",
    "isOffDay": true,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1406-01-03",
    "title": "روز جهانی هواشناسی",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1406-01-04",
    "title": "عید نوروز",
    "kind": "official",
    "isOffDay": true,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1406-01-06",
    "title": "روز امید، روز شادباش نویسی",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1406-01-06",
    "title": "زادروز اَشو زرتشت، اَبَراِنسان بزرگ تاریخ",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1406-01-07",
    "title": "روز جهانی تئاتر",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1406-01-10",
    "title": "جشن آبانگاه",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1406-01-12",
    "title": "روز جمهوری اسلامی",
    "kind": "official",
    "isOffDay": true,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1406-01-13",
    "title": "جشن سیزده به در",
    "kind": "official",
    "isOffDay": true,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1406-01-14",
    "title": "شهادت امام جعفر صادق (ع) (۲۵ شوال)",
    "kind": "religious",
    "isOffDay": true,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1406-01-17",
    "title": "سروش روز،جشن سروشگان",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1406-01-18",
    "title": "روز جهانی بهداشت",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1406-01-19",
    "title": "فروردین روز،جشن فروردینگان",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1406-01-20",
    "title": "ولادت حضرت معصومه (س)، روز دختران (۱ ذوالقعده)",
    "kind": "religious",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1406-01-23",
    "title": "روز دندانپزشک",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1406-01-25",
    "title": "روز بزرگداشت عطار نیشابوری",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1406-01-29",
    "title": "روز ارتش جمهوری اسلامی ایران",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1406-01-30",
    "title": "ولادت امام رضا (ع) (۱۱ ذوالقعده)",
    "kind": "religious",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1406-01-30",
    "title": "روز علوم آزمایشگاهی، زاد روز حکیم سید اسماعیل جرجانی",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1406-02-01",
    "title": "روز بزرگداشت سعدی",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1406-02-02",
    "title": "جشن گیاه آوری؛ روز زمین",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1406-02-03",
    "title": "روز بزرگداشت شیخ بهایی؛ روز ملی کارآفرینی؛ روز معماری",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1406-02-06",
    "title": "فاجعه‌ی انفجارِ بندر عباس [ 1404 خورشیدی]",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1406-02-07",
    "title": "روز جهانی طراحی و گرافیک",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1406-02-09",
    "title": "روز ملی روانشناس و مشاور",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1406-02-10",
    "title": "جشن چهلم نوروز؛ روز ملی خلیج فارس",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1406-02-11",
    "title": "روز جهانی کارگر",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1406-02-12",
    "title": "روز معلم",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1406-02-15",
    "title": "جشن میانه بهار/جشن بهاربد؛ روز شیراز",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1406-02-15",
    "title": "روز جهانی ماما",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1406-02-17",
    "title": "شهادت امام محمد تقی (ع) (۳۰ ذوالقعده)",
    "kind": "religious",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1406-02-18",
    "title": "روز جهانی صلیب سرخ و هلال احمر",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1406-02-22",
    "title": "زادروز مریم میرزاخانی ریاضیدان ایرانی، روز جهانی زن در ریاضیات",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1406-02-22",
    "title": "روز جهانی پرستار",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1406-02-24",
    "title": "شهادت امام محمد باقر (ع) (۷ ذوالحجه)",
    "kind": "religious",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1406-02-25",
    "title": "روز بزرگداشت فردوسی",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1406-02-26",
    "title": "روز عرفه (۹ ذوالحجه)",
    "kind": "religious",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1406-02-27",
    "title": "روز ارتباطات و روابط عمومی",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1406-02-27",
    "title": "عید سعید قربان (۱۰ ذوالحجه)",
    "kind": "religious",
    "isOffDay": true,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1406-02-28",
    "title": "روز بزرگداشت حکیم عمر خیام",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1406-02-28",
    "title": "روز جهانی موزه و میراث فرهنگی",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1406-03-01",
    "title": "روز بهره وری و بهینه سازی مصرف",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1406-03-01",
    "title": "ولادت امام علی النقی (ع) (۱۵ ذوالحجه)",
    "kind": "religious",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1406-03-01",
    "title": "روز بزرگداشت ملاصدرا",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1406-03-02",
    "title": "فروریختن ساختمان متروپل در آبادان",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1406-03-03",
    "title": "فتح خرمشهر در عملیات بیت المقدس و روز مقاومت، ایثار و پیروزی",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1406-03-04",
    "title": "عید سعید غدیر خم (۱۸ ذوالحجه)",
    "kind": "religious",
    "isOffDay": true,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1406-03-04",
    "title": "روز دزفول، روز مقاومت و پایداری",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1406-03-06",
    "title": "خرداد روز،جشن خردادگان",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1406-03-06",
    "title": "ولادت امام موسی کاظم (ع) (۲۰ ذوالحجه)",
    "kind": "religious",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1406-03-10",
    "title": "روز جهانی بدون دخانیات",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1406-03-14",
    "title": "رحلت حضرت امام خمینی",
    "kind": "official",
    "isOffDay": true,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1406-03-15",
    "title": "قیام 15 خرداد",
    "kind": "official",
    "isOffDay": true,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1406-03-15",
    "title": "روز جهانی محیط زیست",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1406-03-20",
    "title": "روز جهانی صنایع دستی",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1406-03-22",
    "title": "روز جهانی مبارزه با کار کودکان",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1406-03-24",
    "title": "روز جهانی اهدای خون",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1406-03-25",
    "title": "روز ملی گل وگیاه",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1406-03-25",
    "title": "تاسوعای حسینی (۹ محرم)",
    "kind": "religious",
    "isOffDay": true,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1406-03-26",
    "title": "عاشورای حسینی (۱۰ محرم)",
    "kind": "religious",
    "isOffDay": true,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1406-03-26",
    "title": "روز جهانی پدر",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1406-03-27",
    "title": "روز جهانی بیابان زدایی",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1406-03-28",
    "title": "شهادت امام زین العابدین (ع) (۱۲ محرم)",
    "kind": "religious",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1406-03-31",
    "title": "سالروز زلزله رودبار و منجیل [1369خورشیدی]",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1406-04-01",
    "title": "جشن آب پاشونک، جشن آغاز تابستان",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1406-04-05",
    "title": "روز جهانی مبارزه با مواد مخدر",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1406-04-07",
    "title": "انفجار دفتر حزب جمهوری اسلامی؛ روز قوه قضاییه",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1406-04-08",
    "title": "روز مبارزه با سلاح های شیمیایی و میکروبی",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1406-04-10",
    "title": "روز صنعت و معدن",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1406-04-10",
    "title": "زادروز بابک خرمدین، سپه‌سالار دلاور ایران",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1406-04-10",
    "title": "روز بزرگداشت صائب تبریزی",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1406-04-12",
    "title": "شلیک به پرواز 655 ایران ایر توسط ناو وینسنس [ 1367 خورشیدی ]",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1406-04-14",
    "title": "روز قلم",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1406-04-15",
    "title": "جشن خام خواری",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1406-04-25",
    "title": "روز بهزیستی و تامین اجتماعی",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1406-04-27",
    "title": "اعلام پذیرش قطعنامه 598 شورای امنیت از سوی ایران [ 1367 خورشیدی ]",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1406-05-03",
    "title": "اَمرداداربعین حسینی (۲۰ صفر)",
    "kind": "religious",
    "isOffDay": true,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1406-05-07",
    "title": "اَمرداداَمرداد روز،جشن اَمردادگان",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1406-05-08",
    "title": "اَمردادروز بزرگداشت شیخ شهاب الدین سهروردی",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1406-05-10",
    "title": "اَمردادجشن چله تابستان",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1406-05-10",
    "title": "اَمردادآغاز هفته جهانی شیردهی",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1406-05-11",
    "title": "اَمردادرحلت رسول اکرم؛شهادت امام حسن مجتبی (ع) (۲۸ صفر)",
    "kind": "religious",
    "isOffDay": true,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1406-05-12",
    "title": "اَمردادشهادت امام رضا (ع) (۳۰ صفر)",
    "kind": "religious",
    "isOffDay": true,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1406-05-13",
    "title": "اَمردادهجرت پیامبر اکرم از مکه به مدینه (۱ ربیع الاول)",
    "kind": "religious",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1406-05-14",
    "title": "اَمردادسالروز صدور فرمان مشروطیت",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1406-05-17",
    "title": "اَمردادروز خبرنگار",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1406-05-20",
    "title": "اَمردادشهادت امام حسن عسکری (ع) (۸ ربیع الاول)",
    "kind": "religious",
    "isOffDay": true,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1406-05-22",
    "title": "اَمردادروز جهانی چپ دست ها",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1406-05-24",
    "title": "اَمردادمیلاد رسول اکرم به روایت اهل سنت (۱۲ ربیع الاول)",
    "kind": "religious",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1406-05-28",
    "title": "اَمردادسالروز وقایع پس از برکناری محمد مصدق‌السلطنه",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1406-05-28",
    "title": "اَمردادسالروز فاجعه آتش زدن سینما رکس آبادان",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1406-05-28",
    "title": "اَمردادروز جهانی عکاسی",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1406-05-29",
    "title": "اَمردادمیلاد رسول اکرم و امام جعفر صادق (ع) (۱۷ ربیع الاول)",
    "kind": "religious",
    "isOffDay": true,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1406-06-01",
    "title": "روز بزرگداشت ابوعلی سینا و روز پزشک",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1406-06-02",
    "title": "آغاز هفته دولت",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1406-06-04",
    "title": "زادروز کوروش بزرگ",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1406-06-04",
    "title": "شهریور روز،جشن شهریورگان",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1406-06-05",
    "title": "روز بزرگداشت محمدبن زکریای رازی و روز داروساز",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1406-06-11",
    "title": "روز ملی صنعت چاپ",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1406-06-13",
    "title": "روز بزرگداشت ابوریحان بیرونی",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1406-06-19",
    "title": "ولادت امام حسن عسکری (ع) (۸ ربیع الثانی)",
    "kind": "religious",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1406-06-19",
    "title": "روز جهانی پیشگیری از خودکشی",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1406-06-20",
    "title": "حمله به برج‌های دوقلوی مرکز تجارت جهانی",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1406-06-21",
    "title": "روز سینما",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1406-06-21",
    "title": "وفات حضرت معصومه (س) (۱۰ ربیع الثانی)",
    "kind": "religious",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1406-06-27",
    "title": "روز شعر و ادب پارسی و روز بزرگداشت استاد شهریار",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1406-06-30",
    "title": "روز جهانی صلح",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1406-06-31",
    "title": "آغاز هفته دفاع مقدس",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1406-07-01",
    "title": "آغاز حمله مغول به ایران در پاییز 598 خورشیدی",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1406-07-04",
    "title": "روز گرامیداشت سربازان وطن",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1406-07-05",
    "title": "روز جهانی جهانگردی",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1406-07-07",
    "title": "روز آتش نشانی و ایمنی",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1406-07-07",
    "title": "روز بزرگداشت شمس تبریزی",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1406-07-08",
    "title": "روز بزرگداشت مولوی",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1406-07-08",
    "title": "روز جهانی ناشنوایان",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1406-07-08",
    "title": "روز جهانی ترجمه و مترجم",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1406-07-09",
    "title": "روز جهانی سالمندان",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1406-07-10",
    "title": "مهر روز،جشن مهرگان",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1406-07-12",
    "title": "آغاز هفته جهانی فضا",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1406-07-13",
    "title": "روز جهانی معلم",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1406-07-14",
    "title": "روز دامپزشکی",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1406-07-14",
    "title": "ولادت حضرت زینب (س) و روز پرستار و بهورز (۵ جمادی الاول)",
    "kind": "religious",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1406-07-16",
    "title": "روز ملی کودک",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1406-07-17",
    "title": "روز جهانی پست",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1406-07-18",
    "title": "روز جهانی مبارزه با حکم اعدام",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1406-07-19",
    "title": "روز جهانی دختر",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1406-07-20",
    "title": "روز بزرگداشت حافظ",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1406-07-21",
    "title": "روز پیروزی کاوه و فریدون بر ضحاک",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1406-07-22",
    "title": "روز جهانی استاندارد",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1406-07-23",
    "title": "روز جهانی عصای سفید",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1406-07-24",
    "title": "روز جهانی غذا",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1406-07-25",
    "title": "روز جهانی ریشه کنی فقر",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1406-07-26",
    "title": "روز تربیت بدنی و ورزش",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1406-07-28",
    "title": "زادروز ستارخان ملقب به سردار ملی و از سرداران جنبش مشروطه ایران",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1406-07-29",
    "title": "روز ملی کوهنورد",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1406-08-01",
    "title": "روز آمار و برنامه ریزی",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1406-08-01",
    "title": "روز بزرگداشت ابوالفضل بیهقی، تاریخ‌نگار و نویسنده ایرانی",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1406-08-07",
    "title": "سالروز ورود کوروش بزرگ به بابل در سال 539 پیش از میلاد",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1406-08-08",
    "title": "روز ملی محیط بان",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1406-08-10",
    "title": "آبان روز، جشن آبانگان",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1406-08-12",
    "title": "شهادت حضرت فاطمه زهرا (س) (۳ جمادی الثانیه)",
    "kind": "religious",
    "isOffDay": true,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1406-08-14",
    "title": "روز ملّی مازندران",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1406-08-15",
    "title": "جشن میانه پاییز",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1406-08-18",
    "title": "روز ملی کیفیت",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1406-08-23",
    "title": "روز جهانی دیابت",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1406-08-24",
    "title": "روز کتاب و کتابخوانی",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1406-08-26",
    "title": "روز جهانی دانش آموز",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1406-08-28",
    "title": "روز جهانی آقایان",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1406-08-29",
    "title": "ولادت حضرت فاطمه زهرا (س) و روز مادر (۲۰ جمادی الثانیه)",
    "kind": "religious",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1406-08-29",
    "title": "روز جهانی کودک",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1406-09-01",
    "title": "آذر جشن",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1406-09-04",
    "title": "روز جهانی مبارزه با خشونت علیه زنان",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1406-09-05",
    "title": "روز بسیج مستضعفان",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1406-09-07",
    "title": "سالروز عملیات مروارید و روز نیروی دریایی ارتش",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1406-09-09",
    "title": "جشن آذرگان ،آذر روز",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1406-09-09",
    "title": "ولادت امام محمد باقر (ع) (۱ رجب)",
    "kind": "religious",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1406-09-10",
    "title": "روز جهانی ایدز",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1406-09-11",
    "title": "شهادت امام علی النقی (ع) (۳ رجب)",
    "kind": "religious",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1406-09-12",
    "title": "روز جهانی معلولان (کم‌توانان)",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1406-09-13",
    "title": "روز صنعت بیمه",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1406-09-15",
    "title": "روز حسابدار",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1406-09-18",
    "title": "ولادت امام محمد تقی (ع) (۱۰ رجب)",
    "kind": "religious",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1406-09-19",
    "title": "روز جهانی حقوق بشر",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1406-09-20",
    "title": "روز جهانی کوهستان",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1406-09-21",
    "title": "ولادت امام علی (ع) و روز پدر (۱۳ رجب)",
    "kind": "religious",
    "isOffDay": true,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1406-09-23",
    "title": "وفات حضرت زینب (س) (۱۵ رجب)",
    "kind": "religious",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1406-09-25",
    "title": "روز پژوهش و فناوری",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1406-09-30",
    "title": "جشن شب یلدا، شب چلّه",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1406-10-01",
    "title": "روز میلاد خورشید؛ جشن خرم روز، نخستین جشن دیگان",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1406-10-03",
    "title": "شهادت امام موسی کاظم (ع) (۲۵ رجب)",
    "kind": "religious",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1406-10-03",
    "title": "سالروز عملیات کربلای 4 [1365 خورشیدی]",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1406-10-04",
    "title": "جشن کریسمس",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1406-10-04",
    "title": "روز بزرگداشت دوستی",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1406-10-05",
    "title": "زمین لرزه ی بم [1382 خورشیدی]",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1406-10-05",
    "title": "مبعث رسول اکرم (ص) (۲۷ رجب)",
    "kind": "religious",
    "isOffDay": true,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1406-10-05",
    "title": "سالروز شهادت اَشو زرتشت، اَبَراِنسان بزرگ تاریخ",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1406-10-08",
    "title": "دی به آذر روز، دومین جشن دیگان",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1406-10-09",
    "title": "اعدام میهن‌پرستان آذری در تبریز توسط قوای اشغالگر روس [1290 خورشیدی]",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1406-10-11",
    "title": "ولادت سالار شهیدان، امام حسین (ع) و روز پاسدار (۳ شعبان)",
    "kind": "religious",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1406-10-11",
    "title": "جشن آغاز سال نو میلادی",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1406-10-12",
    "title": "ولادت حضرت ابوالفضل العباس (ع) و روز جانباز (۴ شعبان)",
    "kind": "religious",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1406-10-12",
    "title": "روز حافظ",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1406-10-13",
    "title": "ولادت امام زین العابدین (ع) (۵ شعبان)",
    "kind": "religious",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1406-10-13",
    "title": "شهادت سردار حاج قاسم سلیمانی [1398 خورشیدی]",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1406-10-15",
    "title": "دی به مهر روز، سومین جشن دیگان",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1406-10-16",
    "title": "غرق شدن کشتی سانچی [1396 خورشیدی]",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1406-10-18",
    "title": "شلیک به پرواز 752 هواپیمایی اوکراین [1398 خورشیدی]",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1406-10-19",
    "title": "ولادت حضرت علی اکبر (ع) و روز جوان (۱۱ شعبان)",
    "kind": "religious",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1406-10-19",
    "title": "درگذشت اکبر هاشمی رفسنجانی [1395 خورشیدی]",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1406-10-20",
    "title": "قتل امیرکبیر به دستور ناصرالدین شاه قاجار [1230 خورشیدی]",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1406-10-23",
    "title": "دی به دین روز، چهارمین جشن دیگان",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1406-10-23",
    "title": "ولادت حضرت قائم عجل الله تعالی فرجه و جشن نیمه شعبان (۱۵ شعبان)",
    "kind": "religious",
    "isOffDay": true,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1406-10-30",
    "title": "آتش‌سوزی و فروریختن ساختمان پلاسکو [1395 خورشیدی]",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1406-11-01",
    "title": "زادروز فردوسی",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1406-11-02",
    "title": "بهمن روز، جشن بهمنگان",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1406-11-06",
    "title": "بزرگداشت صفی‌الدین اُرمَوی و روز موسیقی ایرانی",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1406-11-10",
    "title": "جشن سده، گرامیداشتِ کشف آتش به دستِ هوشنگ شاه",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1406-11-12",
    "title": "بازگشت امام خمینی (ره) به ایران",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1406-11-15",
    "title": "جشن میانه زمستان",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1406-11-19",
    "title": "روز نیروی هوایی",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1406-11-22",
    "title": "پیروزی انقلاب اسلامی",
    "kind": "official",
    "isOffDay": true,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1406-11-23",
    "title": "ولادت امام حسن مجتبی (ع) (۱۵ رمضان)",
    "kind": "religious",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1406-11-25",
    "title": "جشن ولنتاین",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1406-11-26",
    "title": "شب قدر (۱۸ رمضان)",
    "kind": "religious",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1406-11-27",
    "title": "ضربت خوردن حضرت علی (ع) (۱۹ رمضان)",
    "kind": "religious",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1406-11-29",
    "title": "جشن سپندارمذگان و روز عشق",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1406-11-29",
    "title": "شهادت حضرت علی (ع) (۲۱ رمضان)",
    "kind": "religious",
    "isOffDay": true,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1406-11-29",
    "title": "فاجعه انفجار قطار نیشابور [1382 خورشیدی]",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1406-11-30",
    "title": "شب قدر (۲۲ رمضان)",
    "kind": "religious",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1406-12-05",
    "title": "روز بزرگداشت خواجه نصیر الدین طوسی و روز مهندس",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1406-12-07",
    "title": "سالروز استقلال کانون وکلای دادگستری و روز وکیل مدافع",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1406-12-08",
    "title": "عید سعید فطر (۱ شوال)",
    "kind": "religious",
    "isOffDay": true,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1406-12-09",
    "title": "تعطیل به مناسبت عید سعید فطر (۲ شوال)",
    "kind": "religious",
    "isOffDay": true,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1406-12-15",
    "title": "روز درختکاری",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1406-12-18",
    "title": "روز جهانی زنان",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1406-12-24",
    "title": "روز جهانی عدد پی π",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1406-12-25",
    "title": "پایان سرایش شاهنامه",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1406-12-25",
    "title": "روز بزرگداشت اختر چرخ ادب، پروین اعتصامی",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1406-12-29",
    "title": "روز ملی شدن صنعت نفت ایران",
    "kind": "official",
    "isOffDay": true,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1407-01-01",
    "title": "جشن نوروز/جشن سال نو",
    "kind": "official",
    "isOffDay": true,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1407-01-01",
    "title": "روز جهانی شادی",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1407-01-02",
    "title": "عید نوروز",
    "kind": "official",
    "isOffDay": true,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1407-01-02",
    "title": "روز جهانی نوروز",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1407-01-03",
    "title": "عید نوروز",
    "kind": "official",
    "isOffDay": true,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1407-01-03",
    "title": "شهادت امام جعفر صادق (ع) (۲۵ شوال)",
    "kind": "religious",
    "isOffDay": true,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1407-01-04",
    "title": "عید نوروز",
    "kind": "official",
    "isOffDay": true,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1407-01-04",
    "title": "روز جهانی هواشناسی",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1407-01-06",
    "title": "روز امید، روز شادباش نویسی",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1407-01-06",
    "title": "زادروز اَشو زرتشت، اَبَراِنسان بزرگ تاریخ",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1407-01-08",
    "title": "روز جهانی تئاتر",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1407-01-09",
    "title": "ولادت حضرت معصومه (س)، روز دختران (۱ ذوالقعده)",
    "kind": "religious",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1407-01-10",
    "title": "جشن آبانگاه",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1407-01-12",
    "title": "روز جمهوری اسلامی",
    "kind": "official",
    "isOffDay": true,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1407-01-13",
    "title": "جشن سیزده به در",
    "kind": "official",
    "isOffDay": true,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1407-01-17",
    "title": "سروش روز،جشن سروشگان",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1407-01-19",
    "title": "روز جهانی بهداشت",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1407-01-19",
    "title": "فروردین روز،جشن فروردینگان",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1407-01-19",
    "title": "ولادت امام رضا (ع) (۱۱ ذوالقعده)",
    "kind": "religious",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1407-01-23",
    "title": "روز دندانپزشک",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1407-01-25",
    "title": "روز بزرگداشت عطار نیشابوری",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1407-01-29",
    "title": "روز ارتش جمهوری اسلامی ایران",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1407-01-30",
    "title": "روز علوم آزمایشگاهی، زاد روز حکیم سید اسماعیل جرجانی",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1407-02-01",
    "title": "روز بزرگداشت سعدی",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1407-02-03",
    "title": "جشن گیاه آوری؛ روز زمین",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1407-02-03",
    "title": "روز بزرگداشت شیخ بهایی؛ روز ملی کارآفرینی؛ روز معماری",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1407-02-06",
    "title": "فاجعه‌ی انفجارِ بندر عباس [ 1404 خورشیدی]",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1407-02-07",
    "title": "شهادت امام محمد تقی (ع) (۳۰ ذوالقعده)",
    "kind": "religious",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1407-02-08",
    "title": "روز جهانی طراحی و گرافیک",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1407-02-09",
    "title": "روز ملی روانشناس و مشاور",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1407-02-10",
    "title": "جشن چهلم نوروز؛ روز ملی خلیج فارس",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1407-02-12",
    "title": "روز معلم",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1407-02-12",
    "title": "روز جهانی کارگر",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1407-02-14",
    "title": "شهادت امام محمد باقر (ع) (۷ ذوالحجه)",
    "kind": "religious",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1407-02-15",
    "title": "جشن میانه بهار/جشن بهاربد؛ روز شیراز",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1407-02-16",
    "title": "روز عرفه (۹ ذوالحجه)",
    "kind": "religious",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1407-02-16",
    "title": "روز جهانی ماما",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1407-02-17",
    "title": "عید سعید قربان (۱۰ ذوالحجه)",
    "kind": "religious",
    "isOffDay": true,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1407-02-19",
    "title": "روز جهانی صلیب سرخ و هلال احمر",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1407-02-22",
    "title": "ولادت امام علی النقی (ع) (۱۵ ذوالحجه)",
    "kind": "religious",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1407-02-22",
    "title": "زادروز مریم میرزاخانی ریاضیدان ایرانی، روز جهانی زن در ریاضیات",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1407-02-23",
    "title": "روز جهانی پرستار",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1407-02-25",
    "title": "روز بزرگداشت فردوسی",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1407-02-25",
    "title": "عید سعید غدیر خم (۱۸ ذوالحجه)",
    "kind": "religious",
    "isOffDay": true,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1407-02-27",
    "title": "روز ارتباطات و روابط عمومی",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1407-02-27",
    "title": "ولادت امام موسی کاظم (ع) (۲۰ ذوالحجه)",
    "kind": "religious",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1407-02-28",
    "title": "روز بزرگداشت حکیم عمر خیام",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1407-02-29",
    "title": "روز جهانی موزه و میراث فرهنگی",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1407-03-01",
    "title": "روز بهره وری و بهینه سازی مصرف",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1407-03-01",
    "title": "روز بزرگداشت ملاصدرا",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1407-03-02",
    "title": "فروریختن ساختمان متروپل در آبادان",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1407-03-03",
    "title": "فتح خرمشهر در عملیات بیت المقدس و روز مقاومت، ایثار و پیروزی",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1407-03-04",
    "title": "روز دزفول، روز مقاومت و پایداری",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1407-03-06",
    "title": "خرداد روز،جشن خردادگان",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1407-03-11",
    "title": "روز جهانی بدون دخانیات",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1407-03-14",
    "title": "رحلت حضرت امام خمینی",
    "kind": "official",
    "isOffDay": true,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1407-03-14",
    "title": "تاسوعای حسینی (۹ محرم)",
    "kind": "religious",
    "isOffDay": true,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1407-03-15",
    "title": "قیام 15 خرداد",
    "kind": "official",
    "isOffDay": true,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1407-03-15",
    "title": "عاشورای حسینی (۱۰ محرم)",
    "kind": "religious",
    "isOffDay": true,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1407-03-16",
    "title": "روز جهانی محیط زیست",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1407-03-17",
    "title": "شهادت امام زین العابدین (ع) (۱۲ محرم)",
    "kind": "religious",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1407-03-21",
    "title": "روز جهانی صنایع دستی",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1407-03-23",
    "title": "روز جهانی مبارزه با کار کودکان",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1407-03-25",
    "title": "روز ملی گل وگیاه",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1407-03-25",
    "title": "روز جهانی اهدای خون",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1407-03-27",
    "title": "روز جهانی پدر",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1407-03-28",
    "title": "روز جهانی بیابان زدایی",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1407-03-31",
    "title": "سالروز زلزله رودبار و منجیل [1369خورشیدی]",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1407-04-01",
    "title": "جشن آب پاشونک، جشن آغاز تابستان",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1407-04-06",
    "title": "روز جهانی مبارزه با مواد مخدر",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1407-04-07",
    "title": "انفجار دفتر حزب جمهوری اسلامی؛ روز قوه قضاییه",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1407-04-08",
    "title": "روز مبارزه با سلاح های شیمیایی و میکروبی",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1407-04-10",
    "title": "روز صنعت و معدن",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1407-04-10",
    "title": "زادروز بابک خرمدین، سپه‌سالار دلاور ایران",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1407-04-10",
    "title": "روز بزرگداشت صائب تبریزی",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1407-04-12",
    "title": "شلیک به پرواز 655 ایران ایر توسط ناو وینسنس [ 1367 خورشیدی ]",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1407-04-14",
    "title": "روز قلم",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1407-04-15",
    "title": "جشن خام خواری",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1407-04-24",
    "title": "اربعین حسینی (۲۰ صفر)",
    "kind": "religious",
    "isOffDay": true,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1407-04-25",
    "title": "روز بهزیستی و تامین اجتماعی",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1407-04-27",
    "title": "اعلام پذیرش قطعنامه 598 شورای امنیت از سوی ایران [ 1367 خورشیدی ]",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1407-05-01",
    "title": "اَمردادرحلت رسول اکرم؛شهادت امام حسن مجتبی (ع) (۲۸ صفر)",
    "kind": "religious",
    "isOffDay": true,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1407-05-02",
    "title": "اَمردادشهادت امام رضا (ع) (۳۰ صفر)",
    "kind": "religious",
    "isOffDay": true,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1407-05-03",
    "title": "اَمردادهجرت پیامبر اکرم از مکه به مدینه (۱ ربیع الاول)",
    "kind": "religious",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1407-05-07",
    "title": "اَمرداداَمرداد روز،جشن اَمردادگان",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1407-05-08",
    "title": "اَمردادروز بزرگداشت شیخ شهاب الدین سهروردی",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1407-05-10",
    "title": "اَمردادجشن چله تابستان",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1407-05-10",
    "title": "اَمردادشهادت امام حسن عسکری (ع) (۸ ربیع الاول)",
    "kind": "religious",
    "isOffDay": true,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1407-05-11",
    "title": "اَمردادآغاز هفته جهانی شیردهی",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1407-05-14",
    "title": "اَمردادسالروز صدور فرمان مشروطیت",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1407-05-14",
    "title": "اَمردادمیلاد رسول اکرم به روایت اهل سنت (۱۲ ربیع الاول)",
    "kind": "religious",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1407-05-17",
    "title": "اَمردادروز خبرنگار",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1407-05-19",
    "title": "اَمردادمیلاد رسول اکرم و امام جعفر صادق (ع) (۱۷ ربیع الاول)",
    "kind": "religious",
    "isOffDay": true,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1407-05-23",
    "title": "اَمردادروز جهانی چپ دست ها",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1407-05-28",
    "title": "اَمردادسالروز وقایع پس از برکناری محمد مصدق‌السلطنه",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1407-05-28",
    "title": "اَمردادسالروز فاجعه آتش زدن سینما رکس آبادان",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1407-05-29",
    "title": "اَمردادروز جهانی عکاسی",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1407-06-01",
    "title": "روز بزرگداشت ابوعلی سینا و روز پزشک",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1407-06-02",
    "title": "آغاز هفته دولت",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1407-06-04",
    "title": "زادروز کوروش بزرگ",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1407-06-04",
    "title": "شهریور روز،جشن شهریورگان",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1407-06-05",
    "title": "روز بزرگداشت محمدبن زکریای رازی و روز داروساز",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1407-06-09",
    "title": "ولادت امام حسن عسکری (ع) (۸ ربیع الثانی)",
    "kind": "religious",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1407-06-11",
    "title": "روز ملی صنعت چاپ",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1407-06-11",
    "title": "وفات حضرت معصومه (س) (۱۰ ربیع الثانی)",
    "kind": "religious",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1407-06-13",
    "title": "روز بزرگداشت ابوریحان بیرونی",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1407-06-20",
    "title": "روز جهانی پیشگیری از خودکشی",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1407-06-21",
    "title": "روز سینما",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1407-06-21",
    "title": "حمله به برج‌های دوقلوی مرکز تجارت جهانی",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1407-06-27",
    "title": "روز شعر و ادب پارسی و روز بزرگداشت استاد شهریار",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1407-06-31",
    "title": "آغاز هفته دفاع مقدس",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1407-06-31",
    "title": "روز جهانی صلح",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1407-07-01",
    "title": "آغاز حمله مغول به ایران در پاییز 598 خورشیدی",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1407-07-04",
    "title": "ولادت حضرت زینب (س) و روز پرستار و بهورز (۵ جمادی الاول)",
    "kind": "religious",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1407-07-04",
    "title": "روز گرامیداشت سربازان وطن",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1407-07-06",
    "title": "روز جهانی جهانگردی",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1407-07-07",
    "title": "روز آتش نشانی و ایمنی",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1407-07-07",
    "title": "روز بزرگداشت شمس تبریزی",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1407-07-08",
    "title": "روز بزرگداشت مولوی",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1407-07-09",
    "title": "روز جهانی ناشنوایان",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1407-07-09",
    "title": "روز جهانی ترجمه و مترجم",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1407-07-10",
    "title": "مهر روز،جشن مهرگان",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1407-07-10",
    "title": "روز جهانی سالمندان",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1407-07-13",
    "title": "آغاز هفته جهانی فضا",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1407-07-14",
    "title": "روز دامپزشکی",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1407-07-14",
    "title": "روز جهانی معلم",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1407-07-16",
    "title": "روز ملی کودک",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1407-07-18",
    "title": "روز جهانی پست",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1407-07-19",
    "title": "روز جهانی مبارزه با حکم اعدام",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1407-07-20",
    "title": "روز بزرگداشت حافظ",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1407-07-20",
    "title": "روز جهانی دختر",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1407-07-21",
    "title": "روز پیروزی کاوه و فریدون بر ضحاک",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1407-07-23",
    "title": "روز جهانی استاندارد",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1407-07-24",
    "title": "روز جهانی عصای سفید",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1407-07-25",
    "title": "روز جهانی غذا",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1407-07-26",
    "title": "روز تربیت بدنی و ورزش",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1407-07-26",
    "title": "روز جهانی ریشه کنی فقر",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1407-07-28",
    "title": "زادروز ستارخان ملقب به سردار ملی و از سرداران جنبش مشروطه ایران",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1407-07-29",
    "title": "روز ملی کوهنورد",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1407-08-01",
    "title": "روز آمار و برنامه ریزی",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1407-08-01",
    "title": "شهادت حضرت فاطمه زهرا (س) (۳ جمادی الثانیه)",
    "kind": "religious",
    "isOffDay": true,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1407-08-01",
    "title": "روز بزرگداشت ابوالفضل بیهقی، تاریخ‌نگار و نویسنده ایرانی",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1407-08-07",
    "title": "سالروز ورود کوروش بزرگ به بابل در سال 539 پیش از میلاد",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1407-08-08",
    "title": "روز ملی محیط بان",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1407-08-10",
    "title": "آبان روز، جشن آبانگان",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1407-08-14",
    "title": "روز ملّی مازندران",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1407-08-15",
    "title": "جشن میانه پاییز",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1407-08-18",
    "title": "روز ملی کیفیت",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1407-08-18",
    "title": "ولادت حضرت فاطمه زهرا (س) و روز مادر (۲۰ جمادی الثانیه)",
    "kind": "religious",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1407-08-24",
    "title": "روز کتاب و کتابخوانی",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1407-08-24",
    "title": "روز جهانی دیابت",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1407-08-27",
    "title": "روز جهانی دانش آموز",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1407-08-29",
    "title": "ولادت امام محمد باقر (ع) (۱ رجب)",
    "kind": "religious",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1407-08-29",
    "title": "روز جهانی آقایان",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1407-08-30",
    "title": "روز جهانی کودک",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1407-09-01",
    "title": "آذر جشن",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1407-09-01",
    "title": "شهادت امام علی النقی (ع) (۳ رجب)",
    "kind": "religious",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1407-09-05",
    "title": "روز بسیج مستضعفان",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1407-09-05",
    "title": "روز جهانی مبارزه با خشونت علیه زنان",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1407-09-07",
    "title": "سالروز عملیات مروارید و روز نیروی دریایی ارتش",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1407-09-08",
    "title": "ولادت امام محمد تقی (ع) (۱۰ رجب)",
    "kind": "religious",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1407-09-09",
    "title": "جشن آذرگان ،آذر روز",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1407-09-11",
    "title": "ولادت امام علی (ع) و روز پدر (۱۳ رجب)",
    "kind": "religious",
    "isOffDay": true,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1407-09-11",
    "title": "روز جهانی ایدز",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1407-09-13",
    "title": "روز صنعت بیمه",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1407-09-13",
    "title": "روز جهانی معلولان (کم‌توانان)",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1407-09-13",
    "title": "وفات حضرت زینب (س) (۱۵ رجب)",
    "kind": "religious",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1407-09-15",
    "title": "روز حسابدار",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1407-09-20",
    "title": "روز جهانی حقوق بشر",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1407-09-21",
    "title": "روز جهانی کوهستان",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1407-09-23",
    "title": "شهادت امام موسی کاظم (ع) (۲۵ رجب)",
    "kind": "religious",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1407-09-25",
    "title": "روز پژوهش و فناوری",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1407-09-25",
    "title": "مبعث رسول اکرم (ص) (۲۷ رجب)",
    "kind": "religious",
    "isOffDay": true,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1407-09-30",
    "title": "ولادت سالار شهیدان، امام حسین (ع) و روز پاسدار (۳ شعبان)",
    "kind": "religious",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1407-09-30",
    "title": "جشن شب یلدا، شب چلّه",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1407-10-01",
    "title": "روز میلاد خورشید؛ جشن خرم روز، نخستین جشن دیگان",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1407-10-01",
    "title": "ولادت حضرت ابوالفضل العباس (ع) و روز جانباز (۴ شعبان)",
    "kind": "religious",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1407-10-02",
    "title": "ولادت امام زین العابدین (ع) (۵ شعبان)",
    "kind": "religious",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1407-10-03",
    "title": "سالروز عملیات کربلای 4 [1365 خورشیدی]",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1407-10-05",
    "title": "زمین لرزه ی بم [1382 خورشیدی]",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1407-10-05",
    "title": "جشن کریسمس",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1407-10-05",
    "title": "سالروز شهادت اَشو زرتشت، اَبَراِنسان بزرگ تاریخ",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1407-10-05",
    "title": "روز بزرگداشت دوستی",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1407-10-08",
    "title": "دی به آذر روز، دومین جشن دیگان",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1407-10-08",
    "title": "ولادت حضرت علی اکبر (ع) و روز جوان (۱۱ شعبان)",
    "kind": "religious",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1407-10-09",
    "title": "اعدام میهن‌پرستان آذری در تبریز توسط قوای اشغالگر روس [1290 خورشیدی]",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1407-10-12",
    "title": "ولادت حضرت قائم عجل الله تعالی فرجه و جشن نیمه شعبان (۱۵ شعبان)",
    "kind": "religious",
    "isOffDay": true,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1407-10-12",
    "title": "جشن آغاز سال نو میلادی",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1407-10-12",
    "title": "روز حافظ",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1407-10-13",
    "title": "شهادت سردار حاج قاسم سلیمانی [1398 خورشیدی]",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1407-10-15",
    "title": "دی به مهر روز، سومین جشن دیگان",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1407-10-16",
    "title": "غرق شدن کشتی سانچی [1396 خورشیدی]",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1407-10-18",
    "title": "شلیک به پرواز 752 هواپیمایی اوکراین [1398 خورشیدی]",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1407-10-19",
    "title": "درگذشت اکبر هاشمی رفسنجانی [1395 خورشیدی]",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1407-10-20",
    "title": "قتل امیرکبیر به دستور ناصرالدین شاه قاجار [1230 خورشیدی]",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1407-10-23",
    "title": "دی به دین روز، چهارمین جشن دیگان",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1407-10-30",
    "title": "آتش‌سوزی و فروریختن ساختمان پلاسکو [1395 خورشیدی]",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1407-11-01",
    "title": "زادروز فردوسی",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1407-11-02",
    "title": "بهمن روز، جشن بهمنگان",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1407-11-06",
    "title": "بزرگداشت صفی‌الدین اُرمَوی و روز موسیقی ایرانی",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1407-11-10",
    "title": "جشن سده، گرامیداشتِ کشف آتش به دستِ هوشنگ شاه",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1407-11-12",
    "title": "بازگشت امام خمینی (ره) به ایران",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1407-11-12",
    "title": "ولادت امام حسن مجتبی (ع) (۱۵ رمضان)",
    "kind": "religious",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1407-11-15",
    "title": "جشن میانه زمستان",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1407-11-15",
    "title": "شب قدر (۱۸ رمضان)",
    "kind": "religious",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1407-11-16",
    "title": "ضربت خوردن حضرت علی (ع) (۱۹ رمضان)",
    "kind": "religious",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1407-11-18",
    "title": "شهادت حضرت علی (ع) (۲۱ رمضان)",
    "kind": "religious",
    "isOffDay": true,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1407-11-19",
    "title": "روز نیروی هوایی",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1407-11-19",
    "title": "شب قدر (۲۲ رمضان)",
    "kind": "religious",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1407-11-22",
    "title": "پیروزی انقلاب اسلامی",
    "kind": "official",
    "isOffDay": true,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1407-11-26",
    "title": "جشن ولنتاین",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1407-11-27",
    "title": "عید سعید فطر (۱ شوال)",
    "kind": "religious",
    "isOffDay": true,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1407-11-28",
    "title": "تعطیل به مناسبت عید سعید فطر (۲ شوال)",
    "kind": "religious",
    "isOffDay": true,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1407-11-29",
    "title": "جشن سپندارمذگان و روز عشق",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1407-11-29",
    "title": "فاجعه انفجار قطار نیشابور [1382 خورشیدی]",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1407-12-05",
    "title": "روز بزرگداشت خواجه نصیر الدین طوسی و روز مهندس",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1407-12-07",
    "title": "سالروز استقلال کانون وکلای دادگستری و روز وکیل مدافع",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1407-12-15",
    "title": "روز درختکاری",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1407-12-18",
    "title": "روز جهانی زنان",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1407-12-21",
    "title": "شهادت امام جعفر صادق (ع) (۲۵ شوال)",
    "kind": "religious",
    "isOffDay": true,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1407-12-24",
    "title": "روز جهانی عدد پی π",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1407-12-25",
    "title": "پایان سرایش شاهنامه",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1407-12-25",
    "title": "روز بزرگداشت اختر چرخ ادب، پروین اعتصامی",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1407-12-27",
    "title": "ولادت حضرت معصومه (س)، روز دختران (۱ ذوالقعده)",
    "kind": "religious",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1407-12-29",
    "title": "روز ملی شدن صنعت نفت ایران",
    "kind": "official",
    "isOffDay": true,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1408-01-01",
    "title": "جشن نوروز/جشن سال نو",
    "kind": "official",
    "isOffDay": true,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1408-01-01",
    "title": "روز جهانی شادی",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1408-01-02",
    "title": "عید نوروز",
    "kind": "official",
    "isOffDay": true,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1408-01-02",
    "title": "روز جهانی نوروز",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1408-01-03",
    "title": "عید نوروز",
    "kind": "official",
    "isOffDay": true,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1408-01-04",
    "title": "عید نوروز",
    "kind": "official",
    "isOffDay": true,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1408-01-04",
    "title": "روز جهانی هواشناسی",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1408-01-06",
    "title": "روز امید، روز شادباش نویسی",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1408-01-06",
    "title": "زادروز اَشو زرتشت، اَبَراِنسان بزرگ تاریخ",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1408-01-08",
    "title": "ولادت امام رضا (ع) (۱۱ ذوالقعده)",
    "kind": "religious",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1408-01-08",
    "title": "روز جهانی تئاتر",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1408-01-10",
    "title": "جشن آبانگاه",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1408-01-12",
    "title": "روز جمهوری اسلامی",
    "kind": "official",
    "isOffDay": true,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1408-01-13",
    "title": "جشن سیزده به در",
    "kind": "official",
    "isOffDay": true,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1408-01-17",
    "title": "سروش روز،جشن سروشگان",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1408-01-19",
    "title": "روز جهانی بهداشت",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1408-01-19",
    "title": "فروردین روز،جشن فروردینگان",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1408-01-23",
    "title": "روز دندانپزشک",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1408-01-25",
    "title": "روز بزرگداشت عطار نیشابوری",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1408-01-27",
    "title": "شهادت امام محمد تقی (ع) (۳۰ ذوالقعده)",
    "kind": "religious",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1408-01-29",
    "title": "روز ارتش جمهوری اسلامی ایران",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1408-01-30",
    "title": "روز علوم آزمایشگاهی، زاد روز حکیم سید اسماعیل جرجانی",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1408-02-01",
    "title": "روز بزرگداشت سعدی",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1408-02-03",
    "title": "جشن گیاه آوری؛ روز زمین",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1408-02-03",
    "title": "روز بزرگداشت شیخ بهایی؛ روز ملی کارآفرینی؛ روز معماری",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1408-02-03",
    "title": "شهادت امام محمد باقر (ع) (۷ ذوالحجه)",
    "kind": "religious",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1408-02-05",
    "title": "روز عرفه (۹ ذوالحجه)",
    "kind": "religious",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1408-02-06",
    "title": "عید سعید قربان (۱۰ ذوالحجه)",
    "kind": "religious",
    "isOffDay": true,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1408-02-06",
    "title": "فاجعه‌ی انفجارِ بندر عباس [ 1404 خورشیدی]",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1408-02-08",
    "title": "روز جهانی طراحی و گرافیک",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1408-02-09",
    "title": "روز ملی روانشناس و مشاور",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1408-02-10",
    "title": "جشن چهلم نوروز؛ روز ملی خلیج فارس",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1408-02-11",
    "title": "ولادت امام علی النقی (ع) (۱۵ ذوالحجه)",
    "kind": "religious",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1408-02-12",
    "title": "روز معلم",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1408-02-12",
    "title": "روز جهانی کارگر",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1408-02-14",
    "title": "عید سعید غدیر خم (۱۸ ذوالحجه)",
    "kind": "religious",
    "isOffDay": true,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1408-02-15",
    "title": "جشن میانه بهار/جشن بهاربد؛ روز شیراز",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1408-02-16",
    "title": "روز جهانی ماما",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1408-02-16",
    "title": "ولادت امام موسی کاظم (ع) (۲۰ ذوالحجه)",
    "kind": "religious",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1408-02-19",
    "title": "روز جهانی صلیب سرخ و هلال احمر",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1408-02-22",
    "title": "زادروز مریم میرزاخانی ریاضیدان ایرانی، روز جهانی زن در ریاضیات",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1408-02-23",
    "title": "روز جهانی پرستار",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1408-02-25",
    "title": "روز بزرگداشت فردوسی",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1408-02-27",
    "title": "روز ارتباطات و روابط عمومی",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1408-02-28",
    "title": "روز بزرگداشت حکیم عمر خیام",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1408-02-29",
    "title": "روز جهانی موزه و میراث فرهنگی",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1408-03-01",
    "title": "روز بهره وری و بهینه سازی مصرف",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1408-03-01",
    "title": "روز بزرگداشت ملاصدرا",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1408-03-02",
    "title": "فروریختن ساختمان متروپل در آبادان",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1408-03-03",
    "title": "فتح خرمشهر در عملیات بیت المقدس و روز مقاومت، ایثار و پیروزی",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1408-03-03",
    "title": "تاسوعای حسینی (۹ محرم)",
    "kind": "religious",
    "isOffDay": true,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1408-03-04",
    "title": "عاشورای حسینی (۱۰ محرم)",
    "kind": "religious",
    "isOffDay": true,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1408-03-04",
    "title": "روز دزفول، روز مقاومت و پایداری",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1408-03-06",
    "title": "خرداد روز،جشن خردادگان",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1408-03-06",
    "title": "شهادت امام زین العابدین (ع) (۱۲ محرم)",
    "kind": "religious",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1408-03-11",
    "title": "روز جهانی بدون دخانیات",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1408-03-14",
    "title": "رحلت حضرت امام خمینی",
    "kind": "official",
    "isOffDay": true,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1408-03-15",
    "title": "قیام 15 خرداد",
    "kind": "official",
    "isOffDay": true,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1408-03-16",
    "title": "روز جهانی محیط زیست",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1408-03-21",
    "title": "روز جهانی صنایع دستی",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1408-03-23",
    "title": "روز جهانی مبارزه با کار کودکان",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1408-03-25",
    "title": "روز ملی گل وگیاه",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1408-03-25",
    "title": "روز جهانی اهدای خون",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1408-03-27",
    "title": "روز جهانی پدر",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1408-03-28",
    "title": "روز جهانی بیابان زدایی",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1408-03-31",
    "title": "سالروز زلزله رودبار و منجیل [1369خورشیدی]",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1408-04-01",
    "title": "جشن آب پاشونک، جشن آغاز تابستان",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1408-04-06",
    "title": "روز جهانی مبارزه با مواد مخدر",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1408-04-07",
    "title": "انفجار دفتر حزب جمهوری اسلامی؛ روز قوه قضاییه",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1408-04-08",
    "title": "روز مبارزه با سلاح های شیمیایی و میکروبی",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1408-04-10",
    "title": "روز صنعت و معدن",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1408-04-10",
    "title": "زادروز بابک خرمدین، سپه‌سالار دلاور ایران",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1408-04-10",
    "title": "روز بزرگداشت صائب تبریزی",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1408-04-12",
    "title": "شلیک به پرواز 655 ایران ایر توسط ناو وینسنس [ 1367 خورشیدی ]",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1408-04-13",
    "title": "اربعین حسینی (۲۰ صفر)",
    "kind": "religious",
    "isOffDay": true,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1408-04-14",
    "title": "روز قلم",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1408-04-15",
    "title": "جشن خام خواری",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1408-04-21",
    "title": "رحلت رسول اکرم؛شهادت امام حسن مجتبی (ع) (۲۸ صفر)",
    "kind": "religious",
    "isOffDay": true,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1408-04-23",
    "title": "شهادت امام رضا (ع) (۳۰ صفر)",
    "kind": "religious",
    "isOffDay": true,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1408-04-24",
    "title": "هجرت پیامبر اکرم از مکه به مدینه (۱ ربیع الاول)",
    "kind": "religious",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1408-04-25",
    "title": "روز بهزیستی و تامین اجتماعی",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1408-04-27",
    "title": "اعلام پذیرش قطعنامه 598 شورای امنیت از سوی ایران [ 1367 خورشیدی ]",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1408-04-31",
    "title": "شهادت امام حسن عسکری (ع) (۸ ربیع الاول)",
    "kind": "religious",
    "isOffDay": true,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1408-05-04",
    "title": "اَمردادمیلاد رسول اکرم به روایت اهل سنت (۱۲ ربیع الاول)",
    "kind": "religious",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1408-05-07",
    "title": "اَمرداداَمرداد روز،جشن اَمردادگان",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1408-05-08",
    "title": "اَمردادروز بزرگداشت شیخ شهاب الدین سهروردی",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1408-05-09",
    "title": "اَمردادمیلاد رسول اکرم و امام جعفر صادق (ع) (۱۷ ربیع الاول)",
    "kind": "religious",
    "isOffDay": true,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1408-05-10",
    "title": "اَمردادجشن چله تابستان",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1408-05-11",
    "title": "اَمردادآغاز هفته جهانی شیردهی",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1408-05-14",
    "title": "اَمردادسالروز صدور فرمان مشروطیت",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1408-05-17",
    "title": "اَمردادروز خبرنگار",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1408-05-23",
    "title": "اَمردادروز جهانی چپ دست ها",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1408-05-28",
    "title": "اَمردادسالروز وقایع پس از برکناری محمد مصدق‌السلطنه",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1408-05-28",
    "title": "اَمردادسالروز فاجعه آتش زدن سینما رکس آبادان",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1408-05-29",
    "title": "اَمردادولادت امام حسن عسکری (ع) (۸ ربیع الثانی)",
    "kind": "religious",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1408-05-29",
    "title": "اَمردادروز جهانی عکاسی",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1408-05-31",
    "title": "اَمردادوفات حضرت معصومه (س) (۱۰ ربیع الثانی)",
    "kind": "religious",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1408-06-01",
    "title": "روز بزرگداشت ابوعلی سینا و روز پزشک",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1408-06-02",
    "title": "آغاز هفته دولت",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1408-06-04",
    "title": "زادروز کوروش بزرگ",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1408-06-04",
    "title": "شهریور روز،جشن شهریورگان",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1408-06-05",
    "title": "روز بزرگداشت محمدبن زکریای رازی و روز داروساز",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1408-06-11",
    "title": "روز ملی صنعت چاپ",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1408-06-13",
    "title": "روز بزرگداشت ابوریحان بیرونی",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1408-06-20",
    "title": "روز جهانی پیشگیری از خودکشی",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1408-06-21",
    "title": "روز سینما",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1408-06-21",
    "title": "حمله به برج‌های دوقلوی مرکز تجارت جهانی",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1408-06-25",
    "title": "ولادت حضرت زینب (س) و روز پرستار و بهورز (۵ جمادی الاول)",
    "kind": "religious",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1408-06-27",
    "title": "روز شعر و ادب پارسی و روز بزرگداشت استاد شهریار",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1408-06-31",
    "title": "آغاز هفته دفاع مقدس",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1408-06-31",
    "title": "روز جهانی صلح",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1408-07-01",
    "title": "آغاز حمله مغول به ایران در پاییز 598 خورشیدی",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1408-07-04",
    "title": "روز گرامیداشت سربازان وطن",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1408-07-06",
    "title": "روز جهانی جهانگردی",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1408-07-07",
    "title": "روز آتش نشانی و ایمنی",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1408-07-07",
    "title": "روز بزرگداشت شمس تبریزی",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1408-07-08",
    "title": "روز بزرگداشت مولوی",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1408-07-09",
    "title": "روز جهانی ناشنوایان",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1408-07-09",
    "title": "روز جهانی ترجمه و مترجم",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1408-07-10",
    "title": "مهر روز،جشن مهرگان",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1408-07-10",
    "title": "روز جهانی سالمندان",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1408-07-13",
    "title": "آغاز هفته جهانی فضا",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1408-07-14",
    "title": "روز دامپزشکی",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1408-07-14",
    "title": "روز جهانی معلم",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1408-07-16",
    "title": "روز ملی کودک",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1408-07-18",
    "title": "روز جهانی پست",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1408-07-19",
    "title": "روز جهانی مبارزه با حکم اعدام",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1408-07-20",
    "title": "روز بزرگداشت حافظ",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1408-07-20",
    "title": "روز جهانی دختر",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1408-07-21",
    "title": "روز پیروزی کاوه و فریدون بر ضحاک",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1408-07-21",
    "title": "شهادت حضرت فاطمه زهرا (س) (۳ جمادی الثانیه)",
    "kind": "religious",
    "isOffDay": true,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1408-07-23",
    "title": "روز جهانی استاندارد",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1408-07-24",
    "title": "روز جهانی عصای سفید",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1408-07-25",
    "title": "روز جهانی غذا",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1408-07-26",
    "title": "روز تربیت بدنی و ورزش",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1408-07-26",
    "title": "روز جهانی ریشه کنی فقر",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1408-07-28",
    "title": "زادروز ستارخان ملقب به سردار ملی و از سرداران جنبش مشروطه ایران",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1408-07-29",
    "title": "روز ملی کوهنورد",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1408-08-01",
    "title": "روز آمار و برنامه ریزی",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1408-08-01",
    "title": "روز بزرگداشت ابوالفضل بیهقی، تاریخ‌نگار و نویسنده ایرانی",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1408-08-07",
    "title": "سالروز ورود کوروش بزرگ به بابل در سال 539 پیش از میلاد",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1408-08-08",
    "title": "ولادت حضرت فاطمه زهرا (س) و روز مادر (۲۰ جمادی الثانیه)",
    "kind": "religious",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1408-08-08",
    "title": "روز ملی محیط بان",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1408-08-10",
    "title": "آبان روز، جشن آبانگان",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1408-08-14",
    "title": "روز ملّی مازندران",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1408-08-15",
    "title": "جشن میانه پاییز",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1408-08-18",
    "title": "روز ملی کیفیت",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1408-08-18",
    "title": "ولادت امام محمد باقر (ع) (۱ رجب)",
    "kind": "religious",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1408-08-20",
    "title": "شهادت امام علی النقی (ع) (۳ رجب)",
    "kind": "religious",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1408-08-24",
    "title": "روز کتاب و کتابخوانی",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1408-08-24",
    "title": "روز جهانی دیابت",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1408-08-27",
    "title": "ولادت امام محمد تقی (ع) (۱۰ رجب)",
    "kind": "religious",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1408-08-27",
    "title": "روز جهانی دانش آموز",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1408-08-29",
    "title": "روز جهانی آقایان",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1408-08-30",
    "title": "ولادت امام علی (ع) و روز پدر (۱۳ رجب)",
    "kind": "religious",
    "isOffDay": true,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1408-08-30",
    "title": "روز جهانی کودک",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1408-09-01",
    "title": "آذر جشن",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1408-09-02",
    "title": "وفات حضرت زینب (س) (۱۵ رجب)",
    "kind": "religious",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1408-09-05",
    "title": "روز بسیج مستضعفان",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1408-09-05",
    "title": "روز جهانی مبارزه با خشونت علیه زنان",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1408-09-07",
    "title": "سالروز عملیات مروارید و روز نیروی دریایی ارتش",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1408-09-09",
    "title": "جشن آذرگان ،آذر روز",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1408-09-11",
    "title": "روز جهانی ایدز",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1408-09-12",
    "title": "شهادت امام موسی کاظم (ع) (۲۵ رجب)",
    "kind": "religious",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1408-09-13",
    "title": "روز صنعت بیمه",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1408-09-13",
    "title": "روز جهانی معلولان (کم‌توانان)",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1408-09-14",
    "title": "مبعث رسول اکرم (ص) (۲۷ رجب)",
    "kind": "religious",
    "isOffDay": true,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1408-09-15",
    "title": "روز حسابدار",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1408-09-20",
    "title": "ولادت سالار شهیدان، امام حسین (ع) و روز پاسدار (۳ شعبان)",
    "kind": "religious",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1408-09-20",
    "title": "روز جهانی حقوق بشر",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1408-09-21",
    "title": "ولادت حضرت ابوالفضل العباس (ع) و روز جانباز (۴ شعبان)",
    "kind": "religious",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1408-09-21",
    "title": "روز جهانی کوهستان",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1408-09-22",
    "title": "ولادت امام زین العابدین (ع) (۵ شعبان)",
    "kind": "religious",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1408-09-25",
    "title": "روز پژوهش و فناوری",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1408-09-28",
    "title": "ولادت حضرت علی اکبر (ع) و روز جوان (۱۱ شعبان)",
    "kind": "religious",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1408-09-30",
    "title": "جشن شب یلدا، شب چلّه",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1408-10-01",
    "title": "روز میلاد خورشید؛ جشن خرم روز، نخستین جشن دیگان",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1408-10-02",
    "title": "ولادت حضرت قائم عجل الله تعالی فرجه و جشن نیمه شعبان (۱۵ شعبان)",
    "kind": "religious",
    "isOffDay": true,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1408-10-03",
    "title": "سالروز عملیات کربلای 4 [1365 خورشیدی]",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1408-10-05",
    "title": "زمین لرزه ی بم [1382 خورشیدی]",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1408-10-05",
    "title": "جشن کریسمس",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1408-10-05",
    "title": "سالروز شهادت اَشو زرتشت، اَبَراِنسان بزرگ تاریخ",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1408-10-05",
    "title": "روز بزرگداشت دوستی",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1408-10-08",
    "title": "دی به آذر روز، دومین جشن دیگان",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1408-10-09",
    "title": "اعدام میهن‌پرستان آذری در تبریز توسط قوای اشغالگر روس [1290 خورشیدی]",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1408-10-12",
    "title": "جشن آغاز سال نو میلادی",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1408-10-12",
    "title": "روز حافظ",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1408-10-13",
    "title": "شهادت سردار حاج قاسم سلیمانی [1398 خورشیدی]",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1408-10-15",
    "title": "دی به مهر روز، سومین جشن دیگان",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1408-10-16",
    "title": "غرق شدن کشتی سانچی [1396 خورشیدی]",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1408-10-18",
    "title": "شلیک به پرواز 752 هواپیمایی اوکراین [1398 خورشیدی]",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1408-10-19",
    "title": "درگذشت اکبر هاشمی رفسنجانی [1395 خورشیدی]",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1408-10-20",
    "title": "قتل امیرکبیر به دستور ناصرالدین شاه قاجار [1230 خورشیدی]",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1408-10-23",
    "title": "دی به دین روز، چهارمین جشن دیگان",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1408-10-30",
    "title": "آتش‌سوزی و فروریختن ساختمان پلاسکو [1395 خورشیدی]",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1408-11-01",
    "title": "زادروز فردوسی",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1408-11-01",
    "title": "ولادت امام حسن مجتبی (ع) (۱۵ رمضان)",
    "kind": "religious",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1408-11-02",
    "title": "بهمن روز، جشن بهمنگان",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1408-11-04",
    "title": "شب قدر (۱۸ رمضان)",
    "kind": "religious",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1408-11-05",
    "title": "ضربت خوردن حضرت علی (ع) (۱۹ رمضان)",
    "kind": "religious",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1408-11-06",
    "title": "بزرگداشت صفی‌الدین اُرمَوی و روز موسیقی ایرانی",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1408-11-07",
    "title": "شهادت حضرت علی (ع) (۲۱ رمضان)",
    "kind": "religious",
    "isOffDay": true,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1408-11-08",
    "title": "شب قدر (۲۲ رمضان)",
    "kind": "religious",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1408-11-10",
    "title": "جشن سده، گرامیداشتِ کشف آتش به دستِ هوشنگ شاه",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1408-11-12",
    "title": "بازگشت امام خمینی (ره) به ایران",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1408-11-15",
    "title": "جشن میانه زمستان",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1408-11-17",
    "title": "عید سعید فطر (۱ شوال)",
    "kind": "religious",
    "isOffDay": true,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1408-11-18",
    "title": "تعطیل به مناسبت عید سعید فطر (۲ شوال)",
    "kind": "religious",
    "isOffDay": true,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1408-11-19",
    "title": "روز نیروی هوایی",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1408-11-22",
    "title": "پیروزی انقلاب اسلامی",
    "kind": "official",
    "isOffDay": true,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1408-11-26",
    "title": "جشن ولنتاین",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1408-11-29",
    "title": "جشن سپندارمذگان و روز عشق",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1408-11-29",
    "title": "فاجعه انفجار قطار نیشابور [1382 خورشیدی]",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1408-12-05",
    "title": "روز بزرگداشت خواجه نصیر الدین طوسی و روز مهندس",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1408-12-07",
    "title": "سالروز استقلال کانون وکلای دادگستری و روز وکیل مدافع",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1408-12-11",
    "title": "شهادت امام جعفر صادق (ع) (۲۵ شوال)",
    "kind": "religious",
    "isOffDay": true,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1408-12-15",
    "title": "روز درختکاری",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1408-12-16",
    "title": "ولادت حضرت معصومه (س)، روز دختران (۱ ذوالقعده)",
    "kind": "religious",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1408-12-18",
    "title": "روز جهانی زنان",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1408-12-24",
    "title": "روز جهانی عدد پی π",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1408-12-25",
    "title": "پایان سرایش شاهنامه",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1408-12-25",
    "title": "روز بزرگداشت اختر چرخ ادب، پروین اعتصامی",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1408-12-26",
    "title": "ولادت امام رضا (ع) (۱۱ ذوالقعده)",
    "kind": "religious",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1408-12-29",
    "title": "روز ملی شدن صنعت نفت ایران",
    "kind": "official",
    "isOffDay": true,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1408-12-30",
    "title": "آخرین روز سال",
    "kind": "official",
    "isOffDay": true,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1408-12-30",
    "title": "روز جهانی شادی",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1409-01-01",
    "title": "جشن نوروز/جشن سال نو",
    "kind": "official",
    "isOffDay": true,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1409-01-01",
    "title": "روز جهانی نوروز",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1409-01-02",
    "title": "عید نوروز",
    "kind": "official",
    "isOffDay": true,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1409-01-03",
    "title": "عید نوروز",
    "kind": "official",
    "isOffDay": true,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1409-01-03",
    "title": "روز جهانی هواشناسی",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1409-01-04",
    "title": "عید نوروز",
    "kind": "official",
    "isOffDay": true,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1409-01-06",
    "title": "روز امید، روز شادباش نویسی",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1409-01-06",
    "title": "زادروز اَشو زرتشت، اَبَراِنسان بزرگ تاریخ",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1409-01-07",
    "title": "روز جهانی تئاتر",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1409-01-10",
    "title": "جشن آبانگاه",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1409-01-12",
    "title": "روز جمهوری اسلامی",
    "kind": "official",
    "isOffDay": true,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1409-01-13",
    "title": "جشن سیزده به در",
    "kind": "official",
    "isOffDay": true,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1409-01-15",
    "title": "شهادت امام محمد تقی (ع) (۳۰ ذوالقعده)",
    "kind": "religious",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1409-01-17",
    "title": "سروش روز،جشن سروشگان",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1409-01-18",
    "title": "روز جهانی بهداشت",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1409-01-19",
    "title": "فروردین روز،جشن فروردینگان",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1409-01-22",
    "title": "شهادت امام محمد باقر (ع) (۷ ذوالحجه)",
    "kind": "religious",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1409-01-23",
    "title": "روز دندانپزشک",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1409-01-24",
    "title": "روز عرفه (۹ ذوالحجه)",
    "kind": "religious",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1409-01-25",
    "title": "روز بزرگداشت عطار نیشابوری",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1409-01-25",
    "title": "عید سعید قربان (۱۰ ذوالحجه)",
    "kind": "religious",
    "isOffDay": true,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1409-01-29",
    "title": "روز ارتش جمهوری اسلامی ایران",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1409-01-30",
    "title": "ولادت امام علی النقی (ع) (۱۵ ذوالحجه)",
    "kind": "religious",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1409-01-30",
    "title": "روز علوم آزمایشگاهی، زاد روز حکیم سید اسماعیل جرجانی",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1409-02-01",
    "title": "روز بزرگداشت سعدی",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1409-02-02",
    "title": "جشن گیاه آوری؛ روز زمین",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1409-02-02",
    "title": "عید سعید غدیر خم (۱۸ ذوالحجه)",
    "kind": "religious",
    "isOffDay": true,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1409-02-03",
    "title": "روز بزرگداشت شیخ بهایی؛ روز ملی کارآفرینی؛ روز معماری",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1409-02-04",
    "title": "ولادت امام موسی کاظم (ع) (۲۰ ذوالحجه)",
    "kind": "religious",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1409-02-06",
    "title": "فاجعه‌ی انفجارِ بندر عباس [ 1404 خورشیدی]",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1409-02-07",
    "title": "روز جهانی طراحی و گرافیک",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1409-02-09",
    "title": "روز ملی روانشناس و مشاور",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1409-02-10",
    "title": "جشن چهلم نوروز؛ روز ملی خلیج فارس",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1409-02-11",
    "title": "روز جهانی کارگر",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1409-02-12",
    "title": "روز معلم",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1409-02-15",
    "title": "جشن میانه بهار/جشن بهاربد؛ روز شیراز",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1409-02-15",
    "title": "روز جهانی ماما",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1409-02-18",
    "title": "روز جهانی صلیب سرخ و هلال احمر",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1409-02-22",
    "title": "تاسوعای حسینی (۹ محرم)",
    "kind": "religious",
    "isOffDay": true,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1409-02-22",
    "title": "زادروز مریم میرزاخانی ریاضیدان ایرانی، روز جهانی زن در ریاضیات",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1409-02-22",
    "title": "روز جهانی پرستار",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1409-02-23",
    "title": "عاشورای حسینی (۱۰ محرم)",
    "kind": "religious",
    "isOffDay": true,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1409-02-25",
    "title": "روز بزرگداشت فردوسی",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1409-02-25",
    "title": "شهادت امام زین العابدین (ع) (۱۲ محرم)",
    "kind": "religious",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1409-02-27",
    "title": "روز ارتباطات و روابط عمومی",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1409-02-28",
    "title": "روز بزرگداشت حکیم عمر خیام",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1409-02-28",
    "title": "روز جهانی موزه و میراث فرهنگی",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1409-03-01",
    "title": "روز بهره وری و بهینه سازی مصرف",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1409-03-01",
    "title": "روز بزرگداشت ملاصدرا",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1409-03-02",
    "title": "فروریختن ساختمان متروپل در آبادان",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1409-03-03",
    "title": "فتح خرمشهر در عملیات بیت المقدس و روز مقاومت، ایثار و پیروزی",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1409-03-04",
    "title": "روز دزفول، روز مقاومت و پایداری",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1409-03-06",
    "title": "خرداد روز،جشن خردادگان",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1409-03-10",
    "title": "روز جهانی بدون دخانیات",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1409-03-14",
    "title": "رحلت حضرت امام خمینی",
    "kind": "official",
    "isOffDay": true,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1409-03-15",
    "title": "قیام 15 خرداد",
    "kind": "official",
    "isOffDay": true,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1409-03-15",
    "title": "روز جهانی محیط زیست",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1409-03-20",
    "title": "روز جهانی صنایع دستی",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1409-03-22",
    "title": "روز جهانی مبارزه با کار کودکان",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1409-03-24",
    "title": "روز جهانی اهدای خون",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1409-03-25",
    "title": "روز ملی گل وگیاه",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1409-03-26",
    "title": "روز جهانی پدر",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1409-03-27",
    "title": "روز جهانی بیابان زدایی",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1409-03-31",
    "title": "سالروز زلزله رودبار و منجیل [1369خورشیدی]",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1409-04-01",
    "title": "جشن آب پاشونک، جشن آغاز تابستان",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1409-04-01",
    "title": "اربعین حسینی (۲۰ صفر)",
    "kind": "religious",
    "isOffDay": true,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1409-04-05",
    "title": "روز جهانی مبارزه با مواد مخدر",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1409-04-07",
    "title": "انفجار دفتر حزب جمهوری اسلامی؛ روز قوه قضاییه",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1409-04-08",
    "title": "روز مبارزه با سلاح های شیمیایی و میکروبی",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1409-04-09",
    "title": "رحلت رسول اکرم؛شهادت امام حسن مجتبی (ع) (۲۸ صفر)",
    "kind": "religious",
    "isOffDay": true,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1409-04-10",
    "title": "روز صنعت و معدن",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1409-04-10",
    "title": "زادروز بابک خرمدین، سپه‌سالار دلاور ایران",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1409-04-10",
    "title": "روز بزرگداشت صائب تبریزی",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1409-04-11",
    "title": "شهادت امام رضا (ع) (۳۰ صفر)",
    "kind": "religious",
    "isOffDay": true,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1409-04-12",
    "title": "هجرت پیامبر اکرم از مکه به مدینه (۱ ربیع الاول)",
    "kind": "religious",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1409-04-12",
    "title": "شلیک به پرواز 655 ایران ایر توسط ناو وینسنس [ 1367 خورشیدی ]",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1409-04-14",
    "title": "روز قلم",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1409-04-15",
    "title": "جشن خام خواری",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1409-04-19",
    "title": "شهادت امام حسن عسکری (ع) (۸ ربیع الاول)",
    "kind": "religious",
    "isOffDay": true,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1409-04-23",
    "title": "میلاد رسول اکرم به روایت اهل سنت (۱۲ ربیع الاول)",
    "kind": "religious",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1409-04-25",
    "title": "روز بهزیستی و تامین اجتماعی",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1409-04-27",
    "title": "اعلام پذیرش قطعنامه 598 شورای امنیت از سوی ایران [ 1367 خورشیدی ]",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1409-04-28",
    "title": "میلاد رسول اکرم و امام جعفر صادق (ع) (۱۷ ربیع الاول)",
    "kind": "religious",
    "isOffDay": true,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1409-05-07",
    "title": "اَمرداداَمرداد روز،جشن اَمردادگان",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1409-05-08",
    "title": "اَمردادروز بزرگداشت شیخ شهاب الدین سهروردی",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1409-05-10",
    "title": "اَمردادجشن چله تابستان",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1409-05-10",
    "title": "اَمردادآغاز هفته جهانی شیردهی",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1409-05-14",
    "title": "اَمردادسالروز صدور فرمان مشروطیت",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1409-05-17",
    "title": "اَمردادروز خبرنگار",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1409-05-18",
    "title": "اَمردادولادت امام حسن عسکری (ع) (۸ ربیع الثانی)",
    "kind": "religious",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1409-05-20",
    "title": "اَمردادوفات حضرت معصومه (س) (۱۰ ربیع الثانی)",
    "kind": "religious",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1409-05-22",
    "title": "اَمردادروز جهانی چپ دست ها",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1409-05-28",
    "title": "اَمردادسالروز وقایع پس از برکناری محمد مصدق‌السلطنه",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1409-05-28",
    "title": "اَمردادسالروز فاجعه آتش زدن سینما رکس آبادان",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1409-05-28",
    "title": "اَمردادروز جهانی عکاسی",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1409-06-01",
    "title": "روز بزرگداشت ابوعلی سینا و روز پزشک",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1409-06-02",
    "title": "آغاز هفته دولت",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1409-06-04",
    "title": "زادروز کوروش بزرگ",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1409-06-04",
    "title": "شهریور روز،جشن شهریورگان",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1409-06-05",
    "title": "روز بزرگداشت محمدبن زکریای رازی و روز داروساز",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1409-06-11",
    "title": "روز ملی صنعت چاپ",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1409-06-13",
    "title": "روز بزرگداشت ابوریحان بیرونی",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1409-06-13",
    "title": "ولادت حضرت زینب (س) و روز پرستار و بهورز (۵ جمادی الاول)",
    "kind": "religious",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1409-06-19",
    "title": "روز جهانی پیشگیری از خودکشی",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1409-06-20",
    "title": "حمله به برج‌های دوقلوی مرکز تجارت جهانی",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1409-06-21",
    "title": "روز سینما",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1409-06-27",
    "title": "روز شعر و ادب پارسی و روز بزرگداشت استاد شهریار",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1409-06-30",
    "title": "روز جهانی صلح",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1409-06-31",
    "title": "آغاز هفته دفاع مقدس",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1409-07-01",
    "title": "آغاز حمله مغول به ایران در پاییز 598 خورشیدی",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1409-07-04",
    "title": "روز گرامیداشت سربازان وطن",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1409-07-05",
    "title": "روز جهانی جهانگردی",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1409-07-07",
    "title": "روز آتش نشانی و ایمنی",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1409-07-07",
    "title": "روز بزرگداشت شمس تبریزی",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1409-07-08",
    "title": "روز بزرگداشت مولوی",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1409-07-08",
    "title": "روز جهانی ناشنوایان",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1409-07-08",
    "title": "روز جهانی ترجمه و مترجم",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1409-07-09",
    "title": "روز جهانی سالمندان",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1409-07-10",
    "title": "مهر روز،جشن مهرگان",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1409-07-10",
    "title": "شهادت حضرت فاطمه زهرا (س) (۳ جمادی الثانیه)",
    "kind": "religious",
    "isOffDay": true,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1409-07-12",
    "title": "آغاز هفته جهانی فضا",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1409-07-13",
    "title": "روز جهانی معلم",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1409-07-14",
    "title": "روز دامپزشکی",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1409-07-16",
    "title": "روز ملی کودک",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1409-07-17",
    "title": "روز جهانی پست",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1409-07-18",
    "title": "روز جهانی مبارزه با حکم اعدام",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1409-07-19",
    "title": "روز جهانی دختر",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1409-07-20",
    "title": "روز بزرگداشت حافظ",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1409-07-21",
    "title": "روز پیروزی کاوه و فریدون بر ضحاک",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1409-07-22",
    "title": "روز جهانی استاندارد",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1409-07-23",
    "title": "روز جهانی عصای سفید",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1409-07-24",
    "title": "روز جهانی غذا",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1409-07-25",
    "title": "روز جهانی ریشه کنی فقر",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1409-07-26",
    "title": "روز تربیت بدنی و ورزش",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1409-07-27",
    "title": "ولادت حضرت فاطمه زهرا (س) و روز مادر (۲۰ جمادی الثانیه)",
    "kind": "religious",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1409-07-28",
    "title": "زادروز ستارخان ملقب به سردار ملی و از سرداران جنبش مشروطه ایران",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1409-07-29",
    "title": "روز ملی کوهنورد",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1409-08-01",
    "title": "روز آمار و برنامه ریزی",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1409-08-01",
    "title": "روز بزرگداشت ابوالفضل بیهقی، تاریخ‌نگار و نویسنده ایرانی",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1409-08-07",
    "title": "ولادت امام محمد باقر (ع) (۱ رجب)",
    "kind": "religious",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1409-08-07",
    "title": "سالروز ورود کوروش بزرگ به بابل در سال 539 پیش از میلاد",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1409-08-08",
    "title": "روز ملی محیط بان",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1409-08-09",
    "title": "شهادت امام علی النقی (ع) (۳ رجب)",
    "kind": "religious",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1409-08-10",
    "title": "آبان روز، جشن آبانگان",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1409-08-14",
    "title": "روز ملّی مازندران",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1409-08-15",
    "title": "جشن میانه پاییز",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1409-08-16",
    "title": "ولادت امام محمد تقی (ع) (۱۰ رجب)",
    "kind": "religious",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1409-08-18",
    "title": "روز ملی کیفیت",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1409-08-19",
    "title": "ولادت امام علی (ع) و روز پدر (۱۳ رجب)",
    "kind": "religious",
    "isOffDay": true,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1409-08-21",
    "title": "وفات حضرت زینب (س) (۱۵ رجب)",
    "kind": "religious",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1409-08-23",
    "title": "روز جهانی دیابت",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1409-08-24",
    "title": "روز کتاب و کتابخوانی",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1409-08-26",
    "title": "روز جهانی دانش آموز",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1409-08-28",
    "title": "روز جهانی آقایان",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1409-08-29",
    "title": "روز جهانی کودک",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1409-09-01",
    "title": "آذر جشن",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1409-09-01",
    "title": "شهادت امام موسی کاظم (ع) (۲۵ رجب)",
    "kind": "religious",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1409-09-03",
    "title": "مبعث رسول اکرم (ص) (۲۷ رجب)",
    "kind": "religious",
    "isOffDay": true,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1409-09-04",
    "title": "روز جهانی مبارزه با خشونت علیه زنان",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1409-09-05",
    "title": "روز بسیج مستضعفان",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1409-09-07",
    "title": "سالروز عملیات مروارید و روز نیروی دریایی ارتش",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1409-09-08",
    "title": "ولادت سالار شهیدان، امام حسین (ع) و روز پاسدار (۳ شعبان)",
    "kind": "religious",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1409-09-09",
    "title": "جشن آذرگان ،آذر روز",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1409-09-09",
    "title": "ولادت حضرت ابوالفضل العباس (ع) و روز جانباز (۴ شعبان)",
    "kind": "religious",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1409-09-10",
    "title": "ولادت امام زین العابدین (ع) (۵ شعبان)",
    "kind": "religious",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1409-09-10",
    "title": "روز جهانی ایدز",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1409-09-12",
    "title": "روز جهانی معلولان (کم‌توانان)",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1409-09-13",
    "title": "روز صنعت بیمه",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1409-09-15",
    "title": "روز حسابدار",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1409-09-16",
    "title": "ولادت حضرت علی اکبر (ع) و روز جوان (۱۱ شعبان)",
    "kind": "religious",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1409-09-19",
    "title": "روز جهانی حقوق بشر",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1409-09-20",
    "title": "ولادت حضرت قائم عجل الله تعالی فرجه و جشن نیمه شعبان (۱۵ شعبان)",
    "kind": "religious",
    "isOffDay": true,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1409-09-20",
    "title": "روز جهانی کوهستان",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1409-09-25",
    "title": "روز پژوهش و فناوری",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1409-09-30",
    "title": "جشن شب یلدا، شب چلّه",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1409-10-01",
    "title": "روز میلاد خورشید؛ جشن خرم روز، نخستین جشن دیگان",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1409-10-03",
    "title": "سالروز عملیات کربلای 4 [1365 خورشیدی]",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1409-10-04",
    "title": "جشن کریسمس",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1409-10-04",
    "title": "روز بزرگداشت دوستی",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1409-10-05",
    "title": "زمین لرزه ی بم [1382 خورشیدی]",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1409-10-05",
    "title": "سالروز شهادت اَشو زرتشت، اَبَراِنسان بزرگ تاریخ",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1409-10-08",
    "title": "دی به آذر روز، دومین جشن دیگان",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1409-10-09",
    "title": "اعدام میهن‌پرستان آذری در تبریز توسط قوای اشغالگر روس [1290 خورشیدی]",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1409-10-11",
    "title": "جشن آغاز سال نو میلادی",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1409-10-12",
    "title": "روز حافظ",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1409-10-13",
    "title": "شهادت سردار حاج قاسم سلیمانی [1398 خورشیدی]",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1409-10-15",
    "title": "دی به مهر روز، سومین جشن دیگان",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1409-10-16",
    "title": "غرق شدن کشتی سانچی [1396 خورشیدی]",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1409-10-18",
    "title": "شلیک به پرواز 752 هواپیمایی اوکراین [1398 خورشیدی]",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1409-10-19",
    "title": "درگذشت اکبر هاشمی رفسنجانی [1395 خورشیدی]",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1409-10-20",
    "title": "ولادت امام حسن مجتبی (ع) (۱۵ رمضان)",
    "kind": "religious",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1409-10-20",
    "title": "قتل امیرکبیر به دستور ناصرالدین شاه قاجار [1230 خورشیدی]",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1409-10-23",
    "title": "دی به دین روز، چهارمین جشن دیگان",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1409-10-23",
    "title": "شب قدر (۱۸ رمضان)",
    "kind": "religious",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1409-10-24",
    "title": "ضربت خوردن حضرت علی (ع) (۱۹ رمضان)",
    "kind": "religious",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1409-10-26",
    "title": "شهادت حضرت علی (ع) (۲۱ رمضان)",
    "kind": "religious",
    "isOffDay": true,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1409-10-27",
    "title": "شب قدر (۲۲ رمضان)",
    "kind": "religious",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1409-10-30",
    "title": "آتش‌سوزی و فروریختن ساختمان پلاسکو [1395 خورشیدی]",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1409-11-01",
    "title": "زادروز فردوسی",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1409-11-02",
    "title": "بهمن روز، جشن بهمنگان",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1409-11-05",
    "title": "عید سعید فطر (۱ شوال)",
    "kind": "religious",
    "isOffDay": true,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1409-11-06",
    "title": "تعطیل به مناسبت عید سعید فطر (۲ شوال)",
    "kind": "religious",
    "isOffDay": true,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1409-11-06",
    "title": "بزرگداشت صفی‌الدین اُرمَوی و روز موسیقی ایرانی",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1409-11-10",
    "title": "جشن سده، گرامیداشتِ کشف آتش به دستِ هوشنگ شاه",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1409-11-12",
    "title": "بازگشت امام خمینی (ره) به ایران",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1409-11-15",
    "title": "جشن میانه زمستان",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1409-11-19",
    "title": "روز نیروی هوایی",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1409-11-22",
    "title": "پیروزی انقلاب اسلامی",
    "kind": "official",
    "isOffDay": true,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1409-11-25",
    "title": "جشن ولنتاین",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1409-11-29",
    "title": "جشن سپندارمذگان و روز عشق",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1409-11-29",
    "title": "شهادت امام جعفر صادق (ع) (۲۵ شوال)",
    "kind": "religious",
    "isOffDay": true,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1409-11-29",
    "title": "فاجعه انفجار قطار نیشابور [1382 خورشیدی]",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1409-12-05",
    "title": "روز بزرگداشت خواجه نصیر الدین طوسی و روز مهندس",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1409-12-05",
    "title": "ولادت حضرت معصومه (س)، روز دختران (۱ ذوالقعده)",
    "kind": "religious",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1409-12-07",
    "title": "سالروز استقلال کانون وکلای دادگستری و روز وکیل مدافع",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1409-12-15",
    "title": "روز درختکاری",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1409-12-15",
    "title": "ولادت امام رضا (ع) (۱۱ ذوالقعده)",
    "kind": "religious",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1409-12-17",
    "title": "روز جهانی زنان",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1409-12-23",
    "title": "روز جهانی عدد پی π",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1409-12-25",
    "title": "پایان سرایش شاهنامه",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1409-12-25",
    "title": "روز بزرگداشت اختر چرخ ادب، پروین اعتصامی",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1409-12-29",
    "title": "روز ملی شدن صنعت نفت ایران",
    "kind": "official",
    "isOffDay": true,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1409-12-29",
    "title": "روز جهانی شادی",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1410-01-01",
    "title": "جشن نوروز/جشن سال نو",
    "kind": "official",
    "isOffDay": true,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1410-01-01",
    "title": "روز جهانی نوروز",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1410-01-02",
    "title": "عید نوروز",
    "kind": "official",
    "isOffDay": true,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1410-01-03",
    "title": "عید نوروز",
    "kind": "official",
    "isOffDay": true,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1410-01-03",
    "title": "روز جهانی هواشناسی",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1410-01-04",
    "title": "عید نوروز",
    "kind": "official",
    "isOffDay": true,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1410-01-04",
    "title": "شهادت امام محمد تقی (ع) (۳۰ ذوالقعده)",
    "kind": "religious",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1410-01-06",
    "title": "روز امید، روز شادباش نویسی",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1410-01-06",
    "title": "زادروز اَشو زرتشت، اَبَراِنسان بزرگ تاریخ",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1410-01-07",
    "title": "روز جهانی تئاتر",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1410-01-10",
    "title": "جشن آبانگاه",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1410-01-11",
    "title": "شهادت امام محمد باقر (ع) (۷ ذوالحجه)",
    "kind": "religious",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1410-01-12",
    "title": "روز جمهوری اسلامی",
    "kind": "official",
    "isOffDay": true,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1410-01-13",
    "title": "جشن سیزده به در",
    "kind": "official",
    "isOffDay": true,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1410-01-13",
    "title": "روز عرفه (۹ ذوالحجه)",
    "kind": "religious",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1410-01-14",
    "title": "عید سعید قربان (۱۰ ذوالحجه)",
    "kind": "religious",
    "isOffDay": true,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1410-01-17",
    "title": "سروش روز،جشن سروشگان",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1410-01-18",
    "title": "روز جهانی بهداشت",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1410-01-19",
    "title": "فروردین روز،جشن فروردینگان",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1410-01-19",
    "title": "ولادت امام علی النقی (ع) (۱۵ ذوالحجه)",
    "kind": "religious",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1410-01-22",
    "title": "عید سعید غدیر خم (۱۸ ذوالحجه)",
    "kind": "religious",
    "isOffDay": true,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1410-01-23",
    "title": "روز دندانپزشک",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1410-01-24",
    "title": "ولادت امام موسی کاظم (ع) (۲۰ ذوالحجه)",
    "kind": "religious",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1410-01-25",
    "title": "روز بزرگداشت عطار نیشابوری",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1410-01-29",
    "title": "روز ارتش جمهوری اسلامی ایران",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1410-01-30",
    "title": "روز علوم آزمایشگاهی، زاد روز حکیم سید اسماعیل جرجانی",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1410-02-01",
    "title": "روز بزرگداشت سعدی",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1410-02-02",
    "title": "جشن گیاه آوری؛ روز زمین",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1410-02-03",
    "title": "روز بزرگداشت شیخ بهایی؛ روز ملی کارآفرینی؛ روز معماری",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1410-02-06",
    "title": "فاجعه‌ی انفجارِ بندر عباس [ 1404 خورشیدی]",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1410-02-07",
    "title": "روز جهانی طراحی و گرافیک",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1410-02-09",
    "title": "روز ملی روانشناس و مشاور",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1410-02-10",
    "title": "جشن چهلم نوروز؛ روز ملی خلیج فارس",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1410-02-11",
    "title": "روز جهانی کارگر",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1410-02-12",
    "title": "روز معلم",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1410-02-12",
    "title": "تاسوعای حسینی (۹ محرم)",
    "kind": "religious",
    "isOffDay": true,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1410-02-13",
    "title": "عاشورای حسینی (۱۰ محرم)",
    "kind": "religious",
    "isOffDay": true,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1410-02-15",
    "title": "جشن میانه بهار/جشن بهاربد؛ روز شیراز",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1410-02-15",
    "title": "شهادت امام زین العابدین (ع) (۱۲ محرم)",
    "kind": "religious",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1410-02-15",
    "title": "روز جهانی ماما",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1410-02-18",
    "title": "روز جهانی صلیب سرخ و هلال احمر",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1410-02-22",
    "title": "زادروز مریم میرزاخانی ریاضیدان ایرانی، روز جهانی زن در ریاضیات",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1410-02-22",
    "title": "روز جهانی پرستار",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1410-02-25",
    "title": "روز بزرگداشت فردوسی",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1410-02-27",
    "title": "روز ارتباطات و روابط عمومی",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1410-02-28",
    "title": "روز بزرگداشت حکیم عمر خیام",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1410-02-28",
    "title": "روز جهانی موزه و میراث فرهنگی",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1410-03-01",
    "title": "روز بهره وری و بهینه سازی مصرف",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1410-03-01",
    "title": "روز بزرگداشت ملاصدرا",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1410-03-02",
    "title": "فروریختن ساختمان متروپل در آبادان",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1410-03-03",
    "title": "فتح خرمشهر در عملیات بیت المقدس و روز مقاومت، ایثار و پیروزی",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1410-03-04",
    "title": "روز دزفول، روز مقاومت و پایداری",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1410-03-06",
    "title": "خرداد روز،جشن خردادگان",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1410-03-10",
    "title": "روز جهانی بدون دخانیات",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1410-03-14",
    "title": "رحلت حضرت امام خمینی",
    "kind": "official",
    "isOffDay": true,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1410-03-15",
    "title": "قیام 15 خرداد",
    "kind": "official",
    "isOffDay": true,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1410-03-15",
    "title": "روز جهانی محیط زیست",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1410-03-20",
    "title": "روز جهانی صنایع دستی",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1410-03-21",
    "title": "اربعین حسینی (۲۰ صفر)",
    "kind": "religious",
    "isOffDay": true,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1410-03-22",
    "title": "روز جهانی مبارزه با کار کودکان",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1410-03-24",
    "title": "روز جهانی اهدای خون",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1410-03-25",
    "title": "روز ملی گل وگیاه",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1410-03-26",
    "title": "روز جهانی پدر",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1410-03-27",
    "title": "روز جهانی بیابان زدایی",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1410-03-29",
    "title": "رحلت رسول اکرم؛شهادت امام حسن مجتبی (ع) (۲۸ صفر)",
    "kind": "religious",
    "isOffDay": true,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1410-03-31",
    "title": "شهادت امام رضا (ع) (۳۰ صفر)",
    "kind": "religious",
    "isOffDay": true,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1410-03-31",
    "title": "سالروز زلزله رودبار و منجیل [1369خورشیدی]",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1410-04-01",
    "title": "جشن آب پاشونک، جشن آغاز تابستان",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1410-04-01",
    "title": "هجرت پیامبر اکرم از مکه به مدینه (۱ ربیع الاول)",
    "kind": "religious",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1410-04-05",
    "title": "روز جهانی مبارزه با مواد مخدر",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1410-04-07",
    "title": "انفجار دفتر حزب جمهوری اسلامی؛ روز قوه قضاییه",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1410-04-08",
    "title": "روز مبارزه با سلاح های شیمیایی و میکروبی",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1410-04-08",
    "title": "شهادت امام حسن عسکری (ع) (۸ ربیع الاول)",
    "kind": "religious",
    "isOffDay": true,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1410-04-10",
    "title": "روز صنعت و معدن",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1410-04-10",
    "title": "زادروز بابک خرمدین، سپه‌سالار دلاور ایران",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1410-04-10",
    "title": "روز بزرگداشت صائب تبریزی",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1410-04-12",
    "title": "میلاد رسول اکرم به روایت اهل سنت (۱۲ ربیع الاول)",
    "kind": "religious",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1410-04-12",
    "title": "شلیک به پرواز 655 ایران ایر توسط ناو وینسنس [ 1367 خورشیدی ]",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1410-04-14",
    "title": "روز قلم",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1410-04-15",
    "title": "جشن خام خواری",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1410-04-17",
    "title": "میلاد رسول اکرم و امام جعفر صادق (ع) (۱۷ ربیع الاول)",
    "kind": "religious",
    "isOffDay": true,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1410-04-25",
    "title": "روز بهزیستی و تامین اجتماعی",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1410-04-27",
    "title": "اعلام پذیرش قطعنامه 598 شورای امنیت از سوی ایران [ 1367 خورشیدی ]",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1410-05-07",
    "title": "اَمرداداَمرداد روز،جشن اَمردادگان",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1410-05-07",
    "title": "اَمردادولادت امام حسن عسکری (ع) (۸ ربیع الثانی)",
    "kind": "religious",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1410-05-08",
    "title": "اَمردادروز بزرگداشت شیخ شهاب الدین سهروردی",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1410-05-09",
    "title": "اَمردادوفات حضرت معصومه (س) (۱۰ ربیع الثانی)",
    "kind": "religious",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1410-05-10",
    "title": "اَمردادجشن چله تابستان",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1410-05-10",
    "title": "اَمردادآغاز هفته جهانی شیردهی",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1410-05-14",
    "title": "اَمردادسالروز صدور فرمان مشروطیت",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1410-05-17",
    "title": "اَمردادروز خبرنگار",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1410-05-22",
    "title": "اَمردادروز جهانی چپ دست ها",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1410-05-28",
    "title": "اَمردادسالروز وقایع پس از برکناری محمد مصدق‌السلطنه",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1410-05-28",
    "title": "اَمردادسالروز فاجعه آتش زدن سینما رکس آبادان",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1410-05-28",
    "title": "اَمردادروز جهانی عکاسی",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1410-06-01",
    "title": "روز بزرگداشت ابوعلی سینا و روز پزشک",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1410-06-02",
    "title": "آغاز هفته دولت",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1410-06-03",
    "title": "ولادت حضرت زینب (س) و روز پرستار و بهورز (۵ جمادی الاول)",
    "kind": "religious",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1410-06-04",
    "title": "زادروز کوروش بزرگ",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1410-06-04",
    "title": "شهریور روز،جشن شهریورگان",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1410-06-05",
    "title": "روز بزرگداشت محمدبن زکریای رازی و روز داروساز",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1410-06-11",
    "title": "روز ملی صنعت چاپ",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1410-06-13",
    "title": "روز بزرگداشت ابوریحان بیرونی",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1410-06-19",
    "title": "روز جهانی پیشگیری از خودکشی",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1410-06-20",
    "title": "حمله به برج‌های دوقلوی مرکز تجارت جهانی",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1410-06-21",
    "title": "روز سینما",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1410-06-27",
    "title": "روز شعر و ادب پارسی و روز بزرگداشت استاد شهریار",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1410-06-30",
    "title": "شهادت حضرت فاطمه زهرا (س) (۳ جمادی الثانیه)",
    "kind": "religious",
    "isOffDay": true,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1410-06-30",
    "title": "روز جهانی صلح",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1410-06-31",
    "title": "آغاز هفته دفاع مقدس",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1410-07-01",
    "title": "آغاز حمله مغول به ایران در پاییز 598 خورشیدی",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1410-07-04",
    "title": "روز گرامیداشت سربازان وطن",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1410-07-05",
    "title": "روز جهانی جهانگردی",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1410-07-07",
    "title": "روز آتش نشانی و ایمنی",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1410-07-07",
    "title": "روز بزرگداشت شمس تبریزی",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1410-07-08",
    "title": "روز بزرگداشت مولوی",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1410-07-08",
    "title": "روز جهانی ناشنوایان",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1410-07-08",
    "title": "روز جهانی ترجمه و مترجم",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1410-07-09",
    "title": "روز جهانی سالمندان",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1410-07-10",
    "title": "مهر روز،جشن مهرگان",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1410-07-12",
    "title": "آغاز هفته جهانی فضا",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1410-07-13",
    "title": "روز جهانی معلم",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1410-07-14",
    "title": "روز دامپزشکی",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1410-07-16",
    "title": "روز ملی کودک",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1410-07-16",
    "title": "ولادت حضرت فاطمه زهرا (س) و روز مادر (۲۰ جمادی الثانیه)",
    "kind": "religious",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1410-07-17",
    "title": "روز جهانی پست",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1410-07-18",
    "title": "روز جهانی مبارزه با حکم اعدام",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1410-07-19",
    "title": "روز جهانی دختر",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1410-07-20",
    "title": "روز بزرگداشت حافظ",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1410-07-21",
    "title": "روز پیروزی کاوه و فریدون بر ضحاک",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1410-07-22",
    "title": "روز جهانی استاندارد",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1410-07-23",
    "title": "روز جهانی عصای سفید",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1410-07-24",
    "title": "روز جهانی غذا",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1410-07-25",
    "title": "روز جهانی ریشه کنی فقر",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1410-07-26",
    "title": "روز تربیت بدنی و ورزش",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1410-07-26",
    "title": "ولادت امام محمد باقر (ع) (۱ رجب)",
    "kind": "religious",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1410-07-28",
    "title": "شهادت امام علی النقی (ع) (۳ رجب)",
    "kind": "religious",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1410-07-28",
    "title": "زادروز ستارخان ملقب به سردار ملی و از سرداران جنبش مشروطه ایران",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1410-07-29",
    "title": "روز ملی کوهنورد",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1410-08-01",
    "title": "روز آمار و برنامه ریزی",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1410-08-01",
    "title": "روز بزرگداشت ابوالفضل بیهقی، تاریخ‌نگار و نویسنده ایرانی",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1410-08-05",
    "title": "ولادت امام محمد تقی (ع) (۱۰ رجب)",
    "kind": "religious",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1410-08-07",
    "title": "سالروز ورود کوروش بزرگ به بابل در سال 539 پیش از میلاد",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1410-08-08",
    "title": "ولادت امام علی (ع) و روز پدر (۱۳ رجب)",
    "kind": "religious",
    "isOffDay": true,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1410-08-08",
    "title": "روز ملی محیط بان",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1410-08-10",
    "title": "آبان روز، جشن آبانگان",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1410-08-10",
    "title": "وفات حضرت زینب (س) (۱۵ رجب)",
    "kind": "religious",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1410-08-14",
    "title": "روز ملّی مازندران",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1410-08-15",
    "title": "جشن میانه پاییز",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1410-08-18",
    "title": "روز ملی کیفیت",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1410-08-20",
    "title": "شهادت امام موسی کاظم (ع) (۲۵ رجب)",
    "kind": "religious",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1410-08-22",
    "title": "مبعث رسول اکرم (ص) (۲۷ رجب)",
    "kind": "religious",
    "isOffDay": true,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1410-08-23",
    "title": "روز جهانی دیابت",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1410-08-24",
    "title": "روز کتاب و کتابخوانی",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1410-08-26",
    "title": "روز جهانی دانش آموز",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1410-08-28",
    "title": "ولادت سالار شهیدان، امام حسین (ع) و روز پاسدار (۳ شعبان)",
    "kind": "religious",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1410-08-28",
    "title": "روز جهانی آقایان",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1410-08-29",
    "title": "ولادت حضرت ابوالفضل العباس (ع) و روز جانباز (۴ شعبان)",
    "kind": "religious",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1410-08-29",
    "title": "روز جهانی کودک",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1410-08-30",
    "title": "ولادت امام زین العابدین (ع) (۵ شعبان)",
    "kind": "religious",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1410-09-01",
    "title": "آذر جشن",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1410-09-04",
    "title": "روز جهانی مبارزه با خشونت علیه زنان",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1410-09-05",
    "title": "روز بسیج مستضعفان",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1410-09-06",
    "title": "ولادت حضرت علی اکبر (ع) و روز جوان (۱۱ شعبان)",
    "kind": "religious",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1410-09-07",
    "title": "سالروز عملیات مروارید و روز نیروی دریایی ارتش",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1410-09-09",
    "title": "جشن آذرگان ،آذر روز",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1410-09-10",
    "title": "ولادت حضرت قائم عجل الله تعالی فرجه و جشن نیمه شعبان (۱۵ شعبان)",
    "kind": "religious",
    "isOffDay": true,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1410-09-10",
    "title": "روز جهانی ایدز",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1410-09-12",
    "title": "روز جهانی معلولان (کم‌توانان)",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1410-09-13",
    "title": "روز صنعت بیمه",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1410-09-15",
    "title": "روز حسابدار",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1410-09-19",
    "title": "روز جهانی حقوق بشر",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1410-09-20",
    "title": "روز جهانی کوهستان",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1410-09-25",
    "title": "روز پژوهش و فناوری",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1410-09-30",
    "title": "جشن شب یلدا، شب چلّه",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1410-10-01",
    "title": "روز میلاد خورشید؛ جشن خرم روز، نخستین جشن دیگان",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1410-10-03",
    "title": "سالروز عملیات کربلای 4 [1365 خورشیدی]",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1410-10-04",
    "title": "جشن کریسمس",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1410-10-04",
    "title": "روز بزرگداشت دوستی",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1410-10-05",
    "title": "زمین لرزه ی بم [1382 خورشیدی]",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1410-10-05",
    "title": "سالروز شهادت اَشو زرتشت، اَبَراِنسان بزرگ تاریخ",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1410-10-08",
    "title": "دی به آذر روز، دومین جشن دیگان",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1410-10-09",
    "title": "ولادت امام حسن مجتبی (ع) (۱۵ رمضان)",
    "kind": "religious",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1410-10-09",
    "title": "اعدام میهن‌پرستان آذری در تبریز توسط قوای اشغالگر روس [1290 خورشیدی]",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1410-10-11",
    "title": "جشن آغاز سال نو میلادی",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1410-10-12",
    "title": "شب قدر (۱۸ رمضان)",
    "kind": "religious",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1410-10-12",
    "title": "روز حافظ",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1410-10-13",
    "title": "ضربت خوردن حضرت علی (ع) (۱۹ رمضان)",
    "kind": "religious",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1410-10-13",
    "title": "شهادت سردار حاج قاسم سلیمانی [1398 خورشیدی]",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1410-10-15",
    "title": "دی به مهر روز، سومین جشن دیگان",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1410-10-15",
    "title": "شهادت حضرت علی (ع) (۲۱ رمضان)",
    "kind": "religious",
    "isOffDay": true,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1410-10-16",
    "title": "شب قدر (۲۲ رمضان)",
    "kind": "religious",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1410-10-16",
    "title": "غرق شدن کشتی سانچی [1396 خورشیدی]",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1410-10-18",
    "title": "شلیک به پرواز 752 هواپیمایی اوکراین [1398 خورشیدی]",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1410-10-19",
    "title": "درگذشت اکبر هاشمی رفسنجانی [1395 خورشیدی]",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1410-10-20",
    "title": "قتل امیرکبیر به دستور ناصرالدین شاه قاجار [1230 خورشیدی]",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1410-10-23",
    "title": "دی به دین روز، چهارمین جشن دیگان",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1410-10-25",
    "title": "عید سعید فطر (۱ شوال)",
    "kind": "religious",
    "isOffDay": true,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1410-10-26",
    "title": "تعطیل به مناسبت عید سعید فطر (۲ شوال)",
    "kind": "religious",
    "isOffDay": true,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1410-10-30",
    "title": "آتش‌سوزی و فروریختن ساختمان پلاسکو [1395 خورشیدی]",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1410-11-01",
    "title": "زادروز فردوسی",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1410-11-02",
    "title": "بهمن روز، جشن بهمنگان",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1410-11-06",
    "title": "بزرگداشت صفی‌الدین اُرمَوی و روز موسیقی ایرانی",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1410-11-10",
    "title": "جشن سده، گرامیداشتِ کشف آتش به دستِ هوشنگ شاه",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1410-11-12",
    "title": "بازگشت امام خمینی (ره) به ایران",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1410-11-15",
    "title": "جشن میانه زمستان",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1410-11-19",
    "title": "روز نیروی هوایی",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1410-11-19",
    "title": "شهادت امام جعفر صادق (ع) (۲۵ شوال)",
    "kind": "religious",
    "isOffDay": true,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1410-11-22",
    "title": "پیروزی انقلاب اسلامی",
    "kind": "official",
    "isOffDay": true,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1410-11-24",
    "title": "ولادت حضرت معصومه (س)، روز دختران (۱ ذوالقعده)",
    "kind": "religious",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1410-11-25",
    "title": "جشن ولنتاین",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1410-11-29",
    "title": "جشن سپندارمذگان و روز عشق",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1410-11-29",
    "title": "فاجعه انفجار قطار نیشابور [1382 خورشیدی]",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1410-12-04",
    "title": "ولادت امام رضا (ع) (۱۱ ذوالقعده)",
    "kind": "religious",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1410-12-05",
    "title": "روز بزرگداشت خواجه نصیر الدین طوسی و روز مهندس",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1410-12-07",
    "title": "سالروز استقلال کانون وکلای دادگستری و روز وکیل مدافع",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1410-12-15",
    "title": "روز درختکاری",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1410-12-18",
    "title": "روز جهانی زنان",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1410-12-23",
    "title": "شهادت امام محمد تقی (ع) (۳۰ ذوالقعده)",
    "kind": "religious",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1410-12-24",
    "title": "روز جهانی عدد پی π",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1410-12-25",
    "title": "پایان سرایش شاهنامه",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1410-12-25",
    "title": "روز بزرگداشت اختر چرخ ادب، پروین اعتصامی",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1410-12-29",
    "title": "روز ملی شدن صنعت نفت ایران",
    "kind": "official",
    "isOffDay": true,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1411-01-01",
    "title": "جشن نوروز/جشن سال نو",
    "kind": "official",
    "isOffDay": true,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1411-01-01",
    "title": "شهادت امام محمد باقر (ع) (۷ ذوالحجه)",
    "kind": "religious",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1411-01-01",
    "title": "روز جهانی شادی",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1411-01-02",
    "title": "عید نوروز",
    "kind": "official",
    "isOffDay": true,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1411-01-02",
    "title": "روز جهانی نوروز",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1411-01-03",
    "title": "عید نوروز",
    "kind": "official",
    "isOffDay": true,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1411-01-03",
    "title": "روز عرفه (۹ ذوالحجه)",
    "kind": "religious",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1411-01-04",
    "title": "عید نوروز",
    "kind": "official",
    "isOffDay": true,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1411-01-04",
    "title": "عید سعید قربان (۱۰ ذوالحجه)",
    "kind": "religious",
    "isOffDay": true,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1411-01-04",
    "title": "روز جهانی هواشناسی",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1411-01-06",
    "title": "روز امید، روز شادباش نویسی",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1411-01-06",
    "title": "زادروز اَشو زرتشت، اَبَراِنسان بزرگ تاریخ",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1411-01-08",
    "title": "روز جهانی تئاتر",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1411-01-09",
    "title": "ولادت امام علی النقی (ع) (۱۵ ذوالحجه)",
    "kind": "religious",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1411-01-10",
    "title": "جشن آبانگاه",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1411-01-12",
    "title": "روز جمهوری اسلامی",
    "kind": "official",
    "isOffDay": true,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1411-01-12",
    "title": "عید سعید غدیر خم (۱۸ ذوالحجه)",
    "kind": "religious",
    "isOffDay": true,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1411-01-13",
    "title": "جشن سیزده به در",
    "kind": "official",
    "isOffDay": true,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1411-01-14",
    "title": "ولادت امام موسی کاظم (ع) (۲۰ ذوالحجه)",
    "kind": "religious",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1411-01-17",
    "title": "سروش روز،جشن سروشگان",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1411-01-19",
    "title": "روز جهانی بهداشت",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1411-01-19",
    "title": "فروردین روز،جشن فروردینگان",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1411-01-23",
    "title": "روز دندانپزشک",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1411-01-25",
    "title": "روز بزرگداشت عطار نیشابوری",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1411-01-29",
    "title": "روز ارتش جمهوری اسلامی ایران",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1411-01-30",
    "title": "روز علوم آزمایشگاهی، زاد روز حکیم سید اسماعیل جرجانی",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1411-02-01",
    "title": "روز بزرگداشت سعدی",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1411-02-01",
    "title": "تاسوعای حسینی (۹ محرم)",
    "kind": "religious",
    "isOffDay": true,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1411-02-02",
    "title": "عاشورای حسینی (۱۰ محرم)",
    "kind": "religious",
    "isOffDay": true,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1411-02-03",
    "title": "جشن گیاه آوری؛ روز زمین",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1411-02-03",
    "title": "روز بزرگداشت شیخ بهایی؛ روز ملی کارآفرینی؛ روز معماری",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1411-02-04",
    "title": "شهادت امام زین العابدین (ع) (۱۲ محرم)",
    "kind": "religious",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1411-02-06",
    "title": "فاجعه‌ی انفجارِ بندر عباس [ 1404 خورشیدی]",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1411-02-08",
    "title": "روز جهانی طراحی و گرافیک",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1411-02-09",
    "title": "روز ملی روانشناس و مشاور",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1411-02-10",
    "title": "جشن چهلم نوروز؛ روز ملی خلیج فارس",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1411-02-12",
    "title": "روز معلم",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1411-02-12",
    "title": "روز جهانی کارگر",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1411-02-15",
    "title": "جشن میانه بهار/جشن بهاربد؛ روز شیراز",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1411-02-16",
    "title": "روز جهانی ماما",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1411-02-19",
    "title": "روز جهانی صلیب سرخ و هلال احمر",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1411-02-22",
    "title": "زادروز مریم میرزاخانی ریاضیدان ایرانی، روز جهانی زن در ریاضیات",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1411-02-23",
    "title": "روز جهانی پرستار",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1411-02-25",
    "title": "روز بزرگداشت فردوسی",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1411-02-27",
    "title": "روز ارتباطات و روابط عمومی",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1411-02-28",
    "title": "روز بزرگداشت حکیم عمر خیام",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1411-02-29",
    "title": "روز جهانی موزه و میراث فرهنگی",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1411-03-01",
    "title": "روز بهره وری و بهینه سازی مصرف",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1411-03-01",
    "title": "روز بزرگداشت ملاصدرا",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1411-03-02",
    "title": "فروریختن ساختمان متروپل در آبادان",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1411-03-03",
    "title": "فتح خرمشهر در عملیات بیت المقدس و روز مقاومت، ایثار و پیروزی",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1411-03-04",
    "title": "روز دزفول، روز مقاومت و پایداری",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1411-03-06",
    "title": "خرداد روز،جشن خردادگان",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1411-03-10",
    "title": "اربعین حسینی (۲۰ صفر)",
    "kind": "religious",
    "isOffDay": true,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1411-03-11",
    "title": "روز جهانی بدون دخانیات",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1411-03-14",
    "title": "رحلت حضرت امام خمینی",
    "kind": "official",
    "isOffDay": true,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1411-03-15",
    "title": "قیام 15 خرداد",
    "kind": "official",
    "isOffDay": true,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1411-03-16",
    "title": "روز جهانی محیط زیست",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1411-03-18",
    "title": "رحلت رسول اکرم؛شهادت امام حسن مجتبی (ع) (۲۸ صفر)",
    "kind": "religious",
    "isOffDay": true,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1411-03-20",
    "title": "شهادت امام رضا (ع) (۳۰ صفر)",
    "kind": "religious",
    "isOffDay": true,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1411-03-21",
    "title": "روز جهانی صنایع دستی",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1411-03-21",
    "title": "هجرت پیامبر اکرم از مکه به مدینه (۱ ربیع الاول)",
    "kind": "religious",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1411-03-23",
    "title": "روز جهانی مبارزه با کار کودکان",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1411-03-25",
    "title": "روز ملی گل وگیاه",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1411-03-25",
    "title": "روز جهانی اهدای خون",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1411-03-27",
    "title": "روز جهانی پدر",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1411-03-28",
    "title": "روز جهانی بیابان زدایی",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1411-03-28",
    "title": "شهادت امام حسن عسکری (ع) (۸ ربیع الاول)",
    "kind": "religious",
    "isOffDay": true,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1411-03-31",
    "title": "سالروز زلزله رودبار و منجیل [1369خورشیدی]",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1411-04-01",
    "title": "جشن آب پاشونک، جشن آغاز تابستان",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1411-04-01",
    "title": "میلاد رسول اکرم به روایت اهل سنت (۱۲ ربیع الاول)",
    "kind": "religious",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1411-04-06",
    "title": "روز جهانی مبارزه با مواد مخدر",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1411-04-06",
    "title": "میلاد رسول اکرم و امام جعفر صادق (ع) (۱۷ ربیع الاول)",
    "kind": "religious",
    "isOffDay": true,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1411-04-07",
    "title": "انفجار دفتر حزب جمهوری اسلامی؛ روز قوه قضاییه",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1411-04-08",
    "title": "روز مبارزه با سلاح های شیمیایی و میکروبی",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1411-04-10",
    "title": "روز صنعت و معدن",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1411-04-10",
    "title": "زادروز بابک خرمدین، سپه‌سالار دلاور ایران",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1411-04-10",
    "title": "روز بزرگداشت صائب تبریزی",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1411-04-12",
    "title": "شلیک به پرواز 655 ایران ایر توسط ناو وینسنس [ 1367 خورشیدی ]",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1411-04-14",
    "title": "روز قلم",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1411-04-15",
    "title": "جشن خام خواری",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1411-04-25",
    "title": "روز بهزیستی و تامین اجتماعی",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1411-04-27",
    "title": "اعلام پذیرش قطعنامه 598 شورای امنیت از سوی ایران [ 1367 خورشیدی ]",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1411-04-27",
    "title": "ولادت امام حسن عسکری (ع) (۸ ربیع الثانی)",
    "kind": "religious",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1411-04-29",
    "title": "وفات حضرت معصومه (س) (۱۰ ربیع الثانی)",
    "kind": "religious",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1411-05-07",
    "title": "اَمرداداَمرداد روز،جشن اَمردادگان",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1411-05-08",
    "title": "اَمردادروز بزرگداشت شیخ شهاب الدین سهروردی",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1411-05-10",
    "title": "اَمردادجشن چله تابستان",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1411-05-11",
    "title": "اَمردادآغاز هفته جهانی شیردهی",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1411-05-14",
    "title": "اَمردادسالروز صدور فرمان مشروطیت",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1411-05-17",
    "title": "اَمردادروز خبرنگار",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1411-05-23",
    "title": "اَمردادولادت حضرت زینب (س) و روز پرستار و بهورز (۵ جمادی الاول)",
    "kind": "religious",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1411-05-23",
    "title": "اَمردادروز جهانی چپ دست ها",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1411-05-28",
    "title": "اَمردادسالروز وقایع پس از برکناری محمد مصدق‌السلطنه",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1411-05-28",
    "title": "اَمردادسالروز فاجعه آتش زدن سینما رکس آبادان",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1411-05-29",
    "title": "اَمردادروز جهانی عکاسی",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1411-06-01",
    "title": "روز بزرگداشت ابوعلی سینا و روز پزشک",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1411-06-02",
    "title": "آغاز هفته دولت",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1411-06-04",
    "title": "زادروز کوروش بزرگ",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1411-06-04",
    "title": "شهریور روز،جشن شهریورگان",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1411-06-05",
    "title": "روز بزرگداشت محمدبن زکریای رازی و روز داروساز",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1411-06-11",
    "title": "روز ملی صنعت چاپ",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1411-06-13",
    "title": "روز بزرگداشت ابوریحان بیرونی",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1411-06-19",
    "title": "شهادت حضرت فاطمه زهرا (س) (۳ جمادی الثانیه)",
    "kind": "religious",
    "isOffDay": true,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1411-06-20",
    "title": "روز جهانی پیشگیری از خودکشی",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1411-06-21",
    "title": "روز سینما",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1411-06-21",
    "title": "حمله به برج‌های دوقلوی مرکز تجارت جهانی",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1411-06-27",
    "title": "روز شعر و ادب پارسی و روز بزرگداشت استاد شهریار",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1411-06-31",
    "title": "آغاز هفته دفاع مقدس",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1411-06-31",
    "title": "روز جهانی صلح",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1411-07-01",
    "title": "آغاز حمله مغول به ایران در پاییز 598 خورشیدی",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1411-07-04",
    "title": "روز گرامیداشت سربازان وطن",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1411-07-05",
    "title": "ولادت حضرت فاطمه زهرا (س) و روز مادر (۲۰ جمادی الثانیه)",
    "kind": "religious",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1411-07-06",
    "title": "روز جهانی جهانگردی",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1411-07-07",
    "title": "روز آتش نشانی و ایمنی",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1411-07-07",
    "title": "روز بزرگداشت شمس تبریزی",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1411-07-08",
    "title": "روز بزرگداشت مولوی",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1411-07-09",
    "title": "روز جهانی ناشنوایان",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1411-07-09",
    "title": "روز جهانی ترجمه و مترجم",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1411-07-10",
    "title": "مهر روز،جشن مهرگان",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1411-07-10",
    "title": "روز جهانی سالمندان",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1411-07-13",
    "title": "آغاز هفته جهانی فضا",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1411-07-14",
    "title": "روز دامپزشکی",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1411-07-14",
    "title": "روز جهانی معلم",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1411-07-16",
    "title": "روز ملی کودک",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1411-07-16",
    "title": "ولادت امام محمد باقر (ع) (۱ رجب)",
    "kind": "religious",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1411-07-18",
    "title": "شهادت امام علی النقی (ع) (۳ رجب)",
    "kind": "religious",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1411-07-18",
    "title": "روز جهانی پست",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1411-07-19",
    "title": "روز جهانی مبارزه با حکم اعدام",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1411-07-20",
    "title": "روز بزرگداشت حافظ",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1411-07-20",
    "title": "روز جهانی دختر",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1411-07-21",
    "title": "روز پیروزی کاوه و فریدون بر ضحاک",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1411-07-23",
    "title": "روز جهانی استاندارد",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1411-07-24",
    "title": "روز جهانی عصای سفید",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1411-07-25",
    "title": "ولادت امام محمد تقی (ع) (۱۰ رجب)",
    "kind": "religious",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1411-07-25",
    "title": "روز جهانی غذا",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1411-07-26",
    "title": "روز تربیت بدنی و ورزش",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1411-07-26",
    "title": "روز جهانی ریشه کنی فقر",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1411-07-28",
    "title": "ولادت امام علی (ع) و روز پدر (۱۳ رجب)",
    "kind": "religious",
    "isOffDay": true,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1411-07-28",
    "title": "زادروز ستارخان ملقب به سردار ملی و از سرداران جنبش مشروطه ایران",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1411-07-29",
    "title": "روز ملی کوهنورد",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1411-07-30",
    "title": "وفات حضرت زینب (س) (۱۵ رجب)",
    "kind": "religious",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1411-08-01",
    "title": "روز آمار و برنامه ریزی",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1411-08-01",
    "title": "روز بزرگداشت ابوالفضل بیهقی، تاریخ‌نگار و نویسنده ایرانی",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1411-08-07",
    "title": "سالروز ورود کوروش بزرگ به بابل در سال 539 پیش از میلاد",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1411-08-08",
    "title": "روز ملی محیط بان",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1411-08-10",
    "title": "آبان روز، جشن آبانگان",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1411-08-10",
    "title": "شهادت امام موسی کاظم (ع) (۲۵ رجب)",
    "kind": "religious",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1411-08-12",
    "title": "مبعث رسول اکرم (ص) (۲۷ رجب)",
    "kind": "religious",
    "isOffDay": true,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1411-08-14",
    "title": "روز ملّی مازندران",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1411-08-15",
    "title": "جشن میانه پاییز",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1411-08-17",
    "title": "ولادت سالار شهیدان، امام حسین (ع) و روز پاسدار (۳ شعبان)",
    "kind": "religious",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1411-08-18",
    "title": "روز ملی کیفیت",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1411-08-18",
    "title": "ولادت حضرت ابوالفضل العباس (ع) و روز جانباز (۴ شعبان)",
    "kind": "religious",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1411-08-19",
    "title": "ولادت امام زین العابدین (ع) (۵ شعبان)",
    "kind": "religious",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1411-08-24",
    "title": "روز کتاب و کتابخوانی",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1411-08-24",
    "title": "روز جهانی دیابت",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1411-08-25",
    "title": "ولادت حضرت علی اکبر (ع) و روز جوان (۱۱ شعبان)",
    "kind": "religious",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1411-08-27",
    "title": "روز جهانی دانش آموز",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1411-08-29",
    "title": "ولادت حضرت قائم عجل الله تعالی فرجه و جشن نیمه شعبان (۱۵ شعبان)",
    "kind": "religious",
    "isOffDay": true,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1411-08-29",
    "title": "روز جهانی آقایان",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1411-08-30",
    "title": "روز جهانی کودک",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1411-09-01",
    "title": "آذر جشن",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1411-09-05",
    "title": "روز بسیج مستضعفان",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1411-09-05",
    "title": "روز جهانی مبارزه با خشونت علیه زنان",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1411-09-07",
    "title": "سالروز عملیات مروارید و روز نیروی دریایی ارتش",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1411-09-09",
    "title": "جشن آذرگان ،آذر روز",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1411-09-11",
    "title": "روز جهانی ایدز",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1411-09-13",
    "title": "روز صنعت بیمه",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1411-09-13",
    "title": "روز جهانی معلولان (کم‌توانان)",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1411-09-15",
    "title": "روز حسابدار",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1411-09-20",
    "title": "روز جهانی حقوق بشر",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1411-09-21",
    "title": "روز جهانی کوهستان",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1411-09-25",
    "title": "روز پژوهش و فناوری",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1411-09-29",
    "title": "ولادت امام حسن مجتبی (ع) (۱۵ رمضان)",
    "kind": "religious",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1411-09-30",
    "title": "جشن شب یلدا، شب چلّه",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1411-10-01",
    "title": "روز میلاد خورشید؛ جشن خرم روز، نخستین جشن دیگان",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1411-10-02",
    "title": "شب قدر (۱۸ رمضان)",
    "kind": "religious",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1411-10-03",
    "title": "ضربت خوردن حضرت علی (ع) (۱۹ رمضان)",
    "kind": "religious",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1411-10-03",
    "title": "سالروز عملیات کربلای 4 [1365 خورشیدی]",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1411-10-05",
    "title": "زمین لرزه ی بم [1382 خورشیدی]",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1411-10-05",
    "title": "شهادت حضرت علی (ع) (۲۱ رمضان)",
    "kind": "religious",
    "isOffDay": true,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1411-10-05",
    "title": "جشن کریسمس",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1411-10-05",
    "title": "سالروز شهادت اَشو زرتشت، اَبَراِنسان بزرگ تاریخ",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1411-10-05",
    "title": "روز بزرگداشت دوستی",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1411-10-06",
    "title": "شب قدر (۲۲ رمضان)",
    "kind": "religious",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1411-10-08",
    "title": "دی به آذر روز، دومین جشن دیگان",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1411-10-09",
    "title": "اعدام میهن‌پرستان آذری در تبریز توسط قوای اشغالگر روس [1290 خورشیدی]",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1411-10-12",
    "title": "جشن آغاز سال نو میلادی",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1411-10-12",
    "title": "روز حافظ",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1411-10-13",
    "title": "شهادت سردار حاج قاسم سلیمانی [1398 خورشیدی]",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1411-10-14",
    "title": "عید سعید فطر (۱ شوال)",
    "kind": "religious",
    "isOffDay": true,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1411-10-15",
    "title": "دی به مهر روز، سومین جشن دیگان",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1411-10-15",
    "title": "تعطیل به مناسبت عید سعید فطر (۲ شوال)",
    "kind": "religious",
    "isOffDay": true,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1411-10-16",
    "title": "غرق شدن کشتی سانچی [1396 خورشیدی]",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1411-10-18",
    "title": "شلیک به پرواز 752 هواپیمایی اوکراین [1398 خورشیدی]",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1411-10-19",
    "title": "درگذشت اکبر هاشمی رفسنجانی [1395 خورشیدی]",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1411-10-20",
    "title": "قتل امیرکبیر به دستور ناصرالدین شاه قاجار [1230 خورشیدی]",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1411-10-23",
    "title": "دی به دین روز، چهارمین جشن دیگان",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1411-10-30",
    "title": "آتش‌سوزی و فروریختن ساختمان پلاسکو [1395 خورشیدی]",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1411-11-01",
    "title": "زادروز فردوسی",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1411-11-02",
    "title": "بهمن روز، جشن بهمنگان",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1411-11-06",
    "title": "بزرگداشت صفی‌الدین اُرمَوی و روز موسیقی ایرانی",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1411-11-08",
    "title": "شهادت امام جعفر صادق (ع) (۲۵ شوال)",
    "kind": "religious",
    "isOffDay": true,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1411-11-10",
    "title": "جشن سده، گرامیداشتِ کشف آتش به دستِ هوشنگ شاه",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1411-11-12",
    "title": "بازگشت امام خمینی (ره) به ایران",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1411-11-14",
    "title": "ولادت حضرت معصومه (س)، روز دختران (۱ ذوالقعده)",
    "kind": "religious",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1411-11-15",
    "title": "جشن میانه زمستان",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1411-11-19",
    "title": "روز نیروی هوایی",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1411-11-22",
    "title": "پیروزی انقلاب اسلامی",
    "kind": "official",
    "isOffDay": true,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1411-11-24",
    "title": "ولادت امام رضا (ع) (۱۱ ذوالقعده)",
    "kind": "religious",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1411-11-26",
    "title": "جشن ولنتاین",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1411-11-29",
    "title": "جشن سپندارمذگان و روز عشق",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1411-11-29",
    "title": "فاجعه انفجار قطار نیشابور [1382 خورشیدی]",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1411-12-05",
    "title": "روز بزرگداشت خواجه نصیر الدین طوسی و روز مهندس",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1411-12-07",
    "title": "سالروز استقلال کانون وکلای دادگستری و روز وکیل مدافع",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1411-12-12",
    "title": "شهادت امام محمد تقی (ع) (۳۰ ذوالقعده)",
    "kind": "religious",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1411-12-15",
    "title": "روز درختکاری",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1411-12-18",
    "title": "روز جهانی زنان",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1411-12-19",
    "title": "شهادت امام محمد باقر (ع) (۷ ذوالحجه)",
    "kind": "religious",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1411-12-21",
    "title": "روز عرفه (۹ ذوالحجه)",
    "kind": "religious",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1411-12-22",
    "title": "عید سعید قربان (۱۰ ذوالحجه)",
    "kind": "religious",
    "isOffDay": true,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1411-12-24",
    "title": "روز جهانی عدد پی π",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1411-12-25",
    "title": "پایان سرایش شاهنامه",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1411-12-25",
    "title": "روز بزرگداشت اختر چرخ ادب، پروین اعتصامی",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1411-12-27",
    "title": "ولادت امام علی النقی (ع) (۱۵ ذوالحجه)",
    "kind": "religious",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1411-12-29",
    "title": "روز ملی شدن صنعت نفت ایران",
    "kind": "official",
    "isOffDay": true,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1412-01-01",
    "title": "جشن نوروز/جشن سال نو",
    "kind": "official",
    "isOffDay": true,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1412-01-01",
    "title": "عید سعید غدیر خم (۱۸ ذوالحجه)",
    "kind": "religious",
    "isOffDay": true,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1412-01-01",
    "title": "روز جهانی شادی",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1412-01-02",
    "title": "عید نوروز",
    "kind": "official",
    "isOffDay": true,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1412-01-02",
    "title": "روز جهانی نوروز",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1412-01-03",
    "title": "عید نوروز",
    "kind": "official",
    "isOffDay": true,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1412-01-03",
    "title": "ولادت امام موسی کاظم (ع) (۲۰ ذوالحجه)",
    "kind": "religious",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1412-01-04",
    "title": "عید نوروز",
    "kind": "official",
    "isOffDay": true,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1412-01-04",
    "title": "روز جهانی هواشناسی",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1412-01-06",
    "title": "روز امید، روز شادباش نویسی",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1412-01-06",
    "title": "زادروز اَشو زرتشت، اَبَراِنسان بزرگ تاریخ",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1412-01-08",
    "title": "روز جهانی تئاتر",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1412-01-10",
    "title": "جشن آبانگاه",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1412-01-12",
    "title": "روز جمهوری اسلامی",
    "kind": "official",
    "isOffDay": true,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1412-01-13",
    "title": "جشن سیزده به در",
    "kind": "official",
    "isOffDay": true,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1412-01-17",
    "title": "سروش روز،جشن سروشگان",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1412-01-19",
    "title": "روز جهانی بهداشت",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1412-01-19",
    "title": "فروردین روز،جشن فروردینگان",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1412-01-22",
    "title": "تاسوعای حسینی (۹ محرم)",
    "kind": "religious",
    "isOffDay": true,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1412-01-23",
    "title": "عاشورای حسینی (۱۰ محرم)",
    "kind": "religious",
    "isOffDay": true,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1412-01-23",
    "title": "روز دندانپزشک",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1412-01-25",
    "title": "روز بزرگداشت عطار نیشابوری",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1412-01-25",
    "title": "شهادت امام زین العابدین (ع) (۱۲ محرم)",
    "kind": "religious",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1412-01-29",
    "title": "روز ارتش جمهوری اسلامی ایران",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1412-01-30",
    "title": "روز علوم آزمایشگاهی، زاد روز حکیم سید اسماعیل جرجانی",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1412-02-01",
    "title": "روز بزرگداشت سعدی",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1412-02-03",
    "title": "جشن گیاه آوری؛ روز زمین",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1412-02-03",
    "title": "روز بزرگداشت شیخ بهایی؛ روز ملی کارآفرینی؛ روز معماری",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1412-02-06",
    "title": "فاجعه‌ی انفجارِ بندر عباس [ 1404 خورشیدی]",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1412-02-08",
    "title": "روز جهانی طراحی و گرافیک",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1412-02-09",
    "title": "روز ملی روانشناس و مشاور",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1412-02-10",
    "title": "جشن چهلم نوروز؛ روز ملی خلیج فارس",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1412-02-12",
    "title": "روز معلم",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1412-02-12",
    "title": "روز جهانی کارگر",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1412-02-15",
    "title": "جشن میانه بهار/جشن بهاربد؛ روز شیراز",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1412-02-16",
    "title": "روز جهانی ماما",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1412-02-19",
    "title": "روز جهانی صلیب سرخ و هلال احمر",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1412-02-22",
    "title": "زادروز مریم میرزاخانی ریاضیدان ایرانی، روز جهانی زن در ریاضیات",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1412-02-23",
    "title": "روز جهانی پرستار",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1412-02-25",
    "title": "روز بزرگداشت فردوسی",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1412-02-27",
    "title": "روز ارتباطات و روابط عمومی",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1412-02-28",
    "title": "روز بزرگداشت حکیم عمر خیام",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1412-02-29",
    "title": "روز جهانی موزه و میراث فرهنگی",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1412-02-31",
    "title": "اربعین حسینی (۲۰ صفر)",
    "kind": "religious",
    "isOffDay": true,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1412-03-01",
    "title": "روز بهره وری و بهینه سازی مصرف",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1412-03-01",
    "title": "روز بزرگداشت ملاصدرا",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1412-03-02",
    "title": "فروریختن ساختمان متروپل در آبادان",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1412-03-03",
    "title": "فتح خرمشهر در عملیات بیت المقدس و روز مقاومت، ایثار و پیروزی",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1412-03-04",
    "title": "روز دزفول، روز مقاومت و پایداری",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1412-03-06",
    "title": "خرداد روز،جشن خردادگان",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1412-03-08",
    "title": "رحلت رسول اکرم؛شهادت امام حسن مجتبی (ع) (۲۸ صفر)",
    "kind": "religious",
    "isOffDay": true,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1412-03-09",
    "title": "شهادت امام رضا (ع) (۳۰ صفر)",
    "kind": "religious",
    "isOffDay": true,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1412-03-10",
    "title": "هجرت پیامبر اکرم از مکه به مدینه (۱ ربیع الاول)",
    "kind": "religious",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1412-03-11",
    "title": "روز جهانی بدون دخانیات",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1412-03-14",
    "title": "رحلت حضرت امام خمینی",
    "kind": "official",
    "isOffDay": true,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1412-03-15",
    "title": "قیام 15 خرداد",
    "kind": "official",
    "isOffDay": true,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1412-03-16",
    "title": "روز جهانی محیط زیست",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1412-03-17",
    "title": "شهادت امام حسن عسکری (ع) (۸ ربیع الاول)",
    "kind": "religious",
    "isOffDay": true,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1412-03-21",
    "title": "روز جهانی صنایع دستی",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1412-03-21",
    "title": "میلاد رسول اکرم به روایت اهل سنت (۱۲ ربیع الاول)",
    "kind": "religious",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1412-03-23",
    "title": "روز جهانی مبارزه با کار کودکان",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1412-03-25",
    "title": "روز ملی گل وگیاه",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1412-03-25",
    "title": "روز جهانی اهدای خون",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1412-03-26",
    "title": "میلاد رسول اکرم و امام جعفر صادق (ع) (۱۷ ربیع الاول)",
    "kind": "religious",
    "isOffDay": true,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1412-03-27",
    "title": "روز جهانی پدر",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1412-03-28",
    "title": "روز جهانی بیابان زدایی",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1412-03-31",
    "title": "سالروز زلزله رودبار و منجیل [1369خورشیدی]",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1412-04-01",
    "title": "جشن آب پاشونک، جشن آغاز تابستان",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1412-04-06",
    "title": "روز جهانی مبارزه با مواد مخدر",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1412-04-07",
    "title": "انفجار دفتر حزب جمهوری اسلامی؛ روز قوه قضاییه",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1412-04-08",
    "title": "روز مبارزه با سلاح های شیمیایی و میکروبی",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1412-04-10",
    "title": "روز صنعت و معدن",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1412-04-10",
    "title": "زادروز بابک خرمدین، سپه‌سالار دلاور ایران",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1412-04-10",
    "title": "روز بزرگداشت صائب تبریزی",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1412-04-12",
    "title": "شلیک به پرواز 655 ایران ایر توسط ناو وینسنس [ 1367 خورشیدی ]",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1412-04-14",
    "title": "روز قلم",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1412-04-15",
    "title": "جشن خام خواری",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1412-04-16",
    "title": "ولادت امام حسن عسکری (ع) (۸ ربیع الثانی)",
    "kind": "religious",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1412-04-18",
    "title": "وفات حضرت معصومه (س) (۱۰ ربیع الثانی)",
    "kind": "religious",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1412-04-25",
    "title": "روز بهزیستی و تامین اجتماعی",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1412-04-27",
    "title": "اعلام پذیرش قطعنامه 598 شورای امنیت از سوی ایران [ 1367 خورشیدی ]",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1412-05-07",
    "title": "اَمرداداَمرداد روز،جشن اَمردادگان",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1412-05-08",
    "title": "اَمردادروز بزرگداشت شیخ شهاب الدین سهروردی",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1412-05-10",
    "title": "اَمردادجشن چله تابستان",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1412-05-11",
    "title": "اَمردادآغاز هفته جهانی شیردهی",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1412-05-12",
    "title": "اَمردادولادت حضرت زینب (س) و روز پرستار و بهورز (۵ جمادی الاول)",
    "kind": "religious",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1412-05-14",
    "title": "اَمردادسالروز صدور فرمان مشروطیت",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1412-05-17",
    "title": "اَمردادروز خبرنگار",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1412-05-23",
    "title": "اَمردادروز جهانی چپ دست ها",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1412-05-28",
    "title": "اَمردادسالروز وقایع پس از برکناری محمد مصدق‌السلطنه",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1412-05-28",
    "title": "اَمردادسالروز فاجعه آتش زدن سینما رکس آبادان",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1412-05-29",
    "title": "اَمردادروز جهانی عکاسی",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1412-06-01",
    "title": "روز بزرگداشت ابوعلی سینا و روز پزشک",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1412-06-02",
    "title": "آغاز هفته دولت",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1412-06-04",
    "title": "زادروز کوروش بزرگ",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1412-06-04",
    "title": "شهریور روز،جشن شهریورگان",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1412-06-05",
    "title": "روز بزرگداشت محمدبن زکریای رازی و روز داروساز",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1412-06-08",
    "title": "شهادت حضرت فاطمه زهرا (س) (۳ جمادی الثانیه)",
    "kind": "religious",
    "isOffDay": true,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1412-06-11",
    "title": "روز ملی صنعت چاپ",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1412-06-13",
    "title": "روز بزرگداشت ابوریحان بیرونی",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1412-06-20",
    "title": "روز جهانی پیشگیری از خودکشی",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1412-06-21",
    "title": "روز سینما",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1412-06-21",
    "title": "حمله به برج‌های دوقلوی مرکز تجارت جهانی",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1412-06-25",
    "title": "ولادت حضرت فاطمه زهرا (س) و روز مادر (۲۰ جمادی الثانیه)",
    "kind": "religious",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1412-06-27",
    "title": "روز شعر و ادب پارسی و روز بزرگداشت استاد شهریار",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1412-06-31",
    "title": "آغاز هفته دفاع مقدس",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1412-06-31",
    "title": "روز جهانی صلح",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1412-07-01",
    "title": "آغاز حمله مغول به ایران در پاییز 598 خورشیدی",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1412-07-04",
    "title": "روز گرامیداشت سربازان وطن",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1412-07-05",
    "title": "ولادت امام محمد باقر (ع) (۱ رجب)",
    "kind": "religious",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1412-07-06",
    "title": "روز جهانی جهانگردی",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1412-07-07",
    "title": "روز آتش نشانی و ایمنی",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1412-07-07",
    "title": "شهادت امام علی النقی (ع) (۳ رجب)",
    "kind": "religious",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1412-07-07",
    "title": "روز بزرگداشت شمس تبریزی",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1412-07-08",
    "title": "روز بزرگداشت مولوی",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1412-07-09",
    "title": "روز جهانی ناشنوایان",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1412-07-09",
    "title": "روز جهانی ترجمه و مترجم",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1412-07-10",
    "title": "مهر روز،جشن مهرگان",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1412-07-10",
    "title": "روز جهانی سالمندان",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1412-07-13",
    "title": "آغاز هفته جهانی فضا",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1412-07-14",
    "title": "روز دامپزشکی",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1412-07-14",
    "title": "ولادت امام محمد تقی (ع) (۱۰ رجب)",
    "kind": "religious",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1412-07-14",
    "title": "روز جهانی معلم",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1412-07-16",
    "title": "روز ملی کودک",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1412-07-17",
    "title": "ولادت امام علی (ع) و روز پدر (۱۳ رجب)",
    "kind": "religious",
    "isOffDay": true,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1412-07-18",
    "title": "روز جهانی پست",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1412-07-19",
    "title": "وفات حضرت زینب (س) (۱۵ رجب)",
    "kind": "religious",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1412-07-19",
    "title": "روز جهانی مبارزه با حکم اعدام",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1412-07-20",
    "title": "روز بزرگداشت حافظ",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1412-07-20",
    "title": "روز جهانی دختر",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1412-07-21",
    "title": "روز پیروزی کاوه و فریدون بر ضحاک",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1412-07-23",
    "title": "روز جهانی استاندارد",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1412-07-24",
    "title": "روز جهانی عصای سفید",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1412-07-25",
    "title": "روز جهانی غذا",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1412-07-26",
    "title": "روز تربیت بدنی و ورزش",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1412-07-26",
    "title": "روز جهانی ریشه کنی فقر",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1412-07-28",
    "title": "زادروز ستارخان ملقب به سردار ملی و از سرداران جنبش مشروطه ایران",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1412-07-29",
    "title": "شهادت امام موسی کاظم (ع) (۲۵ رجب)",
    "kind": "religious",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1412-07-29",
    "title": "روز ملی کوهنورد",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1412-08-01",
    "title": "روز آمار و برنامه ریزی",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1412-08-01",
    "title": "مبعث رسول اکرم (ص) (۲۷ رجب)",
    "kind": "religious",
    "isOffDay": true,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1412-08-01",
    "title": "روز بزرگداشت ابوالفضل بیهقی، تاریخ‌نگار و نویسنده ایرانی",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1412-08-06",
    "title": "ولادت سالار شهیدان، امام حسین (ع) و روز پاسدار (۳ شعبان)",
    "kind": "religious",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1412-08-07",
    "title": "ولادت حضرت ابوالفضل العباس (ع) و روز جانباز (۴ شعبان)",
    "kind": "religious",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1412-08-07",
    "title": "سالروز ورود کوروش بزرگ به بابل در سال 539 پیش از میلاد",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1412-08-08",
    "title": "ولادت امام زین العابدین (ع) (۵ شعبان)",
    "kind": "religious",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1412-08-08",
    "title": "روز ملی محیط بان",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1412-08-10",
    "title": "آبان روز، جشن آبانگان",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1412-08-14",
    "title": "ولادت حضرت علی اکبر (ع) و روز جوان (۱۱ شعبان)",
    "kind": "religious",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1412-08-14",
    "title": "روز ملّی مازندران",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1412-08-15",
    "title": "جشن میانه پاییز",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1412-08-18",
    "title": "روز ملی کیفیت",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1412-08-18",
    "title": "ولادت حضرت قائم عجل الله تعالی فرجه و جشن نیمه شعبان (۱۵ شعبان)",
    "kind": "religious",
    "isOffDay": true,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1412-08-24",
    "title": "روز کتاب و کتابخوانی",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1412-08-24",
    "title": "روز جهانی دیابت",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1412-08-27",
    "title": "روز جهانی دانش آموز",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1412-08-29",
    "title": "روز جهانی آقایان",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1412-08-30",
    "title": "روز جهانی کودک",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1412-09-01",
    "title": "آذر جشن",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1412-09-05",
    "title": "روز بسیج مستضعفان",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1412-09-05",
    "title": "روز جهانی مبارزه با خشونت علیه زنان",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1412-09-07",
    "title": "سالروز عملیات مروارید و روز نیروی دریایی ارتش",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1412-09-09",
    "title": "جشن آذرگان ،آذر روز",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1412-09-11",
    "title": "روز جهانی ایدز",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1412-09-13",
    "title": "روز صنعت بیمه",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1412-09-13",
    "title": "روز جهانی معلولان (کم‌توانان)",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1412-09-15",
    "title": "روز حسابدار",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1412-09-18",
    "title": "ولادت امام حسن مجتبی (ع) (۱۵ رمضان)",
    "kind": "religious",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1412-09-20",
    "title": "روز جهانی حقوق بشر",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1412-09-21",
    "title": "شب قدر (۱۸ رمضان)",
    "kind": "religious",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1412-09-21",
    "title": "روز جهانی کوهستان",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1412-09-22",
    "title": "ضربت خوردن حضرت علی (ع) (۱۹ رمضان)",
    "kind": "religious",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1412-09-24",
    "title": "شهادت حضرت علی (ع) (۲۱ رمضان)",
    "kind": "religious",
    "isOffDay": true,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1412-09-25",
    "title": "روز پژوهش و فناوری",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1412-09-25",
    "title": "شب قدر (۲۲ رمضان)",
    "kind": "religious",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1412-09-30",
    "title": "جشن شب یلدا، شب چلّه",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1412-10-01",
    "title": "روز میلاد خورشید؛ جشن خرم روز، نخستین جشن دیگان",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1412-10-03",
    "title": "سالروز عملیات کربلای 4 [1365 خورشیدی]",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1412-10-04",
    "title": "عید سعید فطر (۱ شوال)",
    "kind": "religious",
    "isOffDay": true,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1412-10-05",
    "title": "زمین لرزه ی بم [1382 خورشیدی]",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1412-10-05",
    "title": "تعطیل به مناسبت عید سعید فطر (۲ شوال)",
    "kind": "religious",
    "isOffDay": true,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1412-10-05",
    "title": "جشن کریسمس",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1412-10-05",
    "title": "سالروز شهادت اَشو زرتشت، اَبَراِنسان بزرگ تاریخ",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1412-10-05",
    "title": "روز بزرگداشت دوستی",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1412-10-08",
    "title": "دی به آذر روز، دومین جشن دیگان",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1412-10-09",
    "title": "اعدام میهن‌پرستان آذری در تبریز توسط قوای اشغالگر روس [1290 خورشیدی]",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1412-10-12",
    "title": "جشن آغاز سال نو میلادی",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1412-10-12",
    "title": "روز حافظ",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1412-10-13",
    "title": "شهادت سردار حاج قاسم سلیمانی [1398 خورشیدی]",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1412-10-15",
    "title": "دی به مهر روز، سومین جشن دیگان",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1412-10-16",
    "title": "غرق شدن کشتی سانچی [1396 خورشیدی]",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1412-10-18",
    "title": "شلیک به پرواز 752 هواپیمایی اوکراین [1398 خورشیدی]",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1412-10-19",
    "title": "درگذشت اکبر هاشمی رفسنجانی [1395 خورشیدی]",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1412-10-20",
    "title": "قتل امیرکبیر به دستور ناصرالدین شاه قاجار [1230 خورشیدی]",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1412-10-23",
    "title": "دی به دین روز، چهارمین جشن دیگان",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1412-10-28",
    "title": "شهادت امام جعفر صادق (ع) (۲۵ شوال)",
    "kind": "religious",
    "isOffDay": true,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1412-10-30",
    "title": "آتش‌سوزی و فروریختن ساختمان پلاسکو [1395 خورشیدی]",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1412-11-01",
    "title": "زادروز فردوسی",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1412-11-02",
    "title": "بهمن روز، جشن بهمنگان",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1412-11-03",
    "title": "ولادت حضرت معصومه (س)، روز دختران (۱ ذوالقعده)",
    "kind": "religious",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1412-11-06",
    "title": "بزرگداشت صفی‌الدین اُرمَوی و روز موسیقی ایرانی",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1412-11-10",
    "title": "جشن سده، گرامیداشتِ کشف آتش به دستِ هوشنگ شاه",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1412-11-12",
    "title": "بازگشت امام خمینی (ره) به ایران",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1412-11-13",
    "title": "ولادت امام رضا (ع) (۱۱ ذوالقعده)",
    "kind": "religious",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1412-11-15",
    "title": "جشن میانه زمستان",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1412-11-19",
    "title": "روز نیروی هوایی",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1412-11-22",
    "title": "پیروزی انقلاب اسلامی",
    "kind": "official",
    "isOffDay": true,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1412-11-26",
    "title": "جشن ولنتاین",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1412-11-29",
    "title": "جشن سپندارمذگان و روز عشق",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1412-11-29",
    "title": "فاجعه انفجار قطار نیشابور [1382 خورشیدی]",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1412-12-02",
    "title": "شهادت امام محمد تقی (ع) (۳۰ ذوالقعده)",
    "kind": "religious",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1412-12-05",
    "title": "روز بزرگداشت خواجه نصیر الدین طوسی و روز مهندس",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1412-12-07",
    "title": "سالروز استقلال کانون وکلای دادگستری و روز وکیل مدافع",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1412-12-09",
    "title": "شهادت امام محمد باقر (ع) (۷ ذوالحجه)",
    "kind": "religious",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1412-12-11",
    "title": "روز عرفه (۹ ذوالحجه)",
    "kind": "religious",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1412-12-12",
    "title": "عید سعید قربان (۱۰ ذوالحجه)",
    "kind": "religious",
    "isOffDay": true,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1412-12-15",
    "title": "روز درختکاری",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1412-12-17",
    "title": "ولادت امام علی النقی (ع) (۱۵ ذوالحجه)",
    "kind": "religious",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1412-12-18",
    "title": "روز جهانی زنان",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1412-12-20",
    "title": "عید سعید غدیر خم (۱۸ ذوالحجه)",
    "kind": "religious",
    "isOffDay": true,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1412-12-22",
    "title": "ولادت امام موسی کاظم (ع) (۲۰ ذوالحجه)",
    "kind": "religious",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1412-12-24",
    "title": "روز جهانی عدد پی π",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1412-12-25",
    "title": "پایان سرایش شاهنامه",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1412-12-25",
    "title": "روز بزرگداشت اختر چرخ ادب، پروین اعتصامی",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1412-12-29",
    "title": "روز ملی شدن صنعت نفت ایران",
    "kind": "official",
    "isOffDay": true,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1412-12-30",
    "title": "آخرین روز سال",
    "kind": "official",
    "isOffDay": true,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1412-12-30",
    "title": "روز جهانی شادی",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1413-01-01",
    "title": "جشن نوروز/جشن سال نو",
    "kind": "official",
    "isOffDay": true,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1413-01-01",
    "title": "روز جهانی نوروز",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1413-01-02",
    "title": "عید نوروز",
    "kind": "official",
    "isOffDay": true,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1413-01-03",
    "title": "عید نوروز",
    "kind": "official",
    "isOffDay": true,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1413-01-03",
    "title": "روز جهانی هواشناسی",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1413-01-04",
    "title": "عید نوروز",
    "kind": "official",
    "isOffDay": true,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1413-01-06",
    "title": "روز امید، روز شادباش نویسی",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1413-01-06",
    "title": "زادروز اَشو زرتشت، اَبَراِنسان بزرگ تاریخ",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1413-01-07",
    "title": "روز جهانی تئاتر",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1413-01-10",
    "title": "جشن آبانگاه",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1413-01-10",
    "title": "تاسوعای حسینی (۹ محرم)",
    "kind": "religious",
    "isOffDay": true,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1413-01-11",
    "title": "عاشورای حسینی (۱۰ محرم)",
    "kind": "religious",
    "isOffDay": true,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1413-01-12",
    "title": "روز جمهوری اسلامی",
    "kind": "official",
    "isOffDay": true,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1413-01-13",
    "title": "جشن سیزده به در",
    "kind": "official",
    "isOffDay": true,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1413-01-13",
    "title": "شهادت امام زین العابدین (ع) (۱۲ محرم)",
    "kind": "religious",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1413-01-17",
    "title": "سروش روز،جشن سروشگان",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1413-01-18",
    "title": "روز جهانی بهداشت",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1413-01-19",
    "title": "فروردین روز،جشن فروردینگان",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1413-01-23",
    "title": "روز دندانپزشک",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1413-01-25",
    "title": "روز بزرگداشت عطار نیشابوری",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1413-01-29",
    "title": "روز ارتش جمهوری اسلامی ایران",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1413-01-30",
    "title": "روز علوم آزمایشگاهی، زاد روز حکیم سید اسماعیل جرجانی",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1413-02-01",
    "title": "روز بزرگداشت سعدی",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1413-02-02",
    "title": "جشن گیاه آوری؛ روز زمین",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1413-02-03",
    "title": "روز بزرگداشت شیخ بهایی؛ روز ملی کارآفرینی؛ روز معماری",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1413-02-06",
    "title": "فاجعه‌ی انفجارِ بندر عباس [ 1404 خورشیدی]",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1413-02-07",
    "title": "روز جهانی طراحی و گرافیک",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1413-02-09",
    "title": "روز ملی روانشناس و مشاور",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1413-02-10",
    "title": "جشن چهلم نوروز؛ روز ملی خلیج فارس",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1413-02-11",
    "title": "روز جهانی کارگر",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1413-02-12",
    "title": "روز معلم",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1413-02-15",
    "title": "جشن میانه بهار/جشن بهاربد؛ روز شیراز",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1413-02-15",
    "title": "روز جهانی ماما",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1413-02-18",
    "title": "روز جهانی صلیب سرخ و هلال احمر",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1413-02-20",
    "title": "اربعین حسینی (۲۰ صفر)",
    "kind": "religious",
    "isOffDay": true,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1413-02-22",
    "title": "زادروز مریم میرزاخانی ریاضیدان ایرانی، روز جهانی زن در ریاضیات",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1413-02-22",
    "title": "روز جهانی پرستار",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1413-02-25",
    "title": "روز بزرگداشت فردوسی",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1413-02-27",
    "title": "روز ارتباطات و روابط عمومی",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1413-02-28",
    "title": "روز بزرگداشت حکیم عمر خیام",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1413-02-28",
    "title": "روز جهانی موزه و میراث فرهنگی",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1413-02-28",
    "title": "رحلت رسول اکرم؛شهادت امام حسن مجتبی (ع) (۲۸ صفر)",
    "kind": "religious",
    "isOffDay": true,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1413-02-29",
    "title": "شهادت امام رضا (ع) (۳۰ صفر)",
    "kind": "religious",
    "isOffDay": true,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1413-02-30",
    "title": "هجرت پیامبر اکرم از مکه به مدینه (۱ ربیع الاول)",
    "kind": "religious",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1413-03-01",
    "title": "روز بهره وری و بهینه سازی مصرف",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1413-03-01",
    "title": "روز بزرگداشت ملاصدرا",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1413-03-02",
    "title": "فروریختن ساختمان متروپل در آبادان",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1413-03-03",
    "title": "فتح خرمشهر در عملیات بیت المقدس و روز مقاومت، ایثار و پیروزی",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1413-03-04",
    "title": "روز دزفول، روز مقاومت و پایداری",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1413-03-06",
    "title": "خرداد روز،جشن خردادگان",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1413-03-06",
    "title": "شهادت امام حسن عسکری (ع) (۸ ربیع الاول)",
    "kind": "religious",
    "isOffDay": true,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1413-03-10",
    "title": "میلاد رسول اکرم به روایت اهل سنت (۱۲ ربیع الاول)",
    "kind": "religious",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1413-03-10",
    "title": "روز جهانی بدون دخانیات",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1413-03-14",
    "title": "رحلت حضرت امام خمینی",
    "kind": "official",
    "isOffDay": true,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1413-03-15",
    "title": "قیام 15 خرداد",
    "kind": "official",
    "isOffDay": true,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1413-03-15",
    "title": "روز جهانی محیط زیست",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1413-03-15",
    "title": "میلاد رسول اکرم و امام جعفر صادق (ع) (۱۷ ربیع الاول)",
    "kind": "religious",
    "isOffDay": true,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1413-03-20",
    "title": "روز جهانی صنایع دستی",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1413-03-22",
    "title": "روز جهانی مبارزه با کار کودکان",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1413-03-24",
    "title": "روز جهانی اهدای خون",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1413-03-25",
    "title": "روز ملی گل وگیاه",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1413-03-26",
    "title": "روز جهانی پدر",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1413-03-27",
    "title": "روز جهانی بیابان زدایی",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1413-03-31",
    "title": "سالروز زلزله رودبار و منجیل [1369خورشیدی]",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1413-04-01",
    "title": "جشن آب پاشونک، جشن آغاز تابستان",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1413-04-04",
    "title": "ولادت امام حسن عسکری (ع) (۸ ربیع الثانی)",
    "kind": "religious",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1413-04-05",
    "title": "روز جهانی مبارزه با مواد مخدر",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1413-04-06",
    "title": "وفات حضرت معصومه (س) (۱۰ ربیع الثانی)",
    "kind": "religious",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1413-04-07",
    "title": "انفجار دفتر حزب جمهوری اسلامی؛ روز قوه قضاییه",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1413-04-08",
    "title": "روز مبارزه با سلاح های شیمیایی و میکروبی",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1413-04-10",
    "title": "روز صنعت و معدن",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1413-04-10",
    "title": "زادروز بابک خرمدین، سپه‌سالار دلاور ایران",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1413-04-10",
    "title": "روز بزرگداشت صائب تبریزی",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1413-04-12",
    "title": "شلیک به پرواز 655 ایران ایر توسط ناو وینسنس [ 1367 خورشیدی ]",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1413-04-14",
    "title": "روز قلم",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1413-04-15",
    "title": "جشن خام خواری",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1413-04-25",
    "title": "روز بهزیستی و تامین اجتماعی",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1413-04-27",
    "title": "اعلام پذیرش قطعنامه 598 شورای امنیت از سوی ایران [ 1367 خورشیدی ]",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1413-04-31",
    "title": "ولادت حضرت زینب (س) و روز پرستار و بهورز (۵ جمادی الاول)",
    "kind": "religious",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1413-05-07",
    "title": "اَمرداداَمرداد روز،جشن اَمردادگان",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1413-05-08",
    "title": "اَمردادروز بزرگداشت شیخ شهاب الدین سهروردی",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1413-05-10",
    "title": "اَمردادجشن چله تابستان",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1413-05-10",
    "title": "اَمردادآغاز هفته جهانی شیردهی",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1413-05-14",
    "title": "اَمردادسالروز صدور فرمان مشروطیت",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1413-05-17",
    "title": "اَمردادروز خبرنگار",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1413-05-22",
    "title": "اَمردادروز جهانی چپ دست ها",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1413-05-27",
    "title": "اَمردادشهادت حضرت فاطمه زهرا (س) (۳ جمادی الثانیه)",
    "kind": "religious",
    "isOffDay": true,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1413-05-28",
    "title": "اَمردادسالروز وقایع پس از برکناری محمد مصدق‌السلطنه",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1413-05-28",
    "title": "اَمردادسالروز فاجعه آتش زدن سینما رکس آبادان",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1413-05-28",
    "title": "اَمردادروز جهانی عکاسی",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1413-06-01",
    "title": "روز بزرگداشت ابوعلی سینا و روز پزشک",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1413-06-02",
    "title": "آغاز هفته دولت",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1413-06-04",
    "title": "زادروز کوروش بزرگ",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1413-06-04",
    "title": "شهریور روز،جشن شهریورگان",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1413-06-05",
    "title": "روز بزرگداشت محمدبن زکریای رازی و روز داروساز",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1413-06-11",
    "title": "روز ملی صنعت چاپ",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1413-06-13",
    "title": "روز بزرگداشت ابوریحان بیرونی",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1413-06-13",
    "title": "ولادت حضرت فاطمه زهرا (س) و روز مادر (۲۰ جمادی الثانیه)",
    "kind": "religious",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1413-06-19",
    "title": "روز جهانی پیشگیری از خودکشی",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1413-06-20",
    "title": "حمله به برج‌های دوقلوی مرکز تجارت جهانی",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1413-06-21",
    "title": "روز سینما",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1413-06-24",
    "title": "ولادت امام محمد باقر (ع) (۱ رجب)",
    "kind": "religious",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1413-06-26",
    "title": "شهادت امام علی النقی (ع) (۳ رجب)",
    "kind": "religious",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1413-06-27",
    "title": "روز شعر و ادب پارسی و روز بزرگداشت استاد شهریار",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1413-06-30",
    "title": "روز جهانی صلح",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1413-06-31",
    "title": "آغاز هفته دفاع مقدس",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1413-07-01",
    "title": "آغاز حمله مغول به ایران در پاییز 598 خورشیدی",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1413-07-02",
    "title": "ولادت امام محمد تقی (ع) (۱۰ رجب)",
    "kind": "religious",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1413-07-04",
    "title": "روز گرامیداشت سربازان وطن",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1413-07-05",
    "title": "روز جهانی جهانگردی",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1413-07-05",
    "title": "ولادت امام علی (ع) و روز پدر (۱۳ رجب)",
    "kind": "religious",
    "isOffDay": true,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1413-07-07",
    "title": "روز آتش نشانی و ایمنی",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1413-07-07",
    "title": "وفات حضرت زینب (س) (۱۵ رجب)",
    "kind": "religious",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1413-07-07",
    "title": "روز بزرگداشت شمس تبریزی",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1413-07-08",
    "title": "روز بزرگداشت مولوی",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1413-07-08",
    "title": "روز جهانی ناشنوایان",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1413-07-08",
    "title": "روز جهانی ترجمه و مترجم",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1413-07-09",
    "title": "روز جهانی سالمندان",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1413-07-10",
    "title": "مهر روز،جشن مهرگان",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1413-07-12",
    "title": "آغاز هفته جهانی فضا",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1413-07-13",
    "title": "روز جهانی معلم",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1413-07-14",
    "title": "روز دامپزشکی",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1413-07-16",
    "title": "روز ملی کودک",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1413-07-17",
    "title": "شهادت امام موسی کاظم (ع) (۲۵ رجب)",
    "kind": "religious",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1413-07-17",
    "title": "روز جهانی پست",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1413-07-18",
    "title": "روز جهانی مبارزه با حکم اعدام",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1413-07-19",
    "title": "مبعث رسول اکرم (ص) (۲۷ رجب)",
    "kind": "religious",
    "isOffDay": true,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1413-07-19",
    "title": "روز جهانی دختر",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1413-07-20",
    "title": "روز بزرگداشت حافظ",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1413-07-21",
    "title": "روز پیروزی کاوه و فریدون بر ضحاک",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1413-07-22",
    "title": "روز جهانی استاندارد",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1413-07-23",
    "title": "روز جهانی عصای سفید",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1413-07-24",
    "title": "ولادت سالار شهیدان، امام حسین (ع) و روز پاسدار (۳ شعبان)",
    "kind": "religious",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1413-07-24",
    "title": "روز جهانی غذا",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1413-07-25",
    "title": "ولادت حضرت ابوالفضل العباس (ع) و روز جانباز (۴ شعبان)",
    "kind": "religious",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1413-07-25",
    "title": "روز جهانی ریشه کنی فقر",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1413-07-26",
    "title": "روز تربیت بدنی و ورزش",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1413-07-26",
    "title": "ولادت امام زین العابدین (ع) (۵ شعبان)",
    "kind": "religious",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1413-07-28",
    "title": "زادروز ستارخان ملقب به سردار ملی و از سرداران جنبش مشروطه ایران",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1413-07-29",
    "title": "روز ملی کوهنورد",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1413-08-01",
    "title": "روز آمار و برنامه ریزی",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1413-08-01",
    "title": "روز بزرگداشت ابوالفضل بیهقی، تاریخ‌نگار و نویسنده ایرانی",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1413-08-02",
    "title": "ولادت حضرت علی اکبر (ع) و روز جوان (۱۱ شعبان)",
    "kind": "religious",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1413-08-06",
    "title": "ولادت حضرت قائم عجل الله تعالی فرجه و جشن نیمه شعبان (۱۵ شعبان)",
    "kind": "religious",
    "isOffDay": true,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1413-08-07",
    "title": "سالروز ورود کوروش بزرگ به بابل در سال 539 پیش از میلاد",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1413-08-08",
    "title": "روز ملی محیط بان",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1413-08-10",
    "title": "آبان روز، جشن آبانگان",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1413-08-14",
    "title": "روز ملّی مازندران",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1413-08-15",
    "title": "جشن میانه پاییز",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1413-08-18",
    "title": "روز ملی کیفیت",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1413-08-23",
    "title": "روز جهانی دیابت",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1413-08-24",
    "title": "روز کتاب و کتابخوانی",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1413-08-26",
    "title": "روز جهانی دانش آموز",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1413-08-28",
    "title": "روز جهانی آقایان",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1413-08-29",
    "title": "روز جهانی کودک",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1413-09-01",
    "title": "آذر جشن",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1413-09-04",
    "title": "روز جهانی مبارزه با خشونت علیه زنان",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1413-09-05",
    "title": "روز بسیج مستضعفان",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1413-09-06",
    "title": "ولادت امام حسن مجتبی (ع) (۱۵ رمضان)",
    "kind": "religious",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1413-09-07",
    "title": "سالروز عملیات مروارید و روز نیروی دریایی ارتش",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1413-09-09",
    "title": "جشن آذرگان ،آذر روز",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1413-09-09",
    "title": "شب قدر (۱۸ رمضان)",
    "kind": "religious",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1413-09-10",
    "title": "ضربت خوردن حضرت علی (ع) (۱۹ رمضان)",
    "kind": "religious",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1413-09-10",
    "title": "روز جهانی ایدز",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1413-09-12",
    "title": "روز جهانی معلولان (کم‌توانان)",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1413-09-12",
    "title": "شهادت حضرت علی (ع) (۲۱ رمضان)",
    "kind": "religious",
    "isOffDay": true,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1413-09-13",
    "title": "روز صنعت بیمه",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1413-09-13",
    "title": "شب قدر (۲۲ رمضان)",
    "kind": "religious",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1413-09-15",
    "title": "روز حسابدار",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1413-09-19",
    "title": "روز جهانی حقوق بشر",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1413-09-20",
    "title": "روز جهانی کوهستان",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1413-09-22",
    "title": "عید سعید فطر (۱ شوال)",
    "kind": "religious",
    "isOffDay": true,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1413-09-23",
    "title": "تعطیل به مناسبت عید سعید فطر (۲ شوال)",
    "kind": "religious",
    "isOffDay": true,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1413-09-25",
    "title": "روز پژوهش و فناوری",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1413-09-30",
    "title": "جشن شب یلدا، شب چلّه",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1413-10-01",
    "title": "روز میلاد خورشید؛ جشن خرم روز، نخستین جشن دیگان",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1413-10-03",
    "title": "سالروز عملیات کربلای 4 [1365 خورشیدی]",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1413-10-04",
    "title": "جشن کریسمس",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1413-10-04",
    "title": "روز بزرگداشت دوستی",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1413-10-05",
    "title": "زمین لرزه ی بم [1382 خورشیدی]",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1413-10-05",
    "title": "سالروز شهادت اَشو زرتشت، اَبَراِنسان بزرگ تاریخ",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1413-10-08",
    "title": "دی به آذر روز، دومین جشن دیگان",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1413-10-09",
    "title": "اعدام میهن‌پرستان آذری در تبریز توسط قوای اشغالگر روس [1290 خورشیدی]",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1413-10-11",
    "title": "جشن آغاز سال نو میلادی",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1413-10-12",
    "title": "روز حافظ",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1413-10-13",
    "title": "شهادت سردار حاج قاسم سلیمانی [1398 خورشیدی]",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1413-10-15",
    "title": "دی به مهر روز، سومین جشن دیگان",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1413-10-16",
    "title": "شهادت امام جعفر صادق (ع) (۲۵ شوال)",
    "kind": "religious",
    "isOffDay": true,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1413-10-16",
    "title": "غرق شدن کشتی سانچی [1396 خورشیدی]",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1413-10-18",
    "title": "شلیک به پرواز 752 هواپیمایی اوکراین [1398 خورشیدی]",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1413-10-19",
    "title": "درگذشت اکبر هاشمی رفسنجانی [1395 خورشیدی]",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1413-10-20",
    "title": "قتل امیرکبیر به دستور ناصرالدین شاه قاجار [1230 خورشیدی]",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1413-10-22",
    "title": "ولادت حضرت معصومه (س)، روز دختران (۱ ذوالقعده)",
    "kind": "religious",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1413-10-23",
    "title": "دی به دین روز، چهارمین جشن دیگان",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1413-10-30",
    "title": "آتش‌سوزی و فروریختن ساختمان پلاسکو [1395 خورشیدی]",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1413-11-01",
    "title": "زادروز فردوسی",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1413-11-02",
    "title": "بهمن روز، جشن بهمنگان",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1413-11-02",
    "title": "ولادت امام رضا (ع) (۱۱ ذوالقعده)",
    "kind": "religious",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1413-11-06",
    "title": "بزرگداشت صفی‌الدین اُرمَوی و روز موسیقی ایرانی",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1413-11-10",
    "title": "جشن سده، گرامیداشتِ کشف آتش به دستِ هوشنگ شاه",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1413-11-12",
    "title": "بازگشت امام خمینی (ره) به ایران",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1413-11-15",
    "title": "جشن میانه زمستان",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1413-11-19",
    "title": "روز نیروی هوایی",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1413-11-20",
    "title": "شهادت امام محمد تقی (ع) (۳۰ ذوالقعده)",
    "kind": "religious",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1413-11-22",
    "title": "پیروزی انقلاب اسلامی",
    "kind": "official",
    "isOffDay": true,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1413-11-25",
    "title": "جشن ولنتاین",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1413-11-27",
    "title": "شهادت امام محمد باقر (ع) (۷ ذوالحجه)",
    "kind": "religious",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1413-11-29",
    "title": "جشن سپندارمذگان و روز عشق",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1413-11-29",
    "title": "روز عرفه (۹ ذوالحجه)",
    "kind": "religious",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1413-11-29",
    "title": "فاجعه انفجار قطار نیشابور [1382 خورشیدی]",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1413-11-30",
    "title": "عید سعید قربان (۱۰ ذوالحجه)",
    "kind": "religious",
    "isOffDay": true,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1413-12-05",
    "title": "روز بزرگداشت خواجه نصیر الدین طوسی و روز مهندس",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1413-12-05",
    "title": "ولادت امام علی النقی (ع) (۱۵ ذوالحجه)",
    "kind": "religious",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1413-12-07",
    "title": "سالروز استقلال کانون وکلای دادگستری و روز وکیل مدافع",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1413-12-08",
    "title": "عید سعید غدیر خم (۱۸ ذوالحجه)",
    "kind": "religious",
    "isOffDay": true,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1413-12-10",
    "title": "ولادت امام موسی کاظم (ع) (۲۰ ذوالحجه)",
    "kind": "religious",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1413-12-15",
    "title": "روز درختکاری",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1413-12-17",
    "title": "روز جهانی زنان",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1413-12-23",
    "title": "روز جهانی عدد پی π",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1413-12-25",
    "title": "پایان سرایش شاهنامه",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1413-12-25",
    "title": "روز بزرگداشت اختر چرخ ادب، پروین اعتصامی",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1413-12-29",
    "title": "روز ملی شدن صنعت نفت ایران",
    "kind": "official",
    "isOffDay": true,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1413-12-29",
    "title": "تاسوعای حسینی (۹ محرم)",
    "kind": "religious",
    "isOffDay": true,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1413-12-29",
    "title": "روز جهانی شادی",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1414-01-01",
    "title": "جشن نوروز/جشن سال نو",
    "kind": "official",
    "isOffDay": true,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1414-01-01",
    "title": "عاشورای حسینی (۱۰ محرم)",
    "kind": "religious",
    "isOffDay": true,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1414-01-01",
    "title": "روز جهانی نوروز",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1414-01-02",
    "title": "عید نوروز",
    "kind": "official",
    "isOffDay": true,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1414-01-03",
    "title": "عید نوروز",
    "kind": "official",
    "isOffDay": true,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1414-01-03",
    "title": "شهادت امام زین العابدین (ع) (۱۲ محرم)",
    "kind": "religious",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1414-01-03",
    "title": "روز جهانی هواشناسی",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1414-01-04",
    "title": "عید نوروز",
    "kind": "official",
    "isOffDay": true,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1414-01-06",
    "title": "روز امید، روز شادباش نویسی",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1414-01-06",
    "title": "زادروز اَشو زرتشت، اَبَراِنسان بزرگ تاریخ",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1414-01-07",
    "title": "روز جهانی تئاتر",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1414-01-10",
    "title": "جشن آبانگاه",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1414-01-12",
    "title": "روز جمهوری اسلامی",
    "kind": "official",
    "isOffDay": true,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1414-01-13",
    "title": "جشن سیزده به در",
    "kind": "official",
    "isOffDay": true,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1414-01-17",
    "title": "سروش روز،جشن سروشگان",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1414-01-18",
    "title": "روز جهانی بهداشت",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1414-01-19",
    "title": "فروردین روز،جشن فروردینگان",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1414-01-23",
    "title": "روز دندانپزشک",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1414-01-25",
    "title": "روز بزرگداشت عطار نیشابوری",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1414-01-29",
    "title": "روز ارتش جمهوری اسلامی ایران",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1414-01-30",
    "title": "روز علوم آزمایشگاهی، زاد روز حکیم سید اسماعیل جرجانی",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1414-02-01",
    "title": "روز بزرگداشت سعدی",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1414-02-02",
    "title": "جشن گیاه آوری؛ روز زمین",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1414-02-03",
    "title": "روز بزرگداشت شیخ بهایی؛ روز ملی کارآفرینی؛ روز معماری",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1414-02-06",
    "title": "فاجعه‌ی انفجارِ بندر عباس [ 1404 خورشیدی]",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1414-02-07",
    "title": "روز جهانی طراحی و گرافیک",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1414-02-09",
    "title": "اربعین حسینی (۲۰ صفر)",
    "kind": "religious",
    "isOffDay": true,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1414-02-09",
    "title": "روز ملی روانشناس و مشاور",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1414-02-10",
    "title": "جشن چهلم نوروز؛ روز ملی خلیج فارس",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1414-02-11",
    "title": "روز جهانی کارگر",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1414-02-12",
    "title": "روز معلم",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1414-02-15",
    "title": "جشن میانه بهار/جشن بهاربد؛ روز شیراز",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1414-02-15",
    "title": "روز جهانی ماما",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1414-02-17",
    "title": "رحلت رسول اکرم؛شهادت امام حسن مجتبی (ع) (۲۸ صفر)",
    "kind": "religious",
    "isOffDay": true,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1414-02-18",
    "title": "روز جهانی صلیب سرخ و هلال احمر",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1414-02-19",
    "title": "شهادت امام رضا (ع) (۳۰ صفر)",
    "kind": "religious",
    "isOffDay": true,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1414-02-20",
    "title": "هجرت پیامبر اکرم از مکه به مدینه (۱ ربیع الاول)",
    "kind": "religious",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1414-02-22",
    "title": "زادروز مریم میرزاخانی ریاضیدان ایرانی، روز جهانی زن در ریاضیات",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1414-02-22",
    "title": "روز جهانی پرستار",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1414-02-25",
    "title": "روز بزرگداشت فردوسی",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1414-02-27",
    "title": "روز ارتباطات و روابط عمومی",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1414-02-27",
    "title": "شهادت امام حسن عسکری (ع) (۸ ربیع الاول)",
    "kind": "religious",
    "isOffDay": true,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1414-02-28",
    "title": "روز بزرگداشت حکیم عمر خیام",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1414-02-28",
    "title": "روز جهانی موزه و میراث فرهنگی",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1414-02-31",
    "title": "میلاد رسول اکرم به روایت اهل سنت (۱۲ ربیع الاول)",
    "kind": "religious",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1414-03-01",
    "title": "روز بهره وری و بهینه سازی مصرف",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1414-03-01",
    "title": "روز بزرگداشت ملاصدرا",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1414-03-02",
    "title": "فروریختن ساختمان متروپل در آبادان",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1414-03-03",
    "title": "فتح خرمشهر در عملیات بیت المقدس و روز مقاومت، ایثار و پیروزی",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1414-03-04",
    "title": "روز دزفول، روز مقاومت و پایداری",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1414-03-05",
    "title": "میلاد رسول اکرم و امام جعفر صادق (ع) (۱۷ ربیع الاول)",
    "kind": "religious",
    "isOffDay": true,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1414-03-06",
    "title": "خرداد روز،جشن خردادگان",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1414-03-10",
    "title": "روز جهانی بدون دخانیات",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1414-03-14",
    "title": "رحلت حضرت امام خمینی",
    "kind": "official",
    "isOffDay": true,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1414-03-15",
    "title": "قیام 15 خرداد",
    "kind": "official",
    "isOffDay": true,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1414-03-15",
    "title": "روز جهانی محیط زیست",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1414-03-20",
    "title": "روز جهانی صنایع دستی",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1414-03-22",
    "title": "روز جهانی مبارزه با کار کودکان",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1414-03-24",
    "title": "روز جهانی اهدای خون",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1414-03-25",
    "title": "روز ملی گل وگیاه",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1414-03-25",
    "title": "ولادت امام حسن عسکری (ع) (۸ ربیع الثانی)",
    "kind": "religious",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1414-03-26",
    "title": "روز جهانی پدر",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1414-03-27",
    "title": "روز جهانی بیابان زدایی",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1414-03-27",
    "title": "وفات حضرت معصومه (س) (۱۰ ربیع الثانی)",
    "kind": "religious",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1414-03-31",
    "title": "سالروز زلزله رودبار و منجیل [1369خورشیدی]",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1414-04-01",
    "title": "جشن آب پاشونک، جشن آغاز تابستان",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1414-04-05",
    "title": "روز جهانی مبارزه با مواد مخدر",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1414-04-07",
    "title": "انفجار دفتر حزب جمهوری اسلامی؛ روز قوه قضاییه",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1414-04-08",
    "title": "روز مبارزه با سلاح های شیمیایی و میکروبی",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1414-04-10",
    "title": "روز صنعت و معدن",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1414-04-10",
    "title": "زادروز بابک خرمدین، سپه‌سالار دلاور ایران",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1414-04-10",
    "title": "روز بزرگداشت صائب تبریزی",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1414-04-12",
    "title": "شلیک به پرواز 655 ایران ایر توسط ناو وینسنس [ 1367 خورشیدی ]",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1414-04-14",
    "title": "روز قلم",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1414-04-15",
    "title": "جشن خام خواری",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1414-04-20",
    "title": "ولادت حضرت زینب (س) و روز پرستار و بهورز (۵ جمادی الاول)",
    "kind": "religious",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1414-04-25",
    "title": "روز بهزیستی و تامین اجتماعی",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1414-04-27",
    "title": "اعلام پذیرش قطعنامه 598 شورای امنیت از سوی ایران [ 1367 خورشیدی ]",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1414-05-07",
    "title": "اَمرداداَمرداد روز،جشن اَمردادگان",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1414-05-08",
    "title": "اَمردادروز بزرگداشت شیخ شهاب الدین سهروردی",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1414-05-10",
    "title": "اَمردادجشن چله تابستان",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1414-05-10",
    "title": "اَمردادآغاز هفته جهانی شیردهی",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1414-05-14",
    "title": "اَمردادسالروز صدور فرمان مشروطیت",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1414-05-17",
    "title": "اَمردادروز خبرنگار",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1414-05-17",
    "title": "اَمردادشهادت حضرت فاطمه زهرا (س) (۳ جمادی الثانیه)",
    "kind": "religious",
    "isOffDay": true,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1414-05-22",
    "title": "اَمردادروز جهانی چپ دست ها",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1414-05-28",
    "title": "اَمردادسالروز وقایع پس از برکناری محمد مصدق‌السلطنه",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1414-05-28",
    "title": "اَمردادسالروز فاجعه آتش زدن سینما رکس آبادان",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1414-05-28",
    "title": "اَمردادروز جهانی عکاسی",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1414-06-01",
    "title": "روز بزرگداشت ابوعلی سینا و روز پزشک",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1414-06-02",
    "title": "آغاز هفته دولت",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1414-06-03",
    "title": "ولادت حضرت فاطمه زهرا (س) و روز مادر (۲۰ جمادی الثانیه)",
    "kind": "religious",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1414-06-04",
    "title": "زادروز کوروش بزرگ",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1414-06-04",
    "title": "شهریور روز،جشن شهریورگان",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1414-06-05",
    "title": "روز بزرگداشت محمدبن زکریای رازی و روز داروساز",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1414-06-11",
    "title": "روز ملی صنعت چاپ",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1414-06-13",
    "title": "روز بزرگداشت ابوریحان بیرونی",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1414-06-13",
    "title": "ولادت امام محمد باقر (ع) (۱ رجب)",
    "kind": "religious",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1414-06-15",
    "title": "شهادت امام علی النقی (ع) (۳ رجب)",
    "kind": "religious",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1414-06-19",
    "title": "روز جهانی پیشگیری از خودکشی",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1414-06-20",
    "title": "حمله به برج‌های دوقلوی مرکز تجارت جهانی",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1414-06-21",
    "title": "روز سینما",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1414-06-22",
    "title": "ولادت امام محمد تقی (ع) (۱۰ رجب)",
    "kind": "religious",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1414-06-25",
    "title": "ولادت امام علی (ع) و روز پدر (۱۳ رجب)",
    "kind": "religious",
    "isOffDay": true,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1414-06-27",
    "title": "روز شعر و ادب پارسی و روز بزرگداشت استاد شهریار",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1414-06-27",
    "title": "وفات حضرت زینب (س) (۱۵ رجب)",
    "kind": "religious",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1414-06-30",
    "title": "روز جهانی صلح",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1414-06-31",
    "title": "آغاز هفته دفاع مقدس",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1414-07-01",
    "title": "آغاز حمله مغول به ایران در پاییز 598 خورشیدی",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1414-07-04",
    "title": "روز گرامیداشت سربازان وطن",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1414-07-05",
    "title": "روز جهانی جهانگردی",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1414-07-06",
    "title": "شهادت امام موسی کاظم (ع) (۲۵ رجب)",
    "kind": "religious",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1414-07-07",
    "title": "روز آتش نشانی و ایمنی",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1414-07-07",
    "title": "روز بزرگداشت شمس تبریزی",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1414-07-08",
    "title": "روز بزرگداشت مولوی",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1414-07-08",
    "title": "روز جهانی ناشنوایان",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1414-07-08",
    "title": "مبعث رسول اکرم (ص) (۲۷ رجب)",
    "kind": "religious",
    "isOffDay": true,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1414-07-08",
    "title": "روز جهانی ترجمه و مترجم",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1414-07-09",
    "title": "روز جهانی سالمندان",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1414-07-10",
    "title": "مهر روز،جشن مهرگان",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1414-07-12",
    "title": "آغاز هفته جهانی فضا",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1414-07-13",
    "title": "ولادت سالار شهیدان، امام حسین (ع) و روز پاسدار (۳ شعبان)",
    "kind": "religious",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1414-07-13",
    "title": "روز جهانی معلم",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1414-07-14",
    "title": "روز دامپزشکی",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1414-07-14",
    "title": "ولادت حضرت ابوالفضل العباس (ع) و روز جانباز (۴ شعبان)",
    "kind": "religious",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1414-07-15",
    "title": "ولادت امام زین العابدین (ع) (۵ شعبان)",
    "kind": "religious",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1414-07-16",
    "title": "روز ملی کودک",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1414-07-17",
    "title": "روز جهانی پست",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1414-07-18",
    "title": "روز جهانی مبارزه با حکم اعدام",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1414-07-19",
    "title": "روز جهانی دختر",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1414-07-20",
    "title": "روز بزرگداشت حافظ",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1414-07-21",
    "title": "روز پیروزی کاوه و فریدون بر ضحاک",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1414-07-21",
    "title": "ولادت حضرت علی اکبر (ع) و روز جوان (۱۱ شعبان)",
    "kind": "religious",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1414-07-22",
    "title": "روز جهانی استاندارد",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1414-07-23",
    "title": "روز جهانی عصای سفید",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1414-07-24",
    "title": "روز جهانی غذا",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1414-07-25",
    "title": "ولادت حضرت قائم عجل الله تعالی فرجه و جشن نیمه شعبان (۱۵ شعبان)",
    "kind": "religious",
    "isOffDay": true,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1414-07-25",
    "title": "روز جهانی ریشه کنی فقر",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1414-07-26",
    "title": "روز تربیت بدنی و ورزش",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1414-07-28",
    "title": "زادروز ستارخان ملقب به سردار ملی و از سرداران جنبش مشروطه ایران",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1414-07-29",
    "title": "روز ملی کوهنورد",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1414-08-01",
    "title": "روز آمار و برنامه ریزی",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1414-08-01",
    "title": "روز بزرگداشت ابوالفضل بیهقی، تاریخ‌نگار و نویسنده ایرانی",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1414-08-07",
    "title": "سالروز ورود کوروش بزرگ به بابل در سال 539 پیش از میلاد",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1414-08-08",
    "title": "روز ملی محیط بان",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1414-08-10",
    "title": "آبان روز، جشن آبانگان",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1414-08-14",
    "title": "روز ملّی مازندران",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1414-08-15",
    "title": "جشن میانه پاییز",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1414-08-18",
    "title": "روز ملی کیفیت",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1414-08-23",
    "title": "روز جهانی دیابت",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1414-08-24",
    "title": "روز کتاب و کتابخوانی",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1414-08-25",
    "title": "ولادت امام حسن مجتبی (ع) (۱۵ رمضان)",
    "kind": "religious",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1414-08-26",
    "title": "روز جهانی دانش آموز",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1414-08-28",
    "title": "شب قدر (۱۸ رمضان)",
    "kind": "religious",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1414-08-28",
    "title": "روز جهانی آقایان",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1414-08-29",
    "title": "ضربت خوردن حضرت علی (ع) (۱۹ رمضان)",
    "kind": "religious",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1414-08-29",
    "title": "روز جهانی کودک",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1414-09-01",
    "title": "آذر جشن",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1414-09-01",
    "title": "شهادت حضرت علی (ع) (۲۱ رمضان)",
    "kind": "religious",
    "isOffDay": true,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1414-09-02",
    "title": "شب قدر (۲۲ رمضان)",
    "kind": "religious",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1414-09-04",
    "title": "روز جهانی مبارزه با خشونت علیه زنان",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1414-09-05",
    "title": "روز بسیج مستضعفان",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1414-09-07",
    "title": "سالروز عملیات مروارید و روز نیروی دریایی ارتش",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1414-09-09",
    "title": "جشن آذرگان ،آذر روز",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1414-09-10",
    "title": "روز جهانی ایدز",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1414-09-11",
    "title": "عید سعید فطر (۱ شوال)",
    "kind": "religious",
    "isOffDay": true,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1414-09-12",
    "title": "روز جهانی معلولان (کم‌توانان)",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1414-09-12",
    "title": "تعطیل به مناسبت عید سعید فطر (۲ شوال)",
    "kind": "religious",
    "isOffDay": true,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1414-09-13",
    "title": "روز صنعت بیمه",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1414-09-15",
    "title": "روز حسابدار",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1414-09-19",
    "title": "روز جهانی حقوق بشر",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1414-09-20",
    "title": "روز جهانی کوهستان",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1414-09-25",
    "title": "روز پژوهش و فناوری",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1414-09-30",
    "title": "جشن شب یلدا، شب چلّه",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1414-10-01",
    "title": "روز میلاد خورشید؛ جشن خرم روز، نخستین جشن دیگان",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1414-10-03",
    "title": "سالروز عملیات کربلای 4 [1365 خورشیدی]",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1414-10-04",
    "title": "جشن کریسمس",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1414-10-04",
    "title": "روز بزرگداشت دوستی",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1414-10-05",
    "title": "زمین لرزه ی بم [1382 خورشیدی]",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1414-10-05",
    "title": "شهادت امام جعفر صادق (ع) (۲۵ شوال)",
    "kind": "religious",
    "isOffDay": true,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1414-10-05",
    "title": "سالروز شهادت اَشو زرتشت، اَبَراِنسان بزرگ تاریخ",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1414-10-08",
    "title": "دی به آذر روز، دومین جشن دیگان",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1414-10-09",
    "title": "اعدام میهن‌پرستان آذری در تبریز توسط قوای اشغالگر روس [1290 خورشیدی]",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1414-10-10",
    "title": "ولادت حضرت معصومه (س)، روز دختران (۱ ذوالقعده)",
    "kind": "religious",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1414-10-11",
    "title": "جشن آغاز سال نو میلادی",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1414-10-12",
    "title": "روز حافظ",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1414-10-13",
    "title": "شهادت سردار حاج قاسم سلیمانی [1398 خورشیدی]",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1414-10-15",
    "title": "دی به مهر روز، سومین جشن دیگان",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1414-10-16",
    "title": "غرق شدن کشتی سانچی [1396 خورشیدی]",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1414-10-18",
    "title": "شلیک به پرواز 752 هواپیمایی اوکراین [1398 خورشیدی]",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1414-10-19",
    "title": "درگذشت اکبر هاشمی رفسنجانی [1395 خورشیدی]",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1414-10-20",
    "title": "ولادت امام رضا (ع) (۱۱ ذوالقعده)",
    "kind": "religious",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1414-10-20",
    "title": "قتل امیرکبیر به دستور ناصرالدین شاه قاجار [1230 خورشیدی]",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1414-10-23",
    "title": "دی به دین روز، چهارمین جشن دیگان",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1414-10-30",
    "title": "آتش‌سوزی و فروریختن ساختمان پلاسکو [1395 خورشیدی]",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1414-11-01",
    "title": "زادروز فردوسی",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1414-11-02",
    "title": "بهمن روز، جشن بهمنگان",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1414-11-06",
    "title": "بزرگداشت صفی‌الدین اُرمَوی و روز موسیقی ایرانی",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1414-11-09",
    "title": "شهادت امام محمد تقی (ع) (۳۰ ذوالقعده)",
    "kind": "religious",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1414-11-10",
    "title": "جشن سده، گرامیداشتِ کشف آتش به دستِ هوشنگ شاه",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1414-11-12",
    "title": "بازگشت امام خمینی (ره) به ایران",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1414-11-15",
    "title": "جشن میانه زمستان",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1414-11-16",
    "title": "شهادت امام محمد باقر (ع) (۷ ذوالحجه)",
    "kind": "religious",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1414-11-18",
    "title": "روز عرفه (۹ ذوالحجه)",
    "kind": "religious",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1414-11-19",
    "title": "روز نیروی هوایی",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1414-11-19",
    "title": "عید سعید قربان (۱۰ ذوالحجه)",
    "kind": "religious",
    "isOffDay": true,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1414-11-22",
    "title": "پیروزی انقلاب اسلامی",
    "kind": "official",
    "isOffDay": true,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1414-11-24",
    "title": "ولادت امام علی النقی (ع) (۱۵ ذوالحجه)",
    "kind": "religious",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1414-11-25",
    "title": "جشن ولنتاین",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1414-11-27",
    "title": "عید سعید غدیر خم (۱۸ ذوالحجه)",
    "kind": "religious",
    "isOffDay": true,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1414-11-29",
    "title": "جشن سپندارمذگان و روز عشق",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1414-11-29",
    "title": "ولادت امام موسی کاظم (ع) (۲۰ ذوالحجه)",
    "kind": "religious",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1414-11-29",
    "title": "فاجعه انفجار قطار نیشابور [1382 خورشیدی]",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1414-12-05",
    "title": "روز بزرگداشت خواجه نصیر الدین طوسی و روز مهندس",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1414-12-07",
    "title": "سالروز استقلال کانون وکلای دادگستری و روز وکیل مدافع",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1414-12-15",
    "title": "روز درختکاری",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1414-12-18",
    "title": "تاسوعای حسینی (۹ محرم)",
    "kind": "religious",
    "isOffDay": true,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1414-12-18",
    "title": "روز جهانی زنان",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1414-12-19",
    "title": "عاشورای حسینی (۱۰ محرم)",
    "kind": "religious",
    "isOffDay": true,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1414-12-21",
    "title": "شهادت امام زین العابدین (ع) (۱۲ محرم)",
    "kind": "religious",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1414-12-24",
    "title": "روز جهانی عدد پی π",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1414-12-25",
    "title": "پایان سرایش شاهنامه",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1414-12-25",
    "title": "روز بزرگداشت اختر چرخ ادب، پروین اعتصامی",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1414-12-29",
    "title": "روز ملی شدن صنعت نفت ایران",
    "kind": "official",
    "isOffDay": true,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1415-01-01",
    "title": "جشن نوروز/جشن سال نو",
    "kind": "official",
    "isOffDay": true,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1415-01-01",
    "title": "روز جهانی شادی",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1415-01-02",
    "title": "عید نوروز",
    "kind": "official",
    "isOffDay": true,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1415-01-02",
    "title": "روز جهانی نوروز",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1415-01-03",
    "title": "عید نوروز",
    "kind": "official",
    "isOffDay": true,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1415-01-04",
    "title": "عید نوروز",
    "kind": "official",
    "isOffDay": true,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1415-01-04",
    "title": "روز جهانی هواشناسی",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1415-01-06",
    "title": "روز امید، روز شادباش نویسی",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1415-01-06",
    "title": "زادروز اَشو زرتشت، اَبَراِنسان بزرگ تاریخ",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1415-01-08",
    "title": "روز جهانی تئاتر",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1415-01-10",
    "title": "جشن آبانگاه",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1415-01-12",
    "title": "روز جمهوری اسلامی",
    "kind": "official",
    "isOffDay": true,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1415-01-13",
    "title": "جشن سیزده به در",
    "kind": "official",
    "isOffDay": true,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1415-01-17",
    "title": "سروش روز،جشن سروشگان",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1415-01-19",
    "title": "روز جهانی بهداشت",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1415-01-19",
    "title": "فروردین روز،جشن فروردینگان",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1415-01-23",
    "title": "روز دندانپزشک",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1415-01-25",
    "title": "روز بزرگداشت عطار نیشابوری",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1415-01-29",
    "title": "روز ارتش جمهوری اسلامی ایران",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1415-01-30",
    "title": "اربعین حسینی (۲۰ صفر)",
    "kind": "religious",
    "isOffDay": true,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1415-01-30",
    "title": "روز علوم آزمایشگاهی، زاد روز حکیم سید اسماعیل جرجانی",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1415-02-01",
    "title": "روز بزرگداشت سعدی",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1415-02-03",
    "title": "جشن گیاه آوری؛ روز زمین",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1415-02-03",
    "title": "روز بزرگداشت شیخ بهایی؛ روز ملی کارآفرینی؛ روز معماری",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1415-02-06",
    "title": "فاجعه‌ی انفجارِ بندر عباس [ 1404 خورشیدی]",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1415-02-07",
    "title": "رحلت رسول اکرم؛شهادت امام حسن مجتبی (ع) (۲۸ صفر)",
    "kind": "religious",
    "isOffDay": true,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1415-02-08",
    "title": "شهادت امام رضا (ع) (۳۰ صفر)",
    "kind": "religious",
    "isOffDay": true,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1415-02-08",
    "title": "روز جهانی طراحی و گرافیک",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1415-02-09",
    "title": "هجرت پیامبر اکرم از مکه به مدینه (۱ ربیع الاول)",
    "kind": "religious",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1415-02-09",
    "title": "روز ملی روانشناس و مشاور",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1415-02-10",
    "title": "جشن چهلم نوروز؛ روز ملی خلیج فارس",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1415-02-12",
    "title": "روز معلم",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1415-02-12",
    "title": "روز جهانی کارگر",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1415-02-15",
    "title": "جشن میانه بهار/جشن بهاربد؛ روز شیراز",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1415-02-16",
    "title": "شهادت امام حسن عسکری (ع) (۸ ربیع الاول)",
    "kind": "religious",
    "isOffDay": true,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1415-02-16",
    "title": "روز جهانی ماما",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1415-02-19",
    "title": "روز جهانی صلیب سرخ و هلال احمر",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1415-02-20",
    "title": "میلاد رسول اکرم به روایت اهل سنت (۱۲ ربیع الاول)",
    "kind": "religious",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1415-02-22",
    "title": "زادروز مریم میرزاخانی ریاضیدان ایرانی، روز جهانی زن در ریاضیات",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1415-02-23",
    "title": "روز جهانی پرستار",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1415-02-25",
    "title": "روز بزرگداشت فردوسی",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1415-02-25",
    "title": "میلاد رسول اکرم و امام جعفر صادق (ع) (۱۷ ربیع الاول)",
    "kind": "religious",
    "isOffDay": true,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1415-02-27",
    "title": "روز ارتباطات و روابط عمومی",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1415-02-28",
    "title": "روز بزرگداشت حکیم عمر خیام",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1415-02-29",
    "title": "روز جهانی موزه و میراث فرهنگی",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1415-03-01",
    "title": "روز بهره وری و بهینه سازی مصرف",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1415-03-01",
    "title": "روز بزرگداشت ملاصدرا",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1415-03-02",
    "title": "فروریختن ساختمان متروپل در آبادان",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1415-03-03",
    "title": "فتح خرمشهر در عملیات بیت المقدس و روز مقاومت، ایثار و پیروزی",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1415-03-04",
    "title": "روز دزفول، روز مقاومت و پایداری",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1415-03-06",
    "title": "خرداد روز،جشن خردادگان",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1415-03-11",
    "title": "روز جهانی بدون دخانیات",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1415-03-14",
    "title": "رحلت حضرت امام خمینی",
    "kind": "official",
    "isOffDay": true,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1415-03-15",
    "title": "قیام 15 خرداد",
    "kind": "official",
    "isOffDay": true,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1415-03-15",
    "title": "ولادت امام حسن عسکری (ع) (۸ ربیع الثانی)",
    "kind": "religious",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1415-03-16",
    "title": "روز جهانی محیط زیست",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1415-03-17",
    "title": "وفات حضرت معصومه (س) (۱۰ ربیع الثانی)",
    "kind": "religious",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1415-03-21",
    "title": "روز جهانی صنایع دستی",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1415-03-23",
    "title": "روز جهانی مبارزه با کار کودکان",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1415-03-25",
    "title": "روز ملی گل وگیاه",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1415-03-25",
    "title": "روز جهانی اهدای خون",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1415-03-27",
    "title": "روز جهانی پدر",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1415-03-28",
    "title": "روز جهانی بیابان زدایی",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1415-03-31",
    "title": "سالروز زلزله رودبار و منجیل [1369خورشیدی]",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1415-04-01",
    "title": "جشن آب پاشونک، جشن آغاز تابستان",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1415-04-06",
    "title": "روز جهانی مبارزه با مواد مخدر",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1415-04-07",
    "title": "انفجار دفتر حزب جمهوری اسلامی؛ روز قوه قضاییه",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1415-04-08",
    "title": "روز مبارزه با سلاح های شیمیایی و میکروبی",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1415-04-10",
    "title": "روز صنعت و معدن",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1415-04-10",
    "title": "ولادت حضرت زینب (س) و روز پرستار و بهورز (۵ جمادی الاول)",
    "kind": "religious",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1415-04-10",
    "title": "زادروز بابک خرمدین، سپه‌سالار دلاور ایران",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1415-04-10",
    "title": "روز بزرگداشت صائب تبریزی",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1415-04-12",
    "title": "شلیک به پرواز 655 ایران ایر توسط ناو وینسنس [ 1367 خورشیدی ]",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1415-04-14",
    "title": "روز قلم",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1415-04-15",
    "title": "جشن خام خواری",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1415-04-25",
    "title": "روز بهزیستی و تامین اجتماعی",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1415-04-27",
    "title": "اعلام پذیرش قطعنامه 598 شورای امنیت از سوی ایران [ 1367 خورشیدی ]",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1415-05-06",
    "title": "اَمردادشهادت حضرت فاطمه زهرا (س) (۳ جمادی الثانیه)",
    "kind": "religious",
    "isOffDay": true,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1415-05-07",
    "title": "اَمرداداَمرداد روز،جشن اَمردادگان",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1415-05-08",
    "title": "اَمردادروز بزرگداشت شیخ شهاب الدین سهروردی",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1415-05-10",
    "title": "اَمردادجشن چله تابستان",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1415-05-11",
    "title": "اَمردادآغاز هفته جهانی شیردهی",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1415-05-14",
    "title": "اَمردادسالروز صدور فرمان مشروطیت",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1415-05-17",
    "title": "اَمردادروز خبرنگار",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1415-05-23",
    "title": "اَمردادولادت حضرت فاطمه زهرا (س) و روز مادر (۲۰ جمادی الثانیه)",
    "kind": "religious",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1415-05-23",
    "title": "اَمردادروز جهانی چپ دست ها",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1415-05-28",
    "title": "اَمردادسالروز وقایع پس از برکناری محمد مصدق‌السلطنه",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1415-05-28",
    "title": "اَمردادسالروز فاجعه آتش زدن سینما رکس آبادان",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1415-05-29",
    "title": "اَمردادروز جهانی عکاسی",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1415-06-01",
    "title": "روز بزرگداشت ابوعلی سینا و روز پزشک",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1415-06-02",
    "title": "آغاز هفته دولت",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1415-06-03",
    "title": "ولادت امام محمد باقر (ع) (۱ رجب)",
    "kind": "religious",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1415-06-04",
    "title": "زادروز کوروش بزرگ",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1415-06-04",
    "title": "شهریور روز،جشن شهریورگان",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1415-06-05",
    "title": "روز بزرگداشت محمدبن زکریای رازی و روز داروساز",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1415-06-05",
    "title": "شهادت امام علی النقی (ع) (۳ رجب)",
    "kind": "religious",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1415-06-11",
    "title": "روز ملی صنعت چاپ",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1415-06-12",
    "title": "ولادت امام محمد تقی (ع) (۱۰ رجب)",
    "kind": "religious",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1415-06-13",
    "title": "روز بزرگداشت ابوریحان بیرونی",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1415-06-15",
    "title": "ولادت امام علی (ع) و روز پدر (۱۳ رجب)",
    "kind": "religious",
    "isOffDay": true,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1415-06-17",
    "title": "وفات حضرت زینب (س) (۱۵ رجب)",
    "kind": "religious",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1415-06-20",
    "title": "روز جهانی پیشگیری از خودکشی",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1415-06-21",
    "title": "روز سینما",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1415-06-21",
    "title": "حمله به برج‌های دوقلوی مرکز تجارت جهانی",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1415-06-27",
    "title": "روز شعر و ادب پارسی و روز بزرگداشت استاد شهریار",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1415-06-27",
    "title": "شهادت امام موسی کاظم (ع) (۲۵ رجب)",
    "kind": "religious",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1415-06-29",
    "title": "مبعث رسول اکرم (ص) (۲۷ رجب)",
    "kind": "religious",
    "isOffDay": true,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1415-06-31",
    "title": "آغاز هفته دفاع مقدس",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1415-06-31",
    "title": "روز جهانی صلح",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1415-07-01",
    "title": "آغاز حمله مغول به ایران در پاییز 598 خورشیدی",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1415-07-03",
    "title": "ولادت سالار شهیدان، امام حسین (ع) و روز پاسدار (۳ شعبان)",
    "kind": "religious",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1415-07-04",
    "title": "ولادت حضرت ابوالفضل العباس (ع) و روز جانباز (۴ شعبان)",
    "kind": "religious",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1415-07-04",
    "title": "روز گرامیداشت سربازان وطن",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1415-07-05",
    "title": "ولادت امام زین العابدین (ع) (۵ شعبان)",
    "kind": "religious",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1415-07-06",
    "title": "روز جهانی جهانگردی",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1415-07-07",
    "title": "روز آتش نشانی و ایمنی",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1415-07-07",
    "title": "روز بزرگداشت شمس تبریزی",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1415-07-08",
    "title": "روز بزرگداشت مولوی",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1415-07-09",
    "title": "روز جهانی ناشنوایان",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1415-07-09",
    "title": "روز جهانی ترجمه و مترجم",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1415-07-10",
    "title": "مهر روز،جشن مهرگان",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1415-07-10",
    "title": "روز جهانی سالمندان",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1415-07-11",
    "title": "ولادت حضرت علی اکبر (ع) و روز جوان (۱۱ شعبان)",
    "kind": "religious",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1415-07-13",
    "title": "آغاز هفته جهانی فضا",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1415-07-14",
    "title": "روز دامپزشکی",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1415-07-14",
    "title": "روز جهانی معلم",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1415-07-15",
    "title": "ولادت حضرت قائم عجل الله تعالی فرجه و جشن نیمه شعبان (۱۵ شعبان)",
    "kind": "religious",
    "isOffDay": true,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1415-07-16",
    "title": "روز ملی کودک",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1415-07-18",
    "title": "روز جهانی پست",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1415-07-19",
    "title": "روز جهانی مبارزه با حکم اعدام",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1415-07-20",
    "title": "روز بزرگداشت حافظ",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1415-07-20",
    "title": "روز جهانی دختر",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1415-07-21",
    "title": "روز پیروزی کاوه و فریدون بر ضحاک",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1415-07-23",
    "title": "روز جهانی استاندارد",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1415-07-24",
    "title": "روز جهانی عصای سفید",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1415-07-25",
    "title": "روز جهانی غذا",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1415-07-26",
    "title": "روز تربیت بدنی و ورزش",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1415-07-26",
    "title": "روز جهانی ریشه کنی فقر",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1415-07-28",
    "title": "زادروز ستارخان ملقب به سردار ملی و از سرداران جنبش مشروطه ایران",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1415-07-29",
    "title": "روز ملی کوهنورد",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1415-08-01",
    "title": "روز آمار و برنامه ریزی",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1415-08-01",
    "title": "روز بزرگداشت ابوالفضل بیهقی، تاریخ‌نگار و نویسنده ایرانی",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1415-08-07",
    "title": "سالروز ورود کوروش بزرگ به بابل در سال 539 پیش از میلاد",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1415-08-08",
    "title": "روز ملی محیط بان",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1415-08-10",
    "title": "آبان روز، جشن آبانگان",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1415-08-14",
    "title": "ولادت امام حسن مجتبی (ع) (۱۵ رمضان)",
    "kind": "religious",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1415-08-14",
    "title": "روز ملّی مازندران",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1415-08-15",
    "title": "جشن میانه پاییز",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1415-08-17",
    "title": "شب قدر (۱۸ رمضان)",
    "kind": "religious",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1415-08-18",
    "title": "روز ملی کیفیت",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1415-08-18",
    "title": "ضربت خوردن حضرت علی (ع) (۱۹ رمضان)",
    "kind": "religious",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1415-08-20",
    "title": "شهادت حضرت علی (ع) (۲۱ رمضان)",
    "kind": "religious",
    "isOffDay": true,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1415-08-21",
    "title": "شب قدر (۲۲ رمضان)",
    "kind": "religious",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1415-08-24",
    "title": "روز کتاب و کتابخوانی",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1415-08-24",
    "title": "روز جهانی دیابت",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1415-08-27",
    "title": "روز جهانی دانش آموز",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1415-08-29",
    "title": "روز جهانی آقایان",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1415-08-30",
    "title": "عید سعید فطر (۱ شوال)",
    "kind": "religious",
    "isOffDay": true,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1415-08-30",
    "title": "روز جهانی کودک",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1415-09-01",
    "title": "آذر جشن",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1415-09-01",
    "title": "تعطیل به مناسبت عید سعید فطر (۲ شوال)",
    "kind": "religious",
    "isOffDay": true,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1415-09-05",
    "title": "روز بسیج مستضعفان",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1415-09-05",
    "title": "روز جهانی مبارزه با خشونت علیه زنان",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1415-09-07",
    "title": "سالروز عملیات مروارید و روز نیروی دریایی ارتش",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1415-09-09",
    "title": "جشن آذرگان ،آذر روز",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1415-09-11",
    "title": "روز جهانی ایدز",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1415-09-13",
    "title": "روز صنعت بیمه",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1415-09-13",
    "title": "روز جهانی معلولان (کم‌توانان)",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1415-09-15",
    "title": "روز حسابدار",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1415-09-20",
    "title": "روز جهانی حقوق بشر",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1415-09-21",
    "title": "روز جهانی کوهستان",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1415-09-24",
    "title": "شهادت امام جعفر صادق (ع) (۲۵ شوال)",
    "kind": "religious",
    "isOffDay": true,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1415-09-25",
    "title": "روز پژوهش و فناوری",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1415-09-30",
    "title": "ولادت حضرت معصومه (س)، روز دختران (۱ ذوالقعده)",
    "kind": "religious",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1415-09-30",
    "title": "جشن شب یلدا، شب چلّه",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1415-10-01",
    "title": "روز میلاد خورشید؛ جشن خرم روز، نخستین جشن دیگان",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1415-10-03",
    "title": "سالروز عملیات کربلای 4 [1365 خورشیدی]",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1415-10-05",
    "title": "زمین لرزه ی بم [1382 خورشیدی]",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1415-10-05",
    "title": "جشن کریسمس",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1415-10-05",
    "title": "سالروز شهادت اَشو زرتشت، اَبَراِنسان بزرگ تاریخ",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1415-10-05",
    "title": "روز بزرگداشت دوستی",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1415-10-08",
    "title": "دی به آذر روز، دومین جشن دیگان",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1415-10-09",
    "title": "اعدام میهن‌پرستان آذری در تبریز توسط قوای اشغالگر روس [1290 خورشیدی]",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1415-10-10",
    "title": "ولادت امام رضا (ع) (۱۱ ذوالقعده)",
    "kind": "religious",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1415-10-12",
    "title": "جشن آغاز سال نو میلادی",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1415-10-12",
    "title": "روز حافظ",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1415-10-13",
    "title": "شهادت سردار حاج قاسم سلیمانی [1398 خورشیدی]",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1415-10-15",
    "title": "دی به مهر روز، سومین جشن دیگان",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1415-10-16",
    "title": "غرق شدن کشتی سانچی [1396 خورشیدی]",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1415-10-18",
    "title": "شلیک به پرواز 752 هواپیمایی اوکراین [1398 خورشیدی]",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1415-10-19",
    "title": "درگذشت اکبر هاشمی رفسنجانی [1395 خورشیدی]",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1415-10-20",
    "title": "قتل امیرکبیر به دستور ناصرالدین شاه قاجار [1230 خورشیدی]",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1415-10-23",
    "title": "دی به دین روز، چهارمین جشن دیگان",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1415-10-28",
    "title": "شهادت امام محمد تقی (ع) (۳۰ ذوالقعده)",
    "kind": "religious",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1415-10-30",
    "title": "آتش‌سوزی و فروریختن ساختمان پلاسکو [1395 خورشیدی]",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1415-11-01",
    "title": "زادروز فردوسی",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1415-11-02",
    "title": "بهمن روز، جشن بهمنگان",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1415-11-05",
    "title": "شهادت امام محمد باقر (ع) (۷ ذوالحجه)",
    "kind": "religious",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1415-11-06",
    "title": "بزرگداشت صفی‌الدین اُرمَوی و روز موسیقی ایرانی",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1415-11-07",
    "title": "روز عرفه (۹ ذوالحجه)",
    "kind": "religious",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1415-11-08",
    "title": "عید سعید قربان (۱۰ ذوالحجه)",
    "kind": "religious",
    "isOffDay": true,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1415-11-10",
    "title": "جشن سده، گرامیداشتِ کشف آتش به دستِ هوشنگ شاه",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1415-11-12",
    "title": "بازگشت امام خمینی (ره) به ایران",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1415-11-13",
    "title": "ولادت امام علی النقی (ع) (۱۵ ذوالحجه)",
    "kind": "religious",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1415-11-15",
    "title": "جشن میانه زمستان",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1415-11-16",
    "title": "عید سعید غدیر خم (۱۸ ذوالحجه)",
    "kind": "religious",
    "isOffDay": true,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1415-11-18",
    "title": "ولادت امام موسی کاظم (ع) (۲۰ ذوالحجه)",
    "kind": "religious",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1415-11-19",
    "title": "روز نیروی هوایی",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1415-11-22",
    "title": "پیروزی انقلاب اسلامی",
    "kind": "official",
    "isOffDay": true,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1415-11-26",
    "title": "جشن ولنتاین",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1415-11-29",
    "title": "جشن سپندارمذگان و روز عشق",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1415-11-29",
    "title": "فاجعه انفجار قطار نیشابور [1382 خورشیدی]",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1415-12-05",
    "title": "روز بزرگداشت خواجه نصیر الدین طوسی و روز مهندس",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1415-12-07",
    "title": "تاسوعای حسینی (۹ محرم)",
    "kind": "religious",
    "isOffDay": true,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1415-12-07",
    "title": "سالروز استقلال کانون وکلای دادگستری و روز وکیل مدافع",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1415-12-08",
    "title": "عاشورای حسینی (۱۰ محرم)",
    "kind": "religious",
    "isOffDay": true,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1415-12-10",
    "title": "شهادت امام زین العابدین (ع) (۱۲ محرم)",
    "kind": "religious",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1415-12-15",
    "title": "روز درختکاری",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1415-12-18",
    "title": "روز جهانی زنان",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1415-12-24",
    "title": "روز جهانی عدد پی π",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1415-12-25",
    "title": "پایان سرایش شاهنامه",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1415-12-25",
    "title": "روز بزرگداشت اختر چرخ ادب، پروین اعتصامی",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1415-12-29",
    "title": "روز ملی شدن صنعت نفت ایران",
    "kind": "official",
    "isOffDay": true,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1416-01-01",
    "title": "جشن نوروز/جشن سال نو",
    "kind": "official",
    "isOffDay": true,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1416-01-01",
    "title": "روز جهانی شادی",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1416-01-02",
    "title": "عید نوروز",
    "kind": "official",
    "isOffDay": true,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1416-01-02",
    "title": "روز جهانی نوروز",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1416-01-03",
    "title": "عید نوروز",
    "kind": "official",
    "isOffDay": true,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1416-01-04",
    "title": "عید نوروز",
    "kind": "official",
    "isOffDay": true,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1416-01-04",
    "title": "روز جهانی هواشناسی",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1416-01-06",
    "title": "روز امید، روز شادباش نویسی",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1416-01-06",
    "title": "زادروز اَشو زرتشت، اَبَراِنسان بزرگ تاریخ",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1416-01-08",
    "title": "روز جهانی تئاتر",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1416-01-10",
    "title": "جشن آبانگاه",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1416-01-12",
    "title": "روز جمهوری اسلامی",
    "kind": "official",
    "isOffDay": true,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1416-01-13",
    "title": "جشن سیزده به در",
    "kind": "official",
    "isOffDay": true,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1416-01-17",
    "title": "سروش روز،جشن سروشگان",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1416-01-19",
    "title": "روز جهانی بهداشت",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1416-01-19",
    "title": "فروردین روز،جشن فروردینگان",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1416-01-19",
    "title": "اربعین حسینی (۲۰ صفر)",
    "kind": "religious",
    "isOffDay": true,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1416-01-23",
    "title": "روز دندانپزشک",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1416-01-25",
    "title": "روز بزرگداشت عطار نیشابوری",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1416-01-27",
    "title": "رحلت رسول اکرم؛شهادت امام حسن مجتبی (ع) (۲۸ صفر)",
    "kind": "religious",
    "isOffDay": true,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1416-01-29",
    "title": "روز ارتش جمهوری اسلامی ایران",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1416-01-29",
    "title": "شهادت امام رضا (ع) (۳۰ صفر)",
    "kind": "religious",
    "isOffDay": true,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1416-01-30",
    "title": "هجرت پیامبر اکرم از مکه به مدینه (۱ ربیع الاول)",
    "kind": "religious",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1416-01-30",
    "title": "روز علوم آزمایشگاهی، زاد روز حکیم سید اسماعیل جرجانی",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1416-02-01",
    "title": "روز بزرگداشت سعدی",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1416-02-03",
    "title": "جشن گیاه آوری؛ روز زمین",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1416-02-03",
    "title": "روز بزرگداشت شیخ بهایی؛ روز ملی کارآفرینی؛ روز معماری",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1416-02-06",
    "title": "شهادت امام حسن عسکری (ع) (۸ ربیع الاول)",
    "kind": "religious",
    "isOffDay": true,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1416-02-06",
    "title": "فاجعه‌ی انفجارِ بندر عباس [ 1404 خورشیدی]",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1416-02-08",
    "title": "روز جهانی طراحی و گرافیک",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1416-02-09",
    "title": "روز ملی روانشناس و مشاور",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1416-02-10",
    "title": "جشن چهلم نوروز؛ روز ملی خلیج فارس",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1416-02-10",
    "title": "میلاد رسول اکرم به روایت اهل سنت (۱۲ ربیع الاول)",
    "kind": "religious",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1416-02-12",
    "title": "روز معلم",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1416-02-12",
    "title": "روز جهانی کارگر",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1416-02-15",
    "title": "جشن میانه بهار/جشن بهاربد؛ روز شیراز",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1416-02-15",
    "title": "میلاد رسول اکرم و امام جعفر صادق (ع) (۱۷ ربیع الاول)",
    "kind": "religious",
    "isOffDay": true,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1416-02-16",
    "title": "روز جهانی ماما",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1416-02-19",
    "title": "روز جهانی صلیب سرخ و هلال احمر",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1416-02-22",
    "title": "زادروز مریم میرزاخانی ریاضیدان ایرانی، روز جهانی زن در ریاضیات",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1416-02-23",
    "title": "روز جهانی پرستار",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1416-02-25",
    "title": "روز بزرگداشت فردوسی",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1416-02-27",
    "title": "روز ارتباطات و روابط عمومی",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1416-02-28",
    "title": "روز بزرگداشت حکیم عمر خیام",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1416-02-29",
    "title": "روز جهانی موزه و میراث فرهنگی",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1416-03-01",
    "title": "روز بهره وری و بهینه سازی مصرف",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1416-03-01",
    "title": "روز بزرگداشت ملاصدرا",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1416-03-02",
    "title": "فروریختن ساختمان متروپل در آبادان",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1416-03-03",
    "title": "فتح خرمشهر در عملیات بیت المقدس و روز مقاومت، ایثار و پیروزی",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1416-03-04",
    "title": "ولادت امام حسن عسکری (ع) (۸ ربیع الثانی)",
    "kind": "religious",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1416-03-04",
    "title": "روز دزفول، روز مقاومت و پایداری",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1416-03-06",
    "title": "خرداد روز،جشن خردادگان",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1416-03-06",
    "title": "وفات حضرت معصومه (س) (۱۰ ربیع الثانی)",
    "kind": "religious",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1416-03-11",
    "title": "روز جهانی بدون دخانیات",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1416-03-14",
    "title": "رحلت حضرت امام خمینی",
    "kind": "official",
    "isOffDay": true,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1416-03-15",
    "title": "قیام 15 خرداد",
    "kind": "official",
    "isOffDay": true,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1416-03-16",
    "title": "روز جهانی محیط زیست",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1416-03-21",
    "title": "روز جهانی صنایع دستی",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1416-03-23",
    "title": "روز جهانی مبارزه با کار کودکان",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1416-03-25",
    "title": "روز ملی گل وگیاه",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1416-03-25",
    "title": "روز جهانی اهدای خون",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1416-03-27",
    "title": "روز جهانی پدر",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1416-03-28",
    "title": "روز جهانی بیابان زدایی",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1416-03-31",
    "title": "ولادت حضرت زینب (س) و روز پرستار و بهورز (۵ جمادی الاول)",
    "kind": "religious",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1416-03-31",
    "title": "سالروز زلزله رودبار و منجیل [1369خورشیدی]",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1416-04-01",
    "title": "جشن آب پاشونک، جشن آغاز تابستان",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1416-04-06",
    "title": "روز جهانی مبارزه با مواد مخدر",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1416-04-07",
    "title": "انفجار دفتر حزب جمهوری اسلامی؛ روز قوه قضاییه",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1416-04-08",
    "title": "روز مبارزه با سلاح های شیمیایی و میکروبی",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1416-04-10",
    "title": "روز صنعت و معدن",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1416-04-10",
    "title": "زادروز بابک خرمدین، سپه‌سالار دلاور ایران",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1416-04-10",
    "title": "روز بزرگداشت صائب تبریزی",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1416-04-12",
    "title": "شلیک به پرواز 655 ایران ایر توسط ناو وینسنس [ 1367 خورشیدی ]",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1416-04-14",
    "title": "روز قلم",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1416-04-15",
    "title": "جشن خام خواری",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1416-04-25",
    "title": "روز بهزیستی و تامین اجتماعی",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1416-04-27",
    "title": "اعلام پذیرش قطعنامه 598 شورای امنیت از سوی ایران [ 1367 خورشیدی ]",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1416-04-27",
    "title": "شهادت حضرت فاطمه زهرا (س) (۳ جمادی الثانیه)",
    "kind": "religious",
    "isOffDay": true,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1416-05-07",
    "title": "اَمرداداَمرداد روز،جشن اَمردادگان",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1416-05-08",
    "title": "اَمردادروز بزرگداشت شیخ شهاب الدین سهروردی",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1416-05-10",
    "title": "اَمردادجشن چله تابستان",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1416-05-11",
    "title": "اَمردادآغاز هفته جهانی شیردهی",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1416-05-13",
    "title": "اَمردادولادت حضرت فاطمه زهرا (س) و روز مادر (۲۰ جمادی الثانیه)",
    "kind": "religious",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1416-05-14",
    "title": "اَمردادسالروز صدور فرمان مشروطیت",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1416-05-17",
    "title": "اَمردادروز خبرنگار",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1416-05-23",
    "title": "اَمردادولادت امام محمد باقر (ع) (۱ رجب)",
    "kind": "religious",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1416-05-23",
    "title": "اَمردادروز جهانی چپ دست ها",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1416-05-25",
    "title": "اَمردادشهادت امام علی النقی (ع) (۳ رجب)",
    "kind": "religious",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1416-05-28",
    "title": "اَمردادسالروز وقایع پس از برکناری محمد مصدق‌السلطنه",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1416-05-28",
    "title": "اَمردادسالروز فاجعه آتش زدن سینما رکس آبادان",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1416-05-29",
    "title": "اَمردادروز جهانی عکاسی",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1416-06-01",
    "title": "روز بزرگداشت ابوعلی سینا و روز پزشک",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1416-06-01",
    "title": "ولادت امام محمد تقی (ع) (۱۰ رجب)",
    "kind": "religious",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1416-06-02",
    "title": "آغاز هفته دولت",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1416-06-04",
    "title": "زادروز کوروش بزرگ",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1416-06-04",
    "title": "شهریور روز،جشن شهریورگان",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1416-06-04",
    "title": "ولادت امام علی (ع) و روز پدر (۱۳ رجب)",
    "kind": "religious",
    "isOffDay": true,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1416-06-05",
    "title": "روز بزرگداشت محمدبن زکریای رازی و روز داروساز",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1416-06-06",
    "title": "وفات حضرت زینب (س) (۱۵ رجب)",
    "kind": "religious",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1416-06-11",
    "title": "روز ملی صنعت چاپ",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1416-06-13",
    "title": "روز بزرگداشت ابوریحان بیرونی",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1416-06-16",
    "title": "شهادت امام موسی کاظم (ع) (۲۵ رجب)",
    "kind": "religious",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1416-06-18",
    "title": "مبعث رسول اکرم (ص) (۲۷ رجب)",
    "kind": "religious",
    "isOffDay": true,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1416-06-20",
    "title": "روز جهانی پیشگیری از خودکشی",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1416-06-21",
    "title": "روز سینما",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1416-06-21",
    "title": "حمله به برج‌های دوقلوی مرکز تجارت جهانی",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1416-06-24",
    "title": "ولادت سالار شهیدان، امام حسین (ع) و روز پاسدار (۳ شعبان)",
    "kind": "religious",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1416-06-25",
    "title": "ولادت حضرت ابوالفضل العباس (ع) و روز جانباز (۴ شعبان)",
    "kind": "religious",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1416-06-26",
    "title": "ولادت امام زین العابدین (ع) (۵ شعبان)",
    "kind": "religious",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1416-06-27",
    "title": "روز شعر و ادب پارسی و روز بزرگداشت استاد شهریار",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1416-06-31",
    "title": "آغاز هفته دفاع مقدس",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1416-06-31",
    "title": "روز جهانی صلح",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1416-07-01",
    "title": "ولادت حضرت علی اکبر (ع) و روز جوان (۱۱ شعبان)",
    "kind": "religious",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1416-07-01",
    "title": "آغاز حمله مغول به ایران در پاییز 598 خورشیدی",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1416-07-04",
    "title": "روز گرامیداشت سربازان وطن",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1416-07-05",
    "title": "ولادت حضرت قائم عجل الله تعالی فرجه و جشن نیمه شعبان (۱۵ شعبان)",
    "kind": "religious",
    "isOffDay": true,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1416-07-06",
    "title": "روز جهانی جهانگردی",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1416-07-07",
    "title": "روز آتش نشانی و ایمنی",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1416-07-07",
    "title": "روز بزرگداشت شمس تبریزی",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1416-07-08",
    "title": "روز بزرگداشت مولوی",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1416-07-09",
    "title": "روز جهانی ناشنوایان",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1416-07-09",
    "title": "روز جهانی ترجمه و مترجم",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1416-07-10",
    "title": "مهر روز،جشن مهرگان",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1416-07-10",
    "title": "روز جهانی سالمندان",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1416-07-13",
    "title": "آغاز هفته جهانی فضا",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1416-07-14",
    "title": "روز دامپزشکی",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1416-07-14",
    "title": "روز جهانی معلم",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1416-07-16",
    "title": "روز ملی کودک",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1416-07-18",
    "title": "روز جهانی پست",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1416-07-19",
    "title": "روز جهانی مبارزه با حکم اعدام",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1416-07-20",
    "title": "روز بزرگداشت حافظ",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1416-07-20",
    "title": "روز جهانی دختر",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1416-07-21",
    "title": "روز پیروزی کاوه و فریدون بر ضحاک",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1416-07-23",
    "title": "روز جهانی استاندارد",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1416-07-24",
    "title": "روز جهانی عصای سفید",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1416-07-25",
    "title": "روز جهانی غذا",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1416-07-26",
    "title": "روز تربیت بدنی و ورزش",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1416-07-26",
    "title": "روز جهانی ریشه کنی فقر",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1416-07-28",
    "title": "زادروز ستارخان ملقب به سردار ملی و از سرداران جنبش مشروطه ایران",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1416-07-29",
    "title": "روز ملی کوهنورد",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1416-08-01",
    "title": "روز آمار و برنامه ریزی",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1416-08-01",
    "title": "روز بزرگداشت ابوالفضل بیهقی، تاریخ‌نگار و نویسنده ایرانی",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1416-08-04",
    "title": "ولادت امام حسن مجتبی (ع) (۱۵ رمضان)",
    "kind": "religious",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1416-08-07",
    "title": "شب قدر (۱۸ رمضان)",
    "kind": "religious",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1416-08-07",
    "title": "سالروز ورود کوروش بزرگ به بابل در سال 539 پیش از میلاد",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1416-08-08",
    "title": "ضربت خوردن حضرت علی (ع) (۱۹ رمضان)",
    "kind": "religious",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1416-08-08",
    "title": "روز ملی محیط بان",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1416-08-10",
    "title": "آبان روز، جشن آبانگان",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1416-08-10",
    "title": "شهادت حضرت علی (ع) (۲۱ رمضان)",
    "kind": "religious",
    "isOffDay": true,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1416-08-11",
    "title": "شب قدر (۲۲ رمضان)",
    "kind": "religious",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1416-08-14",
    "title": "روز ملّی مازندران",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1416-08-15",
    "title": "جشن میانه پاییز",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1416-08-18",
    "title": "روز ملی کیفیت",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1416-08-19",
    "title": "عید سعید فطر (۱ شوال)",
    "kind": "religious",
    "isOffDay": true,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1416-08-20",
    "title": "تعطیل به مناسبت عید سعید فطر (۲ شوال)",
    "kind": "religious",
    "isOffDay": true,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1416-08-24",
    "title": "روز کتاب و کتابخوانی",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1416-08-24",
    "title": "روز جهانی دیابت",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1416-08-27",
    "title": "روز جهانی دانش آموز",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1416-08-29",
    "title": "روز جهانی آقایان",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1416-08-30",
    "title": "روز جهانی کودک",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1416-09-01",
    "title": "آذر جشن",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1416-09-05",
    "title": "روز بسیج مستضعفان",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1416-09-05",
    "title": "روز جهانی مبارزه با خشونت علیه زنان",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1416-09-07",
    "title": "سالروز عملیات مروارید و روز نیروی دریایی ارتش",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1416-09-09",
    "title": "جشن آذرگان ،آذر روز",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1416-09-11",
    "title": "روز جهانی ایدز",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1416-09-13",
    "title": "روز صنعت بیمه",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1416-09-13",
    "title": "روز جهانی معلولان (کم‌توانان)",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1416-09-13",
    "title": "شهادت امام جعفر صادق (ع) (۲۵ شوال)",
    "kind": "religious",
    "isOffDay": true,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1416-09-15",
    "title": "روز حسابدار",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1416-09-19",
    "title": "ولادت حضرت معصومه (س)، روز دختران (۱ ذوالقعده)",
    "kind": "religious",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1416-09-20",
    "title": "روز جهانی حقوق بشر",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1416-09-21",
    "title": "روز جهانی کوهستان",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1416-09-25",
    "title": "روز پژوهش و فناوری",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1416-09-29",
    "title": "ولادت امام رضا (ع) (۱۱ ذوالقعده)",
    "kind": "religious",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1416-09-30",
    "title": "جشن شب یلدا، شب چلّه",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1416-10-01",
    "title": "روز میلاد خورشید؛ جشن خرم روز، نخستین جشن دیگان",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1416-10-03",
    "title": "سالروز عملیات کربلای 4 [1365 خورشیدی]",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1416-10-05",
    "title": "زمین لرزه ی بم [1382 خورشیدی]",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1416-10-05",
    "title": "جشن کریسمس",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1416-10-05",
    "title": "سالروز شهادت اَشو زرتشت، اَبَراِنسان بزرگ تاریخ",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1416-10-05",
    "title": "روز بزرگداشت دوستی",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1416-10-08",
    "title": "دی به آذر روز، دومین جشن دیگان",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1416-10-09",
    "title": "اعدام میهن‌پرستان آذری در تبریز توسط قوای اشغالگر روس [1290 خورشیدی]",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1416-10-12",
    "title": "جشن آغاز سال نو میلادی",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1416-10-12",
    "title": "روز حافظ",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1416-10-13",
    "title": "شهادت سردار حاج قاسم سلیمانی [1398 خورشیدی]",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1416-10-15",
    "title": "دی به مهر روز، سومین جشن دیگان",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1416-10-16",
    "title": "غرق شدن کشتی سانچی [1396 خورشیدی]",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1416-10-18",
    "title": "شهادت امام محمد تقی (ع) (۳۰ ذوالقعده)",
    "kind": "religious",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1416-10-18",
    "title": "شلیک به پرواز 752 هواپیمایی اوکراین [1398 خورشیدی]",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1416-10-19",
    "title": "درگذشت اکبر هاشمی رفسنجانی [1395 خورشیدی]",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1416-10-20",
    "title": "قتل امیرکبیر به دستور ناصرالدین شاه قاجار [1230 خورشیدی]",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1416-10-23",
    "title": "دی به دین روز، چهارمین جشن دیگان",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1416-10-25",
    "title": "شهادت امام محمد باقر (ع) (۷ ذوالحجه)",
    "kind": "religious",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1416-10-27",
    "title": "روز عرفه (۹ ذوالحجه)",
    "kind": "religious",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1416-10-28",
    "title": "عید سعید قربان (۱۰ ذوالحجه)",
    "kind": "religious",
    "isOffDay": true,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1416-10-30",
    "title": "آتش‌سوزی و فروریختن ساختمان پلاسکو [1395 خورشیدی]",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1416-11-01",
    "title": "زادروز فردوسی",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1416-11-02",
    "title": "بهمن روز، جشن بهمنگان",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1416-11-03",
    "title": "ولادت امام علی النقی (ع) (۱۵ ذوالحجه)",
    "kind": "religious",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1416-11-06",
    "title": "عید سعید غدیر خم (۱۸ ذوالحجه)",
    "kind": "religious",
    "isOffDay": true,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1416-11-06",
    "title": "بزرگداشت صفی‌الدین اُرمَوی و روز موسیقی ایرانی",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1416-11-08",
    "title": "ولادت امام موسی کاظم (ع) (۲۰ ذوالحجه)",
    "kind": "religious",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1416-11-10",
    "title": "جشن سده، گرامیداشتِ کشف آتش به دستِ هوشنگ شاه",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1416-11-12",
    "title": "بازگشت امام خمینی (ره) به ایران",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1416-11-15",
    "title": "جشن میانه زمستان",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1416-11-19",
    "title": "روز نیروی هوایی",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1416-11-22",
    "title": "پیروزی انقلاب اسلامی",
    "kind": "official",
    "isOffDay": true,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1416-11-26",
    "title": "تاسوعای حسینی (۹ محرم)",
    "kind": "religious",
    "isOffDay": true,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1416-11-26",
    "title": "جشن ولنتاین",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1416-11-27",
    "title": "عاشورای حسینی (۱۰ محرم)",
    "kind": "religious",
    "isOffDay": true,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1416-11-29",
    "title": "جشن سپندارمذگان و روز عشق",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1416-11-29",
    "title": "شهادت امام زین العابدین (ع) (۱۲ محرم)",
    "kind": "religious",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1416-11-29",
    "title": "فاجعه انفجار قطار نیشابور [1382 خورشیدی]",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1416-12-05",
    "title": "روز بزرگداشت خواجه نصیر الدین طوسی و روز مهندس",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1416-12-07",
    "title": "سالروز استقلال کانون وکلای دادگستری و روز وکیل مدافع",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1416-12-15",
    "title": "روز درختکاری",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1416-12-18",
    "title": "روز جهانی زنان",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1416-12-24",
    "title": "روز جهانی عدد پی π",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1416-12-25",
    "title": "پایان سرایش شاهنامه",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1416-12-25",
    "title": "روز بزرگداشت اختر چرخ ادب، پروین اعتصامی",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1416-12-29",
    "title": "روز ملی شدن صنعت نفت ایران",
    "kind": "official",
    "isOffDay": true,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1416-12-30",
    "title": "آخرین روز سال",
    "kind": "official",
    "isOffDay": true,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1416-12-30",
    "title": "روز جهانی شادی",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1417-01-01",
    "title": "جشن نوروز/جشن سال نو",
    "kind": "official",
    "isOffDay": true,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1417-01-01",
    "title": "روز جهانی نوروز",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1417-01-02",
    "title": "عید نوروز",
    "kind": "official",
    "isOffDay": true,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1417-01-03",
    "title": "عید نوروز",
    "kind": "official",
    "isOffDay": true,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1417-01-03",
    "title": "روز جهانی هواشناسی",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1417-01-04",
    "title": "عید نوروز",
    "kind": "official",
    "isOffDay": true,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1417-01-06",
    "title": "روز امید، روز شادباش نویسی",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1417-01-06",
    "title": "زادروز اَشو زرتشت، اَبَراِنسان بزرگ تاریخ",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1417-01-07",
    "title": "اربعین حسینی (۲۰ صفر)",
    "kind": "religious",
    "isOffDay": true,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1417-01-07",
    "title": "روز جهانی تئاتر",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1417-01-10",
    "title": "جشن آبانگاه",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1417-01-12",
    "title": "روز جمهوری اسلامی",
    "kind": "official",
    "isOffDay": true,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1417-01-13",
    "title": "جشن سیزده به در",
    "kind": "official",
    "isOffDay": true,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1417-01-15",
    "title": "رحلت رسول اکرم؛شهادت امام حسن مجتبی (ع) (۲۸ صفر)",
    "kind": "religious",
    "isOffDay": true,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1417-01-17",
    "title": "سروش روز،جشن سروشگان",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1417-01-17",
    "title": "شهادت امام رضا (ع) (۳۰ صفر)",
    "kind": "religious",
    "isOffDay": true,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1417-01-18",
    "title": "روز جهانی بهداشت",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1417-01-18",
    "title": "هجرت پیامبر اکرم از مکه به مدینه (۱ ربیع الاول)",
    "kind": "religious",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1417-01-19",
    "title": "فروردین روز،جشن فروردینگان",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1417-01-23",
    "title": "روز دندانپزشک",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1417-01-25",
    "title": "روز بزرگداشت عطار نیشابوری",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1417-01-25",
    "title": "شهادت امام حسن عسکری (ع) (۸ ربیع الاول)",
    "kind": "religious",
    "isOffDay": true,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1417-01-29",
    "title": "روز ارتش جمهوری اسلامی ایران",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1417-01-29",
    "title": "میلاد رسول اکرم به روایت اهل سنت (۱۲ ربیع الاول)",
    "kind": "religious",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1417-01-30",
    "title": "روز علوم آزمایشگاهی، زاد روز حکیم سید اسماعیل جرجانی",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1417-02-01",
    "title": "روز بزرگداشت سعدی",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1417-02-02",
    "title": "جشن گیاه آوری؛ روز زمین",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1417-02-03",
    "title": "روز بزرگداشت شیخ بهایی؛ روز ملی کارآفرینی؛ روز معماری",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1417-02-03",
    "title": "میلاد رسول اکرم و امام جعفر صادق (ع) (۱۷ ربیع الاول)",
    "kind": "religious",
    "isOffDay": true,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1417-02-06",
    "title": "فاجعه‌ی انفجارِ بندر عباس [ 1404 خورشیدی]",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1417-02-07",
    "title": "روز جهانی طراحی و گرافیک",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1417-02-09",
    "title": "روز ملی روانشناس و مشاور",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1417-02-10",
    "title": "جشن چهلم نوروز؛ روز ملی خلیج فارس",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1417-02-11",
    "title": "روز جهانی کارگر",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1417-02-12",
    "title": "روز معلم",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1417-02-15",
    "title": "جشن میانه بهار/جشن بهاربد؛ روز شیراز",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1417-02-15",
    "title": "روز جهانی ماما",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1417-02-18",
    "title": "روز جهانی صلیب سرخ و هلال احمر",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1417-02-22",
    "title": "زادروز مریم میرزاخانی ریاضیدان ایرانی، روز جهانی زن در ریاضیات",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1417-02-22",
    "title": "روز جهانی پرستار",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1417-02-23",
    "title": "ولادت امام حسن عسکری (ع) (۸ ربیع الثانی)",
    "kind": "religious",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1417-02-25",
    "title": "روز بزرگداشت فردوسی",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1417-02-25",
    "title": "وفات حضرت معصومه (س) (۱۰ ربیع الثانی)",
    "kind": "religious",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1417-02-27",
    "title": "روز ارتباطات و روابط عمومی",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1417-02-28",
    "title": "روز بزرگداشت حکیم عمر خیام",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1417-02-28",
    "title": "روز جهانی موزه و میراث فرهنگی",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1417-03-01",
    "title": "روز بهره وری و بهینه سازی مصرف",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1417-03-01",
    "title": "روز بزرگداشت ملاصدرا",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1417-03-02",
    "title": "فروریختن ساختمان متروپل در آبادان",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1417-03-03",
    "title": "فتح خرمشهر در عملیات بیت المقدس و روز مقاومت، ایثار و پیروزی",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1417-03-04",
    "title": "روز دزفول، روز مقاومت و پایداری",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1417-03-06",
    "title": "خرداد روز،جشن خردادگان",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1417-03-10",
    "title": "روز جهانی بدون دخانیات",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1417-03-14",
    "title": "رحلت حضرت امام خمینی",
    "kind": "official",
    "isOffDay": true,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1417-03-15",
    "title": "قیام 15 خرداد",
    "kind": "official",
    "isOffDay": true,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1417-03-15",
    "title": "روز جهانی محیط زیست",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1417-03-19",
    "title": "ولادت حضرت زینب (س) و روز پرستار و بهورز (۵ جمادی الاول)",
    "kind": "religious",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1417-03-20",
    "title": "روز جهانی صنایع دستی",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1417-03-22",
    "title": "روز جهانی مبارزه با کار کودکان",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1417-03-24",
    "title": "روز جهانی اهدای خون",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1417-03-25",
    "title": "روز ملی گل وگیاه",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1417-03-26",
    "title": "روز جهانی پدر",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1417-03-27",
    "title": "روز جهانی بیابان زدایی",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1417-03-31",
    "title": "سالروز زلزله رودبار و منجیل [1369خورشیدی]",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1417-04-01",
    "title": "جشن آب پاشونک، جشن آغاز تابستان",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1417-04-05",
    "title": "روز جهانی مبارزه با مواد مخدر",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1417-04-07",
    "title": "انفجار دفتر حزب جمهوری اسلامی؛ روز قوه قضاییه",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1417-04-08",
    "title": "روز مبارزه با سلاح های شیمیایی و میکروبی",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1417-04-10",
    "title": "روز صنعت و معدن",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1417-04-10",
    "title": "زادروز بابک خرمدین، سپه‌سالار دلاور ایران",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1417-04-10",
    "title": "روز بزرگداشت صائب تبریزی",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1417-04-12",
    "title": "شلیک به پرواز 655 ایران ایر توسط ناو وینسنس [ 1367 خورشیدی ]",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1417-04-14",
    "title": "روز قلم",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1417-04-15",
    "title": "جشن خام خواری",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1417-04-15",
    "title": "شهادت حضرت فاطمه زهرا (س) (۳ جمادی الثانیه)",
    "kind": "religious",
    "isOffDay": true,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1417-04-25",
    "title": "روز بهزیستی و تامین اجتماعی",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1417-04-27",
    "title": "اعلام پذیرش قطعنامه 598 شورای امنیت از سوی ایران [ 1367 خورشیدی ]",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1417-05-01",
    "title": "اَمردادولادت حضرت فاطمه زهرا (س) و روز مادر (۲۰ جمادی الثانیه)",
    "kind": "religious",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1417-05-07",
    "title": "اَمرداداَمرداد روز،جشن اَمردادگان",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1417-05-08",
    "title": "اَمردادروز بزرگداشت شیخ شهاب الدین سهروردی",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1417-05-10",
    "title": "اَمردادجشن چله تابستان",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1417-05-10",
    "title": "اَمردادآغاز هفته جهانی شیردهی",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1417-05-12",
    "title": "اَمردادولادت امام محمد باقر (ع) (۱ رجب)",
    "kind": "religious",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1417-05-14",
    "title": "اَمردادسالروز صدور فرمان مشروطیت",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1417-05-14",
    "title": "اَمردادشهادت امام علی النقی (ع) (۳ رجب)",
    "kind": "religious",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1417-05-17",
    "title": "اَمردادروز خبرنگار",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1417-05-21",
    "title": "اَمردادولادت امام محمد تقی (ع) (۱۰ رجب)",
    "kind": "religious",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1417-05-22",
    "title": "اَمردادروز جهانی چپ دست ها",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1417-05-24",
    "title": "اَمردادولادت امام علی (ع) و روز پدر (۱۳ رجب)",
    "kind": "religious",
    "isOffDay": true,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1417-05-26",
    "title": "اَمردادوفات حضرت زینب (س) (۱۵ رجب)",
    "kind": "religious",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1417-05-28",
    "title": "اَمردادسالروز وقایع پس از برکناری محمد مصدق‌السلطنه",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1417-05-28",
    "title": "اَمردادسالروز فاجعه آتش زدن سینما رکس آبادان",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1417-05-28",
    "title": "اَمردادروز جهانی عکاسی",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1417-06-01",
    "title": "روز بزرگداشت ابوعلی سینا و روز پزشک",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1417-06-02",
    "title": "آغاز هفته دولت",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1417-06-04",
    "title": "زادروز کوروش بزرگ",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1417-06-04",
    "title": "شهریور روز،جشن شهریورگان",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1417-06-05",
    "title": "روز بزرگداشت محمدبن زکریای رازی و روز داروساز",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1417-06-05",
    "title": "شهادت امام موسی کاظم (ع) (۲۵ رجب)",
    "kind": "religious",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1417-06-07",
    "title": "مبعث رسول اکرم (ص) (۲۷ رجب)",
    "kind": "religious",
    "isOffDay": true,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1417-06-11",
    "title": "روز ملی صنعت چاپ",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1417-06-12",
    "title": "ولادت سالار شهیدان، امام حسین (ع) و روز پاسدار (۳ شعبان)",
    "kind": "religious",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1417-06-13",
    "title": "روز بزرگداشت ابوریحان بیرونی",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1417-06-13",
    "title": "ولادت حضرت ابوالفضل العباس (ع) و روز جانباز (۴ شعبان)",
    "kind": "religious",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1417-06-14",
    "title": "ولادت امام زین العابدین (ع) (۵ شعبان)",
    "kind": "religious",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1417-06-19",
    "title": "روز جهانی پیشگیری از خودکشی",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1417-06-20",
    "title": "ولادت حضرت علی اکبر (ع) و روز جوان (۱۱ شعبان)",
    "kind": "religious",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1417-06-20",
    "title": "حمله به برج‌های دوقلوی مرکز تجارت جهانی",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1417-06-21",
    "title": "روز سینما",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1417-06-24",
    "title": "ولادت حضرت قائم عجل الله تعالی فرجه و جشن نیمه شعبان (۱۵ شعبان)",
    "kind": "religious",
    "isOffDay": true,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1417-06-27",
    "title": "روز شعر و ادب پارسی و روز بزرگداشت استاد شهریار",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1417-06-30",
    "title": "روز جهانی صلح",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1417-06-31",
    "title": "آغاز هفته دفاع مقدس",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1417-07-01",
    "title": "آغاز حمله مغول به ایران در پاییز 598 خورشیدی",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1417-07-04",
    "title": "روز گرامیداشت سربازان وطن",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1417-07-05",
    "title": "روز جهانی جهانگردی",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1417-07-07",
    "title": "روز آتش نشانی و ایمنی",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1417-07-07",
    "title": "روز بزرگداشت شمس تبریزی",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1417-07-08",
    "title": "روز بزرگداشت مولوی",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1417-07-08",
    "title": "روز جهانی ناشنوایان",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1417-07-08",
    "title": "روز جهانی ترجمه و مترجم",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1417-07-09",
    "title": "روز جهانی سالمندان",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1417-07-10",
    "title": "مهر روز،جشن مهرگان",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1417-07-12",
    "title": "آغاز هفته جهانی فضا",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1417-07-13",
    "title": "روز جهانی معلم",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1417-07-14",
    "title": "روز دامپزشکی",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1417-07-16",
    "title": "روز ملی کودک",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1417-07-17",
    "title": "روز جهانی پست",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1417-07-18",
    "title": "روز جهانی مبارزه با حکم اعدام",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1417-07-19",
    "title": "روز جهانی دختر",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1417-07-20",
    "title": "روز بزرگداشت حافظ",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1417-07-21",
    "title": "روز پیروزی کاوه و فریدون بر ضحاک",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1417-07-22",
    "title": "روز جهانی استاندارد",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1417-07-23",
    "title": "روز جهانی عصای سفید",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1417-07-23",
    "title": "ولادت امام حسن مجتبی (ع) (۱۵ رمضان)",
    "kind": "religious",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1417-07-24",
    "title": "روز جهانی غذا",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1417-07-25",
    "title": "روز جهانی ریشه کنی فقر",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1417-07-26",
    "title": "روز تربیت بدنی و ورزش",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1417-07-26",
    "title": "شب قدر (۱۸ رمضان)",
    "kind": "religious",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1417-07-27",
    "title": "ضربت خوردن حضرت علی (ع) (۱۹ رمضان)",
    "kind": "religious",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1417-07-28",
    "title": "زادروز ستارخان ملقب به سردار ملی و از سرداران جنبش مشروطه ایران",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1417-07-29",
    "title": "شهادت حضرت علی (ع) (۲۱ رمضان)",
    "kind": "religious",
    "isOffDay": true,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1417-07-29",
    "title": "روز ملی کوهنورد",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1417-07-30",
    "title": "شب قدر (۲۲ رمضان)",
    "kind": "religious",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1417-08-01",
    "title": "روز آمار و برنامه ریزی",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1417-08-01",
    "title": "روز بزرگداشت ابوالفضل بیهقی، تاریخ‌نگار و نویسنده ایرانی",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1417-08-07",
    "title": "سالروز ورود کوروش بزرگ به بابل در سال 539 پیش از میلاد",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1417-08-08",
    "title": "عید سعید فطر (۱ شوال)",
    "kind": "religious",
    "isOffDay": true,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1417-08-08",
    "title": "روز ملی محیط بان",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1417-08-09",
    "title": "تعطیل به مناسبت عید سعید فطر (۲ شوال)",
    "kind": "religious",
    "isOffDay": true,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1417-08-10",
    "title": "آبان روز، جشن آبانگان",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1417-08-14",
    "title": "روز ملّی مازندران",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1417-08-15",
    "title": "جشن میانه پاییز",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1417-08-18",
    "title": "روز ملی کیفیت",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1417-08-23",
    "title": "روز جهانی دیابت",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1417-08-24",
    "title": "روز کتاب و کتابخوانی",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1417-08-26",
    "title": "روز جهانی دانش آموز",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1417-08-28",
    "title": "روز جهانی آقایان",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1417-08-29",
    "title": "روز جهانی کودک",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1417-09-01",
    "title": "آذر جشن",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1417-09-02",
    "title": "شهادت امام جعفر صادق (ع) (۲۵ شوال)",
    "kind": "religious",
    "isOffDay": true,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1417-09-04",
    "title": "روز جهانی مبارزه با خشونت علیه زنان",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1417-09-05",
    "title": "روز بسیج مستضعفان",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1417-09-07",
    "title": "سالروز عملیات مروارید و روز نیروی دریایی ارتش",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1417-09-07",
    "title": "ولادت حضرت معصومه (س)، روز دختران (۱ ذوالقعده)",
    "kind": "religious",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1417-09-09",
    "title": "جشن آذرگان ،آذر روز",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1417-09-10",
    "title": "روز جهانی ایدز",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1417-09-12",
    "title": "روز جهانی معلولان (کم‌توانان)",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1417-09-13",
    "title": "روز صنعت بیمه",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1417-09-15",
    "title": "روز حسابدار",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1417-09-17",
    "title": "ولادت امام رضا (ع) (۱۱ ذوالقعده)",
    "kind": "religious",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1417-09-19",
    "title": "روز جهانی حقوق بشر",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1417-09-20",
    "title": "روز جهانی کوهستان",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1417-09-25",
    "title": "روز پژوهش و فناوری",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1417-09-30",
    "title": "جشن شب یلدا، شب چلّه",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1417-10-01",
    "title": "روز میلاد خورشید؛ جشن خرم روز، نخستین جشن دیگان",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1417-10-03",
    "title": "سالروز عملیات کربلای 4 [1365 خورشیدی]",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1417-10-04",
    "title": "جشن کریسمس",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1417-10-04",
    "title": "روز بزرگداشت دوستی",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1417-10-05",
    "title": "زمین لرزه ی بم [1382 خورشیدی]",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1417-10-05",
    "title": "سالروز شهادت اَشو زرتشت، اَبَراِنسان بزرگ تاریخ",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1417-10-06",
    "title": "شهادت امام محمد تقی (ع) (۳۰ ذوالقعده)",
    "kind": "religious",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1417-10-08",
    "title": "دی به آذر روز، دومین جشن دیگان",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1417-10-09",
    "title": "اعدام میهن‌پرستان آذری در تبریز توسط قوای اشغالگر روس [1290 خورشیدی]",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1417-10-11",
    "title": "جشن آغاز سال نو میلادی",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1417-10-12",
    "title": "روز حافظ",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1417-10-13",
    "title": "شهادت امام محمد باقر (ع) (۷ ذوالحجه)",
    "kind": "religious",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1417-10-13",
    "title": "شهادت سردار حاج قاسم سلیمانی [1398 خورشیدی]",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1417-10-15",
    "title": "دی به مهر روز، سومین جشن دیگان",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1417-10-15",
    "title": "روز عرفه (۹ ذوالحجه)",
    "kind": "religious",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1417-10-16",
    "title": "عید سعید قربان (۱۰ ذوالحجه)",
    "kind": "religious",
    "isOffDay": true,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1417-10-16",
    "title": "غرق شدن کشتی سانچی [1396 خورشیدی]",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1417-10-18",
    "title": "شلیک به پرواز 752 هواپیمایی اوکراین [1398 خورشیدی]",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1417-10-19",
    "title": "درگذشت اکبر هاشمی رفسنجانی [1395 خورشیدی]",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1417-10-20",
    "title": "قتل امیرکبیر به دستور ناصرالدین شاه قاجار [1230 خورشیدی]",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1417-10-21",
    "title": "ولادت امام علی النقی (ع) (۱۵ ذوالحجه)",
    "kind": "religious",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1417-10-23",
    "title": "دی به دین روز، چهارمین جشن دیگان",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1417-10-24",
    "title": "عید سعید غدیر خم (۱۸ ذوالحجه)",
    "kind": "religious",
    "isOffDay": true,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1417-10-26",
    "title": "ولادت امام موسی کاظم (ع) (۲۰ ذوالحجه)",
    "kind": "religious",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1417-10-30",
    "title": "آتش‌سوزی و فروریختن ساختمان پلاسکو [1395 خورشیدی]",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1417-11-01",
    "title": "زادروز فردوسی",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1417-11-02",
    "title": "بهمن روز، جشن بهمنگان",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1417-11-06",
    "title": "بزرگداشت صفی‌الدین اُرمَوی و روز موسیقی ایرانی",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1417-11-10",
    "title": "جشن سده، گرامیداشتِ کشف آتش به دستِ هوشنگ شاه",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1417-11-12",
    "title": "بازگشت امام خمینی (ره) به ایران",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1417-11-15",
    "title": "جشن میانه زمستان",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1417-11-15",
    "title": "تاسوعای حسینی (۹ محرم)",
    "kind": "religious",
    "isOffDay": true,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1417-11-16",
    "title": "عاشورای حسینی (۱۰ محرم)",
    "kind": "religious",
    "isOffDay": true,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1417-11-18",
    "title": "شهادت امام زین العابدین (ع) (۱۲ محرم)",
    "kind": "religious",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1417-11-19",
    "title": "روز نیروی هوایی",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1417-11-22",
    "title": "پیروزی انقلاب اسلامی",
    "kind": "official",
    "isOffDay": true,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1417-11-25",
    "title": "جشن ولنتاین",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1417-11-29",
    "title": "جشن سپندارمذگان و روز عشق",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1417-11-29",
    "title": "فاجعه انفجار قطار نیشابور [1382 خورشیدی]",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1417-12-05",
    "title": "روز بزرگداشت خواجه نصیر الدین طوسی و روز مهندس",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1417-12-07",
    "title": "سالروز استقلال کانون وکلای دادگستری و روز وکیل مدافع",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1417-12-15",
    "title": "روز درختکاری",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1417-12-17",
    "title": "روز جهانی زنان",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1417-12-23",
    "title": "روز جهانی عدد پی π",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1417-12-25",
    "title": "پایان سرایش شاهنامه",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1417-12-25",
    "title": "اربعین حسینی (۲۰ صفر)",
    "kind": "religious",
    "isOffDay": true,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1417-12-25",
    "title": "روز بزرگداشت اختر چرخ ادب، پروین اعتصامی",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1417-12-29",
    "title": "روز ملی شدن صنعت نفت ایران",
    "kind": "official",
    "isOffDay": true,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1417-12-29",
    "title": "روز جهانی شادی",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1418-01-01",
    "title": "جشن نوروز/جشن سال نو",
    "kind": "official",
    "isOffDay": true,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1418-01-01",
    "title": "روز جهانی نوروز",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1418-01-02",
    "title": "عید نوروز",
    "kind": "official",
    "isOffDay": true,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1418-01-03",
    "title": "عید نوروز",
    "kind": "official",
    "isOffDay": true,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1418-01-03",
    "title": "روز جهانی هواشناسی",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1418-01-04",
    "title": "عید نوروز",
    "kind": "official",
    "isOffDay": true,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1418-01-04",
    "title": "رحلت رسول اکرم؛شهادت امام حسن مجتبی (ع) (۲۸ صفر)",
    "kind": "religious",
    "isOffDay": true,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1418-01-06",
    "title": "روز امید، روز شادباش نویسی",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1418-01-06",
    "title": "شهادت امام رضا (ع) (۳۰ صفر)",
    "kind": "religious",
    "isOffDay": true,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1418-01-06",
    "title": "زادروز اَشو زرتشت، اَبَراِنسان بزرگ تاریخ",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1418-01-07",
    "title": "هجرت پیامبر اکرم از مکه به مدینه (۱ ربیع الاول)",
    "kind": "religious",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1418-01-07",
    "title": "روز جهانی تئاتر",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1418-01-10",
    "title": "جشن آبانگاه",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1418-01-12",
    "title": "روز جمهوری اسلامی",
    "kind": "official",
    "isOffDay": true,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1418-01-13",
    "title": "جشن سیزده به در",
    "kind": "official",
    "isOffDay": true,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1418-01-14",
    "title": "شهادت امام حسن عسکری (ع) (۸ ربیع الاول)",
    "kind": "religious",
    "isOffDay": true,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1418-01-17",
    "title": "سروش روز،جشن سروشگان",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1418-01-18",
    "title": "روز جهانی بهداشت",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1418-01-18",
    "title": "میلاد رسول اکرم به روایت اهل سنت (۱۲ ربیع الاول)",
    "kind": "religious",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1418-01-19",
    "title": "فروردین روز،جشن فروردینگان",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1418-01-23",
    "title": "میلاد رسول اکرم و امام جعفر صادق (ع) (۱۷ ربیع الاول)",
    "kind": "religious",
    "isOffDay": true,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1418-01-23",
    "title": "روز دندانپزشک",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1418-01-25",
    "title": "روز بزرگداشت عطار نیشابوری",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1418-01-29",
    "title": "روز ارتش جمهوری اسلامی ایران",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1418-01-30",
    "title": "روز علوم آزمایشگاهی، زاد روز حکیم سید اسماعیل جرجانی",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1418-02-01",
    "title": "روز بزرگداشت سعدی",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1418-02-02",
    "title": "جشن گیاه آوری؛ روز زمین",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1418-02-03",
    "title": "روز بزرگداشت شیخ بهایی؛ روز ملی کارآفرینی؛ روز معماری",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1418-02-06",
    "title": "فاجعه‌ی انفجارِ بندر عباس [ 1404 خورشیدی]",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1418-02-07",
    "title": "روز جهانی طراحی و گرافیک",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1418-02-09",
    "title": "روز ملی روانشناس و مشاور",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1418-02-10",
    "title": "جشن چهلم نوروز؛ روز ملی خلیج فارس",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1418-02-11",
    "title": "روز جهانی کارگر",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1418-02-12",
    "title": "روز معلم",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1418-02-12",
    "title": "ولادت امام حسن عسکری (ع) (۸ ربیع الثانی)",
    "kind": "religious",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1418-02-14",
    "title": "وفات حضرت معصومه (س) (۱۰ ربیع الثانی)",
    "kind": "religious",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1418-02-15",
    "title": "جشن میانه بهار/جشن بهاربد؛ روز شیراز",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1418-02-15",
    "title": "روز جهانی ماما",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1418-02-18",
    "title": "روز جهانی صلیب سرخ و هلال احمر",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1418-02-22",
    "title": "زادروز مریم میرزاخانی ریاضیدان ایرانی، روز جهانی زن در ریاضیات",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1418-02-22",
    "title": "روز جهانی پرستار",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1418-02-25",
    "title": "روز بزرگداشت فردوسی",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1418-02-27",
    "title": "روز ارتباطات و روابط عمومی",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1418-02-28",
    "title": "روز بزرگداشت حکیم عمر خیام",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1418-02-28",
    "title": "روز جهانی موزه و میراث فرهنگی",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1418-03-01",
    "title": "روز بهره وری و بهینه سازی مصرف",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1418-03-01",
    "title": "روز بزرگداشت ملاصدرا",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1418-03-02",
    "title": "فروریختن ساختمان متروپل در آبادان",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1418-03-03",
    "title": "فتح خرمشهر در عملیات بیت المقدس و روز مقاومت، ایثار و پیروزی",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1418-03-04",
    "title": "روز دزفول، روز مقاومت و پایداری",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1418-03-06",
    "title": "خرداد روز،جشن خردادگان",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1418-03-08",
    "title": "ولادت حضرت زینب (س) و روز پرستار و بهورز (۵ جمادی الاول)",
    "kind": "religious",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1418-03-10",
    "title": "روز جهانی بدون دخانیات",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1418-03-14",
    "title": "رحلت حضرت امام خمینی",
    "kind": "official",
    "isOffDay": true,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1418-03-15",
    "title": "قیام 15 خرداد",
    "kind": "official",
    "isOffDay": true,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1418-03-15",
    "title": "روز جهانی محیط زیست",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1418-03-20",
    "title": "روز جهانی صنایع دستی",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1418-03-22",
    "title": "روز جهانی مبارزه با کار کودکان",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1418-03-24",
    "title": "روز جهانی اهدای خون",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1418-03-25",
    "title": "روز ملی گل وگیاه",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1418-03-26",
    "title": "روز جهانی پدر",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1418-03-27",
    "title": "روز جهانی بیابان زدایی",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1418-03-31",
    "title": "سالروز زلزله رودبار و منجیل [1369خورشیدی]",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1418-04-01",
    "title": "جشن آب پاشونک، جشن آغاز تابستان",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1418-04-05",
    "title": "روز جهانی مبارزه با مواد مخدر",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1418-04-05",
    "title": "شهادت حضرت فاطمه زهرا (س) (۳ جمادی الثانیه)",
    "kind": "religious",
    "isOffDay": true,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1418-04-07",
    "title": "انفجار دفتر حزب جمهوری اسلامی؛ روز قوه قضاییه",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1418-04-08",
    "title": "روز مبارزه با سلاح های شیمیایی و میکروبی",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1418-04-10",
    "title": "روز صنعت و معدن",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1418-04-10",
    "title": "زادروز بابک خرمدین، سپه‌سالار دلاور ایران",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1418-04-10",
    "title": "روز بزرگداشت صائب تبریزی",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1418-04-12",
    "title": "شلیک به پرواز 655 ایران ایر توسط ناو وینسنس [ 1367 خورشیدی ]",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1418-04-14",
    "title": "روز قلم",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1418-04-15",
    "title": "جشن خام خواری",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1418-04-22",
    "title": "ولادت حضرت فاطمه زهرا (س) و روز مادر (۲۰ جمادی الثانیه)",
    "kind": "religious",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1418-04-25",
    "title": "روز بهزیستی و تامین اجتماعی",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1418-04-27",
    "title": "اعلام پذیرش قطعنامه 598 شورای امنیت از سوی ایران [ 1367 خورشیدی ]",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1418-05-01",
    "title": "اَمردادولادت امام محمد باقر (ع) (۱ رجب)",
    "kind": "religious",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1418-05-03",
    "title": "اَمردادشهادت امام علی النقی (ع) (۳ رجب)",
    "kind": "religious",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1418-05-07",
    "title": "اَمرداداَمرداد روز،جشن اَمردادگان",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1418-05-08",
    "title": "اَمردادروز بزرگداشت شیخ شهاب الدین سهروردی",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1418-05-10",
    "title": "اَمردادجشن چله تابستان",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1418-05-10",
    "title": "اَمردادولادت امام محمد تقی (ع) (۱۰ رجب)",
    "kind": "religious",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1418-05-10",
    "title": "اَمردادآغاز هفته جهانی شیردهی",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1418-05-13",
    "title": "اَمردادولادت امام علی (ع) و روز پدر (۱۳ رجب)",
    "kind": "religious",
    "isOffDay": true,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1418-05-14",
    "title": "اَمردادسالروز صدور فرمان مشروطیت",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1418-05-15",
    "title": "اَمردادوفات حضرت زینب (س) (۱۵ رجب)",
    "kind": "religious",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1418-05-17",
    "title": "اَمردادروز خبرنگار",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1418-05-22",
    "title": "اَمردادروز جهانی چپ دست ها",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1418-05-25",
    "title": "اَمردادشهادت امام موسی کاظم (ع) (۲۵ رجب)",
    "kind": "religious",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1418-05-27",
    "title": "اَمردادمبعث رسول اکرم (ص) (۲۷ رجب)",
    "kind": "religious",
    "isOffDay": true,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1418-05-28",
    "title": "اَمردادسالروز وقایع پس از برکناری محمد مصدق‌السلطنه",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1418-05-28",
    "title": "اَمردادسالروز فاجعه آتش زدن سینما رکس آبادان",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1418-05-28",
    "title": "اَمردادروز جهانی عکاسی",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1418-06-01",
    "title": "روز بزرگداشت ابوعلی سینا و روز پزشک",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1418-06-02",
    "title": "آغاز هفته دولت",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1418-06-02",
    "title": "ولادت سالار شهیدان، امام حسین (ع) و روز پاسدار (۳ شعبان)",
    "kind": "religious",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1418-06-03",
    "title": "ولادت حضرت ابوالفضل العباس (ع) و روز جانباز (۴ شعبان)",
    "kind": "religious",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1418-06-04",
    "title": "زادروز کوروش بزرگ",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1418-06-04",
    "title": "شهریور روز،جشن شهریورگان",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1418-06-04",
    "title": "ولادت امام زین العابدین (ع) (۵ شعبان)",
    "kind": "religious",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1418-06-05",
    "title": "روز بزرگداشت محمدبن زکریای رازی و روز داروساز",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1418-06-10",
    "title": "ولادت حضرت علی اکبر (ع) و روز جوان (۱۱ شعبان)",
    "kind": "religious",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1418-06-11",
    "title": "روز ملی صنعت چاپ",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1418-06-13",
    "title": "روز بزرگداشت ابوریحان بیرونی",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1418-06-14",
    "title": "ولادت حضرت قائم عجل الله تعالی فرجه و جشن نیمه شعبان (۱۵ شعبان)",
    "kind": "religious",
    "isOffDay": true,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1418-06-19",
    "title": "روز جهانی پیشگیری از خودکشی",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1418-06-20",
    "title": "حمله به برج‌های دوقلوی مرکز تجارت جهانی",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1418-06-21",
    "title": "روز سینما",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1418-06-27",
    "title": "روز شعر و ادب پارسی و روز بزرگداشت استاد شهریار",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1418-06-30",
    "title": "روز جهانی صلح",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1418-06-31",
    "title": "آغاز هفته دفاع مقدس",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1418-07-01",
    "title": "آغاز حمله مغول به ایران در پاییز 598 خورشیدی",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1418-07-04",
    "title": "روز گرامیداشت سربازان وطن",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1418-07-05",
    "title": "روز جهانی جهانگردی",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1418-07-07",
    "title": "روز آتش نشانی و ایمنی",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1418-07-07",
    "title": "روز بزرگداشت شمس تبریزی",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1418-07-08",
    "title": "روز بزرگداشت مولوی",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1418-07-08",
    "title": "روز جهانی ناشنوایان",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1418-07-08",
    "title": "روز جهانی ترجمه و مترجم",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1418-07-09",
    "title": "روز جهانی سالمندان",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1418-07-10",
    "title": "مهر روز،جشن مهرگان",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1418-07-12",
    "title": "ولادت امام حسن مجتبی (ع) (۱۵ رمضان)",
    "kind": "religious",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1418-07-12",
    "title": "آغاز هفته جهانی فضا",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1418-07-13",
    "title": "روز جهانی معلم",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1418-07-14",
    "title": "روز دامپزشکی",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1418-07-15",
    "title": "شب قدر (۱۸ رمضان)",
    "kind": "religious",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1418-07-16",
    "title": "روز ملی کودک",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1418-07-16",
    "title": "ضربت خوردن حضرت علی (ع) (۱۹ رمضان)",
    "kind": "religious",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1418-07-17",
    "title": "روز جهانی پست",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1418-07-18",
    "title": "شهادت حضرت علی (ع) (۲۱ رمضان)",
    "kind": "religious",
    "isOffDay": true,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1418-07-18",
    "title": "روز جهانی مبارزه با حکم اعدام",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1418-07-19",
    "title": "شب قدر (۲۲ رمضان)",
    "kind": "religious",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1418-07-19",
    "title": "روز جهانی دختر",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1418-07-20",
    "title": "روز بزرگداشت حافظ",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1418-07-21",
    "title": "روز پیروزی کاوه و فریدون بر ضحاک",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1418-07-22",
    "title": "روز جهانی استاندارد",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1418-07-23",
    "title": "روز جهانی عصای سفید",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1418-07-24",
    "title": "روز جهانی غذا",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1418-07-25",
    "title": "روز جهانی ریشه کنی فقر",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1418-07-26",
    "title": "روز تربیت بدنی و ورزش",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1418-07-28",
    "title": "عید سعید فطر (۱ شوال)",
    "kind": "religious",
    "isOffDay": true,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1418-07-28",
    "title": "زادروز ستارخان ملقب به سردار ملی و از سرداران جنبش مشروطه ایران",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1418-07-29",
    "title": "تعطیل به مناسبت عید سعید فطر (۲ شوال)",
    "kind": "religious",
    "isOffDay": true,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1418-07-29",
    "title": "روز ملی کوهنورد",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1418-08-01",
    "title": "روز آمار و برنامه ریزی",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1418-08-01",
    "title": "روز بزرگداشت ابوالفضل بیهقی، تاریخ‌نگار و نویسنده ایرانی",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1418-08-07",
    "title": "سالروز ورود کوروش بزرگ به بابل در سال 539 پیش از میلاد",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1418-08-08",
    "title": "روز ملی محیط بان",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1418-08-10",
    "title": "آبان روز، جشن آبانگان",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1418-08-14",
    "title": "روز ملّی مازندران",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1418-08-15",
    "title": "جشن میانه پاییز",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1418-08-18",
    "title": "روز ملی کیفیت",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1418-08-22",
    "title": "شهادت امام جعفر صادق (ع) (۲۵ شوال)",
    "kind": "religious",
    "isOffDay": true,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1418-08-23",
    "title": "روز جهانی دیابت",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1418-08-24",
    "title": "روز کتاب و کتابخوانی",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1418-08-26",
    "title": "روز جهانی دانش آموز",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1418-08-27",
    "title": "ولادت حضرت معصومه (س)، روز دختران (۱ ذوالقعده)",
    "kind": "religious",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1418-08-28",
    "title": "روز جهانی آقایان",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1418-08-29",
    "title": "روز جهانی کودک",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1418-09-01",
    "title": "آذر جشن",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1418-09-04",
    "title": "روز جهانی مبارزه با خشونت علیه زنان",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1418-09-05",
    "title": "روز بسیج مستضعفان",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1418-09-07",
    "title": "سالروز عملیات مروارید و روز نیروی دریایی ارتش",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1418-09-07",
    "title": "ولادت امام رضا (ع) (۱۱ ذوالقعده)",
    "kind": "religious",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1418-09-09",
    "title": "جشن آذرگان ،آذر روز",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1418-09-10",
    "title": "روز جهانی ایدز",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1418-09-12",
    "title": "روز جهانی معلولان (کم‌توانان)",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1418-09-13",
    "title": "روز صنعت بیمه",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1418-09-15",
    "title": "روز حسابدار",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1418-09-19",
    "title": "روز جهانی حقوق بشر",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1418-09-20",
    "title": "روز جهانی کوهستان",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1418-09-25",
    "title": "روز پژوهش و فناوری",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1418-09-26",
    "title": "شهادت امام محمد تقی (ع) (۳۰ ذوالقعده)",
    "kind": "religious",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1418-09-30",
    "title": "جشن شب یلدا، شب چلّه",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1418-10-01",
    "title": "روز میلاد خورشید؛ جشن خرم روز، نخستین جشن دیگان",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1418-10-03",
    "title": "شهادت امام محمد باقر (ع) (۷ ذوالحجه)",
    "kind": "religious",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1418-10-03",
    "title": "سالروز عملیات کربلای 4 [1365 خورشیدی]",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1418-10-04",
    "title": "جشن کریسمس",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1418-10-04",
    "title": "روز بزرگداشت دوستی",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1418-10-05",
    "title": "زمین لرزه ی بم [1382 خورشیدی]",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1418-10-05",
    "title": "روز عرفه (۹ ذوالحجه)",
    "kind": "religious",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1418-10-05",
    "title": "سالروز شهادت اَشو زرتشت، اَبَراِنسان بزرگ تاریخ",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1418-10-06",
    "title": "عید سعید قربان (۱۰ ذوالحجه)",
    "kind": "religious",
    "isOffDay": true,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1418-10-08",
    "title": "دی به آذر روز، دومین جشن دیگان",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1418-10-09",
    "title": "اعدام میهن‌پرستان آذری در تبریز توسط قوای اشغالگر روس [1290 خورشیدی]",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1418-10-11",
    "title": "ولادت امام علی النقی (ع) (۱۵ ذوالحجه)",
    "kind": "religious",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1418-10-11",
    "title": "جشن آغاز سال نو میلادی",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1418-10-12",
    "title": "روز حافظ",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1418-10-13",
    "title": "شهادت سردار حاج قاسم سلیمانی [1398 خورشیدی]",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1418-10-14",
    "title": "عید سعید غدیر خم (۱۸ ذوالحجه)",
    "kind": "religious",
    "isOffDay": true,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1418-10-15",
    "title": "دی به مهر روز، سومین جشن دیگان",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1418-10-16",
    "title": "ولادت امام موسی کاظم (ع) (۲۰ ذوالحجه)",
    "kind": "religious",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1418-10-16",
    "title": "غرق شدن کشتی سانچی [1396 خورشیدی]",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1418-10-18",
    "title": "شلیک به پرواز 752 هواپیمایی اوکراین [1398 خورشیدی]",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1418-10-19",
    "title": "درگذشت اکبر هاشمی رفسنجانی [1395 خورشیدی]",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1418-10-20",
    "title": "قتل امیرکبیر به دستور ناصرالدین شاه قاجار [1230 خورشیدی]",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1418-10-23",
    "title": "دی به دین روز، چهارمین جشن دیگان",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1418-10-30",
    "title": "آتش‌سوزی و فروریختن ساختمان پلاسکو [1395 خورشیدی]",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1418-11-01",
    "title": "زادروز فردوسی",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1418-11-02",
    "title": "بهمن روز، جشن بهمنگان",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1418-11-04",
    "title": "تاسوعای حسینی (۹ محرم)",
    "kind": "religious",
    "isOffDay": true,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1418-11-05",
    "title": "عاشورای حسینی (۱۰ محرم)",
    "kind": "religious",
    "isOffDay": true,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1418-11-06",
    "title": "بزرگداشت صفی‌الدین اُرمَوی و روز موسیقی ایرانی",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1418-11-07",
    "title": "شهادت امام زین العابدین (ع) (۱۲ محرم)",
    "kind": "religious",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1418-11-10",
    "title": "جشن سده، گرامیداشتِ کشف آتش به دستِ هوشنگ شاه",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1418-11-12",
    "title": "بازگشت امام خمینی (ره) به ایران",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1418-11-15",
    "title": "جشن میانه زمستان",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1418-11-19",
    "title": "روز نیروی هوایی",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1418-11-22",
    "title": "پیروزی انقلاب اسلامی",
    "kind": "official",
    "isOffDay": true,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1418-11-25",
    "title": "جشن ولنتاین",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1418-11-29",
    "title": "جشن سپندارمذگان و روز عشق",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1418-11-29",
    "title": "فاجعه انفجار قطار نیشابور [1382 خورشیدی]",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1418-12-05",
    "title": "روز بزرگداشت خواجه نصیر الدین طوسی و روز مهندس",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1418-12-07",
    "title": "سالروز استقلال کانون وکلای دادگستری و روز وکیل مدافع",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1418-12-15",
    "title": "روز درختکاری",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1418-12-15",
    "title": "اربعین حسینی (۲۰ صفر)",
    "kind": "religious",
    "isOffDay": true,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1418-12-18",
    "title": "روز جهانی زنان",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1418-12-23",
    "title": "رحلت رسول اکرم؛شهادت امام حسن مجتبی (ع) (۲۸ صفر)",
    "kind": "religious",
    "isOffDay": true,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1418-12-24",
    "title": "شهادت امام رضا (ع) (۳۰ صفر)",
    "kind": "religious",
    "isOffDay": true,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1418-12-24",
    "title": "روز جهانی عدد پی π",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1418-12-25",
    "title": "پایان سرایش شاهنامه",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1418-12-25",
    "title": "هجرت پیامبر اکرم از مکه به مدینه (۱ ربیع الاول)",
    "kind": "religious",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1418-12-25",
    "title": "روز بزرگداشت اختر چرخ ادب، پروین اعتصامی",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1418-12-29",
    "title": "روز ملی شدن صنعت نفت ایران",
    "kind": "official",
    "isOffDay": true,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1419-01-01",
    "title": "جشن نوروز/جشن سال نو",
    "kind": "official",
    "isOffDay": true,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1419-01-01",
    "title": "روز جهانی شادی",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1419-01-02",
    "title": "عید نوروز",
    "kind": "official",
    "isOffDay": true,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1419-01-02",
    "title": "روز جهانی نوروز",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1419-01-03",
    "title": "عید نوروز",
    "kind": "official",
    "isOffDay": true,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1419-01-03",
    "title": "شهادت امام حسن عسکری (ع) (۸ ربیع الاول)",
    "kind": "religious",
    "isOffDay": true,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1419-01-04",
    "title": "عید نوروز",
    "kind": "official",
    "isOffDay": true,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1419-01-04",
    "title": "روز جهانی هواشناسی",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1419-01-06",
    "title": "روز امید، روز شادباش نویسی",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1419-01-06",
    "title": "زادروز اَشو زرتشت، اَبَراِنسان بزرگ تاریخ",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1419-01-07",
    "title": "میلاد رسول اکرم به روایت اهل سنت (۱۲ ربیع الاول)",
    "kind": "religious",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1419-01-08",
    "title": "روز جهانی تئاتر",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1419-01-10",
    "title": "جشن آبانگاه",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1419-01-12",
    "title": "روز جمهوری اسلامی",
    "kind": "official",
    "isOffDay": true,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1419-01-12",
    "title": "میلاد رسول اکرم و امام جعفر صادق (ع) (۱۷ ربیع الاول)",
    "kind": "religious",
    "isOffDay": true,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1419-01-13",
    "title": "جشن سیزده به در",
    "kind": "official",
    "isOffDay": true,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1419-01-17",
    "title": "سروش روز،جشن سروشگان",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1419-01-19",
    "title": "روز جهانی بهداشت",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1419-01-19",
    "title": "فروردین روز،جشن فروردینگان",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1419-01-23",
    "title": "روز دندانپزشک",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1419-01-25",
    "title": "روز بزرگداشت عطار نیشابوری",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1419-01-29",
    "title": "روز ارتش جمهوری اسلامی ایران",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1419-01-30",
    "title": "روز علوم آزمایشگاهی، زاد روز حکیم سید اسماعیل جرجانی",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1419-02-01",
    "title": "روز بزرگداشت سعدی",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1419-02-02",
    "title": "ولادت امام حسن عسکری (ع) (۸ ربیع الثانی)",
    "kind": "religious",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1419-02-03",
    "title": "جشن گیاه آوری؛ روز زمین",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1419-02-03",
    "title": "روز بزرگداشت شیخ بهایی؛ روز ملی کارآفرینی؛ روز معماری",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1419-02-04",
    "title": "وفات حضرت معصومه (س) (۱۰ ربیع الثانی)",
    "kind": "religious",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1419-02-06",
    "title": "فاجعه‌ی انفجارِ بندر عباس [ 1404 خورشیدی]",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1419-02-08",
    "title": "روز جهانی طراحی و گرافیک",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1419-02-09",
    "title": "روز ملی روانشناس و مشاور",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1419-02-10",
    "title": "جشن چهلم نوروز؛ روز ملی خلیج فارس",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1419-02-12",
    "title": "روز معلم",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1419-02-12",
    "title": "روز جهانی کارگر",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1419-02-15",
    "title": "جشن میانه بهار/جشن بهاربد؛ روز شیراز",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1419-02-16",
    "title": "روز جهانی ماما",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1419-02-19",
    "title": "روز جهانی صلیب سرخ و هلال احمر",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1419-02-22",
    "title": "زادروز مریم میرزاخانی ریاضیدان ایرانی، روز جهانی زن در ریاضیات",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1419-02-23",
    "title": "روز جهانی پرستار",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1419-02-25",
    "title": "روز بزرگداشت فردوسی",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1419-02-27",
    "title": "روز ارتباطات و روابط عمومی",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1419-02-28",
    "title": "روز بزرگداشت حکیم عمر خیام",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1419-02-28",
    "title": "ولادت حضرت زینب (س) و روز پرستار و بهورز (۵ جمادی الاول)",
    "kind": "religious",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1419-02-29",
    "title": "روز جهانی موزه و میراث فرهنگی",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1419-03-01",
    "title": "روز بهره وری و بهینه سازی مصرف",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1419-03-01",
    "title": "روز بزرگداشت ملاصدرا",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1419-03-02",
    "title": "فروریختن ساختمان متروپل در آبادان",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1419-03-03",
    "title": "فتح خرمشهر در عملیات بیت المقدس و روز مقاومت، ایثار و پیروزی",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1419-03-04",
    "title": "روز دزفول، روز مقاومت و پایداری",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1419-03-06",
    "title": "خرداد روز،جشن خردادگان",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1419-03-11",
    "title": "روز جهانی بدون دخانیات",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1419-03-14",
    "title": "رحلت حضرت امام خمینی",
    "kind": "official",
    "isOffDay": true,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1419-03-15",
    "title": "قیام 15 خرداد",
    "kind": "official",
    "isOffDay": true,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1419-03-16",
    "title": "روز جهانی محیط زیست",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1419-03-21",
    "title": "روز جهانی صنایع دستی",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1419-03-23",
    "title": "روز جهانی مبارزه با کار کودکان",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1419-03-25",
    "title": "روز ملی گل وگیاه",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1419-03-25",
    "title": "شهادت حضرت فاطمه زهرا (س) (۳ جمادی الثانیه)",
    "kind": "religious",
    "isOffDay": true,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1419-03-25",
    "title": "روز جهانی اهدای خون",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1419-03-27",
    "title": "روز جهانی پدر",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1419-03-28",
    "title": "روز جهانی بیابان زدایی",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1419-03-31",
    "title": "سالروز زلزله رودبار و منجیل [1369خورشیدی]",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1419-04-01",
    "title": "جشن آب پاشونک، جشن آغاز تابستان",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1419-04-06",
    "title": "روز جهانی مبارزه با مواد مخدر",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1419-04-07",
    "title": "انفجار دفتر حزب جمهوری اسلامی؛ روز قوه قضاییه",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1419-04-08",
    "title": "روز مبارزه با سلاح های شیمیایی و میکروبی",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1419-04-10",
    "title": "روز صنعت و معدن",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1419-04-10",
    "title": "زادروز بابک خرمدین، سپه‌سالار دلاور ایران",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1419-04-10",
    "title": "روز بزرگداشت صائب تبریزی",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1419-04-11",
    "title": "ولادت حضرت فاطمه زهرا (س) و روز مادر (۲۰ جمادی الثانیه)",
    "kind": "religious",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1419-04-12",
    "title": "شلیک به پرواز 655 ایران ایر توسط ناو وینسنس [ 1367 خورشیدی ]",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1419-04-14",
    "title": "روز قلم",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1419-04-15",
    "title": "جشن خام خواری",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1419-04-21",
    "title": "ولادت امام محمد باقر (ع) (۱ رجب)",
    "kind": "religious",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1419-04-23",
    "title": "شهادت امام علی النقی (ع) (۳ رجب)",
    "kind": "religious",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1419-04-25",
    "title": "روز بهزیستی و تامین اجتماعی",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1419-04-27",
    "title": "اعلام پذیرش قطعنامه 598 شورای امنیت از سوی ایران [ 1367 خورشیدی ]",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1419-04-30",
    "title": "ولادت امام محمد تقی (ع) (۱۰ رجب)",
    "kind": "religious",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1419-05-02",
    "title": "اَمردادولادت امام علی (ع) و روز پدر (۱۳ رجب)",
    "kind": "religious",
    "isOffDay": true,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1419-05-04",
    "title": "اَمردادوفات حضرت زینب (س) (۱۵ رجب)",
    "kind": "religious",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1419-05-07",
    "title": "اَمرداداَمرداد روز،جشن اَمردادگان",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1419-05-08",
    "title": "اَمردادروز بزرگداشت شیخ شهاب الدین سهروردی",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1419-05-10",
    "title": "اَمردادجشن چله تابستان",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1419-05-11",
    "title": "اَمردادآغاز هفته جهانی شیردهی",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1419-05-14",
    "title": "اَمردادسالروز صدور فرمان مشروطیت",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1419-05-14",
    "title": "اَمردادشهادت امام موسی کاظم (ع) (۲۵ رجب)",
    "kind": "religious",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1419-05-16",
    "title": "اَمردادمبعث رسول اکرم (ص) (۲۷ رجب)",
    "kind": "religious",
    "isOffDay": true,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1419-05-17",
    "title": "اَمردادروز خبرنگار",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1419-05-22",
    "title": "اَمردادولادت سالار شهیدان، امام حسین (ع) و روز پاسدار (۳ شعبان)",
    "kind": "religious",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1419-05-23",
    "title": "اَمردادولادت حضرت ابوالفضل العباس (ع) و روز جانباز (۴ شعبان)",
    "kind": "religious",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1419-05-23",
    "title": "اَمردادروز جهانی چپ دست ها",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1419-05-24",
    "title": "اَمردادولادت امام زین العابدین (ع) (۵ شعبان)",
    "kind": "religious",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1419-05-28",
    "title": "اَمردادسالروز وقایع پس از برکناری محمد مصدق‌السلطنه",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1419-05-28",
    "title": "اَمردادسالروز فاجعه آتش زدن سینما رکس آبادان",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1419-05-29",
    "title": "اَمردادروز جهانی عکاسی",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1419-05-30",
    "title": "اَمردادولادت حضرت علی اکبر (ع) و روز جوان (۱۱ شعبان)",
    "kind": "religious",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1419-06-01",
    "title": "روز بزرگداشت ابوعلی سینا و روز پزشک",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1419-06-02",
    "title": "آغاز هفته دولت",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1419-06-03",
    "title": "ولادت حضرت قائم عجل الله تعالی فرجه و جشن نیمه شعبان (۱۵ شعبان)",
    "kind": "religious",
    "isOffDay": true,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1419-06-04",
    "title": "زادروز کوروش بزرگ",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1419-06-04",
    "title": "شهریور روز،جشن شهریورگان",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1419-06-05",
    "title": "روز بزرگداشت محمدبن زکریای رازی و روز داروساز",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1419-06-11",
    "title": "روز ملی صنعت چاپ",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1419-06-13",
    "title": "روز بزرگداشت ابوریحان بیرونی",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1419-06-20",
    "title": "روز جهانی پیشگیری از خودکشی",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1419-06-21",
    "title": "روز سینما",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1419-06-21",
    "title": "حمله به برج‌های دوقلوی مرکز تجارت جهانی",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1419-06-27",
    "title": "روز شعر و ادب پارسی و روز بزرگداشت استاد شهریار",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1419-06-31",
    "title": "آغاز هفته دفاع مقدس",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1419-06-31",
    "title": "روز جهانی صلح",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1419-07-01",
    "title": "ولادت امام حسن مجتبی (ع) (۱۵ رمضان)",
    "kind": "religious",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1419-07-01",
    "title": "آغاز حمله مغول به ایران در پاییز 598 خورشیدی",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1419-07-04",
    "title": "شب قدر (۱۸ رمضان)",
    "kind": "religious",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1419-07-04",
    "title": "روز گرامیداشت سربازان وطن",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1419-07-05",
    "title": "ضربت خوردن حضرت علی (ع) (۱۹ رمضان)",
    "kind": "religious",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1419-07-06",
    "title": "روز جهانی جهانگردی",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1419-07-07",
    "title": "روز آتش نشانی و ایمنی",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1419-07-07",
    "title": "شهادت حضرت علی (ع) (۲۱ رمضان)",
    "kind": "religious",
    "isOffDay": true,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1419-07-07",
    "title": "روز بزرگداشت شمس تبریزی",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1419-07-08",
    "title": "روز بزرگداشت مولوی",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1419-07-08",
    "title": "شب قدر (۲۲ رمضان)",
    "kind": "religious",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1419-07-09",
    "title": "روز جهانی ناشنوایان",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1419-07-09",
    "title": "روز جهانی ترجمه و مترجم",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1419-07-10",
    "title": "مهر روز،جشن مهرگان",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1419-07-10",
    "title": "روز جهانی سالمندان",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1419-07-13",
    "title": "آغاز هفته جهانی فضا",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1419-07-14",
    "title": "روز دامپزشکی",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1419-07-14",
    "title": "روز جهانی معلم",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1419-07-16",
    "title": "روز ملی کودک",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1419-07-17",
    "title": "عید سعید فطر (۱ شوال)",
    "kind": "religious",
    "isOffDay": true,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1419-07-18",
    "title": "تعطیل به مناسبت عید سعید فطر (۲ شوال)",
    "kind": "religious",
    "isOffDay": true,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1419-07-18",
    "title": "روز جهانی پست",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1419-07-19",
    "title": "روز جهانی مبارزه با حکم اعدام",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1419-07-20",
    "title": "روز بزرگداشت حافظ",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1419-07-20",
    "title": "روز جهانی دختر",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1419-07-21",
    "title": "روز پیروزی کاوه و فریدون بر ضحاک",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1419-07-23",
    "title": "روز جهانی استاندارد",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1419-07-24",
    "title": "روز جهانی عصای سفید",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1419-07-25",
    "title": "روز جهانی غذا",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1419-07-26",
    "title": "روز تربیت بدنی و ورزش",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1419-07-26",
    "title": "روز جهانی ریشه کنی فقر",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1419-07-28",
    "title": "زادروز ستارخان ملقب به سردار ملی و از سرداران جنبش مشروطه ایران",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1419-07-29",
    "title": "روز ملی کوهنورد",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1419-08-01",
    "title": "روز آمار و برنامه ریزی",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1419-08-01",
    "title": "روز بزرگداشت ابوالفضل بیهقی، تاریخ‌نگار و نویسنده ایرانی",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1419-08-07",
    "title": "سالروز ورود کوروش بزرگ به بابل در سال 539 پیش از میلاد",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1419-08-08",
    "title": "روز ملی محیط بان",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1419-08-10",
    "title": "آبان روز، جشن آبانگان",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1419-08-11",
    "title": "شهادت امام جعفر صادق (ع) (۲۵ شوال)",
    "kind": "religious",
    "isOffDay": true,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1419-08-14",
    "title": "روز ملّی مازندران",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1419-08-15",
    "title": "جشن میانه پاییز",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1419-08-17",
    "title": "ولادت حضرت معصومه (س)، روز دختران (۱ ذوالقعده)",
    "kind": "religious",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1419-08-18",
    "title": "روز ملی کیفیت",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1419-08-24",
    "title": "روز کتاب و کتابخوانی",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1419-08-24",
    "title": "روز جهانی دیابت",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1419-08-27",
    "title": "ولادت امام رضا (ع) (۱۱ ذوالقعده)",
    "kind": "religious",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1419-08-27",
    "title": "روز جهانی دانش آموز",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1419-08-29",
    "title": "روز جهانی آقایان",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1419-08-30",
    "title": "روز جهانی کودک",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1419-09-01",
    "title": "آذر جشن",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1419-09-05",
    "title": "روز بسیج مستضعفان",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1419-09-05",
    "title": "روز جهانی مبارزه با خشونت علیه زنان",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1419-09-07",
    "title": "سالروز عملیات مروارید و روز نیروی دریایی ارتش",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1419-09-09",
    "title": "جشن آذرگان ،آذر روز",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1419-09-11",
    "title": "روز جهانی ایدز",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1419-09-13",
    "title": "روز صنعت بیمه",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1419-09-13",
    "title": "روز جهانی معلولان (کم‌توانان)",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1419-09-15",
    "title": "شهادت امام محمد تقی (ع) (۳۰ ذوالقعده)",
    "kind": "religious",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1419-09-15",
    "title": "روز حسابدار",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1419-09-20",
    "title": "روز جهانی حقوق بشر",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1419-09-21",
    "title": "روز جهانی کوهستان",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1419-09-22",
    "title": "شهادت امام محمد باقر (ع) (۷ ذوالحجه)",
    "kind": "religious",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1419-09-24",
    "title": "روز عرفه (۹ ذوالحجه)",
    "kind": "religious",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1419-09-25",
    "title": "روز پژوهش و فناوری",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1419-09-25",
    "title": "عید سعید قربان (۱۰ ذوالحجه)",
    "kind": "religious",
    "isOffDay": true,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1419-09-30",
    "title": "ولادت امام علی النقی (ع) (۱۵ ذوالحجه)",
    "kind": "religious",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1419-09-30",
    "title": "جشن شب یلدا، شب چلّه",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1419-10-01",
    "title": "روز میلاد خورشید؛ جشن خرم روز، نخستین جشن دیگان",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1419-10-03",
    "title": "عید سعید غدیر خم (۱۸ ذوالحجه)",
    "kind": "religious",
    "isOffDay": true,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1419-10-03",
    "title": "سالروز عملیات کربلای 4 [1365 خورشیدی]",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1419-10-05",
    "title": "زمین لرزه ی بم [1382 خورشیدی]",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1419-10-05",
    "title": "جشن کریسمس",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1419-10-05",
    "title": "سالروز شهادت اَشو زرتشت، اَبَراِنسان بزرگ تاریخ",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1419-10-05",
    "title": "ولادت امام موسی کاظم (ع) (۲۰ ذوالحجه)",
    "kind": "religious",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1419-10-05",
    "title": "روز بزرگداشت دوستی",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1419-10-08",
    "title": "دی به آذر روز، دومین جشن دیگان",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1419-10-09",
    "title": "اعدام میهن‌پرستان آذری در تبریز توسط قوای اشغالگر روس [1290 خورشیدی]",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1419-10-12",
    "title": "جشن آغاز سال نو میلادی",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1419-10-12",
    "title": "روز حافظ",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1419-10-13",
    "title": "شهادت سردار حاج قاسم سلیمانی [1398 خورشیدی]",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1419-10-15",
    "title": "دی به مهر روز، سومین جشن دیگان",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1419-10-16",
    "title": "غرق شدن کشتی سانچی [1396 خورشیدی]",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1419-10-18",
    "title": "شلیک به پرواز 752 هواپیمایی اوکراین [1398 خورشیدی]",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1419-10-19",
    "title": "درگذشت اکبر هاشمی رفسنجانی [1395 خورشیدی]",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1419-10-20",
    "title": "قتل امیرکبیر به دستور ناصرالدین شاه قاجار [1230 خورشیدی]",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1419-10-23",
    "title": "دی به دین روز، چهارمین جشن دیگان",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1419-10-24",
    "title": "تاسوعای حسینی (۹ محرم)",
    "kind": "religious",
    "isOffDay": true,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1419-10-25",
    "title": "عاشورای حسینی (۱۰ محرم)",
    "kind": "religious",
    "isOffDay": true,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1419-10-27",
    "title": "شهادت امام زین العابدین (ع) (۱۲ محرم)",
    "kind": "religious",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1419-10-30",
    "title": "آتش‌سوزی و فروریختن ساختمان پلاسکو [1395 خورشیدی]",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1419-11-01",
    "title": "زادروز فردوسی",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1419-11-02",
    "title": "بهمن روز، جشن بهمنگان",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1419-11-06",
    "title": "بزرگداشت صفی‌الدین اُرمَوی و روز موسیقی ایرانی",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1419-11-10",
    "title": "جشن سده، گرامیداشتِ کشف آتش به دستِ هوشنگ شاه",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1419-11-12",
    "title": "بازگشت امام خمینی (ره) به ایران",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1419-11-15",
    "title": "جشن میانه زمستان",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1419-11-19",
    "title": "روز نیروی هوایی",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1419-11-22",
    "title": "پیروزی انقلاب اسلامی",
    "kind": "official",
    "isOffDay": true,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1419-11-26",
    "title": "جشن ولنتاین",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1419-11-29",
    "title": "جشن سپندارمذگان و روز عشق",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1419-11-29",
    "title": "فاجعه انفجار قطار نیشابور [1382 خورشیدی]",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1419-12-04",
    "title": "اربعین حسینی (۲۰ صفر)",
    "kind": "religious",
    "isOffDay": true,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1419-12-05",
    "title": "روز بزرگداشت خواجه نصیر الدین طوسی و روز مهندس",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1419-12-07",
    "title": "سالروز استقلال کانون وکلای دادگستری و روز وکیل مدافع",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1419-12-12",
    "title": "رحلت رسول اکرم؛شهادت امام حسن مجتبی (ع) (۲۸ صفر)",
    "kind": "religious",
    "isOffDay": true,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1419-12-14",
    "title": "شهادت امام رضا (ع) (۳۰ صفر)",
    "kind": "religious",
    "isOffDay": true,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1419-12-15",
    "title": "روز درختکاری",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1419-12-15",
    "title": "هجرت پیامبر اکرم از مکه به مدینه (۱ ربیع الاول)",
    "kind": "religious",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1419-12-18",
    "title": "روز جهانی زنان",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1419-12-22",
    "title": "شهادت امام حسن عسکری (ع) (۸ ربیع الاول)",
    "kind": "religious",
    "isOffDay": true,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1419-12-24",
    "title": "روز جهانی عدد پی π",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1419-12-25",
    "title": "پایان سرایش شاهنامه",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1419-12-25",
    "title": "روز بزرگداشت اختر چرخ ادب، پروین اعتصامی",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1419-12-26",
    "title": "میلاد رسول اکرم به روایت اهل سنت (۱۲ ربیع الاول)",
    "kind": "religious",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1419-12-29",
    "title": "روز ملی شدن صنعت نفت ایران",
    "kind": "official",
    "isOffDay": true,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1420-01-01",
    "title": "جشن نوروز/جشن سال نو",
    "kind": "official",
    "isOffDay": true,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1420-01-01",
    "title": "روز جهانی شادی",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1420-01-02",
    "title": "عید نوروز",
    "kind": "official",
    "isOffDay": true,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1420-01-02",
    "title": "میلاد رسول اکرم و امام جعفر صادق (ع) (۱۷ ربیع الاول)",
    "kind": "religious",
    "isOffDay": true,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1420-01-02",
    "title": "روز جهانی نوروز",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1420-01-03",
    "title": "عید نوروز",
    "kind": "official",
    "isOffDay": true,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1420-01-04",
    "title": "عید نوروز",
    "kind": "official",
    "isOffDay": true,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1420-01-04",
    "title": "روز جهانی هواشناسی",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1420-01-06",
    "title": "روز امید، روز شادباش نویسی",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1420-01-06",
    "title": "زادروز اَشو زرتشت، اَبَراِنسان بزرگ تاریخ",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1420-01-08",
    "title": "روز جهانی تئاتر",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1420-01-10",
    "title": "جشن آبانگاه",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1420-01-12",
    "title": "روز جمهوری اسلامی",
    "kind": "official",
    "isOffDay": true,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1420-01-13",
    "title": "جشن سیزده به در",
    "kind": "official",
    "isOffDay": true,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1420-01-17",
    "title": "سروش روز،جشن سروشگان",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1420-01-19",
    "title": "روز جهانی بهداشت",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1420-01-19",
    "title": "فروردین روز،جشن فروردینگان",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1420-01-22",
    "title": "ولادت امام حسن عسکری (ع) (۸ ربیع الثانی)",
    "kind": "religious",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1420-01-23",
    "title": "روز دندانپزشک",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1420-01-24",
    "title": "وفات حضرت معصومه (س) (۱۰ ربیع الثانی)",
    "kind": "religious",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1420-01-25",
    "title": "روز بزرگداشت عطار نیشابوری",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1420-01-29",
    "title": "روز ارتش جمهوری اسلامی ایران",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1420-01-30",
    "title": "روز علوم آزمایشگاهی، زاد روز حکیم سید اسماعیل جرجانی",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1420-02-01",
    "title": "روز بزرگداشت سعدی",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1420-02-03",
    "title": "جشن گیاه آوری؛ روز زمین",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1420-02-03",
    "title": "روز بزرگداشت شیخ بهایی؛ روز ملی کارآفرینی؛ روز معماری",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1420-02-06",
    "title": "فاجعه‌ی انفجارِ بندر عباس [ 1404 خورشیدی]",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1420-02-08",
    "title": "روز جهانی طراحی و گرافیک",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1420-02-09",
    "title": "روز ملی روانشناس و مشاور",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1420-02-10",
    "title": "جشن چهلم نوروز؛ روز ملی خلیج فارس",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1420-02-12",
    "title": "روز معلم",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1420-02-12",
    "title": "روز جهانی کارگر",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1420-02-15",
    "title": "جشن میانه بهار/جشن بهاربد؛ روز شیراز",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1420-02-16",
    "title": "روز جهانی ماما",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1420-02-17",
    "title": "ولادت حضرت زینب (س) و روز پرستار و بهورز (۵ جمادی الاول)",
    "kind": "religious",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1420-02-19",
    "title": "روز جهانی صلیب سرخ و هلال احمر",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1420-02-22",
    "title": "زادروز مریم میرزاخانی ریاضیدان ایرانی، روز جهانی زن در ریاضیات",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1420-02-23",
    "title": "روز جهانی پرستار",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1420-02-25",
    "title": "روز بزرگداشت فردوسی",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1420-02-27",
    "title": "روز ارتباطات و روابط عمومی",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1420-02-28",
    "title": "روز بزرگداشت حکیم عمر خیام",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1420-02-29",
    "title": "روز جهانی موزه و میراث فرهنگی",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1420-03-01",
    "title": "روز بهره وری و بهینه سازی مصرف",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1420-03-01",
    "title": "روز بزرگداشت ملاصدرا",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1420-03-02",
    "title": "فروریختن ساختمان متروپل در آبادان",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1420-03-03",
    "title": "فتح خرمشهر در عملیات بیت المقدس و روز مقاومت، ایثار و پیروزی",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1420-03-04",
    "title": "روز دزفول، روز مقاومت و پایداری",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1420-03-06",
    "title": "خرداد روز،جشن خردادگان",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1420-03-11",
    "title": "روز جهانی بدون دخانیات",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1420-03-14",
    "title": "رحلت حضرت امام خمینی",
    "kind": "official",
    "isOffDay": true,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1420-03-14",
    "title": "شهادت حضرت فاطمه زهرا (س) (۳ جمادی الثانیه)",
    "kind": "religious",
    "isOffDay": true,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1420-03-15",
    "title": "قیام 15 خرداد",
    "kind": "official",
    "isOffDay": true,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1420-03-16",
    "title": "روز جهانی محیط زیست",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1420-03-21",
    "title": "روز جهانی صنایع دستی",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1420-03-23",
    "title": "روز جهانی مبارزه با کار کودکان",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1420-03-25",
    "title": "روز ملی گل وگیاه",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1420-03-25",
    "title": "روز جهانی اهدای خون",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1420-03-27",
    "title": "روز جهانی پدر",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1420-03-28",
    "title": "روز جهانی بیابان زدایی",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1420-03-31",
    "title": "ولادت حضرت فاطمه زهرا (س) و روز مادر (۲۰ جمادی الثانیه)",
    "kind": "religious",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1420-03-31",
    "title": "سالروز زلزله رودبار و منجیل [1369خورشیدی]",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1420-04-01",
    "title": "جشن آب پاشونک، جشن آغاز تابستان",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1420-04-06",
    "title": "روز جهانی مبارزه با مواد مخدر",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1420-04-07",
    "title": "انفجار دفتر حزب جمهوری اسلامی؛ روز قوه قضاییه",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1420-04-08",
    "title": "روز مبارزه با سلاح های شیمیایی و میکروبی",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1420-04-10",
    "title": "روز صنعت و معدن",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1420-04-10",
    "title": "ولادت امام محمد باقر (ع) (۱ رجب)",
    "kind": "religious",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1420-04-10",
    "title": "زادروز بابک خرمدین، سپه‌سالار دلاور ایران",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1420-04-10",
    "title": "روز بزرگداشت صائب تبریزی",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1420-04-12",
    "title": "شهادت امام علی النقی (ع) (۳ رجب)",
    "kind": "religious",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1420-04-12",
    "title": "شلیک به پرواز 655 ایران ایر توسط ناو وینسنس [ 1367 خورشیدی ]",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1420-04-14",
    "title": "روز قلم",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1420-04-15",
    "title": "جشن خام خواری",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1420-04-19",
    "title": "ولادت امام محمد تقی (ع) (۱۰ رجب)",
    "kind": "religious",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1420-04-22",
    "title": "ولادت امام علی (ع) و روز پدر (۱۳ رجب)",
    "kind": "religious",
    "isOffDay": true,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1420-04-24",
    "title": "وفات حضرت زینب (س) (۱۵ رجب)",
    "kind": "religious",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1420-04-25",
    "title": "روز بهزیستی و تامین اجتماعی",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1420-04-27",
    "title": "اعلام پذیرش قطعنامه 598 شورای امنیت از سوی ایران [ 1367 خورشیدی ]",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1420-05-03",
    "title": "اَمردادشهادت امام موسی کاظم (ع) (۲۵ رجب)",
    "kind": "religious",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1420-05-05",
    "title": "اَمردادمبعث رسول اکرم (ص) (۲۷ رجب)",
    "kind": "religious",
    "isOffDay": true,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1420-05-07",
    "title": "اَمرداداَمرداد روز،جشن اَمردادگان",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1420-05-08",
    "title": "اَمردادروز بزرگداشت شیخ شهاب الدین سهروردی",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1420-05-10",
    "title": "اَمردادجشن چله تابستان",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1420-05-11",
    "title": "اَمردادولادت سالار شهیدان، امام حسین (ع) و روز پاسدار (۳ شعبان)",
    "kind": "religious",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1420-05-11",
    "title": "اَمردادآغاز هفته جهانی شیردهی",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1420-05-12",
    "title": "اَمردادولادت حضرت ابوالفضل العباس (ع) و روز جانباز (۴ شعبان)",
    "kind": "religious",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1420-05-13",
    "title": "اَمردادولادت امام زین العابدین (ع) (۵ شعبان)",
    "kind": "religious",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1420-05-14",
    "title": "اَمردادسالروز صدور فرمان مشروطیت",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1420-05-17",
    "title": "اَمردادروز خبرنگار",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1420-05-19",
    "title": "اَمردادولادت حضرت علی اکبر (ع) و روز جوان (۱۱ شعبان)",
    "kind": "religious",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1420-05-23",
    "title": "اَمردادولادت حضرت قائم عجل الله تعالی فرجه و جشن نیمه شعبان (۱۵ شعبان)",
    "kind": "religious",
    "isOffDay": true,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1420-05-23",
    "title": "اَمردادروز جهانی چپ دست ها",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1420-05-28",
    "title": "اَمردادسالروز وقایع پس از برکناری محمد مصدق‌السلطنه",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1420-05-28",
    "title": "اَمردادسالروز فاجعه آتش زدن سینما رکس آبادان",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1420-05-29",
    "title": "اَمردادروز جهانی عکاسی",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1420-06-01",
    "title": "روز بزرگداشت ابوعلی سینا و روز پزشک",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1420-06-02",
    "title": "آغاز هفته دولت",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1420-06-04",
    "title": "زادروز کوروش بزرگ",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1420-06-04",
    "title": "شهریور روز،جشن شهریورگان",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1420-06-05",
    "title": "روز بزرگداشت محمدبن زکریای رازی و روز داروساز",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1420-06-11",
    "title": "روز ملی صنعت چاپ",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1420-06-13",
    "title": "روز بزرگداشت ابوریحان بیرونی",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1420-06-20",
    "title": "روز جهانی پیشگیری از خودکشی",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1420-06-21",
    "title": "روز سینما",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1420-06-21",
    "title": "حمله به برج‌های دوقلوی مرکز تجارت جهانی",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1420-06-22",
    "title": "ولادت امام حسن مجتبی (ع) (۱۵ رمضان)",
    "kind": "religious",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1420-06-25",
    "title": "شب قدر (۱۸ رمضان)",
    "kind": "religious",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1420-06-26",
    "title": "ضربت خوردن حضرت علی (ع) (۱۹ رمضان)",
    "kind": "religious",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1420-06-27",
    "title": "روز شعر و ادب پارسی و روز بزرگداشت استاد شهریار",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1420-06-28",
    "title": "شهادت حضرت علی (ع) (۲۱ رمضان)",
    "kind": "religious",
    "isOffDay": true,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1420-06-29",
    "title": "شب قدر (۲۲ رمضان)",
    "kind": "religious",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1420-06-31",
    "title": "آغاز هفته دفاع مقدس",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1420-06-31",
    "title": "روز جهانی صلح",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1420-07-01",
    "title": "آغاز حمله مغول به ایران در پاییز 598 خورشیدی",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1420-07-04",
    "title": "روز گرامیداشت سربازان وطن",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1420-07-06",
    "title": "روز جهانی جهانگردی",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1420-07-06",
    "title": "عید سعید فطر (۱ شوال)",
    "kind": "religious",
    "isOffDay": true,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1420-07-07",
    "title": "روز آتش نشانی و ایمنی",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1420-07-07",
    "title": "تعطیل به مناسبت عید سعید فطر (۲ شوال)",
    "kind": "religious",
    "isOffDay": true,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1420-07-07",
    "title": "روز بزرگداشت شمس تبریزی",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1420-07-08",
    "title": "روز بزرگداشت مولوی",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1420-07-09",
    "title": "روز جهانی ناشنوایان",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1420-07-09",
    "title": "روز جهانی ترجمه و مترجم",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1420-07-10",
    "title": "مهر روز،جشن مهرگان",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1420-07-10",
    "title": "روز جهانی سالمندان",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1420-07-13",
    "title": "آغاز هفته جهانی فضا",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1420-07-14",
    "title": "روز دامپزشکی",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1420-07-14",
    "title": "روز جهانی معلم",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1420-07-16",
    "title": "روز ملی کودک",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1420-07-18",
    "title": "روز جهانی پست",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1420-07-19",
    "title": "روز جهانی مبارزه با حکم اعدام",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1420-07-20",
    "title": "روز بزرگداشت حافظ",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1420-07-20",
    "title": "روز جهانی دختر",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1420-07-21",
    "title": "روز پیروزی کاوه و فریدون بر ضحاک",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1420-07-23",
    "title": "روز جهانی استاندارد",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1420-07-24",
    "title": "روز جهانی عصای سفید",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1420-07-25",
    "title": "روز جهانی غذا",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1420-07-26",
    "title": "روز تربیت بدنی و ورزش",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1420-07-26",
    "title": "روز جهانی ریشه کنی فقر",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1420-07-28",
    "title": "زادروز ستارخان ملقب به سردار ملی و از سرداران جنبش مشروطه ایران",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1420-07-29",
    "title": "روز ملی کوهنورد",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1420-07-30",
    "title": "شهادت امام جعفر صادق (ع) (۲۵ شوال)",
    "kind": "religious",
    "isOffDay": true,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1420-08-01",
    "title": "روز آمار و برنامه ریزی",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1420-08-01",
    "title": "روز بزرگداشت ابوالفضل بیهقی، تاریخ‌نگار و نویسنده ایرانی",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1420-08-06",
    "title": "ولادت حضرت معصومه (س)، روز دختران (۱ ذوالقعده)",
    "kind": "religious",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1420-08-07",
    "title": "سالروز ورود کوروش بزرگ به بابل در سال 539 پیش از میلاد",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1420-08-08",
    "title": "روز ملی محیط بان",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1420-08-10",
    "title": "آبان روز، جشن آبانگان",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1420-08-14",
    "title": "روز ملّی مازندران",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1420-08-15",
    "title": "جشن میانه پاییز",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1420-08-16",
    "title": "ولادت امام رضا (ع) (۱۱ ذوالقعده)",
    "kind": "religious",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1420-08-18",
    "title": "روز ملی کیفیت",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1420-08-24",
    "title": "روز کتاب و کتابخوانی",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1420-08-24",
    "title": "روز جهانی دیابت",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1420-08-27",
    "title": "روز جهانی دانش آموز",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1420-08-29",
    "title": "روز جهانی آقایان",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1420-08-30",
    "title": "روز جهانی کودک",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1420-09-01",
    "title": "آذر جشن",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1420-09-05",
    "title": "روز بسیج مستضعفان",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1420-09-05",
    "title": "شهادت امام محمد تقی (ع) (۳۰ ذوالقعده)",
    "kind": "religious",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1420-09-05",
    "title": "روز جهانی مبارزه با خشونت علیه زنان",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1420-09-07",
    "title": "سالروز عملیات مروارید و روز نیروی دریایی ارتش",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1420-09-09",
    "title": "جشن آذرگان ،آذر روز",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1420-09-11",
    "title": "روز جهانی ایدز",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1420-09-12",
    "title": "شهادت امام محمد باقر (ع) (۷ ذوالحجه)",
    "kind": "religious",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1420-09-13",
    "title": "روز صنعت بیمه",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1420-09-13",
    "title": "روز جهانی معلولان (کم‌توانان)",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1420-09-14",
    "title": "روز عرفه (۹ ذوالحجه)",
    "kind": "religious",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1420-09-15",
    "title": "عید سعید قربان (۱۰ ذوالحجه)",
    "kind": "religious",
    "isOffDay": true,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1420-09-15",
    "title": "روز حسابدار",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1420-09-20",
    "title": "ولادت امام علی النقی (ع) (۱۵ ذوالحجه)",
    "kind": "religious",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1420-09-20",
    "title": "روز جهانی حقوق بشر",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1420-09-21",
    "title": "روز جهانی کوهستان",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1420-09-23",
    "title": "عید سعید غدیر خم (۱۸ ذوالحجه)",
    "kind": "religious",
    "isOffDay": true,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1420-09-25",
    "title": "روز پژوهش و فناوری",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1420-09-25",
    "title": "ولادت امام موسی کاظم (ع) (۲۰ ذوالحجه)",
    "kind": "religious",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1420-09-30",
    "title": "جشن شب یلدا، شب چلّه",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1420-10-01",
    "title": "روز میلاد خورشید؛ جشن خرم روز، نخستین جشن دیگان",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1420-10-03",
    "title": "سالروز عملیات کربلای 4 [1365 خورشیدی]",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1420-10-05",
    "title": "زمین لرزه ی بم [1382 خورشیدی]",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1420-10-05",
    "title": "جشن کریسمس",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1420-10-05",
    "title": "سالروز شهادت اَشو زرتشت، اَبَراِنسان بزرگ تاریخ",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1420-10-05",
    "title": "روز بزرگداشت دوستی",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1420-10-08",
    "title": "دی به آذر روز، دومین جشن دیگان",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1420-10-09",
    "title": "اعدام میهن‌پرستان آذری در تبریز توسط قوای اشغالگر روس [1290 خورشیدی]",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1420-10-12",
    "title": "جشن آغاز سال نو میلادی",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1420-10-12",
    "title": "روز حافظ",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1420-10-13",
    "title": "تاسوعای حسینی (۹ محرم)",
    "kind": "religious",
    "isOffDay": true,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1420-10-13",
    "title": "شهادت سردار حاج قاسم سلیمانی [1398 خورشیدی]",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1420-10-14",
    "title": "عاشورای حسینی (۱۰ محرم)",
    "kind": "religious",
    "isOffDay": true,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1420-10-15",
    "title": "دی به مهر روز، سومین جشن دیگان",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1420-10-16",
    "title": "شهادت امام زین العابدین (ع) (۱۲ محرم)",
    "kind": "religious",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1420-10-16",
    "title": "غرق شدن کشتی سانچی [1396 خورشیدی]",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1420-10-18",
    "title": "شلیک به پرواز 752 هواپیمایی اوکراین [1398 خورشیدی]",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1420-10-19",
    "title": "درگذشت اکبر هاشمی رفسنجانی [1395 خورشیدی]",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1420-10-20",
    "title": "قتل امیرکبیر به دستور ناصرالدین شاه قاجار [1230 خورشیدی]",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1420-10-23",
    "title": "دی به دین روز، چهارمین جشن دیگان",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1420-10-30",
    "title": "آتش‌سوزی و فروریختن ساختمان پلاسکو [1395 خورشیدی]",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1420-11-01",
    "title": "زادروز فردوسی",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1420-11-02",
    "title": "بهمن روز، جشن بهمنگان",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1420-11-06",
    "title": "بزرگداشت صفی‌الدین اُرمَوی و روز موسیقی ایرانی",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1420-11-10",
    "title": "جشن سده، گرامیداشتِ کشف آتش به دستِ هوشنگ شاه",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1420-11-12",
    "title": "بازگشت امام خمینی (ره) به ایران",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1420-11-15",
    "title": "جشن میانه زمستان",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1420-11-19",
    "title": "روز نیروی هوایی",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1420-11-22",
    "title": "پیروزی انقلاب اسلامی",
    "kind": "official",
    "isOffDay": true,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1420-11-24",
    "title": "اربعین حسینی (۲۰ صفر)",
    "kind": "religious",
    "isOffDay": true,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1420-11-26",
    "title": "جشن ولنتاین",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1420-11-29",
    "title": "جشن سپندارمذگان و روز عشق",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1420-11-29",
    "title": "فاجعه انفجار قطار نیشابور [1382 خورشیدی]",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1420-12-02",
    "title": "رحلت رسول اکرم؛شهادت امام حسن مجتبی (ع) (۲۸ صفر)",
    "kind": "religious",
    "isOffDay": true,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1420-12-03",
    "title": "شهادت امام رضا (ع) (۳۰ صفر)",
    "kind": "religious",
    "isOffDay": true,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1420-12-04",
    "title": "هجرت پیامبر اکرم از مکه به مدینه (۱ ربیع الاول)",
    "kind": "religious",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1420-12-05",
    "title": "روز بزرگداشت خواجه نصیر الدین طوسی و روز مهندس",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1420-12-07",
    "title": "سالروز استقلال کانون وکلای دادگستری و روز وکیل مدافع",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1420-12-11",
    "title": "شهادت امام حسن عسکری (ع) (۸ ربیع الاول)",
    "kind": "religious",
    "isOffDay": true,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1420-12-15",
    "title": "روز درختکاری",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1420-12-15",
    "title": "میلاد رسول اکرم به روایت اهل سنت (۱۲ ربیع الاول)",
    "kind": "religious",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1420-12-18",
    "title": "روز جهانی زنان",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1420-12-20",
    "title": "میلاد رسول اکرم و امام جعفر صادق (ع) (۱۷ ربیع الاول)",
    "kind": "religious",
    "isOffDay": true,
    "recurring": false,
    "hijriBased": true
  },
  {
    "jalaliDate": "1420-12-24",
    "title": "روز جهانی عدد پی π",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1420-12-25",
    "title": "پایان سرایش شاهنامه",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1420-12-25",
    "title": "روز بزرگداشت اختر چرخ ادب، پروین اعتصامی",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1420-12-29",
    "title": "روز ملی شدن صنعت نفت ایران",
    "kind": "official",
    "isOffDay": true,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1420-12-30",
    "title": "آخرین روز سال",
    "kind": "official",
    "isOffDay": true,
    "recurring": false,
    "hijriBased": false
  },
  {
    "jalaliDate": "1420-12-30",
    "title": "روز جهانی شادی",
    "kind": "occasion",
    "isOffDay": false,
    "recurring": false,
    "hijriBased": false
  }
]
