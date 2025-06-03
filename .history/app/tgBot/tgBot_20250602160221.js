import TelegramBot from 'node-telegram-bot-api';
import { prisma } from '../prisma.js';
import axios from 'axios';
import fs from 'fs';
import path from 'path';

// 🔐 Впиши токен прямо здесь
const TG_TOKEN = '7971636776:AAHJOyqJzNQHEA2xjiXPGIJVFs-CS2xupMg';

const bot = new TelegramBot(TG_TOKEN, { polling: true });

// 📂 Папка, куда сохраняем изображения
const UPLOAD_DIR = './uploads/news';
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

bot.on('channel_post', async (msg) => {
  const chatType = msg.chat.type;
  if (chatType !== 'channel') return;

  const text = msg.text || msg.caption || '';
  const photos = msg.photo || [];

  try {
    const title = text.slice(0, 100);
    const description = text;
    const date = new Date(msg.date * 1000);

    const imgUrls = [];

    if (photos.length > 0) {
      const bestPhoto = photos[photos.length - 1]; // самое большое изображение
      const file = await bot.getFile(bestPhoto.file_id);
      const fileUrl = `https://api.telegram.org/file/bot${TG_TOKEN}/${file.file_path}`;

      const fileName = `${Date.now()}_${Math.round(Math.random() * 1000)}.jpg`;
      const filePath = path.join(UPLOAD_DIR, fileName);

      // Скачиваем и сохраняем
      const response = await axios.get(fileUrl, { responseType: 'stream' });
      const writer = fs.createWriteStream(filePath);
      await new Promise((resolve, reject) => {
        response.data.pipe(writer);
        writer.on('finish', resolve);
        writer.on('error', reject);
      });

      imgUrls.push(`/uploads/news/${fileName}`); // сохраняем относительный путь
    }

    console.log('🔄 Готовим к сохранению в БД:', {
      title,
      description,
      date,
      imgUrls,
    });

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
    console.error('❌ Ошибка при сохранении новости:', err);
  }
});
