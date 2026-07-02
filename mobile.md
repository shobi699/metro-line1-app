# سناریوی فنی جامع — اپلیکیشن پنل مدیریتی موبایل با سیستم شخصی‌سازی رابط کاربری (UI Builder)

نسخه: ۱.۱ | تاریخ: تیر ۱۴۰۵ | نوع سند: معماری و سناریوی پیاده‌سازی فنی — شامل موتور کامل Page Builder، Form Builder و سیستم چیدمان/اندازه‌دهی

---

## ۱. معرفی و دامنه پروژه

این سند سناریوی فنی کامل برای یک اپلیکیشن موبایل پنل مدیریتی (Admin/Management Panel) با **۳۰ صفحه** را شرح می‌دهد که مهم‌ترین ویژگی متمایزکننده‌ی آن، وجود یک **موتور شخصی‌سازی رابط کاربری (UI Customization Engine)** شبیه به یک صفحه‌ساز (Page Builder) است. مدیران سیستم بدون نیاز به انتشار نسخه جدید اپ (بدون Release در استور)، می‌توانند منو، داشبورد، سطوح دسترسی و ظاهر برنامه را به‌صورت زنده تغییر دهند.

### هدف‌های فنی کلیدی
- تفکیک کامل **محتوا و چیدمان (Layout/Config)** از **کد برنامه (Binary)** با رویکرد Server-Driven UI
- تغییرات real-time بدون نیاز به به‌روزرسانی اپ از استور
- کنترل دسترسی چندسطحی (نقش → مجوز → منو → صفحه → ابزارک)
- عملکرد بالا حتی با پیکربندی پویا (کش، Lazy Load، Skeleton)
- معماری مقیاس‌پذیر برای افزودن صفحات/ابزارک‌های جدید بدون تغییر Core

---

## ۲. پشته فناوری پیشنهادی (Tech Stack)

| لایه | فناوری | دلیل انتخاب |
|---|---|---|
| اپلیکیشن موبایل | React Native (Expo, TypeScript) | یک کدبیس برای iOS/Android، اکوسیستم غنی، OTA Update با EAS |
| مدیریت وضعیت | Zustand + TanStack Query (React Query) | جداسازی state سبک UI از state سرور، کش خودکار API |
| فرم‌سازی داینامیک | React Hook Form + Zod | اعتبارسنجی schema-based سازگار با فرم‌های پویا |
| ناوبری | React Navigation (Dynamic Stack/Tab از روی JSON) | امکان ساخت منو و مسیرها به‌صورت داینامیک |
| بک‌اند | NestJS (Node.js, TypeScript) | معماری ماژولار، DI، مناسب برای RBAC پیچیده |
| پایگاه داده | PostgreSQL + Prisma ORM | پشتیبانی از JSONB برای ذخیره schema صفحات |
| کش | Redis | کش پیکربندی UI، Session، Rate limiting |
| ارتباط زنده | WebSocket (Socket.io) | همگام‌سازی زنده تغییرات UI Builder بین ادمین‌ها |
| احراز هویت | JWT (Access + Refresh Token) + OTP | امنیت و مدیریت نشست چندجلسه‌ای |
| ذخیره فایل | S3-Compatible Storage (MinIO/Liara/Arvan) | آیکون‌ها، لوگو، تصاویر برند |
| CI/CD | GitHub Actions + EAS Build + Fastlane | استقرار خودکار |
| مانیتورینگ | Sentry + Grafana/Prometheus | ردیابی خطا و عملکرد |

> **نکته معماری:** به‌جای Hardcode کردن منو/داشبورد در کد اپ، تمام این عناصر به‌صورت **JSON Schema نسخه‌بندی‌شده** از سرور دریافت و توسط یک **Renderer عمومی (Dynamic Renderer)** در اپ رندر می‌شوند.

---

## ۳. معماری کلی سیستم

```
┌─────────────────────────────────────────────────────────────┐
│                     اپلیکیشن موبایل (React Native)             │
│  ┌───────────┐  ┌──────────────┐  ┌────────────────────┐    │
│  │ Auth Layer│  │ Dynamic       │  │  Component Registry │    │
│  │           │  │ Renderer      │  │  (Widget/Page مپ)   │    │
│  └─────┬─────┘  └──────┬───────┘  └──────────┬──────────┘    │
│        │               │                      │               │
│  ┌─────▼───────────────▼──────────────────────▼──────────┐   │
│  │        Config Store (Zustand) + Local Cache (MMKV)      │   │
│  └─────────────────────────┬──────────────────────────────┘   │
└────────────────────────────┼──────────────────────────────────┘
                              │ REST/GraphQL + WebSocket
┌────────────────────────────▼──────────────────────────────────┐
│                        API Gateway (NestJS)                     │
│  ┌───────────┐ ┌───────────┐ ┌────────────┐ ┌───────────────┐ │
│  │ Auth       │ │ RBAC       │ │ UI Config   │ │ Business      │ │
│  │ Module     │ │ Module     │ │ Module      │ │ Modules       │ │
│  │            │ │            │ │ (Builder)   │ │ (سفارش/محصول) │ │
│  └─────┬──────┘ └─────┬──────┘ └──────┬──────┘ └───────┬───────┘ │
└────────┼──────────────┼───────────────┼────────────────┼─────────┘
         │              │               │                │
   ┌─────▼─────┐  ┌─────▼─────┐   ┌─────▼─────┐   ┌──────▼─────┐
   │ PostgreSQL│  │  Redis     │   │  S3 Storage│   │  Audit Log │
   └───────────┘  └────────────┘   └────────────┘   └────────────┘
```

