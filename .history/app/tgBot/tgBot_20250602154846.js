// telegramNewsBot.js
import TelegramBot from 'node-telegram-bot-api';
import { prisma } from '../prisma.js';

// 🔐 Впиши токен прямо здесь
const TG_TOKEN = '7971636776:AAHJOyqJzNQHEA2xjiXPGIJVFs-CS2xupMg';

const bot = new TelegramBot(TG_TOKEN, { polling: true });

bot.on('message', async (msg) => {
  if (
    !msg.is_automatic_forward ||
    !msg.forward_origin ||
    msg.forward_origin.type !== 'channel'
  )
    return;

  const text = msg.caption || msg.text || '';
  const photos = msg.photo || [];
  const title = text.slice(0, 100);
  const description = text;
  const date = new Date(msg.forward_date * 1000);
  const imgUrls = [];

  if (photos.length > 0) {
    const best = photos[photos.length - 1];
    const file = await bot.getFile(best.file_id);
    const url = `https://api.telegram.org/file/bot${TG_TOKEN}/${file.file_path}`;
    imgUrls.push(url);
  }

  try {
    const created = await prisma.news.create({
      data: {
        title,
        description,
        date,
        img: imgUrls,
      },
    });
    console.log('✅ Сохранено в базу:', created.title);
  } catch (err) {
    console.error('❌ Ошибка при записи в БД:', err);
  }
});
