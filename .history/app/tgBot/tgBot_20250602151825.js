// telegramNewsBot.js
import TelegramBot from 'node-telegram-bot-api';
import axios from 'axios';
import fs from 'fs';
import path from 'path';
import { prisma } from './prisma.js';

// 🔐 Впиши токен прямо здесь
const TG_TOKEN = '7971636776:AAHJOyqJzNQHEA2xjiXPGIJVFs-CS2xupMg';

// 📂 Папка для локального сохранения изображений
const UPLOAD_DIR = './uploads/news';
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const bot = new TelegramBot(TG_TOKEN, { polling: true });

bot.on('message', async (msg) => {
  const chatType = msg.chat.type;
  if (chatType !== 'channel') return;

  const text = msg.text || '';
  const photos = msg.photo || [];

  try {
    const title = text.slice(0, 100); // Первые 100 символов — заголовок
    const description = text;
    const date = new Date(msg.date * 1000); // Telegram даёт UNIX timestamp

    const imgPaths = [];

    if (photos.length > 0) {
      const bestPhoto = photos[photos.length - 1]; // Самое большое фото
      const file = await bot.getFile(bestPhoto.file_id);
      const fileUrl = `https://api.telegram.org/file/bot${TG_TOKEN}/${file.file_path}`;
      const fileName = `${Date.now()}_${Math.round(Math.random() * 1000)}.jpg`;
      const localPath = path.join(UPLOAD_DIR, fileName);

      // Скачивание
      const response = await axios.get(fileUrl, { responseType: 'stream' });
      const writer = fs.createWriteStream(localPath);
      await new Promise((resolve, reject) => {
        response.data.pipe(writer);
        writer.on('finish', resolve);
        writer.on('error', reject);
      });

      imgPaths.push(`/uploads/news/${fileName}`);
    }

    // Сохраняем в базу
    const created = await prisma.news.create({
      data: {
        title,
        description,
        date,
        img: imgPaths,
      },
    });

    console.log(`✅ News saved: ${created.title}`);
  } catch (err) {
    console.error('❌ Error processing message:', err);
  }
});
