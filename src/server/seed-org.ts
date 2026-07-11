import { prisma } from './db';

async function main() {
  console.log('Seeding OrgUnits...');

  // 1. Create Line 1
  const line1 = await prisma.orgUnit.upsert({
    where: { key: 'line-1' },
    update: {},
    create: {
      key: 'line-1',
      kind: 'line',
      title: 'خط ۱',
      sortOrder: 1,
    },
  });

  const stations = [
    { key: 'st-rey', title: 'ایستگاه شهرری', sortOrder: 1 },
    { key: 'st-tajrish', title: 'ایستگاه تجریش', sortOrder: 2 },
    { key: 'st-fathabad', title: 'پایانه فتح‌آباد', sortOrder: 3 },
    { key: 'st-shahed', title: 'ایستگاه شاهد باقرشهر', sortOrder: 4 },
  ];

  const shifts = [
    { suffix: 'shift-a', title: 'شیفت A' },
    { suffix: 'shift-b', title: 'شیفت B' },
    { suffix: 'shift-c', title: 'شیفت C' },
  ];

  for (const st of stations) {
    const station = await prisma.orgUnit.upsert({
      where: { key: st.key },
      update: {},
      create: {
        key: st.key,
        kind: 'station',
        title: st.title,
        parentId: line1.id,
        sortOrder: st.sortOrder,
      },
    });

    for (let i = 0; i < shifts.length; i++) {
      const shift = shifts[i];
      const shiftKey = `${st.key}-${shift.suffix}`;
      await prisma.orgUnit.upsert({
        where: { key: shiftKey },
        update: {},
        create: {
          key: shiftKey,
          kind: 'shift_group',
          title: `${shift.title} - ${st.title}`,
          parentId: station.id,
          sortOrder: i + 1,
        },
      });
    }
  }

  console.log('OrgUnits seeded successfully.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    // await prisma.$disconnect(); // It's fine not to disconnect if using a singleton
  });
