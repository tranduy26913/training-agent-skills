// Seeds roles and the default admin user idempotently (upsert by unique key).
// Run with `npm run seed`.
import { prisma } from './prisma';
import { hashPassword } from '@utils/hash.util';
import { logger } from '@utils/logger.util';

// Default admin credentials. The password is hashed at seed time.
const ADMIN_NAME = process.env.SEED_ADMIN_NAME || 'Administrator';
const ADMIN_EMAIL = process.env.SEED_ADMIN_EMAIL;
const ADMIN_PASSWORD = process.env.SEED_ADMIN_PASSWORD;

if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
  throw new Error('SEED_ADMIN_EMAIL and SEED_ADMIN_PASSWORD are required to run the seed.');
}

// Role definitions seeded into the roles table.
const ROLES = [
  { name: 'admin', description: 'Full access to all features' },
  { name: 'user', description: 'Standard user access' },
  { name: 'moderator', description: 'Can moderate content and users' },
];

// Seed all reference roles via upsert on the unique name column.
async function seedRoles(): Promise<void> {
  for (const role of ROLES) {
    await prisma.role.upsert({
      where: { name: role.name },
      update: { description: role.description },
      create: role,
    });
  }
  logger.info(`Seeded ${ROLES.length} roles`);
}

// Seed the default admin user via upsert on the unique email column.
async function seedAdminUser(): Promise<void> {
  const hashedPassword = await hashPassword(ADMIN_PASSWORD);
  await prisma.user.upsert({
    where: { email: ADMIN_EMAIL },
    update: {
      name: ADMIN_NAME,
      password: hashedPassword,
      role: 'admin',
      status: 'active',
    },
    create: {
      name: ADMIN_NAME,
      email: ADMIN_EMAIL,
      password: hashedPassword,
      role: 'admin',
      status: 'active',
    },
  });
  logger.info(`Seeded admin user: ${ADMIN_EMAIL}`);
}

// Entry point. Connects, runs seeds, then disconnects.
async function runSeeds(): Promise<void> {
  await prisma.$connect();
  await seedRoles();
  await seedAdminUser();
  await prisma.$disconnect();
  logger.info('All seeds completed.');
}

runSeeds().catch((err) => {
  logger.error('Seed failed:', err);
  process.exit(1);
});
