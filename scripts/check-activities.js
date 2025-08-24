const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const activities = await prisma.learningActivity.findMany({
    where: {
      OR: [
        { activityType: 'theory_interactive' },
        { title: { contains: 'Data Types', mode: 'insensitive' } },
        { title: { contains: 'Quiz', mode: 'insensitive' } }
      ]
    },
    select: {
      id: true,
      title: true,
      slug: true,
      activityType: true,
      category: true,
      difficulty: true
    }
  });
  
  console.table(activities);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
