import TelegramBot from 'node-telegram-bot-api';
import axios from 'axios';
import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { prisma } from '../prisma.js';

const TG_TOKEN = '7971636776:AAHJOyqJzNQHEA2xjiXPGIJVFs-CS2xupMg'; // <-- Подставь свой токен
const bot = new TelegramBot(TG_TOKEN, { polling: true });

const UPLOAD_DIR = './uploads/news';
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

bot.on('channel_post', async (msg) => {
  if (msg.chat?.type !== 'channel') return;

  const rawText = [msg.text, msg.caption].filter(Boolean).join('\n').trim();
  console.log('📥 Получено сообщение:', rawText);

  if (!rawText.toLowerCase().includes('#на_сайт')) {
    console.log('⛔️ Пропущено — нет #сайт');
    return;
  }

  console.log('✅ Хэштег найден. Добавим новость...');

  // Удаление хэштега
  const cleanedText = rawText.replace(/#сайт/gi, '').trim();

  // Заголовок = первая строка, остальное — описание
  const lines = cleanedText
    .split(/\r?\n|\r|\u2028|\u2029/)
    .map(line => line.trim())
    .filter(line => line.length > 0);

  const title = lines[0]?.slice(0, 100) || 'Без заголовка';
  const description = lines.slice(1).join('\n').trim();

  const date = new Date(msg.date * 1000);
  const photos = msg.photo || [];
  const imgUrls = [];

  try {
    if (photos.length > 0) {
      const bestPhoto = photos[photos.length - 1];
      const file = await bot.getFile(bestPhoto.file_id);
      const fileUrl = `https://api.telegram.org/file/bot${TG_TOKEN}/${file.file_path}`;

      const fileName = `${Date.now()}_${Math.round(Math.random() * 1e5)}.webp`;
      const localPath = path.join(UPLOAD_DIR, fileName);

      const response = await axios.get(fileUrl, { responseType: 'arraybuffer' });
      await sharp(response.data).webp({ quality: 80 }).toFile(localPath);

      imgUrls.push(`/uploads/news/${fileName}`);
    }

    console.log('🔄 Сохраняем новость в БД:', {
      title,
      description,
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

    console.log(`✅ Сохранено: ${created.title}`);
  } catch (err) {
    console.error('❌ Ошибка при сохранении:', err);
  }
});
