#!/bin/bash
# اسکریپت به‌روزرسانی خودکار پروژه سیر و حرکت خط ۱ مترو تهران روی سرور مجازی (VPS)
# راهنمای استفاده: chmod +x update.sh && ./update.sh

echo "=== شروع فرآیند به‌روزرسانی پروژه ==="

# رفع خودکار تداخل فایل‌های قفل یا موقت
if [ -f "package-lock.json" ]; then
  echo "در حال ریست کردن تغییرات محلی package-lock.json..."
  git checkout -- package-lock.json
fi

# ایجاد نسخه پشتیبان امن از دیتابیس قبل از بروزرسانی
if [ -f "prisma/dev.db" ]; then
  echo "در حال تهیه نسخه پشتیبان با مهر زمانی از دیتابیس سرور..."
  mkdir -p prisma/backups
  cp prisma/dev.db "prisma/backups/dev_db_backup_$(date +%Y%m%d_%H%M%S).db"
fi

# مدیریت فایل دیتابیس برای جلوگیری از تداخل گیت
DB_EXISTS=false
if [ -f "prisma/dev.db" ]; then
  echo "در حال انتقال موقت دیتابیس برای جلوگیری از تداخل ادغام..."
  mv prisma/dev.db prisma/dev.db.bak
  DB_EXISTS=true
fi

# ۱. دریافت آخرین تغییرات از مخزن گیت
echo "در حال دریافت آخرین کدهای پروژه از Git..."
git pull origin main
PULL_STATUS=$?

# بازگرداندن فایل دیتابیس
if [ "$DB_EXISTS" = true ]; then
  echo "در حال بازگرداندن دیتابیس..."
  mv prisma/dev.db.bak prisma/dev.db
fi

if [ $PULL_STATUS -ne 0 ]; then
  echo "خطا: دریافت کدها از گیت ناموفق بود. لغو فرآیند بروزرسانی."
  exit 1
fi

# ۲. نصب وابستگی‌های پروژه
echo "در حال نصب پکیج‌ها و وابستگی‌های جدید..."
npm install --production=false

# ۳. تولید مجدد کلاینت پایگاه داده (Prisma Client)
echo "در حال تولید مجدد کلاینت پایگاه داده..."
npx prisma generate

# ۴. اعمال تغییرات ساختار دیتابیس روی فایل دیتابیس محلی
echo "در حال اعمال تغییرات ساختار پایگاه داده..."
npx prisma db push

# ۵. ساخت بیلد جدید پروداکشن Next.js
echo "در حال ساخت نسخه پروداکشن (Build)..."
npm run build

# ۶. ری‌استارت کردن وب‌سایت در PM2 برای اعمال تغییرات زنده
echo "در حال راه‌اندازی مجدد برنامه در PM2..."
pm2 restart metro-app || pm2 restart all

echo "=== فرآیند به‌روزرسانی با موفقیت به پایان رسید! ==="
