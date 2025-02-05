import asyncHandler from 'express-async-handler';
import { prisma } from '../prisma.js';

// @desc    Get categories with pagination, sorting, and filtering
// @route   GET /api/categories
// @access  Private
export const getNews = asyncHandler(async (req, res) => {
  const { range, sort, filter } = req.query;

  const rangeStart = range ? JSON.parse(range)[0] : 0;
  const rangeEnd = range ? JSON.parse(range)[1] : 100;

  const sortField = sort ? JSON.parse(sort)[0] : 'createdAt';
  const sortOrder = sort ? JSON.parse(sort)[1].toLowerCase() : 'desc';

  const filters = filter ? JSON.parse(filter) : {};

  // Формирование объекта where для Prisma
  const where = Object.keys(filters).reduce((acc, field) => {
    const value = filters[field];
    if (Array.isArray(value)) {
      acc[field] = { in: value }; // Если значение массив, используем `in`
    } else if (typeof value === 'string') {
      acc[field] = { contains: value, mode: 'insensitive' }; // Частичное совпадение
    } else {
      acc[field] = { equals: value }; // Для одиночного значения
    }
    return acc;
  }, {});

  // Общий подсчет новостей
  const totalNews = await prisma.news.count({ where });

  const news = await prisma.news.findMany({
    where,
    skip: rangeStart,
    take: rangeEnd - rangeStart + 1,
    orderBy: { [sortField]: sortOrder },
  });

  // Установка заголовка Content-Range для поддержки пагинации
  res.set(
    'Content-Range',
    `categories ${rangeStart}-${Math.min(rangeEnd, totalNews - 1)}/${totalNews}`
  );
  res.json(news);
});

// @desc    Get single category by ID
// @route   GET /api/categories/:id
// @access  Private
export const getOneNews = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const news = await prisma.news.findUnique({
    where: { id: parseInt(id, 10) },
  });

  if (!news) {
    res.status(404).json({ error: 'Category not found!' });
    return;
  }

  res.json(news);
});

// @desc    Create new category
// @route   POST /api/categories
// @access  Private
export const createNewNews = asyncHandler(async (req, res) => {
  const { title, img, date, description } = req.body;

  const images = img.map((image) =>
    typeof image === 'object' ? `/uploads/${image.rawFile.path}` : image
  );

  console.log('123', images);

  if (!title || !img) {
    res.status(400).json({ error: 'Title and img are required' });
    return;
  }

  const news = await prisma.news.create({
    data: {
      title,
      img: images,
      date,
      description,
    },
  });

  res.status(201).json(news);
});

// @desc    Update category
// @route   PUT /api/categories/:id
// @access  Private
export const updateNews = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { title, img, date, description } = req.body;

  try {
    const updatedNews = await prisma.news.update({
      where: { id: parseInt(id, 10) },
      data: {
        title,
        img,
        date,
        description,
      },
    });

    res.json(updatedNews);
  } catch (error) {
    console.error('Error updating news:', error);
    res.status(404).json({ error: 'News not found!' });
  }
});

// @desc    Delete category
// @route   DELETE /api/categories/:id
// @access  Private
export const deleteNews = asyncHandler(async (req, res) => {
  const { id } = req.params;

  try {
    await prisma.news.delete({
      where: { id: parseInt(id, 10) },
    });

    res.json({ message: 'News deleted successfully!' });
  } catch (error) {
    console.error('Error deleting news:', error);
    res.status(404).json({ error: 'News not found!' });
  }
});
