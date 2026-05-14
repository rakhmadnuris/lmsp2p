const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  const args = process.argv.slice(2);

  if (args.length !== 2) {
    console.error("Usage: node create-admin.js <username> <password>");
    process.exit(1);
  }

  const [username, password] = args;

  const existingUser = await prisma.user.findUnique({
    where: { username }
  });

  if (existingUser) {
    console.error(`Error: User '${username}' already exists.`);
    process.exit(1);
  }

  const passwordHash = await bcrypt.hash(password, 10);

  const admin = await prisma.user.create({
    data: {
      username,
      passwordHash,
      role: 'ADMIN',
    },
  });

  console.log("Successfully created new Admin account:");
  console.log(`Username: ${admin.username}`);
  console.log(`ID: ${admin.id}`);
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