### اصل کلیدی: Server-Driven UI (SDUI)
هر صفحه از یک **Schema JSON** تشکیل می‌شود که شامل نوع کامپوننت، خصوصیات (props)، شرط نمایش (visibility rule بر اساس نقش) و ترتیب است. اپ یک `ComponentRegistry` دارد که نام هر کامپوننت را به کامپوننت واقعی React Native مپ می‌کند. این یعنی تیم UI Builder می‌تواند صفحات جدید بسازد بدون اینکه توسعه‌دهنده Native نیاز به Release جدید داشته باشد — به شرطی که کامپوننت پایه از قبل در Registry ثبت شده باشد.

---

## ۴. مدل داده (Database Schema)

### ۴.۱ جداول هسته RBAC

```sql
-- نقش‌ها
CREATE TABLE roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(50) NOT NULL,       -- مدیر کل، فروش، پشتیبانی
  slug VARCHAR(50) UNIQUE NOT NULL,
  is_system BOOLEAN DEFAULT FALSE,  -- نقش‌های سیستمی غیرقابل حذف
  created_at TIMESTAMPTZ DEFAULT now()
);

-- مجوزها (Permissions)
CREATE TABLE permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug VARCHAR(100) UNIQUE NOT NULL,  -- orders.view, orders.edit, ui.builder.manage
  module VARCHAR(50) NOT NULL,
  description VARCHAR(255)
);

CREATE TABLE role_permissions (
  role_id UUID REFERENCES roles(id) ON DELETE CASCADE,
  permission_id UUID REFERENCES permissions(id) ON DELETE CASCADE,
  PRIMARY KEY (role_id, permission_id)
);

CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone VARCHAR(15) UNIQUE NOT NULL,
  password_hash VARCHAR(255),
  role_id UUID REFERENCES roles(id),
  status VARCHAR(20) DEFAULT 'active',
  last_login_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

### ۴.۲ جداول موتور UI Builder

```sql
-- منوها (پویا)
CREATE TABLE menu_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_id UUID REFERENCES menu_items(id),
  label VARCHAR(50) NOT NULL,
  icon VARCHAR(50) NOT NULL,
  route VARCHAR(100) NOT NULL,       -- ارجاع به page_id یا route داخلی
  order_index INT NOT NULL DEFAULT 0,
  is_visible BOOLEAN DEFAULT TRUE,
  required_permission VARCHAR(100),  -- ارجاع به permissions.slug
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- صفحات (هر صفحه یک نسخه از UI Schema)
CREATE TABLE pages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug VARCHAR(100) UNIQUE NOT NULL,   -- dashboard, orders-list, ...
  title VARCHAR(100) NOT NULL,
  layout_type VARCHAR(30) NOT NULL,    -- list | detail | dashboard | form
  status VARCHAR(20) DEFAULT 'draft',  -- draft | published
  current_version_id UUID,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- نسخه‌های Schema صفحه (برای Undo/Rollback و پیش‌نمایش)
CREATE TABLE page_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  page_id UUID REFERENCES pages(id) ON DELETE CASCADE,
  schema_json JSONB NOT NULL,          -- درخت کامپوننت‌ها
  version_number INT NOT NULL,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ابزارک‌های داشبورد
CREATE TABLE dashboard_widgets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  page_id UUID REFERENCES pages(id) ON DELETE CASCADE,
  widget_type VARCHAR(50) NOT NULL,    -- stat_card | chart | list | banner
  title VARCHAR(100),
  size VARCHAR(10) DEFAULT 'md',       -- sm | md | lg
  order_index INT DEFAULT 0,
  is_visible BOOLEAN DEFAULT TRUE,
  config_json JSONB DEFAULT '{}',      -- منبع داده، فیلتر، رنگ
  required_permission VARCHAR(100)
);

-- تنظیمات ظاهری (تم)
CREATE TABLE theme_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID,                      -- برای پشتیبانی چند-سازمانی (SaaS)
  primary_color VARCHAR(20) DEFAULT '#146C6C',
  accent_color VARCHAR(20) DEFAULT '#C98A2C',
  radius INT DEFAULT 12,
  font_size VARCHAR(10) DEFAULT 'md',
  dark_mode_default BOOLEAN DEFAULT FALSE,
  logo_url TEXT,
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- لاگ ممیزی تغییرات UI Builder
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  action VARCHAR(50) NOT NULL,         -- menu.reorder, page.publish, theme.update
  entity_type VARCHAR(50),
  entity_id UUID,
  diff_json JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- کاتالوگ المان‌های قابل استفاده در بوم طراحی (پالت سازنده صفحه)
CREATE TABLE element_definitions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type_key VARCHAR(50) UNIQUE NOT NULL,  -- button, text, image, input, spacer, ...
  category VARCHAR(30) NOT NULL,         -- basic | form | data | media | layout
  label VARCHAR(50) NOT NULL,
  icon VARCHAR(50) NOT NULL,
  default_props JSONB NOT NULL,
  default_layout JSONB NOT NULL,         -- {colSpan:6, rowSpan:1, minW:2, minH:1, maxW:12}
  resizable BOOLEAN DEFAULT TRUE,
  is_active BOOLEAN DEFAULT TRUE
);

