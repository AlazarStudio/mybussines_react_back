import asyncHandler from 'express-async-handler';
import { prisma } from '../prisma.js';

// @desc    Get news with pagination, sorting, and filtering
// @route   GET /api/news
// @access  Private
export const getNews = asyncHandler(async (req, res) => {
  const { range, sort, filter } = req.query;

  const rangeStart = range ? JSON.parse(range)[0] : 0;
  const rangeEnd = range ? JSON.parse(range)[1] : rangeStart + 10; // Безопасное ограничение

  const sortField = sort ? JSON.parse(sort)[0] : 'createdAt';
  const sortOrder = sort ? JSON.parse(sort)[1].toLowerCase() : 'desc';

  const filters = filter ? JSON.parse(filter) : {};

  const where = Object.keys(filters).reduce((acc, field) => {
    const value = filters[field];
    if (Array.isArray(value)) {
      acc[field] = { in: value };
    } else if (typeof value === 'string') {
      acc[field] = { contains: value, mode: 'insensitive' };
    } else {
      acc[field] = { equals: value };
    }
    return acc;
  }, {});

  const totalNews = await prisma.news.count({ where });

  const news = await prisma.news.findMany({
    where,
    skip: rangeStart,
    take: Math.min(rangeEnd - rangeStart + 1, totalNews), // Безопасное ограничение
    orderBy: { [sortField]: sortOrder },
  });

  res.set(
    'Content-Range',
    `news ${rangeStart}-${Math.min(rangeEnd, totalNews - 1)}/${totalNews}`
  );
  res.json(news);
});

// @desc    Get single news by ID
// @route   GET /api/news/:id
// @access  Private
export const getOneNews = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const news = await prisma.news.findUnique({
    where: { id: parseInt(id, 10) },
  });

  if (!news) {
    res.status(404).json({ error: 'News not found!' });
    return;
  }

  res.json(news);
});

// @desc    Create new news
// @route   POST /api/news
// @access  Private
export const createNewNews = asyncHandler(async (req, res) => {
  const { title, img, date, description } = req.body;

  if (!title || !img || !Array.isArray(img)) {
    res.status(400).json({ error: 'Title and img (array) are required' });
    return;
  }

  const images = img.map((image) =>
    typeof image === 'object' && image.rawFile?.path
      ? `/uploads/${image.rawFile.path}`
      : image
  );

  const news = await prisma.news.create({
    data: {
      title,
      img: images,
      date: new Date(date), // Приведение к `Date`
      description,
    },
  });

  res.status(201).json(news);
});

// @desc    Update news
// @route   PUT /api/news/:id
// @access  Private
export const updateNews = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { title, img, date, description } = req.body;

  try {
    const existingNews = await prisma.news.findUnique({
      where: { id: parseInt(id, 10) },
    });

    if (!existingNews) {
      res.status(404).json({ error: 'News not found!' });
      return;
    }

    // const updatedNews = await prisma.news.update({
    //   where: { id: parseInt(id, 10) },
    //   data: {
    //     title: title ?? existingNews.title,
    //     img: Array.isArray(img) ? img : existingNews.img,
    //     date: date ? new Date(date) : existingNews.date,
    //     description: description ?? existingNews.description,
    //   },
    // });

    res.json(updatedNews);
  } catch (error) {
    console.error('Error updating news:', error);
    res.status(500).json({ error: 'Error updating news' });
  }
});

// @desc    Delete news
// @route   DELETE /api/news/:id
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
