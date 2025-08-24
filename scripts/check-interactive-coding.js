const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const activities = await prisma.learningActivity.findMany({
    where: { 
      activityType: 'interactive_coding'
    },
    select: {
      id: true,
      title: true,
      slug: true,
      content: true
    }
  });
  
  console.log(JSON.stringify(activities, null, 2));
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