-- فرم‌های سفارشی‌ساخته‌شده (مستقل از صفحه، قابل استفاده در چند صفحه)
CREATE TABLE forms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  page_id UUID REFERENCES pages(id) ON DELETE CASCADE,
  title VARCHAR(100) NOT NULL,
  fields_json JSONB NOT NULL,            -- آرایه فیلدها با نوع/اعتبارسنجی/شرط نمایش
  submit_action_json JSONB NOT NULL,     -- {type:"api", method:"POST", endpoint:"/api/orders"}
  status VARCHAR(20) DEFAULT 'draft',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- قالب‌های آماده صفحه (Template Gallery) برای شروع سریع
CREATE TABLE page_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  category VARCHAR(30) NOT NULL,         -- list | form | dashboard | profile | empty
  preview_image_url TEXT,
  schema_json JSONB NOT NULL,
  is_system BOOLEAN DEFAULT TRUE
);
```

### ۴.۳ نمونه Schema یک صفحه (JSONB درون `page_versions.schema_json`)

```json
{
  "page": "orders-list",
  "layout": "list",
  "appBar": { "title": "سفارش‌ها", "actions": ["search", "filter"] },
  "components": [
    {
      "type": "StatRow",
      "id": "cmp_1",
      "visibleFor": ["admin", "sales"],
      "props": { "items": ["today_orders", "pending_orders"] }
    },
    {
      "type": "DataList",
      "id": "cmp_2",
      "layout": { "colSpan": 12, "rowSpan": 6 },
      "props": {
        "source": "/api/orders",
        "itemTemplate": "OrderCard",
        "pagination": { "type": "infinite", "pageSize": 20 }
      }
    },
    {
      "type": "Button",
      "id": "cmp_3",
      "layout": { "colSpan": 6, "rowSpan": 1 },
      "style": { "variant": "primary", "radius": 12 },
      "props": {
        "label": "ثبت سفارش جدید",
        "icon": "plus",
        "action": { "type": "navigate", "target": "order-create" }
      }
    }
  ]
}
```

> هر عنصر (`component`) دو بخش مستقل دارد: `props` (محتوا و رفتار) و `layout` (موقعیت/اندازه در گرید) و `style` (ظاهر). این تفکیک باعث می‌شود تغییر اندازه یک دکمه در Builder فقط `layout` را تغییر دهد، بدون دست‌زدن به منطق یا محتوای آن.

---

## ۵. موتور شخصی‌سازی UI — جزئیات پیاده‌سازی

### ۵.۱ جریان کار (Flow) در حالت Builder

1. ادمین در پنل «سازنده رابط کاربری» تغییری می‌دهد (مثلاً ترتیب منو).
2. تغییر به‌صورت **Optimistic UI** بلافاصله در پیش‌نمایش نمایش داده می‌شود.
3. درخواست `PATCH /ui/menu` به سرور ارسال می‌شود → نسخه جدید در `menu_items` ذخیره و در `audit_logs` ثبت می‌شود.
4. سرور رویداد `ui:updated` را از طریق WebSocket به سایر جلسات ادمین همان سازمان Broadcast می‌کند (برای جلوگیری از تداخل چند ادمین هم‌زمان).
5. تغییرات ابتدا در وضعیت **Draft** ذخیره می‌شوند؛ با زدن دکمه «انتشار» (`POST /ui/pages/:id/publish`) نسخه `published` جایگزین می‌شود و کش Redis مربوطه Invalidate می‌شود.

### ۵.۲ جریان کار در سمت اپ کاربر نهایی

```
درخواست ورود کاربر
        │
        ▼
GET /ui/bootstrap  (منو + تم + دسترسی‌های کاربر، یک‌جا)
        │
        ▼
ذخیره در Local Cache (MMKV) با TTL
        │
        ▼
DynamicRenderer:
  for each menuItem where hasPermission(user, item.required_permission):
      render TabBar item
  for each component in page.schema where hasPermission(user, component.visibleFor):
      render via ComponentRegistry[component.type]
        │
        ▼
اگر اتصال شبکه قطع بود → رندر از روی آخرین Cache معتبر (Offline First)
```

### ۵.۳ استراتژی کش و عملکرد
- کش لایه ۱ (سرور): Redis با کلید `ui:{tenant_id}:bootstrap`، TTL پنج دقیقه، Invalidate دستی هنگام Publish
- کش لایه ۲ (کلاینت): MMKV (سریع‌تر از AsyncStorage) برای ذخیره آخرین Schema معتبر جهت Offline
- **Stale-While-Revalidate**: اپ ابتدا از کش رندر می‌کند، همزمان در پس‌زمینه نسخه جدید را می‌گیرد و در صورت تفاوت، UI را نرم (با انیمیشن) به‌روز می‌کند
- Widgetهای داشبورد با `React.lazy` + `Suspense` به‌صورت جداگانه لود می‌شوند تا صفحه اصلی معطل کندترین ابزارک نماند

### ۵.۴ رجیستری کامپوننت (Component Registry) — الگوی توسعه امن

```ts
// registry.ts
export const ComponentRegistry: Record<string, React.ComponentType<any>> = {
  StatRow, DataList, OrderCard, ChartWidget,
  BannerWidget, FormBuilder, TableWidget, ProfileHeader,
};

