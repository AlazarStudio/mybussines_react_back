import TelegramBot from 'node-telegram-bot-api';
import axios from 'axios';
import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { prisma } from '../prisma.js';

const TG_TOKEN = '7971636776:AAHJOyqJzNQHEA2xjiXPGIJVFs-CS2xupMg';
const bot = new TelegramBot(TG_TOKEN, { polling: true });

const UPLOAD_DIR = './uploads/news';
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

bot.on('channel_post', async (msg) => {
  const chatType = msg.chat.type;
  if (chatType !== 'channel') return;

  const rawText = msg.text || msg.caption || '';

  // Регулярка ловит любой визуальный перенос строки: \r, \n, \r\n, \u2028, \u2029, ...
  const splitText = rawText.split(/[\r\n\u2028\u2029]+/);

  const title = splitText[0]?.trim().slice(0, 50) || 'Без заголовка';
  const description =
    splitText.length > 1
      ? rawText.slice(rawText.indexOf(splitText[1])).trim()
      : '';

  const date = new Date(msg.date * 1000);
  const photos = msg.photo || [];
  const imgUrls = [];

  try {
    if (photos.length > 0) {
      const best = photos[photos.length - 1];
      const file = await bot.getFile(best.file_id);
      const fileUrl = `https://api.telegram.org/file/bot${TG_TOKEN}/${file.file_path}`;

      const fileName = `${Date.now()}_${Math.round(Math.random() * 1000)}.webp`;
      const localPath = path.join(UPLOAD_DIR, fileName);

      const response = await axios.get(fileUrl, {
        responseType: 'arraybuffer',
      });

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
