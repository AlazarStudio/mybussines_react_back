import { PrismaClient } from '@prisma/client';
import { hash } from 'argon2';

const prisma = new PrismaClient();

async function main() {
  // Удаляем всех пользователей
  await prisma.user.deleteMany();

  // Хэшируем пароль
  const hashedPasswordAdmin = await hash('yugsdf8721!');

  // Создаём администратора
  await prisma.user.create({
    data: {
      name: 'admin',
      email: 'admin@admin.com',
      login: 'moibiz',
      password: hashedPasswordAdmin,
    },
  });

  console.log('Пользователи очищены и админ создан!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
