import asyncHandler from 'express-async-handler';
import { prisma } from '../prisma.js';

// @desc    Get TagsSupport with pagination, sorting, and filtering
// @route   GET /api/tags-support
// @access  Private
export const getTagsSupports = asyncHandler(async (req, res) => {
  const { range, sort, filter } = req.query;

  const rangeStart = range ? JSON.parse(range)[0] : 0;
  const rangeEnd = range ? JSON.parse(range)[1] : rangeStart + 10; // Ограничение на количество записей

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

  const totalCount = await prisma.tagsSupport.count({ where });

  const tagsSupports = await prisma.tagsSupport.findMany({
    where,
    skip: rangeStart,
    take: Math.min(rangeEnd - rangeStart + 1, totalCount),
    orderBy: { [sortField]: sortOrder },
  });

  res.set(
    'Content-Range',
    `tagsSupports ${rangeStart}-${Math.min(rangeEnd, totalCount - 1)}/${totalCount}`
  );
  res.json(tagsSupports);
});

// @desc    Get single TagsSupport by ID
// @route   GET /api/tags-support/:id
// @access  Private
export const getOneTagsSupport = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const tagsSupport = await prisma.tagsSupport.findUnique({
    where: { id: parseInt(id, 10) },
    include: { supports: true }, // Загружаем связанные записи
  });

  if (!tagsSupport) {
    res.status(404).json({ error: 'TagsSupport not found!' });
    return;
  }

  res.json(tagsSupport);
});

// @desc    Create new TagsSupport
// @route   POST /api/tags-support
// @access  Private
export const createTagsSupport = asyncHandler(async (req, res) => {
  const { title } = req.body;

  if (!title) {
    res.status(400).json({ error: 'Title is required' });
    return;
  }

  const tagsSupport = await prisma.tagsSupport.create({
    data: { title },
  });

  res.status(201).json(tagsSupport);
});

// @desc    Update TagsSupport
// @route   PUT /api/tags-support/:id
// @access  Private
export const updateTagsSupport = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { title } = req.body;

  try {
    const existingTagsSupport = await prisma.tagsSupport.findUnique({
      where: { id: parseInt(id, 10) },
    });

    if (!existingTagsSupport) {
      res.status(404).json({ error: 'TagsSupport not found!' });
      return;
    }

    const updatedTagsSupport = await prisma.tagsSupport.update({
      where: { id: parseInt(id, 10) },
      data: { title: title ?? existingTagsSupport.title },
    });

    res.json(updatedTagsSupport);
  } catch (error) {
    console.error('Error updating TagsSupport:', error);
    res.status(500).json({ error: 'Error updating TagsSupport' });
  }
});

// @desc    Delete TagsSupport
// @route   DELETE /api/tags-support/:id
// @access  Private
export const deleteTagsSupport = asyncHandler(async (req, res) => {
  const { id } = req.params;

  try {
    await prisma.tagsSupport.delete({
      where: { id: parseInt(id, 10) },
    });

    res.json({ message: 'TagsSupport deleted successfully!' });
  } catch (error) {
    console.error('Error deleting TagsSupport:', error);
    res.status(404).json({ error: 'TagsSupport not found!' });
  }
});
