import asyncHandler from 'express-async-handler';
import { prisma } from '../prisma.js';

// @desc    Get TypeSupports with pagination, sorting, and filtering
// @route   GET /api/type-supports
// @access  Private
export const getTypeSupports = asyncHandler(async (req, res) => {
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

  const totalCount = await prisma.typeSupport.count({ where });

  const typeSupports = await prisma.typeSupport.findMany({
    where,
    skip: rangeStart,
    take: Math.min(rangeEnd - rangeStart + 1, totalCount),
    orderBy: { [sortField]: sortOrder },
  });

  res.set(
    'Content-Range',
    `typeSupports ${rangeStart}-${Math.min(rangeEnd, totalCount - 1)}/${totalCount}`
  );
  res.json(typeSupports);
});

// @desc    Get single TypeSupport by ID
// @route   GET /api/type-supports/:id
// @access  Private
export const getOneTypeSupport = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const typeSupport = await prisma.typeSupport.findUnique({
    where: { id: parseInt(id, 10) },
    include: { supports: true }, // Загружаем связанные записи
  });

  if (!typeSupport) {
    res.status(404).json({ error: 'TypeSupport not found!' });
    return;
  }

  res.json(typeSupport);
});

// @desc    Create new TypeSupport
// @route   POST /api/type-supports
// @access  Private
export const createTypeSupport = asyncHandler(async (req, res) => {
  const { title } = req.body;

  if (!title) {
    res.status(400).json({ error: 'Title is required' });
    return;
  }

  const typeSupport = await prisma.typeSupport.create({
    data: { title },
  });

  res.status(201).json(typeSupport);
});

// @desc    Update TypeSupport
// @route   PUT /api/type-supports/:id
// @access  Private
export const updateTypeSupport = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { title } = req.body;

  try {
    const existingTypeSupport = await prisma.typeSupport.findUnique({
      where: { id: parseInt(id, 10) },
    });

    if (!existingTypeSupport) {
      res.status(404).json({ error: 'TypeSupport not found!' });
      return;
    }

    const updatedTypeSupport = await prisma.typeSupport.update({
      where: { id: parseInt(id, 10) },
      data: { title: title ?? existingTypeSupport.title },
    });

    res.json(updatedTypeSupport);
  } catch (error) {
    console.error('Error updating TypeSupport:', error);
    res.status(500).json({ error: 'Error updating TypeSupport' });
  }
});

// @desc    Delete TypeSupport
// @route   DELETE /api/type-supports/:id
// @access  Private
export const deleteTypeSupport = asyncHandler(async (req, res) => {
  const { id } = req.params;

  try {
    await prisma.typeSupport.delete({
      where: { id: parseInt(id, 10) },
    });

    res.json({ message: 'TypeSupport deleted successfully!' });
  } catch (error) {
    console.error('Error deleting TypeSupport:', error);
    res.status(404).json({ error: 'TypeSupport not found!' });
  }
});
