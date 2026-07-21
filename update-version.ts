import { prisma } from './src/server/db'

async function main() {
  const updated = await prisma.setting.upsert({
    where: { key: 'general.webVersion' },
    update: { value: JSON.stringify('v0.1.3') },
    create: {
      key: 'general.webVersion',
      label: 'شماره نسخه پنل وب',
      description: 'شماره نسخه رسمی پنل وب پرسنل خط ۱ مترو تهران — جهت نمایش در سایدبار',
      type: 'text',
      value: JSON.stringify('v0.1.3'),
      defaultValue: JSON.stringify('v0.1.3'),
      category: 'general',
      isEnabled: true
    }
  })
  console.log("Updated setting in DB:", updated)
}

main().catch(console.error)
