const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  // Tüm interactive_coding aktivitelerini bul
  const activities = await prisma.learningActivity.findMany({
    where: { 
      activityType: 'interactive_coding'
    },
    select: {
      id: true,
      title: true,
      slug: true
    }
  });
  
  console.log(`Found ${activities.length} interactive_coding activities`);
  
  // Aktiviteleri listele
  activities.forEach(activity => {
    console.log(`- ${activity.title} (${activity.slug})`);
  });
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
