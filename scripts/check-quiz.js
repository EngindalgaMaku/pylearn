const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const activity = await prisma.learningActivity.findUnique({
    where: {
      slug: 'python-data-types-quiz'
    },
    select: {
      id: true,
      title: true,
      slug: true,
      activityType: true,
      category: true,
      difficulty: true,
      content: true
    }
  });
  
  console.log("Activity details:");
  console.log(JSON.stringify(activity, null, 2));
  
  if (activity && activity.content) {
    try {
      const content = JSON.parse(activity.content);
      console.log("\nParsed content:");
      console.log(JSON.stringify(content, null, 2));
    } catch (e) {
      console.log("\nCouldn't parse content as JSON:", e.message);
      console.log("Raw content:", activity.content);
    }
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
