'use client'

import { useState } from 'react'
import { 
  BookOpen, 
  Search, 
  Smartphone, 
  Globe, 
  Clock, 
  ArrowLeftRight, 
  UserCheck, 
  ClipboardCheck, 
  AlertTriangle, 
  ShieldAlert, 
  MessageSquare, 
  Bot, 
  Trophy, 
  Radio,
  FileText,
  HelpCircle,
  ChevronLeft,
  ChevronRight,
  Info
} from 'lucide-react'
import { toFa } from '@/lib/fa'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface DocSection {
  id: string
  title: string
  icon: React.ElementType
  category: string
  description: string
  webGuide: string[]
  mobileGuide: string[]
  rules: string[]
}

const DOCS_DATA: DocSection[] = [
  {
    id: 'dashboard',
    title: 'داشبورد اصلی و دسترسی سریع',
    icon: Globe,
    category: 'عمومی',
    description: 'آشنایی با پیشخوان کاربری سوپراپ خط ۱ مترو تهران و نحوه دسترسی به ابزارهای مختلف.',
    webGuide: [
      'داشبورد دسکتاپ (SCADA): مانیتورینگ کلی شبکه، نقشه‌ی شماتیک مسیر خط ۱، لیست قطارهای آنلاین و وقایع بحرانی.',
      'داشبورد موبایل (PWA): خوش‌آمدگویی پویا، کارت شیفت امروز با دکمه حضور و غیاب، شبکه میانبرهای ۱۲تایی با آیکون‌های رنگی.',
      'بنرهای داینامیک: اطلاعیه‌های مهم سازمانی که توسط مدیران آپلود می‌شوند در بالای داشبورد ظاهر می‌شوند.'
    ],
    mobileGuide: [
      'در نسخه موبایل، منوی اصلی شامل ۱۲ میانبر با کارایی مجزا و سریع است.',
      'کارت وضعیت شیفت به صورت داینامیک در وسط صفحه قرار دارد و با لمس آن مستقیماً به لوحه منتقل می‌شوید.'
    ],
    rules: [
      'نمایش اطلاعات داشبورد بر اساس سطح دسترسی (ادمین، راهبر، دیسپاچر) شخصی‌سازی می‌شود.'
    ]
  },
  {
    id: 'shifts',
    title: 'لوحه شیفت و تقویم پرسنلی',
    icon: Clock,
    category: 'شیفت‌ها',
    description: 'مدیریت شیفت‌های کاری، ساعت ورود و خروج و لوحه اعزام روزانه راهبران.',
    webGuide: [
      'مشاهده تقویم شمسی ماهانه با مشخص بودن نوع شیفت (روزکار، شب‌کار، استراحت، مرخصی).',
      'مدیران می‌توانند لوحه‌های اکسل را از بخش «بارگذاری اکسل لوحه» آپلود کنند تا به صورت خودکار بین راهبران تقسیم شود.',
      'صادرات فایل لوحه به صورت اکسل و چاپی (PDF).'
    ],
    mobileGuide: [
      'مشاهده تقویم شیفت در بخش «لوحه شیفت» به همراه جزییات ساعت حرکت قطار و شماره واگن محول شده.',
      'امکان خروجی گرفتن و اشتراک‌گذاری تقویم شیفت در گالری گوشی یا پیام‌رسان‌ها.'
    ],
    rules: [
      'ساعت کاری شیفت‌های استاندارد روزکار ۰۷:۰۰ الی ۱۹:۰۰ و شب‌کار ۱۹:۰۰ الی ۰۷:۰۰ روز بعد است.',
      'هرگونه مغایرت در لوحه باید بلافاصله از طریق بخش بازخورد به مدیریت گزارش داده شود.'
    ]
  },
  {
    id: 'swap',
    title: 'درخواست تعویض شیفت',
    icon: ArrowLeftRight,
    category: 'شیفت‌ها',
    description: 'نحوه تبادل شیفت کاری بین راهبران بر اساس قوانین و موتور ایمنی سیستم.',
    webGuide: [
      'ثبت درخواست جدید با انتخاب تاریخ شیفت خود و همکار جایگزین.',
      'موتور هوشمند قوانین (قانون استراحت کافی، شیفت‌های متوالی و همتایی نقش) را قبل از ارسال بررسی می‌کند.',
      'تایید نهایی درخواست توسط مدیر/سرپرست خط انجام می‌شود.'
    ],
    mobileGuide: [
      'بخش «تبادل شیفت» -> «صندوق ورودی» برای پذیرش درخواست همکاران.',
      'در صورت نقض قوانین ایمنی، دکمه تایید قفل شده و نوع خطای قوانین به شما نمایش داده می‌شود.'
    ],
    rules: [
      'قانون استراحت کافی: حداقل فاصله بین پایان یک شیفت تا شروع شیفت بعدی باید ۱۲ ساعت باشد.',
      'قانون شیفت متوالی: هیچ راهبری مجاز به حضور در ۳ شیفت متوالی بدون استراحت نیست.',
      'همتایی نقش: راهبر پایه ۱ فقط می‌تواند با راهبر پایه ۱ هم‌تراز خود جابجا شود.'
    ]
  },
  {
    id: 'attendance',
    title: 'حضور و غیاب هوشمند و Geofencing',
    icon: UserCheck,
    category: 'عملیات',
    description: 'ثبت ورود و خروج به ایستگاه‌ها و دپو بر اساس موقعیت جغرافیایی گوشی.',
    webGuide: [
      'داشبورد مانیتورینگ حضور و غیاب برای دیسپاچینگ جهت مشاهده پرسنل حاضر در خط به همراه ثبت زمان دقیق.',
      'امکان تصحیح دستی ساعات حضور و غیاب توسط مدیر سیستم برای موارد خاص.'
    ],
    mobileGuide: [
      'در صفحه «حضور و غیاب»، سیستم با استفاده از GPS گوشی بررسی می‌کند که آیا در محدوده مجاز ایستگاه (شعاع ۵۰ متری) قرار دارید یا خیر.',
      'با قرارگیری در محدوده مجاز، دکمه «ثبت ورود» یا «ثبت خروج» فعال می‌شود.',
      'امکان آپلود عکس سلفی یا اسکن اثر انگشت جهت احراز هویت زیستی در صورت فعال بودن توسط مدیر.'
    ],
    rules: [
      'ثبت ورود تا ۱۵ دقیقه تاخیر مجاز است. بیش از آن به عنوان تاخیر در کارنامه ثبت می‌شود.',
      'غیرفعال کردن موقعیت مکانی گوشی مانع از ثبت حضور و غیاب خواهد شد.'
    ]
  },
  {
    id: 'checklists',
    title: 'چک‌لیست قبل از حرکت قطار',
    icon: ClipboardCheck,
    category: 'عملیات',
    description: 'بررسی ایمنی فنی قطار قبل از خروج از دپو و شروع سفر در خط ۱.',
    webGuide: [
      'تعریف فرم‌ها و سوالات چک‌لیست توسط سوپروایزر فنی از پنل «فرم‌ساز».',
      'گزارش‌گیری لحظه‌ای از چک‌لیست‌های پر شده و نمایش اخطارهای بحرانی به OCC.'
    ],
    mobileGuide: [
      'راهبر در کابین قطار موظف است تمام بندهای چک‌لیست (مانند تست ترمز، سیستم تهویه، درها و رادیو) را تیک بزند.',
      'در صورت وجود نقص فنی بحرانی، دکمه تایید نهایی مسدود شده و سریعاً به دیسپاچر گزارش خرابی ارسال می‌شود.'
    ],
    rules: [
      'تکمیل چک‌لیست قبل از خروج قطار از پایانه یا دپوی فتح‌آباد اجباری است.',
      'ثبت تصاویر موارد دارای نقص فنی در چک‌لیست الزامی می‌باشد.'
    ]
  },
  {
    id: 'tickets',
    title: 'ثبت خرابی و تیکتینگ تصاویر',
    icon: AlertTriangle,
    category: 'عملیات',
    description: 'گزارش عیوب قطار، سوزن‌ها، علائم الکتریکی و ایستگاه‌ها با پیوست تصویر.',
    webGuide: [
      'مشاهده کارتابل تیکت‌های دریافتی، اولویت‌بندی بر اساس شدت (بحرانی، مهم، عادی) و ارجاع به اکیپ‌های فنی.',
      'ثبت اقدامات اصلاحی و تغییر وضعیت تیکت به «حل شده».'
    ],
    mobileGuide: [
      'لمس «اعلام خرابی» -> انتخاب دسته‌بندی خرابی (ناوگان، تاسیسات، خط و ابنیه، سیگنالینگ).',
      'آپلود مستقیم عکس خرابی از دوربین یا گالری گوشی.',
      'افزودن توضیحات متنی و ثبت لوکیشن یا شماره ایستگاه مربوطه.'
    ],
    rules: [
      'تیکت‌های با عنوان «بحرانی» بلافاصله در نمایشگر مرکز کنترل (OCC) به صدا در می‌آیند.',
      'تصاویر آپلود شده باید واضح و ترجیحاً شامل زاویه کلی و جزئی عیب باشند.'
    ]
  },
  {
    id: 'bulletins',
    title: 'بخشنامه‌های ایمنی و امضا الکترونیک',
    icon: FileText,
    category: 'آموزش',
    description: 'ابلاغیه‌های حقوقی و ایمنی که مطالعه و امضای دیجیتال آن‌ها برای پرسنل الزامی است.',
    webGuide: [
      'ایجاد بخشنامه جدید توسط مدیر به همراه تعیین مهلت مطالعه و الصاق فایل‌های ضمیمه (عکس/ویدیو/PDF).',
      'مشاهده گزارش کامل پرسنلی که بخشنامه را مطالعه و امضا کرده‌اند.'
    ],
    mobileGuide: [
      'بخشنامه‌های ایمنی جدید به محض ورود به برنامه روی صفحه قفل می‌شوند.',
      'راهبر باید تا انتهای متن اسکرول کرده و دکمه «مطالعه کردم و متعهد می‌شوم» را امضا کند.',
      'پس از امضا، رسید دیجیتالی شامل زمان دقیق و شناسه دستگاه ثبت می‌شود.'
    ],
    rules: [
      'مطالعه بخشنامه‌های ایمنی قفل‌شونده غیرقابل صرف‌نظر است و برنامه تا زمان امضا قفل خواهد ماند.',
      'رسید امضا به صورت سند قانونی در پایگاه داده ذخیره می‌شود.'
    ]
  },
  {
    id: 'comms-tetra',
    title: 'ارتباطات، بی‌سیم تترا و کنفرانس',
    icon: Radio,
    category: 'ارتباطات',
    description: 'شبیه‌ساز پیشرفته بی‌سیم Tetra و برگزاری اتاق‌های گفتگوی زنده پرسنلی.',
    webGuide: [
      'پنل پیام‌رسانی بلادرنگ گروهی و انفرادی تحت SSE.',
      'پیام‌رسانی یکپارچه با سیستم چت پرسنل.'
    ],
    mobileGuide: [
      'شبیه‌ساز بی‌سیم تترا: امکان تعریف فرکانس و کانال‌های رادیویی، دکمه فشرده‌سازی جهت صحبت (PTT) و پخش افکت بوق بی‌سیم.',
      'کنفرانس صوتی: پیوستن به کانال صوتی آنلاین برای هماهنگی سریع هنگام بروز سانحه در خط ۱.'
    ],
    rules: [
      'استفاده از شبیه‌ساز بی‌سیم در طول راهبری قطار فقط در موارد اضطراری مجاز است.',
      'تمام ارتباطات چت و صوتی ثبت شده و تحت نظارت امنیتی مرکز کنترل است.'
    ]
  },
  {
    id: 'ai-helper',
    title: 'دستیار هوشمند علمی (AI)',
    icon: Bot,
    category: 'آموزش',
    description: 'هوش مصنوعی سخنگو و آموزش‌دیده بر اساس کتابچه عملیات و آیین‌نامه مترو.',
    webGuide: [
      'چت زنده با هوش مصنوعی در مرورگر جهت پرسش‌های آیین‌نامه‌ای، فرمول‌ها یا کدهای خطا.',
      'قابلیت جستجوی سریع در اسناد پیوست شده.'
    ],
    mobileGuide: [
      'دسترسی سریع به دستیار هوشمند در اپلیکیشن.',
      'پشتیبانی از تشخیص صوت فارسی جهت طرح سریع سوالات هنگام راهبری در سناریوهای آموزشی.'
    ],
    rules: [
      'پاسخ‌های هوش مصنوعی صرفاً جنبه آموزشی و راهنمایی دارد؛ در شرایط بحرانی دستورات دیسپاچر OCC اولویت مطلق دارد.'
    ]
  },
  {
    id: 'performance',
    title: 'ارزیابی عملکرد و گیمیفیکیشن',
    icon: Trophy,
    category: 'عمومی',
    description: 'سیستم ثبت کارنامه، مدال‌ها، امتیازات تشویقی و جرایم انضباطی.',
    webGuide: [
      'ثبت نمره ارزیابی، مدال یا جریمه برای پرسنل توسط سرپرستان.',
      'داشبورد مدیریت قوانین گیمیفیکیشن و جدول رده‌بندی کل پرسنل خط ۱.'
    ],
    mobileGuide: [
      'مشاهده امتیازات تجمعی، رتبه فعلی در بین پرسنل هم‌رده و مدال‌های کسب شده (مانند راهبر نمونه، بدون خطا و...).',
      'امکان ثبت اعتراض نسبت به جرایم ثبت شده به همراه پیوست سند.'
    ],
    rules: [
      'امتیاز تشویقی منجر به ارتقای رتبه و اولویت در انتخاب لوحه‌های ترجیحی شیفت می‌شود.',
      'جرایم انضباطی به صورت مستقیم در حقوق و پاداش پرسنل تاثیرگذار خواهد بود.'
    ]
  }
]