// DynamicRenderer.tsx
function DynamicRenderer({ schema, user }: Props) {
  return schema.components
    .filter(c => hasPermission(user, c.visibleFor))
    .sort((a, b) => a.order - b.order)
    .map(c => {
      const Component = ComponentRegistry[c.type];
      if (!Component) return <UnknownComponentFallback key={c.id} />;
      return <Component key={c.id} {...c.props} />;
    });
}
```

> این الگو تضمین می‌کند که هرچه در Builder ساخته شود، فقط از میان کامپوننت‌های از‌پیش‌تعریف‌شده و تست‌شده در اپ انتخاب می‌شود (نه کد دلخواه) — از نظر امنیتی و پایداری، رویکرد صحیح برای Server-Driven UI موبایل است (بر خلاف اجرای کد پویا که ریسک امنیتی دارد).

### ۵.۵ پالت المان‌ها و بوم طراحی (Element Palette & Canvas)

سازنده صفحه از سه ناحیه تشکیل می‌شود که تجربه‌ای مشابه Figma/Framer اما ساده‌شده برای موبایل ارائه می‌دهد:

```
┌───────────┬─────────────────────────────┬───────────┐
│  پالت     │        بوم (Canvas)          │  پنل      │
│ المان‌ها   │   پیش‌نمایش زنده صفحه در حال    │  خصوصیات   │
│           │        ساخت                  │ (Inspector)│
│ ▢ دکمه    │  ┌─────────────────────┐     │           │
│ ▢ متن     │  │   [عنصر انتخاب‌شده]   │     │ برچسب     │
│ ▢ ورودی   │  │   با هندل‌های resize  │     │ رنگ        │
│ ▢ تصویر   │  └─────────────────────┘     │ اندازه     │
│ ▢ کارت    │                              │ دسترسی     │
│ ▢ چارت    │                              │ اکشن       │
│ ▢ لیست    │                              │           │
└───────────┴─────────────────────────────┴───────────┘
```

**کتابخانه پایه المان‌ها (قابل توسعه از طریق `element_definitions`):**

| دسته | المان‌ها |
|---|---|
| پایه | متن (Text)، تیتر (Heading)، دکمه (Button)، آیکون (Icon)، تصویر (Image)، جداکننده (Divider)، فاصله‌گذار (Spacer) |
| فرم | ورودی متنی، عدد، تاریخ، انتخاب (Select)، چک‌باکس، رادیو، سوییچ، آپلود فایل، امضا دیجیتال |
| داده | لیست داده (DataList)، جدول (Table)، کارت آماری (StatCard)، نمودار (Chart)، تقویم |
| رسانه | گالری تصویر، پخش‌کننده ویدیو، نقشه |
| چیدمان | ردیف (Row)، ستون (Column)، کارت گروه‌بندی (Container)، تب (Tabs)، آکاردئون |
| تعاملی | بنر اسلایدی، مودال، دکمه شناور (FAB)، نوار پیشرفت |

هر المان با **درگ‌اند‌دراپ** از پالت به بوم اضافه می‌شود؛ در محیط موبایل به‌جای Drag پیوسته (که روی صفحه لمسی دقت پایینی دارد)، از الگوی **«لمس برای افزودن + دکمه‌های جابجایی بالا/پایین/چپ/راست»** استفاده می‌شود تا تجربه کاربری روی گوشی دقیق و بدون خطا باشد؛ در نسخه تبلت/وب از Drag واقعی با کتابخانه `react-native-reanimated` + `react-native-gesture-handler` پشتیبانی می‌شود.

### ۵.۶ سازنده دکمه و اکشن‌ها (Button & Action Builder)

هر دکمه یا عنصر تعاملی از یک ساختار **اکشن امن (Safe Action Schema)** استفاده می‌کند — نه اجرای کد دلخواه، بلکه انتخاب از میان انواع از‌پیش‌تعریف‌شده:

```ts
type ActionSchema =
  | { type: 'navigate'; target: string; params?: Record<string, string> }
  | { type: 'api_call'; endpoint: string; method: 'GET'|'POST'|'PATCH'|'DELETE'; confirm?: string }
  | { type: 'open_form'; formId: string; mode: 'modal' | 'page' }
  | { type: 'open_modal'; modalId: string }
  | { type: 'external_link'; url: string }
  | { type: 'share'; content: string }
  | { type: 'call_phone'; number: string }
  | { type: 'toggle_visibility'; targetElementId: string };
```

پنل خصوصیات (Inspector) برای هر دکمه امکانات زیر را در اختیار ادمین می‌گذارد بدون نوشتن کد: متن، آیکون (از کتابخانه Tabler Icons)، رنگ/تم (اصلی، ثانویه، Ghost، خطر)، اندازه (کوچک/متوسط/بزرگ/تمام‌عرض)، وضعیت غیرفعال شرطی (مثلاً «فقط وقتی فرم معتبر است فعال شو»)، و نوع اکشن از لیست بالا.

### ۵.۷ سازنده فرم پویا (Dynamic Form Builder)

فرم‌ساز یک زیرسیستم مستقل است که هم داخل صفحات (مثل «افزودن محصول») و هم به‌صورت مودال قابل فراخوانی است.

**ساختار هر فیلد فرم:**
```json
{
  "id": "fld_price",
  "type": "number",
  "label": "قیمت (تومان)",
  "placeholder": "مثلاً ۱۵۰۰۰۰",
  "required": true,
  "validation": { "min": 0, "max": 999999999 },
  "defaultValue": null,
  "visibleIf": { "field": "has_price", "operator": "equals", "value": true },
  "gridSpan": 6,
  "permission": { "edit": "products.edit", "view": "products.view" }
}
```

**قابلیت‌های فرم‌ساز:**
- کشیدن فیلد از پالت به بوم فرم، با پیش‌نمایش زنده رندر واقعی (نه شبیه‌سازی)
- **منطق شرطی (Conditional Logic)**: نمایش/الزامی‌بودن یک فیلد بر اساس مقدار فیلد دیگر، بدون کد (رابط بصری If/Then)
- اعتبارسنجی بصری: تعیین Min/Max، الگوی Regex، پیام خطای سفارشی، اجباری/اختیاری
- گروه‌بندی فیلدها در Step (فرم چندمرحله‌ای/Wizard) برای فرم‌های طولانی
- اتصال Submit به یک Endpoint واقعی یا به یک «فرآیند» (Workflow) داخلی مثل ایجاد سفارش
- حالت پیش‌نمایش «پر کردن آزمایشی» برای تست فرم قبل از انتشار، بدون ارسال داده واقعی

### ۵.۸ ساخت صفحه جدید (New Page Wizard)

```
شروع
  │
  ▼
