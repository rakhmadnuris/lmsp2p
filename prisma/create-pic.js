const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  const args = process.argv.slice(2);

  if (args.length < 4) {
    console.error("Usage: node create-pic.js <role> <username> <password> <province> [regencyCity]");
    console.error("Roles: PIC_PROVINSI or PIC_KABKOTA");
    console.error("Example: node create-pic.js PIC_PROVINSI Jabar123 pass123 \"Jawa Barat\"");
    console.error("Example: node create-pic.js PIC_KABKOTA Bdg123 pass123 \"Jawa Barat\" \"Kota Bandung\"");
    process.exit(1);
  }

  const [role, username, password, province, regencyCity] = args;

  if (role !== 'PIC_PROVINSI' && role !== 'PIC_KABKOTA') {
    console.error("Error: Role must be 'PIC_PROVINSI' or 'PIC_KABKOTA'");
    process.exit(1);
  }

  if (role === 'PIC_KABKOTA' && !regencyCity) {
    console.error("Error: PIC_KABKOTA requires a regencyCity parameter.");
    process.exit(1);
  }

  const existingUser = await prisma.user.findUnique({
    where: { username }
  });

  if (existingUser) {
    console.error(`Error: User '${username}' already exists.`);
    process.exit(1);
  }

  const passwordHash = await bcrypt.hash(password, 10);

  const pic = await prisma.user.create({
    data: {
      username,
      passwordHash,
      role,
      province,
      regencyCity: regencyCity || null,
    },
  });

  console.log(`Successfully created new ${role} account:`);
  console.log(`Username: ${pic.username}`);
  console.log(`Province: ${pic.province}`);
  if (pic.regencyCity) console.log(`Regency/City: ${pic.regencyCity}`);
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
