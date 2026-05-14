const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  const adminPasswordHash = await bcrypt.hash('admin123', 10);
  
  const admin = await prisma.user.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      username: 'admin',
      passwordHash: adminPasswordHash,
      role: 'ADMIN',
    },
  });

  console.log({ admin });
  
  const participantPasswordHash = await bcrypt.hash('user123', 10);
  
  const participant = await prisma.user.upsert({
    where: { username: 'user1' },
    update: {},
    create: {
      username: 'user1',
      passwordHash: participantPasswordHash,
      role: 'PARTICIPANT',
      province: 'West Java',
      regencyCity: 'Bandung',
      currentStage: 1,
    },
  });
  
  await prisma.participantProgress.upsert({
     where: { userId: participant.id },
     update: {},
     create: {
        userId: participant.id,
     }
  });

  console.log({ participant });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
