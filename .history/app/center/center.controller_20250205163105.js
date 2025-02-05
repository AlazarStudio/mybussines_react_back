import asyncHandler from 'express-async-handler';
import { prisma } from '../prisma.js';

// @desc    Get centers with pagination, sorting, and filtering
// @route   GET /api/centers
// @access  Private
export const getCenters = asyncHandler(async (req, res) => {
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

  const totalCenters = await prisma.center.count({ where });

  const centers = await prisma.center.findMany({
    where,
    skip: rangeStart,
    take: Math.min(rangeEnd - rangeStart + 1, totalCenters),
    orderBy: { [sortField]: sortOrder },
    include: { service: true }, // Загружаем связанный service
  });

  res.set(
    'Content-Range',
    `centers ${rangeStart}-${Math.min(rangeEnd, totalCenters - 1)}/${totalCenters}`
  );
  res.json(centers);
});

// @desc    Get single center by ID
// @route   GET /api/centers/:id
// @access  Private
export const getOneCenter = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const center = await prisma.center.findUnique({
    where: { id: parseInt(id, 10) },
    include: { service: true }, // Загружаем связанный service
  });

  if (!center) {
    res.status(404).json({ error: 'Center not found!' });
    return;
  }

  res.json(center);
});

// @desc    Create new center
// @route   POST /api/centers
// @access  Private
export const createNewCenter = asyncHandler(async (req, res) => {
  const { title, serviceId } = req.body;

  if (!title) {
    res.status(400).json({ error: 'Title is required' });
    return;
  }

  const center = await prisma.center.create({
    data: {
      title,
      serviceId: serviceId || null, // Устанавливаем связь с сервисом, если передано
    },
  });

  res.status(201).json(center);
});

// @desc    Update center
// @route   PUT /api/centers/:id
// @access  Private
export const updateCenter = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { title, serviceId } = req.body;

  try {
    const existingCenter = await prisma.center.findUnique({
      where: { id: parseInt(id, 10) },
    });

    if (!existingCenter) {
      res.status(404).json({ error: 'Center not found!' });
      return;
    }

    const updatedCenter = await prisma.center.update({
      where: { id: parseInt(id, 10) },
      data: {
        title: title ?? existingCenter.title,
        serviceId: serviceId ?? existingCenter.serviceId, // Обновляем связь с сервисом
      },
    });

    res.json(updatedCenter);
  } catch (error) {
    console.error('Error updating center:', error);
    res.status(500).json({ error: 'Error updating center' });
  }
});

// @desc    Delete center
// @route   DELETE /api/centers/:id
// @access  Private
export const deleteCenter = asyncHandler(async (req, res) => {
  const { id } = req.params;

  try {
    await prisma.center.delete({
      where: { id: parseInt(id, 10) },
    });

    res.json({ message: 'Center deleted successfully!' });
  } catch (error) {
    console.error('Error deleting center:', error);
    res.status(404).json({ error: 'Center not found!' });
  }
});
