/* eslint-disable import/extensions */
import dotenv from 'dotenv';
import express from 'express';
import morgan from 'morgan';
import path from 'path';
import fs from 'fs';
import cors from 'cors';
import multer from 'multer';
import xml2js from 'xml2js';
import sharp from 'sharp';
import https from 'https';
import { errorHandler, notFound } from './app/middleware/error.middleware.js';
import { prisma } from './app/prisma.js';

import authRoutes from './app/auth/auth.routes.js';
import userRoutes from './app/user/user.routes.js';
// import productRoutes from './app/product/product.routes.js';
import formsRoutes from './app/form/form.routes.js';
import newsRoutes from './app/news/news.routes.js';
import typeSupportRoutes from './app/typeSupport/typeSupport.routes.js';
import tagsSupportRoutes from './app/tagsSupport/tagsSupport.routes.js';
import centerRoutes from './app/center/center.routes.js';
import serviceRoutes from './app/service/service.routes.js';
import supportRoutes from './app/support/support.routes.js';
import mapRoutes from './app/map/map.routes.js';
import bidRoutes from './app/bid/bid.routes.js';

dotenv.config();

const app = express();
const __dirname = path.resolve();

// Настройки CORS
app.use(
  cors({
    origin: '*', // Источники фронтенда
    credentials: true, // Включение поддержки куки
    exposedHeaders: ['Content-Range'], // Если требуется для API
  })
);

const storage1 = multer.memoryStorage();

// Настройка `multer` для загрузки файлов
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, 'uploads');
    fs.mkdirSync(uploadDir, { recursive: true }); // Создаем папку, если она не существует
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const fileName = `${Date.now()}-${file.originalname}`;
    cb(null, fileName);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 1024 * 1024 * 48 }, // Лимит размера файла: 48MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = /xml/; // Разрешаем только XML файлы
    const extname = allowedTypes.test(
      path.extname(file.originalname).toLowerCase()
    );
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    }
    cb(new Error('Ошибка: допустимы только XML файлы'));
  },
});

const upload1 = multer({
  storage1,
  limits: { fileSize: 1024 * 1024 * 48 }, // лимит размера файла 48MB
  fileFilter: (req, file, cb) => {
    const fileTypes = /jpeg|jpg|png|gif/;
    const extname = fileTypes.test(
      path.extname(file.originalname).toLowerCase()
    );
    const mimetype = fileTypes.test(file.mimetype);
    if (mimetype && extname) {
      return cb(null, true);
    }
    cb(new Error('Ошибка: недопустимый тип файла!'));
  },
});

// Раздача статических файлов
app.use('/uploads', express.static(path.join(__dirname, '/uploads')));

// Миддлвары
if (process.env.NODE_ENV === 'development') app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.post('/uploads', upload1.array('img', 10), async (req, res) => {
  try {
    console.log('Файлы, полученные multer:', req.files);

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: 'Файлы не загружены' });
    }

    const filePaths = [];

    for (const file of req.files) {
      // Определяем расширение файла
      const ext = path.extname(file.originalname).toLowerCase();

      // Если это не GIF, конвертируем изображение в формат WebP
      if (ext !== '.gif') {
        const webpFilename = `${Date.now()}-${file.originalname.split('.')[0]}.webp`;
        const webpFilePath = path.join('uploads', webpFilename);

        // Конвертируем изображение в формат WebP с использованием sharp
        await sharp(file.buffer)
          .webp({ quality: 80 }) // Настройка качества WebP
          .toFile(webpFilePath);

        filePaths.push(`/uploads/${webpFilename}`);
      }
    }

    console.log('Сохранённые пути:', filePaths);

    res.status(200).json({ filePaths });
  } catch (error) {
    console.error('Ошибка при загрузке файлов:', error);
    res.status(500).json({ message: 'Ошибка при загрузке файлов', error });
  }
});

