import { PrismaClient } from '@prisma/client';
import { hash } from 'argon2';

const prisma = new PrismaClient();

async function main() {
  // Хэширование пароля
  const hashedPasswordAdmin = await hash('yugsdf8721!');

  // Создание или обновление администратора
  await prisma.user.upsert({
    where: { email: 'admin@admin.com' }, // уникальное поле
    update: {
      name: 'admin',
      login: 'admin',
      password: hashedPasswordAdmin, // если нужно обновлять пароль
    },
    create: {
      name: 'admin',
      email: 'admin@admin.com',
      login: 'admin',
      password: hashedPasswordAdmin,
    },
  });

  console.log('Admin user ensured!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
