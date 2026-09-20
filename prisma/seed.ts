import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

const SUPER_ADMIN = {
  name: 'Super Admin',
  email: 'superadmin@gmail.com',
  role: 'CEO',
  password: 'superadmin123',
};

async function main() {
  const password_hash = await bcrypt.hash(SUPER_ADMIN.password, 10);

  await prisma.teamMember.upsert({
    where: { email: SUPER_ADMIN.email },
    update: {
      name: SUPER_ADMIN.name,
      role: SUPER_ADMIN.role,
      password_hash,
      is_first_login: true,
    },
    create: {
      name: SUPER_ADMIN.name,
      email: SUPER_ADMIN.email,
      role: SUPER_ADMIN.role,
      password_hash,
      is_first_login: true,
    },
  });

  const count = await prisma.teamMember.count();
  console.log(`[seed] Super admin ready: ${SUPER_ADMIN.email}`);
  console.log(`[seed] Total team members: ${count}`);
}

main()
  .catch((e) => {
    console.error('[seed] Failed:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());