انتخاب نقطه شروع:
  ├─▶ صفحه خالی (Blank Canvas)
  ├─▶ از روی قالب آماده (Template Gallery: لیست، فرم، داشبورد، پروفایل)
  └─▶ کپی از یک صفحه موجود (Duplicate)
  │
  ▼
تنظیمات پایه صفحه: عنوان، Slug، آیکون منو (اختیاری)، نوع Layout
  │
  ▼
افزودن به منو؟  بله → انتخاب موقعیت در منو + مجوز لازم
              خیر → صفحه بدون لینک مستقیم (فقط از طریق اکشن دکمه در دسترس)
  │
  ▼
صفحه در وضعیت Draft ساخته می‌شود → وارد بوم طراحی می‌شود
```

Endpoint مربوطه: `POST /ui/pages` با بدنه `{ title, slug, layoutType, templateId?, sourcePageId?, addToMenu, menuConfig? }`. رکورد جدید در `pages` + اولین رکورد در `page_versions` (نسخه ۱، خالی یا کپی‌شده از قالب) ساخته می‌شود.

### ۵.۹ سیستم چیدمان و تغییر اندازه المان‌ها (Responsive Grid & Resize Engine)

بوم هر صفحه بر پایه یک **گرید ۱۲ ستونه** کار می‌کند (مشابه Bootstrap/CSS Grid) که برای موبایل، تبلت و پیش‌نمایش دسکتاپ (پنل وب مدیریتی) به‌طور مستقل قابل تنظیم است:

```json
"layout": {
  "mobile":  { "colSpan": 12, "rowSpan": 2 },
  "tablet":  { "colSpan": 6,  "rowSpan": 2 },
  "desktop": { "colSpan": 4,  "rowSpan": 2 }
}
```

- با انتخاب یک المان، **۴ دستگیره (Handle)** در گوشه‌ها/لبه‌ها ظاهر می‌شود؛ کشیدن آن‌ها مقدار `colSpan`/`rowSpan` را با گام‌های ۱ ستونی تغییر می‌دهد (Snap to Grid برای جلوگیری از چیدمان نامرتب)
- روی موبایل به‌جای کشیدن آزاد، یک **پنل عددی +/-** برای عرض (۱ تا ۱۲ ستون) و ارتفاع نمایش داده می‌شود تا با انگشت دقیق کنترل شود
- هر نوع المان یک `minW`/`minH`/`maxW` از `element_definitions` به ارث می‌برد تا کاربر نتواند مثلاً دکمه را آن‌قدر کوچک کند که غیرقابل‌لمس شود (حداقل ۴۴×۴۴ پیکسل طبق استاندارد دسترسی‌پذیری لمسی)
- **چیدمان خودکار (Auto-arrange)**: دکمه‌ای که با یک کلیک، همه المان‌های یک صفحه را بر اساس اندازه‌شان به‌صورت مرتب و بدون فاصله اضافی بازچینی می‌کند
- **قفل کردن المان (Lock)**: جلوگیری از جابجایی/حذف تصادفی یک عنصر حساس (مثلاً دکمه خروج)
- **لایه‌ها (Layers Panel)**: فهرست درختی همه المان‌های صفحه برای انتخاب سریع عناصر پنهان یا هم‌پوشان، با قابلیت تغییر ترتیب Z-index

### ۵.۱۰ حالت پیش‌نمایش زنده و تایید نهایی (Live Preview & Apply Workflow)

این جریان تضمین می‌کند که **هیچ تغییری بدون تایید صریح ادمین روی کاربران واقعی اعمال نشود**:

```
حالت ویرایش (Draft)
  │  هر تغییر بلافاصله در نیمه‌بالای صفحه Builder به‌صورت
  │  "پیش‌نمایش درون‌خطی" (Inline Preview) دیده می‌شود
  ▼
دکمه «پیش‌نمایش کامل» (Full Preview)
  │  اپ در یک Overlay تمام‌صفحه، دقیقاً با DynamicRenderer واقعی
  │  (همان کدی که کاربر نهایی می‌بیند) نسخه Draft را رندر می‌کند
  │  قابل تعویض بین اندازه موبایل/تبلت و حالت تاریک/روشن
  │  قابل تعویض بین دیدن با چشم هر نقش (پیش‌نمایش «به‌جای فروش ببین»)
  ▼