// Маршрут для загрузки XML
app.post('/api/upload-xml', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Файл не загружен' });
    }

    const filePath = path.join(__dirname, 'uploads', req.file.filename);

    // Чтение файла
    const xmlContent = fs.readFileSync(filePath, 'utf-8');
    const parser = new xml2js.Parser({ explicitArray: false });
    const parsedData = await parser.parseStringPromise(xmlContent);

    console.log('Обработанный XML:', JSON.stringify(parsedData, null, 2));

    // Валидация структуры XML
    if (!parsedData?.yml_catalog?.shop) {
      throw new Error('Неверная структура XML. Ожидается элемент "shop".');
    }

    const shopData = parsedData.yml_catalog.shop;

    // Сохранение данных в базу
    await saveDataToDatabase(shopData);

    res.status(200).json({ message: 'XML успешно обработан', data: shopData });
  } catch (error) {
    console.error('Ошибка обработки XML:', error);
    res
      .status(500)
      .json({ message: 'Ошибка обработки XML', error: error.message });
  }
});

// Функция сохранения данных в базу Prisma
const saveDataToDatabase = async (shop) => {
  // Сохранение категорий
  if (shop.categories?.category) {
    const categories = Array.isArray(shop.categories.category)
      ? shop.categories.category
      : [shop.categories.category];

    for (const category of categories) {
      const categoryId = parseInt(category.$.id, 10);
      if (isNaN(categoryId)) {
        console.warn(`Пропущена категория с некорректным id: ${category.$.id}`);
        continue;
      }

      await prisma.category.upsert({
        where: { id: categoryId },
        update: { title: category._ },
        create: { id: categoryId, title: category._ },
      });
    }
  } else {
    console.warn('Категории не найдены в XML.');
  }

  // Сохранение товаров
  if (shop.offers?.offer) {
    const offers = Array.isArray(shop.offers.offer)
      ? shop.offers.offer
      : [shop.offers.offer];

    for (const offer of offers) {
      const categoryId = parseInt(offer.categoryId, 10);
      if (isNaN(categoryId)) {
        console.warn(
          `Пропущен товар с некорректным categoryId: ${offer.categoryId}`
        );
        continue;
      }

      try {
        // Поиск товара в базе с таким же названием, ценой и categoryId
        const existingProduct = await prisma.product.findFirst({
          where: {
            name: offer.model,
            price: parseFloat(offer.price) || 0,
            categoryId,
          },
        });

        if (existingProduct) {
          console.log(`Товар "${offer.model}" уже существует. Пропускаем.`);
          continue; // Пропускаем добавление товара, если он уже существует
        }

        // Сохранение нового товара
        const product = await prisma.product.create({
          data: {
            name: offer.model,
            price: parseFloat(offer.price) || 0,
            description: offer.description || null,
            categoryId,
            img: Array.isArray(offer.picture) ? offer.picture : [offer.picture],
          },
        });

        // Сохранение характеристик для товара
        if (offer.param) {
          const params = Array.isArray(offer.param)
            ? offer.param
            : [offer.param];

          const characteristicPromises = params.map((param) => {
            const characteristicName = param.$?.name || ''; // Извлечение названия
            const characteristicValue = param._ || ''; // Извлечение значения

            // Проверка на наличие значения
            if (!characteristicName || !characteristicValue) {
              console.warn(
                'Пропущены название или значение характеристики:',
                param
              );
              return;
            }

            return prisma.productCharacteristic.create({
              data: {
                productId: product.id,
                name: characteristicName, // Название характеристики
                value: characteristicValue, // Значение характеристики
              },
            });
          });

          await Promise.all(characteristicPromises); // Параллельное выполнение запросов
        }
      } catch (error) {
        console.error(`Ошибка при сохранении товара "${offer.model}":`, error);
      }
    }
  } else {
    console.warn('Товары не найдены в XML.');
  }
};

// Продукты
// app.use('/api/products', productRoutes);

// Остальные маршруты
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/forms', formsRoutes);
// app.use('/api/subCategories', subCategoryRoutes);
app.use('/api/news', newsRoutes);
app.use('/api/typeSupports', typeSupportRoutes);
app.use('/api/tagsSupports', tagsSupportRoutes);
app.use('/api/centers', centerRoutes);
app.use('/api/services', serviceRoutes);
app.use('/api/supports', supportRoutes);
app.use('/api/maps', mapRoutes);
app.use('/api/bids', bidRoutes);

// Обработка ошибок
app.use(notFound);
app.use(errorHandler);

// Запуск сервера
const PORT = process.env.PORT || 443;


app.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});