export default function DocsPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('همه')
  const [activeSection, setActiveSection] = useState<string>(DOCS_DATA[0].id)

  const categories = ['همه', 'عمومی', 'شیفت‌ها', 'عملیات', 'آموزش', 'ارتباطات']

  const filteredDocs = DOCS_DATA.filter(doc => {
    const matchesSearch = doc.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          doc.description.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = selectedCategory === 'همه' || doc.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  const currentDoc = DOCS_DATA.find(d => d.id === activeSection) || DOCS_DATA[0]

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 lg:p-6 transition-all duration-300" dir="rtl">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border/40 pb-5">
        <div>
          <h1 className="text-2xl font-black text-foreground flex items-center gap-2">
            <BookOpen className="size-6 text-accent" />
            <span>راهنمای جامع و مستندات سوپراپ</span>
          </h1>
          <p className="text-xs text-foreground-muted mt-1.5">
            مستندات، دستورالعمل‌های استفاده و آموزش گام‌به‌گام تمام قابلیت‌های نسخه وب و موبایل.
          </p>
        </div>
      </div>

      {/* Filter and Search controls */}
      <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
          {categories.map(cat => (
            <Button
              key={cat}
              variant={selectedCategory === cat ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedCategory(cat)}
              className={cn("rounded-full text-xs transition-all", selectedCategory === cat ? "bg-accent hover:bg-accent/90 text-white font-bold" : "text-foreground-muted")}
            >
              {cat}
            </Button>
          ))}
        </div>
        <div className="relative w-full md:w-80">
          <Search className="absolute right-3 top-2.5 size-4 text-foreground-muted" />
          <Input
            placeholder="جستجو در مستندات..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pr-9 rounded-full text-xs h-9 bg-surface-container-low"
          />
        </div>
      </div>

      {/* Layout Split */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Right Sidebar - Module List */}
        <div className="lg:col-span-4 bg-surface-container-low/60 border border-border-subtle/50 rounded-2xl p-4 space-y-2">
          <span className="text-[11px] font-bold text-foreground-muted px-2 block mb-2 font-sans">بخش‌های راهنما</span>
          {filteredDocs.length > 0 ? (
            filteredDocs.map((doc) => {
              const Icon = doc.icon
              return (
                <button
                  key={doc.id}
                  onClick={() => setActiveSection(doc.id)}
                  className={cn(
                    "w-full text-right p-3 rounded-xl flex items-center justify-between transition-all group",
                    activeSection === doc.id 
                      ? "bg-accent/10 border border-accent/20 text-accent font-bold" 
                      : "border border-transparent hover:bg-surface-container-high/40 text-foreground-muted hover:text-foreground"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <div className={cn("size-8 rounded-lg flex items-center justify-center border", 
                      activeSection === doc.id ? "bg-accent/10 border-accent/20 text-accent" : "bg-surface-container-high/60 border-border/10"
                    )}>
                      <Icon className="size-4" />
                    </div>
                    <div className="text-right">
                      <span className="text-xs block font-bold">{doc.title}</span>
                      <span className="text-[9px] text-foreground-muted block mt-0.5">{doc.category}</span>
                    </div>
                  </div>
                  <ChevronLeft className={cn("size-4 transition-transform", activeSection === doc.id ? "translate-x-0.5 text-accent" : "text-foreground-muted/50 group-hover:translate-x-0.5")} />
                </button>
              )
            })
          ) : (
            <div className="text-center py-8 text-xs text-foreground-muted">موردی یافت نشد.</div>
          )}
        </div>

        {/* Left Pane - Content Details */}
        <div className="lg:col-span-8 space-y-6">
          {currentDoc ? (
            <Card className="bg-surface-container-low/40 border-border-subtle/50 rounded-3xl overflow-hidden shadow-sm">
              <CardHeader className="border-b border-border/10 p-6">
                <div className="flex items-center gap-3 mb-2">
                  <Badge variant="outline" className="text-[9px] px-2 py-0.5 bg-accent/5 border-accent/20 text-accent font-bold rounded-full">
                    {currentDoc.category}
                  </Badge>
                </div>
                <CardTitle className="text-lg font-black text-foreground flex items-center gap-2">
                  {(() => {
                    const Icon = currentDoc.icon
                    return <Icon className="size-5 text-accent" />
                  })()}
                  <span>{currentDoc.title}</span>
                </CardTitle>
                <CardDescription className="text-xs text-foreground-muted mt-2 leading-relaxed font-medium">
                  {currentDoc.description}
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                
                {/* Web Guide */}
                <div className="space-y-3">
                  <h3 className="text-xs font-black text-foreground flex items-center gap-2 border-b border-border/10 pb-2">
                    <Globe className="size-4 text-emerald-500" />
                    <span>راهنمای نسخه وب‌اپلیکیشن (دسکتاپ و PWA)</span>
                  </h3>
                  <ul className="space-y-2 pr-4 list-disc list-outside text-foreground-muted text-xs leading-relaxed">
                    {currentDoc.webGuide.map((step, idx) => (
                      <li key={idx} className="font-sans">{step}</li>
                    ))}
                  </ul>
                </div>

                {/* Mobile Guide */}
                <div className="space-y-3">
                  <h3 className="text-xs font-black text-foreground flex items-center gap-2 border-b border-border/10 pb-2">
                    <Smartphone className="size-4 text-blue-500" />
                    <span>راهنمای نسخه موبایل (اندروید و iOS بومی)</span>
                  </h3>
                  <ul className="space-y-2 pr-4 list-disc list-outside text-foreground-muted text-xs leading-relaxed">
                    {currentDoc.mobileGuide.map((step, idx) => (
                      <li key={idx} className="font-sans">{step}</li>
                    ))}
                  </ul>
                </div>

                {/* General Rules & Constraints */}
                <div className="bg-surface-container-high/30 border border-border-subtle/50 rounded-2xl p-4 space-y-2">
                  <h4 className="text-[11px] font-black text-foreground flex items-center gap-1.5">
                    <Info className="size-3.5 text-accent" />
                    <span>قوانین ایمنی و ضوابط عملیاتی</span>
                  </h4>
                  <ul className="space-y-1.5 pr-2 list-decimal list-inside text-foreground-muted text-[10.5px] leading-relaxed">
                    {currentDoc.rules.map((rule, idx) => (
                      <li key={idx} className="font-sans">{rule}</li>
                    ))}
                  </ul>
                </div>

              </CardContent>
            </Card>
          ) : (
            <div className="bg-surface-container-low/40 border border-border-subtle/50 rounded-3xl p-12 text-center text-xs text-foreground-muted">
              جهت مشاهده جزییات، یکی از بخش‌های راهنما را از لیست سمت راست انتخاب کنید.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