دکمه «بازبینی تغییرات» (Review Changes)
  │  نمایش Diff خوانا: چه چیزی اضافه/حذف/جابه‌جا/تغییر رنگ شده
  │  («۲ آیتم منو اضافه شد، ۱ دکمه حذف شد، رنگ اصلی تغییر کرد»)
  ▼
دکمه «تایید و اعمال» (Apply)
  │  POST /ui/pages/:id/publish  →  نسخه Draft به Published تبدیل می‌شود
  │  Redis Invalidate + Broadcast رویداد ui:updated روی WebSocket
  │  ثبت خودکار در audit_logs با diff کامل
  ▼
اعمال روی کاربران واقعی (Live)  — با امکان «بازگشت سریع» (One-click Rollback)
از تاریخچه نسخه‌ها در صورت بروز مشکل
```

نکات تکمیلی این جریان:
- **ذخیره خودکار (Autosave)** هر تغییر در Draft با Debounce ۵۰۰ میلی‌ثانیه‌ای، بدون نیاز به کلیک صریح «ذخیره» — کاربر فقط برای رفتن Live باید «تایید و اعمال» را بزند
- **لغو تغییرات (Discard)**: بازگشت آنی Draft به آخرین نسخه منتشرشده
- **انتشار زمان‌بندی‌شده (Scheduled Publish)**: امکان تنظیم «این تغییرات ساعت ۹ شب خودکار Apply شود» برای تغییرات حساس در ساعات کم‌ترافیک
- **پیش‌نمایش با لینک اشتراکی**: تولید یک لینک/QR موقت (Preview Token با انقضای ۲۴ ساعته) تا هم‌تیمی‌ها بدون دسترسی ادمین بتوانند پیش‌نمایش را روی گوشی خودشان ببینند

### ۵.۱۱ قابلیت‌های تکمیلی پیشنهادی (افزوده‌های خلاقانه)

| قابلیت | توضیح |
|---|---|
| کپی/پیست بین صفحات | کپی یک المان یا کل یک بخش از صفحه‌ای و Paste در صفحه دیگر با حفظ استایل |
| قالب استایل (Style Presets) | ذخیره ترکیب رنگ/فونت/گردی یک المان به‌عنوان پیش‌تنظیم قابل استفاده مجدد در کل پروژه |
| بررسی دسترسی‌پذیری (A11y Checker) | هشدار خودکار هنگام کنتراست رنگ ناکافی یا اندازه لمسی کوچک‌تر از استاندارد |
| حالت مقایسه نسخه‌ها (Version Diff View) | نمایش دو نسخه از یک صفحه به‌صورت کنار‌هم برای مرور تغییرات تاریخی |
| نشانگر حضور هم‌زمان (Presence Indicator) | نمایش آواتار سایر ادمین‌هایی که هم‌اکنون همان صفحه را ویرایش می‌کنند (جلوگیری از تداخل ویرایش) |
| کامنت روی المان (Element Comments) | امکان گذاشتن یادداشت/بازخورد روی یک المان خاص برای هماهنگی تیمی، بدون تاثیر روی کاربر نهایی |
| آمار تعامل ابزارک (Widget Analytics) | تعداد کلیک/بازدید هر دکمه یا ویجت داشبورد برای تصمیم‌گیری داده‌محور درباره چیدمان |
| میانبرهای صفحه‌کلید (در پنل وب) | Ctrl+Z/Redo، Delete، Ctrl+D برای تکرار سریع المان |
| Import/Export Schema | خروجی گرفتن از یک صفحه به‌صورت فایل JSON برای انتقال بین محیط Staging و Production |

---

## ۶. فهرست کامل ۳۰ صفحه اپلیکیشن

| # | گروه | نام صفحه | نوع Layout | مجوز لازم |
|---|---|---|---|---|
| ۱ | احراز هویت | ورود (Login) | Form | عمومی |
| ۲ | احراز هویت | فراموشی رمز عبور | Form | عمومی |
| ۳ | احراز هویت | تایید کد OTP | Form | عمومی |
| ۴ | احراز هویت | آموزش اولیه (Onboarding) | Carousel | عمومی |
| ۵ | هسته | داشبورد اصلی | Dashboard | dashboard.view |
| ۶ | هسته | مرکز اعلان‌ها | List | notifications.view |
| ۷ | کسب‌وکار | لیست محصولات | List | products.view |
| ۸ | کسب‌وکار | جزئیات/ویرایش محصول | Detail/Form | products.edit |
| ۹ | کسب‌وکار | لیست سفارش‌ها | List | orders.view |
| ۱۰ | کسب‌وکار | جزئیات سفارش | Detail | orders.view |
| ۱۱ | کسب‌وکار | لیست مشتریان | List | customers.view |
| ۱۲ | کسب‌وکار | جزئیات مشتری | Detail | customers.view |
| ۱۳ | کسب‌وکار | مدیریت موجودی انبار | List/Form | inventory.manage |
| ۱۴ | کسب‌وکار | دسته‌بندی‌ها | List/Form | products.manage |
| ۱۵ | کسب‌وکار | کد تخفیف و کوپن | List/Form | discounts.manage |
| ۱۶ | کسب‌وکار | گزارش‌ها و تحلیل فروش | Dashboard | reports.view |
| ۱۷ | UI Builder | سازنده رابط کاربری (خانه) | Tabs | ui.builder.manage |
| ۱۸ | UI Builder | سازنده منو | Builder | ui.menu.manage |
| ۱۹ | UI Builder | سازنده داشبورد | Builder | ui.dashboard.manage |
| ۲۰ | UI Builder | ماتریس دسترسی نقش‌ها | Matrix | ui.access.manage |
| ۲۱ | UI Builder | شخصی‌ساز ظاهر (تم) | Form | ui.theme.manage |
| ۲۲ | UI Builder | کاتالوگ ابزارک‌ها | Gallery | ui.builder.manage |
| ۲۳ | تیم | لیست کاربران | List | users.view |
| ۲۴ | تیم | جزئیات/ویرایش کاربر | Detail/Form | users.edit |
| ۲۵ | تیم | نقش‌ها و مجوزها | List/Form | roles.manage |
| ۲۶ | تیم | لاگ فعالیت (Audit) | List | audit.view |
| ۲۷ | تنظیمات | تنظیمات عمومی | Form | settings.manage |
| ۲۸ | تنظیمات | پروفایل کاربری | Form | خودِ کاربر |
| ۲۹ | تنظیمات | یکپارچه‌سازی‌ها (پرداخت/پیامک) | List/Form | integrations.manage |
| ۳۰ | تنظیمات | پشتیبان‌گیری و خروجی داده | Form | backup.manage |

---

## ۷. مدل کنترل دسترسی چندلایه (RBAC)

```
نقش (Role)
   └─▶ مجوزها (Permissions)  مثال: orders.view, ui.theme.manage
          └─▶ آیتم منو نمایش داده می‌شود اگر required_permission ⊂ user.permissions
                 └─▶ صفحه بارگذاری می‌شود اگر Route Guard تایید کند
                        └─▶ هر Component داخل صفحه نیز visibleFor مخصوص خود را چک می‌کند
                               └─▶ حتی فیلدهای فرم می‌توانند سطح دسترسی جدا داشته باشند (read/write/hidden)
