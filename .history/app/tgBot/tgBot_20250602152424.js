// telegramNewsBot.js
import TelegramBot from 'node-telegram-bot-api';
import { prisma } from '../prisma.';

// 🔐 Впиши токен прямо здесь
const TG_TOKEN = '7971636776:AAHJOyqJzNQHEA2xjiXPGIJVFs-CS2xupMg';

const bot = new TelegramBot(TG_TOKEN, { polling: true });

bot.on('message', async (msg) => {
  const chatType = msg.chat.type;
  if (chatType !== 'channel') return;

  const text = msg.text || msg.caption || ''; // используем текст или подпись
  const photos = msg.photo || [];

  try {
    const title = text.slice(0, 100);
    const description = text;
    const date = new Date(msg.date * 1000);

    const imgUrls = [];

    // Сохраняем только URL к файлу Telegram CDN
    if (photos.length > 0) {
      const bestPhoto = photos[photos.length - 1];
      const file = await bot.getFile(bestPhoto.file_id);
      const fileUrl = `https://api.telegram.org/file/bot${TG_TOKEN}/${file.file_path}`;
      imgUrls.push(fileUrl);
    }

    const created = await prisma.news.create({
      data: {
        title,
        description,
        date,
        img: imgUrls,
      },
    });

    console.log(`✅ News saved: ${created.title}`);
  } catch (err) {
    console.error('❌ Error saving news:', err);
  }
});