```

### نمونه Guard سمت اپ
```ts
function hasPermission(user: User, required?: string | string[]): boolean {
  if (!required) return true;
  const list = Array.isArray(required) ? required : [required];
  return list.every(p => user.permissions.includes(p));
}
```

### نمونه Guard سمت سرور (NestJS Decorator)
```ts
@RequirePermission('ui.theme.manage')
@Patch('ui/theme')
updateTheme(@Body() dto: UpdateThemeDto) { ... }
```

> نکته امنیتی مهم: کنترل دسترسی سمت کلاینت فقط برای **تجربه کاربری** است؛ اعتبارسنجی نهایی و الزام‌آور همیشه باید در سمت سرور (API Guard) انجام شود، چون کلاینت قابل دستکاری است.

---

## ۸. نمونه قرارداد API (API Contracts)

```
GET    /ui/bootstrap                 → { menu, theme, permissions, dashboardId }
GET    /ui/pages/:slug               → schema صفحه منتشرشده
PATCH  /ui/menu                      → بروزرسانی/ترتیب‌دهی آیتم‌های منو (Draft)
POST   /ui/pages/:id/publish         → انتشار نسخه Draft
GET    /ui/pages/:id/versions        → تاریخچه نسخه‌ها (برای Rollback)
POST   /ui/pages/:id/rollback/:vId   → بازگشت به نسخه قبلی
PATCH  /ui/dashboard/widgets         → بروزرسانی ترتیب/سایز ابزارک‌ها
PATCH  /ui/theme                     → بروزرسانی رنگ/گردی/فونت
GET    /ui/access-matrix             → ماتریس کامل نقش × منو
PATCH  /ui/access-matrix             → بروزرسانی دسترسی‌ها
WS     /ui/live                      → کانال Broadcast تغییرات زنده بین ادمین‌ها

GET    /ui/elements/catalog          → فهرست کامل المان‌های قابل استفاده در بوم (پالت)
POST   /ui/pages                     → ساخت صفحه جدید (خالی/از قالب/کپی)
GET    /ui/templates                 → فهرست قالب‌های آماده صفحه
POST   /ui/pages/:id/duplicate       → کپی کامل یک صفحه با تمام المان‌ها
POST   /ui/pages/:id/elements        → افزودن المان جدید (دکمه، متن، ورودی و...) به بوم
PATCH  /ui/pages/:id/elements/:elId  → ویرایش props/style یک المان
PATCH  /ui/pages/:id/elements/:elId/layout → تغییر اندازه/موقعیت (colSpan, rowSpan)
DELETE /ui/pages/:id/elements/:elId  → حذف المان
POST   /ui/pages/:id/elements/:elId/lock   → قفل/بازکردن قفل المان
POST   /ui/forms                     → ساخت فرم جدید
PATCH  /ui/forms/:id                 → ویرایش فیلدهای فرم و منطق شرطی
POST   /ui/pages/:id/preview-token   → صدور لینک/QR پیش‌نمایش موقت (۲۴ ساعته)
GET    /ui/pages/:id/diff/:v1/:v2    → مقایسه دو نسخه (برای صفحه Review Changes)
POST   /ui/pages/:id/schedule-publish → زمان‌بندی انتشار خودکار
```

---

## ۹. فاز‌بندی توسعه (Roadmap)

| فاز | محتوا | خروجی | تخمین زمان |
|---|---|---|---|
| ۱ | زیرساخت پایه: Auth، RBAC، معماری پروژه، CI/CD | اسکلت اپ + ورود | ۲ هفته |
| ۲ | موتور Dynamic Renderer + Component Registry پایه | رندر صفحات ساده از JSON | ۲ هفته |
| ۳ | ماژول‌های کسب‌وکار (صفحات ۷ تا ۱۶) | ۱۰ صفحه عملیاتی | ۳ هفته |
| ۴ | موتور UI Builder پایه (منو، داشبورد، دسترسی، تم) | صفحات ۱۷ تا ۲۲ | ۳ هفته |
| ۵ | پالت المان‌ها، سازنده دکمه/اکشن، گرید Resize، سازنده فرم پویا | بوم طراحی کامل + Form Builder | ۳٫۵ هفته |
| ۶ | ساخت صفحه جدید، قالب‌ها، پیش‌نمایش کامل و جریان Apply/Rollback | New Page Wizard + Preview Flow | ۲ هفته |
| ۷ | مدیریت تیم و تنظیمات (صفحات ۲۳ تا ۳۰) | تکمیل ۳۰ صفحه | ۲ هفته |
| ۸ | Real-time Sync، Presence، Offline Mode، بهینه‌سازی عملکرد | پایداری و سرعت | ۱٫۵ هفته |
| ۹ | تست (Unit/E2E)، QA امنیتی، Load Test | گزارش کیفیت | ۱٫۵ هفته |
| ۱۰ | استقرار، مانیتورینگ، مستندسازی نهایی | انتشار نسخه ۱ | ۱ هفته |

**جمع تخمینی: حدود ۲۰٫۵ هفته (~۵ ماه) با تیم ۴ تا ۵ نفره (۲ تا ۳ فرانت موبایل، ۱–۲ بک‌اند، ۱ QA پاره‌وقت، ۱ طراح UX پاره‌وقت برای بوم طراحی).**

---

## ۱۰. استراتژی تست

- **Unit Test**: Jest برای منطق Guard دسترسی، توابع مرتب‌سازی منو/ویجت، محاسبات تم
- **Component Test**: React Native Testing Library برای هر Component در Registry (رندر با props نامعتبر → Fallback)
- **E2E**: Detox یا Maestro برای سناریوهای کامل (ورود → تغییر منو در Builder → مشاهده تغییر در پیش‌نمایش کاربر واقعی)
- **Contract Test**: Pact یا Postman/Newman برای اطمینان از عدم شکست API بین بک‌اند و اپ
- **Security Test**: تست OWASP Mobile Top 10 خصوصاً روی Guard دسترسی سمت سرور و اعتبارسنجی JSON Schema ورودی (جلوگیری از Injection در `config_json`)
- **Load Test**: k6 برای مسیر `/ui/bootstrap` که پرترافیک‌ترین Endpoint است (هر بار باز شدن اپ فراخوانی می‌شود)

---

## ۱۱. ملاحظات عملکرد و مقیاس‌پذیری

- محدود کردن عمق تو در توی JSON Schema صفحات (حداکثر ۳ سطح) برای جلوگیری از رندر کند
- Debounce روی ذخیره خودکار تغییرات Builder (۵۰۰ میلی‌ثانیه) برای کاهش فشار به سرور
- Virtualized List (`FlashList`) برای لیست‌های طولانی (سفارش‌ها، محصولات)
- تصاویر آیکون/لوگو از طریق CDN با فرمت WebP و چند اندازه (Responsive Images)
- در معماری چند-سازمانی (SaaS)، جداسازی داده با `tenant_id` و ایندکس‌گذاری مناسب روی جداول پرترافیک

## ۱۲. ملاحظات امنیتی کلیدی

- اعتبارسنجی سخت‌گیرانه `schema_json` ورودی با Zod/JSON Schema پیش از ذخیره (جلوگیری از تزریق نوع کامپوننت ناشناخته یا props مخرب)
- Rate Limiting روی Endpointهای Builder برای جلوگیری از سوءاستفاده
- ثبت کامل Audit Log برای هر تغییر UI (چه کسی، چه زمانی، چه تغییری) با قابلیت Rollback
- جداسازی محیط Draft از Published تا تغییرات آزمایشی روی کاربران واقعی اثر نگذارد
- Refresh Token با چرخش (Rotation) و امکان ابطال نشست از راه دور در صفحه پروفایل

---

## ۱۳. جمع‌بندی

این معماری بر پایه **Server-Driven UI** طراحی شده تا سیستم شخصی‌سازی خواسته‌شده (منو، داشبورد، دسترسی، ظاهر) واقعاً مثل یک صفحه‌ساز کامل عمل کند: افزودن دکمه و هر المان دیگر از یک پالت آماده، ساخت فرم پویا با منطق شرطی، ساخت صفحه جدید از صفر یا از روی قالب، تغییر اندازه دقیق هر عنصر با گرید ۱۲ ستونه، و مهم‌تر از همه یک **جریان دوگانه Draft → Preview → Apply** که تضمین می‌کند هیچ تغییری بدون تایید صریح و پیش‌نمایش کامل روی کاربران واقعی اثر نگذارد — همه این‌ها بدون نیاز به انتشار نسخه جدید در App Store/Google Play. جداسازی لایه‌های Registry، Guard دسترسی دوگانه (کلاینت + سرور)، اعتبارسنجی سخت‌گیرانه اکشن‌ها (Safe Action Schema به‌جای اجرای کد دلخواه)، و نسخه‌بندی Draft/Publish با Rollback یک‌کلیکی، ستون‌های اصلی پایداری و امنیت این سیستم هستند.